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

from src.config import GOOGLE_API_KEY

# Modified get_qns_ans function with JSON-formatted final_qa and reduced redundancy
def get_qns_ans(file_path: str) -> dict:
    API_KEY = GOOGLE_API_KEY
    if not file_path.lower().endswith('.wav'):
        wav_path = "converted_audio.wav"
        subprocess.run(['ffmpeg', '-y', '-i', file_path, wav_path], check=True)
        file_path = wav_path

    chunk_length_ms = 60 * 60 * 1000
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

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={API_KEY}"
    headers = {"Content-Type": "application/json"}

    for i, path in enumerate(chunk_paths):
        with open(path, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode("utf-8")

        # Direct prompt: transcribe and analyze in one go
        prompt = '''
You are an advanced transcription and analysis assistant for counseling call recordings.

Your task is to:
1. **Transcribe and translate** all spoken content into fluent **English**, regardless of the original language (e.g., Tamil, Hindi, etc.).
   - Do not transliterate local words (e.g., "enna" → "what" not "enna").
   - Focus on **meaningful translation** using proper English expressions.
2. Identify and label speakers as:
   - [Counsellor]
   - [Student]
3. Include accurate **timestamps** for each speaker's dialogue.
4. Format the output as a **JSON array** with the following keys:

```json
{
  "transcript": [
    {
      "start_time": "00:00",
      "end_time": "00:04",
      "speaker": "Student",
      "text": "Can you explain the course structure?"
    },
    ...
  ],
  "durations": {
    "Counsellor": "MM:SS",
    "Student": "MM:SS"
  },
  "question_analysis": {
    "student_questions": 5,
    "answered_by_counsellor": 4,
    "delays_over_3s": [
      {
        "question_time": "00:40",
        "response_delay": "4.2s",
        "question": "What are the placement opportunities?",
        "response": "We have tie-ups with multiple companies..."
      },
      ...
    ]
  },
  "student_demographics": {
    "name": "Ravi Kumar",
    "age": 20,
    "location": "Chennai",
    "education": "B.Sc Computer Science",
    "course_interest": "Data Science",
    "contact": "9876543210"
  }
}
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
