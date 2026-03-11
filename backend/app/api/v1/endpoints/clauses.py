from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.clause import Clause, ClauseCreate
from app.services.clause_service import (
    get_clauses,
    create_clause,
    get_clause,
    update_clause,
    delete_clause,
)

router = APIRouter(prefix="/clauses", tags=["clauses"])

@router.get("", response_model=list[Clause])
def list_clauses(db: Session = Depends(get_db)):
    return get_clauses(db)


@router.post("", response_model=Clause)
def create_clause_endpoint(clause_data: ClauseCreate, db: Session = Depends(get_db)):
    return create_clause(db, clause_data)


@router.get("/{clause_id}", response_model=Clause)
def get_clause_by_id(clause_id: int, db: Session = Depends(get_db)):
    clause = get_clause(db, clause_id)
    if not clause:
        raise HTTPException(status_code=404, detail="Clause not found")
    return clause


@router.put("/{clause_id}", response_model=Clause)
def update_clause_by_id(clause_id: int, clause: ClauseCreate, db: Session = Depends(get_db)):
    updated = update_clause(db, clause_id, clause)
    if not updated:
        raise HTTPException(status_code=404, detail="Clause not found")
    return updated


@router.delete("/{clause_id}")
def delete_clause_by_id(clause_id: int, db: Session = Depends(get_db)):
    deleted = delete_clause(db, clause_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Clause not found")
    return {"message": "Clause deleted successfully"}