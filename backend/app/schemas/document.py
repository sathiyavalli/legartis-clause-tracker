from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    filename: str


class DocumentCreate(DocumentBase):
    content: str = ""


class Document(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    uploaded_at: datetime
    content: str = ""


class DocumentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    uploaded_at: datetime


class DocumentListItemWithClauses(DocumentListItem):
    """Document list item with distinct clause types from its sentences."""

    clause_types: list[str] = []
