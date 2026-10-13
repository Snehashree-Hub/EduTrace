from pathlib import Path
from typing import Any, TypedDict

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from pydantic import BaseModel, Field

from backend.rag.rag_service import (
    list_user_documents,
    save_user_document,
    search_documents,
)
from backend.rag.answer_generator import generate_rag_answer
from backend.app.services.activity_service import record_activity


router = APIRouter(
    prefix="/api/rag",
    tags=["Knowledge Vault / RAG"],
)


# =========================================================
# CONFIG
# =========================================================

MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS: set[str] = {".pdf", ".docx", ".txt"}


# =========================================================
# TYPE DEFINITIONS
# =========================================================

class DocumentResult(TypedDict, total=False):
    filename: str
    score: float
    chunk_index: int
    chunks: list[Any]


class SourceInfo(TypedDict):
    filename: str
    relevance: int
    score: float
    chunk_index: int | None


# =========================================================
# REQUEST MODELS
# =========================================================

class RAGSearchRequest(BaseModel):
    edu_id: str = Field(..., min_length=1)
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=10)


class RAGQueryRequest(BaseModel):
    edu_id: str = Field(..., min_length=1)
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=10)


# =========================================================
# ACTIVITY HELPER
# =========================================================

def _record_knowledge_activity(
    edu_id: str,
    activity_type: str,
    description: str,
    metadata: dict[str, Any] | None = None,
) -> None:
    """
    Record Knowledge Vault activity.

    Activity logging must never break the main
    Knowledge Vault/RAG operation.
    """
    try:
        record_activity(
            edu_id=edu_id,
            activity_type=activity_type,
            description=description,
            metadata=metadata or {},
        )
    except Exception as exc:
        print(f"[KNOWLEDGE ACTIVITY ERROR] {type(exc).__name__}: {exc}")


# =========================================================
# HELPERS
# =========================================================

def _extract_extension(filename: str) -> str:
    """Return lowercase file extension including the dot, or empty string."""
    return "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def _validate_edu_id(edu_id: str) -> str:
    """Validate and return cleaned edu_id, raising HTTPException if invalid."""
    clean_edu_id = edu_id.strip()
    if not clean_edu_id:
        raise HTTPException(
            status_code=400,
            detail="EDU ID is required.",
        )
    return clean_edu_id


def _validate_query(query: str) -> str:
    """Validate and return cleaned query, raising HTTPException if invalid."""
    clean_query = query.strip()
    if not clean_query:
        raise HTTPException(
            status_code=400,
            detail="Query is required.",
        )
    return clean_query


def _clamp_top_k(top_k: int, default: int = 5, maximum: int = 10) -> int:
    """Clamp top_k into a safe range."""
    return max(1, min(top_k, maximum))


def _compute_relevance(score: float) -> int:
    """Convert a keyword score into a UI relevance percentage."""
    return min(99, max(60, int(60 + score * 5)))


# =========================================================
# UPLOAD DOCUMENT
# =========================================================

@router.post("/upload")
async def upload_document(
    edu_id: str = Form(...),
    file: UploadFile = File(...),
) -> dict[str, Any]:
    clean_edu_id = _validate_edu_id(edu_id)

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Please select a document.",
        )

    filename = file.filename
    extension = _extract_extension(filename)

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX and TXT files are supported.",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Maximum file size is 10 MB.",
        )

    try:
        # -------------------------------------------------
        # Save and process document
        # -------------------------------------------------
        result: DocumentResult = save_user_document(
            edu_id=clean_edu_id,
            filename=filename,
            content=content,
        )

        # Don't expose internal chunks in API response
        result.pop("chunks", None)

        # -------------------------------------------------
        # Record successful upload activity
        # -------------------------------------------------
        _record_knowledge_activity(
            edu_id=clean_edu_id,
            activity_type="knowledge_upload",
            description="Knowledge Vault document uploaded.",
            metadata={
                "filename": filename,
                "file_type": extension.replace(".", "").upper(),
                "file_size": len(content),
            },
        )

        return {
            "success": True,
            "message": "Document uploaded successfully.",
            "document": result,
        }

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {exc}",
        )


# =========================================================
# LIST DOCUMENTS
# =========================================================

@router.get("/documents/{edu_id}")
def get_documents(edu_id: str) -> dict[str, Any]:
    clean_edu_id = _validate_edu_id(edu_id)

    documents = list_user_documents(clean_edu_id)

    return {
        "success": True,
        "edu_id": clean_edu_id,
        "count": len(documents),
        "documents": documents,
    }


