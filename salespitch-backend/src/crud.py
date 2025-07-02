from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from src.db.models import Skill, Question  # Only Skill and Question are here
from src.model import InterviewUser, AudioFile  # InterviewUser and AudioFile are here
from . import schemas
import time
import json

async def create_audio_file(db: AsyncSession, file_name: str, interview_user_id=None) -> AudioFile:
    db_audio = AudioFile(file_name=file_name,is_deleted=1)
    if interview_user_id is not None:
        db_audio.interview_user_id = interview_user_id
    db.add(db_audio)
    await db.commit()
    await db.refresh(db_audio)
    return db_audio

async def update_audio_result(db: AsyncSession, audio_id: int, result_data: dict, processing_time: float, list_qna_ans: str = None, pauses: str = None, speaking_rate_and_tone: str = None, audio_length: float = None, confidence_score: float = None):
    # Allow saving if result_data is a dict (for new combined model output) or a list of dicts (for legacy Gemini output)
    is_valid = False
    if isinstance(result_data, list) and all(isinstance(item, dict) for item in result_data):
        is_valid = True
    elif isinstance(result_data, dict):
        is_valid = True
    if is_valid:
        result = await db.execute(select(AudioFile).where(AudioFile.id == audio_id))
        audio = result.scalar_one_or_none()
        if audio:
            audio.result_data = result_data
            audio.processing_time = processing_time
            if list_qna_ans is not None:
                audio.list_qna_ans = list_qna_ans
            if pauses is not None:
                if isinstance(pauses, dict):
                    audio.pauses = json.dumps(pauses)
                else:
                    audio.pauses = pauses
            if speaking_rate_and_tone is not None:
                if isinstance(speaking_rate_and_tone, dict):
                    audio.speaking_rate_and_tone = json.dumps(speaking_rate_and_tone)
                else:
                    audio.speaking_rate_and_tone = speaking_rate_and_tone
            print("audio length in 44", audio_length)        
            if audio_length is not None:
                audio.audio_length = audio_length
            if confidence_score is not None:
                audio.confidence_score = confidence_score
            await db.commit()
            await db.refresh(audio)
        return audio
    else:
        # Optionally, log or handle the error here
        print(f"[update_audio_result] Skipped saving invalid result_data: {result_data}")
        return None

async def get_all_audio_files(db: AsyncSession, from_date: str = None, to_date: str = None):
    print('before')
    query = select(AudioFile, InterviewUser).join(InterviewUser, AudioFile.interview_user_id == InterviewUser.id).where(
        and_(
            AudioFile.is_deleted == 1,
            InterviewUser.is_deleted == 1
        )
    )
    if from_date or to_date:
        from datetime import datetime, timedelta
        try:
            if from_date:
                from_date_obj = datetime.strptime(from_date, "%Y-%m-%d")
                query = query.where(AudioFile.uploaded_at >= from_date_obj)
            if to_date:
                to_date_obj = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
                query = query.where(AudioFile.uploaded_at < to_date_obj)
        except Exception as e:
            print(f"Invalid date format: {e}")
    result = await db.execute(query)
    print('after')
    # Return a list of dicts merging audio and selected user fields
    return [
        {
            **{k: getattr(audio, k) for k in audio.__table__.columns.keys()},
            'username': user.user_name,
            'is_deleted': user.is_deleted,
            'created_at': user.created_at
        }
        for audio, user in result.all()
    ]

async def get_all_interview_users(db: AsyncSession):
    result = await db.execute(select(InterviewUser).where(InterviewUser.is_deleted == 1))
    return result.scalars().all()

async def check_interview_user_exists(db: AsyncSession, username: str):
    result = await db.execute(select(InterviewUser).where(InterviewUser.user_name == username))
    return result.scalars().first() is not None

async def create_interview_user(db: AsyncSession, username: str, is_deleted: int = 1):
    new_user = InterviewUser(user_name=username, is_deleted=is_deleted)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def get_all_skills(db: AsyncSession):
    result = await db.execute(select(Skill))
    return result.scalars().all()

async def get_questions_by_skill(db: AsyncSession, skill_id: int):
    result = await db.execute(select(Question).where(Question.skill_id == skill_id))
    return result.scalars().all()

async def insert_audio_file_detail(db: AsyncSession, audio_url: str, audio_file_name: str, duration: float, questionid: int, userid: int):
    await db.execute(
        """
        INSERT INTO audio_files_details (audio_url, audio_file_name, duration, questionid, userid)
        VALUES (:audio_url, :audio_file_name, :duration, :questionid, :userid)
        """,
        {
            "audio_url": audio_url,
            "audio_file_name": audio_file_name,
            "duration": duration,
            "questionid": questionid,
            "userid": userid
        }
    )
    await db.commit()