"""Route for ELA-based forgery detection with tamper visualization."""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from typing import Optional

from services.forgery_detector_ela_service import ForgerDetectorELAService

router = APIRouter()


class ForgerDetectionResponse(BaseModel):
    """Response from ELA-based forgery detection."""
    is_forged: bool
    forgery_type: str  # 'authentic' or 'tampered'
    confidence: float  # 0-1, probability of tampering
    tamper_probability: float
    authentic_probability: float
    all_scores: dict[str, float]
    ela_preview: str  # base64 encoded ELA map
    mask_preview: str  # base64 encoded binary mask
    masked_preview: str  # base64 encoded original with mask overlay
    original_preview: str  # base64 encoded original image


@router.post(
    "/detect-forgery-ela",
    response_model=ForgerDetectionResponse,
    summary="Detect image forgery using ELA + EfficientNet-B4",
    description="""
    Detects tampered vs authentic images using Error Level Analysis (ELA) + EfficientNet-B4.
    
    Returns:
    - is_forged: True if tampered detected
    - forgery_type: 'authentic' or 'tampered'
    - confidence: Probability of tampering (0-1)
    - ela_preview: ELA map visualization (base64 PNG)
    - mask_preview: Binary mask of suspicious regions (base64 PNG)
    - masked_preview: Original image with red mask overlay (base64 PNG)
    - original_preview: Original image (base64 PNG)
    """,
    tags=["Forgery Detection - ELA"],
)
async def detect_forgery_ela(file: UploadFile = File(...)) -> ForgerDetectionResponse:
    """
    Detect forgery using ELA + EfficientNet-B4 model.
    
    Args:
        file: Image file (JPEG/PNG)
    
    Returns:
        ForgerDetectionResponse with forgery detection results and visualizations
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        # Read file bytes
        image_bytes = await file.read()

        # Run detection
        result = ForgerDetectorELAService.predict_forgery(image_bytes)

        # Check for errors from prediction
        if "error" in result:
            raise HTTPException(status_code=500, detail=f"Detection error: {result['error']}")

        return ForgerDetectionResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/detect-forgery-ela-debug",
    summary="Debug endpoint for ELA-based forgery detection",
    description="Returns raw prediction data for debugging",
    tags=["Forgery Detection - ELA"],
)
async def detect_forgery_ela_debug(file: UploadFile = File(...)):
    """
    Debug endpoint returning raw prediction data.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_bytes = await file.read()
        result = ForgerDetectorELAService.predict_forgery(image_bytes)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
