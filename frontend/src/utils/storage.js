/**
 * EduTrace Storage Utility
 * Safe localStorage helpers used across the frontend.
 */

export const STORAGE_KEYS = {
  EDU_ID: "edutrace_edu_id",
  USER: "edutrace_user",
  PROFILE: "edutrace_profile",
  AI_HISTORY: "edutrace_ai_history",
  AI_PREFILL: "edutrace_ai_prefill",
  STUDY_PLAN: "edutrace_study_plan",
  SELECTED_TOPIC: "edutrace_selected_topic",
  SELECTED_SUBJECT: "edutrace_selected_subject",
  SELECTED_EXAM: "edutrace_selected_exam",
  PREPARATION_TYPE: "edutrace_preparation_type",
  SETTINGS: "edutrace_settings",
};

/**
 * Read a value from localStorage.
 */
export function getStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);

    if (value === null) {
      return fallback;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.warn(
      `EduTrace storage read failed for "${key}"`,
      error
    );

    return fallback;
  }
}

/**
 * Save a value to localStorage.
 */
export function setStorage(key, value) {
  try {
    if (value === undefined) {
      localStorage.removeItem(key);
      return;
    }

    if (typeof value === "string") {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    }
  } catch (error) {
    console.warn(
      `EduTrace storage write failed for "${key}"`,
      error
    );
  }
}

/**
 * Remove one stored value.
 */
export function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(
      `EduTrace storage remove failed for "${key}"`,
      error
    );
  }
}

/**
 * Check whether a key exists.
 */
export function hasStorage(key) {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/**
 * Clear all EduTrace-specific local storage.
 */
export function clearEduTraceStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn(
      "Unable to clear EduTrace storage.",
      error
    );
  }
}

/**
 * Get the current EduTrace ID.
 */
export function getEduId() {
  return getStorage(
    STORAGE_KEYS.EDU_ID,
    "EDU1001"
  );
}

/**
 * Save the EduTrace ID.
 */
export function setEduId(eduId) {
  setStorage(
    STORAGE_KEYS.EDU_ID,
    eduId || "EDU1001"
  );
}

/**
 * Get saved AI conversation history.
 */
export function getAIHistory() {
  const history = getStorage(
    STORAGE_KEYS.AI_HISTORY,
    []
  );

  return Array.isArray(history)
    ? history
    : [];
}

/**
 * Save AI conversation history.
 */
export function setAIHistory(history) {
  setStorage(
    STORAGE_KEYS.AI_HISTORY,
    Array.isArray(history)
      ? history
      : []
  );
}

/**
 * Clear AI conversation history.
 */
export function clearAIHistory() {
  removeStorage(
    STORAGE_KEYS.AI_HISTORY
  );
}

/**
 * Save the topic that should be opened
 * automatically in AI Assistant.
 */
export function setAIPrefill(data) {
  setStorage(
    STORAGE_KEYS.AI_PREFILL,
    data
  );
}

/**
 * Read AI prefill data.
 */
export function getAIPrefill() {
  return getStorage(
    STORAGE_KEYS.AI_PREFILL,
    null
  );
}

/**
 * Remove AI prefill after it has been consumed.
 */
export function clearAIPrefill() {
  removeStorage(
    STORAGE_KEYS.AI_PREFILL
  );
}

export default {
  getStorage,
  setStorage,
  removeStorage,
  hasStorage,
  clearEduTraceStorage,
  getEduId,
  setEduId,
  getAIHistory,
  setAIHistory,
  clearAIHistory,
  setAIPrefill,
  getAIPrefill,
  clearAIPrefill,
  STORAGE_KEYS,
};
