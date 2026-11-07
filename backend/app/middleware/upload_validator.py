import os
import uuid
from typing import Tuple
from fastapi import HTTPException, UploadFile, status
from app.config.settings import settings

DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".php", ".py", ".js", ".html", ".htm",
    ".svg", ".vbs", ".dll", ".so", ".bin", ".scr", ".msi"
}

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

def validate_image_bytes(content: bytes) -> str:
    """
    Inspects raw magic bytes of uploaded file to verify it is genuine JPEG, PNG, or WebP.
    Returns detected extension or raises HTTPException(422).
    """
    if len(content) < 12:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded file is too small or empty."
        )

    # Check JPEG (FF D8 FF)
    if content.startswith(b"\xff\xd8\xff"):
        return ".jpg"

    # Check PNG (89 50 4E 47 0D 0A 1A 0A)
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"

    # Check WebP (RIFF .... WEBP)
    if content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return ".webp"

    # Rejection of all other formats (e.g. executable PE header 'MZ', ELF, HTML/script)
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Invalid file signature. Only genuine JPEG, PNG, and WebP images are allowed."
    )

async def validate_image_upload(file: UploadFile) -> Tuple[bytes, str]:
    """
    Validates uploaded file against size limits (<= 5MB), MIME type, filename, and magic bytes.
    Returns (file_content_bytes, safe_filename).
    """
    original_filename = file.filename or "image.jpg"
    _, ext = os.path.splitext(original_filename.lower())

    # 1. Reject dangerous extensions explicitly
    if ext in DANGEROUS_EXTENSIONS or ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File extension '{ext}' is prohibited. Only .jpg, .jpeg, .png, and .webp are accepted."
        )

    # 2. Check client-reported content type
    if file.content_type not in settings.ALLOWED_IMAGE_MIMES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Content-Type '{file.content_type}' is not allowed. Expected image/jpeg, image/png, or image/webp."
        )

    # 3. Read content and check size limit (<= 5 MB)
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB."
        )

    # 4. Deep magic bytes verification
    detected_ext = validate_image_bytes(content)

    # 5. Generate secure UUID filename
    safe_filename = f"{uuid.uuid4().hex}{detected_ext}"

    return content, safe_filename
