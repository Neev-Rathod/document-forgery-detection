"""
ELA-based Forgery Detector Pipeline using EfficientNet-B4.

Detects forged (tampered) vs authentic images using:
1. Error Level Analysis (ELA) preprocessing
2. EfficientNet-B4 backbone
3. Custom classifier head
"""

from __future__ import annotations

import base64
import io
import threading
from pathlib import Path
from typing import Dict

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.serialization
from PIL import Image, ImageChops, ImageDraw, ImageEnhance
from torchvision import transforms

FORGERY_TYPES = {
    0: "authentic",
    1: "tampered",
}

FORGERY_COLORS = {
    "authentic": "#00DD00",  # Green
    "tampered": "#FF0000",   # Red
}


# ─── Standalone ELA and visualization functions ──────────────────────────────
def compute_ela(image_path_or_bytes, quality: int = 90, scale: int = 15) -> Image.Image:
    """
    Compute Error Level Analysis (ELA) for image forensics.

    EXACTLY matches the notebook's compute_ela function.
    
    ELA works by:
    1. Converting image to RGB
    2. Re-saving at known JPEG quality to buffer
    3. Computing absolute pixel-wise difference
    4. Enhancing contrast by scaling brightness
    
    Args:
        image_path_or_bytes: Path to image or bytes buffer
        quality: JPEG quality for ELA (default 90)
        scale: Brightness enhancement factor (default 15)
    
    Returns:
        PIL Image of ELA map (RGB)
    """
    try:
        # Load image - support both file paths and bytes
        if isinstance(image_path_or_bytes, bytes):
            img = Image.open(io.BytesIO(image_path_or_bytes)).convert("RGB")
        else:
            img = Image.open(image_path_or_bytes).convert("RGB")
        
        # Re-save to buffer at given quality - MATCHES NOTEBOOK
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=quality)
        buffer.seek(0)
        recompressed = Image.open(buffer).convert("RGB")
        
        # Compute absolute difference - MATCHES NOTEBOOK
        ela_img = ImageChops.difference(img, recompressed)
        
        # Enhance contrast (scale up small differences) - MATCHES NOTEBOOK
        bands = ela_img.split()
        enhanced = [ImageEnhance.Brightness(band).enhance(scale) for band in bands]
        ela_img = Image.merge("RGB", enhanced)
        
        return ela_img
    except Exception as e:
        print(f"Error computing ELA: {e}")
        return Image.new("RGB", (224, 224), (0, 0, 0))


def generate_tamper_mask(ela_image: Image.Image, threshold: int = 50) -> Image.Image:
    """
    Generate binary mask highlighting suspicious tampered regions.
    
    Args:
        ela_image: ELA map (PIL Image)
        threshold: Intensity threshold for detecting tampered pixels (0-255)
    
    Returns:
        Binary mask PIL Image (white = tampered, black = authentic)
    """
    ela_array = np.array(ela_image)
    # Convert to grayscale
    ela_gray = cv2.cvtColor(ela_array, cv2.COLOR_RGB2GRAY)
    # Create binary mask
    _, mask = cv2.threshold(ela_gray, threshold, 255, cv2.THRESH_BINARY)
    # Apply morphological operations to clean up noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    return Image.fromarray(mask)


def overlay_mask_on_image(
    original: Image.Image,
    mask: Image.Image,
    color: tuple = (255, 0, 0),
    alpha: float = 0.4,
) -> Image.Image:
    """
    Overlay tamper mask on original image with transparency.
    
    Args:
        original: Original image (PIL Image)
        mask: Binary mask (PIL Image)
        color: RGB color for mask overlay (default red)
        alpha: Transparency of overlay (0-1, default 0.4)
    
    Returns:
        PIL Image with mask overlay
    """
    # Ensure same size
    mask = mask.resize(original.size, Image.LANCZOS)
    original = original.convert("RGBA")

    # Create overlay
    overlay = Image.new("RGBA", original.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)

    # Draw mask regions
    mask_array = np.array(mask)
    tampered_pixels = np.where(mask_array > 127)

    for y, x in zip(tampered_pixels[0], tampered_pixels[1]):
        overlay_draw.point((x, y), fill=(*color, int(255 * alpha)))

    # Blend
    result = Image.alpha_composite(original, overlay)
    return result.convert("RGB")


# ─── ForgerDetectorELAPipeline class ──────────────────────────────────────────


