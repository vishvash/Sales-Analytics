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


import google.generativeai as genai

# from google.colab import userdata

from IPython.display import Markdown, display
from src.config import GOOGLE_API_KEY

# Load models once
# def _load_models(model_size="tiny"):
#     whisper_model = whisper.load_model(model_size)
#     embedding_model = PretrainedSpeakerEmbedding(
#         "speechbrain/spkrec-ecapa-voxceleb",
#         device=torch.device("cuda" if torch.cuda.is_available() else "cpu")
#     )
#     return whisper_model, embedding_model

# DEFAULT_MODEL_SIZE = "tiny"
# _whisper_model, _embedding_model = _load_models(DEFAULT_MODEL_SIZE)


def diarization(
    # file_path: str,
    # num_speakers: int = 2,
    # min_segment_duration: float = 0.5,
    # linkage: str = 'ward'
    list_qns_ans
) -> dict:
    """
    Speaker diarization using Whisper segments and clustering.

    Args:
        list_qns_ans: JSON (list or dict) from QA extraction, not a string

    Returns:
        {'diarization': ['SPEAKER 1: text', ...]}
    """
    # Ensure WAV format
    # if not file_path.lower().endswith('.wav'):
    #     wav_path = "converted_audio.wav"
    #     subprocess.run(['ffmpeg', '-y', '-i', file_path, wav_path], check=True)
    #     file_path = wav_path

    # Whisper transcription
    # transcription = _whisper_model.transcribe(file_path)
    # raw_segments = transcription.get('segments', [])

    # Filter out very short segments
    # segments = [seg for seg in raw_segments if seg['end'] - seg['start'] >= min_segment_duration]

    # Get audio duration
    # with contextlib.closing(wave.open(file_path,'rb')) as wf:
    #     duration = wf.getnframes() / wf.getframerate()

    # audio_helper = Audio(mono=True, sample_rate=16000)

    # def get_embedding(start: float, end: float) -> np.ndarray:
    #     clip = Segment(start, min(end, duration))
    #     waveform, _ = audio_helper.crop(file_path, clip)
    #     if waveform.ndim > 1:
    #         waveform = waveform.mean(dim=0, keepdim=True)
    #     inp = waveform.unsqueeze(0).to(_embedding_model.device)
    #     emb = _embedding_model(inp)
    #     if isinstance(emb, torch.Tensor):
    #         arr = emb.detach().cpu().numpy().squeeze()
    #     else:
    #         arr = np.array(emb).squeeze()
    #     return arr

    # Compute embeddings and normalize
    # embeddings = np.stack([get_embedding(s['start'], s['end']) for s in segments])
    # embeddings = normalize(embeddings, norm='l2')  

    # # Cluster speakers with chosen linkage
    # clustering = AgglomerativeClustering(n_clusters=num_speakers, linkage=linkage)
    # labels = clustering.fit_predict(embeddings)

    # Build diarization lines, merging adjacent same-speaker segments
    # diarization_lines = []
    # prev_speaker = None
    # buffer_text = []
    # for seg, lbl in zip(segments, labels):
    #     spk = f"SPEAKER {lbl+1}"
    #     text = seg.get('text','').strip()
    #     if spk != prev_speaker:
    #         if buffer_text:
    #             diarization_lines.append(f"{prev_speaker}: {' '.join(buffer_text)}")
    #         buffer_text = [text]
    #         prev_speaker = spk
    #     else:
    #         buffer_text.append(text)
    # if prev_speaker and buffer_text:
    #     diarization_lines.append(f"{prev_speaker}: {' '.join(buffer_text)}")

    # diarization_text = "\n".join(diarization_lines)

    
    def to_markdown(text):
        # text = text.replace('.', ' *')
        return Markdown(textwrap.indent(text, '> ', predicate = lambda _: True))
    
    os.environ['GOOGLE_API_KEY'] = GOOGLE_API_KEY
    genai.configure(api_key = os.environ['GOOGLE_API_KEY'])

    model_gem = genai.GenerativeModel('gemini-1.5-flash')

    # Convert list_qns_ans to a string if it's a list or dict
    if isinstance(list_qns_ans, (list, dict)):
        list_qns_ans_str = json.dumps(list_qns_ans, ensure_ascii=False)
    else:
        list_qns_ans_str = str(list_qns_ans)

    prompt_text = (
    list_qns_ans_str + 
    "\n\nEvaluate the sales pitch for clarity, confidence, product knowledge, structure, value delivery, objection handling, and rapport building. "
    "Give a rating out of 10. "
    "Output in JsonArray format with keys: rating, strengths, and areas_of_improvement. "
    "Each item in strengths and areas_of_improvement must include concept and remarks (reason)."
    )
    
    response = model_gem.generate_content(prompt_text)


    # response = to_markdown(response.text.strip())
    def parse_response_markdown(response_str):
    # Extract JSON block from Markdown-style string
        match = re.search(r'```json\n(.*?)\n```', response_str, re.DOTALL)
        if match:
            json_text = match.group(1)
            try:
                parsed_json = json.loads(json_text)
                return parsed_json
            except json.JSONDecodeError as e:
                print("Failed to parse JSON:", e)
                return {"error": "Invalid JSON format"}
        else:
            return {"error": "No JSON found in response"}
    
    text = parse_response_markdown(response.text.strip())

    print("Gemini evaluation :" ,text)
    # text = response.text  # the full Gemini evaluation
    # match = re.search(r'(\d+)/10', text)
    # rating = "N/A"
    # if match:
    #     rating = int(match.group(1))
    #     print(f"Extracted rating: {rating} out of 10")
    # else:
    #     print("No rating found.")


    
    return text