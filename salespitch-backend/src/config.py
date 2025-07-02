from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    # Derive a sync version for Alembic:
    @property
    def DATABASE_SYNC_URL(self) -> str:
        return self.DATABASE_URL.replace(
            "postgresql+asyncpg", "postgresql+psycopg2"
        )
    # DATABASE_URL: str = Field(..., env="DATABASE_URL")
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    HOST: str = Field(default="127.0.0.1", env="HOST")
    PORT: int = Field(default=8000, env="PORT")

    class Config:
        env_file = ".env"


settings = Settings()