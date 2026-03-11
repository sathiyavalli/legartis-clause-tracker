from pydantic import BaseModel, ConfigDict


class SentenceBase(BaseModel):
    text: str
    clause_type: str | None = None


class Sentence(SentenceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    document_id: int


class SentenceLabel(BaseModel):
    clause_type: str | None = None
