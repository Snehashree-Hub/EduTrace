# RAG helper
# Retrieves relevant chunks from the local Knowledge Vault.

import json
import re
from pathlib import Path


CHUNKS_DIR = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "knowledge"
    / "chunks"
)


def _tokenize(text: str):
    return set(
        re.findall(
            r"[a-zA-Z0-9]+",
            (text or "").lower()
        )
    )


def retrieve_knowledge_chunks(
    query: str,
    document_id: str | None = None,
    top_k: int = 5,
):
    """
    Retrieve the most relevant local Knowledge Vault chunks.
    """

    query = (query or "").strip()

    if not query:
        return []

    if not CHUNKS_DIR.exists():
        return []

    query_tokens = _tokenize(query)

    if not query_tokens:
        return []

    candidates = []

    if document_id:
        chunk_files = [
            CHUNKS_DIR / f"{document_id}.json"
        ]
    else:
        chunk_files = list(CHUNKS_DIR.glob("*.json"))

    for chunk_file in chunk_files:

        if not chunk_file.exists():
            continue

        try:
            with open(
                chunk_file,
                "r",
                encoding="utf-8"
            ) as f:
                data = json.load(f)
        except Exception:
            continue

        if isinstance(data, dict):
            chunks = data.get("chunks", [])
        elif isinstance(data, list):
            chunks = data
        else:
            chunks = []

        for chunk in chunks:

            text = (
                chunk.get("text")
                or chunk.get("content")
                or ""
            )

            if not text:
                continue

            chunk_tokens = _tokenize(text)

            overlap = query_tokens.intersection(chunk_tokens)

            score = len(overlap)

            if query.lower() in text.lower():
                score += 5

            if score <= 0:
                continue

            candidates.append(
                {
                    "document_id": (
                        chunk.get("document_id")
                        or document_id
                    ),
                    "chunk_id": chunk.get("chunk_id"),
                    "page": (
                        chunk.get("page")
                        or chunk.get("page_number")
                    ),
                    "text": text,
                    "score": score,
                    "source": chunk.get(
                        "filename",
                        "Knowledge Vault PDF"
                    ),
                }
            )

    candidates.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return candidates[:top_k]


def build_rag_context(results):
    """
    Convert retrieved chunks into a context block
    that can be passed safely to the LLM.
    """

    if not results:
        return ""

    context_parts = []

    for index, result in enumerate(results, start=1):

        page = result.get("page")
        source = result.get(
            "source",
            "Knowledge Vault PDF"
        )

        page_label = (
            f"Page {page}"
            if page
            else "Page unavailable"
        )

        context_parts.append(
            f"""
--- SOURCE {index} ---
Document: {source}
{page_label}
Chunk ID: {result.get("chunk_id", "unknown")}

{result.get("text", "").strip()}
"""
        )

    return "\n".join(context_parts)
