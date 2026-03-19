# Medical Summarizer (Full Stack)

Full-stack medical document summarization platform with:

- React frontend (`frontend/`)
- FastAPI backend (`backend/`)
- MongoDB persistence for users and summary history

## Workspace Structure

- `frontend/` React + Vite client
- `backend/` FastAPI API service

## Backend Setup

1. Move to backend directory:

```bash
cd backend
```

2. Create virtual environment and install dependencies:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

3. Create `.env` from `.env.example` and update values:

```env
MONGODB_URI=mongodb+srv://medicalsummarizer:medicalsummarizer@medicalsummarizer.i4ourj5.mongodb.net/
MONGODB_DB_NAME=medical_summarizer
JWT_SECRET_KEY=replace-with-strong-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
MAX_UPLOAD_SIZE_MB=25
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

4. Run backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If your terminal is already in `backend/app`, you can run:

```bash
python main.py
```

## Frontend Setup

1. Move to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` (or copy from `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8000
```

4. Run frontend:

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Summaries

- `POST /api/v1/summaries/upload`
- `GET /api/v1/summaries/history`
- `GET /api/v1/summaries/{summary_id}`
- `DELETE /api/v1/summaries/{summary_id}`
- `DELETE /api/v1/summaries/history`

## Notes

- Frontend now runs in API-only mode; all mock mode paths have been removed.
- Current backend summary generation and Sinhala output are deterministic placeholders designed for future AI model integration.
