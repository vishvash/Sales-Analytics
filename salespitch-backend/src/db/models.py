from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    skillname = Column(String(255), nullable=False, unique=True)

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    skill_id = Column(Integer, nullable=False)
    # ForeignKey constraint can be added if needed: ForeignKey('skills.id')

class AudioFile(Base):
    __tablename__ = "audio_files"
    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, nullable=False)
    interview_user_id = Column(Integer, nullable=True)
    is_deleted = Column(Integer, default=1)
    audio_length = Column(Float, nullable=True)
    # Add other columns as needed, e.g.:
    # result_data = Column(String, nullable=True)
    # processing_time = Column(Float, nullable=True)
    # list_qna_ans = Column(String, nullable=True)
    # pauses = Column(String, nullable=True)
    # speaking_rate_and_tone = Column(String, nullable=True)
    # uploaded_at = Column(DateTime(timezone=True), server_default=func.now())