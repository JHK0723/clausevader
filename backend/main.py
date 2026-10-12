from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from uuid import uuid4, UUID
import os
import io
import boto3

from typing import Optional, Dict, Any
from pydantic import BaseModel

from config import Config
from db import SessionLocal
from models import User, Document, Clause, Chat, DocumentStatusEnum, NegotiationDraft
from utils.extract_text import extract_text_from_file
from utils.clause_scoring import analyze_clauses
from utils.chat_assistant import ask_assistant


app = FastAPI()

# ---------------------------------------------------------------------------
# CORS — restrict to the known frontend origins.
# Allow localhost for local development and the Vercel production URL.
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = Config.get_origins_list()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# S3 client — used to store original uploaded contract files.
# Credentials are sourced from the Lambda execution role (no hardcoded keys).
# ---------------------------------------------------------------------------
S3_BUCKET = os.getenv("AWS_S3_BUCKET_NAME", "")
s3_client = boto3.client("s3", region_name=os.getenv("AWS_REGION", "ap-south-2"))
