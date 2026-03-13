from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.clause_type import ClauseType, ClauseTypeCreate, ClauseTypeUpdate
from app.services.clause_type_service import (
    get_clause_types,
    create_clause_type,
    get_clause_type,
    update_clause_type,
    delete_clause_type,
)

print(">>> clause_types router LOADED")

router = APIRouter(prefix="/clause-types", tags=["clause_types"])


# Get all clause types
@router.get("", response_model=list[ClauseType])
def list_clause_types(db: Session = Depends(get_db)):
    """Get all available clause types."""
    return get_clause_types(db)


# Create a new clause type
@router.post("", response_model=ClauseType)
def create_clause_type_endpoint(
    clause_type_data: ClauseTypeCreate,
    db: Session = Depends(get_db)
):
    """Create a new clause type."""
    return create_clause_type(db, clause_type_data)


# Get a specific clause type
@router.get("/{clause_type_id}", response_model=ClauseType)
def get_clause_type_endpoint(
    clause_type_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific clause type by ID."""
    return get_clause_type(db, clause_type_id)


# Update a clause type
@router.put("/{clause_type_id}", response_model=ClauseType)
def update_clause_type_endpoint(
    clause_type_id: int,
    clause_type_data: ClauseTypeUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing clause type."""
    return update_clause_type(db, clause_type_id, clause_type_data)


# Delete a clause type
@router.delete("/{clause_type_id}")
def delete_clause_type_endpoint(
    clause_type_id: int,
    db: Session = Depends(get_db)
):
    """Delete a clause type."""
    return delete_clause_type(db, clause_type_id)
