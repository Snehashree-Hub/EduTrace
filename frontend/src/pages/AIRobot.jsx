import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Brain,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  Send,
  Settings2,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";

import { sendMessage, getEduId } from "../services/aiService";
import "./aiRobot.css";

/* =========================================================
   CONSTANTS
========================================================= */

const STORAGE_CHAT = "edutrace_ai_robot_chat";
const STORAGE_PROFILE = "edutrace_ai_robot_profile";
const STORAGE_MASCOT = "edutrace_ai_robot_mascot";

const DEFAULT_PROFILE = {
  name: "Learner",
  subject: "General",
  personality: "Friendly Mentor",
  level: "Beginner",
};

const PERSONALITIES = [
  {
    id: "mentor",
    name: "Friendly Mentor",
    description: "Patient and simple explanations",
  },
  {
    id: "exam",
    name: "Exam Coach",
    description: "Focused on exams and important points",
  },
  {
    id: "fun",
    name: "Fun Tutor",
    description: "Interactive and example-based learning",
  },
  {
    id: "interview",
    name: "Interview Coach",
    description: "Interview and placement preparation",
  },
];

const SUBJECTS = [
  "General",
  "Python",
  "Mathematics",
  "Physics",
  "Data Science",
  "AI / ML",
  "Computer Science",
  "Interview",
];

const MASCOTS = [
  {
    id: 1,
    name: "EduBot",
    role: "Friendly AI Teacher",
    emoji: "🤖",
    description: "Friendly white and blue AI robot",
  },
  {
    id: 2,
    name: "BookBot",
    role: "Study Mentor",
    emoji: "📚",
    description: "Cute robot reading an open book",
  },
  {
    id: 3,
    name: "CodeFox",
    role: "Coding Teacher",
    emoji: "🦊",
    description: "Fox with glasses and laptop",
  },
  {
    id: 4,
    name: "StudyPenguin",
    role: "Study Buddy",
    emoji: "🐧",
    description: "Happy penguin with books",
  },
  {
    id: 5,
    name: "FutureBot",
    role: "Technology Teacher",
    emoji: "🤖",
    description: "Futuristic robot teacher",
  },
  {
    id: 6,
    name: "PandaTutor",
    role: "Friendly Tutor",
    emoji: "🐼",
    description: "Cute panda holding a tablet",
  },
  {
    id: 7,
    name: "TechStudent",
    role: "Learning Partner",
    emoji: "👩‍💻",
    description: "Student with headphones",
  },
  {
    id: 8,
    name: "HeartBot",
    role: "Motivation Coach",
    emoji: "💙",
    description: "Robot with a glowing heart",
  },
  {
    id: 9,
    name: "ProfessorOwl",
    role: "Wise Professor",
    emoji: "🦉",
    description: "Wise owl professor",
  },
  {
    id: 10,
    name: "ThumbsBot",
    role: "Confidence Coach",
    emoji: "👍",
    description: "Robot giving a thumbs up",
  },
  {
    id: 11,
    name: "LionLearner",
    role: "Brave Learner",
    emoji: "🦁",
    description: "Lion student with backpack",
  },
  {
    id: 12,
    name: "RocketBot",
    role: "Space Teacher",
    emoji: "🚀",
    description: "Flying AI robot",
  },
  {
    id: 13,
    name: "CatTutor",
    role: "Quiet Study Buddy",
    emoji: "🐱",
    description: "Cat with headphones",
  },
  {
    id: 14,
    name: "ArtistBot",
    role: "Creative Teacher",
    emoji: "🎨",
    description: "Creative robot artist",
  },
  {
    id: 15,
    name: "PeaceBot",
    role: "Modern AI Mentor",
    emoji: "✌️",
    description: "Purple-blue futuristic robot",
  },
];

const QUICK_PROMPTS = [
  "Explain this concept in simple words",
  "Give me a practical example",
  "Teach me step by step",
  "What are the important exam points?",
  "Give me a quick test",
  "Explain this like I am a beginner",
];

/* =========================================================
   SAFE HELPERS
========================================================= */

