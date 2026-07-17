from fastapi import FastAPI

from app.routers import auth_router, channels_router, files_router

app = FastAPI(title="Share Fastly API")
app.include_router(auth_router)
app.include_router(channels_router)
app.include_router(files_router)

from fastapi.middleware.cors import CORSMiddleware
# Disable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
