# Security & Configuration Guide for ClauseVader

## Environment Variables

All sensitive configuration must be provided via environment variables. **Never commit real credentials to the repository.**

### Required Environment Variables

#### Database
- **`DATABASE_URL`** (required)
  - Format: `postgresql://user:password@host:port/database`
  - Examples:
    - Local: `postgresql://postgres:password@localhost:5432/clausevader`
    - AWS Aurora: `postgresql://admin:password@clausevader-db.cluster-xxx.region.rds.amazonaws.com:5432/postgres`
    - NeonDB: `postgresql://user:password@your-project.neon.tech/clausevader?sslmode=require`

#### API Keys (choose one or more)
- **`OPENAI_API_KEY`** (recommended for production)
  - OpenAI GPT models (gpt-4o-mini, gpt-4)
  - Format: `sk-...`
  - Get at: https://platform.openai.com/account/api-keys

- **`OPENROUTER_API_KEY`** (optional, for free/alternative models)
  - Format: `sk-or-v1-...`
  - Set `LLM_BASE_URL=https://openrouter.ai/api/v1`
  - Get at: https://openrouter.ai

- **`LLM_API_KEY`** (optional, for custom LLM endpoints)
  - Requires `LLM_BASE_URL` and optionally `LLM_MODEL`

#### AWS Configuration
- **`AWS_S3_BUCKET_NAME`** (optional)
  - S3 bucket for storing uploaded contract files
  - If empty, files are processed in-memory only
  - Example: `clausevader-contracts`

- **`AWS_REGION`** (optional, defaults to `us-east-1`)
  - AWS region for S3 and Lambda deployment
  - Example: `ap-south-2`, `us-east-1`, `eu-west-1`

#### CORS Configuration
- **`ALLOWED_ORIGINS`** (optional, defaults to localhost + Vercel)
  - Comma-separated list of allowed frontend origins
  - Example: `http://localhost:3000,https://clausevader.vercel.app`

### Frontend Environment Variables (Vercel / Next.js)

- **`GOOGLE_CLIENT_ID`** (required)
  - Google OAuth client ID from Google Cloud Console
  - Format: `xxx.apps.googleusercontent.com`

- **`GOOGLE_CLIENT_SECRET`** (required)
  - Google OAuth client secret

- **`NEXT_PUBLIC_APP_URL`** (required)
  - Full URL of this frontend (no trailing slash)
  - Example: `https://clausevader.vercel.app`

- **`NEXT_PUBLIC_BACKEND_URL`** (required)
  - Full URL of the FastAPI backend (no trailing slash)
  - Example: `https://api.clausevader.example.com`

---

## Local Development Setup

### 1. Backend (.env in `backend/` directory)

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env`:
```dotenv
DATABASE_URL=postgresql://postgres:localpassword@localhost:5432/clausevader
OPENAI_API_KEY=sk-your-test-key-here
AWS_S3_BUCKET_NAME=
AWS_REGION=us-east-1
ALLOWED_ORIGINS=http://localhost:3000
```

### 2. Frontend (.env.local in `frontend/` directory)

```bash
cp frontend/.env.example frontend/.env.local
```

Then edit `frontend/.env.local`:
```dotenv
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## Deployment Configuration

### AWS Lambda + Railway / Vercel

**Backend (set in Railway / Lambda environment):**
```
DATABASE_URL=postgresql://admin:PRODUCTION_PASSWORD@aurora-cluster-xyz.region.rds.amazonaws.com:5432/postgres
OPENAI_API_KEY=sk-prod-key-here
AWS_S3_BUCKET_NAME=clausevader-contracts-prod
AWS_REGION=ap-south-2
ALLOWED_ORIGINS=https://clausevader.vercel.app,https://your-domain.com
```

**Frontend (set in Vercel project settings → Environment Variables):**
```
GOOGLE_CLIENT_ID=prod-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=prod-secret
NEXT_PUBLIC_APP_URL=https://clausevader.vercel.app
NEXT_PUBLIC_BACKEND_URL=https://api-xyz.execute-api.ap-south-2.amazonaws.com/prod
```

---

## Security Best Practices

✅ **Do:**
- Use environment variables for all secrets and configuration
- Keep `.env` files in `.gitignore` (already configured)
- Rotate credentials regularly in production
- Use different credentials for dev, staging, and production
- Store secrets in deployment platform (Railway, Vercel, AWS Secrets Manager)

❌ **Don't:**
- Commit `.env` files to Git
- Hardcode credentials in source code
- Put real credentials in `.env.example`
- Log sensitive values (database URLs, API keys)
- Share `.env` files via email or Slack
- Use the same credentials across environments

---

## Checking Configuration at Runtime

The `backend/config.py` module validates all required environment variables on startup.
If any required config is missing, the application will fail with a clear error message.

Example validation errors:
```
ValueError: Configuration validation failed:
  - DATABASE_URL environment variable is required
  - OPENAI_API_KEY must start with 'sk-'
```

---

## Rotating Credentials

If you suspect a credential has been exposed:

1. **Database:**
   - Generate a new password in AWS RDS / NeonDB console
   - Update `DATABASE_URL` in all deployment environments
   - Restart backend services

2. **API Keys:**
   - Revoke the old key in OpenAI / OpenRouter console
   - Generate a new key
   - Update `OPENAI_API_KEY` / `OPENROUTER_API_KEY` in all environments
   - Restart backend services

3. **Google OAuth:**
   - Regenerate client secret in Google Cloud Console
   - Update `GOOGLE_CLIENT_SECRET` in all deployment environments
   - Restart frontend services

---

## Verifying No Credentials Are Exposed

Run these checks before each deployment:

```bash
# Ensure no .env files are in Git
git ls-files | grep -E '\.env$|\.env\.(local|dev|prod)$'
# Should return nothing

# Check that example files only contain placeholders
grep -r "DATABASE_URL\|API_KEY\|SECRET" backend/.env.example frontend/.env.example
# Should only show placeholders like 'sk-...' or 'user:password@localhost'

# Scan for common credential patterns (optional, use git-secrets or similar)
git log --all --source --full-history -S 'postgresql://' -- '*.py' '*.env*'
# Should return nothing for production environments
```

---

Last updated: 2025-10-12
