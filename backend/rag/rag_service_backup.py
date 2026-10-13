from __future__ import annotations

import re
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DOCUMENTS_DIR = BASE_DIR / "documents"

DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
    ".md",
    ".csv",
}


# ============================================================
# CACHE
# ============================================================

_DOCUMENT_CACHE: Dict[str, Dict[str, Any]] = {}


# ============================================================
# TEXT EXTRACTION
# ============================================================

def extract_document_text(path: Path) -> str:

    suffix = path.suffix.lower()

    if suffix == ".pdf":

        try:
            import fitz

            document = fitz.open(str(path))

            pages = []

            for page in document:

                text = page.get_text("text")

                if text:
                    pages.append(text)

            document.close()

            return "\n".join(pages)

        except Exception as exc:

            raise RuntimeError(
                f"Unable to extract PDF text from "
                f"{path.name}: {exc}"
            ) from exc

    if suffix == ".docx":

        try:
            from docx import Document

            document = Document(str(path))

            paragraphs = []

            for paragraph in document.paragraphs:

                text = paragraph.text.strip()

                if text:
                    paragraphs.append(text)

            return "\n".join(paragraphs)

        except Exception as exc:

            raise RuntimeError(
                f"Unable to extract DOCX text from "
                f"{path.name}: {exc}"
            ) from exc

    if suffix in {".txt", ".md", ".csv"}:

        return path.read_text(
            encoding="utf-8",
            errors="ignore",
        )

    raise ValueError(
        f"Unsupported document type: {path.suffix}"
    )


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(text: str) -> str:

    if not text:
        return ""

    text = text.replace("\x00", " ")

    text = re.sub(
        r"(\w)-\s*\n\s*(\w)",
        r"\1\2",
        text,
    )

    text = text.replace("\n", " ")

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


# ============================================================
# CHUNKING
# ============================================================

def chunk_text(
    text: str,
    chunk_size: int = 1400,
    overlap: int = 250,
) -> List[str]:

    text = clean_text(text)

    if not text:
        return []

    if len(text) <= chunk_size:
        return [text]

    chunks = []

    start = 0

    while start < len(text):

        end = min(
            start + chunk_size,
            len(text),
        )

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = max(
            end - overlap,
            start + 1,
        )

    return chunks


# ============================================================
# DOCUMENT LOADING
# ============================================================

def load_document(
    path: Path,
) -> Dict[str, Any]:

    cache_key = str(
        path.resolve()
    )

    stat = path.stat()

    signature = (
        f"{stat.st_mtime_ns}:"
        f"{stat.st_size}"
    )

    cached = _DOCUMENT_CACHE.get(
        cache_key
    )

    if (
        cached
        and cached.get("signature") == signature
    ):
        return cached

    raw_text = extract_document_text(
        path
    )

    text = clean_text(
        raw_text
    )

    chunks = chunk_text(
        text
    )

    document = {
        "filename": path.name,
        "path": str(path),
        "signature": signature,
        "text": text,
        "chunks": chunks,
    }

    _DOCUMENT_CACHE[cache_key] = document

    return document


# ============================================================
# USER DIRECTORY
# ============================================================

def get_user_directory(
    edu_id: str,
) -> Path:

    directory = (
        DOCUMENTS_DIR / edu_id
    )

    directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    return directory


# ============================================================
# GET USER DOCUMENT PATHS
# ============================================================

def get_user_documents(
    edu_id: str,
) -> List[Path]:

    user_dir = (
        DOCUMENTS_DIR / edu_id
    )

    if not user_dir.exists():
        return []

    return sorted(
        [
            path
            for path in user_dir.iterdir()
            if (
                path.is_file()
                and path.suffix.lower()
                in SUPPORTED_EXTENSIONS
            )
        ]
    )


# ============================================================
# LIST USER DOCUMENTS
# ============================================================

def list_user_documents(
    edu_id: str,
) -> List[Dict[str, Any]]:
    """
    Compatibility function expected by api/rag.py.
    """

    documents = get_user_documents(
        edu_id
    )

    output = []

    for path in documents:

        try:

            output.append(
                {
                    "filename": path.name,
                    "file_size": path.stat().st_size,
                }
            )

        except Exception:
            continue

    return output


# ============================================================
# SAVE USER DOCUMENT
# ============================================================

