from pydantic import BaseModel, Field


class SummaryResponse(BaseModel):
    id: str
    fileName: str
    fileSize: int
    fileType: str
    topic: str
    publicationYear: int | None = None
    confidence: float
    keyFindings: list[str] = Field(default_factory=list)
    englishSummary: str
    sinhalaSummary: str
    createdAt: str | None = None



class SummaryListResponse(BaseModel):
    items: list[SummaryResponse]
