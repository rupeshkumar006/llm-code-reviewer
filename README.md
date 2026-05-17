# LLM-Based Code Reviewer

> AI-powered code review platform using **Claude API**, **Spring Boot**, **React**, **MySQL**, and **Redis**.

[![CI](https://github.com/your-org/code-reviewer/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-org/code-reviewer/actions)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v3 |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Backend | Spring Boot 3.2 (Java 17) |
| AI | Claude API (Anthropic) |
| Database | MySQL 8 |
| Cache / Rate Limiting | Redis 7 (sliding window) |
| Auth | Spring Security + JWT + Google OAuth 2.0 |
| Containerisation | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Quick Start (Docker Compose)

### 1. Clone and configure

```bash
git clone https://github.com/your-org/code-reviewer.git
cd code-reviewer
cp .env.example .env
```

Edit `.env` and fill in your credentials:
- `CLAUDE_API_KEY` — from [console.anthropic.com](https://console.anthropic.com/)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — from [Google Cloud Console](https://console.cloud.google.com/)
- `JWT_SECRET` — any random 32+ character string
- `DB_PASS` — your preferred MySQL password

### 2. Start all services

```bash
docker-compose up --build
```

- Frontend: http://localhost:80
- Backend API: http://localhost:8080/api
- MySQL: localhost:3306
- Redis: localhost:6379

---

## Local Development (without Docker)

### Prerequisites
- Java 17
- Node 20
- MySQL 8 running locally
- Redis running locally

### Backend

```bash
cd backend
# Set environment variables (or create an application-local.yml)
export CLAUDE_API_KEY=sk-ant-xxx
export DB_PASS=yourpassword
mvn spring-boot:run
```

Backend runs at http://localhost:8080

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create account |
| POST | `/api/auth/login` | None | Login → JWT |
| POST | `/api/auth/refresh` | None | Refresh token |
| POST | `/api/auth/google` | None | Google OAuth |
| POST | `/api/review` | JWT | Submit code for review |
| POST | `/api/review/stream` | JWT | SSE streaming review |
| GET | `/api/review/{id}` | JWT | Get specific review |
| GET | `/api/review/history` | JWT | Get review history |
| DELETE | `/api/review/{id}` | JWT | Delete a review |
| POST | `/api/review/{id}/export` | JWT | Export PDF/JSON |
| POST | `/api/review/{id}/share` | JWT | Generate share link |
| GET | `/api/share/{token}` | None | Public shared review |
| GET | `/api/analytics/summary` | JWT | Analytics data |
| GET | `/api/user/profile` | JWT | User profile |

---

## Rate Limiting

- **Free tier**: 10 reviews per hour (Redis sliding window)
- **Pro tier**: Unlimited
- HTTP 429 returned with `Retry-After` header when exceeded

---

## Modules

1. **Code Editor** — Monaco editor, 10 languages, drag-and-drop upload
2. **AI Review Engine** — Bug detection, quality score (0–100), security, refactor suggestions, complexity
3. **Review Results UI** — Tabbed panel, inline line highlighting, diff view, PDF/JSON export, share link
4. **Authentication** — JWT + Google OAuth 2.0, role-based access (Free / Pro)
5. **Review History** — MySQL-backed history, search/filter, rename, tag, favourite, bulk delete
6. **Analytics Dashboard** — Score trend chart, bug distribution pie chart, personal metrics
7. **Backend Infrastructure** — Redis rate limiting, SSE streaming, Docker, GitHub Actions

---

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

---

## GitHub Actions CI

On every push to `main` or PR:
- ✅ Backend: compile + unit tests (with MySQL + Redis services)
- ✅ Frontend: ESLint + Vite production build
- ✅ Docker: image build validation (main only)

---

## Folder Structure

```
code-reviewer/
├── frontend/                  ← React + Vite + Tailwind
│   ├── src/
│   │   ├── components/        ← CodeEditor, ReviewPanel, HistorySidebar, etc.
│   │   ├── pages/             ← Home, Review, Login, Register, Dashboard, SharedReview
│   │   ├── services/api.js    ← Axios + SSE handler
│   │   └── context/AuthContext.jsx
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                   ← Spring Boot (Java 17)
│   └── src/main/java/com/codereviewer/
│       ├── controller/        ← 5 controllers, 14 endpoints
│       ├── service/           ← AIService, ReviewService, AuthService, etc.
│       ├── model/             ← User, Review, ShareLink, ReviewTag
│       ├── repository/        ← JPA repositories
│       ├── security/          ← JWT, filters
│       └── config/            ← Security, Redis, CORS
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci-cd.yml
```
