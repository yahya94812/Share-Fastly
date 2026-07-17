from app.routers.auth import router as auth_router
from app.routers.channels import router as channels_router
from app.routers.files import router as files_router

__all__ = ["auth_router", "channels_router", "files_router"]