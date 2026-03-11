# Legartis Contract Clause Tracker

Full-stack case study: upload contracts (plain text/markdown), view documents, and label clause types per sentence.

## Stack

- **Backend:** FastAPI, SQLAlchemy, SQLite
- **Frontend:** Angular 21, Angular Material
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

1. **Upload contracts** – Plain text or markdown (`.txt`, `.md`) via the Upload page.
2. **Dashboard** – List documents with search by filename.
3. **Document viewer** – View a document and assign a **clause type** to each sentence (e.g. Limitation of Liability, Termination for Convenience, Non-Compete) via a dropdown.

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
- **Clause types:** Fixed list in the UI (e.g. Limitation of Liability, Non-Compete). The label endpoint accepts any string, so the list can be extended or driven by the backend later.
- **SQLite:** Single file, no extra server. For production you could switch to PostgreSQL and env-based `SQLALCHEMY_DATABASE_URL`.
