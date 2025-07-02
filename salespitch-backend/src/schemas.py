from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime


class AudioFileCreate(BaseModel):
    file_name: str

class AudioFileOut(BaseModel):
    id: int
    file_name: str
    uploaded_at: datetime
    processing_time: Optional[float]
    result_data: Any
    list_qna_ans: Optional[str] # For potentially large text data
    pauses: Optional[str]       # For string summaries of pauses
    speaking_rate_and_tone: Optional[str] # For string summaries of rate and tone
    audio_length: Optional[float] # Add audio_length to output schema
    confidence_score: Optional[float]

    class Config:
        from_attributes = True

class SkillOut(BaseModel):
    id: int
    skillname: str
    class Config:
        orm_mode = True

class QuestionOut(BaseModel):
    id: int
    question: str
    skill_id: int
    class Config:
        orm_mode = True