# Medical Multi-Document Summarizer Frontend

Complete React + JSX web application for medical document summarization with secure access, multi-page navigation, and bilingual output delivery.

This application supports:

- Secure user sign-in and protected workspace routes
- Multi-page navigation with professional top navbar
- Uploading single or multiple medical documents at once
- Allowed document formats: PDF, TXT, DOC, DOCX
- Parallel per-document summary preparation
- Side-by-side English and Sinhala summary display
- Download each summary as a PDF report
- Signup and login flow for secure user access
- Summary history page for previously processed files
- Scenario-aware portfolio insight detection:
- Mixed-topic submission handling
- Same-topic time-based comparison handling
- Fully responsive design for desktop and mobile

## Tech Stack

- React 18
- Vite 5
- Plain JavaScript and JSX (no TypeScript)
- React Router for navigation and page routing
- jsPDF for report download
- Custom CSS UI (responsive desktop + mobile)

## Project Structure

src/

- App.jsx: Route map and app shell
- main.jsx: Entrypoint with BrowserRouter
- styles.css: Shared responsive design system
- context/
- AuthContext.jsx: Authentication state and login/logout flows
- layout/
- ProtectedRoute.jsx: Route-level access protection
- pages/
- HomePage.jsx
- LoginPage.jsx
- SignupPage.jsx
- DashboardPage.jsx
- HistoryPage.jsx
- SecurityPage.jsx
- components/
- TopNavbar.jsx
- UploadZone.jsx
- ProcessingTable.jsx
- ScenarioInsight.jsx
- SummaryCard.jsx
- PdfDownloadButton.jsx
- ArchitectureFlow.jsx
- services/
- summarizerApi.js
- utils/
- fileUtils.js
- batchInsights.js
- pdfExport.js
- historyStore.js
- data/
- featureContent.js

## How to Run

1. Install dependencies:

```bash
npm install
```

2. Start development server:

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

## Application Workflow

1. Sign in through the secure login page.
2. Open the dashboard and upload one or multiple documents.
3. Start processing to generate document-level summaries in parallel.
4. Review English and Sinhala summaries side by side.
5. Download individual PDF reports when needed.
6. Revisit prior outputs from the history page.

## Service Modes

The app includes two modes:

- Preview Mode (default):
- Uses a built-in mock processing pipeline for full frontend testing without backend.

- Live Service Mode:
- Disable Preview Mode and set Service URL.
- Frontend sends each document to:

`POST {API_BASE_URL}/summarize`

Request format:

- multipart/form-data
- field name: file

Expected JSON response shape:

```json
{
	"englishSummary": "string",
	"sinhalaSummary": "string",
	"topic": "string",
	"confidence": 0.91,
	"keyFindings": ["point 1", "point 2"],
	"publicationYear": 2024
}
```

## Notes

- Login can run in frontend mock mode when no auth API is configured.
- In mock mode, any valid email and password with at least 8 characters can sign in.
- Optional auth backend can be configured using `VITE_AUTH_API`.
- Duplicate uploads (same name + size) are skipped.
- Maximum file size is 25 MB per file.
- Files are processed concurrently to return multiple summaries in one run.