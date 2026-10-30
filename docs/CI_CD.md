# CI/CD Pipeline & Deployment Architecture Guide

This document outlines the Continuous Integration (CI) and Continuous Deployment (CD) architecture for **ClauseVader** (formerly ClauseVader), covering the frontend (Next.js 15 on Vercel) and the backend (FastAPI Python 3.11 containerized on AWS Lambda & Amazon ECR).

---

## 1. High-Level Architecture Overview

```mermaid
flowchart TD
    subgraph GitHub["GitHub (JHK0723/clausevader)"]
        PR[Pull Request to main] --> CI[CI Pipeline Workflow]
        Push[Push to main] --> CI
        ManualCI[workflow_dispatch] --> CI
        
        subgraph CIJobs["CI Jobs (.github/workflows/ci.yml)"]
            F_Lint["Frontend: ESLint & Next.js Build"]
            B_Checks["Backend: Flake8, Compile & Imports"]
            D_Val["Docker: Buildx Image Validation"]
        end
        
        CI --> F_Lint
        CI --> B_Checks
        CI --> D_Val
        
        CI -- "On Success (main branch)" --> CD[CD Pipeline (.github/workflows/deploy.yml)]
        ManualCD[workflow_dispatch] --> CD
    end

    subgraph AWS["AWS Cloud (ap-south-2)"]
        CD -- "OIDC / IAM Auth" --> AWSCreds[AWS Credentials]
        AWSCreds -- "Push linux/amd64 image" --> ECR[Amazon ECR: clausevader-backend]
        ECR -- "update-function-code" --> Lambda[AWS Lambda: clausevader-backend]
        Lambda -- "Wait function-updated" --> APIGW[Amazon API Gateway HTTP API]
    end

    subgraph Vercel["Vercel Cloud"]
        Push -- "Vercel GitHub Integration" --> VercelProd[Production Deployment]
        PR -- "Vercel GitHub Integration" --> VercelPreview[Preview Deployment]
    end
```

---

## 2. Continuous Integration Workflow (`.github/workflows/ci.yml`)

The CI workflow validates every pull request and commit targeting `main`, as well as manual triggers via `workflow_dispatch`.

### Triggers & Concurrency Controls
- **Triggers**:
  - `push` to `main`
  - `pull_request` targeting `main`
  - `workflow_dispatch` (manual)
- **Concurrency**: Cancels redundant in-progress runs on pull requests while allowing `main` branch builds to complete:
  ```yaml
  concurrency:
    group: ci-${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
  ```
- **Permissions**: Minimum required privilege: `contents: read`.

### Job 1: `frontend-checks` (Frontend Lint & Build)
- **Environment**: Node.js 20 on `ubuntu-latest`.
- **Dependency Management**: Runs `npm ci` inside `frontend/` using package-lock caching (`actions/setup-node` with `cache: 'npm'`).
- **ESLint Validation**: Executes `npm run lint`. Configured with `.eslintrc.json` extending `next/core-web-vitals` using `eslint@^8.57.1` to prevent circular-reference schema bugs present in early ESLint 9 + Next.js configurations.
- **Production Build**: Executes `npm run build` using safe placeholder environment variables:
  - `NEXT_PUBLIC_APP_URL: "https://clausevader.placeholder"`
  - `NEXT_PUBLIC_BACKEND_URL: "https://api.clausevader.placeholder"`
  - `DATABASE_URL: "postgresql://ci_dummy:ci_dummy@localhost:5432/ci_dummy"`
  *Note*: No secrets or production database credentials are leaked or required for the build.

### Job 2: `backend-checks` (Backend Syntax & Imports)
- **Environment**: Python 3.11 on `ubuntu-latest`.
- **Dependency Management**: Installs dependencies from `backend/requirements.txt` with pip caching.
- **Bytecode Compilation**: Runs `compileall` across all backend modules and utility scripts to verify 100% syntactical correctness.
- **Flake8 Linting**: Flags critical Python errors (syntax errors, undefined variables, unresolved names) with zero tolerance (`--select=E9,F63,F7,F82`).
- **Module Import Verification**: Imports `main`, `db`, `models`, and `lambda_handler` under a controlled mock environment (`DATABASE_URL`, `AWS_REGION`, `OPENAI_API_KEY`) to confirm that FastAPI app factory, SQLAlchemy models, and Mangum adapter load cleanly without raising initialization errors.
- **Test Suite Audit**: Checks for automated test suites (`tests/`, `pytest.ini`). Clearly reports findings without inventing artificial tests.

