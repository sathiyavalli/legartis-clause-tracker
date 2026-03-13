# FastAPI Contract Clause Tracker - Backend Architecture Analysis

**Date:** March 13, 2026  
**Framework:** FastAPI + SQLAlchemy + Pydantic  
**Database:** SQLite (development)

---

## Executive Summary

The backend architecture demonstrates **solid foundational structure with good separation of concerns**, but has several areas requiring attention for production readiness. The recently added `clause_type` feature shows consistent implementation patterns but reveals gaps in error handling, documentation, and database relationship definition.

### Overall Assessment
- **Strengths:** Clean layering, consistent code structure, proper CRUD patterns
- **Concerns:** Missing foreign key relationships, inadequate error handling, lack of docstrings, type hint inconsistencies
- **Risk Level:** MEDIUM - Functional but needs refinement before production

---

## 1. Separation of Concerns ✅ (GOOD)

### Structure
The architecture follows a clean three-tier pattern:
```
API Layer (endpoints/) 
  ↓ (Depends on)
Service Layer (services/)
  ↓ (Operates on)
Data Layer (models/) + Validation (schemas/)
  ↓ (Uses)
Database Layer (db/)
```

### Assessment

**✅ Strengths:**
- **Clear separation:** Models, schemas, services, and endpoints are properly isolated
- **Dependency injection:** Uses FastAPI's `Depends(get_db)` consistently across all endpoints
- **Schema-based validation:** Pydantic schemas handle request/response validation separately from ORM models
- **Service layer:** Business logic centralized in service functions
- **Database abstraction:** Session management properly isolated in `db/session.py`

**⚠️ Observations:**
- **Config layer:** `app/core/config.py` is empty - configuration is hardcoded in `main.py` and `database.py`
- **No explicit repository pattern:** Services query the database directly; could benefit from repository abstraction for testability

### Recommendations
```python
# Move configuration to core/config.py
# Example structure:
class Settings:
    DATABASE_URL: str = "sqlite:///./clause_tracker.db"
    CORS_ORIGINS: list[str] = ["http://localhost:4200"]
    API_V1_STR: str = "/api/v1"
```

---

## 2. Design Patterns ✅ (GOOD with gaps)

### FastAPI Best Practices

**✅ Well-implemented:**
- **Dependency injection:** Correct use of `Depends(get_db)` for session management
- **Router separation:** API endpoints properly organized by resource
- **Route prefixes:** Using `prefix="/documents"` in APIRouter
- **Response models:** All endpoints specify `response_model` for automatic validation
- **HTTP methods:** Correct RESTful operations (POST for create, PUT for update, GET for read, DELETE for delete)
- **Status codes:** Implicit 200/201 for success, 404/400 for errors

**⚠️ Missing FastAPI patterns:**
- **No status code specification:** Endpoints should explicitly declare status codes
  ```python
  @router.post("", response_model=ClauseType, status_code=201)  # Missing
  def create_clause_type(...):
  ```
- **No explicit exception documentation:** Endpoints don't document possible errors
- **No OpenAPI tags metadata:** `tags` are specified but no detailed descriptions

### SQLAlchemy Best Practices

**⚠️ Critical gap - Incomplete relationship definitions:**

The `Sentence` model has a **foreign key to `Clause`** semantically missing:
```python
# Current: sentence.clause_type is just a STRING
class Sentence(Base):
    clause_type = Column(String(255), nullable=True)  # String, not FK

# Should be:
class Sentence(Base):
    clause_type_id = Column(Integer, ForeignKey("clause_types.id"), nullable=True)
    clause_type = relationship("ClauseType", back_populates="sentences")
```

**⚠️ Missing bidirectional relationships:**
- `ClauseType` has no `back_populates` relationship to `Sentence`
- Results in inconsistent relationship navigation

**✅ Good patterns:**
- Cascade delete on `Document` → `Sentence` (prevents orphaned sentences)
- Proper `ondelete="CASCADE"` on foreign keys
- Good use of `primary_key=True, index=True`

