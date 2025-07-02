import whisper
import subprocess
import torch
import wave
import contextlib
import numpy as np
from pyannote.audio import Audio
from pyannote.audio.pipelines.speaker_verification import PretrainedSpeakerEmbedding
from pyannote.core import Segment
from sklearn.cluster import AgglomerativeClustering
from sklearn.preprocessing import normalize
import pathlib
import textwrap
import os
import re
import json
import re
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import base64
import requests
import json
import subprocess
import math
from pydub import AudioSegment


import google.generativeai as genai

# from google.colab import userdata

from IPython.display import Markdown, display

from jinja2 import Template

# Modified get_qns_ans function with JSON-formatted final_qa and reduced redundancy
def get_qns_ans(file_path: str) -> dict:
    API_KEY = "AIzaSyCQSG1AhItY1DXH0GkFgYMZ72xnjZNVwPg"
    if not file_path.lower().endswith('.wav'):
        wav_path = "converted_audio.wav"
        subprocess.run(['ffmpeg', '-y', '-i', file_path, wav_path], check=True)
        file_path = wav_path

    chunk_length_ms = 3 * 60 * 1000
    output_folder = "audio_chunks"
    os.makedirs(output_folder, exist_ok=True)

    audio = AudioSegment.from_file(file_path)
    total_length_ms = len(audio)
    total_length_min = round(total_length_ms / 60000, 2)
    total_chunks = math.ceil(total_length_ms / chunk_length_ms)

    chunk_paths = []
    for i in range(total_chunks):
        start = i * chunk_length_ms
        end = min((i+1) * chunk_length_ms, total_length_ms)
        chunk = audio[start:end]
        chunk_path = os.path.join(output_folder, f"chunk_{i+1}.wav")
        chunk.export(chunk_path, format="wav")
        chunk_paths.append(chunk_path)

    structured_outputs = []

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}"
    headers = {"Content-Type": "application/json"}

    for i, path in enumerate(chunk_paths):
        with open(path, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode("utf-8")

        # Direct prompt: transcribe and analyze in one go
        prompt = '''
Transcribe, translate the following audio into English. Return only plain English text and analyze the following counselling call audio.
 
Speaker roles:
- [Counsellor]
- [Student]

Return output in JsonArray format with:
- "transcript": timestamped speaker dialogue
- "durations": time spoken by each speaker
- "question_analysis": number of questions from Student, how many answered by Counsellor, and flagged delays > 3s
- "student_demographics": name, age, location, education, course_interest, contact (if mentioned)
'''

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "audio/wav",
                                "data": audio_b64
                            }
                        }
                    ]
                }
            ]
        }

        res = requests.post(url, headers=headers, json=payload)
        if res.status_code != 200:
            continue

        try:
            response_text = res.json()['candidates'][0]['content']['parts'][0]['text']
            if response_text.strip().startswith("```json"):
                response_text = response_text.strip().removeprefix("```json").removesuffix("```").strip()
            json_output = json.loads(response_text)
            structured_outputs.append(json_output)
        except Exception as e:
            print(f"[get_qns_ans] Failed to parse cleaned JSON in chunk {i+1}: {e}")
            print("[get_qns_ans] Cleaned response text (start):", response_text[:300])

    final_qa = structured_outputs if structured_outputs else ""
    print(f"[get_qns_ans] structured_outputs: {structured_outputs}")
    print(f"[get_qns_ans] final_qa: {final_qa}")
    return final_qa, total_length_min
