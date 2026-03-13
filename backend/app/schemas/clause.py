from pydantic import BaseModel, ConfigDict

class ClauseBase(BaseModel):
    title: str
    description: str | None = None
    category: str | None = None
    risk_level: str | None = None

class ClauseCreate(ClauseBase):
    pass

class Clause(ClauseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int