---

## 3. Error Handling ⚠️ (NEEDS IMPROVEMENT)

### Current Implementation

**❌ Inconsistent error handling:**

| Service | Error Handling | Status Codes |
|---------|---|---|
| `clause_type_service.py` | ✅ Catches `IntegrityError`, raises HTTPException | 400, 404 |
| `clause_service.py` | ❌ None - no error handling | Silent failures |
| `document_service.py` | ⚠️ Partial - regex split might fail silently | No explicit validation |
| `sentence_service.py` | ❌ None - returns None instead of raising | Magic None values |

**Critical issues:**

1. **`clause_service.py` - No validation:**
   ```python
   def get_clause(db: Session, clause_id: int):
       return db.query(Clause).filter(Clause.id == clause_id).first()  # Returns None silently
   
   # Better:
   def get_clause(db: Session, clause_id: int):
       clause = db.query(Clause).filter(Clause.id == clause_id).first()
       if not clause:
           raise HTTPException(status_code=404, detail="Clause not found")
       return clause
   ```

2. **`sentence_service.py` - Returns None instead of raising:**
   ```python
   def get_sentence(...) -> Sentence | None:
       return db.query(...).first()  # Could return None
   
   # Endpoint must check:
   if not updated:
       raise HTTPException(status_code=404, ...)  # Inconsistent pattern
   ```

3. **`document_service.py` - Silent failures on sentence extraction:**
   ```python
   def _extract_sentences(text: str) -> list[str]:
       if not text or not text.strip():
           return []  # Empty list - client can't distinguish error from no sentences
   ```

4. **Missing exception specification:**
   ```python
   # Endpoints don't declare which exceptions they raise
   @router.post("")
   def create_clause_type(...):
       return create_clause_type(db, clause_type_data)
       # Could raise: HTTPException (400, 404) but not documented
   ```

### Recommendations

```python
# 1. Create custom exception classes
class ClauseTrackerException(Exception):
    pass

class ResourceNotFound(ClauseTrackerException):
    pass

class ValidationError(ClauseTrackerException):
    pass

# 2. Use consistent error handling pattern
# In service layer:
if not resource:
    raise HTTPException(status_code=404, detail=f"{resource_type} not found")

# 3. Document HTTP exceptions in endpoints
from fastapi import responses
from typing import Union

@router.get("/{id}")
def get_item(id: int) -> ItemSchema | responses.JSONResponse:
    """Get item by ID.
    
    Raises:
        404: Item not found
    """
    ...
```

---

## 4. Code Standards ⚠️ (INCONSISTENT)

### Naming Conventions

**✅ Good:**
- Consistent snake_case for variables and functions
- Descriptive names: `get_documents_with_clauses`, `label_sentence`
- Resource names clearly indicate operations: `list_`, `get_`, `create_`, `update_`, `delete_`

**⚠️ Inconsistencies:**
- **Schema model duplication:** `Clause` base class vs `ClauseCreate` (minor)
- **Endpoint naming:** `list_clause_types` vs `create_clause_type_endpoint` (mixing patterns)
- **Service module vs endpoint naming:** Inconsistent - some endpoints reuse function names exactly, others add `_endpoint` suffix

### Docstrings and Comments

**❌ Critical gap - Almost no docstrings:**

```
File                          | Functions | Docstrings | Coverage
----------------------------------------------------------
clause_service.py            | 5         | 0          | 0%
clause_type_service.py        | 5         | 5          | 100% ✅
document_service.py          | 5         | 0          | 0%
sentence_service.py          | 3         | 0          | 0%
clauses.py endpoint          | 5         | 0          | 0%
clause_types.py endpoint     | 5         | 5          | 100% ✅
documents.py endpoint        | 5         | 5          | 100% ✅
```

**Only `clause_type_service.py` has comprehensive docstrings:**
```python
def create_clause_type(db: Session, clause_type_data: ClauseTypeCreate) -> ClauseType:
    """Create a new clause type."""  # ✅ Good
```

