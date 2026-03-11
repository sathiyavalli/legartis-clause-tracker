from sqlalchemy.orm import Session
from app.models.clause import Clause
from app.schemas.clause import ClauseCreate

def get_clauses(db: Session):
    return db.query(Clause).all()

def create_clause(db: Session, clause: ClauseCreate):
    db_clause = Clause(**clause.model_dump())
    db.add(db_clause)
    db.commit()
    db.refresh(db_clause)
    return db_clause

def get_clause(db: Session, clause_id: int):
    return db.query(Clause).filter(Clause.id == clause_id).first()

def update_clause(db: Session, clause_id: int, clause_data: ClauseCreate):
    clause = get_clause(db, clause_id)
    if not clause:
        return None
    for key, value in clause_data.model_dump().items():
        setattr(clause, key, value)
    db.commit()
    db.refresh(clause)
    return clause

def delete_clause(db: Session, clause_id: int):
    clause = get_clause(db, clause_id)
    if not clause:
        return None
    db.delete(clause)
    db.commit()
    return True