from fastapi import FastAPI

from app.routers import auth

app = FastAPI(title="Share Fastly API")
app.include_router(auth.router)