### Job 3: `docker-validation` (Docker Container Verification)
- **Environment**: `ubuntu-latest` with Docker Buildx.
- **Verification Targets**:
  1. `backend/Dockerfile` (Web server image: FastAPI + Uvicorn).
  2. `backend/Dockerfile.lambda` (AWS Lambda container image).
- **Execution**: Builds both images locally (`push: false`) to guarantee Dockerfiles, base images, and system dependencies remain unbroken.

---

## 3. Continuous Deployment Workflow (`.github/workflows/deploy.yml`)

The CD workflow automates backend deployment to Amazon ECR and AWS Lambda.

### Deployment Gates & Safeguards
1. **Trigger Restrictions**: Deploys **only** after the `CI Pipeline` workflow completes with conclusion `success` on `main`, or via explicit manual `workflow_dispatch`. It **never** runs on pull requests or feature branches.
2. **Atomic In-Flight Runs**: Concurrency is set to `cancel-in-progress: false` to ensure an in-flight deployment to AWS is never aborted halfway through.
3. **Immutable Image Tagging**: Images are tagged with the specific commit SHA (`${{ github.sha }}`) for traceability and rollback capability, alongside a floating `latest` tag.

### Deployment Steps
1. **AWS Authentication**: Authenticates securely using GitHub Actions OpenID Connect (OIDC) role assumption via `aws-actions/configure-aws-credentials` (fallback supported for standard IAM access keys).
2. **ECR Login**: Authenticates Docker with Amazon ECR via `aws-actions/amazon-ecr-login`.
3. **Multi-Platform Build**: Builds the backend image targeting `linux/amd64` using `backend/Dockerfile.lambda`.
4. **Push to ECR**: Pushes both `$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG` and `$ECR_REGISTRY/$ECR_REPOSITORY:latest`.
5. **Update Lambda Function**: Calls `aws lambda update-function-code` to point the function to the newly pushed container image.
6. **Wait & Verify**: Uses `aws lambda wait function-updated` to poll until Lambda reaches `LastUpdateStatus: Successful`. If Lambda encounters an image pull error or configuration fault, the workflow queries `LastUpdateStatusReason` and exits with an explicit error.

---

## 4. Frontend Deployment on Vercel

### How Vercel Integrates into the Pipeline
The frontend repository is connected directly to Vercel via the **Vercel GitHub Integration**:
- **Pull Requests**: Vercel automatically deploys ephemeral **Preview Environments** on every pull request.
- **Production (`main`)**: When changes merge into `main` (and after GitHub Actions CI passes), Vercel automatically creates a production deployment.
- **Zero Redundancy**: Because Vercel handles global Edge CDN deployment, SSL certification, and Next.js asset optimization natively, maintaining a redundant GitHub Actions Vercel CLI workflow is unnecessary and avoided.

### Required Vercel Environment Variables
Set these under **Vercel Dashboard → Project Settings → Environment Variables**:

| Variable | Description | Example / Target |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | *Secret* |
| `NEXT_PUBLIC_APP_URL` | Frontend canonical URL | `https://clausevader.vercel.app` |
| `NEXT_PUBLIC_BACKEND_URL` | AWS API Gateway URL | `https://sco67rfosl.execute-api.ap-south-2.amazonaws.com` |

---

## 5. Required GitHub Configuration

To enable the automated deployment pipeline, configure the following secrets and variables in your GitHub repository (**Settings → Secrets and variables → Actions**).

### Repository Variables (`vars`)
*(Configurable parameters that are not sensitive)*

| Variable Name | Required? | Default Fallback | Description |
| :--- | :---: | :---: | :--- |
| `AWS_REGION` | No | `ap-south-2` | AWS Region where ECR and Lambda reside |
| `ECR_REPOSITORY` | No | `clausevader-backend` | Amazon ECR repository name |
| `LAMBDA_FUNCTION_NAME`| No | `clausevader-backend` | AWS Lambda function name |

