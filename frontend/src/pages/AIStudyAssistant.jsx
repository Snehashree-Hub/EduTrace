import "./AIStudyAssistant.css";
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Bot,
  Copy,
  Menu,
  Plus,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  RotateCcw,
  BookOpen,
  X,
} from "lucide-react";

import aiService from "../services/aiService";
import { getStorage, setStorage, STORAGE_KEYS } from "../utils/storage";

import "highlight.js/styles/github-dark.css";
const INITIAL_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content: `# Hi! 👋✨ I'm EduTrace AI

I'm your personal learning buddy 🤖💜

I can help you:

- 📚 Understand concepts clearly
- 🧠 Prepare for exams
- ✏️ Practice important questions
- 💡 Learn with examples
- 📝 Revise difficult topics
- 🎯 Follow your Study Plan

Choose a topic from your **Study Plan** and I'll teach it step by step!`,
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function AIStudyAssistant() {
  const location = useLocation();
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [useRag, setUseRag] = useState(false);
  const [usePersonalData, setUsePersonalData] = useState(false);

  const [chatHistory, setChatHistory] = useState([]);
  const [chatTitle, setChatTitle] = useState("New Learning Session");

  /*
   * ---------------------------------------------------------
   * AUTO START FROM STUDY PLAN
   * ---------------------------------------------------------
   *
   * When the learner clicks:
   *
   * Study Plan
   *     ↓
   * Start Learning / Learn This Topic
   *     ↓
   * AI Study Assistant
   *
   * the AI automatically starts today's lesson.
   */
  useEffect(() => {
    const studyPlanContext = location.state?.studyPlanContext;
    const autoStart = location.state?.autoStart;

    if (!autoStart || !studyPlanContext) {
      return;
    }

    const {
      preparationType = "General Learning",
      examGoal = "Learning",
      subject = "General",
      topic = "Today's Topic",
      duration = "7 Days",
      dailyLearningTime = "2 Hours",
      selectedDay = 1,
    } = studyPlanContext;

    /*
     * ---------------------------------------------------------
     * PREVENT DUPLICATE AUTO START
     * ---------------------------------------------------------
     */
    const safeTopic = String(topic)
      .trim()
      .replace(/\s+/g, "_");

    const safeSubject = String(subject)
      .trim()
      .replace(/\s+/g, "_");

    const autoStartKey =
      `edutrace_autostart_${safeSubject}_${safeTopic}_${selectedDay}_${location.key}`;

    if (sessionStorage.getItem(autoStartKey)) {
      return;
    }

    sessionStorage.setItem(autoStartKey, "true");

    /*
     * ---------------------------------------------------------
     * SET CHAT TITLE
     * ---------------------------------------------------------
     */
    setChatTitle(`${subject} · ${topic}`);

    /*
     * ---------------------------------------------------------
     * AUTOMATIC TEACHING PROMPT
     * ---------------------------------------------------------
     */
    const automaticPrompt = `
Good morning 🌅

Today's topic is "${topic}".

Let's start today's learning session.

You are my personal AI tutor inside EduTrace.

STUDY PLAN DETAILS:
Preparation Type: ${preparationType}
Exam / Goal: ${examGoal}
Subject: ${subject}
Today's Topic: ${topic}
Study Duration: ${duration}
Daily Learning Time: ${dailyLearningTime}
Current Study Day: Day ${selectedDay}

TEACHING INSTRUCTIONS:

Start teaching immediately. Do not ask me what topic I want to learn because the topic is already provided.

Teach "${topic}" in a detailed but easy-to-understand way.

Follow this structure:

## 🌅 Today's Learning Topic
Clearly introduce "${topic}" and explain what we are going to learn today.

## 1. Concept / Definition
Explain the exact meaning of the topic and give the important definition.

## 2. Simple Explanation
Explain it in very simple language as if you are teaching a beginner.

## 3. Detailed Explanation
Explain the topic deeply, step by step.
Break complicated ideas into smaller parts.

## 4. How It Works
Explain the process, mechanism, working, flow, or logic behind the topic whenever applicable.

## 5. Structure / Syntax
If the topic is programming, mathematics, science, or another subject where a structure, formula, syntax, rule, or representation is useful, show it clearly.
If not applicable, skip this section.

## 6. Examples
Give at least 2 clear examples related specifically to "${topic}".

For technical topics:
- Use useful code/examples when relevant.
- Explain the code or steps clearly.

For Mathematics:
- Show the method step by step.
- Include a solved example.

For Physics/Chemistry/Biology:
- Explain the scientific idea clearly.
- Include subject-specific examples.

For theoretical subjects:
- Use simple practical examples and memory-friendly explanations.

## 7. Real-World Example
Give at least one real-world situation where "${topic}" is used or can be understood.

## 8. Key Points to Remember
Give the most important points in short bullet points.

## 9. Common Mistakes
Explain common mistakes or misconceptions students make about this topic.

## 10. Exam-Focused Important Points
Highlight the points that are especially useful for exams, interviews, assignments, or assessments based on the selected goal.

## 11. Important Questions
Give important questions that a learner should prepare from this topic.

Include a mixture of:
- Short-answer questions
- Conceptual questions
- Application-based questions
- Exam-style questions

Give the answer or key explanation after each question.

## 12. Quick Practice
Give 3 short practice questions based only on today's topic.

Do not reveal the answers immediately.
Let me try them first.

## 🎯 Quick Check
End the lesson by asking me ONE simple question to check whether I understood today's topic.

IMPORTANT RULES:
- Stay focused on "${topic}".
- Do not introduce unrelated subjects.
- Use clear and friendly language.
- Teach like a patient expert tutor.
- Do not simply repeat the prompt.
- Do not give only important questions.
- The main goal is to TEACH THE CONCEPT first and then provide important questions.
- Use examples wherever they improve understanding.
- Make the explanation useful for the ${examGoal} goal.
- Keep the lesson structured and easy to read.
- Start teaching immediately.
`;

    /*
     * Start the AI lesson automatically.
     */
    sendMessageToAI(automaticPrompt, true);

    /*
     * ---------------------------------------------------------
     * CLEAR ROUTER STATE
     * ---------------------------------------------------------
     *
     * This prevents the same navigation state from
     * being reused unnecessarily.
     */
    window.history.replaceState({}, document.title);
  }, [location.key, location.state]);

  /*
   * ---------------------------------------------------------
   * LOAD SAVED CHAT HISTORY
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const saved = getStorage(STORAGE_KEYS.AI_HISTORY, []);

    if (Array.isArray(saved) && saved.length > 0) {
      setChatHistory(saved);
    }
  }, []);

  /*
   * ---------------------------------------------------------
   * SCROLL TO BOTTOM
   * ---------------------------------------------------------
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  /*
   * ---------------------------------------------------------
   * SAVE CURRENT CHAT
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (messages.length <= 1) return;

    const userMessages = messages.filter(
      (message) => message.role === "user"
    );

    if (userMessages.length === 0) return;

    const title =
      chatTitle !== "New Learning Session"
        ? chatTitle
        : userMessages[0].content.slice(0, 50);

    const historyItem = {
      id: "current",
      title,
      updatedAt: new Date().toISOString(),
      messages,
    };

    const previous = getStorage(STORAGE_KEYS.AI_HISTORY, []);

    const filtered = Array.isArray(previous)
      ? previous.filter((item) => item.id !== "current")
      : [];

    setStorage(STORAGE_KEYS.AI_HISTORY, [
      historyItem,
      ...filtered,
    ]);
  }, [messages, chatTitle]);

  /*
   * ---------------------------------------------------------
   * SEND MESSAGE
   * ---------------------------------------------------------
   */
  async function sendMessageToAI(messageText, automatic = false) {
    const cleanMessage = messageText?.trim();

    if (!cleanMessage || loading) return;

    const userMessage = {
      id: createId(),
      role: "user",
      content: cleanMessage,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    if (!automatic) {
      setInput("");
    }

    setLoading(true);

    try {
      /*
       * Send only actual conversation messages
       * to backend.
       */
      const history = messages
        .filter(
          (message) =>
            message.role === "user" ||
            message.role === "assistant"
        )
        .slice(-12)
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      const result = await aiService.sendMessage({
        message: cleanMessage,
        history,
        usePersonalData,
        useRag,
      });

      /*
       * aiService.sendMessage() currently returns
       * the AI answer directly as a string.
       * Keep compatibility with object responses too.
       */
      const answer =
        typeof result === "string"
          ? result.trim()
          : (
              result?.answer ||
              result?.response ||
              result?.content ||
              result?.message ||
              ""
            ).toString().trim();

      if (!answer) {
        throw new Error(
          "EduTrace AI returned an empty response."
        );
      }

      const assistantMessage = {
        id: createId(),
        role: "assistant",
        content: answer,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

      if (chatTitle === "New Learning Session") {
        setChatTitle(cleanMessage.slice(0, 45));
      }
    } catch (error) {
      console.error("EduTrace AI Error:", error);

      setMessages((previous) => [
        ...previous,
        {
          id: createId(),
          role: "assistant",
          content: `### Sorry! 😕

I couldn't connect to EduTrace AI right now.

Please make sure the **FastAPI backend is running** and try again.

\`\`\`
${error.message || "Unknown error"}
\`\`\``,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * NORMAL SEND
   * ---------------------------------------------------------
   */
  function handleSend() {
    if (!input.trim() || loading) return;

    sendMessageToAI(input);
  }

  /*
   * ---------------------------------------------------------
   * ENTER KEY
   * ---------------------------------------------------------
   */
  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  /*
   * ---------------------------------------------------------
   * NEW CHAT
   * ---------------------------------------------------------
   */
  function newChat() {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setChatTitle("New Learning Session");
    setDrawerOpen(false);
  }

  /*
   * ---------------------------------------------------------
   * COPY
   * ---------------------------------------------------------
   */
  async function copyMessage(content) {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error(error);
    }
  }

  /*
   * ---------------------------------------------------------
   * QUICK PROMPTS
   * ---------------------------------------------------------
   */
  const quickPrompts = [
    "Teach me Python from basics",
    "Explain this concept with an example",
    "Prepare important exam questions",
    "Help me revise this topic",
  ];

  return (
    <div className="ai-page">

      {/* MOBILE OVERLAY */}
      {drawerOpen && (
        <div
          className="ai-drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ---------------------------------------------------
          AI DRAWER
      --------------------------------------------------- */}
      <aside
        className={`ai-drawer ${
          drawerOpen ? "open" : ""
        }`}
      >
        <div className="ai-drawer-header">
          <div className="ai-brand">
            <div className="ai-brand-icon">
              <Bot size={21} />
            </div>

            <div>
              <strong>EduTrace AI</strong>
              <span>Learning Buddy</span>
            </div>
          </div>

          <button
            className="ai-icon-btn"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <button
          className="ai-new-chat"
          onClick={newChat}
        >
          <Plus size={17} />
          New Chat
        </button>

        <div className="ai-drawer-section">
          <span className="ai-drawer-label">
            WORKSPACE
          </span>

          <button className="ai-drawer-item">
            <BookOpen size={17} />
            Knowledge Vault
          </button>

          <button className="ai-drawer-item">
            <Sparkles size={17} />
            AI Settings
          </button>
        </div>

        <div className="ai-drawer-section">
          <span className="ai-drawer-label">
            CHAT HISTORY
          </span>

          {chatHistory.length === 0 ? (
            <div className="ai-empty-history">
              No previous chats yet.
            </div>
          ) : (
            chatHistory.slice(0, 8).map((chat) => (
              <button
                key={chat.id}
                className="ai-drawer-item history"
                onClick={() => {
                  if (chat.messages) {
                    setMessages(chat.messages);
                    setChatTitle(chat.title);
                    setDrawerOpen(false);
                  }
                }}
              >
                <BookOpen size={15} />
                <span>{chat.title}</span>
              </button>
            ))
          )}
        </div>

        <div className="ai-drawer-bottom">
          <span>EduTrace AI</span>
          <small>Personal Learning Assistant</small>
        </div>
      </aside>

      {/* ---------------------------------------------------
          MAIN CHAT
      --------------------------------------------------- */}
      <main className="ai-chat-main">

        {/* HEADER */}
        <header className="ai-chat-header">

          <div className="ai-header-left">

            <button
              className="ai-menu-btn"
              onClick={() =>
                setDrawerOpen((previous) => !previous)
              }
              aria-label="Open AI menu"
            >
              <Menu size={21} />
            </button>

            <div className="ai-header-avatar">
              <Bot size={19} />
            </div>

            <div>
              <div className="ai-header-title">
                {chatTitle}
              </div>

              <div className="ai-online">
                <span />
                EduTrace AI is ready
              </div>
            </div>
          </div>

          <div className="ai-header-actions">
            <label className="ai-toggle">
              <input
                type="checkbox"
                checked={useRag}
                onChange={(e) =>
                  setUseRag(e.target.checked)
                }
              />
              <span>Knowledge</span>
            </label>

            <label className="ai-toggle">
              <input
                type="checkbox"
                checked={usePersonalData}
                onChange={(e) =>
                  setUsePersonalData(e.target.checked)
                }
              />
              <span>Personal</span>
            </label>
          </div>
        </header>

        {/* CONTEXT */}
        <div className="ai-context-bar">
          <Sparkles size={15} />

          <span>
            EduTrace AI · Personalized Learning
          </span>

          <span className="ai-context-dot">
            •
          </span>

          <span>EDU1001</span>
        </div>

        {/* CHAT */}
        <div className="ai-chat-scroll">

          {messages.length === 1 ? (
            <div className="ai-welcome">

              <div className="ai-welcome-robot">
                <div className="ai-robot-glow" />

                <div className="ai-robot">
                  <Bot size={55} />
                </div>
              </div>

              <span className="ai-welcome-label">
                YOUR AI LEARNING BUDDY
              </span>

              <h1>
                What shall we
                <br />
                <span>learn today?</span> ✨
              </h1>

              <p>
                Ask anything. I'll explain it clearly,
                step by step, with examples and practice.
              </p>

              <div className="ai-quick-prompts">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() =>
                      sendMessageToAI(prompt)
                    }
                  >
                    <Sparkles size={14} />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-message-list">

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`ai-message-row ${
                    message.role === "user"
                      ? "user"
                      : "assistant"
                  }`}
                >
                  <div className="ai-message-avatar">
                    {message.role === "assistant" ? (
                      <Bot size={17} />
                    ) : (
                      "Y"
                    )}
                  </div>

                  <div className="ai-message-content">

                    <div className="ai-message-name">
                      {message.role === "assistant"
                        ? "EduTrace AI"
                        : "You"}
                    </div>

                    <div className="ai-message-bubble">

                      {message.role === "assistant" ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[
                            rehypeHighlight,
                          ]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <p>{message.content}</p>
                      )}

                    </div>

                    <div className="ai-message-actions">

                      <button
                        onClick={() =>
                          copyMessage(
                            message.content
                          )
                        }
                      >
                        <Copy size={13} />
                        Copy
                      </button>

                      {message.role ===
                        "assistant" && (
                        <>
                          <button>
                            <ThumbsUp size={13} />
                          </button>

                          <button>
                            <ThumbsDown size={13} />
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              ))}

              {loading && (
                <div className="ai-message-row assistant">

                  <div className="ai-message-avatar">
                    <Bot size={17} />
                  </div>

                  <div className="ai-message-content">
                    <div className="ai-message-name">
                      EduTrace AI
                    </div>

                    <div className="ai-thinking">
                      <span />
                      <span />
                      <span />
                      <em>
                        Thinking and preparing your lesson...
                      </em>
                    </div>
                  </div>

                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}

        </div>

        {/* INPUT */}
        <div className="ai-input-area">

          <div className="ai-input-box">

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask EduTrace AI anything..."
              rows={1}
              disabled={loading}
            />

            <button
              className="ai-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              <Send size={18} />
            </button>

          </div>

          <div className="ai-input-hint">
            <span>
              Enter to send
            </span>

            <span>
              EduTrace AI can make mistakes. Verify
              important information.
            </span>
          </div>

        </div>

      </main>
    </div>
  );
}

export default AIStudyAssistant;





