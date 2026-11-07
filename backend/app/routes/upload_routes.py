from fastapi import APIRouter, Depends, UploadFile, File, Query, status
from app.config.settings import settings
from app.middleware.auth_middleware import get_current_user
from app.middleware.upload_validator import validate_image_upload
from app.services.imagekit_service import imagekit_service
from app.models.user_model import User

router = APIRouter(prefix="/upload", tags=["Uploads"])

@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    category: str = Query("issues", description="Target folder: 'issues' or 'marketplace'"),
    current_user: User = Depends(get_current_user)
):
    """
    Validates file upload (MIME, magic bytes, <= 5 MB) and uploads to ImageKit storage (TC-05).
    Returns the secure CDN image URL.
    """
    # 1. Validate payload and inspect magic bytes
    file_bytes, safe_filename = await validate_image_upload(file)

    # 2. Select ImageKit target folder
    folder = (
        settings.IMAGEKIT_FOLDER_ISSUES
        if category == "issues"
        else settings.IMAGEKIT_FOLDER_MARKETPLACE
    )

    # 3. Upload to ImageKit
    upload_result = imagekit_service.upload_image(
        file_bytes=file_bytes,
        file_name=safe_filename,
        folder=folder,
        tags=["green-campus", category, current_user.role.role_name if current_user.role else "user"]
    )

    return {
        "image_url": upload_result["url"],
        "file_id": upload_result["file_id"],
        "file_name": safe_filename,
        "storage_provider": upload_result["storage_provider"]
    }
