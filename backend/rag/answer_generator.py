import re
from typing import List, Dict, Any


STOP_WORDS = {
    "what", "is", "are", "the", "a", "an", "of", "to",
    "from", "my", "notes", "note", "document", "documents",
    "according", "explain", "tell", "me", "about", "how",
    "does", "do", "can", "you", "please", "give", "define",
    "definition", "describe", "show", "with", "example",
    "examples", "uploaded", "file", "files", "this", "that",
    "in", "on", "for", "and", "or", "your", "it", "using",
    "use", "used", "explain", "meaning"
}


def normalize_text(text: str) -> str:
    if not text:
        return ""

    replacements = {
        "\ufeff": "",
        "ï»¿": "",
        "ï¿½": "",
        "â€™": "'",
        "â€œ": '"',
        "â€\x9d": '"',
        "â€“": "-",
        "â€”": "-",
        "â€¢": "-",
        "ï‚·": "-",
        "\u2022": "-",
        "\u00a0": " ",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def tokenize(text: str) -> List[str]:
    words = re.findall(
        r"[a-zA-Z][a-zA-Z0-9_+#.-]*",
        normalize_text(text).lower()
    )

    result = []

    for word in words:
        word = word.strip(".,:;!?()[]{}")

        if len(word) <= 2 or word in STOP_WORDS:
            continue

        if word not in result:
            result.append(word)

    return result


def normalize_term(word: str) -> str:
    word = word.lower().strip()

    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"

    if word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        return word[:-1]

    return word


def split_sentences(text: str) -> List[str]:
    text = normalize_text(text)

    if not text:
        return []

    text = re.sub(r"\r\n?", "\n", text)

    parts = re.split(
        r"(?<=[.!?])\s+|\n+",
        text
    )

    return [
        normalize_text(part)
        for part in parts
        if len(normalize_text(part)) >= 12
    ]


def is_heading(text: str) -> bool:
    text = normalize_text(text)

    if not text or len(text) > 90:
        return False

    if re.search(r"[.!?]$", text):
        return False

    words = text.split()

    if len(words) > 8:
        return False

    if re.match(
        r"^(example|print|for|while|if|return|import|from)\b",
        text,
        re.IGNORECASE
    ):
        return False

    return bool(
        re.search(r"[A-Za-z]", text)
    )


def extract_sections(text: str) -> List[Dict[str, str]]:
    text = normalize_text(text)

    lines = [
        normalize_text(line)
        for line in text.splitlines()
        if normalize_text(line)
    ]

    sections = []
    current_heading = ""
    current_content = []

    for line in lines:
        if is_heading(line):
            if current_content:
                sections.append({
                    "heading": current_heading,
                    "content": " ".join(current_content)
                })

            current_heading = line
            current_content = []
        else:
            current_content.append(line)

    if current_content:
        sections.append({
            "heading": current_heading,
            "content": " ".join(current_content)
        })

    if not sections:
        sections.append({
            "heading": "",
            "content": text
        })

    return sections


def generate_rag_answer(
    question: str,
    results: List[Dict[str, Any]]
) -> str:

    if not results:
        return (
            "I couldn't find relevant information in your "
            "uploaded Knowledge Vault documents."
        )

    query_terms = [
        normalize_term(word)
        for word in tokenize(question)
    ]

    if not query_terms:
        return (
            "Please ask a specific question about your "
            "uploaded document."
        )

    candidates = []

    for result in results:
        document_text = normalize_text(
            result.get("text", "")
        )

        if not document_text:
            continue

        sections = extract_sections(document_text)

        for section in sections:
            heading = section["heading"]
            content = section["content"]

            heading_terms = {
                normalize_term(word)
                for word in tokenize(heading)
            }

            heading_match = bool(
                set(query_terms).intersection(heading_terms)
            )

            sentences = split_sentences(content)

            for sentence in sentences:
                sentence_terms = {
                    normalize_term(word)
                    for word in tokenize(sentence)
                }

                overlap = set(query_terms).intersection(
                    sentence_terms
                )

                if not overlap:
                    continue

                score = len(overlap) * 4

                if heading_match:
                    score += 5

                if any(
                    phrase in sentence.lower()
                    for phrase in [
                        "is a",
                        "is an",
                        "means",
                        "refers to",
                        "stores",
                        "is used to",
                        "is an ordered",
                        "is a collection"
                    ]
                ):
                    score += 2

                if sentence.lower().startswith(
                    ("example:", "for example:")
                ):
                    score += 1

                candidates.append({
                    "text": sentence,
                    "score": score,
                    "heading": heading,
                    "filename": result.get("filename", "")
                })

    if not candidates:
        return (
            "I couldn't find a direct explanation of this topic "
            "in the retrieved parts of your uploaded notes.\n\n"
            "Try uploading material that covers this concept, "
            "or ask about a topic that appears in your document."
        )

    candidates.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    selected = []
    seen = set()

    for item in candidates:
        sentence = item["text"]

        fingerprint = re.sub(
            r"[^a-z0-9]",
            "",
            sentence.lower()
        )

        if fingerprint in seen:
            continue

        seen.add(fingerprint)
        selected.append(item)

        if len(selected) >= 4:
            break

    answer_lines = []

    for item in selected:
        heading = item["heading"]

        if heading and heading.lower() not in [
            line.lower() for line in answer_lines
        ]:
            answer_lines.append(f"**{heading}**")

        answer_lines.append(f"- {item['text']}")

    return (
        "According to your uploaded notes:\n\n"
        + "\n".join(answer_lines)
    )
