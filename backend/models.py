from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import JSON, Column, String, Text, Integer, Float, ForeignKey, Enum, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum

Base = declarative_base()

class DocumentStatusEnum(str, enum.Enum):
    processing = "processing"
    done = "done"
    error = "error"

class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, autoincrement=True)
    google_id = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    picture = Column(String)


class Session(Base):
    __tablename__ = "session"
    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    expires_at = Column(Integer, nullable=False)


class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("user.id"))
    filename = Column(String)
    original_file_url = Column(String)
    extracted_text = Column(Text)
    role = Column(String)  # Keep raw string if enums are handled separately
    status = Column(Enum(DocumentStatusEnum), default=DocumentStatusEnum.processing)
    favourability_score = Column(Integer)
    title = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Clause(Base):
    __tablename__ = "clauses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"))
    clause_text = Column(Text)
    summary = Column(Text)
    pros = Column(JSON)
    cons = Column(JSON)
    suggested_rewrite = Column(Text)
    sith_view = Column(Text)
    x = Column(Float)
    y = Column(Float)
    impact = Column(String)  # Keep raw string if enums are handled separately
    favorability_score = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Chat(Base):
    __tablename__ = "chats"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("user.id"))
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    user_message = Column(Text)
    ai_response = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())


class NegotiationDraft(Base):
    __tablename__ = "negotiation_drafts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("user.id"))
    subject = Column(String)
    email_body = Column(Text)
    stipend_amount = Column(String)
    key_points = Column(JSON)
    s3_key = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())