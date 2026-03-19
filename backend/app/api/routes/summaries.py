from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_settings
from app.core.database import get_database
from app.core.deps import get_current_user
from app.schemas.summary import SummaryListResponse, SummaryResponse
from app.services.file_extractor import extract_text_from_upload
from app.services.summary_engine import generate_summary_bundle
from app.utils.mongo import serialize_summary

router = APIRouter(prefix="/summaries", tags=["Summaries"])
settings = get_settings()


@router.post("/upload", response_model=SummaryResponse)
async def upload_and_summarize(
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> SummaryResponse:
    text_content, file_type, file_size = await extract_text_from_upload(file, settings.max_upload_size_mb)
    summary_bundle = generate_summary_bundle(file_name=file.filename or "document", text=text_content)

    summary_doc = {
        "user_id": current_user["_id"],
        "file_name": file.filename or "document",
        "file_size": file_size,
        "file_type": file_type,
        "topic": summary_bundle["topic"],
        "publication_year": summary_bundle["publication_year"],
        "confidence": summary_bundle["confidence"],
        "key_findings": summary_bundle["key_findings"],
        "english_summary": summary_bundle["english_summary"],
        "sinhala_summary": summary_bundle["sinhala_summary"],
        "created_at": datetime.now(timezone.utc),
    }

    inserted = await db.summaries.insert_one(summary_doc)
    saved = await db.summaries.find_one({"_id": inserted.inserted_id})

    return SummaryResponse(**serialize_summary(saved))


@router.get("/history", response_model=SummaryListResponse)
async def get_summary_history(
    limit: int = 40,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> SummaryListResponse:
    safe_limit = max(1, min(limit, 120))

    cursor = db.summaries.find({"user_id": current_user["_id"]}).sort("created_at", -1).limit(safe_limit)
    items = [serialize_summary(item) async for item in cursor]

    return SummaryListResponse(items=[SummaryResponse(**item) for item in items])


@router.get("/{summary_id}", response_model=SummaryResponse)
async def get_summary_by_id(
    summary_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> SummaryResponse:
    if not ObjectId.is_valid(summary_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid summary identifier.")

    summary = await db.summaries.find_one({"_id": ObjectId(summary_id), "user_id": current_user["_id"]})

    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found.")

    return SummaryResponse(**serialize_summary(summary))


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
async def clear_summary_history(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> None:
    await db.summaries.delete_many({"user_id": current_user["_id"]})


@router.delete("/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_summary(
    summary_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
) -> None:
    if not ObjectId.is_valid(summary_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid summary identifier.")

    deletion = await db.summaries.delete_one({"_id": ObjectId(summary_id), "user_id": current_user["_id"]})

    if deletion.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found.")
