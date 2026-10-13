const API_BASE_URL = "http://127.0.0.1:8001";

/* =========================================================
   TEXT NORMALIZER
========================================================= */

function normalizeText(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map(normalizeText)
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "object") {
    const keys = [
      "answer",
      "response",
      "reply",
      "message",
      "content",
      "text",
    ];

    for (const key of keys) {
      if (value[key] !== undefined && value[key] !== null) {
        const result = normalizeText(value[key]);

        if (result) {
          return result;
        }
      }
    }

    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

/* =========================================================
   SEND MESSAGE TO EDUTRACE AI
========================================================= */

export async function sendMessage({
  message,
  prompt,
  edu_id,
  eduId,
  subject = "General",
  personality = "Friendly Mentor",
  level = "Beginner",
  mascot = "EduBot",
  mode = "EduBot Teacher",
  recent_messages = [],
  history = [],
  instructions = "",
  ...extraContext
}) {
  const cleanMessage = normalizeText(message || prompt);

  if (!cleanMessage) {
    throw new Error("Please enter a question.");
  }

  const finalEduId =
    edu_id ||
    eduId ||
    getEduId() ||
    "EDU1001";

  const finalHistory =
    Array.isArray(history) && history.length > 0
      ? history
      : Array.isArray(recent_messages)
        ? recent_messages
        : [];

  /*
   * Keep the complete EduBot context.
   * This allows the backend to use subject, level,
   * teaching personality and recent conversation.
   */
  const payload = {
    message: cleanMessage,

    edu_id: finalEduId,

    subject: subject || "General",

    personality:
      personality || "Friendly Mentor",

    level:
      level || "Beginner",

    mascot:
      mascot || "EduBot",

    mode:
      mode || "EduBot Teacher",

    history: finalHistory,

    recent_messages: finalHistory,

    instructions:
      instructions || "",

    ...extraContext,
  };

  const url = `${API_BASE_URL}/api/ai/chat`;

  console.log("========================================");
  console.log("EDUTRACE EDUBOT → BACKEND");
  console.log("========================================");
  console.log("URL:", url);
  console.log("Payload:", payload);

  let response;

  try {
    response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error(
      "EduBot FETCH NETWORK ERROR:",
      error
    );

    throw new Error(
      `Cannot connect to EduTrace AI backend at ${url}. ` +
      `Please make sure FastAPI is running on port 8000.`
    );
  }

  console.log(
    "EduBot backend HTTP status:",
    response.status
  );

  /*
   * Read the response only ONCE.
   * This avoids the common response.json()
   * followed by response.text() body-consumption error.
   */
  const rawText = await response.text();

  console.log(
    "EduBot backend raw response:",
    rawText
  );

  let data = {};

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch (error) {
      console.error(
        "EduBot invalid JSON:",
        rawText
      );

      throw new Error(
        `Backend returned invalid JSON. HTTP ${response.status}`
      );
    }
  }

  console.log(
    "EduBot backend parsed response:",
    data
  );

  /* =======================================================
     BACKEND ERROR
  ======================================================= */

  if (!response.ok) {
    const errorMessage =
      normalizeText(data?.detail) ||
      normalizeText(data?.error) ||
      normalizeText(data?.message) ||
      normalizeText(data?.response) ||
      normalizeText(data?.answer) ||
      `AI service request failed. HTTP ${response.status}`;

    console.error(
      "EduBot backend error:",
      errorMessage
    );

    throw new Error(
      `${errorMessage} (HTTP ${response.status})`
    );
  }

  /* =======================================================
     SUCCESS RESPONSE
  ======================================================= */

  const answer = normalizeText(
    data?.answer ??
    data?.response ??
    data?.reply ??
    data?.message ??
    data?.content ??
    data
  );

  if (!answer) {
    throw new Error(
      "EduBot received an empty response from the AI service."
    );
  }

  console.log(
    "EduBot final answer:",
    answer
  );

  return answer;
}

/* =========================================================
   GET EDU ID
========================================================= */

export function getEduId() {
  try {
    return (
      localStorage.getItem("edu_id") ||
      localStorage.getItem("eduId") ||
      localStorage.getItem("EDU_ID") ||
      "EDU1001"
    );
  } catch (error) {
    return "EDU1001";
  }
}

/* =========================================================
   AI HEALTH CHECK
========================================================= */

export async function checkAIHealth() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/health`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error(
      "EduBot health check failed:",
      error
    );

    return false;
  }
}

/* =========================================================
   EXPORTS
========================================================= */

export { normalizeText };

export default {
  sendMessage,
  getEduId,
  checkAIHealth,
};

