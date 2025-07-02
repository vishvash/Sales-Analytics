from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, nullable=False)
    interview_user_id = Column(Integer, ForeignKey('interview_users.id'), nullable=False)
    is_deleted = Column(Integer,nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processing_time = Column(Float, nullable=True)  # in seconds
    result_data = Column(JSON, nullable=True)
    list_qna_ans = Column(Text, nullable=True) # For potentially large text data
    pauses = Column(String, nullable=True) # For string summaries of pauses
    speaking_rate_and_tone = Column(String, nullable=True) # For string summaries of rate and tone
    audio_length = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)

class InterviewUser(Base):
    __tablename__ = 'interview_users'
    id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, nullable=False)
    is_deleted = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
