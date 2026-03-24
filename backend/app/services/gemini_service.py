import logging
from google import genai
from google.genai import types

# Set up logging
logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self, api_key: str):
        if not api_key or api_key == "[ENCRYPTION_KEY]":
            logger.warning("Gemini API key is not set or is the default placeholder.")
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-3-flash-preview"

    def describe_image(self, image_bytes: bytes, mime_type: str) -> str:
        """Get a detailed explanation of an image using Gemini."""
        logger.info(f"Requesting Gemini explanation for image (mime: {mime_type})")
        try:
            # Note: The google-genai SDK 1.x uses model.generate_content
            # The user's example shows: client.models.generate_content
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=mime_type,
                    ),
                    "Please provide a detailed explanation of what is in this image, specifically focusing on any medical or clinical information if present. If it's a chart or diagram, explain the key data points clearly."
                ]
            )
            explanation = response.text
            logger.info("Successfully received image explanation from Gemini")
            return explanation
        except Exception as e:
            logger.error(f"Error describing image with Gemini: {e}", exc_info=True)
            return f"[Gemini Image Analysis Error: {str(e)}]"

    def describe_table(self, table_text: str) -> str:
        """Get a detailed explanation of table data using Gemini."""
        logger.info("Requesting Gemini explanation for table data")
        try:
            prompt = (
                "Please provide a detailed explanation of the following table data extracted from a medical document. "
                "Synthesize the key findings, trends, and any critical values that a clinician should notice.\n\n"
                f"Table Data:\n{table_text}"
            )
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt
            )
            explanation = response.text
            logger.info("Successfully received table explanation from Gemini")
            return explanation
        except Exception as e:
            logger.error(f"Error describing table with Gemini: {e}", exc_info=True)
            return f"[Gemini Table Analysis Error: {str(e)}]"
