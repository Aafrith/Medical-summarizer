# Medical Summarizer Frontend

React + Vite frontend for the Medical Summarizer platform.

## Features

- Secure login and signup
- Protected dashboard and history routes
- Multi-document upload (PDF, TXT, DOC, DOCX)
- Document-level English and Sinhala summaries
- PDF export for each summary card
- Backend-driven history management
- Responsive layout for desktop and mobile

## Tech Stack

- React 18
- Vite 5
- React Router 6
- jsPDF

## Required Environment

Create `.env` in `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Run

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build production assets:

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## API Usage

The frontend calls these backend endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/summaries/upload`
- `GET /api/v1/summaries/history`
- `DELETE /api/v1/summaries/history`

All summary and history endpoints require `Authorization: Bearer <token>`.
