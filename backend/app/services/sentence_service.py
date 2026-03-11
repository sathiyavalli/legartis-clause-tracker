from sqlalchemy.orm import Session
from app.models.sentence import Sentence


def get_sentences_by_document(db: Session, document_id: int) -> list[Sentence]:
    return (
        db.query(Sentence)
        .filter(Sentence.document_id == document_id)
        .order_by(Sentence.id)
        .all()
    )


def get_sentence(db: Session, document_id: int, sentence_id: int) -> Sentence | None:
    return (
        db.query(Sentence)
        .filter(Sentence.id == sentence_id, Sentence.document_id == document_id)
        .first()
    )


def label_sentence(
    db: Session, document_id: int, sentence_id: int, clause_type: str | None
) -> Sentence | None:
    s = get_sentence(db, document_id, sentence_id)
    if not s:
        return None
    s.clause_type = clause_type
    db.commit()
    db.refresh(s)
    return s
