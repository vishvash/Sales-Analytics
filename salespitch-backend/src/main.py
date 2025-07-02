import os
import time
import tempfile
import asyncio
import uuid
from fastapi import FastAPI, UploadFile, File, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from src.db.models import Base  # Only Base is needed here
from src.db.session import engine
from src.routers import auth



from sqlalchemy.orm import Session
from src import schemas, crud  # Remove models import, use only schemas and crud
from src.database import get_db
from typing import List
from src.models.model import transcribe_audio_file
import boto3
from botocore.exceptions import NoCredentialsError

# Initialize the database
# Base.metadata.create_all(bind=engine)

# Dependency to get DB session
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# Initialize FastAPI app
app = FastAPI()  # Use default docs_url ('/docs')
print('in main')
# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],  # Add your frontend port here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
@app.post("/upload")
async def upload_audio(
    file: UploadFile = File(...),
    userId: str = Form(...),
    userName: str = Form(...),
    isExistingUser: bool = Form(...),
    db = Depends(get_db)
):
    tmp_path = None
    print('in upload audio')
    print(f'userId: {userId}, userName: {userName}, isExistingUser: {isExistingUser}')
    # Read file contents
    contents = await file.read()
    if not contents:
        return {"error": "Empty file uploaded"}

    # Check for duplicate username if not existing user
    if not isExistingUser:
        try:
            user_exists = await crud.check_interview_user_exists(db, userName)
            if user_exists:
                return {"error": "Username already exists. Please choose a different username."}
        except Exception as e:
            return {"error": f"Failed to check username: {str(e)}"}

    # Validate file type
    original_ext = os.path.splitext(file.filename)[1].lower()
    if original_ext not in (".ogg", ".mp3", ".m4a", ".aac"):
        return {"error": "Only .ogg, .mp3, .m4a and .aac files are supported"}

    # Save file temporarily
    fd, tmp_path = tempfile.mkstemp(suffix=original_ext)
    os.close(fd)
    with open(tmp_path, "wb") as f:
        f.write(contents)


    try:
        # Insert new interview user if not existing user
        print('in 79 isExistingUser: ',isExistingUser)
        if not isExistingUser:
            try:
                new_user = await crud.create_interview_user(db, userName)
                userId = new_user.id
            except Exception as e:
                return {"error": f"Failed to create interview user: {str(e)}"}
        print('in 86,', userId)
        # Parse userId to integer if possible
        try:
            userId = int(userId)
        except (ValueError, TypeError):
            userId = None
        # Save file metadata to DB, passing interview_user_id if available
        db_audio = await crud.create_audio_file(db=db, file_name=file.filename, interview_user_id=userId)
        # Run transcription model and time it
        start_time = time.time()
        transcript = transcribe_audio_file(tmp_path)
        end_time = time.time()

        processing_time = round(end_time - start_time, 2)
        # Extract individual fields from transcript dict
        result_data = transcript.get("diarization")
        list_qna_ans = transcript.get("list_qna_ans")
        pauses = transcript.get("pauses")
        speaking_rate_and_tone = transcript.get("speaking_rate_and_tone")
        audio_length = transcript.get("audio_length")
        confidence_score = transcript.get("confidence")
        # Update DB with results
        updated_audio = await crud.update_audio_result(
            db=db,
            audio_id=db_audio.id,
            result_data=result_data,
            processing_time=processing_time,
            list_qna_ans=list_qna_ans,
            pauses=pauses,
            speaking_rate_and_tone=speaking_rate_and_tone,
            audio_length=audio_length,
            confidence_score=confidence_score
        )
        print('in Updated audio:', updated_audio)
        # Fetch all records after update
        all_audios = await crud.get_all_audio_files(db=db)
        # Convert to JSON serializable format
        return [schemas.AudioFileOut.from_orm(audio).__dict__ for audio in all_audios]
    except asyncio.CancelledError:
        print('Request was cancelled by the client.')
        return {"error": "Request was cancelled by the client."}
    except Exception as e:
        return {"error": str(e)}

    finally:
        # Clean up temporary file
        if tmp_path and os.path.exists(tmp_path): 
            os.remove(tmp_path)

@app.get("/getAllAudioFileDetails")
async def get_audio_file_details(from_date: str = None, to_date: str = None, db = Depends(get_db)):
    all_audios = await crud.get_all_audio_files(db=db, from_date=from_date, to_date=to_date)
    return all_audios   

@app.get("/getAllInterviewUserDetails")
async def get_interview_user_details(db = Depends(get_db)):
    users = await crud.get_all_interview_users(db=db)
    return users

@app.get("/skills", response_model=List[schemas.SkillOut])
async def get_skills(db=Depends(get_db)):
    return await crud.get_all_skills(db)

@app.get("/questions", response_model=List[schemas.QuestionOut])
async def get_questions(skill_id: int, db=Depends(get_db)):
    return await crud.get_questions_by_skill(db, skill_id)

def upload_file_to_s3(file_obj, filename, bucket, aws_access_key, aws_secret_key, region):
    s3 = boto3.client(
        's3',
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=region
    )
    try:
        s3.upload_fileobj(file_obj, bucket, filename, ExtraArgs={'ACL': 'public-read', 'ContentType': file_obj.content_type})
        url = f"https://{bucket}.s3.{region}.amazonaws.com/{filename}"
        return url
    except NoCredentialsError:
        return None

@app.post("/uploadResponse")
async def upload_response(
    durations: List[float] = Form(...),
    questionids: List[int] = Form(...),
    userid: int = Form(...),
    files: List[UploadFile] = File(...),
    db = Depends(get_db)
):
    AWS_ACCESS_KEY = 'YOUR_AWS_ACCESS_KEY'
    AWS_SECRET_KEY = 'YOUR_AWS_SECRET_KEY'
    AWS_BUCKET = 'YOUR_BUCKET_NAME'
    AWS_REGION = 'YOUR_REGION'

    results = []
    for file, duration, questionid in zip(files, durations, questionids):
        ext = os.path.splitext(file.filename)[1] or '.webm'
        random_filename = f"audio_{uuid.uuid4().hex}{ext}"
        print('random file name', random_filename)
        print('in 186', file.file)
        s3_url = upload_file_to_s3(file.file, random_filename, AWS_BUCKET, AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION)
        if not s3_url:
            results.append({"error": f"Failed to upload {file.filename} to S3."})
            continue
        await crud.insert_audio_file_detail(db, s3_url, random_filename, duration, questionid, userid)
        results.append({"audio_url": s3_url, "audio_file_name": random_filename, "questionid": questionid})
    return {"message": "Audio responses processed.", "results": results}


app.include_router(auth.router)
# app.include_router(audio_response.router)