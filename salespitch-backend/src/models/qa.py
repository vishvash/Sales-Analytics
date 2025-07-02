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

def get_qns_ans(file_path: str) -> dict:
    API_KEY = "AIzaSyCQSG1AhItY1DXH0GkFgYMZ72xnjZNVwPg"
    if not file_path.lower().endswith('.wav'):
      wav_path = "converted_audio.wav"
      subprocess.run(['ffmpeg', '-y', '-i', file_path, wav_path], check=True)
      file_path = wav_path

    chunk_length_ms = 3 * 60 * 1000  # 3 minutes in milliseconds
    output_folder = "audio_chunks"
    final_output_file = "full_transcript.txt"

    os.makedirs(output_folder, exist_ok=True)

    audio = AudioSegment.from_file(file_path)
    total_length_ms = len(audio)
    total_length_min = total_length_ms / 60000
    total_length_min = round(total_length_min, 2)
    print("audio length", total_length_min)
    total_chunks = math.ceil(total_length_ms / chunk_length_ms)

    chunk_paths = []
    for i in range(total_chunks):
        start = i * chunk_length_ms
        end = min((i+1) * chunk_length_ms, total_length_ms)
        chunk = audio[start:end]
        chunk_path = os.path.join(output_folder, f"chunk_{i+1}.wav")
        chunk.export(chunk_path, format="wav")
        chunk_paths.append(chunk_path)

    all_qa_texts = []
    all_transcripts = []

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}"
    
    headers = {
    "Content-Type": "application/json"
    }

    for i, path in enumerate(chunk_paths):
        # print(f"\n🔹 Processing chunk {i+1}/{total_chunks}")

        # Read and encode audio chunk
        with open(path, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode("utf-8")

        # Transcription payload
        transcribe_payload = {
            "contents": [
                {
                    "parts": [
                        {"text": "Transcribe and translate the following audio into English, regardless of the spoken language. Return only the plain English text without any speaker labels or formatting."},
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

        res = requests.post(url, headers=headers, json=transcribe_payload)
        if res.status_code != 200:
            # print(f" Transcription failed for chunk {i+1}: {res.status_code} - {res.text}")
            continue

        transcript = res.json()['candidates'][0]['content']['parts'][0]['text']
        all_transcripts.append(transcript)  # <--- Add transcript to list
        # print(f"  Transcription received for chunk {i+1}")

        # Prepare Q&A prompt
        qa_payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"""Convert the following sales conversation transcript into a structured dialogue with speaker identification.
Use '[Counsellor]:' for the career counsellor and '[Student]:' for the prospective student.
Ensure all lines are labeled correctly based on the speaking style and context. Keep the sequence intact.

    Transcript:
    {transcript}
    """
                        }
                    ]
                }
            ]
        }

        qa_res = requests.post(url, headers=headers, json=qa_payload)
        if qa_res.status_code != 200:
            # print(f" Q&A formatting failed for chunk {i+1}: {qa_res.status_code} - {qa_res.text}")
            continue

        qa_text = qa_res.json()['candidates'][0]['content']['parts'][0]['text']
        all_qa_texts.append(f"--- Q&A from Chunk {i+1} ---\n{qa_text}\n")
        

    # ========== SAVE ALL Q&A ==========
    if all_qa_texts:
        final_qa = "\n\n".join(all_qa_texts)
        with open(final_output_file, "w", encoding="utf-8") as f:
            f.write(final_qa)
        
    else:
        print("No Q&A was generated.")

    if all_qa_texts:
          final_qa = "\n\n".join(all_qa_texts)
          with open(final_output_file, "w", encoding="utf-8") as f:
              f.write(final_qa)
          
    else:
        print("No Q&A was generated.")
        final_qa = ""

    return final_qa, total_length_min