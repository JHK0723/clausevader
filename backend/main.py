from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from uuid import uuid4, UUID
import os
import io
import boto3

from typing import Optional, Dict, Any
from pydantic import BaseModel

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
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://clausevader.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS],
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


def upload_file_to_s3(file_bytes: bytes, filename: str, doc_id: str) -> str:
    """Upload the original contract file to S3 and return the S3 key."""
    key = f"contracts/{doc_id}/{filename}"
    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=file_bytes,
        ServerSideEncryption="AES256",
    )
    return key


def process_document(doc_id: UUID, extracted_text: str, role: str):
    """
    Synchronous document analysis — runs the LLM clause analysis and persists
    results to the database.

    NOTE: This function is called synchronously (not as a FastAPI background
    task) so it completes before Lambda freezes the execution environment.
    The upload endpoint returns after this function completes.
    """
    db = SessionLocal()

    try:
        analysis = analyze_clauses(extracted_text, role)
        if "error" in analysis and analysis["error"] == True:
            # Mark as failed
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if doc:
                doc.status = DocumentStatusEnum.error
                db.commit()
            return

        for clause in analysis['clause_graph']:
            new_clause = Clause(
                id=UUID(clause['id']) if isinstance(clause['id'], str) else clause['id'],
                document_id=doc_id,
                clause_text=clause['summary'],
                summary=clause['summary'],
                pros=clause.get("pros"),
                cons=clause.get("cons"),
                suggested_rewrite=clause.get("suggested_rewrite"),
                sith_view=clause.get("sith_view"),
                x=clause['x'],
                y=clause['y'],
                impact=clause['impact'],
                favorability_score=int((1 - clause['x']) * 100)
            )
            db.add(new_clause)

        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.favourability_score = analysis['favourability_score']
            doc.status = DocumentStatusEnum.done
            db.commit()
    except Exception as e:
        # Mark document as error so the UI can surface the problem
        db.rollback()
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = DocumentStatusEnum.error
            db.commit()
        raise e
    finally:
        db.close()


@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    role: str = Form(...),
    user_id: int = Form(...),
):
    db = SessionLocal()

    if not (file.filename.endswith(".pdf") or file.filename.endswith(".docx")):
        raise HTTPException(status_code=400, detail="Only PDF or DOCX allowed.")

    # Read file bytes once — needed for both S3 upload and text extraction
    file_bytes = await file.read()
    file_like = io.BytesIO(file_bytes)

    doc_id = uuid4()

    # ------------------------------------------------------------------
    # S3: Store the original contract file (private, server-side encrypted)
    # Falls back gracefully if S3 is not configured (e.g. local dev)
    # ------------------------------------------------------------------
    original_file_url = None
    if S3_BUCKET:
        try:
            s3_key = upload_file_to_s3(file_bytes, file.filename, str(doc_id))
            original_file_url = s3_key  # Store the S3 key, not a public URL
        except Exception as s3_err:
            # Log but don't fail the upload if S3 is unavailable
            print(f"[S3 WARNING] Could not upload to S3: {s3_err}")

    # Extract text from the in-memory file bytes
    extracted_text = extract_text_from_file(file_like, file.filename)

    new_doc = Document(
        id=doc_id,
        user_id=user_id,
        filename=file.filename,
        original_file_url=original_file_url,
        extracted_text=extracted_text,
        role=role,
        status=DocumentStatusEnum.processing,
    )
    db.add(new_doc)
    db.commit()
    db.close()

    # ------------------------------------------------------------------
    # Run analysis synchronously.
    # Lambda does not reliably support FastAPI BackgroundTasks because the
    # execution environment may freeze immediately after the HTTP response
    # is sent. Running synchronously here ensures the analysis completes
    # before we return. The client already polls status separately.
    # ------------------------------------------------------------------
    try:
        process_document(doc_id, extracted_text, role)
    except Exception as e:
        print(f"[ANALYSIS ERROR] doc_id={doc_id}: {e}")

    return {"document_id": str(doc_id), "status": "done"}


@app.get("/api/documents/{doc_id}/status")
def check_status(doc_id: UUID):
    db = SessionLocal()
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": doc.status}


