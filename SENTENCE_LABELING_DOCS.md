# Sentence Extraction & Labeling Documentation

## Overview
The contract clause tracker extracts sentences from uploaded documents and allows users to assign clause types to each sentence through the document viewer interface.

---

## 1. **Upload Flow**

### Frontend (`upload.component.ts`)
- User selects a `.txt` or `.md` file
- Calls `ApiService.uploadDocument(file)` 
- **On success**: Navigates to `/contracts/{documentId}` → Document Viewer
- **On error**: Displays error message

### Backend (`app/api/v1/endpoints/documents.py`)
```python
@router.post("/upload", response_model=Document)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # 1. Validate file type (.txt, .md, .markdown)
    # 2. Read file content
    # 3. Create Document record
    # 4. Extract and create Sentence records
    # 5. Return Document with metadata
```

**Endpoint**: `POST /api/v1/documents/upload`
**Returns**: `Document { id, filename, content, uploaded_at }`

---

## 2. **Sentence Extraction**

### Process (`app/services/document_service.py`)

```python
def _extract_sentences(text: str) -> list[str]:
    """Split text into sentences by: . ! ? (followed by space or end)"""
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]
```

**How it works**:
1. Splits on sentence-ending punctuation (`.`, `!`, `?`) followed by whitespace
2. Filters out empty strings
3. Creates one **Sentence** record per split segment

### Example
**Input**:
```
This is sentence one. This is sentence two! Third sentence?
```

**Output** (3 sentences):
```
1. "This is sentence one."
2. "This is sentence two!"
3. "Third sentence?"
```

---

## 3. **Sentence Model** (`app/models/sentence.py`)

```python
class Sentence(Base):
    __tablename__ = "sentences"
    
    id: int                    # Primary key
    document_id: int           # Foreign key to Document
    text: str                  # The extracted sentence
    clause_type: str | None    # Assigned label (e.g., "Confidentiality")
    
    document: Document         # Relationship back to parent document
```

### Clause Types (from `document-viewer.component.ts`)
```
- Confidentiality
- Indemnification
- Limitation of Liability
- Termination for Convenience
- Non-Compete
- Governing Law
- Force Majeure
- Warranties
- Insurance
- Other
```

---

## 4. **Labeling Flow**

### Frontend (Document Viewer - `document-viewer.component.ts`)

1. **Load document**:
   ```typescript
   // GET /api/v1/documents/{id}
   this.api.getDocument(id).subscribe(...)
   ```

2. **Load sentences**:
   ```typescript
   // GET /api/v1/documents/{id}/sentences
   this.api.getSentences(id).subscribe(...)
   ```

3. **Display sentences**:
   - Each sentence displays with a select dropdown
   - User selects a clause type from dropdown
   - Triggers `onLabel(sentence, selected_type)`

4. **Save label**:
   ```typescript
   // POST /api/v1/documents/{id}/sentences/{sentence_id}/label
   // Body: { "clause_type": "Confidentiality" }
   this.api.labelSentence(docId, sentenceId, clauseType).subscribe(...)
   ```

### Backend Endpoints

#### 1. Get Document
**Endpoint**: `GET /api/v1/documents/{id}`
**Returns**: `Document { id, filename, content, uploaded_at }`

#### 2. Get Sentences
**Endpoint**: `GET /api/v1/documents/{id}/sentences`
**Returns**: `Sentence[] { id, document_id, text, clause_type }`

#### 3. Label Sentence
**Endpoint**: `POST /api/v1/documents/{id}/sentences/{sentence_id}/label`
**Body**:
```json
{
  "clause_type": "Confidentiality"  // or null to unset
}
```
**Returns**: `Sentence (updated)`

---

## 5. **Data Models**

### Document Schema (`app/schemas/document.py`)
```python
class Document(DocumentBase):
    id: int
    uploaded_at: datetime
    content: str              # Full document text
    filename: str
```

### Sentence Schema (`app/schemas/sentences.py`)
```python
class Sentence(SentenceBase):
    id: int
    document_id: int
    text: str                 # The sentence text
    clause_type: str | None   # The assigned label
```

---

## 6. **Database**

**SQLite Tables**:

### `documents`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary Key |
| filename | STRING | File name uploaded |
| content | TEXT | Full contract text |
| uploaded_at | TIMESTAMP | Creation time |

### `sentences`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary Key |
| document_id | INTEGER | FK → documents.id |
| text | TEXT | Extracted sentence |
| clause_type | STRING (255) | Nullable - labeled type |

---

## 7. **User Workflow**

1. **Upload page** (`/upload`)
   - Select `.txt` or `.md` file
   - Click "Upload"
   - File sent to backend for extraction

2. **Document Viewer** (`/contracts/{id}`)
   - Displays document filename
   - Lists all extracted sentences
   - Each sentence has a dropdown to assign clause type
   - Changes saved immediately via API

3. **Dashboard** (`/contracts`)
   - View all uploaded documents
   - Filter by clause type
   - See clause counts per document
   - Click to open document viewer

---

## 8. **Example: Full Workflow**

### Step 1: Upload
```
Upload: contract.txt
Content:
  "Confidentiality clause. No disclosure allowed. 
   Termination can occur anytime. Either party may exit."
```

### Step 2: Extract
Backend creates 3 sentences:
```
1. "Confidentiality clause."
2. "No disclosure allowed."
3. "Termination can occur anytime."
4. "Either party may exit."
```

### Step 3: View & Label
User sees document viewer with sentences:
```
[Sentence 1: "Confidentiality clause."]  [Dropdown: Confidentiality ▼]
[Sentence 2: "No disclosure allowed."]   [Dropdown: (none) ▼]
[Sentence 3: "Termination can occur..."] [Dropdown: Termination for Convenience ▼]
[Sentence 4: "Either party may exit."]   [Dropdown: Termination for Convenience ▼]
```

### Step 4: Save
Each label change triggers `POST .../label` to persist to database.

---

## 9. **Key Files**

| File | Purpose |
|------|---------|
| [upload.component.ts](../pages/upload/upload.component.ts) | File upload handler |
| [document-viewer.component.ts](../pages/document-viewer/document-viewer.component.ts) | Sentence display & labeling |
| [api.service.ts](../services/api.service.ts) | API client |
| [document.py](../../backend/app/models/document.py) | Document model |
| [sentence.py](../../backend/app/models/sentence.py) | Sentence model |
| [document_service.py](../../backend/app/services/document_service.py) | Sentence extraction logic |

---

## 10. **Error Handling**

- **Invalid file type**: Frontend validates before upload
- **Server error**: Displayed in UI via snackbar/console
- **Network timeout**: 30-second timeout on requests
- **Database errors**: Logged server-side, user sees generic error

