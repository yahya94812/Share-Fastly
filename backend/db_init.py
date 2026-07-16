# db_init.py

from app.database import engine
from app.models import Base

async def db_init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    import asyncio
    asyncio.run(db_init())