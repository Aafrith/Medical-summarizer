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
    imageDetails: list[str] = Field(default_factory=list)
    tableDetails: list[str] = Field(default_factory=list)
    sinhalaImageDetails: list[str] = Field(default_factory=list)
    sinhalaTableDetails: list[str] = Field(default_factory=list)
    createdAt: str | None = None



class SummaryListResponse(BaseModel):
    items: list[SummaryResponse]