def save_user_document(
    edu_id: str,
    filename: str,
    content: bytes,
) -> Dict[str, Any]:
    """
    Save an uploaded document for a user.

    Returns document metadata.
    """

    if not edu_id:
        raise ValueError(
            "edu_id is required"
        )

    if not filename:
        raise ValueError(
            "filename is required"
        )

    extension = Path(
        filename
    ).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:

        raise ValueError(
            f"Unsupported file type: {extension}"
        )

    user_dir = get_user_directory(
        edu_id
    )

    # Prevent directory traversal.
    safe_filename = Path(
        filename
    ).name

    destination = (
        user_dir / safe_filename
    )

    destination.write_bytes(
        content
    )

    # Remove stale cache.
    _DOCUMENT_CACHE.pop(
        str(destination.resolve()),
        None,
    )

    return {
        "filename": safe_filename,
        "file_size": destination.stat().st_size,
        "path": str(destination),
    }


# ============================================================
# DELETE USER DOCUMENT
# ============================================================

def delete_user_document(
    edu_id: str,
    filename: str,
) -> bool:

    user_dir = (
        DOCUMENTS_DIR / edu_id
    )

    safe_filename = Path(
        filename
    ).name

    path = (
        user_dir / safe_filename
    )

    if not path.exists():
        return False

    path.unlink()

    _DOCUMENT_CACHE.pop(
        str(path.resolve()),
        None,
    )

    return True


# ============================================================
# QUERY NORMALIZATION
# ============================================================

def normalize_query(
    query: str,
) -> str:

    query = query.lower().strip()

    query = re.sub(
        r"[^a-z0-9\s\-]",
        " ",
        query,
    )

    query = re.sub(
        r"\s+",
        " ",
        query,
    )

    return query.strip()


# ============================================================
# STOP WORDS
# ============================================================

STOP_WORDS = {
    "what",
    "is",
    "are",
    "the",
    "a",
    "an",
    "of",
    "to",
    "for",
    "in",
    "on",
    "and",
    "or",
    "how",
    "why",
    "can",
    "you",
    "me",
    "explain",
    "tell",
    "about",
    "please",
    "give",
    "define",
    "meaning",
    "does",
    "do",
    "with",
    "this",
    "that",
    "from",
}


# ============================================================
# IMPORTANT TERMS
# ============================================================

def important_terms(
    query: str,
) -> List[str]:

    words = re.findall(
        r"[a-z0-9]+",
        normalize_query(query),
    )

    return [
        word
        for word in words
        if (
            word not in STOP_WORDS
            and len(word) > 1
        )
    ]


# ============================================================
# TOPIC DETECTION
# ============================================================

def detect_topic(
    query: str,
) -> Optional[str]:

    q = normalize_query(
        query
    )

    # RAG
    rag_patterns = [
        r"\brag\b",
        r"retrieval augmented generation",
        r"retrieval-augmented generation",
        r"retrieval augmented",
        r"retrieval-augmented",
        r"rag system",
        r"rag pipeline",
        r"rag architecture",
    ]

    if any(
        re.search(
            pattern,
            q,
        )
        for pattern in rag_patterns
    ):
        return "rag"

    # AI
    if (
        "artificial intelligence" in q
        or re.search(
            r"\bai\b",
            q,
        )
    ):
        return "ai"

    # Machine Learning
    if (
        "machine learning" in q
        or re.search(
            r"\bml\b",
            q,
        )
    ):
        return "machine_learning"

    # Agents
    if (
        "intelligent agent" in q
        or "intelligent agents" in q
        or "ai agent" in q
        or "ai agents" in q
    ):
        return "agents"

    # Search
    if (
        "search algorithm" in q
        or "breadth first" in q
        or "breadth-first" in q
        or "depth first" in q
        or "depth-first" in q
        or "heuristic search" in q
        or "a star search" in q
    ):
        return "search"

    return None


# ============================================================
# TOPIC SCORE
# ============================================================