const normalizeAIResponse = (value) => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value == null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeAIResponse(item))
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "object") {
    const preferredKeys = [
      "reply",
      "response",
      "message",
      "content",
      "text",
      "answer",
    ];

    for (const key of preferredKeys) {
      if (value[key] != null) {
        const normalized = normalizeAIResponse(value[key]);

        if (normalized) {
          return normalized;
        }
      }
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const removeVisualCommand = (text) => {
  const cleanText = normalizeAIResponse(text);

  const visualMatches = [
    ...cleanText.matchAll(
      /(?:VISUAL|IMAGE|VISUAL SEARCH)\s*:\s*(.+?)(?=\n|$)/gi
    ),
  ];

  const visualQueries = visualMatches
    .map((match) => match[1]?.trim())
    .filter(Boolean);

  const spokenText = cleanText
    .replace(
      /(?:VISUAL|IMAGE|VISUAL SEARCH)\s*:\s*(.+?)(?=\n|$)/gi,
      ""
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    text: spokenText,
    visualQueries,
  };
};

const getInitialChat = () => {
  try {
    const saved = localStorage.getItem(STORAGE_CHAT);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((message) => ({
        ...message,
        content: normalizeAIResponse(message?.content),
      }))
      .filter((message) => message.content);
  } catch {
    return [];
  }
};

const getInitialProfile = () => {
  try {
    const saved = localStorage.getItem(STORAGE_PROFILE);

    if (!saved) {
      return DEFAULT_PROFILE;
    }

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_PROFILE,
      ...(parsed || {}),
    };
  } catch {
    return DEFAULT_PROFILE;
  }
};

const getInitialMascot = () => {
  try {
    const saved = localStorage.getItem(STORAGE_MASCOT);

    if (!saved) {
      return 1;
    }

    const id = Number(saved);

    return MASCOTS.some((mascot) => mascot.id === id) ? id : 1;
  } catch {
    return 1;
  }
};

const makeMessage = (role, content, extra = {}) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content: normalizeAIResponse(content),
  timestamp: new Date().toISOString(),
  ...extra,
});

/* =========================================================
   COMPONENT
========================================================= */

