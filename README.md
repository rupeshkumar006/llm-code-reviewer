# CodeReviewer — AI-Powered Code Review Tool

[![CI](https://github.com/rupeshkumar006/llm-code-reviewer/actions/workflows/ci.yml/badge.svg)](https://github.com/rupeshkumar006/llm-code-reviewer/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-green)
![React](https://img.shields.io/badge/React-19-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-00758F)
![Redis](https://img.shields.io/badge/Redis-7-DC382D)
![License](https://img.shields.io/badge/License-MIT-yellow)

> Paste your code. Get bugs, security issues (OWASP Top 10), a quality score, and AI-refactored code — in under 20 seconds.

**Live Demo:** [llm-code-reviewer.vercel.app](https://llm-code-reviewer.vercel.app) &nbsp;|&nbsp; **API Health:** [onrender.com/actuator/health](https://llm-code-reviewer-qpzz.onrender.com/actuator/health)

---

## Features

**AI Code Review**
- Supports Java, Python, JavaScript, TypeScript, Go, C++, SQL, PHP, Ruby, Rust
- Detects bugs, OWASP Top 10 vulnerabilities, code smells, and cyclomatic complexity
- Quality score (0–100) with AI-generated refactored code suggestions
- Real-time streaming via Server-Sent Events

**Developer Dashboard**
- Metrics: streak, total reviews, average quality score, security grade
- Charts: quality trends, language distribution, issue breakdown, activity heatmap
- Compare any two reviews with a radar chart

**Export & Share**
- PDF and JSON export
- Public share links with optional expiry
- Guest mode — no signup required

**Auth & Security**
- JWT (15-min access + 7-day refresh rotation) with Google OAuth2
- Redis sliding window rate limiting (10 reviews/hour free tier)
- BCrypt passwords, CORS protection, 50KB code size limit

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Monaco Editor, Recharts |
| Backend | Spring Boot 3.2.5, Java 17, Spring Security, JJWT |
| Database | MySQL 8.0 (Aiven), Redis 7 (Upstash) |
| AI | Google Gemini 2.5 Flash |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Hosting | Vercel (frontend), Render (backend) |

---

## Architecture

```
React 19 (Vercel)
    │  HTTP/REST + JWT
    │  SSE Streaming
    ▼
Spring Boot (Render)
    ├── MySQL (Users, Reviews, Share Links)
    ├── Redis (Rate Limiting, Cache)
    └── Gemini API (AI Review)
```

**SSE Streaming flow:** Frontend POSTs code → backend spawns async task → emits `status` then `result` events → frontend renders in real time.

**Rate limiting:** Redis sorted set with rolling 1-hour window. Fails open if Redis unavailable.

---

## Screenshots

![Sign In](Assests/Screenshots/Signin.png)
![Home](Assests/Screenshots/Home.png)
![Review](Assests/Screenshots/Review.png)
![Analytics](Assests/Screenshots/Analytics.png)

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Gemini API key — free at [aistudio.google.com](https://aistudio.google.com)

### Run Locally

```bash
git clone https://github.com/rupeshkumar006/llm-code-reviewer.git
cd llm-code-reviewer
cp .env.example .env
# Fill in your keys in .env
docker-compose up --build
```

Open [http://localhost](http://localhost) — backend health at [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health).

### Environment Variables

```env
GEMINI_API_KEY=your_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_32_char_secret
DB_HOST=mysql
DB_PORT=3306
DB_NAME=code_reviewer
DB_USER=root
DB_PASS=root_password
REDIS_HOST=redis
REDIS_PORT=6379
FRONTEND_URL=http://localhost
CORS_ORIGINS=http://localhost
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/review/stream` | SSE streaming review |
| GET | `/api/review/history` | List user reviews |
| GET | `/api/review/{id}` | Get review by ID |
| DELETE | `/api/review/{id}` | Delete review |
| GET | `/api/analytics/summary` | Dashboard metrics |
| POST | `/api/review/{id}/share` | Create share link |
| GET | `/api/share/{token}` | Access shared review |

---

## Project Structure

```
llm-code-reviewer/
├── backend/
│   ├── Dockerfile
│   └── src/main/java/com/codereviewer/
│       ├── config/          # CORS, Redis, Security
│       ├── controller/      # Auth, Review, Analytics, Share
│       ├── model/           # User, Review, ShareLink
│       ├── repository/      # JPA interfaces
│       ├── security/        # JWT filter, token provider
│       └── service/         # AI, RateLimit, Export, Analytics
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf           # SSE-optimized (no buffering, 300s timeout)
│   └── src/
│       ├── components/      # Editor, Diff Viewer, Charts
│       ├── context/         # Auth context
│       ├── pages/           # Home, Review, Dashboard, Login, Share
│       └── services/        # Axios client, SSE helpers
├── docker-compose.yml
└── README.md
```

**Codebase:** 61 source files, ~8,237 lines (Java: 2,413 | JS/JSX: 5,824)

---

## Deployment

**Frontend (Vercel):** Set root directory to `frontend`, add `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`.

**Backend (Render):** Connect repo, set all environment variables above, ensure `SERVER_PORT=10000`.

---

## Contributors

| Name | Role | GitHub |
|---|---|---|
| Rupesh Kumar | Full-Stack Developer | Data Analytics | [@rupeshkumar006](https://github.com/rupeshkumar006) |
| Priya Dharshini M | Full-Stack Developer | Design | [@m-priya-671](https://github.com/m-priya-671) |

---

## License

MIT — free to use, modify, and distribute with attribution.

---

⭐ If you find this useful, consider starring the repo!
