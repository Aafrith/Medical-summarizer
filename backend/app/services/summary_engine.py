import re
from datetime import datetime

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


def build_english_summary(file_name: str, text: str, topic: str, publication_year: int | None) -> tuple[str, list[str]]:
    sentences = split_sentences(text)

    if not sentences:
        fallback = f"This document ({file_name}) was received, but text extraction was limited."
        return fallback, ["Document received successfully.", "Text extraction is limited."]

    selected = sentences[:3]
    key_findings = selected[:3]

    year_text = f"Publication year signal: {publication_year}." if publication_year else "Publication year not detected."

    summary = " ".join(
        [
            f"Document: {file_name}.",
            year_text,
            f"Detected clinical focus: {topic}.",
            *selected,
        ]
    )

    return summary, key_findings


def build_sinhala_summary(topic: str, english_summary: str, key_findings: list[str]) -> str:
    finding_text = " ".join(key_findings[:2]) if key_findings else "ප්‍රධාන කරුණු දෙකක් හඳුනාගෙන ඇත."

    return (
        f"{topic} විෂයයට අදාළ මෙම ලේඛනය සඳහා ස්වයංක්‍රීය සිංහල සාරාංශයක් සකස් කර ඇත. "
        "පද්ධතිය විසින් හඳුනාගත් ප්‍රධාන වෛද්‍ය කරුණු සංක්ෂිප්තව මෙහි ඉදිරිපත් කර ඇත. "
        f"ප්‍රධාන නිරීක්ෂණ: {finding_text}"
    )


def estimate_confidence(text: str) -> float:
    text_length = len(text)
    if text_length < 400:
        return 0.66
    if text_length < 1500:
        return 0.76
    return 0.86


def generate_summary_bundle(file_name: str, text: str) -> dict:
    topic = detect_topic(file_name=file_name, text=text)
    publication_year = detect_publication_year(file_name=file_name, text=text)
    english_summary, key_findings = build_english_summary(
        file_name=file_name,
        text=text,
        topic=topic,
        publication_year=publication_year,
    )
    sinhala_summary = build_sinhala_summary(topic=topic, english_summary=english_summary, key_findings=key_findings)

    return {
        "topic": topic,
        "publication_year": publication_year,
        "confidence": estimate_confidence(text),
        "key_findings": key_findings,
        "english_summary": english_summary,
        "sinhala_summary": sinhala_summary,
    }
