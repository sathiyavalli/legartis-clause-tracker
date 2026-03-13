from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class Sentence(Base):
    __tablename__ = "sentences"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    clause_type = Column(String(255), nullable=True)  # e.g. "Limitation of Liability", "Non-Compete"

    document = relationship("Document", back_populates="sentences")
