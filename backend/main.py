from fastapi import FastAPI

from app.routers import auth_router, channels_router, files_router

app = FastAPI(title="Share Fastly API")
app.include_router(auth_router)
app.include_router(channels_router)
app.include_router(files_router)