export default function AIRobot() {
  /* -------------------------------------------------------
     CHAT
  ------------------------------------------------------- */

  const [messages, setMessages] = useState(getInitialChat);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  /* -------------------------------------------------------
     PROFILE
  ------------------------------------------------------- */

  const [profile, setProfile] = useState(getInitialProfile);

  /* -------------------------------------------------------
     ROBOT
  ------------------------------------------------------- */

  const [selectedMascotId, setSelectedMascotId] =
    useState(getInitialMascot);

  const [robotMenuOpen, setRobotMenuOpen] = useState(false);

  /* -------------------------------------------------------
     VOICE
  ------------------------------------------------------- */

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [subtitle, setSubtitle] = useState("");

  const [speechRate, setSpeechRate] = useState(0.86);

  const speechQueueRef = useRef([]);
  const speechIndexRef = useRef(0);

  /* -------------------------------------------------------
     VOICE INPUT
  ------------------------------------------------------- */

  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResult, setQuizResult] = useState("");

  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(1);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  /* -------------------------------------------------------
     SELECTED MASCOT
  ------------------------------------------------------- */

  const selectedMascot = useMemo(() => {
    return (
      MASCOTS.find((mascot) => mascot.id === selectedMascotId) ||
      MASCOTS[0]
    );
  }, [selectedMascotId]);

  /* =========================================================
     EFFECTS
  ========================================================= */

  useEffect(() => {
    localStorage.setItem(STORAGE_CHAT, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_MASCOT, String(selectedMascotId));
  }, [selectedMascotId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      stopSpeaking();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  /* =========================================================
     SPEECH SYNTHESIS
  ========================================================= */

  const splitForSpeech = (text) => {
    const clean = normalizeAIResponse(text)
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[*_#>`]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean) {
      return [];
    }

    const sentences = clean
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    return sentences.length ? sentences : [clean];
  };

  const speakNextSentence = () => {
    if (!voiceEnabled) {
      setIsSpeaking(false);
      setIsPaused(false);
      setSubtitle("");
      return;
    }

    const queue = speechQueueRef.current;
    const index = speechIndexRef.current;

    if (!queue || index >= queue.length) {
      setIsSpeaking(false);
      setIsPaused(false);
      setSubtitle("");
      speechQueueRef.current = [];
      speechIndexRef.current = 0;
      return;
    }

    const sentence = queue[index];

    if (!sentence) {
      speechIndexRef.current += 1;
      speakNextSentence();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);

    utterance.rate = speechRate;
    utterance.pitch = 1.02;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();

    const preferredVoice =
      voices.find((voice) =>
        /Google US English|Microsoft Zira|Microsoft David|English/i.test(
          voice.name
        )
      ) || voices.find((voice) => /^en/i.test(voice.lang));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    setSubtitle(sentence);
    setIsSpeaking(true);
    setIsPaused(false);

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setSubtitle(sentence);
    };

    utterance.onend = () => {
      speechIndexRef.current += 1;

      window.setTimeout(() => {
        speakNextSentence();
      }, 100);
    };

    utterance.onerror = () => {
      speechIndexRef.current += 1;

      window.setTimeout(() => {
        speakNextSentence();
      }, 100);
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakText = (text) => {
    if (!voiceEnabled) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      return;
    }

    const cleanText = normalizeAIResponse(text);

    if (!cleanText) {
      return;
    }

    window.speechSynthesis.cancel();

    const queue = splitForSpeech(cleanText);

    speechQueueRef.current = queue;
    speechIndexRef.current = 0;

    setIsSpeaking(true);
    setIsPaused(false);

    window.setTimeout(() => {
      speakNextSentence();
    }, 80);
  };

  function stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    speechQueueRef.current = [];
    speechIndexRef.current = 0;

    setIsSpeaking(false);
    setIsPaused(false);
    setSubtitle("");
  }

  const pauseSpeaking = () => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    if (!isSpeaking) {
      return;
    }

    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeSpeaking = () => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stopSpeaking();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
    }
  };

  /* =========================================================
     VOICE INPUT
  ========================================================= */

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }

      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
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

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  /* =========================================================
     AI REQUEST
  ========================================================= */

  const buildAIContext = () => {
    const recentMessages = messages.slice(-8);

    return {
      edu_id: getEduId?.() || "EDU1001",
      eduId: getEduId?.() || "EDU1001",

      subject: profile.subject,
      personality: profile.personality,
      level: profile.level,

      mascot: selectedMascot.name,

      mode: "EduBot Teacher",

      recent_messages: recentMessages.map((message) => ({
        role: message.role,
        content: normalizeAIResponse(message.content),
      })),

      instructions: `
You are EduBot, the personal AI teacher inside EduTrace.

Your job is to TEACH, not just answer.

When a learner asks a question:
1. Understand what they are asking.
2. Start with a very simple introduction.
3. Explain the concept clearly.
4. Use simple language.
5. Give a practical or real-world example.
6. If useful, explain step by step.
7. Give important points.
8. Mention exam/interview relevance when appropriate.
9. End with a short quick-check question when useful.

Do not unnecessarily repeat the learner's question.

For technical concepts, include examples.

For programming questions, explain the idea before code.

For mathematical problems, show the reasoning step by step.

For exam preparation, clearly identify important points.

If a visual would help, add exactly one line:
VISUAL: <short Google Images search query>

Do not put VISUAL inside the main explanation.

Do not claim to know personal data unless it is provided in the context.
`,
    };
  };

  const extractResponseFromBackend = (result) => {
    if (typeof result === "string") {
      return result;
    }

    if (!result) {
      return "";
    }

    if (result.data != null) {
      const nested = normalizeAIResponse(result.data);

      if (nested) {
        return nested;
      }
    }

    return normalizeAIResponse(result);
  };

  const sendChat = async (overrideText = null) => {
    const text = normalizeAIResponse(
      overrideText !== null ? overrideText : input
    );

    if (!text || loading) {
      return;
    }

    stopSpeaking();

    const userMessage = makeMessage(
      "user",
      text
    );

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setInput("");
    setLoading(true);

    try {
      const context = buildAIContext();

      const payload = {
        message: text,

        edu_id:
          context?.edu_id ||
          context?.eduId ||
          getEduId?.() ||
          "EDU1001",

        subject:
          context?.subject ||
          profile.subject ||
          "General",

        personality:
          context?.personality ||
          profile.personality ||
          "Friendly Mentor",

        level:
          context?.level ||
          profile.level ||
          "Beginner",

        mascot:
          context?.mascot ||
          selectedMascot?.name ||
          "EduBot",

        mode:
          context?.mode ||
          "EduBot Teacher",

        history:
          context?.recent_messages ||
          messages.slice(-8).map((item) => ({
            role: item.role,
            content: normalizeAIResponse(
              item.content
            ),
          })),

        recent_messages:
          context?.recent_messages || [],

        instructions:
          context?.instructions || "",
      };

      console.log(
        "========================================"
      );

      console.log(
        "AIRobot sending request..."
      );

      console.log(
        "Payload:",
        payload
      );

      console.log(
        "========================================"
      );

      const result = await sendMessage(payload);

      console.log(
        "AIRobot received result:",
        result
      );

      const rawResponse =
        extractResponseFromBackend(result);

      const parsedResponse =
        removeVisualCommand(rawResponse);

      const finalResponse =
        parsedResponse.text ||
        "I received your question, but I could not generate a response.";

      const assistantMessage =
        makeMessage(
          "assistant",
          finalResponse,
          {
            visualQueries:
              parsedResponse.visualQueries,
          }
        );

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

      setXp(
        (previous) => previous + 10
      );

      if (voiceEnabled) {
        speakText(finalResponse);
      }

    } catch (error) {

      console.error(
        "========================================"
      );

      console.error(
        "EDUBOT AI ERROR"
      );

      console.error(
        error
      );

      console.error(
        "========================================"
      );

      const errorMessage =
        error?.message ||
        "Something went wrong while connecting to EduBot.";

      const assistantMessage =
        makeMessage(
          "assistant",
          `I couldn't connect to the AI service right now.\n\n**Error:** ${errorMessage}`
        );

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

    } finally {
      setLoading(false);
    }
  };
  /* =========================================================
     QUICK PROMPTS
  ========================================================= */

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  /* =========================================================
     KEYBOARD
  ========================================================= */

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  };

  /* =========================================================
     NEW CHAT
  ========================================================= */

  const startNewChat = () => {
    stopSpeaking();

    setMessages([]);
    setInput("");
    setXp(0);
    setQuizResult("");
    setQuizAnswer("");

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  /* =========================================================
     VISUAL SEARCH
  ========================================================= */

  const openVisualSearch = (query) => {
    const encoded = encodeURIComponent(query);

    window.open(
      `https://www.google.com/search?tbm=isch&q=${encoded}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* =========================================================
     QUIZ
  ========================================================= */

  const runQuickQuiz = () => {
    setShowQuiz(true);
    setQuizAnswer("");
    setQuizResult("");
    stopSpeaking();
  };

  const checkQuiz = () => {
    const answer = quizAnswer.trim().toLowerCase();

    if (!answer) {
      return;
    }

    const positiveAnswers = [
      "yes",
      "y",
      "true",
      "correct",
      "option a",
      "a",
    ];

    if (positiveAnswers.includes(answer)) {
      setQuizResult(
        "Great job! You are ready to move to the next step."
      );
      setXp((previous) => previous + 20);
    } else {
      setQuizResult(
        "Good attempt. Think about the concept once more and try again."
      );
    }
  };

  /* =========================================================
     ROBOT CLASS
  ========================================================= */

  const robotClassName = [
    "ai-robot-character",
    isSpeaking ? "speaking" : "",
    isSpeaking ? "is-speaking" : "",
    isSpeaking ? "talking" : "",
  ]
    .filter(Boolean)
    .join(" ");

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="ai-robot-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="ai-robot-header">
        <div className="ai-robot-header-left">
          <div className="ai-robot-logo">
            <div className="ai-robot-logo-icon">
              <Bot size={24} />
            </div>

            <div>
              <h1>EduBot</h1>
              <p>Personal AI Teacher</p>
            </div>
          </div>
        </div>

        <div className="ai-robot-header-right">
          <div className="ai-robot-stat">
            <Zap size={16} />
            <span>{xp} XP</span>
          </div>

          <div className="ai-robot-stat">
            <Sparkles size={16} />
            <span>{streak} Day Streak</span>
          </div>

          <button
            className="ai-robot-tool-btn"
            onClick={startNewChat}
            title="Start a new chat"
          >
            <RotateCcw size={17} />
            New Chat
          </button>

          <button
            className={`ai-robot-tool-btn ${
              settingsOpen ? "active" : ""
            }`}
            onClick={() => setSettingsOpen((previous) => !previous)}
            title="Settings"
          >
            <Settings2 size={17} />
          </button>
        </div>
      </header>

      {/* =====================================================
          SETTINGS
      ====================================================== */}

      {settingsOpen && (
        <section className="ai-robot-settings-panel">
          <div className="ai-robot-settings-title">
            <div>
              <h3>EduBot Settings</h3>
              <p>Customize your learning experience</p>
            </div>

            <button
              className="ai-robot-popup-close"
              onClick={() => setSettingsOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="ai-robot-settings-grid">
            <label>
              <span>Teaching style</span>

              <select
                value={profile.personality}
                onChange={(event) =>
                  setProfile((previous) => ({
                    ...previous,
                    personality: event.target.value,
                  }))
                }
              >
                {PERSONALITIES.map((personality) => (
                  <option
                    key={personality.id}
                    value={personality.name}
                  >
                    {personality.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Subject</span>

              <select
                value={profile.subject}
                onChange={(event) =>
                  setProfile((previous) => ({
                    ...previous,
                    subject: event.target.value,
                  }))
                }
              >
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Learning level</span>

              <select
                value={profile.level}
                onChange={(event) =>
                  setProfile((previous) => ({
                    ...previous,
                    level: event.target.value,
                  }))
                }
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>

            <label>
              <span>Voice speed: {speechRate.toFixed(2)}</span>

              <input
                type="range"
                min="0.65"
                max="1.15"
                step="0.01"
                value={speechRate}
                onChange={(event) =>
                  setSpeechRate(Number(event.target.value))
                }
              />
            </label>
          </div>
        </section>
      )}

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="ai-robot-main">
        {/* ===================================================
            LEFT / ROBOT
        ==================================================== */}

        <section className="ai-robot-left-column">
          <div className="ai-robot-stage">
            <div className="ai-robot-stage-top">
              <div>
                <span className="ai-robot-online-dot"></span>

                <span>
                  {isSpeaking
                    ? "EduBot is teaching..."
                    : loading
                    ? "Thinking..."
                    : "EduBot is ready"}
                </span>
              </div>

              <div className="ai-robot-stage-subject">
                {profile.subject}
              </div>
            </div>

            {/* Robot */}
            <div className="ai-robot-display">
              <div className="ai-robot-aura"></div>

              <div className={robotClassName}>
                {/* ANTENNA */}
                <div className="ai-robot-antenna">
                  <div className="ai-robot-antenna-ball"></div>
                </div>

                {/* HEAD */}
                <div className="ai-robot-head">
                  <div className="ai-robot-ear left"></div>
                  <div className="ai-robot-ear right"></div>

                  <div className="ai-robot-face">
                    <div className="ai-robot-eyes">
                      <span className="ai-robot-eye left"></span>
                      <span className="ai-robot-eye right"></span>
                    </div>

                    <div className="ai-robot-mouth">
                      <span></span>
                    </div>
                  </div>
                </div>

                {/* BODY */}
                <div className="ai-robot-body">
                  <div className="ai-robot-chest">
                    <Brain size={32} />

                    <span>AI</span>
                  </div>

                  <div className="ai-robot-body-light"></div>
                </div>

                {/* LEFT ARM */}
                <div className="ai-robot-arm left">
                  <div className="ai-robot-hand">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>

                {/* RIGHT ARM */}
                <div className="ai-robot-arm right">
                  <div className="ai-robot-hand">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>

                {/* FEET */}
                <div className="ai-robot-feet">
                  <div className="ai-robot-foot left"></div>
                  <div className="ai-robot-foot right"></div>
                </div>
              </div>
            </div>

            {/* Mascot identity */}
            <div className="ai-robot-selected-mascot">
              <div className="ai-robot-selected-mascot-icon">
                {selectedMascot.emoji}
              </div>

              <div>
                <strong>{selectedMascot.name}</strong>
                <span>{selectedMascot.role}</span>
              </div>
            </div>

            {/* SUBTITLE */}
            <div
              className={`ai-robot-subtitle ${
                subtitle ? "visible" : ""
              }`}
            >
              {subtitle || "Ask EduBot anything..."}
            </div>

            {/* VOICE CONTROLS */}
            <div className="ai-robot-voice-controls">
              <button
                className={`ai-robot-voice-btn ${
                  voiceEnabled ? "active" : ""
                }`}
                onClick={toggleVoice}
                title={
                  voiceEnabled
                    ? "Turn voice off"
                    : "Turn voice on"
                }
              >
                {voiceEnabled ? (
                  <Volume2 size={18} />
                ) : (
                  <VolumeX size={18} />
                )}

                <span>
                  {voiceEnabled ? "Voice On" : "Voice Off"}
                </span>
              </button>

              {isSpeaking && !isPaused && (
                <button
                  className="ai-robot-voice-btn"
                  onClick={pauseSpeaking}
                  title="Pause speech"
                >
                  <Pause size={18} />
                  <span>Pause</span>
                </button>
              )}

              {isSpeaking && isPaused && (
                <button
                  className="ai-robot-voice-btn"
                  onClick={resumeSpeaking}
                  title="Resume speech"
                >
                  <Play size={18} />
                  <span>Resume</span>
                </button>
              )}

              <button
                className="ai-robot-voice-btn stop"
                onClick={stopSpeaking}
                title="Stop speech"
              >
                <Square size={16} />
                <span>Stop</span>
              </button>
            </div>

            {/* ROBOT BUTTON */}
            <div className="ai-robot-character-tools">
              <button
                className={`ai-robot-tool-btn ${
                  robotMenuOpen ? "active" : ""
                }`}
                onClick={() =>
                  setRobotMenuOpen((previous) => !previous)
                }
              >
                <Bot size={17} />
                Robot
                <ChevronDown size={15} />
              </button>

              <button
                className="ai-robot-tool-btn"
                onClick={runQuickQuiz}
              >
                <CircleHelp size={17} />
                Quick Check
              </button>
            </div>

            {/* MASCOT POPUP */}
            {robotMenuOpen && (
              <div className="ai-robot-mascot-popup">
                <div className="ai-robot-mascot-popup-header">
                  <div>
                    <h3>Choose your EduBot</h3>
                    <p>Select a teaching character</p>
                  </div>

                  <button
                    className="ai-robot-popup-close"
                    onClick={() => setRobotMenuOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="ai-robot-mascot-grid">
                  {MASCOTS.map((mascot) => (
                    <button
                      key={mascot.id}
                      className={`ai-robot-mascot-choice ${
                        selectedMascotId === mascot.id
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedMascotId(mascot.id);
                        setRobotMenuOpen(false);
                      }}
                    >
                      <div className="ai-robot-mascot-choice-image">
                        {mascot.emoji}
                      </div>

                      <div>
                        <strong>{mascot.name}</strong>
                        <span>{mascot.role}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              TEACHING MODE
          ================================================== */}

          <div className="ai-robot-teaching-card">
            <div className="ai-robot-card-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <h3>{profile.personality}</h3>

              <p>
                EduBot will explain concepts using simple
                explanations, examples, important points and
                quick checks.
              </p>
            </div>
          </div>

          {/* =================================================
              QUICK PROMPTS
          ================================================== */}

          <div className="ai-robot-quick-section">
            <div className="ai-robot-section-heading">
              <Sparkles size={17} />
              <span>Quick Learning Prompts</span>
            </div>

            <div className="ai-robot-quick-grid">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================
            RIGHT / CHAT
        ==================================================== */}

        <section className="ai-robot-chat-panel">
          <div className="ai-robot-chat-header">
            <div>
              <div className="ai-robot-chat-title">
                <div className="ai-robot-chat-title-icon">
                  <Headphones size={20} />
                </div>

                <div>
                  <h2>Talk with EduBot</h2>
                  <p>
                    Ask questions and learn interactively
                  </p>
                </div>
              </div>
            </div>

            <div className="ai-robot-chat-status">
              <span></span>
              AI Ready
            </div>
          </div>

          {/* CHAT */}
          <div className="ai-robot-chat-messages">
            {messages.length === 0 && (
              <div className="ai-robot-empty-state">
                <div className="ai-robot-empty-icon">
                  <Bot size={42} />
                </div>

                <h3>Hi! I’m {selectedMascot.name}</h3>

                <p>
                  I’m your EduTrace AI teacher. Ask me about
                  concepts, coding, mathematics, exams,
                  interviews or anything you want to learn.
                </p>

                <div className="ai-robot-empty-features">
                  <div>
                    <BookOpen size={16} />
                    Concept Explanation
                  </div>

                  <div>
                    <Sparkles size={16} />
                    Practical Examples
                  </div>

                  <div>
                    <CheckCircle2 size={16} />
                    Quick Checks
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`ai-robot-message-row ${
                    isUser ? "user" : "assistant"
                  }`}
                >
                  {!isUser && (
                    <div className="ai-robot-message-avatar">
                      {selectedMascot.emoji}
                    </div>
                  )}

                  <div className="ai-robot-message">
                    <div className="ai-robot-message-meta">
                      <span>
                        {isUser
                          ? "You"
                          : selectedMascot.name}
                      </span>

                      <time>
                        {new Date(
                          message.timestamp
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>

                    <div className="ai-robot-message-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                      >
                        {normalizeAIResponse(
                          message.content
                        )}
                      </ReactMarkdown>
                    </div>

                    {!isUser &&
                      Array.isArray(
                        message.visualQueries
                      ) &&
                      message.visualQueries.length > 0 && (
                        <div className="ai-robot-visual-card">
                          <div className="ai-robot-visual-card-title">
                            <Sparkles size={17} />
                            <span>Visual Learning</span>
                          </div>

                          {message.visualQueries.map(
                            (query, index) => (
                              <button
                                key={`${query}-${index}`}
                                onClick={() =>
                                  openVisualSearch(query)
                                }
                              >
                                Search visuals for “{query}”
                              </button>
                            )
                          )}
                        </div>
                      )}

                    {!isUser && (
                      <div className="ai-robot-message-actions">
                        <button
                          onClick={() =>
                            speakText(message.content)
                          }
                          title="Speak this answer"
                        >
                          <Volume2 size={15} />
                          Listen
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard
                              ?.writeText(
                                normalizeAIResponse(
                                  message.content
                                )
                              )
                              .catch(() => {});
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="ai-robot-message-row assistant">
                <div className="ai-robot-message-avatar">
                  {selectedMascot.emoji}
                </div>

                <div className="ai-robot-message typing">
                  <div className="ai-robot-message-meta">
                    <span>{selectedMascot.name}</span>
                  </div>

                  <div className="ai-robot-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  <p>EduBot is thinking...</p>
                </div>
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          {/* INPUT AREA */}
          <div className="ai-robot-chat-input-area">
            <div className="ai-robot-input-wrapper">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask EduBot anything..."
                rows={2}
                disabled={loading}
              />

              <div className="ai-robot-input-actions">
                <button
                  className={`ai-robot-input-action ${
                    listening ? "active" : ""
                  }`}
                  onClick={startListening}
                  title={
                    listening
                      ? "Stop listening"
                      : "Speak your question"
                  }
                  type="button"
                >
                  <Headphones size={18} />
                </button>

                <span>
                  Press Enter to send
                </span>
              </div>
            </div>

            <button
              className="ai-robot-send-btn"
              onClick={() => sendChat()}
              disabled={!input.trim() || loading}
              type="button"
            >
              <Send size={19} />
              Send
            </button>
          </div>

          <div className="ai-robot-chat-footer">
            <div>
              <Brain size={15} />
              EduTrace AI Workspace
            </div>

            <div>
              <Clock3 size={15} />
              Teacher mode
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================
          QUIZ MODAL
      ====================================================== */}

      {showQuiz && (
        <div
          className="ai-robot-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowQuiz(false);
            }
          }}
        >
          <div className="ai-robot-modal">
            <div className="ai-robot-modal-header">
              <div>
                <span className="ai-robot-modal-kicker">
                  QUICK CHECK
                </span>

                <h2>Test your understanding</h2>

                <p>
                  Answer with A, Yes, True, or your own short
                  answer.
                </p>
              </div>

              <button
                className="ai-robot-popup-close"
                onClick={() => setShowQuiz(false)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="ai-robot-quiz-question">
              <div className="ai-robot-quiz-number">
                01
              </div>

              <div>
                <h3>
                  Can you explain the main idea of the topic
                  you are currently studying in one sentence?
                </h3>

                <p>
                  Try answering without looking back at the
                  explanation.
                </p>
              </div>
            </div>

            <textarea
              value={quizAnswer}
              onChange={(event) =>
                setQuizAnswer(event.target.value)
              }
              placeholder="Type your answer..."
              rows={4}
            />

            {quizResult && (
              <div className="ai-robot-quiz-result">
                <CheckCircle2 size={18} />
                <span>{quizResult}</span>
              </div>
            )}

            <div className="ai-robot-modal-actions">
              <button
                className="ai-robot-secondary-btn"
                onClick={() => setShowQuiz(false)}
              >
                Close
              </button>

              <button
                className="ai-robot-primary-btn"
                onClick={checkQuiz}
              >
                <CheckCircle2 size={17} />
                Check Answer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