class ForgerDetectorELAPipeline:
    """
    Detects image forgery using ELA + EfficientNet-B4.
    
    Pipeline:
    1. Compute Error Level Analysis (ELA) for input image
    2. Pass ELA map through EfficientNet-B4 backbone
    3. Classify as authentic (0) or tampered (1)
    4. Generate visualization with ELA map and tamper mask
    """

    def __init__(
        self,
        model_path: str | Path,
        threshold: float = 0.35,
        img_size: int = 224,
        ela_quality: int = 90,
        ela_scale: int = 15,
    ) -> None:
        """
        Initialize the forgery detector.

        Args:
            model_path: Path to forgery_detector_full.pth
            threshold: Probability threshold for tamper classification (default 0.35)
            img_size: Input image size for EfficientNet-B4 (default 224)
            ela_quality: JPEG quality for ELA computation (default 90)
            ela_scale: Brightness scaling factor for ELA visualization (default 15)
        """
        self.model_path = Path(model_path)
        self.threshold = threshold
        self.img_size = img_size
        self.ela_quality = ela_quality
        self.ela_scale = ela_scale

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._lock = threading.Lock()
        self._model = None

        # Normalization transform
        self._transform = transforms.Compose(
            [
                transforms.Resize((img_size, img_size)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                ),
            ]
        )

    def _build_model(self) -> nn.Module:
        """
        Build EfficientNet-B4 + Custom Classifier (matches notebook exactly).

        Architecture:
        - EfficientNet-B4 backbone (pretrained on ImageNet)
        - Output: 1792 features
        - Custom classifier: BatchNorm → Dropout(0.4) → Linear(1792→512) → ReLU → BatchNorm → Dropout(0.3) → Linear(512→2)
        - 2 classes: [authentic, tampered]
        """
        try:
            import timm
        except ImportError:
            raise ImportError("timm is required. Install with: pip install timm")

        # Create EfficientNet-B4 backbone - IMPORTANT: pretrained=True (same as notebook)
        backbone = timm.create_model(
            "efficientnet_b4",
            pretrained=True,  # Match notebook's pretrained=True
            num_classes=0,  # Remove default head
            global_pool="avg",
        )
        feat_dim = backbone.num_features  # 1792 for B4

        # Custom classifier head - EXACT SAME as notebook
        classifier = nn.Sequential(
            nn.BatchNorm1d(feat_dim),
            nn.Dropout(0.4),
            nn.Linear(feat_dim, 512),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(512),
            nn.Dropout(0.3),
            nn.Linear(512, 2),  # 2 classes: authentic / tampered
        )

        # Create model class matching the notebook's ForgeryDetector exactly
        class ForgeryDetector(nn.Module):
            def __init__(self, backbone, classifier):
                super().__init__()
                self.backbone = backbone
                self.classifier = classifier

            def forward(self, x):
                features = self.backbone(x)
                return self.classifier(features)

        return ForgeryDetector(backbone, classifier)

    def _load_model(self) -> None:
        """Lazy-load model with thread safety."""
        if self._model is not None:
            return

        with self._lock:
            if self._model is not None:
                return

            if not self.model_path.exists():
                raise FileNotFoundError(f"Model weights not found: {self.model_path}")

            print(f"Loading forgery detector model from {self.model_path}...")
            model = self._build_model().to(self.device)

            # Load checkpoint - handle PyTorch 2.6+ weights_only security
            try:
                # Try loading with safe globals for numpy (PyTorch 2.6+)
                with torch.serialization.safe_globals([np._core.multiarray.scalar]):
                    checkpoint = torch.load(self.model_path, map_location=self.device, weights_only=False)
            except Exception:
                # Fallback: load without weights_only restriction
                checkpoint = torch.load(self.model_path, map_location=self.device, weights_only=False)

            # Handle both full checkpoint and state_dict
            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                model.load_state_dict(checkpoint["model_state_dict"])
            else:
                model.load_state_dict(checkpoint)

            model.eval()
            self._model = model
            print("Model loaded successfully!")

    def predict(self, image_bytes: bytes) -> dict:
        """
        Predict forgery on image and generate visualizations.

        Args:
            image_bytes: Image file bytes (JPEG/PNG)

        Returns:
            Dict with:
            - is_forged: bool (True = tampered detected)
            - forgery_type: str ('authentic' or 'tampered')
            - confidence: float (0-1, probability of tampering)
            - tamper_probability: float (same as confidence)
            - authentic_probability: float (1 - confidence)
            - ela_preview: str (base64 encoded ELA map)
            - mask_preview: str (base64 encoded tamper mask)
            - masked_preview: str (base64 encoded original with mask overlay)
            - original_preview: str (base64 encoded original image)
        """
        # Load model if needed
        self._load_model()

        try:
            # Load original image
            original_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            original_resized = original_img.resize(
                (self.img_size, self.img_size), Image.LANCZOS
            )

            # Compute ELA
            ela_img = compute_ela(
                image_bytes,
                quality=self.ela_quality,
                scale=self.ela_scale
            )

            # Prepare tensor for model
            tensor = self._transform(ela_img).unsqueeze(0).to(self.device)

            # Run inference
            with torch.no_grad():
                logits = self._model(tensor)
                probs = torch.softmax(logits, dim=1)[0]

            prob_tampered = probs[1].item()  # Probability of tamper class
            prob_authentic = probs[0].item()  # Probability of authentic class
            is_forged = prob_tampered >= self.threshold
            forgery_type = "tampered" if is_forged else "authentic"

            # Generate tamper mask
            mask = generate_tamper_mask(ela_img, threshold=50)

            # Overlay mask on original
            masked_img = overlay_mask_on_image(
                original_resized,
                mask,
                color=(255, 0, 0),  # Red
                alpha=0.5
            )

            # Encode visualizations to base64
            def img_to_base64(img: Image.Image) -> str:
                """Convert PIL Image to base64 string."""
                buffer = io.BytesIO()
                img.save(buffer, format="PNG")
                img_str = base64.b64encode(buffer.getvalue()).decode()
                return f"data:image/png;base64,{img_str}"

            return {
                "is_forged": is_forged,
                "forgery_type": forgery_type,
                "confidence": prob_tampered,
                "tamper_probability": prob_tampered,
                "authentic_probability": prob_authentic,
                "all_scores": {
                    "authentic": prob_authentic,
                    "tampered": prob_tampered,
                },
                "ela_preview": img_to_base64(ela_img),
                "mask_preview": img_to_base64(mask),
                "masked_preview": img_to_base64(masked_img),
                "original_preview": img_to_base64(original_resized),
            }

        except Exception as e:
            print(f"Error during prediction: {e}")
            return {
                "is_forged": False,
                "forgery_type": "authentic",
                "confidence": 0.0,
                "tamper_probability": 0.0,
                "authentic_probability": 1.0,
                "all_scores": {"authentic": 1.0, "tampered": 0.0},
                "error": str(e),
            }
