from .auth_routes import router as auth_router, users_router
from .issue_routes import router as issue_router
from .marketplace_routes import router as marketplace_router
from .analytics_routes import router as analytics_router
from .upload_routes import router as upload_router

__all__ = [
    "auth_router",
    "users_router",
    "issue_router",
    "marketplace_router",
    "analytics_router",
    "upload_router",
]
