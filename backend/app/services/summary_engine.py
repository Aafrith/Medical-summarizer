import logging
import re
from datetime import datetime

from app.services.gradio_service import call_summary_api, call_translation_api

logger = logging.getLogger(__name__)

TOPIC_KEYWORDS: list[tuple[str, list[str]]] = [
    ("Oncology", ["cancer", "tumor", "oncology", "carcinoma", "metastasis"]),
    ("Cardiology", ["heart", "cardio", "myocardial", "stroke", "hypertension"]),
    ("Diabetology", ["diabetes", "insulin", "glycemic", "glucose", "metformin"]),
    ("Neurology", ["brain", "neurology", "parkinson", "alzheimer", "seizure"]),
    ("Pulmonology", ["lung", "respiratory", "asthma", "copd", "pulmonary"]),
    ("Infectious Disease", ["infection", "viral", "bacterial", "sepsis", "covid"]),
]


def _normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9\s]", " ", value.lower())


def detect_topic(file_name: str, text: str) -> str:
    corpus = f"{file_name} {text[:5000]}"
    normalized = _normalize(corpus)

    for topic, keywords in TOPIC_KEYWORDS:
        if any(keyword in normalized for keyword in keywords):
            return topic

    return "General Medicine"


def detect_publication_year(file_name: str, text: str) -> int | None:
    year_matches = re.findall(r"(?:19|20)\d{2}", f"{file_name} {text[:3000]}")
    current_year = datetime.utcnow().year

    valid_years = [
        int(year)
        for year in year_matches
        if 1900 <= int(year) <= current_year
    ]

    return max(valid_years) if valid_years else None


def split_sentences(text: str) -> list[str]:
    rough_sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [sentence.strip() for sentence in rough_sentences if sentence.strip()]


def estimate_confidence(text: str) -> float:
    text_length = len(text)
    if text_length < 400:
        return 0.66
    if text_length < 1500:
        return 0.76
    return 0.86


async def generate_summary_bundle(file_name: str, text: str) -> dict:
    """Build the full summary bundle by calling both Gradio AI services.

    - English summary  → Summary Gradio space
    - Sinhala summary  → Translation Gradio space (translates the English result)
    - Topic / year     → Local heuristics (unchanged)
    """
    logger.info(f"Generating summary bundle for file: {file_name}")
    
    topic = detect_topic(file_name=file_name, text=text)
    publication_year = detect_publication_year(file_name=file_name, text=text)
    logger.info(f"Detected topic: {topic}, year: {publication_year}")

    # Call Gradio summary API with the document text (capped to avoid token limits)
    logger.info("Calling Summary API...")
    english_summary = await call_summary_api(text[:8000])
    logger.info("Summary API call successful.")

    # Derive key findings from the first 3 sentences of the AI summary
    key_findings = split_sentences(english_summary)[:3]

    # Translate the English summary to Sinhala via the translation Gradio API
    sinhala_summary = ""
    try:
        logger.info("Calling Translation API...")
        sinhala_summary = await call_translation_api(english_summary)
        logger.info("Translation API call successful.")
    except Exception as e:
        logger.warning(f"Translation service failed: {str(e)}. Proceeding with English summary only.")
        sinhala_summary = (
            "සිංහල පරිවර්තනය දැනට ලබා ගත නොහැක. කරුණාකර ඉංග්‍රීසි සාරාංශය බලන්න. "
            "(Sinhala translation is currently unavailable. Please refer to the English summary.)"
        )

    return {
        "topic": topic,
        "publication_year": publication_year,
        "confidence": estimate_confidence(text),
        "key_findings": key_findings,
        "english_summary": english_summary,
        "sinhala_summary": sinhala_summary,
    }
