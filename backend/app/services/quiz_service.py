import json
import re
import uuid
from datetime import datetime, timezone

from backend.app.services.llm_service import (
    generate_chat_response,
    is_llm_available,
)


def _normalize_text(value: str) -> str:
    """
    Normalize text for duplicate detection.
    """
    value = str(value or "").strip().lower()

    value = re.sub(r"\s+", " ", value)

    value = re.sub(
        r"[^\w\s]",
        "",
        value,
        flags=re.UNICODE,
    )

    return value


def _extract_json(text: str) -> dict:
    """
    Safely extract a JSON object from an AI response.
    Handles Markdown fences and extra text around JSON.
    """

    if not text:
        raise ValueError(
            "The AI returned an empty quiz response."
        )

    cleaned = text.strip()

    # Remove markdown code fences.
    cleaned = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    cleaned = re.sub(
        r"\s*```$",
        "",
        cleaned,
    )

    # First attempt: complete response is JSON.
    try:
        result = json.loads(cleaned)

        if isinstance(result, dict):
            return result

    except json.JSONDecodeError:
        pass

    # Second attempt: find JSON object.
    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError(
            "The AI response did not contain a JSON object."
        )

    candidate = cleaned[start:end + 1]

    try:
        result = json.loads(candidate)

        if isinstance(result, dict):
            return result

    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Could not parse quiz JSON: {exc}"
        ) from exc

    raise ValueError(
        "Quiz response must be a JSON object."
    )


def _clean_questions(raw_questions: list) -> list:
    """
    Validate and normalize AI-generated questions.
    """

    if not isinstance(raw_questions, list):
        return []

    questions = []

    seen_questions = set()

    for index, item in enumerate(
        raw_questions,
        start=1,
    ):

        if not isinstance(item, dict):
            continue

        question_text = str(
            item.get("question", "")
        ).strip()

        if not question_text:
            continue

        # Prevent duplicate questions.
        question_key = _normalize_text(
            question_text
        )

        if not question_key:
            continue

        if question_key in seen_questions:
            continue

        raw_options = item.get(
            "options",
            [],
        )

        if not isinstance(
            raw_options,
            list,
        ):
            continue

        if len(raw_options) != 4:
            continue

        options = [
            str(option).strip()
            for option in raw_options
        ]

        if any(
            not option
            for option in options
        ):
            continue

        # -----------------------------------------
        # DUPLICATE OPTION VALIDATION
        # -----------------------------------------

        normalized_options = [
            _normalize_text(option)
            for option in options
        ]

        if len(
            set(normalized_options)
        ) != 4:
            continue

        # -----------------------------------------
        # ANSWER VALIDATION
        # -----------------------------------------

        raw_answer = item.get(
            "answer",
            item.get(
                "correct_answer",
                0,
            ),
        )

        if isinstance(
            raw_answer,
            str,
        ):

            raw_answer = raw_answer.strip()

            if raw_answer.upper() in {
                "A",
                "B",
                "C",
                "D",
            }:

                answer = (
                    ord(
                        raw_answer.upper()
                    )
                    - ord("A")
                )

            else:

                try:
                    answer = int(
                        raw_answer
                    )

                except ValueError:
                    continue

        else:

            try:
                answer = int(
                    raw_answer
                )

            except (
                TypeError,
                ValueError,
            ):
                continue

        if answer not in range(4):
            continue

        explanation = str(
            item.get(
                "explanation",
                "",
            )
        ).strip()

        if not explanation:
            explanation = (
                f"The correct answer is "
                f"{options[answer]}."
            )

        questions.append(
            {
                "id": len(questions) + 1,
                "question": question_text,
                "options": options,
                "answer": answer,
                "explanation": explanation,
            }
        )

        seen_questions.add(
            question_key
        )

    return questions


def _build_system_prompt() -> str:
    return """
You are EduTrace, an expert educational assessment generator.

Your job is to create accurate multiple-choice questions.

IMPORTANT:
Return ONLY valid JSON.

DO NOT return:
- Markdown
- ```json fences
- explanations outside JSON
- introductory text
- closing text
- comments
- trailing commas

The response MUST be a single valid JSON object.

JSON structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": 0,
      "explanation": "Explanation"
    }
  ]
}

RULES:

1. Generate exactly the requested number of questions.

2. Every question must strictly match the supplied subject.

3. Every question must strictly match the supplied topic.

4. Questions must be appropriate for the requested exam or goal.

5. Follow the requested difficulty.

6. Every question must have exactly four options.

7. All four options MUST be different.

8. NEVER repeat an option.

9. NEVER use two options that mean the same thing.

10. Only one option can be correct.

11. answer MUST be a number:
0 = Option A
1 = Option B
2 = Option C
3 = Option D

12. explanation must explain why the selected answer is correct.

13. Do not create duplicate questions.

14. Do not mix subjects.

15. Do not introduce unrelated programming examples.

16. For Indian Polity questions, use established Indian constitutional and political facts.

17. Avoid ambiguous questions.

18. Avoid outdated claims.

19. Check every answer before returning the JSON.

20. Make sure every opening { has a matching }.

21. Make sure every opening [ has a matching ].

22. Use double quotes for JSON strings.

23. Escape quotation marks inside strings correctly.

24. NEVER place a comma after the final property.

25. NEVER place a comma after the final array item.

26. Before responding, mentally validate the complete JSON.

The final response must contain ONLY the JSON object.
""".strip()


