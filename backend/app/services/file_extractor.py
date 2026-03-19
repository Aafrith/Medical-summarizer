import io
from pathlib import Path

from docx import Document
from fastapi import HTTPException, UploadFile, status
from PyPDF2 import PdfReader

ALLOWED_EXTENSIONS = {"pdf", "txt", "doc", "docx"}


def _extract_extension(file_name: str) -> str:
    return Path(file_name).suffix.lower().replace(".", "")


def _decode_text(content: bytes) -> str:
    for encoding in ("utf-8", "latin-1", "cp1252"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue

    return content.decode("utf-8", errors="ignore")


def _extract_pdf_text(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    text_parts = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(text_parts).strip()


def _extract_docx_text(content: bytes) -> str:
    doc = Document(io.BytesIO(content))
    return "\n".join(paragraph.text for paragraph in doc.paragraphs if paragraph.text).strip()


async def extract_text_from_upload(upload_file: UploadFile, max_size_mb: int) -> tuple[str, str, int]:
    extension = _extract_extension(upload_file.filename or "")

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format. Allowed formats: PDF, TXT, DOC, DOCX.",
        )

    content = await upload_file.read()
    file_size = len(content)

    if file_size > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds {max_size_mb} MB limit.",
        )

    text_content = ""

    try:
        if extension == "txt":
            text_content = _decode_text(content)
        elif extension == "pdf":
            text_content = _extract_pdf_text(content)
        elif extension == "docx":
            text_content = _extract_docx_text(content)
        elif extension == "doc":
            # Legacy DOC support without external converters is limited.
            text_content = _decode_text(content)
    except Exception:
        text_content = ""

    if not text_content.strip():
        text_content = f"Document content could not be fully extracted for {upload_file.filename}."

    return text_content, extension, file_size
