# CodeReviewer

![CI](https://github.com/rupeshkumar06/llm-code-reviewer/actions/workflows/ci.yml/badge.svg)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green)
![React](https://img.shields.io/badge/React-18-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)

> AI-powered code review tool. Paste code, get bugs, security 
> issues, and a quality score in under 20 seconds.

## Live Demo
[Add your Railway/Render URL here after deployment]

## Features
- Detects bugs, security vulnerabilities (OWASP Top 10), 
  code quality issues
- Supports 10+ languages: Java, Python, JavaScript, 
  TypeScript, Go, C++, SQL, PHP, Ruby, Rust
- AI-generated refactored code with inline diff view
- Analytics dashboard with score trends and heatmap
- Export reports as PDF or JSON
- Guest mode — no signup required for basic reviews
- JWT authentication for persistent history and analytics

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Monaco Editor |
| Backend | Java 17, Spring Boot 3, Spring Security, JPA |
| Database | MySQL 8 |
| Cache | Redis 7 |
| AI | Google Gemini 2.5 Flash API |
| DevOps | Docker, Docker Compose, GitHub Actions |

## Quick Start (Docker)

```bash
# 1. Clone the repo
git clone https://github.com/rupeshkumar06/llm-code-reviewer.git
cd llm-code-reviewer/code-reviewer

# 2. Set up environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 3. Run
docker-compose up --build

# 4. Open
# Frontend: http://localhost
# Backend API: http://localhost:8080
# Health check: http://localhost:8080/actuator/health
```

## Get a Free Gemini API Key
1. Go to https://aistudio.google.com
2. Click "Get API Key" → "Create API key"
3. Paste it in your .env as GEMINI_API_KEY=...

## Architecture
4 Docker containers on a shared bridge network:
- MySQL 8 (port 3307)
- Redis 7 (port 6379)  
- Spring Boot API (port 8080)
- React/Nginx (port 80)

## Screenshots
[Add screenshots here]

## License
MIT
