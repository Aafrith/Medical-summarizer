# Medical Summarizer Backend

FastAPI backend service for authentication, document upload, summary generation, and history management.

## Features

- JWT-based auth (register, login, profile)
- MongoDB storage for users and summaries
- Multi-format upload support: PDF, TXT, DOC, DOCX
- Summary history endpoints by authenticated user
- CORS configuration for frontend integration

## Install

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Environment

Copy `.env.example` to `.env` and configure values.

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If you are already inside `backend/app`, run:

```bash
python main.py
```

or

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Health Check

- `GET /health`