**Missing from others:**
```python
# Bad example from sentence_service.py
def get_sentence(db: Session, document_id: int, sentence_id: int) -> Sentence | None:
    return (...)  # No docstring explaining return could be None
```

### Type Hints

**✅ Mostly good:**
- Consistent use of Python 3.10+ union syntax (`str | None` instead of `Optional[str]`)
- Function parameters properly typed
- Return types specified

**⚠️ Areas for improvement:**
- Return type `Sentence | None` should raise exception instead (see error handling section)
- List types use modern syntax `list[Type]` consistently ✅
- Missing type hints on some variables in endpoints
- Dict types in `get_documents_with_clauses` returns `list[dict]` instead of proper type hint

### Code Organization

**✅ Good:**
- Files are <200 lines (short and focused)
- Related functions grouped logically
- Clear import statements

**⚠️ Minor issues:**
- Debug print statements in production code:
  ```python
  print(">>> clause_types router LOADED")  # Should remove or use logging
  print(">>> documents router LOADED")
  ```
- Unused imports: `from sqlalchemy.exc import IntegrityError` in models files but not used

---

## 5. CRUD Operations ✅ (MOSTLY GOOD)

### Clause Type Operations (Newly Added)

**✅ Fully implemented with best practices:**

| Operation | Implemented | Status |
|-----------|------------|--------|
| CREATE | `create_clause_type()` | ✅ Full validation |
| READ | `get_clause_types()`, `get_clause_type()` | ✅ |
| UPDATE | `update_clause_type()` | ✅ Duplicate check |
| DELETE | `delete_clause_type()` | ✅ |

**Strengths:**
- Proper conflict detection (IntegrityError handling)
- Input validation (`.strip()`)
- Refresh on commit to return updated values
- Ordered results (`.order_by()`)

### Clause Operations

**⚠️ Missing validation:**

| Operation | Gap |
|-----------|-----|
| CREATE | No validation in service; endpoint doesn't check existence |
| READ by ID | Returns None; endpoint handles, but inconsistent |
| UPDATE | Returns None on failure instead of raising |
| DELETE | Returns None on failure instead of raising |

### Document Operations

**✅ Well-implemented:**
- Upload validates file type (`.txt`, `.md` only)
- Automatic sentence extraction on create
- Search functionality supports filename and content
- Date range filtering

**⚠️ Minor issues:**
- Sentence extraction regex could fail on edge cases (Unicode punctuation)
- Search uses `ilike()` without escaping special SQL characters (injection unlikely but not ideal)

### Sentence Operations

**✅ Basic CRUD:**
- Label assignment works correctly
- Filters by both document_id and sentence_id for safety

**⚠️ No batch operations:**
- Can only label one sentence at a time
- No bulk update endpoint

### Summary Table

```
Resource     | Create | Read | Update | Delete | Status
--------|--------|------|--------|--------|--------
ClauseType   | ✅    | ✅   | ✅     | ✅     | COMPLETE
Clause       | ✅    | ⚠️   | ⚠️     | ⚠️     | INCOMPLETE
Document     | ✅    | ✅   | ❌     | ❌     | NO UPDATE/DELETE
Sentence     | ❌    | ✅   | ✅     | ❌     | PARTIAL
```

---

## 6. Database Integrity ⚠️ (CRITICAL ISSUES)

### Current Relationships

```
Documents
    ├── id (PK)
    └── sentences (1:N)
        ├── document_id (FK: documents.id) ✅
        └── clause_type (STRING) ❌ Should be FK
        
ClauseTypes
    ├── id (PK)
    ├── name (Unique)
    └── [No reverse relationship]
    
Clauses
    ├── id (PK)
    ├── title
    ├── category
    └── [Never related to ClauseType!]
```

### Critical Issues

**❌ Issue 1: Semantic mismatch in Sentence model**

The `Sentence.clause_type` field stores **names as strings** instead of foreign keys:

