from pydantic import BaseModel
from datetime import datetime


class ClauseTypeCreate(BaseModel):
    name: str


class ClauseTypeUpdate(BaseModel):
    name: str


class ClauseType(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
