"""Service layer for ELA-based forgery detection using EfficientNet-B4."""

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ai_models.forgery_detector_ela import ForgerDetectorELAPipeline


class ForgerDetectorELAService:
    """
    Lazy-loaded service for ELA-based forgery detection.
    
    Uses EfficientNet-B4 + Error Level Analysis (ELA) preprocessing
    to detect tampered vs authentic images.
    """

    _pipeline = None

    @classmethod
    def _resolve_model_path(cls) -> Path:
        """Resolve path to forgery_detector_full.pth model weights."""
        model_name = "forgery_detector_full.pth"

        # Check environment variable first
        env_path = os.getenv("FORGERY_DETECTOR_ELA_MODEL_PATH")
        if env_path and Path(env_path).exists():
            return Path(env_path)

        # Check default locations (from backend/services/ perspective)
        search_dirs = [
            Path(__file__).resolve().parents[3] / "ai_models" / "models",  # d:/document-forgery-detection/ai_models/models
            Path("ai_models/models"),
            Path("../ai_models/models"),
        ]

        for directory in search_dirs:
            model_file = directory / model_name
            if model_file.exists():
                return model_file

        raise FileNotFoundError(
            f"Model weights {model_name} not found in: {', '.join(str(d) for d in search_dirs)}"
        )

    @classmethod
    def _load_pipeline(cls) -> ForgerDetectorELAPipeline:
        """Lazy-load the pipeline."""
        if cls._pipeline is None:
            model_path = cls._resolve_model_path()
            cls._pipeline = ForgerDetectorELAPipeline(
                model_path=model_path,
                threshold=0.35,
                img_size=224,
                ela_quality=90,
                ela_scale=15,
            )
        return cls._pipeline

    @classmethod
    def predict_forgery(cls, image_bytes: bytes) -> dict:
        """
        Predict forgery for image using ELA + EfficientNet-B4.

        Args:
            image_bytes: Image file bytes (JPEG/PNG)

        Returns:
            Dict with:
            - is_forged: bool
            - forgery_type: str ('authentic' or 'tampered')
            - confidence: float (0-1)
            - tamper_probability: float
            - authentic_probability: float
            - ela_preview: str (base64 encoded ELA map)
            - mask_preview: str (base64 encoded tamper mask)
            - masked_preview: str (base64 encoded original with mask overlay)
            - original_preview: str (base64 encoded original image)
        """
        pipeline = cls._load_pipeline()
        return pipeline.predict(image_bytes)
