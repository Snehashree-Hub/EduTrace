import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  CircleStop,
  Eraser,
  Gauge,
  Lightbulb,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";

import { sendMessage, getEduId } from "../services/aiService";
import "./aiRobot.css";

const CHAT_STORAGE_KEY = "edutrace_robot_chat";
const PROFILE_STORAGE_KEY = "edutrace_robot_profile";

const DEFAULT_PROFILE = {
  robotName: "EduBot",
  personality: "Friendly",
  voiceRate: 0.95,
};

const SUGGESTIONS = [
  "Explain Newton's second law simply",
  "Teach me Python loops",
  "Explain acids and bases",
  "Help me understand probability",
];

const ROBOT_SYSTEM_PROMPT = `
You are EduBot, the friendly adaptive AI tutor inside EduTrace.

Your job is not only to answer questions. Your job is to make the learner genuinely understand.

TEACHING RULES:
1. Understand exactly what the learner is asking.
2. Explain in simple natural language.
3. Start with the core concept.
4. Use a relevant real-world example.
5. If there is a formula, explain every variable.
6. For calculations, show the steps clearly.
7. For programming, use examples relevant to the requested programming topic.
8. For science, use scientifically accurate examples.
9. Never use unrelated examples just to fill space.
10. If the learner gives a wrong answer, do not simply say "wrong".
11. Identify the likely misunderstanding.
12. Explain the misunderstood part differently.
13. Give a new example or analogy.
14. Ask a new understanding-check question.
15. If the learner remains confused, simplify further.
16. Never pretend that an image, animation, video, or document exists unless it is actually provided.
17. Use clean Markdown.

ADAPTIVE LEARNING:
When the learner answers a question incorrectly, analyze the answer and classify the likely problem as one of:
- Concept confusion
- Formula confusion
- Calculation mistake
- Unit confusion
- Terminology confusion
- Misreading the question
- Incomplete understanding

When possible, return this structure:

## What happened
Briefly explain whether the learner understood the idea.

## Understanding
Give an estimated understanding percentage from 0 to 100.

## Possible confusion
Give one concise confusion type.

## Let's see it differently
Re-teach the concept using a different explanation.

## Example
Give one relevant example.

## Try again
Ask one new question that tests the same concept without repeating the exact previous question.

Be encouraging and natural. Do not embarrass the learner.
`;

function loadChat() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return {
      ...DEFAULT_PROFILE,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function extractUnderstanding(text) {
  if (!text) {
    return {
      score: null,
      confusion: null,
    };
  }

  const scorePatterns = [
    /understanding[^0-9]{0,30}(\d{1,3})\s*%/i,
    /(\d{1,3})\s*%\s*(?:understanding|understood)/i,
  ];

  let score = null;

  for (const pattern of scorePatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = Number(match[1]);
      if (value >= 0 && value <= 100) {
        score = value;
        break;
      }
    }
  }

  let confusion = null;

  const confusionMatch = text.match(
    /possible confusion\s*[:\-]?\s*([^\n]+)/i
  );

  if (confusionMatch) {
    confusion = confusionMatch[1]
      .replace(/\*\*/g, "")
      .trim();
  }

  return {
    score,
    confusion,
  };
}

function removeAdaptiveMetadata(text) {
  if (!text) return "";

  return text
    .replace(
      /##\s*Understanding[\s\S]*?(?=##|$)/i,
      ""
    )
    .replace(
      /##\s*Possible confusion[\s\S]*?(?=##|$)/i,
      ""
    )
    .trim();
}

