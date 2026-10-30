# ⚖️ ClauseVader — Enterprise AI Contract Intelligence Platform

![ClauseVader](frontend/public/clausevader.jpeg)

[![Production Live](https://img.shields.io/badge/Live-clausevadermain.vercel.app-red?style=for-the-badge&logo=vercel)](https://clausevadermain.vercel.app/)
[![AWS Region](https://img.shields.io/badge/AWS_Region-ap--south--2_(Hyderabad)-orange?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/)
[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js_15_%7C_React_19-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_Python_3.11-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Aurora Serverless v2](https://img.shields.io/badge/Database-Aurora_PostgreSQL_17.9-336791?style=for-the-badge&logo=postgresql)](https://aws.amazon.com/rds/aurora/)
[![Docker Container](https://img.shields.io/badge/Compute-AWS_Lambda_Container_Image-blue?style=for-the-badge&logo=docker)](https://aws.amazon.com/lambda/)
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub_Actions_%2B_OIDC-2088FF?style=for-the-badge&logo=github-actions)](https://github.com/features/actions)

> **“You may upload the agreement… but it does not favor you.”** — *ClauseVader*

**Live Production URL:** [https://clausevadermain.vercel.app/](https://clausevadermain.vercel.app/)  

---

## 📌 Executive Summary

**ClauseVader** is a full-stack, cloud-native legal contract analysis platform. It combines a modern edge-rendered frontend on **Vercel** with an elastic, serverless compute engine on **Amazon Web Services (AWS ap-south-2 Hyderabad)** and advanced Large Language Model (LLM) orchestration.

Non-lawyers (employees, freelancers, tenants, students) frequently execute commercial and employment agreements without understanding hidden risks, unilateral termination clauses, overreaching non-competes, or indemnity obligations. ClauseVader eliminates this legal information asymmetry:
1. Deconstructs `.pdf` and `.docx` contracts in-memory into individual clause entities.
2. Mathematically calculates clause **Fairness** ($x \in [0.0, 1.0]$) and **Risk** ($y \in [0.0, 1.0]$).
3. Plots clauses on an interactive **2D Scatter Plot** to highlight red flags in the dangerous quadrant.
4. Generates an animated circular **Favorability Score Gauge** (0% to 100%).
5. Provides an interactive **Redline Matrix** with balanced alternative phrasing.
6. Streams token-by-token real-time strategic legal counsel via a **Sith Lord AI Persona** (ClauseVader) over Server-Sent Events (SSE).
7. Synthesizes identified risks into a formal **Counter-Offer Negotiation Package** with direct export to an encrypted **Amazon S3** vault.

---

## 🏛️ High-Level Cloud Architecture

ClauseVader implements a decoupled **Serverless + Edge** architectural topology. The presentation tier is distributed globally across Vercel's Anycast Edge Network, while backend ingestion, relational state, object storage, and compute execute on Amazon Web Services in the `ap-south-2` (Hyderabad) region.

```
                           +----------------------------------------+
                           |           Client Web Browser           |
                           +-------------------+--------------------+
                                               |
                     HTTPS / TLS 1.3           |   REST API & SSE Stream
            +----------------------------------+----------------------------------+
            |                                                                     |
            v                                                                     v
+-------------------------------+                             +---------------------------------------+
|          VERCEL EDGE          |                             |        AMAZON WEB SERVICES (AWS)      |
|     Global Anycast Network    |                             |          Region: ap-south-2           |
+-------------------------------+                             +---------------------------------------+
|  • Next.js 15 (React 19)      |                             |                                       |
|  • Server Components (SSR)    |                             |  +---------------------------------+  |
|  • Tailwind CSS v4 Dark UI    |                             |  |  Amazon API Gateway (sco67rfosl)|  |
|  • 3D Star Wars Intro Crawl   |                             |  |  • HTTP API v2 ($default route) |  |
|  • 2D Interactive Scatter Plot|                             |  |  • Strict CORS Whitelist        |  |
|  • Google OAuth 2.0 Auth      |                             |  +----------------+----------------+  |
+---------------+---------------+                                                 |                   |
                |                                      Proxy Event Payload (v2.0) |                   |
                | Direct DB Queries                                               v                   |
                | (Server Components)                         +------------------------------------+  |
                |                                             |   AWS Lambda Container Compute     |  |
                |                                             |   (function: clausevader-backend)  |  |
                |                                             |   • Python 3.11 + FastAPI + Mangum |  |
                |                                             |   • 512 MB RAM | 300s Timeout      |  |
                |                                             |   • In-Memory PDF/DOCX Parsing     |  |
                |                                             |   • LLM Prompt Orchestration       |  |
                |                                             +--------+------------------+--------+  |
                |                                                      |                  |           |
                +---------------------------------+                    |                  |           |
                                                  |                    |                  |           |
                                                  v                    v                  |           |
                               +------------------------------------+  |                  |           |
                               |  Amazon Aurora PostgreSQL          |<-+                  |           |
                               |  Serverless v2 (clausevader-db)    |                     |           |
                               |  • Engine: PostgreSQL 17.9         |                     |           |
                               |  • Auto-Scale: 0.5 to 2.0 ACU      |                     |           |
                               |  • Multi-AZ 6-Way Storage          |                     |           |
                               |  • AWS KMS Volume Encryption       |                     |           |
                               +------------------------------------+                     |           |
                                                                                          |           |
                                                  +---------------------------------------+           |
                                                  |                                                   |
                                                  v                                                   v
                               +------------------------------------+  +---------------------------+  |
                               |  Amazon S3 Encrypted Document Vault|  |  Amazon CloudWatch        |  |
                               |  (clausevader-contracts-vault)     |  |  Production Monitoring    |  |
                               |  • Server-Side Encryption (AES-256)|  |  • API Gateway Latency    |  |
                               |  • 100% Block Public Access        |  |  • Lambda Execution Logs |  |
                               |  • contracts/{doc_id}/{filename}   |  |  • Aurora Capacity (ACU)  |  |
                               |  • negotiations/{doc_id}/export.txt|  |  • S3 Bucket Storage Size |  |
                               +------------------------------------+  +---------------------------+  |
                                                                                                      |
+-----------------------------------------------------------------------------------------------------+
|                                    DEVOPS & CONTINUOUS DELIVERY                                     |
|  GitHub Actions (.github/workflows)                                                                 |
|  • ci.yml:     ESLint validation, Next.js build, Flake8 linting, compileall, Docker Buildx          |
|  • deploy.yml: Keyless AWS OIDC authentication, Docker build linux/amd64, push to Amazon ECR,       |
|                zero-downtime AWS Lambda function update verification (`wait function-updated`)      |
+-----------------------------------------------------------------------------------------------------+
```

---

## 🚀 Key Features & Capabilities

| Feature | Technical Implementation | User Value |
| :--- | :--- | :--- |
| **In-Memory File Ingestion** | `pdfplumber` + `python-docx` via `io.BytesIO` streams | Fast text parsing without writing unencrypted temporary files to server disk. |
| **Contractor Role Calibration** | Multi-tenant role selector: `Recipient`, `Issuer`, `Unsure` | AI evaluates clauses contextually (e.g., flags IP grabs for employees, verifies IP retention for employers). |
| **2D Risk vs. Fairness Graph** | `@nivo/scatterplot` with interactive Cartesian coordinates | Instantly highlights dangerous, one-sided clauses in the upper-right quadrant. |
| **Radial Favorability Gauge** | Mathematical aggregation: $\text{Score} = \text{round}\left(\frac{\sum (1 - x)}{N} \times 100\right)$ | Gives an immediate 0% to 100% overall contract health indicator. |
| **Granular Redline Matrix** | Structured JSON decomposition: summary, pros, cons, and rewrites | Gives signers specific alternative language to propose back to the issuer. |
| **Real-Time Streaming AI Counsel** | Server-Sent Events (SSE) via FastAPI `StreamingResponse` | Token-by-token legal advice in the voice of ClauseVader with sub-second first-token response. |
| **Counter-Offer Negotiation Drafter** | Dynamic template synthesizer + Amazon S3 export | Formulates formal counter-proposal emails and exports `Counter_Offer_Package.txt` directly to S3. |
| **Secure Authentication** | Google OAuth 2.0 with Arctic + HttpOnly Secure cookies | Passwordless session security with automated user provisioning in PostgreSQL. |

---

## 🛠️ Technology Stack

### Frontend Tier (Vercel Edge)
- **Framework:** [Next.js 15.3.8](https://nextjs.org/) (React 19, App Router)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + Radix UI Primitives
- **Data Visualization:** [@nivo/scatterplot](https://nivo.rocks/scatterplot/)
- **Animation:** `@liorpo/react-star-wars-crawl` (3D CSS perspective transforms)
- **Authentication:** [Arctic](https://arctic.js.org/) (Google OAuth 2.0)
- **Database Driver:** `@neondatabase/serverless` / `pg` connection pool
- **Icons & Notifications:** Lucide React, Sonner Toasts

### Compute & API Tier (Amazon Web Services)
- **Cloud Region:** `ap-south-2` (Asia Pacific - Hyderabad)
- **API Management:** [Amazon API Gateway](https://aws.amazon.com/api-gateway/) HTTP API (`sco67rfosl`, Payload Format 2.0)
- **Serverless Compute:** [AWS Lambda](https://aws.amazon.com/lambda/) OCI Container Image (`clausevader-backend`)
- **Web Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11, asynchronous ASGI)
- **Lambda Adapter:** [Mangum](https://mangum.io/) (`lifespan='off'`)
- **Document Extractors:** `pdfplumber`, `pypdfium2`, `python-docx`
- **AI Inference Engine:** OpenAI GPT-4o-mini & OpenRouter Liquid LFM 2.5
- **Streaming:** Server-Sent Events (SSE) via `StreamingResponse`

### Database & Storage Tier (Amazon Web Services)
- **Relational Database:** [Amazon Aurora PostgreSQL Serverless v2](https://aws.amazon.com/rds/aurora/) (Engine: PostgreSQL 17.9)
  - Auto-scaling capacity: **0.5 ACU** (~1 GB RAM) to **2.0 ACU** (~4 GB RAM)
  - 6-way automated storage replication across 3 Availability Zones
  - Storage encrypted at rest using AWS KMS
- **Object Storage:** [Amazon Simple Storage Service (S3)](https://aws.amazon.com/s3/)
  - Bucket: `clausevader-contracts-vault`
  - 100% Block Public Access with mandatory Server-Side Encryption (`AES256` / SSE-S3)
  - Enforced TLS 1.2+ transport via `aws:SecureTransport` bucket policy

### CI/CD, Containerization & Telemetry
- **Container Registry:** [Amazon ECR](https://aws.amazon.com/ecr/) (`clausevader-backend`, scan-on-push enabled)
- **CI/CD Automation:** GitHub Actions (`.github/workflows/ci.yml` and `deploy.yml`)
- **Authentication:** Keyless AWS OpenID Connect (OIDC) via `github-actions-deploy-role`
- **Telemetry & Monitoring:** Amazon CloudWatch Dashboard (`ClauseVader-Production-Monitoring`)
  
---

## 🔄 CI/CD Automation Architecture

### 1. Continuous Integration (`.github/workflows/ci.yml`)
Triggers on all pull requests and pushes to `main`. Executes three parallel validation jobs:
- **`frontend-checks`:** Runs on Node.js 20, executes `npm ci` with lockfile caching, validates code with ESLint, and runs the full Next.js production build (`npm run build`).
- **`backend-checks`:** Runs on Python 3.11, validates bytecode compilation (`compileall`), runs Flake8 static analysis (`--select=E9,F63,F7,F82`), and verifies that all core modules (`main`, `db`, `models`, `lambda_handler`) import successfully.
- **`docker-validation`:** Uses Docker Buildx to build `Dockerfile.lambda` locally (`push: false`) to guarantee container layers compile cleanly.

### 2. Continuous Deployment (`.github/workflows/deploy.yml`)
Executes strictly when the upstream CI pipeline succeeds on the `main` branch:
1. **OIDC Authentication:** Assumes `arn:aws:iam::123456789012:role/github-actions-deploy-role` via GitHub Actions OpenID Connect (no static AWS secrets).
2. **ECR Login:** Authenticates Docker client with Amazon ECR.
3. **Multi-Platform Build:** Builds the backend container image targeting `linux/amd64` using `backend/Dockerfile.lambda`.
4. **Push to ECR:** Tags and pushes the image with the unique Git commit SHA and the floating `latest` tag.
5. **Lambda Deployment:** Dispatches `aws lambda update-function-code` to point the function to the newly pushed container URI.
6. **Verification Polling:** Executes `aws lambda wait function-updated` until status transitions to `Successful`.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 20.x or higher
- Python 3.11
- Docker Desktop
- PostgreSQL (Local or AWS Aurora / NeonDB instance)

### 1. Clone the Repository
```bash
git clone https://github.com/JHK0723/clausevader.git
cd clausevader
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env`:
```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/clausevader
OPENAI_API_KEY=sk-...
AWS_S3_BUCKET_NAME=clausevader-contracts-vault
AWS_REGION=ap-south-2
ALLOWED_ORIGINS=http://localhost:3000
```

Run database migrations and start the server:
```bash
python create_tables.py
uvicorn main:app --reload --port 8000
```
Interactive Swagger API documentation will be available at `http://localhost:8000/docs`.

### 3. Frontend Setup (Next.js)
```bash
cd ../frontend
npm install

# Configure environment variables
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/clausevader
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Start the Next.js development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Running with Docker Compose
To run the entire backend stack containerized locally:
```bash
docker compose up --build
```

---

## 🔒 Security Best Practices

- **Zero Hardcoded Secrets:** All credentials, database URIs, and API tokens are injected at runtime via environment variables and deployment platform secrets.
- **Keyless AWS Deployment:** GitHub Actions uses AWS OIDC role assumption with strict repository-scoped trust policies (`repo:JHK0723/clausevader:*`).
- **Encrypted Storage:** All uploaded contracts are encrypted at rest using AES-256 server-side encryption (`SSE-S3`) and protected by private bucket policies.
- **In-Transit Security:** Strict TLS 1.2+ encryption across API Gateway, Aurora PostgreSQL SSL mode (`sslmode=require`), and S3 HTTPS calls.
- **CORS Hardening:** Whitelisted strictly to the authorized Vercel domain and local development origins.

---

## 📄 License & Academic Attribution

This project was engineered by **Harish krishna J (Register Number: 24BAI1022)** as part of the course curriculum for **BCSE355L — Cloud Architecture and Design** at the **School of Computer Science and Engineering, Vellore Institute of Technology (VIT Chennai)**.

Licensed under the [MIT License](LICENSE).
