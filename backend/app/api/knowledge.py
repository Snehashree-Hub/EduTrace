from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from pathlib import Path
from pypdf import PdfReader
from datetime import datetime
import json
import uuid
import re
from typing import Optional


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/knowledge",
    tags=["Knowledge Vault"]
)


# =========================================================
# DIRECTORIES
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

KNOWLEDGE_DIR = BASE_DIR / "data" / "knowledge"

DOCUMENTS_DIR = KNOWLEDGE_DIR / "documents"
METADATA_DIR = KNOWLEDGE_DIR / "metadata"
CHUNKS_DIR = KNOWLEDGE_DIR / "chunks"

DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
METADATA_DIR.mkdir(parents=True, exist_ok=True)
CHUNKS_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# SETTINGS
# =========================================================

ALLOWED_EXTENSIONS = {".pdf"}

MAX_FILE_SIZE = 20 * 1024 * 1024

CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200


# =========================================================
# REQUEST MODEL
# =========================================================

class KnowledgeSearchRequest(BaseModel):
    query: str
    document_id: Optional[str] = None
    top_k: int = 5


# =========================================================
# TEXT CLEANING
# =========================================================

def clean_text(text: str) -> str:

    if not text:
        return ""

    text = text.replace("\x00", " ")

    text = re.sub(
        r"[ \t]+",
        " ",
        text
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text
    )

    return text.strip()


# =========================================================
# PDF EXTRACTION
# =========================================================

def extract_pdf_pages(pdf_path: Path):

    try:

        reader = PdfReader(
            str(pdf_path)
        )

        pages = []

        for page_number, page in enumerate(
            reader.pages,
            start=1
        ):

            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""

            text = clean_text(text)

            pages.append(
                {
                    "page": page_number,
                    "text": text,
                }
            )

        return pages

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=f"Unable to read PDF: {str(exc)}"
        )


# =========================================================
# CHUNK CREATION
# =========================================================

def create_chunks(pages):

    chunks = []

    chunk_number = 0

    for page_data in pages:

        page_number = page_data["page"]

        text = page_data["text"]

        if not text:
            continue

        start = 0

        while start < len(text):

            end = start + CHUNK_SIZE

            chunk_text = text[start:end].strip()

            if chunk_text:

                chunks.append(
                    {
                        "chunk_id": f"chunk_{chunk_number}",
                        "page": page_number,
                        "text": chunk_text,
                    }
                )

                chunk_number += 1

            if end >= len(text):
                break

            start = end - CHUNK_OVERLAP

    return chunks


# =========================================================
# SEARCH WORDS
# =========================================================

def normalize_words(text):

    return set(
        re.findall(
            r"\b[a-zA-Z0-9]{2,}\b",
            text.lower()
        )
    )


# =========================================================
# RELEVANCE SCORE
# =========================================================

def calculate_relevance(
    query,
    chunk_text
):

    query_words = normalize_words(
        query
    )

    chunk_words = normalize_words(
        chunk_text
    )

    if not query_words or not chunk_words:
        return 0.0

    matched_words = (
        query_words.intersection(
            chunk_words
        )
    )

    score = (
        len(matched_words)
        /
        len(query_words)
    )

    # Exact phrase bonus
    if query.lower() in chunk_text.lower():

        score += 0.5

    return round(
        score,
        4
    )


# =========================================================
# HEALTH
# =========================================================

@router.get("/health")
def knowledge_health():

    return {
        "success": True,
        "service": "Knowledge Vault",
        "status": "ready",
        "chunking": True,
        "retrieval": True,
    }


# =========================================================
# UPLOAD PDF
# =========================================================