```python
# Current (WRONG):
class Sentence(Base):
    clause_type = Column(String(255))  # "Limitation of Liability"

# Problems:
# 1. No referential integrity - can insert invalid clause type names
# 2. Updating clause type name breaks existing sentences
# 3. Can't query sentences grouped by clause type via relationships
# 4. No cascade behavior - deleting a clause type leaves orphaned sentences
```

**✅ Better approach:**
```python
# Sentences should reference ClauseTypes via FK
class Sentence(Base):
    __tablename__ = "sentences"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    clause_type_id = Column(Integer, ForeignKey("clause_types.id", ondelete="SET NULL"), nullable=True)
    text = Column(Text, nullable=False)
    
    # Relationships
    document = relationship("Document", back_populates="sentences")
    clause_type = relationship("ClauseType", back_populates="sentences")

class ClauseType(Base):
    __tablename__ = "clause_types"
    # ...
    sentences = relationship("Sentence", back_populates="clause_type")
```

**❌ Issue 2: Unused Clause model**

The `Clause` model exists but is **never used in labeling**:
```python
# clauses.py exists with CRUD operations
# But Sentence.clause_type is just a STRING, not related to Clause!

# Questions:
# 1. Are Clauses meant to be templates/definitions? (Like ClauseTypes?)
# 2. Are Clauses extracted from documents?
# 3. What's the difference between Clause and ClauseType?
```

**Recommendation:** Either:
- Remove `Clause` model if `ClauseType` is sufficient
- OR clarify relationship: `Clause` = extracted clause instances, `ClauseType` = clause categories
- OR create proper `Clause` ← `ClauseType` relationship

**❌ Issue 3: Missing Cascading Constraints**

```python
# ClauseType has NO cascade for deletion
class ClauseType(Base):
    # If deleted with orphaned sentences using this type:
    # - Sentences retain dangling references (strings are OK, but semantically wrong)

# Clauses have NO relationships at all
class Clause(Base):
    # Only PK - completely isolated from Document/Sentence/ClauseType
```

**✅ Issue 4: Missing indexes on frequently queried fields**

```python
# Good:
id = Column(Integer, primary_key=True, index=True)
name = Column(String(255), unique=True, nullable=False, index=True)

# Missing:
# - Sentence.document_id should have index for efficient filtering
# - Document queries by filename would benefit from index
```

### Recommended Schema Changes

```sql
-- Current:
CREATE TABLE sentences (
    id INTEGER PRIMARY KEY,
    document_id INTEGER FOREIGN KEY (CASCADE),
    text TEXT,
    clause_type VARCHAR(255)  -- ❌ String value, no constraint
);

-- Proposed:
CREATE TABLE sentences (
    id INTEGER PRIMARY KEY,
    document_id INTEGER FOREIGN KEY (CASCADE),
    clause_type_id INTEGER FOREIGN KEY (SET NULL),
    text TEXT
);
CREATE INDEX idx_sentence_clause_type ON sentences(clause_type_id);
```

---

## 7. Input Validation ✅ (GOOD)

### Pydantic Schema Validation

**✅ Strengths:**
- Request/response schemas properly separated from ORM models
- All schemas use `ConfigDict(from_attributes=True)` or `Config` class for ORM mapping
- Type hints enforce strict validation

**Examples of good validation:**
```python
# ClauseTypeCreate enforces non-empty string
class ClauseTypeCreate(BaseModel):
    name: str  # Non-nullable, will validate non-empty in service

# DocumentCreate allows optional content
class DocumentCreate(DocumentBase):
    content: str = ""  # Sensible default

# Sentence schema with optional clause_type
class SentenceBase(BaseModel):
    text: str
    clause_type: str | None = None  # Proper nullable semantics
```

### Validation at Different Layers

**❌ Issue: Weak input sanitization**

```python
# In clause_type_service.py:
db_clause_type = ClauseTypeModel(name=clause_type_data.name.strip())  # ✅ Good

# But in document_service.py:
doc = Document(filename=data.filename, content=data.content)  # No stripping/validation
# Filename could have path traversal risks: "../../../etc/passwd"

# Better:
import os
safe_filename = os.path.basename(data.filename)  # Remove path components
```

