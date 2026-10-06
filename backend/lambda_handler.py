"""
AWS Lambda entry point for ClauseVader FastAPI backend.

This module wraps the FastAPI `app` using the `mangum` adapter so that
API Gateway HTTP API (or REST API) can invoke it as a Lambda function.

Lambda Handler: `lambda_handler.handler`

Environment variables required by the Lambda function:
  DATABASE_URL        — PostgreSQL connection string (Aurora Serverless)
  OPENAI_API_KEY      — OpenAI API key
  AWS_S3_BUCKET_NAME  — S3 bucket for contract files
  AWS_REGION          — AWS region (e.g. us-east-1)
  ALLOWED_ORIGINS     — Comma-separated list of allowed CORS origins
"""

from mangum import Mangum
from main import app  # noqa: F401  (triggers app initialisation)

# `lifespan="off"` is recommended for Lambda because there is no persistent
# server process — each invocation is independent.
handler = Mangum(app, lifespan="off")
