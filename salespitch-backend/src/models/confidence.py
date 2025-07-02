import re

def calculate_confidence_from_qa(final_qa):
    # Step 1: Extract answers from Q&A text
    answers = re.findall(r'^A:\s*(.*)', final_qa, flags=re.MULTILINE)
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
    