**❌ Issue: File upload validation is weak**

```python
# Current:
if not file.filename or not any(file.filename.lower().endswith(s) for s in allowed):
    raise HTTPException(status_code=400, detail="...")

# Problems:
# - No file size limit (could upload huge files)
# - No check for actual MIME type (only extension)
# - No max filename length

# Better:
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {"txt", "md", "markdown"}
MAX_FILENAME_LENGTH = 255

if file.size > MAX_FILE_SIZE:
    raise HTTPException(status_code=413, detail="File too large")

ext = file.filename.split(".")[-1].lower()
if ext not in ALLOWED_EXTENSIONS:
    raise HTTPException(status_code=400, detail="Invalid file type")
```

### Validation Coverage

| Field | Validation | Level |
|-------|-----------|-------|
| `ClauseType.name` | Unique + `.strip()` | ✅ Good |
| `Document.filename` | Extension only | ⚠️ Weak |
| `Sentence.text` | None | ⚠️ Weak |
| `Clause.title` | None | ⚠️ Weak |

---

## 8. Default Data / Seeding ✅ (GOOD)

### Current Implementation

**In `main.py`:**
```python
def seed_default_clause_types():
    db = SessionLocal()
    try:
        existing_count = db.query(ClauseType).count()
        if existing_count == 0:
            default_clauses = [
                ClauseType(name="Limitation of Liability"),
                ClauseType(name="Termination for Convenience"),
                # ... 8 more types
            ]
            db.add_all(default_clauses)
            db.commit()
    finally:
        db.close()

seed_default_clause_types()
```

**✅ Strengths:**
- Runs on startup automatically
- Idempotent (checks if already seeded)
- Clean list of 10 common clause types
- Proper session cleanup

**⚠️ Areas for improvement:**

1. **No seed for other models:**
   - No default `Clause` entries (if they're meant to be templates)
   - Migration-friendly approach would be better

2. **Limited extensibility:**
   ```python
   # Better approach using config:
   from app.core.config import DEFAULT_CLAUSE_TYPES
   
   def seed_default_clause_types():
       for clause_name in DEFAULT_CLAUSE_TYPES:
           if not db.query(ClauseType).filter(ClauseType.name == clause_name).first():
               db.add(ClauseType(name=clause_name))
       db.commit()
   ```

3. **No Alembic migrations:**
   - Currently uses `Base.metadata.create_all()`
   - Should use `alembic` for migrations in production
   - No version tracking for schema changes

---

## 9. Dependencies & Configuration ⚠️ (INCOMPLETE)

### Current State

**✅ Properly configured:**
- CORS middleware for development (all localhost ports allowed)
- Database dependency injection via `get_db()`
- SQLAlchemy session management with proper cleanup

**❌ Missing from `core/config.py`:**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./clause_tracker.db"
    
    # API
    API_V1_STR: str = "/api/v1"
    API_TITLE: str = "Contract Clause Tracker"
    API_VERSION: str = "1.0.0"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ]
    
    # Security
    SECRET_KEY: str = "dev-key-change-in-production"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### CORS Configuration Issues

```python
# Current in main.py:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://localhost",
        "http://127.0.0.1:4200",
        "http://127.0.0.1",
    ],
    allow_origin_regex=r"http://localhost:\d+",  # Very permissive!
    allow_credentials=True,  # Dangerous with wildcard origins
    allow_methods=["*"],      # Allow ALL methods
    allow_headers=["*"],      # Allow ALL headers
)

# Problems:
# 1. Development config hardcoded (fine for dev, not production)
# 2. Allow all methods/headers reduces security
# 3. allow_credentials with broad origins is risky

# Production-safe approach:
CORS_ORIGINS = ["https://yourdomain.com"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "DELETE"]
CORS_ALLOW_HEADERS = ["content-type", "authorization"]
```

### Missing Dependencies

