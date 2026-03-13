from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router
from app.db.database import Base, engine, SessionLocal
from app.models import clause, clause_type, document, sentence
from app.models.clause_type import ClauseType

# Initialize FastAPI app FIRST
app = FastAPI()

# CORS middleware - allow localhost on any port for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://localhost",
        "http://127.0.0.1:4200",
        "http://127.0.0.1",
    ],
    allow_origin_regex=r"http://localhost:\d+",  # Allow any localhost port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed default clause types
def seed_default_clause_types():
    db = SessionLocal()
    try:
        # Check if clause types already exist
        existing_count = db.query(ClauseType).count()
        if existing_count == 0:
            default_clauses = [
                ClauseType(name="Limitation of Liability"),
                ClauseType(name="Termination for Convenience"),
                ClauseType(name="Non-Compete"),
                ClauseType(name="Confidentiality"),
                ClauseType(name="Indemnification"),
                ClauseType(name="Governing Law"),
                ClauseType(name="Force Majeure"),
                ClauseType(name="Warranties"),
                ClauseType(name="Insurance"),
                ClauseType(name="Other"),
            ]
            db.add_all(default_clauses)
            db.commit()
    finally:
        db.close()

# Seed on startup
seed_default_clause_types()

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Backend is running"}