function createAIHistory(messages) {
  return messages
    .filter(
      (message) =>
        message.role === "user" || message.role === "assistant"
    )
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

export default function AIRobot() {
  const [messages, setMessages] = useState(loadChat);
  const [profile] = useState(loadProfile);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [subtitles, setSubtitles] = useState("");

  const [lastUnderstanding, setLastUnderstanding] = useState({
    score: null,
    confusion: null,
  });

  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const speechSessionRef = useRef(0);
  const speechQueueRef = useRef([]);
  const speechIndexRef = useRef(0);
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);

  const latestAssistantMessage = useMemo(() => {
    return [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(messages)
      );
    } catch {
      // Ignore storage failures.
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i += 1
      ) {
        transcript += event.results[i][0].transcript;
      }

      setInput(transcript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);

      if (event.error === "not-allowed") {
        setError(
          "Microphone permission was blocked. Please allow microphone access in your browser."
        );
      } else if (event.error !== "aborted") {
        setError("Voice input could not be started.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore.
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore.
      }
    };
  }, []);

  function splitIntoSpeechChunks(text) {
    if (!text) return [];

    const cleanText = text
      .replace(/```[\s\S]*?```/g, "Code example.")
      .replace(/[#*_>`]/g, "")
      .replace(/\|/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return [];

    const sentences = cleanText.match(
      /[^.!?]+[.!?]+|[^.!?]+$/g
    );

    if (!sentences) {
      return [cleanText];
    }

    const chunks = [];
    let current = "";

    sentences.forEach((sentence) => {
      const trimmed = sentence.trim();

      if (!trimmed) return;

      if ((current + " " + trimmed).length > 180) {
        if (current) {
          chunks.push(current.trim());
        }
        current = trimmed;
      } else {
        current = `${current} ${trimmed}`.trim();
      }
    });

    if (current) {
      chunks.push(current);
    }

    return chunks;
  }

  function speakText(text) {
    if (!("speechSynthesis" in window)) {
      setError(
        "Your browser does not support voice output."
      );
      return;
    }

    stopSpeaking();

    const chunks = splitIntoSpeechChunks(text);

    if (!chunks.length) return;

    const session = speechSessionRef.current + 1;
    speechSessionRef.current = session;

    speechQueueRef.current = chunks;
    speechIndexRef.current = 0;

    setIsSpeaking(true);
    setSubtitles(chunks[0]);

    speakNextChunk(session);
  }

  function speakNextChunk(session) {
    if (session !== speechSessionRef.current) {
      return;
    }

    const queue = speechQueueRef.current;
    const index = speechIndexRef.current;

    if (!queue[index]) {
      setIsSpeaking(false);
      setSubtitles("");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(
      queue[index]
    );

    utterance.lang = "en-IN";
    utterance.rate = Number(profile.voiceRate) || 0.95;
    utterance.pitch = 1.08;
    utterance.volume = 1;

    utterance.onstart = () => {
      if (session !== speechSessionRef.current) return;

      setIsSpeaking(true);
      setSubtitles(queue[index]);
    };

    utterance.onend = () => {
      if (session !== speechSessionRef.current) return;

      speechIndexRef.current += 1;

      if (speechIndexRef.current < queue.length) {
        setSubtitles(
          queue[speechIndexRef.current]
        );

        window.setTimeout(() => {
          speakNextChunk(session);
        }, 80);
      } else {
        setIsSpeaking(false);
        setSubtitles("");
      }
    };

    utterance.onerror = () => {
      if (session !== speechSessionRef.current) return;

      setIsSpeaking(false);
      setSubtitles("");
    };

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    speechSessionRef.current += 1;
    speechQueueRef.current = [];
    speechIndexRef.current = 0;

    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore.
    }

    setIsSpeaking(false);
    setSubtitles("");
  }

  function toggleListening() {
    const recognition = recognitionRef.current;

    if (!recognition) {
      setError(
        "Voice input is not supported in this browser. Try Chrome or Edge."
      );
      return;
    }

    if (isListening) {
      try {
        recognition.stop();
      } catch {
        // Ignore.
      }

      setIsListening(false);
      return;
    }

    setError("");

    try {
      recognition.start();
    } catch {
      setError(
        "Voice input is already active or could not start."
      );
    }
  }

  async function sendToRobot(customMessage = null) {
    const trimmed = (
      customMessage !== null ? customMessage : input
    ).trim();

    if (!trimmed || isThinking) {
      return;
    }

    stopSpeaking();
    setError("");

    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsThinking(true);

    try {
      const history = createAIHistory(messages);

      const adaptivePrompt = `
${ROBOT_SYSTEM_PROMPT}

LEARNER'S CURRENT MESSAGE:
${trimmed}

IMPORTANT:
If this is a normal learning question, teach the requested concept.

If the learner is answering a previous understanding-check question:
- evaluate the answer carefully
- determine what is actually understood
- identify the most likely misunderstanding if incorrect
- explain the concept differently
- provide a new relevant example
- finish with one new understanding-check question

Do not make up learner information that is not available.
`;

      const result = await sendMessage({
        eduId: getEduId(),
        message: adaptivePrompt,
        usePersonalData: false,
        useRag: false,
        documentId: null,
        history,
      });

      const answer =
        result.answer ||
        result.response ||
        "I couldn't generate an answer.";

      const understanding = extractUnderstanding(answer);

      if (
        understanding.score !== null ||
        understanding.confusion
      ) {
        setLastUnderstanding(understanding);
      }

      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: removeAdaptiveMetadata(answer),
        timestamp: new Date().toISOString(),
        understandingScore: understanding.score,
        confusion: understanding.confusion,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

      speakText(assistantMessage.content);
    } catch (err) {
      console.error(err);

      const message =
        err?.message ||
        "EduBot could not connect to the AI service.";

      setError(message);
    } finally {
      setIsThinking(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendToRobot();
  }

  function clearChat() {
    stopSpeaking();

    setMessages([]);
    setLastUnderstanding({
      score: null,
      confusion: null,
    });

    setError("");

    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }

  function askAgain() {
    if (!latestAssistantMessage) return;

    sendToRobot(
      "Please re-teach the concept from your previous explanation using a completely different and simpler example. Then ask me one new understanding-check question."
    );
  }

  function speakLatest() {
    if (!latestAssistantMessage) return;

    speakText(latestAssistantMessage.content);
  }

  function getScoreClass(score) {
    if (score === null) return "";

    if (score >= 80) return "good";
    if (score >= 60) return "medium";

    return "needs-work";
  }

  return (
    <div className="ai-robot-page">
      <div className="robot-header">
        <div>
          <div className="robot-eyebrow">
            <Sparkles size={15} />
            EDU TRACE AI LEARNING
          </div>

          <h1>
            Meet{" "}
            <span>{profile.robotName || "EduBot"}</span>
          </h1>

          <p>
            Your adaptive AI tutor that explains, listens,
            checks your understanding, and teaches again when
            you get stuck.
          </p>
        </div>

        <div className="robot-header-actions">
          <button
            type="button"
            className="robot-secondary-button"
            onClick={clearChat}
            disabled={!messages.length}
          >
            <Eraser size={16} />
            Clear
          </button>
        </div>
      </div>

      <div className="robot-layout">
        <section className="robot-main-card">
          <div className="robot-stage">
            <div
              className={[
                "robot-avatar",
                isThinking ? "thinking" : "",
                isListening ? "listening" : "",
                isSpeaking ? "speaking" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="robot-aura" />

              <div className="robot-head">
                <div className="robot-antenna">
                  <span />
                </div>

                <div className="robot-ear left" />
                <div className="robot-ear right" />

                <div className="robot-face">
                  <div className="robot-eyes">
                    <span />
                    <span />
                  </div>

                  <div className="robot-mouth">
                    <span />
                  </div>
                </div>
              </div>

              <div className="robot-neck" />

              <div className="robot-body">
                <div className="robot-chest">
                  <Bot size={26} />
                </div>

                <div className="robot-body-line" />

                <div className="robot-status-light" />
              </div>

              <div className="robot-shadow" />
            </div>

            <div className="robot-state">
              {isListening ? (
                <>
                  <Mic size={16} />
                  Listening to you...
                </>
              ) : isThinking ? (
                <>
                  <Brain size={16} />
                  Thinking...
                </>
              ) : isSpeaking ? (
                <>
                  <Volume2 size={16} />
                  EduBot is speaking
                </>
              ) : (
                <>
                  <Bot size={16} />
                  Ready to teach
                </>
              )}
            </div>

            {subtitles && (
              <div className="robot-subtitles">
                <span className="subtitle-label">
                  SUBTITLES
                </span>

                <p>{subtitles}</p>
              </div>
            )}

            {isSpeaking && (
              <button
                type="button"
                className="stop-speaking-button"
                onClick={stopSpeaking}
              >
                <CircleStop size={16} />
                Stop speaking
              </button>
            )}
          </div>

          <div className="robot-chat">
            {messages.length === 0 ? (
              <div className="robot-empty">
                <div className="robot-empty-icon">
                  <Bot size={32} />
                </div>

                <h2>Hi! I'm EduBot 👋</h2>

                <p>
                  Ask me anything. I'll explain it simply,
                  give you an example, and check whether you
                  really understood it.
                </p>

                <div className="robot-suggestions">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() =>
                        sendToRobot(suggestion)
                      }
                    >
                      <Sparkles size={15} />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="robot-message-list">
                {messages.map((message) => {
                  const isUser =
                    message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={`robot-message-row ${
                        isUser ? "user" : "assistant"
                      }`}
                    >
                      {!isUser && (
                        <div className="message-avatar">
                          <Bot size={17} />
                        </div>
                      )}

                      <div className="robot-message">
                        <div className="message-role">
                          {isUser
                            ? "You"
                            : profile.robotName ||
                              "EduBot"}
                        </div>

                        <div className="message-content">
                          {message.content}
                        </div>

                        {!isUser &&
                          message.understandingScore !==
                            null &&
                          message.understandingScore !==
                            undefined && (
                            <div className="message-understanding">
                              <Gauge size={14} />

                              Understanding estimate:
                              <strong>
                                {
                                  message.understandingScore
                                }
                                %
                              </strong>
                            </div>
                          )}
                      </div>

                      {isUser && (
                        <div className="message-avatar user-avatar">
                          U
                        </div>
                      )}
                    </div>
                  );
                })}

                {isThinking && (
                  <div className="robot-message-row assistant">
                    <div className="message-avatar thinking-avatar">
                      <Bot size={17} />
                    </div>

                    <div className="robot-message thinking-message">
                      <div className="message-role">
                        {profile.robotName || "EduBot"}
                      </div>

                      <div className="thinking-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {error && (
            <div className="robot-error">
              <XCircle size={17} />
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
              >
                <XCircle size={14} />
              </button>
            </div>
          )}

          <form
            className="robot-composer"
            onSubmit={handleSubmit}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              placeholder={
                isListening
                  ? "Listening..."
                  : "Ask EduBot anything..."
              }
              rows={1}
              disabled={isThinking}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
            />

            <div className="composer-actions">
              <button
                type="button"
                className={`voice-input-button ${
                  isListening ? "active" : ""
                }`}
                onClick={toggleListening}
                title={
                  isListening
                    ? "Stop listening"
                    : "Voice input"
                }
              >
                {isListening ? (
                  <MicOff size={19} />
                ) : (
                  <Mic size={19} />
                )}
              </button>

              <button
                type="submit"
                className="robot-send-button"
                disabled={
                  !input.trim() || isThinking
                }
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </section>

        <aside className="robot-side-panel">
          <div className="robot-info-card">
            <div className="side-card-title">
              <Brain size={18} />
              Understanding Engine
            </div>

            <p className="side-card-description">
              EduBot changes its teaching style when it
              detects that you are confused.
            </p>

            <div className="understanding-score-card">
              <div className="score-icon">
                <Gauge size={20} />
              </div>

              <div>
                <span>Current estimate</span>

                <strong>
                  {lastUnderstanding.score !== null
                    ? `${lastUnderstanding.score}%`
                    : "—"}
                </strong>
              </div>
            </div>

            {lastUnderstanding.confusion && (
              <div className="confusion-card">
                <div className="confusion-title">
                  <Lightbulb size={15} />
                  Possible confusion
                </div>

                <p>
                  {lastUnderstanding.confusion}
                </p>
              </div>
            )}

            <div className="learning-states">
              <div>
                <CheckCircle2 size={16} />
                Concept understood
              </div>

              <div>
                <RotateCcw size={16} />
                Re-teach differently
              </div>

              <div>
                <Sparkles size={16} />
                New example
              </div>
            </div>
          </div>

          <div className="robot-info-card">
            <div className="side-card-title">
              <Volume2 size={18} />
              Voice Tutor
            </div>

            <p className="side-card-description">
              Hear EduBot explain the latest answer with
              live subtitles.
            </p>

            <button
              type="button"
              className="side-action-button"
              onClick={
                isSpeaking
                  ? stopSpeaking
                  : speakLatest
              }
              disabled={!latestAssistantMessage}
            >
              {isSpeaking ? (
                <>
                  <Pause size={16} />
                  Stop voice
                </>
              ) : (
                <>
                  <Play size={16} />
                  Listen again
                </>
              )}
            </button>
          </div>

          <div className="robot-info-card">
            <div className="side-card-title">
              <RotateCcw size={18} />
              Re-teach
            </div>

            <p className="side-card-description">
              Didn't understand the explanation? Ask
              EduBot to teach it using a completely different
              approach.
            </p>

            <button
              type="button"
              className="side-action-button primary"
              onClick={askAgain}
              disabled={
                !latestAssistantMessage || isThinking
              }
            >
              <Sparkles size={16} />
              Explain differently
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="robot-info-card mini">
            <div className="mini-feature">
              <span>AI Tutor</span>
              <strong>Groq</strong>
            </div>

            <div className="mini-feature">
              <span>Voice</span>
              <strong>Browser AI Voice</strong>
            </div>

            <div className="mini-feature">
              <span>Mode</span>
              <strong>Adaptive</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}