import io
import re
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

import requests
from pypdf import PdfReader


# =========================================================
# OFFICIAL EXAM SOURCES
# =========================================================

SOURCE_REGISTRY = {
    "JEE": {
        "name": "NTA JEE Main 2026 Official Syllabus",
        "url": "https://jeemain.nta.nic.in/document/syllabus-2026/",
        "allowed_hosts": [
            "jeemain.nta.nic.in",
        ],
    },

    "NEET": {
        "name": "NEET UG 2026 Official Syllabus",
        "url": "https://neet.nta.nic.in/documents/page/4/",
        "allowed_hosts": [
            "neet.nta.nic.in",
            "cdnbbsr.s3waas.gov.in",
        ],
    },

    "TNPSC": {
        "name": "TNPSC General Studies Degree Standard",
        "url": "https://www.tnpsc.gov.in/static_pdf/syllabus/34_GENERAL_STUDIES_UG_STD.pdf",
        "allowed_hosts": [
            "www.tnpsc.gov.in",
            "tnpsc.gov.in",
        ],
    },
}


# =========================================================
# HTML TEXT EXTRACTOR
# =========================================================

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()

        self.parts = []

        self.skip_depth = 0

        self.skip_tags = {
            "script",
            "style",
            "noscript",
            "svg",
            "iframe",
            "canvas",
        }

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()

        if tag in self.skip_tags:
            self.skip_depth += 1

    def handle_endtag(self, tag):
        tag = tag.lower()

        if tag in self.skip_tags and self.skip_depth > 0:
            self.skip_depth -= 1

    def handle_data(self, data):
        if self.skip_depth > 0:
            return

        text = re.sub(r"\s+", " ", data).strip()

        if text:
            self.parts.append(text)

    def text(self):
        return "\n".join(self.parts)


# =========================================================
# URL VALIDATION
# =========================================================

def _validate_url(url, allowed_hosts):
    if not url:
        raise ValueError("Source URL is empty.")

    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"}:
        raise ValueError(
            f"Unsupported URL scheme: {parsed.scheme}"
        )

    host = (parsed.hostname or "").lower()

    if not host:
        raise ValueError("Source URL does not contain a hostname.")

    if host not in [item.lower() for item in allowed_hosts]:
        raise ValueError(
            f"Host is not allowlisted: {host}"
        )


# =========================================================
# ROBUST WEB FETCH
# =========================================================

def _fetch(url, timeout=20):
    """
    Fetch an official source using requests.

    Requests is used instead of urllib because some government
    websites and PDF hosts respond more reliably to browser-like
    HTTP headers.

    SSL verification is attempted normally first. If the local
    Python certificate chain rejects the site, the request is
    retried with verification disabled.
    """

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) "
            "Chrome/154.0 Safari/537.36 "
            "EduTrace/1.0"
        ),
        "Accept": (
            "text/html,application/xhtml+xml,"
            "application/xml;q=0.9,"
            "application/pdf;q=0.9,"
            "*/*;q=0.8"
        ),
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
    }

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=timeout,
            allow_redirects=True,
            verify=True,
        )

    except requests.exceptions.SSLError as exc:
        print(
            f"[WEB QUIZ] SSL verification failed for {url}: {exc}"
        )

        response = requests.get(
            url,
            headers=headers,
            timeout=timeout,
            allow_redirects=True,
            verify=False,
        )

    except requests.exceptions.Timeout as exc:
        raise RuntimeError(
            f"Official source request timed out: {url}"
        ) from exc

    except requests.exceptions.ConnectionError as exc:
        raise RuntimeError(
            f"Could not connect to official source: {url}"
        ) from exc

    except requests.exceptions.RequestException as exc:
        raise RuntimeError(
            f"Official source request failed: {exc}"
        ) from exc

    response.raise_for_status()

    final_url = response.url

    content_type = (
        response.headers.get("Content-Type", "")
        .strip()
        .lower()
    )

    print(
        f"[WEB QUIZ] Retrieved {final_url} "
        f"| status={response.status_code} "
        f"| type={content_type}"
    )

    return content_type, response.content, final_url


# =========================================================
# PDF TEXT EXTRACTION
# =========================================================

def _extract_pdf_text(data):
    if not data:
        return ""

    try:
        reader = PdfReader(io.BytesIO(data))
    except Exception as exc:
        raise RuntimeError(
            f"Unable to open PDF source: {exc}"
        ) from exc

    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text() or ""
        except Exception as exc:
            print(
                f"[WEB QUIZ] PDF page {page_number} "
                f"text extraction failed: {exc}"
            )
            page_text = ""

        page_text = page_text.strip()

        if page_text:
            pages.append(page_text)

    return "\n".join(pages)


