import traceback
import whisper
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from src.models.diarisation import diarization
from src.models.pauses import analyze_pauses
from src.models.sr_tone import analyze_speaking_rate_and_tone_combined
from src.models.qa import get_qns_ans
from src.models.confidence import calculate_confidence_from_qa


import os

# Fix for symlink privilege error on Windows
os.environ["SPEECHBRAIN_LOCAL_CACHE"] = os.path.expanduser("~/.cache/speechbrain")
os.environ["SPEECHBRAIN_CACHE_STRATEGY"] = "copy"



_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = whisper.load_model("base", device="cuda" if whisper.torch.cuda.is_available() else "cpu")
    return _whisper_model


def transcribe_audio_file(file_path: str) -> dict:
    try:
        question_answer, total_length_min = get_qns_ans(file_path)
        diar = diarization(question_answer)
        pauses_result = analyze_pauses(file_path)
        sr_tone_result_combined = analyze_speaking_rate_and_tone_combined(file_path)
        confidence_result = calculate_confidence_from_qa(question_answer)
        # Return all results in a single dict
        return {
            "diarization": diar,
            "list_qna_ans": question_answer,
            "audio_length": total_length_min,
            "pauses": pauses_result,
            "speaking_rate_and_tone": sr_tone_result_combined,
            "confidence": confidence_result
        }
    except Exception as e:
        print("Internal Server Error:", str(e))
        traceback.print_exc()
        return {"error": "Internal server error. Please check the logs for details."}
