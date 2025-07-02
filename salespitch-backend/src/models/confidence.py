import re
import json

def calculate_confidence_from_qa(final_qa):
    # Accept final_qa as JSON (list or dict) or string
    if isinstance(final_qa, (list, dict)):
        qa_text = json.dumps(final_qa, ensure_ascii=False)
    else:
        qa_text = str(final_qa)
    # Step 1: Extract answers from Q&A text
    answers = re.findall(r'^A:\s*(.*)', qa_text, flags=re.MULTILINE)
    answer_text = ' '.join(answers).lower()

    # Step 2: Define filler and correction indicators
    filler_words = ['um', 'uh', 'like', 'you know', 'so', 'actually']
    correction_phrases = ['sorry', 'i mean', 'no wait', 'let me rephrase']

    # Step 3: Count occurrences
    filler_word_count = sum(answer_text.count(word) for word in filler_words)
    correction_count = sum(answer_text.count(phrase) for phrase in correction_phrases)

    # Step 4: Compute confidence score
    confidence_score = round(
        10 
        - (filler_word_count * 0.3)
        - (correction_count * 0.5), 2
    )

    # Step 5: Return results
    return confidence_score 
    