**Not configured:**
- ❌ Logging (uses `print()` statements)
- ❌ Request/response compression
- ❌ Rate limiting
- ❌ Request IDs for tracing
- ❌ Health check endpoint
- ❌ Metrics/monitoring

**Suggested additions:**
```python
from fastapi import log
import logging

# Setup logging instead of print()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/health")
def health_check():
    return {"status": "ok"}
```

---

## 10. Integration of ClauseType Feature ✅ (CONSISTENT but with gaps)

### Integration Assessment

**✅ Strengths:**

1. **Comprehensive CRUD:** All five operations properly implemented
2. **Consistent error handling:** Better than other services
3. **Good docstrings:** Only service with full documentation
4. **Proper endpoint routing:** Included in API router
5. **Validation:** Duplicate checking with IntegrityError

**⚠️ Gaps:**

1. **Not connected to Sentence model:**
   ```python
   # Sentence still uses string:
   class Sentence(Base):
       clause_type = Column(String(255))  # Should be FK to ClauseType
   
   # So creating a ClauseType doesn't affect existing labeling!
   ```

2. **No validation that provided clause_type names exist:**
   ```python
   # In documents.py, when labeling:
   updated = label_sentence_service(
       db,
       document_id,
       sentence_id,
       label.clause_type  # Could be any string, not validated against ClauseTypes
   )
   ```

3. **No feature flag consistency:**
   - ClauseType fully implemented (100%)
   - Clause still disconnected (integration unclear)
   - Relationship between features undefined

### Recommended Integration Improvements

```python
# 1. Add migrations for schema change:
# alembic init -c alembic.ini alembic
# alembic revision --autogenerate -m "Add clause_type FK to sentences"

# 2. Validate clause_type in label endpoint:
@router.post("/{document_id}/sentences/{sentence_id}/label")
def label_sentence(
    document_id: int,
    sentence_id: int,
    label: SentenceLabel,
    db: Session = Depends(get_db),
):
    # Validate that clause_type exists if provided
    if label.clause_type:
        clause_type = db.query(ClauseType).filter(
            ClauseType.name == label.clause_type
        ).first()
        if not clause_type:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid clause type: {label.clause_type}"
            )
    
    updated = label_sentence_service(db, document_id, sentence_id, label.clause_type)
    if not updated:
        raise HTTPException(status_code=404, detail="Sentence not found")
    return updated

# 3. Add endpoint to list all available clause types for frontend:
@router.get("/available")
def get_available_clause_types(db: Session = Depends(get_db)):
    """Get clause types available for labeling."""
    return get_clause_types(db)
```

---

## Summary of Issues by Priority

### 🔴 **CRITICAL (Fix before production)**

1. **Database integrity:** Sentence.clause_type should be FK to ClauseType
2. **Error handling:** Inconsistent across services (some raise, some return None)
3. **Unused Clause model:** Unclear purpose and relationships

### 🟠 **HIGH (Should fix soon)**

4. **Missing docstrings:** 60% of services undocumented
5. **Configuration:** No centralized settings management
6. **File upload validation:** No size limits or MIME type checking
7. **Clause_type validation:** Labeling doesn't validate against available types

### 🟡 **MEDIUM (Nice to have)**

8. **Logging:** Using `print()` instead of logging module
9. **Session models:** Endpoints could use more complex return types (e.g., `DocumentWithSentences`)
10. **Missing CRUD operations:** Document/Sentence lack update/delete endpoints
11. **Batch operations:** No bulk labeling endpoint
12. **Database indexes:** Missing on frequently-queried foreign keys

### 🟢 **LOW (Polish/Future)**

13. **OpenAPI documentation:** Could add more detailed descriptions
14. **Performance:** No pagination on list endpoints
15. **Testing:** No error handling tests suggested
16. **Type hints:** Some dict types should use TypedDict or Pydantic models

---

## Recommendations - Quick Start

### Immediate Actions (1-2 hours)

```bash
# 1. Fix database relationships
# Edit app/models/sentence.py to reference ClauseType by FK

# 2. Update sentence_service.py to use clause_type_id
# Add validation that clause_type exists before labeling

# 3. Create app/core/config.py
# Move hardcoded values there

# 4. Add logging
# Replace print() statements with logging module
```

