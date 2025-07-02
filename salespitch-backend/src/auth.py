from pydantic import BaseModel

class UserIn(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    user_name: str

class TokenData(BaseModel):
    username: str | None = None