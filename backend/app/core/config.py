from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Log Analysis Backend"
    DATABASE_URL: str = "postgresql+asyncpg://app:secret@postgres:5432/logs"
    JWT_SECRET: str = "MySuperSecretKeyForParamsToken12"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    class Config:
        env_file = ".env"


settings = Settings()