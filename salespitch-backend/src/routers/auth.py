from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.crud import get_user_by_username, create_user, verify_password
from src.auth import UserIn, Token
from src.security import create_access_token
from src.deps import get_db

router = APIRouter()

@router.post('/check_user')
async def check_user(user: Dict[Any, Any], db: AsyncSession = Depends(get_db)):
    exists = bool(await get_user_by_username(db, user['username']))
    return {"exists": exists}

@router.post('/register', status_code=status.HTTP_201_CREATED)
async def register(user: UserIn, db: AsyncSession = Depends(get_db)):
    if await get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="User already exists")
    await create_user(db, user.username, user.password)
    return {"msg": "User created"}

@router.post('/token', response_model=Token)
async def login_for_token(
    form_data: UserIn,
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_by_username(db, form_data.username)
    if not user or not await verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token = create_access_token({"sub": user.username})
    return {"access_token": access_token, "user_id": user.id, "user_name":user.username}