# =========================================================
# RAW KNOWLEDGE SEARCH
# =========================================================

@router.post("/search")
def search_knowledge(request: RAGSearchRequest) -> dict[str, Any]:
    clean_edu_id = _validate_edu_id(request.edu_id)
    query = _validate_query(request.query)
    top_k = _clamp_top_k(request.top_k)

    try:
        # -------------------------------------------------
        # Search Knowledge Vault
        # -------------------------------------------------
        results = search_documents(
            edu_id=clean_edu_id,
            query=query,
            top_k=top_k,
        )

        # -------------------------------------------------
        # Record successful search activity
        # -------------------------------------------------
        _record_knowledge_activity(
            edu_id=clean_edu_id,
            activity_type="knowledge_search",
            description="Knowledge Vault searched.",
            metadata={
                "query": query,
                "results_count": len(results),
                "top_k": top_k,
            },
        )

        return {
            "success": True,
            "edu_id": clean_edu_id,
            "query": query,
            "count": len(results),
            "results": results,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Knowledge search failed: {exc}",
        )


# =========================================================
# AI RAG QUERY
# =========================================================

@router.post("/query")
def query_knowledge(request: RAGQueryRequest) -> dict[str, Any]:
    """
    Main endpoint used by EduTrace AI Assistant.

    Flow:

    User Question
          ↓
    Search Knowledge Vault
          ↓
    Select relevant chunks
          ↓
    Generate contextual answer
          ↓
    Record activity
          ↓
    Return answer + sources
    """
    clean_edu_id = _validate_edu_id(request.edu_id)
    query = _validate_query(request.query)
    top_k = _clamp_top_k(request.top_k)

    try:
        # -------------------------------------------------
        # STEP 1: Search uploaded documents
        # -------------------------------------------------
        results = search_documents(
            edu_id=clean_edu_id,
            query=query,
            top_k=top_k,
        )

        # -------------------------------------------------
        # STEP 2: Generate answer
        # -------------------------------------------------
        answer = generate_rag_answer(
            question=query,
            results=results,
        )

        # -------------------------------------------------
        # STEP 3: Prepare source information
        # -------------------------------------------------
        sources: list[SourceInfo] = []
        seen_files: set[str] = set()

        for result in results:
            filename = result.get("filename", "Unknown document")

            if filename in seen_files:
                continue

            seen_files.add(filename)

            score = float(result.get("score", 0))

            sources.append(
                SourceInfo(
                    filename=filename,
                    relevance=_compute_relevance(score),
                    score=score,
                    chunk_index=result.get("chunk_index"),
                )
            )

        # -------------------------------------------------
        # STEP 4: Record successful RAG activity
        # -------------------------------------------------
        _record_knowledge_activity(
            edu_id=clean_edu_id,
            activity_type="knowledge_query",
            description="Knowledge Vault AI query answered.",
            metadata={
                "query": query,
                "retrieved_chunks": len(results),
                "source_count": len(sources),
                "top_k": top_k,
            },
        )

        # -------------------------------------------------
        # STEP 5: Response
        # -------------------------------------------------
        return {
            "success": True,
            "edu_id": clean_edu_id,
            "query": query,
            "answer": answer,
            "sources": sources,
            "source_count": len(sources),
            "retrieved_chunks": len(results),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"RAG query failed: {exc}",
        )


# =========================================================
# DELETE DOCUMENT
# =========================================================

@router.delete("/documents/{edu_id}/{filename}")
def delete_document(edu_id: str, filename: str) -> dict[str, Any]:
    clean_edu_id = _validate_edu_id(edu_id)

    if not filename.strip():
        raise HTTPException(
            status_code=400,
            detail="Filename is required.",
        )

    user_directory = (
        Path(__file__).resolve().parents[3]
        / "backend"
        / "rag"
        / "documents"
        / clean_edu_id
    )

    file_path = user_directory / Path(filename).name

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    try:
        file_path.unlink()

        # -------------------------------------------------
        # Record successful delete activity
        # -------------------------------------------------
        _record_knowledge_activity(
            edu_id=clean_edu_id,
            activity_type="knowledge_delete",
            description="Knowledge Vault document deleted.",
            metadata={"filename": file_path.name},
        )

        return {
            "success": True,
            "message": "Document deleted successfully.",
            "filename": file_path.name,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to delete document: {exc}",
        )