def _build_user_prompt(
    subject: str,
    topic: str,
    difficulty: str,
    question_count: int,
    exam: str,
    preparation_type: str,
) -> str:

    return f"""
Create an academic practice quiz.

Subject:
{subject}

Topic:
{topic}

Exam or goal:
{exam or "General Learning"}

Preparation type:
{preparation_type or "General Preparation"}

Difficulty:
{difficulty}

Required number of questions:
{question_count}

Generate EXACTLY {question_count} questions.

Every question must be about:
Subject = {subject}
Topic = {topic}

IMPORTANT VALIDATION:

- exactly {question_count} questions
- exactly 4 options per question
- all 4 options must be unique
- no duplicate questions
- exactly one correct answer
- answer must be 0, 1, 2 or 3
- every explanation must match the correct answer
- no unrelated topics
- no Markdown
- no text outside JSON

Return ONLY:

{{
  "questions": [
    {{
      "question": "Question",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": 0,
      "explanation": "Explanation"
    }}
  ]
}}
""".strip()


def generate_quiz(
    subject: str,
    topic: str,
    difficulty: str = "medium",
    question_count: int = 10,
    exam: str = "",
    preparation_type: str = "",
) -> dict:

    if not is_llm_available():
        raise RuntimeError(
            "Groq AI is not configured. "
            "Check GROQ_API_KEY in your .env file."
        )

    question_count = max(
        1,
        min(
            int(question_count),
            20,
        ),
    )

    subject = str(
        subject or ""
    ).strip()

    topic = str(
        topic or ""
    ).strip()

    difficulty = str(
        difficulty or "medium"
    ).strip().lower()

    system_prompt = (
        _build_system_prompt()
    )

    user_prompt = _build_user_prompt(
        subject=subject,
        topic=topic,
        difficulty=difficulty,
        question_count=question_count,
        exam=exam,
        preparation_type=preparation_type,
    )

    # -----------------------------------------
    # AI RETRY SYSTEM
    # -----------------------------------------

    max_attempts = 3

    last_error = None

    for attempt in range(
        1,
        max_attempts + 1,
    ):

        try:

            prompt = user_prompt

            if attempt > 1:
                prompt += """

IMPORTANT:

The previous generation was rejected because
the JSON or question validation failed.

Generate the quiz again from scratch.

Before responding:
- validate JSON syntax
- check all brackets
- check all quotes
- check commas
- check exactly 4 unique options
- check no duplicate questions
- check exactly one correct answer
- check exactly the requested question count

Return ONLY valid JSON.
""".strip()

            response = generate_chat_response(
                message=prompt,
                system_prompt=system_prompt,
                history=[],
            )

            parsed = _extract_json(
                response
            )

            raw_questions = parsed.get(
                "questions",
                [],
            )

            questions = _clean_questions(
                raw_questions
            )

            if len(questions) != question_count:

                raise ValueError(
                    f"Expected {question_count} "
                    f"valid questions, but received "
                    f"{len(questions)}."
                )

            # Final validation.
            for question in questions:

                if len(
                    question["options"]
                ) != 4:

                    raise ValueError(
                        "A question does not contain "
                        "exactly four options."
                    )

                normalized = [
                    _normalize_text(option)
                    for option in question[
                        "options"
                    ]
                ]

                if len(
                    set(normalized)
                ) != 4:

                    raise ValueError(
                        "A question contains "
                        "duplicate answer options."
                    )

                if question["answer"] not in range(4):

                    raise ValueError(
                        "A question contains "
                        "an invalid answer index."
                    )

            # ---------------------------------
            # SUCCESS
            # ---------------------------------

            return {
                "quiz_id": (
                    f"QUIZ-"
                    f"{uuid.uuid4().hex[:10].upper()}"
                ),
                "subject": subject,
                "topic": topic,
                "difficulty": difficulty,
                "question_count": question_count,
                "questions": questions,
                "created_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }

        except Exception as exc:

            last_error = exc

            if attempt < max_attempts:
                continue

    raise RuntimeError(
        "EduTrace AI could not generate a valid quiz "
        f"after {max_attempts} attempts. "
        f"Last error: {last_error}"
    )
