import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def migrate():
    print(f"Connecting to {settings.DATABASE_URL}")
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Adding first_name column...")
        # await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(128);"))
        print("Adding last_name column...")
        # await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(128);"))
       
        await conn.execute(text("TRUNCATE  TABLE anomalies CASCADE;"))
        await conn.execute(text("TRUNCATE  TABLE events CASCADE;"))
        
    print("Migration complete.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
