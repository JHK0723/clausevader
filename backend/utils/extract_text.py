import pdfplumber
import docx
import io


def extract_text_from_file(file_like, filename: str) -> str:
    """
    Extract plain text from a PDF or DOCX file.

    Args:
        file_like: A file-like object (BytesIO or any seekable stream).
        filename:  The original filename, used to determine the file type.

    Returns:
        Extracted text as a single string.
    """
    if filename.endswith(".pdf"):
        with pdfplumber.open(file_like) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    elif filename.endswith(".docx"):
        document = docx.Document(file_like)
        return "\n".join(p.text for p in document.paragraphs)
    else:
        raise ValueError("Unsupported file type")
