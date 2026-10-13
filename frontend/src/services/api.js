const API_BASE_URL = "http://localhost:8001";

/* =========================================================
   GENERIC GET
========================================================= */

export async function getApi(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `API request failed: ${response.status}`
    );
  }

  return response.json();
}


/* =========================================================
   GENERIC POST
========================================================= */

export async function postApi(endpoint, data) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || `API request failed: ${response.status}`
    );
  }

  return response.json();
}


/* =========================================================
   EDUTRACE AI CHAT
========================================================= */

export async function askEduTraceAI(
  question,
  {
    edu_id = "EDU1001",
    use_rag = false,
    use_personal_data = false,
    history = [],
  } = {}
) {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      edu_id,
      message: question,
      use_personal_data,
      use_rag,
      history,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || `EduTrace AI request failed: ${response.status}`
    );
  }

  return response.json();
}


/* =========================================================
   AI HEALTH
========================================================= */

export async function getAIHealth() {
  return getApi("/api/ai/health");
}


/* =========================================================
   AI CAPABILITIES
========================================================= */

export async function getAICapabilities() {
  return getApi("/api/ai/capabilities");
}


/* =========================================================
   RAG SEARCH
========================================================= */

export async function searchKnowledgeVault(
  edu_id,
  query,
  top_k = 5
) {
  return postApi("/api/rag/search", {
    edu_id,
    query,
    top_k,
  });
}


/* =========================================================
   RAG QUERY
========================================================= */

export async function queryKnowledgeVault(
  edu_id,
  query,
  top_k = 5
) {
  return postApi("/api/rag/query", {
    edu_id,
    query,
    top_k,
  });
}


/* =========================================================
   DEFAULT API OBJECT
========================================================= */

const api = {
  get: getApi,
  post: postApi,
  askEduTraceAI,
  getAIHealth,
  getAICapabilities,
  searchKnowledgeVault,
  queryKnowledgeVault,
};

export default api;

