from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Clause(Base):
    __tablename__ = "clauses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    category = Column(String)
    risk_level = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())