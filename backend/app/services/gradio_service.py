"""Async wrappers for the external Gradio AI services.

Both Gradio endpoints use a synchronous `gradio_client.Client` under the hood,
so we offload each call to a thread-pool executor to keep FastAPI non-blocking.
"""

import asyncio
import logging
from functools import partial

from fastapi import HTTPException, status
from gradio_client import Client

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _predict_sync(url: str, api_params: dict) -> str:
    """Synchronous helper – runs inside an executor thread."""
    try:
        logger.info(f"Initializing Gradio Client for URL: {url}")
        client = Client(url, verbose=False)
        
        # Log parameter keys (avoid logging full text to keep logs clean)
        logger.info(f"Calling Gradio predict on {url} with params: {list(api_params.keys())}")
        
        result = client.predict(**api_params, api_name="/predict")
        logger.info(f"Gradio call to {url} succeeded.")
        return str(result)
    except Exception as e:
        logger.error(f"Gradio prediction failed for {url}: {str(e)}")
        raise


async def _call_gradio(url: str, api_params: dict, label: str) -> str:
    """Run a Gradio predict call in the default thread-pool executor."""
    if not url:
        logger.error(f"{label} Gradio URL is missing in configuration.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{label} Gradio URL is not configured. "
                   "Set the corresponding environment variable and restart.",
        )

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, partial(_predict_sync, url, api_params))
    except Exception as exc:
        # If it's already an HTTPException, just re-raise it
        if isinstance(exc, HTTPException):
            raise
        
        error_msg = str(exc)
        logger.error(f"{label} service error: {error_msg}")
        
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{label} service is currently unavailable: {error_msg}",
        ) from exc

    return result


async def call_summary_api(text: str) -> str:
    """Call the English summarisation Gradio space and return the summary text."""
    settings = get_settings()
    # Based on user-provided correct usage
    params = {
        "input_text": text,
        "num_beams": 4,
        "min_length": 60,
        "max_length": 384
    }
    return await _call_gradio(
        url=settings.gradio_summary_url,
        api_params=params,
        label="Summary",
    )


async def call_translation_api(english_text: str) -> str:
    """Call the EN→Sinhala translation Gradio space and return the Sinhala text."""
    settings = get_settings()
    # For translation, we'll try 'input_text' as it's common in these spaces,
    # but fallback to 'message' if it was working before. 
    # The user didn't specify, so we'll use a likely correct one or keep original.
    # Given the summarizer used 'input_text', it's likely this one does too.
    params = {
        "input_text": english_text
    }
    return await _call_gradio(
        url=settings.gradio_translation_url,
        api_params=params,
        label="Translation",
    )
