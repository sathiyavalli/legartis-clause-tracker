from fastapi import APIRouter
from app.api.v1.endpoints import documents, clauses, clause_types

api_router = APIRouter()

api_router.include_router(documents.router)
api_router.include_router(clauses.router)
api_router.include_router(clause_types.router)