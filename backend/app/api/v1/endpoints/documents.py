from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.document import (
    Document,
    DocumentCreate,
    DocumentListItem,
    DocumentListItemWithClauses,
)
from app.schemas.sentences import Sentence, SentenceLabel
from app.services.document_service import (
    create_document,
    get_documents,
    get_document,
    get_documents_with_clauses,
)
from app.services.sentence_service import (
    get_sentences_by_document,
    label_sentence as label_sentence_service,
)

print(">>> documents router LOADED")

router = APIRouter(prefix="/documents", tags=["documents"])

# -----------------------------
# 1. UPLOAD DOCUMENT
# -----------------------------
@router.post("/upload", response_model=Document)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    allowed = (".txt", ".md", ".markdown")
    if not file.filename or not any(file.filename.lower().endswith(s) for s in allowed):
        raise HTTPException(
            status_code=400,
            detail="Only plain text or markdown files (.txt, .md) are allowed",
        )

    try:
        raw = file.file.read()  # bytes
        content = raw.decode("utf-8", errors="replace")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")

    data = DocumentCreate(filename=file.filename, content=content)

    try:
        return create_document(db, data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create document: {e}")


# -----------------------------
# 2. LIST DOCUMENTS
# -----------------------------
@router.get("", response_model=list[DocumentListItemWithClauses])
def list_documents(
    search: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    db: Session = Depends(get_db),
):
    return get_documents_with_clauses(db, search=search, date_from=date_from, date_to=date_to)


# -----------------------------
# 3. GET DOCUMENT BY ID
# -----------------------------
@router.get("/{document_id}", response_model=Document)
def get_document_by_id(document_id: int, db: Session = Depends(get_db)):
    doc = get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


# -----------------------------
# 4. GET SENTENCES FOR DOCUMENT
# -----------------------------
@router.get("/{document_id}/sentences", response_model=list[Sentence])
def list_sentences(document_id: int, db: Session = Depends(get_db)):
    sentences = get_sentences_by_document(db, document_id)
    if sentences is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return sentences

@router.post("/{document_id}/sentences/{sentence_id}/label", response_model=Sentence)
def label_sentence(
    document_id: int,
    sentence_id: int,
    label: SentenceLabel,
    db: Session = Depends(get_db),
):
    updated = label_sentence_service(
        db,
        document_id,
        sentence_id,
        label.clause_type
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Sentence not found")
    return updated