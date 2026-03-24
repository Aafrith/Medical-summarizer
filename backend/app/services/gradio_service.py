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


# In-memory cache for Gradio Client objects to avoid repeated config fetching.
_client_cache: dict[str, Client] = {}


def _get_client(url: str, max_retries: int = 3) -> Client:
    """Gets a Gradio Client from cache or initializes a new one with retries."""
    if url not in _client_cache:
        last_exception = None
        for attempt in range(max_retries):
            try:
                logger.info(f"Initializing Gradio Client for URL: {url} (Attempt {attempt + 1})")
                _client_cache[url] = Client(url, verbose=False)
                logger.info(f"Gradio Client for {url} initialized successfully.")
                return _client_cache[url]
            except Exception as e:
                last_exception = e
                logger.warning(f"Initialization attempt {attempt + 1} failed for {url}: {e}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(2)
        
        logger.error(f"Failed to initialize Gradio Client for {url} after {max_retries} attempts.")
        raise last_exception or Exception(f"Failed to initialize client for {url}")
        
    return _client_cache[url]


def _predict_sync(url: str, api_params: dict, max_retries: int = 2) -> str:
    """Synchronous helper – runs inside an executor thread with retries and caching."""
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            client = _get_client(url)
            
            # Log parameter keys (avoid logging full text to keep logs clean)
            logger.info(f"Attempt {attempt + 1}: Calling Gradio predict on {url} with params: {list(api_params.keys())}")
            
            result = client.predict(**api_params, api_name="/predict")
            logger.info(f"Gradio call to {url} succeeded.")
            return str(result)
            
        except Exception as e:
            last_exception = e
            error_msg = str(e)
            logger.warning(f"Prediction attempt {attempt + 1} failed for {url}: {error_msg}")
            
            # If the cached client is potentially invalid (e.g. heartbeat/connection issues), 
            # clear it from cache so the next attempt or call re-initializes.
            if url in _client_cache:
                logger.info(f"Clearing cached client for {url} due to failure.")
                del _client_cache[url]
            
            if attempt < max_retries - 1:
                import time
                time.sleep(1)

    logger.error(f"Gradio prediction failed for {url} after {max_retries} attempts.")
    raise last_exception or Exception(f"Gradio prediction failed for {url}")


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
        "max_length": 768
    }
    return await _call_gradio(
        url=settings.gradio_summary_url,
        api_params=params,
        label="Summary",
    )


async def call_translation_api(english_text: str) -> str:
    """Call the EN→Sinhala translation Gradio space and return the Sinhala text."""
    settings = get_settings()
    # User provided snippet shows 'message' for the translation call
    params = {
        "message": english_text
    }
    return await _call_gradio(
        url=settings.gradio_translation_url,
        api_params=params,
        label="Translation",
    )
