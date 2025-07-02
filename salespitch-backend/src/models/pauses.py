from pydub import AudioSegment, silence

def analyze_pauses(file_path: str) -> dict:
    try:
        # Load and preprocess audio only when function is called
        audio = AudioSegment.from_file(file_path).set_frame_rate(16000)
        audio = audio.normalize()

        # [Optional] Log dBFS to evaluate threshold effectiveness
        print(f"[DEBUG] Audio dBFS: {audio.dBFS}")
        # Detect silence (≥1s)
        silent_chunks = silence.detect_silence(
            audio,
            min_silence_len=800,               # 1 second = 1000 ms
            silence_thresh=audio.dBFS - 14
        )

        # Convert ms to seconds
        pause_durations = [(stop - start) / 1000 for start, stop in silent_chunks]
        total_pauses = len(pause_durations)
        long_pauses = [p for p in pause_durations if p >= 5.0]
        avg_pause = round(sum(pause_durations) / total_pauses, 2) if total_pauses else 0.0

        # Generate comment
        if total_pauses == 0:
            comment = "You hardly pause — consider adding brief breaks for emphasis."
        elif avg_pause < 0.8:
            comment = "Your pauses are quite brief — it’s energetic, but a bit more space can aid comprehension."
        elif avg_pause <= 2.0:
            comment = "Your pausing feels natural — it gives listeners time to absorb your points."
        else:
            comment = "You pause for quite a while — consider shortening longer silences to keep engagement."

        if len(long_pauses) > 2:
            comment += " Also, there are several very long pauses; tightening those can improve flow."

        # Return structured output
        return {
    "total_pauses": int(total_pauses),
    "long_pauses": int(len(long_pauses)),
    "average_pause_duration": float(avg_pause),
    "pause_comment": comment
}

    except Exception as e:
        return {
            "error": f"Pause analysis failed: {str(e)}"
        }
