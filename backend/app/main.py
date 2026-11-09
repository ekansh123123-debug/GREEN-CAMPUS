from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.config.database import engine, Base
from app.routes.auth_routes import router as auth_router, users_router
from app.routes.issue_routes import router as issue_router
from app.routes.marketplace_routes import router as marketplace_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.upload_routes import router as upload_router

# Import all models to ensure metadata is registered for create_all
import app.models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist in dev/sqlite
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Campus Issue Reporting, Resource Exchange, and Sustainability Analysis Platform for D. Y. Patil College of Engineering, Akurdi, Pune",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration (Supports local dev origins + deployed Vercel frontend domains)
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "storage": "ImageKit",
        "version": "1.0.0"
    }

# Register Routers (Both with /api/v1 prefix and root aliases for clean test & frontend consumption)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(users_router, prefix=settings.API_V1_PREFIX)
app.include_router(issue_router, prefix=settings.API_V1_PREFIX)
app.include_router(marketplace_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(upload_router, prefix=settings.API_V1_PREFIX)

# Direct root aliases for specification contract compatibility
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(issue_router)
app.include_router(marketplace_router)
app.include_router(analytics_router)
app.include_router(upload_router)
