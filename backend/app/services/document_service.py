import re
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func

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


def get_documents_with_clauses(
    db: Session,
    search: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> list[dict]:
    """
    Return list of documents with distinct clause_types per document.
    Each item: id, filename, uploaded_at, clause_types (list of str).
    """
    q = db.query(Document).order_by(Document.uploaded_at.desc())
    if search and search.strip():
        term = f"%{search.strip()}%"
        q = q.outerjoin(Sentence).filter(
            (Document.filename.ilike(term))
            | (Document.content.ilike(term))
            | (Sentence.clause_type.ilike(term))
        ).distinct()
    if date_from and date_from.strip():
        try:
            dt = datetime.strptime(date_from.strip()[:10], "%Y-%m-%d")
            q = q.filter(func.date(Document.uploaded_at) >= dt.date())
        except (ValueError, TypeError):
            pass
    if date_to and date_to.strip():
        try:
            dt = datetime.strptime(date_to.strip()[:10], "%Y-%m-%d")
            q = q.filter(func.date(Document.uploaded_at) <= dt.date())
        except (ValueError, TypeError):
            pass
    docs = q.all()
    result = []
    for doc in docs:
        clause_types = (
            db.query(Sentence.clause_type)
            .filter(
                Sentence.document_id == doc.id,
                Sentence.clause_type.isnot(None),
                Sentence.clause_type != "",
            )
            .distinct()
            .all()
        )
        result.append(
            {
                "id": doc.id,
                "filename": doc.filename,
                "uploaded_at": doc.uploaded_at,
                "clause_types": [c[0] for c in clause_types],
            }
        )
    return result
