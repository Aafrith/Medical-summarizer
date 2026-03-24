from datetime import datetime
from typing import Any


def to_iso(value: datetime | None) -> str | None:
    if not value:
        return None
    return value.isoformat()


def serialize_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(user["_id"]),
        "fullName": user["full_name"],
        "email": user["email"],
        "role": user.get("role", "Clinical Reviewer"),
        "createdAt": to_iso(user.get("created_at")),
    }


def serialize_summary(summary: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(summary["_id"]),
        "fileName": summary["file_name"],
        "fileSize": summary["file_size"],
        "fileType": summary["file_type"],
        "topic": summary["topic"],
        "publicationYear": summary.get("publication_year"),
        "confidence": summary["confidence"],
        "keyFindings": summary.get("key_findings", []),
        "englishSummary": summary["english_summary"],
        "sinhalaSummary": summary["sinhala_summary"],
        "imageDetails": summary.get("image_details", []),
        "tableDetails": summary.get("table_details", []),
        "createdAt": to_iso(summary.get("created_at")),
    }

