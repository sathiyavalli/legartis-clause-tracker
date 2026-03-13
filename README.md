# Legartis Contract Clause Tracker

Full-stack case study: upload contracts (plain text/markdown), view documents, and label clause types per sentence.

## Stack

- **Backend:** FastAPI, SQLAlchemy, SQLite
- **Frontend:** Angular 21 with custom SCSS (no UI libraries)
- **Database:** SQLite

## Quick start (local)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm start
```

App: http://localhost:4200

Set the API base URL in `frontend/src/environments/environment.ts` (`apiUrl: 'http://localhost:8000/api/v1'`).

## Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost (port 80)
- Backend API: http://localhost:8000

The frontend is served by nginx and proxies `/api/` to the backend, so use http://localhost in the browser when using Docker.

## Features

1. **Home** – Marketing-style landing page with hero section and navigation.
2. **Upload contracts** – Plain text or markdown (`.txt`, `.md`) via the Upload page. After uploading, manually select text and assign clause types. The UI uses custom SCSS instead of component libraries for full design control.
3. **Document viewer** – 
   - View document content with sentence-level clause type assignment.
   - **Multi-line text selection:** Select contiguous sentences by clicking and dragging across multiple lines of text.
   - **Clause assignment:** Assign or remove clause types (e.g., Limitation of Liability, Termination for Convenience, Non-Compete) via select control.
   - **Label management:** Easily clear or remove labels from sentences with a dedicated removal option.
4. **Dashboard** – 
   - List all documents with search by filename.
   - Filter documents by assigned clause types.
   - **Load more:** Pagination support to incrementally load documents as needed.
   - **Clause summary sidebar:** Quick-access sidebar showing count of sentences per clause type across all documents.
5. **Workflow breadcrumbs** – Three-step navigation breadcrumb (Choose file → Upload → Assign labels) to guide users through the contract processing workflow.

## API

- `POST /api/v1/documents/upload` – Upload file (multipart).
- `GET /api/v1/documents` – List documents (optional `?search=`).
- `GET /api/v1/documents/{id}` – Get document (with content).
- `GET /api/v1/documents/{id}/sentences` – List sentences for a document.
- `POST /api/v1/documents/{id}/sentences/{sentence_id}/label` – Set clause type (body: `{"clause_type": "..."}` or `null`).

## Project structure

```
backend/
  app/
    api/v1/       # documents.py, clauses.py
    db/           # database.py, session.py
    models/       # document.py, sentence.py, clause.py
    schemas/      # document, sentence, clause
    services/     # document_service, sentence_service, clause_service
    main.py
  requirements.txt
  Dockerfile

frontend/
  src/
    app/
      pages/        # dashboard, upload, document-viewer
      services/     # api.service
      models/
      environments/
  angular.json
  Dockerfile
  nginx.conf

docker-compose.yml
```

## Design notes

- **Sentence extraction:** Text is split on `.`, `!`, `?` followed by space; each segment is stored as a sentence. No NLP; suitable for contract-style text.

- **Multi-line text selection:** In the document viewer, users can select multiple lines of text by clicking and dragging across sentence boundaries. Selected text regions are highlighted, allowing users to assign a single clause type to multiple sentences in one action.

- **Label management:** Users have full control over clause assignments:
  - Assign clause types to individual or multi-selected sentences via dropdown.
  - Remove/clear labels from any sentence with a dedicated option (e.g., a "Clear" option in the dropdown or beside the sentence).
  - Backend accepts `null` values to indicate unlabeled sentences.

- **Workflow breadcrumbs:** A persistent breadcrumb navigation appears at the top of the Upload and Document Viewer pages, showing the three-step workflow:
  1. **Choose** – Select a file on the Upload page.
  2. **Upload** – Upload the chosen file and proceed to labeling.
  3. **Assign** – Assign clause types to sentences in the Document Viewer.
  The breadcrumb provides clear visual feedback of the user's position in the workflow.

- **Dashboard pagination (Load more):** Instead of loading all documents at once, the Dashboard implements a "Load More" button that fetches additional documents in batches (default: 10–20 per batch). This improves page load time and UX, especially as the document library grows.

- **Clause summary sidebar:** The Dashboard includes a sidebar (collapsible on mobile) displaying a summary of all clause types and their counts across the entire document library. This gives users a quick overview of contract patterns and helps with navigation by showing which clause types are most prevalent.

- **Clause types:** Fixed list in the UI (e.g., Limitation of Liability, Non-Compete, Termination for Convenience, Indemnification, Confidentiality). The label endpoint accepts any string, allowing the list to be extended or data-driven by the backend in future iterations.

- **SQLite:** Single file database, no extra server required. For production, consider migrating to PostgreSQL with environment-based `SQLALCHEMY_DATABASE_URL` configuration.

- **State management:** Frontend uses NgRx for centralized state management (dashboard reducer, effects, actions, selectors) ensuring consistent data flow and simplified testing.

- **Styling:** 100% custom SCSS with no external component libraries, providing fine-grained control over the design and reducing dependencies.