### Short-term (1 week)

```bash
# 1. Add comprehensive docstrings (clause_service, document_service, etc.)
# 2. Standardize error handling across all services
# 3. Add file upload size/MIME validation
# 4. Clarify Clause vs ClauseType modeling
# 5. Add Alembic migrations
```

### Long-term (Production readiness)

```bash
# 1. Add comprehensive test suite
# 2. Implement pagination for list endpoints
# 3. Add request logging/tracing
# 4. Implement rate limiting
# 5. Add health check endpoint
# 6. Setup CI/CD validation
```

---

## Code Examples: Before/After

### Example 1: Error Handling Standardization

**BEFORE (Bad):**
```python
# sentence_service.py
def get_sentence(db: Session, document_id: int, sentence_id: int) -> Sentence | None:
    return db.query(Sentence).filter(...).first()  # Returns None

# clause_service.py
def get_clause(db: Session, clause_id: int):
    return db.query(Clause).filter(...).first()  # Also returns None

# endpoints must handle:
if not updated:
    raise HTTPException(status_code=404, detail="Not found")  # Scattered logic
```

**AFTER (Good):**
```python
# sentence_service.py  
def get_sentence(db: Session, document_id: int, sentence_id: int) -> Sentence:
    s = db.query(Sentence).filter(...).first()
    if not s:
        raise HTTPException(
            status_code=404,
            detail=f"Sentence {sentence_id} in document {document_id} not found"
        )
    return s

# Endpoints are simpler:
@router.post("/{document_id}/sentences/{sentence_id}/label")
def label_sentence(...):
    updated = label_sentence_service(...)  # Raises if not found
    return updated  # Always valid
```

### Example 2: Database Relationship Fix

**BEFORE (Bad):**
```python
class Sentence(Base):
    __tablename__ = "sentences"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    text = Column(Text)
    clause_type = Column(String(255))  # ❌ Just a string!

# Labeling endpoint:
@router.post("/{document_id}/sentences/{sentence_id}/label")
def label_sentence(..., label: SentenceLabel, ...):
    s = db.query(Sentence).get(sentence_id)
    s.clause_type = label.clause_type  # ❌ Could be any string!
```

**AFTER (Good):**
```python
class Sentence(Base):
    __tablename__ = "sentences"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    clause_type_id = Column(Integer, ForeignKey("clause_types.id", ondelete="SET NULL"), nullable=True)
    text = Column(Text)
    
    # Relationships
    document = relationship("Document", back_populates="sentences")
    clause_type = relationship("ClauseType", back_populates="sentences")

class ClauseType(Base):
    # ... existing fields ...
    sentences = relationship("Sentence", back_populates="clause_type")

# Labeling endpoint now validates:
@router.post("/{document_id}/sentences/{sentence_id}/label")
def label_sentence(..., label: SentenceLabel, ...):
    # Validate clause type exists
    if label.clause_type_id:
        ct = db.query(ClauseType).get(label.clause_type_id)
        if not ct:
            raise HTTPException(status_code=400, detail="Invalid clause type")
    
    s = db.query(Sentence).get(sentence_id)
    s.clause_type_id = label.clause_type_id  # ✅ FK ensures validity
```

---

## Conclusion

Your FastAPI backend has a **solid architectural foundation** with clear separation of concerns and consistent patterns. The newly added `clause_type` feature demonstrates the best practices in the codebase.

However, **several critical issues** should be addressed before production deployment:

1. **Database relationships** need restructuring (Sentence.clause_type → FK)
2. **Error handling** needs standardization across all services
3. **Configuration** should be centralized
4. **Documentation** (docstrings, API descriptions) is sparse

With the recommended fixes, this codebase could be **production-ready within 1-2 weeks** of focused work.

**Estimated effort for critical fixes: 4-6 hours**  
**Estimated effort for comprehensive review: 2-3 days**
