import librosa
import numpy as np

# Caching to avoid reloading audio each time
class AudioCache:
    def __init__(self):
        self.cache = {}

    def get_audio(self, file_path):
        if file_path not in self.cache:
            y, sr = librosa.load(file_path, sr=None)  # Load with original sample rate
            self.cache[file_path] = (y, sr)
        return self.cache[file_path]

audio_cache = AudioCache()

def analyze_speaking_rate_and_tone_combined(file_path: str):
    # Get audio data from cache
    y, sr = audio_cache.get_audio(file_path)

    # Estimate speaking rate (tempo) and pitch
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    pitch = librosa.yin(y, fmin=50, fmax=300)
    avg_pitch = pitch.mean()

    # Map tempo to a descriptor
    tempo_val = tempo[0]  # Access the first element of the tempo array
    if tempo_val < 80:
        tempo_desc = "slow"
    elif tempo_val <= 120:
        tempo_desc = "moderate"
    else:
        tempo_desc = "fast"

    # Map pitch to a descriptor
    if avg_pitch < 120:
        pitch_desc = "low"
    elif avg_pitch <= 200:
        pitch_desc = "natural"
    else:
        pitch_desc = "high"

    # Combined comment logic based on both speaking rate and pitch
    if tempo_desc == "moderate" and pitch_desc == "natural":
        overall_comment = "You’re speaking at a clear, crisp pace — very engaging and easy to follow."
    elif tempo_desc == "slow" and pitch_desc in ("low", "natural"):
        overall_comment = "Your delivery is calm and measured — clear, though you could speed up slightly for more energy."
    elif tempo_desc == "fast" and pitch_desc in ("natural", "high"):
        overall_comment = "Your pace is energetic — just watch that it doesn’t become rushed."
    elif pitch_desc == "high":
        overall_comment = "Your pitch is quite high — try to lower it a bit for better clarity."
    else:
        overall_comment = "You’re on the right track — keep monitoring your pace and tone for optimal clarity."

    # Return the results as a dictionary
    return {
        "tempo_value": float(tempo_val),
        "tempo_description": tempo_desc,
        "average_pitch": float(avg_pitch),
        "pitch_description": pitch_desc,
        "overall_comment": overall_comment
    }
