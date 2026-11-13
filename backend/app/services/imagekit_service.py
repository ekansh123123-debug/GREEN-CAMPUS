import uuid
import logging
from typing import Dict, Any, Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)

class ImageKitService:
    def __init__(self):
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        """Attempts to initialize ImageKit client if credentials are configured."""
        if (
            settings.IMAGEKIT_PRIVATE_KEY
            and settings.IMAGEKIT_PUBLIC_KEY
            and settings.IMAGEKIT_URL_ENDPOINT
        ):
            try:
                from imagekitio import ImageKit
                try:
                    self.client = ImageKit(
                        private_key=settings.IMAGEKIT_PRIVATE_KEY,
                        public_key=settings.IMAGEKIT_PUBLIC_KEY,
                        url_endpoint=settings.IMAGEKIT_URL_ENDPOINT
                    )
                except TypeError:
                    # Support imagekitio v5+ SDK signature
                    self.client = ImageKit(
                        private_key=settings.IMAGEKIT_PRIVATE_KEY
                    )
                logger.info("ImageKit client initialized successfully.")
            except ImportError:
                logger.warning("imagekitio package not installed; running ImageKit service in mock mode.")
            except Exception as e:
                logger.error(f"Failed to initialize ImageKit client: {e}; falling back to mock mode.")
        else:
            logger.info("ImageKit credentials not configured in settings. Operating in mock mode.")

    def upload_image(
        self,
        file_bytes: bytes,
        file_name: str,
        folder: str = "/green-campus/uploads",
        tags: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Uploads image binary bytes to ImageKit cloud storage.
        If credentials are not present or client is not configured, generates a mock ImageKit CDN URL.
        """
        clean_file_name = f"{uuid.uuid4().hex}_{file_name}"

        if self.client:
            try:
                upload_options = {
                    "folder": folder,
                    "use_unique_file_name": True,
                    "tags": tags or ["green-campus", "v1"]
                }
                response = self.client.upload_file(
                    file=file_bytes,
                    file_name=clean_file_name,
                    options=upload_options
                )
                
                # ImageKit Python SDK returns response object with response_metadata or raw dict
                url = getattr(response, "url", None)
                file_id = getattr(response, "file_id", None)
                if not url and isinstance(response, dict):
                    url = response.get("url")
                    file_id = response.get("file_id")

                if url:
                    return {
                        "url": url,
                        "file_id": file_id or f"ik_{uuid.uuid4().hex[:10]}",
                        "name": clean_file_name,
                        "storage_provider": "imagekit"
                    }
            except Exception as e:
                logger.error(f"ImageKit cloud upload failed: {e}. Falling back to fallback mock URL.")

        # Fallback / Local / Test mock mode
        mock_endpoint = settings.IMAGEKIT_URL_ENDPOINT or "https://ik.imagekit.io/greencampus"
        mock_url = f"{mock_endpoint.rstrip('/')}{folder}/{clean_file_name}"
        return {
            "url": mock_url,
            "file_id": f"mock_ik_{uuid.uuid4().hex[:12]}",
            "name": clean_file_name,
            "storage_provider": "imagekit-mock"
        }

imagekit_service = ImageKitService()
