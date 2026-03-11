import re
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.sentence import Sentence
from app.schemas.document import DocumentCreate


def _extract_sentences(text: str) -> list[str]:
    """Split text into sentences (by . ! ?), strip whitespace, skip empty."""
    if not text or not text.strip():
        return []
    # Split on sentence-ending punctuation followed by space or end
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def create_document(db: Session, data: DocumentCreate) -> Document:
    doc = Document(filename=data.filename, content=data.content)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    for text in _extract_sentences(data.content):
        s = Sentence(document_id=doc.id, text=text)
        db.add(s)
    db.commit()
    db.refresh(doc)
    return doc


def get_documents(db: Session, search: str | None = None) -> list[Document]:
    q = db.query(Document)
    if search and search.strip():
        term = f"%{search.strip()}%"
        q = q.filter(
            Document.filename.ilike(term) | Document.content.ilike(term)
        )
    return q.order_by(Document.uploaded_at.desc()).all()


def get_document(db: Session, document_id: int) -> Document | None:
    return db.query(Document).filter(Document.id == document_id).first()