### Repository Secrets (`secrets`)
*(Sensitive authentication credentials)*

Choose **Option A (Recommended: OIDC)** or **Option B (IAM Access Keys)**:

#### Option A: AWS OIDC Role Assumption (Recommended)
| Secret Name | Required? | Description |
| :--- | :---: | :--- |
| `AWS_ROLE_TO_ASSUME` | Yes | ARN of the IAM role GitHub Actions will assume (e.g., `arn:aws:iam::575172595786:role/github-actions-deploy-role`) |

#### Option B: IAM Access Keys (Fallback)
| Secret Name | Required? | Description |
| :--- | :---: | :--- |
| `AWS_ACCESS_KEY_ID` | Conditional | IAM user access key with ECR and Lambda update permissions |
| `AWS_SECRET_ACCESS_KEY` | Conditional | IAM user secret access key |

---

## 6. AWS IAM & OIDC Configuration Guide

To use keyless, secure AWS OIDC role assumption, set up the OpenID Connect identity provider and IAM role in AWS:

### 1. Add GitHub as an OIDC Identity Provider in AWS
In the AWS IAM Console:
- Provider Type: `OpenID Connect`
- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

### 2. IAM Role Trust Relationship
Create an IAM role (e.g., `github-actions-deploy-role`) with this trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::575172595786:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:JHK0723/clausevader:*"
        }
      }
    }
  ]
}
```

### 3. IAM Role Permission Policy
Attach the following least-privilege policy to the role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAuth",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECRPush",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:ap-south-2:575172595786:repository/clausevader-backend"
    },
    {
      "Sid": "LambdaDeploy",
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunctionConfiguration"
      ],
      "Resource": "arn:aws:lambda:ap-south-2:575172595786:function:clausevader-backend"
    }
  ]
}
```

---

## 7. Current Automation Status & Testing Roadmap

### What is Automated Today
- ✅ Frontend dependency synchronization (`npm ci`) and lockfile validation.
- ✅ Frontend code quality and JSX formatting via ESLint (`next/core-web-vitals`).
- ✅ Frontend Next.js production build validation (`npm run build`).
- ✅ Backend Python 3.11 bytecode compilation across all modules (`compileall`).
- ✅ Backend static analysis (`flake8`) for syntax errors and undefined symbols.
- ✅ Backend module import validation ensuring SQLAlchemy models, FastAPI routes, and Mangum adapter initialize cleanly.
- ✅ Docker container build verification for both standalone FastAPI and AWS Lambda targets.
- ✅ AWS ECR multi-platform image build, tagging with Git commit SHA, and deployment to AWS Lambda.
- ✅ Lambda update polling and status verification.

### What is Not Yet Implemented (Testing Roadmap)
- ⚠️ **Unit Tests (`pytest`)**: The backend currently does not possess automated unit tests for business logic (`utils/clause_scoring.py`, `utils/extract_text.py`). Adding unit tests with mocked OpenAI responses is recommended as a future enhancement.
- ⚠️ **Integration Tests**: Tests against a live or containerized PostgreSQL test instance are not currently run in CI.
- ⚠️ **End-to-End Tests**: Playwright or Cypress tests for user flows (Google login, PDF contract upload, interactive chat) are not currently configured.

---

## 8. Troubleshooting Guide

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| **`npm ci` lockfile mismatch** | `package.json` changed without updating `package-lock.json` | Run `npm install` locally inside `frontend/` and commit the updated `package-lock.json`. |
| **ESLint unescaped quote error** | Raw double quotes used inside JSX text nodes | Replace with `&ldquo;` and `&rdquo;` or `&quot;`. |
| **Lambda update status failed** | ECR image format incompatible or handler name mismatch | Ensure image was built with `--platform linux/amd64` and entrypoint matches `lambda_handler.handler`. |
| **AWS OIDC assume role fails** | Sub claim mismatch in IAM trust policy | Verify `repo:JHK0723/clausevader:*` matches your exact GitHub repository path and owner casing. |
| **Backend import error in CI** | Missing environment variable at import time | Verify `DATABASE_URL` is passed in CI step environment variables. |
