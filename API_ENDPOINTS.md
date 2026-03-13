# API Endpoints Reference

## Base URL
```
http://localhost:8000/api/v1
```

## File Upload Endpoints

### 1. Upload Document
**Endpoint**: `POST /documents/upload`

**Request**:
- Content-Type: `multipart/form-data`
- Body: File (`.txt`, `.md`, `.markdown`)

**Response** (201 Created):
```json
{
  "id": 12,
  "filename": "contract.txt",
  "content": "Full contract text here...",
  "uploaded_at": "2024-01-15T10:30:00"
}
```

**Frontend Call**:
```typescript
this.api.uploadDocument(file).subscribe({
  next: (doc) => this.router.navigate(['/contracts', doc.id])
});
```

**Backend Handler**: `app/api/v1/endpoints/documents.py` → `upload_document()`

---

## Document Retrieval Endpoints

### 2. Get Document by ID
**Endpoint**: `GET /documents/{id}`

**Response**:
```json
{
  "id": 12,
  "filename": "contract.txt",
  "content": "Full contract text...",
  "uploaded_at": "2024-01-15T10:30:00"
}
```

**Frontend Call** (in `document-viewer.component.ts`):
```typescript
this.api.getDocument(id).subscribe({
  next: (doc) => this.document.set(doc)
});
```

---

## Sentence Management Endpoints

### 3. Get Sentences for Document
**Endpoint**: `GET /documents/{id}/sentences`

**Response**:
```json
[
  {
    "id": 1,
    "document_id": 12,
    "text": "Confidentiality clause.",
    "clause_type": null
  },
  {
    "id": 2,
    "document_id": 12,
    "text": "No disclosure allowed.",
    "clause_type": "Confidentiality"
  },
  {
    "id": 3,
    "document_id": 12,
    "text": "Termination can occur anytime.",
    "clause_type": "Termination for Convenience"
  }
]
```

**Frontend Call** (in `document-viewer.component.ts`):
```typescript
this.api.getSentences(id).subscribe({
  next: (list) => this.sentences.set(list)
});
```

**Backend Handler**: `app/api/v1/endpoints/sentences.py` → `get_sentences()`

---

### 4. Label/Assign Clause Type to Sentence
**Endpoint**: `POST /documents/{id}/sentences/{sentence_id}/label`

**Request Body**:
```json
{
  "clause_type": "Confidentiality"
}
```

Or to remove label:
```json
{
  "clause_type": null
}
```

**Response**:
```json
{
  "id": 2,
  "document_id": 12,
  "text": "No disclosure allowed.",
  "clause_type": "Confidentiality"
}
```

**Frontend Call** (in `document-viewer.component.ts`):
```typescript
this.api.labelSentence(docId, sentenceId, clauseType).subscribe({
  next: (updated) => {
    // Update sentences array with the labeled sentence
    this.sentences.update(list => 
      list.map(s => s.id === updated.id ? updated : s)
    );
  }
});
```

**Backend Handler**: `app/api/v1/endpoints/sentences.py` → `label_sentence()`

---

## Available Clause Types

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

## Complete User Flow (API Calls)

### Phase 1: Upload
```
USER ACTION: Select file & click Upload
→ POST /documents/upload (multipart/form-data)
← Response: Document {id: 12, filename, content, uploaded_at}
→ Frontend navigates to /contracts/12
```

### Phase 2: View & Label
```
USER ACTION: Page loads /contracts/12
→ GET /documents/12
← Document {filename, content, ...}
→ GET /documents/12/sentences
← Sentences[] with clause_type (may be null)
→ Frontend displays each sentence with dropdown

USER ACTION: Select clause type from dropdown (e.g., "Confidentiality")
→ POST /documents/12/sentences/2/label {clause_type: "Confidentiality"}
← Response: Sentence {id: 2, text, clause_type: "Confidentiality"}
→ Frontend updates UI to show label assigned
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid file type. Must be .txt, .md, or .markdown"
}
```

### 404 Not Found
```json
{
  "detail": "Document not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## CORS Configuration

**Backend** (`app/main.py`):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[...],
    allow_origin_regex=r"http://localhost:\d+",  # Allow any localhost port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Frontend** runs on dynamic dev port (e.g., `http://localhost:52221`)
**Backend** runs on `http://localhost:8000`

---

## Testing with cURL

### Upload Document
```bash
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -F "file=@contract.txt"
```

### Get Document
```bash
curl http://localhost:8000/api/v1/documents/12
```

### Get Sentences
```bash
curl http://localhost:8000/api/v1/documents/12/sentences
```

### Label Sentence
```bash
curl -X POST http://localhost:8000/api/v1/documents/12/sentences/2/label \
  -H "Content-Type: application/json" \
  -d '{"clause_type": "Confidentiality"}'
```

---

## Frontend Service Implementation

See [api.service.ts](src/app/services/api.service.ts) for full implementation:

- `uploadDocument(file)` - POST /documents/upload
- `getDocument(id)` - GET /documents/{id}
- `getSentences(id)` - GET /documents/{id}/sentences
- `labelSentence(docId, sentenceId, clauseType)` - POST /documents/{id}/sentences/{id}/label

All methods include:
- 30-second timeout
- Error handling with console logging
- Typed responses using Angular HttpClient