# =========================================================
# HTML TEXT EXTRACTION
# =========================================================

def _extract_html_text(data):
    if not data:
        return ""

    html = data.decode(
        "utf-8",
        errors="ignore",
    )

    parser = TextExtractor()

    try:
        parser.feed(html)
    except Exception as exc:
        raise RuntimeError(
            f"Unable to parse HTML source: {exc}"
        ) from exc

    return parser.text()


# =========================================================
# TEXT CLEANING
# =========================================================

def _clean_text(text):
    if not text:
        return ""

    # Common PDF / encoding artifacts.
    replacements = {
        "â€¢": "•",
        "â¢": "•",
        "â€“": "–",
        "â€”": "—",
        "â€™": "’",
        "â€œ": "“",
        "â€": "”",
        "â€˜": "‘",
        "Ã—": "×",
        "Ã·": "÷",
        "\uf0b7": "•",
        "\xa0": " ",
    }

    for bad, good in replacements.items():
        text = text.replace(bad, good)

    # Remove repeated whitespace but preserve paragraph structure.
    text = re.sub(r"[ \t]+", " ", text)

    text = re.sub(
        r"\n[ \t]+",
        "\n",
        text,
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text.strip()


# =========================================================
# FIND A SYLLABUS PDF LINK
# =========================================================

def _find_link(
    html,
    source_url,
    keywords,
    allowed_hosts,
):
    if not html:
        return None

    pattern = re.compile(
        r'href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',
        flags=re.IGNORECASE | re.DOTALL,
    )

    for href, inner in pattern.findall(html):
        visible = re.sub(
            r"<[^>]+>",
            " ",
            inner,
        )

        visible = re.sub(
            r"\s+",
            " ",
            visible,
        ).strip().lower()

        keyword_match = any(
            keyword.lower() in visible
            for keyword in keywords
        )

        if not keyword_match:
            continue

        candidate = urljoin(
            source_url,
            href,
        )

        try:
            _validate_url(
                candidate,
                allowed_hosts,
            )
        except ValueError:
            continue

        return candidate

    return None


# =========================================================
# EXAM SOURCE LOOKUP
# =========================================================

def get_exam_source(exam_id):
    exam = str(
        exam_id or ""
    ).upper().strip()

    if "JEE" in exam:
        return SOURCE_REGISTRY["JEE"]

    if "NEET" in exam:
        return SOURCE_REGISTRY["NEET"]

    if "TNPSC" in exam:
        return SOURCE_REGISTRY["TNPSC"]

    return None


# =========================================================
# TOPIC-FOCUSED CONTEXT
# =========================================================

def _focus_text(
    text,
    subject,
    topic,
    max_chars=9000,
):
    """
    Find sections around the selected subject/topic.

    This prevents the entire syllabus document from being sent
    to the AI model unnecessarily.
    """

    if not text:
        return ""

    clean = _clean_text(text)

    if not clean:
        return ""

    lower_text = clean.lower()

    search_terms = [
        str(topic or "").strip().lower(),
        str(subject or "").strip().lower(),
    ]

    search_terms = [
        term
        for term in search_terms
        if term
    ]

    positions = []

    for term in search_terms:
        start = 0
        found_for_term = 0

        while True:
            index = lower_text.find(
                term,
                start,
            )

            if index < 0:
                break

            positions.append(index)

            found_for_term += 1

            if found_for_term >= 12:
                break

            start = index + max(
                len(term),
                1,
            )

    # No direct topic match.
    if not positions:
        return clean[:max_chars]

    # Keep unique nearby text ranges.
    ranges = []

    for index in positions:
        left = max(
            0,
            index - 900,
        )

        right = min(
            len(clean),
            index + 2200,
        )

        ranges.append(
            (left, right)
        )

    ranges.sort()

    merged = []

    for left, right in ranges:
        if not merged:
            merged.append(
                [left, right]
            )
            continue

        previous_left, previous_right = merged[-1]

        if left <= previous_right + 250:
            merged[-1][1] = max(
                previous_right,
                right,
            )
        else:
            merged.append(
                [left, right]
            )

    snippets = []

    for left, right in merged:
        snippets.append(
            clean[left:right]
        )

    focused = "\n\n".join(snippets)

    return focused[:max_chars]


# =========================================================
# LIVE EXAM/TOPIC RETRIEVAL
# =========================================================

def retrieve_exam_context(
    exam_id,
    subject,
    topic,
):
    """
    Retrieve current official exam information for the
    requested Exam + Subject + Topic.

    Returns source metadata plus topic-focused text.
    """

    source = get_exam_source(
        exam_id
    )

    if not source:
        return {
            "success": False,
            "exam": exam_id,
            "subject": subject,
            "topic": topic,
            "source_name": "",
            "source_url": "",
            "retrieved_live": False,
            "content": "",
            "message": (
                "No official web source configured "
                f"for exam: {exam_id}"
            ),
        }

    source_url = source["url"]

    try:
        # Validate configured URL.
        _validate_url(
            source_url,
            source["allowed_hosts"],
        )

        content_type, data, final_url = _fetch(
            source_url
        )

        # Validate the final redirected URL too.
        final_host = (
            urlparse(final_url).hostname
            or ""
        ).lower()

        allowed_hosts = [
            item.lower()
            for item in source["allowed_hosts"]
        ]

        # NEET may redirect from the official page
        # to the official S3-hosted PDF.
        if final_host not in allowed_hosts:
            # Permit the known NEET document host.
            if not (
                "NEET" in source["name"].upper()
                and final_host == "cdnbbsr.s3waas.gov.in"
            ):
                raise ValueError(
                    f"Redirected to non-allowlisted host: {final_host}"
                )

        final_source_url = final_url

        # -----------------------------------------------------
        # DIRECT PDF
        # -----------------------------------------------------
        is_pdf = (
            "application/pdf" in content_type
            or final_url.lower().endswith(".pdf")
            or source_url.lower().endswith(".pdf")
        )

        if is_pdf:
            text = _extract_pdf_text(
                data
            )

        # -----------------------------------------------------
        # HTML PAGE
        # -----------------------------------------------------
        else:
            html = data.decode(
                "utf-8",
                errors="ignore",
            )

            text = _extract_html_text(
                data
            )

            # -------------------------------------------------
            # NEET: locate the actual syllabus PDF
            # -------------------------------------------------
            if "NEET" in source["name"].upper():
                syllabus_pdf = _find_link(
                    html,
                    source_url,
                    [
                        "syllabus",
                        "neet",
                        "2026",
                    ],
                    [
                        "neet.nta.nic.in",
                        "cdnbbsr.s3waas.gov.in",
                    ],
                )

                if syllabus_pdf:
                    try:
                        pdf_type, pdf_data, pdf_final_url = _fetch(
                            syllabus_pdf
                        )

                        if (
                            "application/pdf"
                            in pdf_type
                            or pdf_final_url.lower().endswith(".pdf")
                        ):
                            pdf_text = _extract_pdf_text(
                                pdf_data
                            )

                            if pdf_text.strip():
                                text = pdf_text
                                final_source_url = pdf_final_url

                    except Exception as pdf_exc:
                        print(
                            "[WEB QUIZ] NEET PDF link retrieval failed:",
                            pdf_exc,
                        )

        text = _clean_text(
            text
        )

        focused_text = _focus_text(
            text,
            subject,
            topic,
            max_chars=9000,
        )

        if not focused_text:
            return {
                "success": False,
                "exam": exam_id,
                "subject": subject,
                "topic": topic,
                "source_name": source["name"],
                "source_url": final_source_url,
                "retrieved_live": True,
                "content": "",
                "message": (
                    "Official source was reached, "
                    "but no useful text could be extracted."
                ),
            }

        return {
            "success": True,
            "exam": exam_id,
            "subject": subject,
            "topic": topic,
            "source_name": source["name"],
            "source_url": final_source_url,
            "retrieved_live": True,
            "content": focused_text,
            "message": (
                "Official source retrieved successfully."
            ),
        }

    except requests.exceptions.HTTPError as exc:
        status_code = getattr(
            exc.response,
            "status_code",
            "unknown",
        )

        return {
            "success": False,
            "exam": exam_id,
            "subject": subject,
            "topic": topic,
            "source_name": source["name"],
            "source_url": source_url,
            "retrieved_live": False,
            "content": "",
            "message": (
                f"Official source returned HTTP {status_code}."
            ),
        }

    except Exception as exc:
        print(
            f"[WEB QUIZ ERROR] {type(exc).__name__}: {exc}"
        )

        return {
            "success": False,
            "exam": exam_id,
            "subject": subject,
            "topic": topic,
            "source_name": source["name"],
            "source_url": source_url,
            "retrieved_live": False,
            "content": "",
            "message": (
                "Live source retrieval failed: "
                f"{type(exc).__name__}: {exc}"
            ),
        }
