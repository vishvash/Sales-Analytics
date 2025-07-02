from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from src.db.models import User
from src.model import InterviewUser  # Import the InterviewUser model

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(User).where(User.username == username))
    return result.scalars().first()

async def create_user(db: AsyncSession, username: str, password: str):
    hashed = pwd_context.hash(password)
    user = User(username=username, hashed_password=hashed)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

async def check_interview_user_exists(db: AsyncSession, username: str):
    result = await db.execute(select(InterviewUser).where(InterviewUser.user_name == username))
    return result.scalars().first() is not None


