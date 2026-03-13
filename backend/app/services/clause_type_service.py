from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.clause_type import ClauseType as ClauseTypeModel
from app.schemas.clause_type import ClauseTypeCreate, ClauseTypeUpdate, ClauseType


def create_clause_type(db: Session, clause_type_data: ClauseTypeCreate) -> ClauseType:
    """Create a new clause type."""
    try:
        db_clause_type = ClauseTypeModel(name=clause_type_data.name.strip())
        db.add(db_clause_type)
        db.commit()
        db.refresh(db_clause_type)
        return db_clause_type
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Clause type '{clause_type_data.name}' already exists"
        )


def get_clause_types(db: Session) -> list[ClauseType]:
    """Get all clause types."""
    return db.query(ClauseTypeModel).order_by(ClauseTypeModel.name).all()


def get_clause_type(db: Session, clause_type_id: int) -> ClauseType:
    """Get a specific clause type by ID."""
    db_clause_type = db.query(ClauseTypeModel).filter(
        ClauseTypeModel.id == clause_type_id
    ).first()
    if not db_clause_type:
        raise HTTPException(
            status_code=404,
            detail=f"Clause type with ID {clause_type_id} not found"
        )
    return db_clause_type


def update_clause_type(db: Session, clause_type_id: int, clause_type_data: ClauseTypeUpdate) -> ClauseType:
    """Update an existing clause type."""
    db_clause_type = get_clause_type(db, clause_type_id)
    
    try:
        db_clause_type.name = clause_type_data.name.strip()
        db.commit()
        db.refresh(db_clause_type)
        return db_clause_type
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Clause type '{clause_type_data.name}' already exists"
        )


def delete_clause_type(db: Session, clause_type_id: int) -> dict:
    """Delete a clause type."""
    db_clause_type = get_clause_type(db, clause_type_id)
    db.delete(db_clause_type)
    db.commit()
    return {"message": f"Clause type '{db_clause_type.name}' deleted successfully"}