@router.post("/upload")
async def upload_knowledge_pdf(
    file: UploadFile = File(...)
):

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    original_name = Path(
        file.filename
    ).name

    extension = Path(
        original_name
    ).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    file_content = await file.read()

    if not file_content:

        raise HTTPException(
            status_code=400,
            detail="The uploaded PDF is empty."
        )

    if len(file_content) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=413,
            detail="PDF size must be 20 MB or less."
        )

    document_id = (
        f"DOC-{uuid.uuid4().hex[:10].upper()}"
    )

    safe_filename = (
        f"{document_id}.pdf"
    )

    pdf_path = (
        DOCUMENTS_DIR /
        safe_filename
    )

    try:

        # Save PDF
        pdf_path.write_bytes(
            file_content
        )

        # Extract pages
        pages = extract_pdf_pages(
            pdf_path
        )

        full_text = "\n\n".join(
            page["text"]
            for page in pages
            if page["text"]
        )

        if not full_text.strip():

            pdf_path.unlink(
                missing_ok=True
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    "No readable text was found "
                    "in this PDF."
                )
            )

        # Create chunks
        chunks = create_chunks(
            pages
        )

        if not chunks:

            pdf_path.unlink(
                missing_ok=True
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    "No searchable chunks "
                    "could be created."
                )
            )

        uploaded_at = datetime.now().isoformat()

        metadata = {
            "document_id": document_id,
            "original_filename": original_name,
            "stored_filename": safe_filename,
            "document_type": "PDF",
            "page_count": len(pages),
            "character_count": len(full_text),
            "chunk_count": len(chunks),
            "uploaded_at": uploaded_at,
            "source": "Knowledge Vault",
        }

        # Save metadata
        metadata_path = (
            METADATA_DIR /
            f"{document_id}.json"
        )

        metadata_path.write_text(
            json.dumps(
                {
                    "metadata": metadata,
                    "pages": pages,
                    "text": full_text,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8"
        )

        # Save chunks
        chunks_path = (
            CHUNKS_DIR /
            f"{document_id}.json"
        )

        chunks_path.write_text(
            json.dumps(
                {
                    "document_id": document_id,
                    "chunk_count": len(chunks),
                    "chunks": chunks,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8"
        )

        return {
            "success": True,
            "message": (
                "PDF uploaded, extracted "
                "and chunked successfully."
            ),
            "document_id": document_id,
            "filename": original_name,
            "document_type": "PDF",
            "page_count": len(pages),
            "character_count": len(full_text),
            "chunk_count": len(chunks),
            "uploaded_at": uploaded_at,
        }

    except HTTPException:
        raise

    except Exception as exc:

        if pdf_path.exists():
            pdf_path.unlink(
                missing_ok=True
            )

        raise HTTPException(
            status_code=500,
            detail=f"PDF processing failed: {str(exc)}"
        )


# =========================================================
# SEARCH
# =========================================================

@router.post("/search")
def search_knowledge(
    request: KnowledgeSearchRequest
):

    query = request.query.strip()

    if not query:

        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty."
        )

    top_k = max(
        1,
        min(
            request.top_k,
            20
        )
    )

    # -----------------------------------------------------
    # Determine files
    # -----------------------------------------------------

    if request.document_id:

        chunk_files = [
            CHUNKS_DIR /
            f"{request.document_id}.json"
        ]

    else:

        chunk_files = list(
            CHUNKS_DIR.glob("*.json")
        )

    all_results = []

    # -----------------------------------------------------
    # Search
    # -----------------------------------------------------

    for chunk_file in chunk_files:

        if not chunk_file.exists():
            continue

        try:

            data = json.loads(
                chunk_file.read_text(
                    encoding="utf-8"
                )
            )

        except Exception:

            continue

        document_id = data.get(
            "document_id"
        )

        for chunk in data.get(
            "chunks",
            []
        ):

            chunk_text = chunk.get(
                "text",
                ""
            )

            score = calculate_relevance(
                query,
                chunk_text
            )

            if score > 0:

                all_results.append(
                    {
                        "document_id": document_id,
                        "chunk_id": chunk.get(
                            "chunk_id"
                        ),
                        "page": chunk.get(
                            "page"
                        ),
                        "score": score,
                        "text": chunk_text,
                    }
                )

    # -----------------------------------------------------
    # Sort
    # -----------------------------------------------------

    all_results.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    results = all_results[:top_k]

    return {
        "success": True,
        "query": query,
        "document_id": request.document_id,
        "result_count": len(results),
        "results": results,
    }


# =========================================================
# GET DOCUMENT
# =========================================================

@router.get("/document/{document_id}")
def get_document(
    document_id: str
):

    metadata_path = (
        METADATA_DIR /
        f"{document_id}.json"
    )

    chunks_path = (
        CHUNKS_DIR /
        f"{document_id}.json"
    )

    if not metadata_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    metadata_data = json.loads(
        metadata_path.read_text(
            encoding="utf-8"
        )
    )

    chunk_count = 0

    if chunks_path.exists():

        chunk_data = json.loads(
            chunks_path.read_text(
                encoding="utf-8"
            )
        )

        chunk_count = chunk_data.get(
            "chunk_count",
            0
        )

    return {
        "success": True,
        "document": metadata_data.get(
            "metadata",
            {}
        ),
        "chunk_count": chunk_count,
    }


# =========================================================
# LIST DOCUMENTS
# =========================================================

@router.get("/documents")
def list_documents():

    documents = []

    for metadata_file in METADATA_DIR.glob(
        "*.json"
    ):

        try:

            data = json.loads(
                metadata_file.read_text(
                    encoding="utf-8"
                )
            )

            metadata = data.get(
                "metadata",
                {}
            )

            document_id = metadata.get(
                "document_id"
            )

            chunks_file = (
                CHUNKS_DIR /
                f"{document_id}.json"
            )

            chunk_count = 0

            if chunks_file.exists():

                chunk_data = json.loads(
                    chunks_file.read_text(
                        encoding="utf-8"
                    )
                )

                chunk_count = chunk_data.get(
                    "chunk_count",
                    0
                )

            documents.append(
                {
                    **metadata,
                    "chunk_count": chunk_count,
                }
            )

        except Exception:

            continue

    documents.sort(
        key=lambda item: item.get(
            "uploaded_at",
            ""
        ),
        reverse=True
    )

    return {
        "success": True,
        "count": len(documents),
        "documents": documents,
    }


# =========================================================
# REBUILD CHUNKS FOR EXISTING DOCUMENT
# =========================================================

@router.post(
    "/document/{document_id}/rebuild-chunks"
)
def rebuild_document_chunks(
    document_id: str
):

    # -----------------------------------------------------
    # Locate original PDF
    # -----------------------------------------------------

    pdf_path = (
        DOCUMENTS_DIR /
        f"{document_id}.pdf"
    )

    if not pdf_path.exists():

        raise HTTPException(
            status_code=404,
            detail="PDF file not found."
        )

    # -----------------------------------------------------
    # Extract
    # -----------------------------------------------------

    pages = extract_pdf_pages(
        pdf_path
    )

    full_text = "\n\n".join(
        page["text"]
        for page in pages
        if page["text"]
    )

    if not full_text.strip():

        raise HTTPException(
            status_code=400,
            detail="No readable text found in PDF."
        )

    # -----------------------------------------------------
    # Create chunks
    # -----------------------------------------------------

    chunks = create_chunks(
        pages
    )

    if not chunks:

        raise HTTPException(
            status_code=400,
            detail="No chunks could be created."
        )

    # -----------------------------------------------------
    # Save chunks
    # -----------------------------------------------------

    chunks_path = (
        CHUNKS_DIR /
        f"{document_id}.json"
    )

    chunks_path.write_text(
        json.dumps(
            {
                "document_id": document_id,
                "chunk_count": len(chunks),
                "chunks": chunks,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8"
    )

    # -----------------------------------------------------
    # Update metadata
    # -----------------------------------------------------

    metadata_path = (
        METADATA_DIR /
        f"{document_id}.json"
    )

    if metadata_path.exists():

        try:

            metadata_data = json.loads(
                metadata_path.read_text(
                    encoding="utf-8"
                )
            )

            metadata = metadata_data.get(
                "metadata",
                {}
            )

            metadata["chunk_count"] = len(
                chunks
            )

            metadata_data["metadata"] = metadata

            metadata_path.write_text(
                json.dumps(
                    metadata_data,
                    ensure_ascii=False,
                    indent=2,
                ),
                encoding="utf-8"
            )

        except Exception:
            pass

    return {
        "success": True,
        "message": (
            "Existing PDF chunks rebuilt successfully."
        ),
        "document_id": document_id,
        "page_count": len(pages),
        "character_count": len(full_text),
        "chunk_count": len(chunks),
    }
