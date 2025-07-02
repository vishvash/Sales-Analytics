# PROJECT OVERVIEW

## Project Structure

```
SalesPitch_deploy/
├── salespitch-backend/
│   ├── alembic/                # DB migrations (Alembic)
│   │   └── versions/           # Migration scripts
│   ├── audio_chunks/           # Temporary or processed audio files
│   ├── src/                    # Backend source code
│   │   ├── routers/            # FastAPI routers (API endpoints)
│   │   ├── models/             # ML/audio/data models
│   │   ├── db/                 # DB models, session, CRUD
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── model.py            # Audio transcription logic
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── crud.py             # Business logic for DB
│   │   ├── config.py           # App configuration
│   │   ├── auth.py, security.py, deps.py, database.py # Auth, security, dependencies
│   ├── requirements.txt        # Backend Python dependencies
│   ├── alembic.ini             # Alembic config
│   ├── worker.py               # (If used) Background tasks
│   └── venv/                   # Python virtual environment
├── salespitch-frontend/
│   ├── src/
│   │   ├── components/         # React components (UI, dashboards, etc.)
│   │   ├── context/            # React context providers (auth, files)
│   │   ├── api/                # API utility functions
│   │   ├── assets/             # Static assets (SVG, images)
│   │   ├── App.jsx, main.jsx   # React app entry points
│   │   ├── App.css, index.css  # Global styles
│   │   ├── package.json        # Frontend dependencies & scripts
│   │   ├── index.html          # HTML entry point
│   │   └── node_modules/       # Node.js dependencies
│   ├── public/                 # Static public assets
│   └── README.md               # (Legacy) Project title
└── PROJECT_OVERVIEW.md         # (This file)
```

## Folder & File Descriptions

- **salespitch-backend/**: Python FastAPI backend for audio analysis, user management, and API endpoints.
  - `src/routers/`: API route definitions (e.g., auth)
  - `src/models/`: ML/audio processing, diarisation, QA, etc.
  - `src/db/`: SQLAlchemy models, session, and CRUD utilities
  - `src/main.py`: FastAPI app setup, endpoints, and CORS
  - `audio_chunks/`, `converted_audio.wav`, `full_transcript.txt`: Audio processing artifacts
  - `alembic/`: DB migrations (Alembic)
  - `venv/`: Python virtual environment
- **salespitch-frontend/**: React frontend for dashboards, analysis, and user interaction.
  - `src/components/`: UI components (dashboards, login, analysis, etc.)
  - `src/context/`: Auth and file context providers
  - `src/api/`: API utility (e.g., auth.js)
  - `src/assets/`, `public/`: Static assets
  - `App.jsx`, `main.jsx`: App entry points
  - `package.json`: Dependencies and scripts
- **README.md**: Project title (legacy)
- **PROJECT_OVERVIEW.md**: Main project documentation (this file)

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, Alembic, Pydantic, boto3, asyncpg, ML/audio libs (librosa, pyannote, openai-whisper, etc.)
- **Frontend:** React, Vite, React Router, Context API, MUI, Chart.js, axios, recharts, react-toastify
- **Database:** (Implied) PostgreSQL (asyncpg driver)
- **Other:** Docker (recommended for deployment), AWS S3 (for audio storage)

### Ports & Entry Points
- **Backend:** FastAPI (default: 8000, check deployment config)
- **Frontend:** Vite dev server (default: 5173)
- **Backend entry:** `salespitch-backend/src/main.py`
- **Frontend entry:** `salespitch-frontend/src/App.jsx`, `main.jsx`

### Key Commands
- **Backend:**
  - `cd salespitch-backend && source venv/bin/activate` (Linux/macOS) or `venv\Scripts\activate` (Windows)
  - `pip install -r requirements.txt`
  - `uvicorn src.main:app --reload`
- **Frontend:**
  - `cd salespitch-frontend`
  - `npm install`
  - `npm run dev`

## TODOs / Pending Tasks

- [ ] Add more API endpoints for advanced analytics
- [ ] Improve error handling and validation in backend
- [ ] Add user profile and authentication features in frontend
- [ ] Refactor large React components for maintainability
- [ ] Add unit and integration tests (backend & frontend)
- [ ] Document environment variables and deployment steps
- [ ] (You can add/remove items as you work) 