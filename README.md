# 🔍 CodeReviewer — AI-Powered Code Review Tool

[![CI](https://github.com/rupeshkumar006/llm-code-reviewer/actions/workflows/ci.yml/badge.svg)](https://github.com/rupeshkumar006/llm-code-reviewer/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-green)
![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-8.0-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-00758F)
![Redis](https://img.shields.io/badge/Redis-7-DC382D)
![License](https://img.shields.io/badge/License-MIT-yellow)

> **Paste your code. Get bugs, security issues (OWASP Top 10), a quality score, and AI-refactored code — in under 20 seconds.**

---

## 🌐 Live Demo

**Frontend:** [https://llm-code-reviewer.vercel.app](https://llm-code-reviewer.vercel.app)  
**Backend API:** [https://llm-code-reviewer-qpzz.onrender.com/actuator/health](https://llm-code-reviewer-qpzz.onrender.com/actuator/health)

---

## ✨ Key Features

### 🤖 AI-Powered Code Review
- **Multi-Language Support**: Java, Python, JavaScript, TypeScript, Go, C++, SQL, PHP, Ruby, Rust, and more
- **Comprehensive Analysis**: Detects bugs, security vulnerabilities (OWASP Top 10), code smells, and cyclomatic complexity
- **Quality Score**: AI-driven 0–100 score with actionable breakdown by issue type
- **Refactored Code**: AI-generated improved code suggestions with full explanations

### 📊 Developer Dashboard
- **Real-Time Metrics**: Current streak, total reviews, average quality score
- **Trend Analysis**: Line charts showing score evolution over time (Last 7 days, Last 30 days, All time)
- **Visual Insights**: 
  - Pie charts for issue breakdown (Logic Errors, Security Issues, Style Issues, Complexity)
  - Language distribution charts
  - Weekly activity heatmap
- **Compare Reviews**: Radar chart comparison of any two reviews
- **Security Grade**: OWASP-compliant security ratings (A–D scale)

### 💾 Export & Share
- **PDF Reports**: Professionally formatted reports with tables, severity chips, and formatted code blocks
- **JSON Export**: Structured review data for integration with other tools
- **Public Share Links**: Generate public URLs with optional token expiry (64-character unique tokens)
- **Guest Mode**: Instant reviews without signup (local storage only)

### 🔐 Authentication & Security
- **JWT Auth**: 15-minute access tokens with 7-day refresh token rotation
- **Google OAuth2**: One-click authentication with Google
- **Secure Sessions**: Token stored securely in localStorage with axios interceptors
- **Rate Limiting**: Redis sliding window (10 reviews/hour free tier, unlimited for Pro/Admin)
- **Password Security**: BCrypt encryption with strict 50KB code limit

### 🎨 Premium Diff Viewer
- **Monaco Editor Integration**: Side-by-side or inline diff view
- **Smart Highlighting**: Color-coded additions, deletions, and modifications
- **One-Click Actions**: Accept/Reject all changes with immediate editor sync
- **Copy & Paste Support**: Easily copy refactored code blocks

---

## 🛠️ Complete Tech Stack

| **Layer** | **Technology** | **Version** |
|---|---|---|
| **Frontend Framework** | React | 19.2.5 |
| **Build Tool** | Vite | 8.0.10 |
| **Styling** | Tailwind CSS | 3.4.19 |
| **Code Editor** | Monaco Editor | 4.7.0 |
| **Charting** | Recharts | 3.8.1 |
| **HTTP Client** | Axios | 1.15.2 |
| **Icons** | Lucide React | 1.14.0 |
| **Notifications** | React Hot Toast | 2.6.0 |
| **Routing** | React Router DOM | 7.14.2 |
| | | |
| **Backend Framework** | Spring Boot | 3.2.5 |
| **Java Version** | Java | 17 LTS |
| **Security** | Spring Security + JJWT | 0.12.5 |
| **Database ORM** | Spring Data JPA | - |
| **PDF Generation** | OpenPDF | 1.3.35 |
| **Utilities** | Lombok, Jackson | - |
| **Monitoring** | Spring Boot Actuator | - |
| | | |
| **Primary Database** | MySQL | 8.0 |
| **Caching & Rate Limiting** | Redis | 7.0 (Alpine) |
| **Test Database** | H2 (In-Memory) | - |
| | | |
| **AI/LLM** | Google Gemini API | 2.5 Flash |
| **OAuth Provider** | Google Client API | - |
| | | |
| **Containerization** | Docker & Docker Compose | - |
| **Web Server** | Nginx | 1.24+ |
| **CI/CD** | GitHub Actions | - |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ React 19 + Vite (Vercel)                               ││
│  │ ├─ Code Editor (Monaco)                                ││
│  │ ├─ Diff Viewer                                         ││
│  │ ├─ Dashboard (Recharts Analytics)                      ││
│  │ └─ SSE Stream Handler                                  ││
│  └─────────────────────────────────────────────────────────┘│
└────────────────┬─────────────────────────────────────────────┘
                 │ HTTP/REST + JWT Auth
                 │ SSE Streaming (/api/review/stream)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│        Spring Boot Backend (Java 17, Render)                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Controllers (Auth, Review, Analytics, Share)           ││
│  │ Services (AI, RateLimit, Export, Analytics)            ││
│  │ Security Layer (JWT Filter, OAuth)                     ││
│  │ SSE Async Streaming Handler                            ││
│  └─────────────────────────────────────────────────────────┘│
└────────────────┬──────────────────┬──────────────────┬───────┘
                 │                  │                  │
        ┌────────▼─────┐   ┌────────▼─────┐   ┌────────▼─────┐
        │   MySQL 8    │   │   Redis 7    │   │  Gemini API  │
        │  (Persisted) │   │  (Upstash)   │   │  (Google)    │
        │              │   │ - Rate Limit │   │              │
        │ - Users      │   │ - Session    │   │ - AI Review  │
        │ - Reviews    │   │   Cache      │   │ - Streaming  │
        │ - Share Links│   └──────────────┘   └──────────────┘
        └──────────────┘
```

### 📡 Authentication Flow (JWT Rotation)
1. **User Login/Signup** → Generate JWT Access Token (15 min expiry) + Refresh Token (7 days, DB-backed)
2. **Authenticated Requests** → Bearer token in Authorization header
3. **Token Expiry** → Axios interceptor auto-refreshes on 401 response
4. **Session Management** → Refresh token stored securely in localStorage
5. **Logout** → Clears tokens and revokes refresh token

### 🔄 Rate Limiting Strategy
- **Redis Sorted Set (ZSet)** tracking: `rate_limit:review:{userId}`
- **Rolling 1-hour window**: Sliding time-based request tracking
- **Limits**: 
  - Free tier: 10 reviews/hour
  - Pro/Admin: Unlimited
- **Fail-Open Strategy**: If Redis unavailable, service logs error and allows review to proceed

### 📡 Server-Sent Events (SSE) Streaming
- **Endpoint**: `/api/review/stream` (POST)
- **Flow**: 
  1. Frontend sends code + language via POST
  2. Backend spawns background task outside servlet thread pool
  3. Real-time events emitted: `status` → `result` (or `error`)
  4. Nginx configured: `proxy_buffering off`, 300s timeout
  5. Frontend parses response stream directly
- **Benefits**: Real-time progress UI, no polling overhead, responsive UX

---

## 🖼️ Screenshots & UI Tour

### Landing & Authentication
The landing page features an intuitive onboarding flow with hero messaging and multiple authentication options:

![CodeReviewer Landing Page - Shows the main value proposition with Google OAuth and email signup options](image1.png)

**Key Elements:**
- Clear value proposition: "Perfect your code with intelligence"
- Highlight of 3 core features (AI-Powered Analysis, Security Detection, Best Practices)
- Dual auth: Email/password login + Google OAuth
- Code snippet example in background

### Dashboard & Analytics
The developer dashboard provides comprehensive metrics and historical trends:

![CodeReviewer Dashboard - Displays real-time metrics including current streak, average quality score, most reviewed language, and workspace analytics](image2.png)

**Metrics Displayed:**
- **Current Streak**: 1 day active
- **Average Quality Score**: 35%
- **Most Reviewed Language**: JavaScript (1 review)
- **Workspace Analytics** (Apr 20 – May 19):
  - Average Quality: 35%
  - Total Reviews: 1
  - Bugs Detected: 6
  - Security Grade: D
- **Quality Evolution Chart**: 7-day, 30-day, and all-time views
- **Language Distribution**: Multi-language breakdown

### Code Review Interface
The main review editor with multi-language support and real-time analysis:

![CodeReviewer Review Page - Shows the code editor with language selector, code input area, and quality/security metrics panel](image3.png)

**Features:**
- **Language Selector**: Dropdown supporting 10+ languages (Java, Python, JavaScript, TypeScript, C++, Go, Rust, SQL, PHP, Ruby)
- **Code Editor**: Monaco-powered editor with syntax highlighting
- **Quick Actions**: 
  - New Review button
  - Load Example code
  - Clear editor
  - Upload file option
  - Export & Review Code buttons
- **Metrics Panel**: Real-time quality and security scoring
- **History Sidebar**: Previously reviewed code with timestamps and language tags

### Home Page - Hero Section
The main CTA page when authenticated:

![CodeReviewer Home - Shows "Ship Better Code With Confidence" headline with prominent Open Workspace CTA](image4.png)

**Design Elements:**
- Bold headline with orange accent color
- Tagline emphasizing under 20 seconds delivery
- Language support callout
- "Open Workspace" CTA button
- Tech stack display at bottom

---

## 📁 Project Structure

```
llm-code-reviewer/
├── .github/workflows/
│   ├── ci.yml                      # Build, test, cache dependencies pipeline
│   └── ci-cd.yml                   # Docker validation, artifact upload
├── backend/
│   ├── Dockerfile                  # Multi-stage JDK 17 image
│   ├── pom.xml                     # Maven dependencies (34 Spring Boot modules)
│   └── src/main/java/com/codereviewer/
│       ├── config/                 # CORS, Redis, Security, JWT config
│       ├── controller/             # Auth, Review, Analytics, Share APIs
│       ├── dto/                    # Request/Response schemas
│       ├── model/                  # JPA Entities (User, Review, ReviewTag, ShareLink)
│       ├── repository/             # Spring Data JPA interfaces
│       ├── security/               # JWT filters, token providers, OAuth handlers
│       └── service/                # AI, RateLimit, Export, Analytics, Share services
├── frontend/
│   ├── Dockerfile                  # Multi-stage Node + Nginx image
│   ├── nginx.conf                  # SSE-optimized config (no buffering, 300s timeout)
│   ├── package.json                # React 19, Vite, Tailwind, Recharts
│   └── src/
│       ├── components/             # Editor, Diff Viewer, Charts, Dashboard
│       ├── context/                # Global Auth context
│       ├── pages/                  # Home, Review, Dashboard, Login, Share, 404
│       └── services/               # Axios client, SSE helpers, API interceptors
├── docker-compose.yml              # MySQL + Redis + Backend + Frontend orchestration
├── project_details_report.md       # Complete technical specifications (this file)
└── README.md                       # This file

**Code Statistics:**
- Backend (Java): 34 files, ~2,413 lines
- Frontend (JS/JSX/CSS): 27 files, ~5,824 lines
- **Total: 61 source files, 8,237 lines of code**
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Docker & Docker Compose
- Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))
- (Optional) Google OAuth credentials

### Installation

#### Step 1: Clone Repository
```bash
git clone https://github.com/rupeshkumar006/llm-code-reviewer.git
cd llm-code-reviewer
```

#### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# AI & Auth
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_32_character_secret_key

# Database
DB_HOST=mysql
DB_PORT=3306
DB_NAME=code_reviewer
DB_USER=root
DB_PASS=root_password

# Cache
REDIS_HOST=redis
REDIS_PORT=6379

# Frontend
FRONTEND_URL=http://localhost
CORS_ORIGINS=http://localhost
```

#### Step 3: Get Free Gemini API Key
1. Visit [https://aistudio.google.com](https://aistudio.google.com)
2. Click **Get API Key** → **Create API key in new project**
3. Copy the key and paste into `.env`

#### Step 4: Launch Docker Containers
```bash
docker-compose up --build
```

This starts:
- **MySQL 8** on port 3306 (persisted volume)
- **Redis 7** on port 6379
- **Spring Boot API** on port 8080
- **React + Nginx** on port 80

#### Step 5: Verify Setup
```bash
# Health check
curl http://localhost:8080/actuator/health

# Frontend
open http://localhost
```

### Docker Commands Reference
```bash
# Start services
docker-compose up

# Rebuild images
docker-compose up --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Clean volumes
docker-compose down -v
```

---

## 🔐 Security Features

### 1. Authentication & Authorization
- **JWT-Based Stateless Auth**: Access tokens (15 min) + Refresh tokens (7 days, DB-backed)
- **Google OAuth2**: One-click secure login
- **Password Encryption**: BCrypt hashing with salt rounds
- **CORS Protection**: Configurable allowed origins
- **HTTPS Ready**: Supports secure deployments on Render/Vercel

### 2. Input Validation & Sanitization
- **Code Size Limit**: 50KB max to prevent resource exhaustion
- **JSON Extraction**: Escapes markup, extracts JSON safely between braces
- **SQL Injection Prevention**: Parameterized queries via JPA
- **XSS Protection**: React built-in sanitization

### 3. Rate Limiting
- **Redis Sliding Window**: Tracks requests over rolling 1-hour window
- **Tier-Based Limits**: 
  - Free: 10 reviews/hour
  - Pro: Unlimited
  - Admin: Unlimited
- **Graceful Degradation**: Fails open if Redis unavailable

### 4. Code Quality & Best Practices
- **OWASP Top 10 Detection**: SQL injection, XSS, hardcoded secrets, etc.
- **Cyclomatic Complexity**: Identifies overly complex code
- **Performance Analysis**: Memory leaks, inefficient algorithms
- **Security Scoring**: A–D grade based on vulnerability severity

---

## 📊 Analytics & Metrics

### Dashboard Metrics
- **Total Reviews**: Lifetime count
- **Average Quality Score**: 0–100 scale
- **Current Streak**: Consecutive days reviewed
- **Bugs Detected**: Total across all reviews
- **Security Grade**: A–D scale (OWASP compliance)

### Trend Analysis
- **Quality Evolution**: Line chart (7-day, 30-day, all-time)
- **Language Distribution**: Pie chart of reviewed languages
- **Issue Breakdown**: Pie chart (Logic Errors, Security, Style, Complexity)
- **Activity Heatmap**: Weekly review distribution

### Compare Reviews
- **Radar Chart**: Side-by-side comparison of two reviews
- **Metrics**: Quality, security, bugs, complexity comparison
- **Export**: Download comparison as PDF

---

## 📤 Export & Reporting

### PDF Export
Professional reports include:
- Review metadata (date, language, author)
- Summary metrics (quality score, security grade, bugs detected)
- Formatted code block (original + refactored)
- Severity chips (High, Medium, Low, Info)
- Structured tables for issues/recommendations
- Custom branding with CodeReviewer logo

### JSON Export
- Full structured review data
- All metrics and issue details
- Refactored code suggestions
- Metadata (timestamp, language, user)
- Integration-friendly format

### Share Links
- Public URLs with 64-character unique tokens
- Optional expiry duration (1 hour, 1 day, 7 days, no limit)
- Password-optional protection
- View-only access (no modifications)

---

## 🌐 Deployment

### Frontend (Vercel)
```bash
# Connect GitHub repo to Vercel
# Auto-deploys on main branch push
# Environment variables: VITE_API_URL, VITE_GOOGLE_CLIENT_ID
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@api_url"
  }
}
```

### Backend (Render)
```bash
# Connect GitHub repo to Render
# Railway/Render auto-deploys on push
# Database: MySQL on Aiven
# Cache: Redis on Upstash
```

**Environment Variables:**
- `GEMINI_API_KEY`
- `JWT_SECRET`
- `DB_HOST`, `DB_USER`, `DB_PASS`
- `REDIS_HOST`, `REDIS_PORT`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

---

## 🔧 Development & Contributing

### Local Development Setup

**Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Running Tests

**Backend Unit Tests** (H2 in-memory DB):
```bash
mvn test
```

**Frontend ESLint Check:**
```bash
cd frontend
npm run lint
```

### Code Style Guidelines
- **Backend**: Spring Boot conventions, Lombok for annotations
- **Frontend**: React hooks, Tailwind CSS utilities, ESLint rules
- **Commit Messages**: Conventional commits (feat:, fix:, docs:, etc.)

---

## 📝 API Documentation

### Authentication Endpoints

**POST** `/api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**POST** `/api/auth/refresh`
```json
{
  "refreshToken": "uuid-token-here"
}
```

### Review Endpoints

**POST** `/api/review` (Traditional)
```json
{
  "code": "function test() { ... }",
  "language": "javascript"
}
```

**POST** `/api/review/stream` (SSE Streaming)
- Returns: Server-Sent Events stream
- Events: `status`, `result`, `error`

**GET** `/api/reviews` — List user reviews

**GET** `/api/reviews/{id}` — Get review details

**DELETE** `/api/reviews/{id}` — Delete review

### Analytics Endpoints

**GET** `/api/analytics/dashboard` — Summary metrics

**GET** `/api/analytics/trends` — Historical trends

**GET** `/api/analytics/compare/{id1}/{id2}` — Compare two reviews

### Export Endpoints

**POST** `/api/export/pdf` — Generate PDF report

**POST** `/api/export/json` — Export as JSON

### Share Endpoints

**POST** `/api/share/create` — Create public share link

**GET** `/api/share/{token}` — Access shared review

---

## 🐛 Troubleshooting

### Common Issues

**Q: Docker containers won't start**
```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

**Q: Gemini API key invalid**
- Verify key in `.env`
- Check key hasn't expired (regenerate if needed)
- Ensure quota not exceeded on Google Cloud

**Q: Redis connection refused**
- Check Redis container running: `docker ps`
- Verify Redis port 6379 accessible
- Check `REDIS_HOST` value in backend config

**Q: JWT token expired**
- Frontend should auto-refresh on 401
- Check interceptor middleware in `services/axios.ts`
- Clear localStorage and re-login

**Q: Reviews not appearing in dashboard**
- Check MySQL connection: `docker-compose logs mysql`
- Verify database created: `docker exec mysql mysql -uroot -ppassword code_reviewer -e "SHOW TABLES;"`

---

## 📊 Performance Metrics

- **Review Processing**: < 20 seconds (Gemini API dependent)
- **Diff Rendering**: < 100ms (Monaco Editor)
- **Dashboard Load**: < 500ms (Recharts optimization)
- **API Response**: < 200ms (Spring Boot caching)
- **Rate Limit Check**: < 10ms (Redis)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 👥 Contributors

| Contributor | Role | GitHub |
|---|---|---|
| **Rupesh Kumar** | Full-Stack Developer, Architect | [@rupeshkumar006](https://github.com/rupeshkumar006) |
| **Priya Dharshini M** | Collaborator | [@m-priya-671](https://github.com/m-priya-671) |

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

**You are free to:**
- ✅ Use, modify, and distribute
- ✅ Commercial and private use
- ✅ Sublicense

**You must:**
- ℹ️ Include license and copyright notice
- ℹ️ State significant changes

---

## 🔗 Useful Links

- **Documentation**: [project_details_report.md](project_details_report.md)
- **GitHub Issues**: [Report bugs or feature requests](https://github.com/rupeshkumar006/llm-code-reviewer/issues)
- **Discussions**: [Ask questions & share ideas](https://github.com/rupeshkumar006/llm-code-reviewer/discussions)
- **Gemini API**: [https://ai.google.dev](https://ai.google.dev)
- **React 19**: [https://react.dev](https://react.dev)
- **Spring Boot**: [https://spring.io/projects/spring-boot](https://spring.io/projects/spring-boot)

---

## ⭐ Show Your Support

If you find this project helpful, please consider giving it a star! Your support helps us grow and improve.

```
Made with ❤️ by the CodeReviewer team
```
