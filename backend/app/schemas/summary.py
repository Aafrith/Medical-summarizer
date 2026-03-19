from pydantic import BaseModel


class SummaryResponse(BaseModel):
    id: str
    fileName: str
    fileSize: int
    fileType: str
    topic: str
    publicationYear: int | None = None
    confidence: float
    keyFindings: list[str]
    englishSummary: str
    sinhalaSummary: str
    createdAt: str | None = None


class SummaryListResponse(BaseModel):
    items: list[SummaryResponse]