def topic_score(
    query: str,
    text: str,
) -> float:

    topic = detect_topic(
        query
    )

    if not topic:
        return 0.0

    lower_text = text.lower()

    # --------------------------------------------------------
    # RAG
    # --------------------------------------------------------

    if topic == "rag":

        score = 0.0

        exact_rag = len(
            re.findall(
                r"\brag\b",
                lower_text,
            )
        )

        if exact_rag:

            score += min(
                1.0,
                0.60
                + exact_rag * 0.08,
            )

        if (
            "retrieval augmented generation"
            in lower_text
        ):
            score += 0.45

        if (
            "retrieval-augmented generation"
            in lower_text
        ):
            score += 0.45

        related_terms = [
            "retrieval augmented",
            "retrieval-augmented",
            "knowledge base",
            "knowledge retrieval",
            "grounded generation",
            "external knowledge",
            "context retrieval",
        ]

        related_count = sum(
            1
            for term in related_terms
            if term in lower_text
        )

        score += min(
            0.30,
            related_count * 0.08,
        )

        return min(
            score,
            1.0,
        )

    # --------------------------------------------------------
    # AI
    # --------------------------------------------------------

    if topic == "ai":

        terms = [
            "artificial intelligence",
            "intelligent agent",
            "knowledge representation",
            "machine learning",
        ]

        return min(
            1.0,
            sum(
                0.25
                for term in terms
                if term in lower_text
            ),
        )

    # --------------------------------------------------------
    # MACHINE LEARNING
    # --------------------------------------------------------

    if topic == "machine_learning":

        terms = [
            "machine learning",
            "learning algorithm",
            "training data",
            "classifier",
            "classification",
        ]

        return min(
            1.0,
            sum(
                0.20
                for term in terms
                if term in lower_text
            ),
        )

    # --------------------------------------------------------
    # AGENTS
    # --------------------------------------------------------

    if topic == "agents":

        terms = [
            "intelligent agent",
            "intelligent agents",
            "agent",
            "agents",
        ]

        return min(
            1.0,
            sum(
                0.20
                for term in terms
                if term in lower_text
            ),
        )

    # --------------------------------------------------------
    # SEARCH
    # --------------------------------------------------------

    if topic == "search":

        terms = [
            "breadth first",
            "breadth-first",
            "depth first",
            "depth-first",
            "heuristic search",
            "a* search",
            "search algorithm",
        ]

        return min(
            1.0,
            sum(
                0.20
                for term in terms
                if term in lower_text
            ),
        )

    return 0.0


# ============================================================
# EXACT TERM SCORE
# ============================================================

def exact_term_score(
    query: str,
    text: str,
) -> float:

    lower_text = text.lower()

    terms = important_terms(
        query
    )

    if not terms:
        return 0.0

    matched = 0

    for term in terms:

        if re.search(
            rf"\b{re.escape(term)}\b",
            lower_text,
        ):
            matched += 1

    return matched / len(
        terms
    )


# ============================================================
# PHRASE SCORE
# ============================================================

def phrase_score(
    query: str,
    text: str,
) -> float:

    q = normalize_query(
        query
    )

    t = normalize_query(
        text
    )

    if not q:
        return 0.0

    if q in t:
        return 1.0

    words = important_terms(
        query
    )

    if len(words) >= 2:

        phrase = " ".join(
            words
        )

        if phrase in t:
            return 0.8

    return 0.0


# ============================================================
# RAG RELEVANCE
# ============================================================

def rag_relevance_score(
    query: str,
    text: str,
) -> float:

    if detect_topic(query) != "rag":
        return 0.0

    lower_text = text.lower()

    score = 0.0

    # Exact standalone RAG.
    standalone_rag = len(
        re.findall(
            r"\brag\b",
            lower_text,
        )
    )

    if standalone_rag:

        score += min(
            1.0,
            0.70
            + standalone_rag * 0.05,
        )

    # Full phrase.
    if (
        "retrieval augmented generation"
        in lower_text
    ):
        score += 0.50

    if (
        "retrieval-augmented generation"
        in lower_text
    ):
        score += 0.50

    # Related terminology.
    rag_terms = [
        "retrieval augmented",
        "retrieval-augmented",
        "grounded generation",
        "external knowledge",
        "knowledge base",
        "knowledge retrieval",
        "context retrieval",
    ]

    related_count = sum(
        1
        for term in rag_terms
        if term in lower_text
    )

    score += min(
        0.30,
        related_count * 0.08,
    )

    return min(
        score,
        1.0,
    )


# ============================================================
# SEARCH
# ============================================================