@app.get("/api/documents/{doc_id}/analysis")
def get_analysis(doc_id: UUID):
    db = SessionLocal()
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or doc.status != DocumentStatusEnum.done:
        raise HTTPException(status_code=404, detail="Analysis not ready")

    clauses = db.query(Clause).filter(Clause.document_id == doc_id).all()
    clause_graph = [
        {
            "id": str(clause.id),
            "x": clause.x,
            "y": clause.y,
            "summary": clause.summary,
            "impact": clause.impact,
        }
        for clause in clauses
    ]

    return {
        "favourability_score": doc.favourability_score,
        "clause_graph": clause_graph,
        "meta": {"title": doc.filename, "uploaded_by": doc.user_id},
    }


@app.get("/api/chat/stream")
async def chat_with_doc_stream(document_id: UUID, message: str, user_id: int):
    db = SessionLocal()

    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    async def event_stream():
        full_reply = ""
        try:
            async for token in ask_assistant(message, doc.extracted_text, user_id):
                full_reply += token
                yield f"data: {token}\n\n"
        except Exception as e:
            yield f"data: [Error] {str(e)}\n\n"
        finally:
            chat = Chat(
                user_id=user_id,
                document_id=document_id,
                user_message=message,
                ai_response=full_reply,
            )
            db.add(chat)
            db.commit()

            yield "event: end\ndata: done\n\n"  # signal end of stream

    return StreamingResponse(event_stream(), media_type="text/event-stream")


class NegotiationDraftPayload(BaseModel):
    user_id: int
    subject: str
    email_body: str
    stipend_amount: Optional[str] = None
    key_points: Optional[Dict[str, Any]] = None
    export_to_s3: bool = False


@app.get("/api/documents/{doc_id}/negotiation-draft")
def get_negotiation_draft(doc_id: UUID):
    db = SessionLocal()
    try:
        draft = db.query(NegotiationDraft).filter(NegotiationDraft.document_id == doc_id).first()
        if not draft:
            return {"draft": None}
        return {
            "draft": {
                "id": str(draft.id),
                "document_id": str(draft.document_id),
                "user_id": draft.user_id,
                "subject": draft.subject,
                "email_body": draft.email_body,
                "stipend_amount": draft.stipend_amount,
                "key_points": draft.key_points,
                "s3_key": draft.s3_key,
                "created_at": str(draft.created_at),
                "updated_at": str(draft.updated_at),
            }
        }
    finally:
        db.close()


@app.post("/api/documents/{doc_id}/negotiation-draft")
def save_negotiation_draft(doc_id: UUID, payload: NegotiationDraftPayload):
    db = SessionLocal()
    try:
        draft = db.query(NegotiationDraft).filter(NegotiationDraft.document_id == doc_id).first()
        if not draft:
            draft = NegotiationDraft(
                id=uuid4(),
                document_id=doc_id,
                user_id=payload.user_id,
                subject=payload.subject,
                email_body=payload.email_body,
                stipend_amount=payload.stipend_amount,
                key_points=payload.key_points,
            )
            db.add(draft)
        else:
            draft.subject = payload.subject
            draft.email_body = payload.email_body
            draft.stipend_amount = payload.stipend_amount
            draft.key_points = payload.key_points

        # Export to AWS S3 if requested
        if payload.export_to_s3 and S3_BUCKET:
            try:
                s3_key = f"negotiations/{doc_id}/Counter_Offer_Package.txt"
                content = f"SUBJECT: {payload.subject}\n\n{payload.email_body}"
                s3_client.put_object(
                    Bucket=S3_BUCKET,
                    Key=s3_key,
                    Body=content.encode("utf-8"),
                    ContentType="text/plain",
                    ServerSideEncryption="AES256"
                )
                draft.s3_key = s3_key
            except Exception as s3_err:
                print(f"[S3 ERROR] Failed to save counter offer to S3: {s3_err}")

        db.commit()
        db.refresh(draft)
        return {
            "success": True,
            "draft_id": str(draft.id),
            "s3_key": draft.s3_key,
            "message": "Saved to AWS Aurora PostgreSQL and exported to AWS S3!" if draft.s3_key else "Saved to AWS Aurora PostgreSQL!"
        }
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)

