import logging
import re
from datetime import datetime

from app.core.config import get_settings
from app.services.gemini_service import GeminiService
from app.services.gradio_service import call_summary_api, call_translation_api

logger = logging.getLogger(__name__)
settings = get_settings()
gemini = GeminiService(api_key=settings.gemini_api_key)


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


def chunk_text_for_translation(text: str, max_chars: int = 400) -> list[str]:
    cleaned = text.strip()
    if not cleaned:
        return []

    sentences = split_sentences(cleaned)
    if not sentences:
        return [cleaned]

    chunks: list[str] = []
    current = ""

    for sentence in sentences:
        if len(sentence) > max_chars:
            if current:
                chunks.append(current.strip())
                current = ""

            for i in range(0, len(sentence), max_chars):
                part = sentence[i:i + max_chars].strip()
                if part:
                    chunks.append(part)
            continue

        candidate = f"{current} {sentence}".strip() if current else sentence
        if len(candidate) <= max_chars:
            current = candidate
        else:
            chunks.append(current.strip())
            current = sentence

    if current:
        chunks.append(current.strip())

    return chunks


async def translate_to_sinhala_full(text: str) -> str:
    """Translate long English text in chunks to avoid output truncation."""
    chunks = chunk_text_for_translation(text)
    if not chunks:
        return ""

    translated_chunks: list[str] = []
    for index, chunk in enumerate(chunks):
        try:
            translated = await call_translation_api(chunk)
            if translated and translated.strip():
                translated_chunks.append(translated.strip())
            else:
                logger.warning(
                    "Empty translation result for chunk %s/%s (%d chars). Using English fallback.",
                    index + 1, len(chunks), len(chunk),
                )
                translated_chunks.append(chunk)
        except Exception as exc:
            logger.warning(
                "Chunk translation failed at part %s/%s (%d chars): %s. Using English fallback.",
                index + 1, len(chunks), len(chunk), exc,
            )
            translated_chunks.append(chunk)

    return "\n".join(part for part in translated_chunks if part).strip()


def estimate_confidence(text: str) -> float:
    text_length = len(text)
    if text_length < 400:
        return 0.66
    if text_length < 1500:
        return 0.76
    return 0.86


async def generate_summary_bundle(file_name: str, extracted_content: dict) -> dict:

    """Build the full summary bundle by calling both Gradio AI services.
    
    Hybrid approach:
    1. Parse images and tables one by one through Gemini.
    2. Add all descriptions to the original text.
    3. Summarize the combined text.
    """
    logger.info(f"Generating hybrid summary bundle for file: {file_name}")
    
    original_text = extracted_content.get("text", "")
    images = extracted_content.get("images", [])
    tables = extracted_content.get("tables", [])
    
    image_details = []
    table_details = []

    # 1. Analyze Images one by one
    logger.info(f"Processing {len(images)} images via Gemini...")
    for i, img in enumerate(images):
        logger.info(f"Analyzing image {i+1}/{len(images)}")
        explanation = gemini.describe_image(img["bytes"], f"image/{img['extension']}")
        image_details.append(explanation)
        logger.info(f"Finished analyzing image {i+1}")

    # 2. Analyze Tables one by one
    logger.info(f"Processing {len(tables)} tables via Gemini...")
    for i, table_text in enumerate(tables):
        logger.info(f"Analyzing table {i+1}/{len(tables)}")
        explanation = gemini.describe_table(table_text)
        table_details.append(explanation)
        logger.info(f"Finished analyzing table {i+1}")

    # 3. Combine everything
    logger.info("Combining original text with image and table explanations")
    combined_text = original_text + "\n\n"
    
    if image_details:
        combined_text += "### Visual Content Analysis\n" + "\n".join(image_details) + "\n\n"
    
    if table_details:
        combined_text += "### Tabular Content Analysis\n" + "\n".join(table_details) + "\n\n"

    # 4. Standard Metadata
    topic = detect_topic(file_name=file_name, text=original_text)
    publication_year = detect_publication_year(file_name=file_name, text=original_text)
    logger.info(f"Detected topic: {topic}, year: {publication_year}")

    # 5. Summarize (using combined text)
    logger.info("Calling Summarizer API with combined context...")
    # Cap combined text to avoid exceeding API limits if necessary (e.g. 10000 chars)
    english_summary = await call_summary_api(combined_text[:12000])
    logger.info("Summarizer response received.")

    # 6. Key Findings
    key_findings = split_sentences(english_summary)[:3]

    # 7. Translate the main summary only.
    sinhala_summary = ""
    try:
        logger.info("Calling Translation API for main summary...")
        sinhala_summary = await translate_to_sinhala_full(english_summary)
        logger.info("Main summary translation successful.")
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        sinhala_summary = (
            "සිංහල පරිවර්තනය දැනට ලබා ගත නොහැක. කරුණාකර ඉංග්‍රීසි සාරාංශය බලන්න. "
            "(Sinhala translation is currently unavailable.)"
        )

    return {
        "topic": topic,
        "publication_year": publication_year,
        "confidence": estimate_confidence(original_text),
        "key_findings": key_findings,
        "english_summary": english_summary,
        "sinhala_summary": sinhala_summary,
    }

