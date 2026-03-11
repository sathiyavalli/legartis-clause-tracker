from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router
from app.db.database import Base, engine
from app.models import clause, document, sentence

# Initialize FastAPI app FIRST
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Backend is running"}