def search_documents(
    edu_id: str,
    query: str,
    top_k: int = 5,
) -> List[Dict[str, Any]]:

    query = query.strip()

    if not query:
        return []

    document_paths = get_user_documents(
        edu_id
    )

    if not document_paths:
        return []

    all_chunks = []

    for document_path in document_paths:

        try:

            document = load_document(
                document_path
            )

        except Exception:

            continue

        for index, chunk in enumerate(
            document["chunks"]
        ):

            all_chunks.append(
                {
                    "filename": document[
                        "filename"
                    ],
                    "chunk_index": index,
                    "text": chunk,
                }
            )

    if not all_chunks:
        return []

    texts = [
        item["text"]
        for item in all_chunks
    ]

    # --------------------------------------------------------
    # TF-IDF
    # --------------------------------------------------------

    semantic_scores = [
        0.0
        for _ in texts
    ]

    try:

        vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.98,
            sublinear_tf=True,
        )

        matrix = vectorizer.fit_transform(
            texts + [query]
        )

        query_vector = matrix[-1]

        document_matrix = matrix[:-1]

        similarities = cosine_similarity(
            query_vector,
            document_matrix,
        )[0]

        semantic_scores = [
            float(score)
            for score in similarities
        ]

    except Exception:

        pass

    # --------------------------------------------------------
    # Score
    # --------------------------------------------------------

    results = []

    detected_topic = detect_topic(
        query
    )

    for index, item in enumerate(
        all_chunks
    ):

        text = item["text"]

        semantic_score = (
            semantic_scores[index]
        )

        exact_score = (
            exact_term_score(
                query,
                text,
            )
        )

        phrase_match = (
            phrase_score(
                query,
                text,
            )
        )

        topic_match = (
            topic_score(
                query,
                text,
            )
        )

        rag_score = (
            rag_relevance_score(
                query,
                text,
            )
        )

        score = (
            semantic_score * 0.30
            + exact_score * 0.20
            + phrase_match * 0.15
            + topic_match * 0.15
            + rag_score * 0.20
        )

        # ----------------------------------------------------
        # RAG query filtering
        # ----------------------------------------------------

        if detected_topic == "rag":

            if rag_score <= 0:
                continue

            score += (
                rag_score * 0.35
            )

        results.append(
            {
                "filename": item[
                    "filename"
                ],
                "chunk_index": item[
                    "chunk_index"
                ],
                "text": text,
                "score": round(
                    float(score),
                    4,
                ),
                "semantic_score": round(
                    float(
                        semantic_score
                    ),
                    4,
                ),
                "exact_score": round(
                    float(
                        exact_score
                    ),
                    4,
                ),
                "keyword_score": round(
                    float(
                        topic_match
                    ),
                    4,
                ),
                "rag_score": round(
                    float(
                        rag_score
                    ),
                    4,
                ),
            }
        )

    results.sort(
        key=lambda item: item[
            "score"
        ],
        reverse=True,
    )

    return results[
        :max(1, top_k)
    ]


# ============================================================
# BUILD RAG CONTEXT
# ============================================================

def build_rag_context(
    results: List[
        Dict[str, Any]
    ],
) -> str:

    if not results:
        return ""

    context_parts = []

    for index, result in enumerate(
        results,
        start=1,
    ):

        context_parts.append(
            f"[Source {index}]\n"
            f"Document: "
            f"{result['filename']}\n"
            f"Chunk: "
            f"{result['chunk_index']}\n"
            f"Relevance: "
            f"{result['score']}\n\n"
            f"{result['text']}"
        )

    return "\n\n".join(
        context_parts
    )


# ============================================================
# DOCUMENT SUMMARY
# ============================================================

def get_document_summary(
    edu_id: str,
) -> Dict[str, Any]:

    documents = get_user_documents(
        edu_id
    )

    output = []

    for path in documents:

        try:

            document = load_document(
                path
            )

            output.append(
                {
                    "filename": path.name,
                    "file_size": path.stat().st_size,
                    "chunk_count": len(
                        document[
                            "chunks"
                        ]
                    ),
                }
            )

        except Exception as exc:

            output.append(
                {
                    "filename": path.name,
                    "file_size": path.stat().st_size,
                    "chunk_count": 0,
                    "error": str(exc),
                }
            )

    return {
        "edu_id": edu_id,
        "count": len(output),
        "documents": output,
    }


# ============================================================
# CACHE CLEAR
# ============================================================

def clear_document_cache(
    edu_id: Optional[str] = None,
) -> None:

    if edu_id is None:

        _DOCUMENT_CACHE.clear()

        return

    prefix = str(
        (
            DOCUMENTS_DIR / edu_id
        ).resolve()
    )

    keys = [
        key
        for key in _DOCUMENT_CACHE
        if key.startswith(prefix)
    ]

    for key in keys:

        _DOCUMENT_CACHE.pop(
            key,
            None,
        )