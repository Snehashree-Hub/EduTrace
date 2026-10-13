import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import {
  Bot,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Gamepad2,
  Glasses,
  Headphones,
  Lightbulb,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Send,
  Shirt,
  Sparkles,
  Star,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Wand2,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import { sendMessage, getEduId } from "../services/aiService";
import "./aiRobot.css";

const STORAGE = {
  PROFILE: "edutrace_robot_profile",
  PROGRESS: "edutrace_robot_progress",
  KIDS_MODE: "edutrace_robot_kids_mode",
  HISTORY: "edutrace_robot_chat",
};

const DEFAULT_PROFILE = {
  robotName: "EduBot",
  body: "violet",
  dress: "scientist",
  accessory: "none",
  voiceRate: 0.95,
};

const DEFAULT_PROGRESS = {
  xp: 0,
  streak: 0,
  completed: 0,
  difficulty: "easy",
  badges: [],
  lastActive: null,
};

const DRESS_OPTIONS = [
  {
    id: "scientist",
    name: "Scientist",
    icon: "🥼",
  },
  {
    id: "teacher",
    name: "Teacher",
    icon: "👔",
  },
  {
    id: "engineer",
    name: "Engineer",
    icon: "🦺",
  },
  {
    id: "space",
    name: "Space",
    icon: "🚀",
  },
  {
    id: "casual",
    name: "Casual",
    icon: "👕",
  },
  {
    id: "formal",
    name: "Formal",
    icon: "🎓",
  },
];

const BODY_OPTIONS = [
  {
    id: "violet",
    name: "Violet",
  },
  {
    id: "blue",
    name: "Blue",
  },
  {
    id: "pink",
    name: "Pink",
  },
  {
    id: "orange",
    name: "Orange",
  },
];

const ACCESSORY_OPTIONS = [
  {
    id: "none",
    name: "None",
    icon: "•",
  },
  {
    id: "glasses",
    name: "Glasses",
    icon: "👓",
  },
  {
    id: "headset",
    name: "Headset",
    icon: "🎧",
  },
  {
    id: "cap",
    name: "Cap",
    icon: "🧢",
  },
  {
    id: "crown",
    name: "Crown",
    icon: "👑",
  },
];

const TOPIC_LIBRARY = {
  "newton's second law": {
    type: "physics",
    visualTitle: "Force → Mass → Acceleration",
    explanation:
      "Newton's second law explains how a net force changes an object's motion. For the same mass, increasing force produces greater acceleration. For the same force, increasing mass produces smaller acceleration.",
  },

  "photosynthesis": {
    type: "biology",
    visualTitle: "Sun → Leaf → Food",
    explanation:
      "Photosynthesis is the process by which green plants use light energy to make glucose from carbon dioxide and water, releasing oxygen as a product.",
  },

  fractions: {
    type: "fractions",
    visualTitle: "A Whole Split Into Equal Parts",
    explanation:
      "A fraction represents a part of a whole. The numerator tells how many parts are selected, while the denominator tells how many equal parts make the whole.",
  },

  "python basics": {
    type: "python",
    visualTitle: "Code → Execute → Output",
    explanation:
      "Python is a programming language known for readable syntax. A Python program contains instructions that the interpreter executes to produce an output.",
  },
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors.
  }
}

function normalizeTopic(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getStudyContext(locationState) {
  const candidates = [];

  if (locationState?.studyPlanContext) {
    candidates.push(locationState.studyPlanContext);
  }

  if (locationState?.topic) {
    candidates.push({
      topic: locationState.topic,
      subject: locationState.subject,
      exam: locationState.exam,
      prepType: locationState.prepType,
    });
  }

  const storageKeys = [
    "edutrace_ai_prefill",
    "edutrace_study_plan",
    "edutrace_robot_context",
  ];

  storageKeys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) return;

      try {
        candidates.push(JSON.parse(raw));
      } catch {
        candidates.push({
          topic: raw,
        });
      }
    } catch {
      // Ignore.
    }
  });

  const source =
    candidates.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item.topic ||
          item.currentTopic ||
          item.subject ||
          item.title ||
          item.goal)
    ) || {};

  const topic =
    source.topic ||
    source.currentTopic ||
    source.topicName ||
    source.title ||
    source.subject ||
    "";

  return {
    topic: String(topic || "").trim(),
    subject: String(source.subject || "").trim(),
    exam: String(
      source.exam ||
        source.examName ||
        source.goal ||
        source.target ||
        ""
    ).trim(),
    prepType: String(source.prepType || source.category || "").trim(),
    duration: source.duration || source.days || "",
    dailyHours: source.dailyHours || source.hours || "",
    day: source.day || source.studyDay || "",
  };
}

function todayKey() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function updateLearningProgress(current, correct) {
  const today = todayKey();

  let streak = current.streak || 0;

  if (current.lastActive === today) {
    streak = current.streak || 1;
  } else if (current.lastActive === yesterdayKey()) {
    streak = (current.streak || 0) + 1;
  } else {
    streak = 1;
  }

  const xpGain = correct ? 25 : 8;

  const xp = (current.xp || 0) + xpGain;

  const badges = [...(current.badges || [])];

  const badgeRules = [
    {
      xp: 100,
      name: "First Steps",
      icon: "🌱",
    },
    {
      xp: 250,
      name: "Quick Learner",
      icon: "⚡",
    },
    {
      xp: 500,
      name: "EduBot Explorer",
      icon: "🤖",
    },
    {
      xp: 1000,
      name: "Concept Master",
      icon: "🏆",
    },
  ];

  badgeRules.forEach((badge) => {
    if (xp >= badge.xp && !badges.includes(badge.name)) {
      badges.push(badge.name);
    }
  });

  let difficulty = current.difficulty || "easy";

  if (correct) {
    if (difficulty === "easy") difficulty = "medium";
    else if (difficulty === "medium") difficulty = "hard";
  } else {
    if (difficulty === "hard") difficulty = "medium";
    else if (difficulty === "medium") difficulty = "easy";
  }

  return {
    ...current,
    xp,
    streak,
    completed: (current.completed || 0) + 1,
    difficulty,
    badges,
    lastActive: today,
  };
}

function getRobotStatusText(state) {
  if (state === "listening") return "Listening...";
  if (state === "thinking") return "Thinking...";
  if (state === "speaking") return "Explaining...";
  if (state === "happy") return "Great job!";
  if (state === "confused") return "Let's try another way.";
  return "Ready to learn";
}

function extractTopicData(topic) {
  const normalized = normalizeTopic(topic);

  if (TOPIC_LIBRARY[normalized]) {
    return TOPIC_LIBRARY[normalized];
  }

  if (normalized.includes("newton")) {
    return TOPIC_LIBRARY["newton's second law"];
  }

  if (normalized.includes("photosynthesis")) {
    return TOPIC_LIBRARY.photosynthesis;
  }

  if (normalized.includes("fraction")) {
    return TOPIC_LIBRARY.fractions;
  }

  if (
    normalized.includes("python") ||
    normalized.includes("programming")
  ) {
    return TOPIC_LIBRARY["python basics"];
  }

  return {
    type: "general",
    visualTitle: "Concept Explorer",
    explanation:
      "EduBot can explain this topic step by step using simple language, examples, important points, and practice questions.",
  };
}

function MarkdownNotes({ content }) {
  return (
    <div className="edubot-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="edubot-md-h1">{children}</h1>
          ),

          h2: ({ children }) => (
            <h2 className="edubot-md-h2">{children}</h2>
          ),

          h3: ({ children }) => (
            <h3 className="edubot-md-h3">{children}</h3>
          ),

          p: ({ children }) => (
            <p className="edubot-md-p">{children}</p>
          ),

          ul: ({ children }) => (
            <ul className="edubot-md-ul">{children}</ul>
          ),

          ol: ({ children }) => (
            <ol className="edubot-md-ol">{children}</ol>
          ),

          li: ({ children }) => (
            <li className="edubot-md-li">{children}</li>
          ),

          blockquote: ({ children }) => (
            <blockquote className="edubot-md-quote">
              {children}
            </blockquote>
          ),

          table: ({ children }) => (
            <div className="edubot-table-wrap">
              <table>{children}</table>
            </div>
          ),

          thead: ({ children }) => <thead>{children}</thead>,

          tbody: ({ children }) => <tbody>{children}</tbody>,

          tr: ({ children }) => <tr>{children}</tr>,

          th: ({ children }) => <th>{children}</th>,

          td: ({ children }) => <td>{children}</td>,

          pre: ({ children }) => (
            <pre className="edubot-code-pre">{children}</pre>
          ),

          code: ({ className, children, ...props }) => {
            const isInline =
              !className &&
              String(children).indexOf("\n") === -1;

            if (isInline) {
              return (
                <code
                  className="edubot-inline-code"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                className={`edubot-code ${className || ""}`}
                {...props}
              >
                {children}
              </code>
            );
          },

          a: ({ href, children }) => {
            const safe =
              href && /^https?:\/\//i.test(href)
                ? href
                : null;

            if (!safe) {
              return <span>{children}</span>;
            }

            return (
              <a
                href={safe}
                target="_blank"
                rel="noreferrer"
                className="edubot-md-link"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}

function RobotAvatar({
  profile,
  state,
  onCustomize,
}) {
  return (
    <button
      className={`edubot-avatar-button state-${state}`}
      onClick={onCustomize}
      title="Customize EduBot"
      type="button"
    >
      <div
        className={`edubot-avatar body-${profile.body} dress-${profile.dress}`}
      >
        <div className="edubot-antenna">
          <span />
        </div>

        <div className="edubot-head">
          <div className="edubot-ear left" />
          <div className="edubot-ear right" />

          <div className="edubot-face">
            {profile.accessory === "cap" && (
              <div className="edubot-cap">🧢</div>
            )}

            {profile.accessory === "crown" && (
              <div className="edubot-crown">👑</div>
            )}

            {profile.accessory === "glasses" && (
              <div className="edubot-glasses">
                <span />
                <span />
              </div>
            )}

            <div className="edubot-eyes">
              <span />
              <span />
            </div>

            <div className="edubot-cheeks">
              <span />
              <span />
            </div>

            <div className="edubot-mouth">
              {state === "speaking" ? "◡" : "⌣"}
            </div>
          </div>
        </div>

        <div className="edubot-neck" />

        <div className="edubot-body">
          <div className="edubot-chest-screen">
            <span>EDU</span>
          </div>

          <div className="edubot-arm left" />
          <div className="edubot-arm right" />

          <div className="edubot-dress">
            {DRESS_OPTIONS.find(
              (item) => item.id === profile.dress
            )?.icon}
          </div>
        </div>

        {profile.accessory === "headset" && (
          <div className="edubot-headset">
            <span />
          </div>
        )}
      </div>
    </button>
  );
}

function VisualLab({ topic, animate }) {
  const data = extractTopicData(topic);

  return (
    <div className={`edubot-visual-lab ${animate ? "animate" : ""}`}>
      <div className="edubot-visual-header">
        <div>
          <span className="edubot-eyebrow">
            VISUAL LAB
          </span>

          <h3>{data.visualTitle}</h3>
        </div>

        <div className="edubot-visual-icon">
          <Sparkles size={17} />
        </div>
      </div>

      {data.type === "physics" && (
        <div className="visual-physics">
          <div className="visual-sun-label">
            Same net force
          </div>

          <div className="physics-row">
            <div className="visual-box light">
              <div className="force-arrow">→→→</div>
              <strong>Light mass</strong>
              <span>Higher acceleration</span>
            </div>

            <div className="visual-box heavy">
              <div className="force-arrow">→→→</div>
              <strong>Heavy mass</strong>
              <span>Lower acceleration</span>
            </div>
          </div>

          <div className="visual-formula">
            Net Force = Mass × Acceleration
          </div>
        </div>
      )}

      {data.type === "biology" && (
        <div className="visual-photosynthesis">
          <div className="visual-sun">☀️</div>

          <div className="visual-arrow">↓</div>

          <div className="visual-leaf">🌿</div>

          <div className="visual-arrow">↓</div>

          <div className="visual-products">
            <span>🍬 Glucose</span>
            <span>💨 Oxygen</span>
          </div>
        </div>
      )}

      {data.type === "fractions" && (
        <div className="visual-fraction">
          <div className="pizza">
            <span />
            <span />
            <span />
            <span />
          </div>

          <div>
            <strong>1 / 4</strong>
            <p>One of four equal parts</p>
          </div>
        </div>
      )}

      {data.type === "python" && (
        <div className="visual-python">
          <div className="python-line">
            <span className="keyword">
              print
            </span>
            <span>(</span>
            <span className="string">
              "Hello EduBot"
            </span>
            <span>)</span>
          </div>

          <div className="python-output">
            Output → Hello EduBot
          </div>
        </div>
      )}

      {data.type === "general" && (
        <div className="visual-general">
          <div className="concept-node">
            <Brain size={25} />
            <span>Concept</span>
          </div>

          <div className="concept-line" />

          <div className="concept-node">
            <Lightbulb size={25} />
            <span>Example</span>
          </div>

          <div className="concept-line" />

          <div className="concept-node">
            <Target size={25} />
            <span>Practice</span>
          </div>
        </div>
      )}

      <p className="visual-description">
        {data.explanation}
      </p>
    </div>
  );
}

function PhysicsActivity({
  difficulty,
  onComplete,
  onHint,
}) {
  const [force, setForce] = useState(6);
  const [mass, setMass] = useState(3);
  const [pushed, setPushed] = useState(false);
  const [answered, setAnswered] = useState(null);

  const acceleration = force / mass;

  const challengeAnswer =
    acceleration >= 2 ? "high" : "low";

  function checkAnswer(value) {
    const correct = value === challengeAnswer;

    setAnswered(correct);

    onComplete(correct);
  }

  return (
    <div className="kids-activity physics-activity">
      <div className="activity-topline">
        <div>
          <span className="activity-label">
            PHYSICS GAME
          </span>

          <h3>Push the Robot Cart</h3>
        </div>

        <div className="difficulty-chip">
          {difficulty}
        </div>
      </div>

      <div className="physics-game-scene">
        <div className="game-track">
          <div
            className={`game-cart ${
              pushed ? "pushed" : ""
            }`}
          >
            🤖
          </div>

          <div className="force-label">
            {force} N →
          </div>
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span>Force</span>
          <strong>{force} N</strong>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={force}
          onChange={(event) =>
            setForce(Number(event.target.value))
          }
        />
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span>Mass</span>
          <strong>{mass} kg</strong>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={mass}
          onChange={(event) =>
            setMass(Number(event.target.value))
          }
        />
      </div>

      <div className="acceleration-card">
        <span>Current acceleration</span>
        <strong>
          {acceleration.toFixed(2)} m/s²
        </strong>
      </div>

      <button
        type="button"
        className="activity-action"
        onClick={() => setPushed((value) => !value)}
      >
        <Play size={16} />
        Push the cart
      </button>

      <div className="activity-question">
        <div className="question-icon">
          <CircleHelp size={18} />
        </div>

        <div>
          <strong>Quick challenge</strong>

          <p>
            With this force and mass, is the
            acceleration relatively high?
          </p>
        </div>
      </div>

      <div className="answer-row">
        <button
          type="button"
          className={
            answered === true
              ? "answer correct"
              : "answer"
          }
          onClick={() => checkAnswer("high")}
        >
          High
        </button>

        <button
          type="button"
          className={
            answered === false
              ? "answer wrong"
              : "answer"
          }
          onClick={() => checkAnswer("low")}
        >
          Low
        </button>
      </div>

      <button
        type="button"
        className="hint-button"
        onClick={onHint}
      >
        <Lightbulb size={15} />
        Need a hint?
      </button>
    </div>
  );
}

function McqActivity({
  topic,
  onComplete,
  onHint,
}) {
  const normalized = normalizeTopic(topic);

  let question =
    "What is the best way to learn a new concept?";

  let options = [
    "Understand it, see an example, then practise",
    "Memorise every sentence immediately",
    "Skip examples and only read definitions",
    "Avoid practice until the exam",
  ];

  let correct = 0;

  if (normalized.includes("photosynthesis")) {
    question =
      "Which input provides the main energy for photosynthesis?";

    options = [
      "Sunlight",
      "Sound",
      "Magnetism",
      "Friction",
    ];

    correct = 0;
  } else if (normalized.includes("fraction")) {
    question =
      "In the fraction 3/5, what does 5 represent?";

    options = [
      "The whole number",
      "The denominator showing equal parts",
      "The selected parts",
      "The remainder",
    ];

    correct = 1;
  } else if (
    normalized.includes("python") ||
    normalized.includes("programming")
  ) {
    question =
      "What does print() normally do in Python?";

    options = [
      "Displays output",
      "Deletes the program",
      "Creates a database",
      "Turns off the computer",
    ];

    correct = 0;
  }

  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (selected === null) return;

    setSubmitted(true);
    onComplete(selected === correct);
  }

  return (
    <div className="kids-activity mcq-activity">
      <div className="activity-topline">
        <div>
          <span className="activity-label">
            CONCEPT CHALLENGE
          </span>

          <h3>Quick Check</h3>
        </div>

        <Brain size={22} />
      </div>

      <p className="mcq-question">
        {question}
      </p>

      <div className="mcq-options">
        {options.map((option, index) => {
          const selectedClass =
            selected === index ? "selected" : "";

          const resultClass =
            submitted && index === correct
              ? "correct"
              : submitted &&
                selected === index &&
                index !== correct
              ? "wrong"
              : "";

          return (
            <button
              type="button"
              key={option}
              className={`mcq-option ${selectedClass} ${resultClass}`}
              onClick={() => {
                if (!submitted) {
                  setSelected(index);
                }
              }}
            >
              <span className="mcq-letter">
                {String.fromCharCode(65 + index)}
              </span>

              <span>{option}</span>

              {submitted && index === correct && (
                <CheckCircle2 size={17} />
              )}

              {submitted &&
                selected === index &&
                index !== correct && (
                  <XCircle size={17} />
                )}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          type="button"
          className="activity-action"
          onClick={submit}
          disabled={selected === null}
        >
          <Check size={16} />
          Check answer
        </button>
      ) : (
        <div className="activity-result">
          {selected === correct ? (
            <>
              <CheckCircle2 size={18} />
              Great! You understood the concept.
            </>
          ) : (
            <>
              <XCircle size={18} />
              That's okay. EduBot can explain it again.
            </>
          )}
        </div>
      )}

      <button
        type="button"
        className="hint-button"
        onClick={onHint}
      >
        <Lightbulb size={15} />
        Need a hint?
      </button>
    </div>
  );
}

function ConceptPuzzle({ onComplete, onHint }) {
  const [items, setItems] = useState([
    "Learn the concept",
    "See an example",
    "Try a question",
    "Check your understanding",
  ]);

  const [completed, setCompleted] = useState(false);

  function moveItem(index, direction) {
    const next = [...items];
    const target = index + direction;

    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [
      next[target],
      next[index],
    ];

    setItems(next);
  }

  function checkOrder() {
    const expected = [
      "Learn the concept",
      "See an example",
      "Try a question",
      "Check your understanding",
    ];

    const correct =
      JSON.stringify(items) ===
      JSON.stringify(expected);

    setCompleted(correct);
    onComplete(correct);
  }

  return (
    <div className="kids-activity puzzle-activity">
      <div className="activity-topline">
        <div>
          <span className="activity-label">
            LEARNING PUZZLE
          </span>

          <h3>Build the Learning Path</h3>
        </div>

        <Wand2 size={22} />
      </div>

      <p className="puzzle-description">
        Arrange the steps in the best order.
      </p>

      <div className="puzzle-list">
        {items.map((item, index) => (
          <div className="puzzle-item" key={item}>
            <div className="puzzle-number">
              {index + 1}
            </div>

            <span>{item}</span>

            <div className="puzzle-controls">
              <button
                type="button"
                onClick={() =>
                  moveItem(index, -1)
                }
                disabled={index === 0}
              >
                ↑
              </button>

              <button
                type="button"
                onClick={() =>
                  moveItem(index, 1)
                }
                disabled={index === items.length - 1}
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>

      {!completed ? (
        <button
          type="button"
          className="activity-action"
          onClick={checkOrder}
        >
          <Check size={16} />
          Check puzzle
        </button>
      ) : (
        <div className="activity-result success">
          <Trophy size={18} />
          Perfect learning sequence!
        </div>
      )}

      <button
        type="button"
        className="hint-button"
        onClick={onHint}
      >
        <Lightbulb size={15} />
        Need a hint?
      </button>
    </div>
  );
}

function AIRobot() {
  const location = useLocation();

  const [profile, setProfile] = useState(() =>
    readJson(STORAGE.PROFILE, DEFAULT_PROFILE)
  );

  const [progress, setProgress] = useState(() =>
    readJson(STORAGE.PROGRESS, DEFAULT_PROGRESS)
  );

  const [kidsMode, setKidsMode] = useState(() =>
    localStorage.getItem(STORAGE.KIDS_MODE) === "true"
  );

  const studyContext = useMemo(
    () => getStudyContext(location.state),
    [location.state]
  );

  const [messages, setMessages] = useState(() => {
    const saved = readJson(STORAGE.HISTORY, []);

    if (Array.isArray(saved) && saved.length) {
      return saved;
    }

    return [
      {
        id: "welcome",
        role: "assistant",
        content:
          "## Hi! I'm EduBot 🤖\n\nI can explain **any topic you ask me**.\n\nI can teach you with:\n\n- **Simple concept explanation**\n- **Real examples**\n- **Important points**\n- **Exam-focused questions**\n- **Step-by-step notes**\n- **Voice explanation + live subtitles**\n\nAsk me something like **\"Explain photosynthesis\"**, **\"Teach me Python loops\"**, or **\"Explain DBMS normalization\"**.",
        spoken:
          "Hi! I'm EduBot. I can explain any topic you ask me. I can teach concepts, examples, important points, and exam questions.",
      },
    ];
  });

  const [input, setInput] = useState("");
  const [robotState, setRobotState] = useState("idle");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [subtitle, setSubtitle] = useState(
    "Hi! I'm EduBot. Ask me anything."
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [visualAnimate, setVisualAnimate] = useState(true);
  const [activity, setActivity] = useState("mcq");
  const [hint, setHint] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [understandingMessage, setUnderstandingMessage] =
    useState("");
  const [sending, setSending] = useState(false);

  const speechRecognitionRef = useRef(null);
  const speechTimerRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const currentTopic =
    studyContext.topic || "Any Topic";

  const topicData = useMemo(
    () => extractTopicData(currentTopic),
    [currentTopic]
  );

  const documentId = useMemo(() => {
    return (
      localStorage.getItem(
        "edutrace_knowledge_document_id"
      ) ||
      localStorage.getItem(
        "edutrace_robot_document_id"
      ) ||
      null
    );
  }, []);

  useEffect(() => {
    saveJson(STORAGE.PROFILE, profile);
  }, [profile]);

  useEffect(() => {
    saveJson(STORAGE.PROGRESS, progress);
  }, [progress]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE.KIDS_MODE,
      String(kidsMode)
    );
  }, [kidsMode]);

  useEffect(() => {
    saveJson(STORAGE.HISTORY, messages.slice(-30));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();

      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }

      if (speechTimerRef.current) {
        clearTimeout(speechTimerRef.current);
      }
    };
  }, []);

  const speakText = useCallback(
    (text) => {
      if (!voiceEnabled) return;

      if (!("speechSynthesis" in window)) {
        return;
      }

      const cleanText = String(text || "")
        .replace(/```[\s\S]*?```/g, "")
        .replace(/[#*_>`|]/g, " ")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanText) return;

      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(cleanText);

      utterance.rate = profile.voiceRate || 0.95;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      const voices =
        window.speechSynthesis.getVoices();

      const preferred =
        voices.find((voice) =>
          /en-IN/i.test(voice.lang)
        ) ||
        voices.find((voice) =>
          /en-US/i.test(voice.lang)
        ) ||
        voices.find((voice) =>
          /^en/i.test(voice.lang)
        );

      if (preferred) {
        utterance.voice = preferred;
      }

      const sentences =
        cleanText
          .match(/[^.!?]+[.!?]+/g) || [cleanText];

      let sentenceIndex = 0;

      setRobotState("speaking");
      setSubtitle(sentences[0] || cleanText);

      utterance.onboundary = (event) => {
        if (event.name === "sentence") {
          sentenceIndex += 1;

          if (sentences[sentenceIndex]) {
            setSubtitle(sentences[sentenceIndex].trim());
          }
        }
      };

      utterance.onend = () => {
        setRobotState("idle");
        setSubtitle(
          "I'm ready for your next question."
        );
      };

      utterance.onerror = () => {
        setRobotState("idle");
      };

      window.speechSynthesis.speak(utterance);
    },
    [profile.voiceRate, voiceEnabled]
  );

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setRobotState("idle");
    setSubtitle("Voice paused.");
  }, []);

  function toggleKidsMode() {
    setKidsMode((value) => !value);
  }

  function updateProfile(key, value) {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function celebrateSuccess() {
    setCelebrate(true);

    window.setTimeout(() => {
      setCelebrate(false);
    }, 1800);
  }

  function handleActivityComplete(correct) {
    const next = updateLearningProgress(
      progress,
      correct
    );

    setProgress(next);

    if (correct) {
      setRobotState("happy");
      setSubtitle(
        "Amazing! You got it right. Keep going!"
      );
      celebrateSuccess();
    } else {
      setRobotState("confused");
      setSubtitle(
        "No problem. Let's understand it another way."
      );
    }

    setTimeout(() => {
      setRobotState("idle");
    }, 1500);
  }

  function showHint() {
    const topic = currentTopic || "this topic";

    const text =
      topicData.type === "physics"
        ? "Think about what happens when the same push acts on a smaller or larger mass."
        : topicData.type === "biology"
        ? "Think about what plants need from sunlight, air, and water."
        : topicData.type === "fractions"
        ? "Look at the bottom number first. It tells you how the whole is divided."
        : topicData.type === "python"
        ? "Think about the instruction that sends information to the screen."
        : `First identify the main idea of ${topic}, then connect it to an example.`;

    setHint(text);
    setSubtitle(text);

    if (voiceEnabled) {
      speakText(text);
    }
  }

  function buildSystemPrompt() {
    return `
You are EduBot, the interactive AI tutor inside EduTrace.

IMPORTANT:
- You can explain ANY topic the learner asks.
- Never assume the topic is Newton's laws.
- Match the learner's requested level.
- Explain clearly and naturally.
- The robot speaks your response AND the exact learning content must appear in the chat as clean study notes.

For every teaching response, structure it as:
## Concept
Give the core idea clearly.

## Simple Explanation
Explain it in easy language.

## Example
Give one useful example.

## Important Points
Give 3 to 6 concise points.

## Quick Check
Give one question if useful.

If the user asks an exam-related question, also include:
## Exam Focus
Give the important exam angle.

If the user is confused:
- Identify the likely misconception.
- Explain the idea again using a different analogy.
- Do not merely repeat the previous explanation.

Formatting rules:
- Use normal Markdown.
- Tables are allowed.
- Code blocks are allowed.
- Never generate QuickChart URLs.
- Never generate Mermaid diagrams.
- Never generate unsupported chart syntax.
- Do not output raw chart configuration.
- Do not claim that an external video was generated.
- Keep the response readable as study notes.

Current study context:
Topic: ${studyContext.topic || "Not specified"}
Subject: ${studyContext.subject || "Not specified"}
Exam/Goal: ${studyContext.exam || "Not specified"}
Preparation type: ${studyContext.prepType || "Not specified"}
Duration: ${studyContext.duration || "Not specified"}
Daily hours: ${studyContext.dailyHours || "Not specified"}
Study day: ${studyContext.day || "Not specified"}

Current learner mode:
Kids Mode: ${kidsMode ? "ON" : "OFF"}
Difficulty: ${progress.difficulty}
`;
  }

  async function sendRobotMessage(customMessage) {
    const message =
      String(customMessage || input).trim();

    if (!message || sending) return;

    setInput("");
    setSending(true);
    setRobotState("thinking");
    setSubtitle("Let me think about that...");

    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: message,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    try {
      const history = messages
        .slice(-10)
        .map((item) => ({
          role: item.role,
          content: item.content,
        }));

      const result = await sendMessage({
        message,
        usePersonalData: false,
        useRag: Boolean(documentId),
        documentId,
        history,
        eduId: getEduId(),
      });

      const answer =
        result?.response ||
        result?.answer ||
        result?.message ||
        "I couldn't generate an explanation.";

      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: answer,
        spoken: answer,
        topic: currentTopic,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      setRobotState("speaking");
      setSubtitle(
        "I'm explaining it. You can also read the notes below."
      );

      speakText(answer);
    } catch (error) {
      const fallback =
        "I couldn't connect to EduTrace AI right now. Please check whether the FastAPI backend is running.";

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          content: fallback,
          spoken: fallback,
        },
      ]);

      setRobotState("confused");
      setSubtitle(
        "I couldn't connect to the AI service."
      );
    } finally {
      setSending(false);
    }
  }

  async function handleUnderstanding(type, messageId) {
    if (type === "understood") {
      setUnderstandingMessage(
        "Great! Let's keep building your understanding."
      );

      setRobotState("happy");
      setSubtitle(
        "Great! You understood the concept."
      );

      setTimeout(() => {
        setRobotState("idle");
      }, 1200);

      return;
    }

    if (type === "confused") {
      const prompt = `
I am confused about the previous explanation.

Topic:
${currentTopic}

Please reteach it from the beginning using:
1. Very simple explanation
2. A different real-world analogy
3. One step-by-step example
4. Three important points
5. One tiny check question

Do not repeat the previous wording.
`;

      setUnderstandingMessage(
        "Okay. I'm going to explain it differently."
      );

      await sendRobotMessage(prompt);
      return;
    }

    if (type === "another") {
      const prompt = `
Explain ${currentTopic} in another way.

Use a different analogy and a different example.
Keep it concise but complete.
Make it useful as study notes.
`;

      setUnderstandingMessage(
        "Sure. Here is another explanation."
      );

      await sendRobotMessage(prompt);
    }
  }

  function startListening() {
    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!Recognition) {
      setSubtitle(
        "Voice input is not supported in this browser."
      );
      return;
    }

    if (listening) {
      speechRecognitionRef.current?.stop();
      return;
    }

    const recognition = new Recognition();

    speechRecognitionRef.current = recognition;

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setListening(true);
      setRobotState("listening");
      setSubtitle("I'm listening...");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i += 1
      ) {
        const transcript =
          event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      setInput(
        finalText || interimText
      );

      if (interimText) {
        setSubtitle(interimText);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setRobotState("idle");
      setSubtitle(
        "I couldn't hear that clearly. Try again."
      );
    };

    recognition.onend = () => {
      setListening(false);
      setRobotState("idle");
    };

    recognition.start();
  }

  function handleQuickPrompt(prompt) {
    setInput(prompt);
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  function clearChat() {
    const welcome = {
      id: `welcome-${Date.now()}`,
      role: "assistant",
      content:
        "## Fresh Learning Session 🤖\n\nAsk me any concept. I'll explain it as **notes + examples + voice + subtitles**.",
      spoken:
        "Fresh learning session. Ask me any concept and I'll explain it as notes, examples, voice, and subtitles.",
    };

    setMessages([welcome]);
    setSubtitle(
      "Fresh session. What shall we learn?"
    );
  }

  return (
    <div className="edubot-page">
      {celebrate && (
        <div className="edubot-confetti">
          {Array.from({ length: 18 }).map(
            (_, index) => (
              <span
                key={index}
                style={{
                  "--i": index,
                }}
              />
            )
          )}
        </div>
      )}

      <div className="edubot-header">
        <div className="edubot-brand">
          <div className="edubot-brand-icon">
            <Bot size={24} />
          </div>

          <div>
            <div className="edubot-brand-title">
              EduBot AI
            </div>

            <div className="edubot-brand-subtitle">
              Your interactive learning robot
            </div>
          </div>
        </div>

        <div className="edubot-header-actions">
          <div className="edubot-topic-chip">
            <BookOpen size={15} />
            <span>{currentTopic}</span>
          </div>

          <button
            type="button"
            className={`edubot-header-button ${
              kidsMode ? "active" : ""
            }`}
            onClick={toggleKidsMode}
          >
            <Gamepad2 size={16} />
            Kids Mode
            <span
              className={`toggle-dot ${
                kidsMode ? "on" : ""
              }`}
            />
          </button>

          <button
            type="button"
            className="edubot-header-button"
            onClick={() =>
              setVoiceEnabled((value) => !value)
            }
          >
            {voiceEnabled ? (
              <Volume2 size={17} />
            ) : (
              <VolumeX size={17} />
            )}
            Voice
          </button>
        </div>
      </div>

      <div className="edubot-layout">
        <main className="edubot-main">
          <section className="edubot-hero">
            <div className="edubot-robot-column">
              <RobotAvatar
                profile={profile}
                state={robotState}
                onCustomize={() =>
                  setCustomizeOpen((value) => !value)
                }
              />

              <div className="edubot-robot-name">
                {profile.robotName}
              </div>

              <div
                className={`edubot-status status-${robotState}`}
              >
                <span />
                {getRobotStatusText(robotState)}
              </div>

              <button
                type="button"
                className="customize-button"
                onClick={() =>
                  setCustomizeOpen((value) => !value)
                }
              >
                <Shirt size={16} />
                Customize Robot
              </button>
            </div>

            <div className="edubot-subtitle-area">
              <div className="subtitle-label">
                <Volume2 size={15} />
                LIVE SUBTITLES
              </div>

              <div className="edubot-subtitle">
                {subtitle}
              </div>

              <div className="subtitle-actions">
                {robotState === "speaking" && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                  >
                    <Pause size={14} />
                    Stop voice
                  </button>
                )}

                <span>
                  Robot explanation is also shown
                  below as study notes.
                </span>
              </div>
            </div>
          </section>

          {customizeOpen && (
            <section className="customizer-panel">
              <div className="customizer-heading">
                <div>
                  <span className="edubot-eyebrow">
                    ROBOT STUDIO
                  </span>
                  <h2>Make EduBot yours</h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCustomizeOpen(false)
                  }
                >
                  <X size={18} />
                </button>
              </div>

              <div className="customizer-section">
                <label>Robot body</label>

                <div className="choice-grid">
                  {BODY_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      className={
                        profile.body === option.id
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        updateProfile(
                          "body",
                          option.id
                        )
                      }
                    >
                      <span
                        className={`body-preview ${option.id}`}
                      />
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="customizer-section">
                <label>Dress</label>

                <div className="choice-grid">
                  {DRESS_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      className={
                        profile.dress === option.id
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        updateProfile(
                          "dress",
                          option.id
                        )
                      }
                    >
                      <span className="choice-emoji">
                        {option.icon}
                      </span>
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="customizer-section">
                <label>Accessory</label>

                <div className="choice-grid">
                  {ACCESSORY_OPTIONS.map(
                    (option) => (
                      <button
                        type="button"
                        key={option.id}
                        className={
                          profile.accessory ===
                          option.id
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          updateProfile(
                            "accessory",
                            option.id
                          )
                        }
                      >
                        <span className="choice-emoji">
                          {option.icon}
                        </span>
                        {option.name}
                      </button>
                    )
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="notes-section">
            <div className="section-heading">
              <div>
                <span className="edubot-eyebrow">
                  AI TEACHING NOTES
                </span>

                <h2>
                  Learn + Read + Listen
                </h2>
              </div>

              <button
                type="button"
                className="clear-chat-button"
                onClick={clearChat}
              >
                <RotateCcw size={15} />
                New session
              </button>
            </div>

            <div className="notes-card">
              <div className="notes-card-header">
                <div className="notes-title">
                  <div className="notes-title-icon">
                    <Brain size={18} />
                  </div>

                  <div>
                    <strong>
                      EduBot Explanation
                    </strong>

                    <span>
                      Everything spoken by the robot
                      is available here as notes.
                    </span>
                  </div>
                </div>

                <div className="notes-badge">
                  <Sparkles size={14} />
                  AI Notes
                </div>
              </div>

              <div className="notes-content">
                {messages.map((message) => {
                  const isAssistant =
                    message.role === "assistant";

                  return (
                    <article
                      key={message.id}
                      className={`chat-note ${
                        isAssistant
                          ? "assistant-note"
                          : "user-note"
                      }`}
                    >
                      <div className="note-avatar">
                        {isAssistant ? (
                          <Bot size={17} />
                        ) : (
                          <Star size={17} />
                        )}
                      </div>

                      <div className="note-body">
                        <div className="note-meta">
                          <strong>
                            {isAssistant
                              ? "EduBot"
                              : "You"}
                          </strong>

                          {isAssistant && (
                            <span>
                              Voice + Notes
                            </span>
                          )}
                        </div>

                        <MarkdownNotes
                          content={
                            message.content
                          }
                        />

                        {isAssistant &&
                          message.id !==
                            "welcome" &&
                          !message.id.includes(
                            "welcome"
                          ) && (
                            <div className="understanding-row">
                              <span>
                                Did you understand?
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  handleUnderstanding(
                                    "understood",
                                    message.id
                                  )
                                }
                              >
                                <CheckCircle2
                                  size={14}
                                />
                                Got it
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleUnderstanding(
                                    "another",
                                    message.id
                                  )
                                }
                              >
                                <RotateCcw
                                  size={14}
                                />
                                Another way
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleUnderstanding(
                                    "confused",
                                    message.id
                                  )
                                }
                              >
                                <CircleHelp
                                  size={14}
                                />
                                I'm confused
                              </button>
                            </div>
                          )}
                      </div>
                    </article>
                  );
                })}

                {sending && (
                  <div className="typing-note">
                    <div className="typing-avatar">
                      <Bot size={17} />
                    </div>

                    <div>
                      <strong>
                        EduBot is thinking...
                      </strong>

                      <div className="typing-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>

            {understandingMessage && (
              <div className="understanding-banner">
                <Sparkles size={16} />
                {understandingMessage}
              </div>
            )}
          </section>

          <section className="composer-card">
            <div className="quick-prompts">
              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    `Explain ${currentTopic || "this concept"} from basics`
                  )
                }
              >
                <Lightbulb size={14} />
                Explain concept
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    `Give me an example for ${currentTopic || "this topic"}`
                  )
                }
              >
                <Sparkles size={14} />
                Give example
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    `Give me important exam questions about ${currentTopic || "this topic"}`
                  )
                }
              >
                <Target size={14} />
                Exam questions
              </button>
            </div>

            <div className="composer-row">
              <button
                type="button"
                className={`mic-button ${
                  listening ? "active" : ""
                }`}
                onClick={startListening}
                title="Voice input"
              >
                {listening ? (
                  <MicOff size={19} />
                ) : (
                  <Mic size={19} />
                )}
              </button>

              <input
                ref={inputRef}
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    sendRobotMessage();
                  }
                }}
                placeholder="Ask EduBot anything..."
              />

              <button
                type="button"
                className="send-button"
                onClick={() =>
                  sendRobotMessage()
                }
                disabled={
                  !input.trim() || sending
                }
              >
                <Send size={18} />
              </button>
            </div>

            <div className="composer-footer">
              <span>
                <Zap size={13} />
                EduBot can explain any subject.
              </span>

              {documentId && (
                <span>
                  <BookOpen size={13} />
                  Knowledge Vault connected
                </span>
              )}
            </div>
          </section>
        </main>

        <aside className="edubot-side">
          <section className="progress-card">
            <div className="progress-top">
              <div>
                <span className="edubot-eyebrow">
                  LEARNING PROGRESS
                </span>
                <h3>EduBot XP</h3>
              </div>

              <div className="xp-icon">
                <Zap size={20} />
              </div>
            </div>

            <div className="xp-value">
              {progress.xp}
              <span>XP</span>
            </div>

            <div className="progress-stats">
              <div>
                <FlameIcon />
                <strong>
                  {progress.streak}
                </strong>
                <span>day streak</span>
              </div>

              <div>
                <Trophy size={17} />
                <strong>
                  {progress.completed}
                </strong>
                <span>activities</span>
              </div>

              <div>
                <Star size={17} />
                <strong>
                  {progress.badges.length}
                </strong>
                <span>badges</span>
              </div>
            </div>
          </section>

          <section className="context-card">
            <div className="side-card-heading">
              <BookOpen size={18} />
              <div>
                <strong>Study Context</strong>
                <span>
                  EduBot follows your plan
                </span>
              </div>
            </div>

            <div className="context-list">
              <div>
                <span>Topic</span>
                <strong>
                  {studyContext.topic ||
                    "Any Topic"}
                </strong>
              </div>

              <div>
                <span>Subject</span>
                <strong>
                  {studyContext.subject ||
                    "General"}
                </strong>
              </div>

              <div>
                <span>Exam / Goal</span>
                <strong>
                  {studyContext.exam ||
                    "Learning"}
                </strong>
              </div>

              <div>
                <span>Difficulty</span>
                <strong>
                  {progress.difficulty}
                </strong>
              </div>
            </div>
          </section>

          <section className="visual-card">
            <div className="side-card-heading">
              <Sparkles size={18} />
              <div>
                <strong>Visual Explanation</strong>
                <span>
                  Interactive concept view
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setVisualAnimate(
                    (value) => !value
                  )
                }
              >
                {visualAnimate ? (
                  <Pause size={14} />
                ) : (
                  <Play size={14} />
                )}
              </button>
            </div>

            <VisualLab
              topic={currentTopic}
              animate={visualAnimate}
            />
          </section>

          {kidsMode ? (
            <section className="kids-mode-card">
              <div className="kids-header">
                <div>
                  <span className="edubot-eyebrow">
                    KIDS MODE
                  </span>

                  <h3>
                    Learn by playing
                  </h3>
                </div>

                <div className="kids-badge">
                  ON
                </div>
              </div>

              <div className="activity-tabs">
                <button
                  type="button"
                  className={
                    activity === "mcq"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActivity("mcq")
                  }
                >
                  <Brain size={15} />
                  Quiz
                </button>

                {topicData.type ===
                  "physics" && (
                  <button
                    type="button"
                    className={
                      activity === "physics"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActivity("physics")
                    }
                  >
                    <Zap size={15} />
                    Physics
                  </button>
                )}

                <button
                  type="button"
                  className={
                    activity === "puzzle"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActivity("puzzle")
                  }
                >
                  <Gamepad2 size={15} />
                  Puzzle
                </button>
              </div>

              {activity === "physics" &&
              topicData.type === "physics" ? (
                <PhysicsActivity
                  difficulty={
                    progress.difficulty
                  }
                  onComplete={
                    handleActivityComplete
                  }
                  onHint={showHint}
                />
              ) : activity === "puzzle" ? (
                <ConceptPuzzle
                  onComplete={
                    handleActivityComplete
                  }
                  onHint={showHint}
                />
              ) : (
                <McqActivity
                  topic={currentTopic}
                  onComplete={
                    handleActivityComplete
                  }
                  onHint={showHint}
                />
              )}

              {hint && (
                <div className="hint-card">
                  <Lightbulb size={16} />
                  <div>
                    <strong>EduBot Hint</strong>
                    <p>{hint}</p>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="kids-off-card">
              <div className="kids-off-icon">
                <Gamepad2 size={22} />
              </div>

              <div>
                <strong>
                  Kids Mode is OFF
                </strong>

                <p>
                  Turn it on when you want games,
                  puzzles, quizzes and rewards.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleKidsMode}
              >
                Turn ON
                <ChevronRight size={15} />
              </button>
            </section>
          )}

          <section className="badge-card">
            <div className="side-card-heading">
              <Trophy size={18} />
              <div>
                <strong>Badges</strong>
                <span>
                  Your EduBot achievements
                </span>
              </div>
            </div>

            {progress.badges.length ? (
              <div className="badge-list">
                {progress.badges.map((badge) => (
                  <div
                    className="badge-item"
                    key={badge}
                  >
                    <div>🏆</div>
                    <span>{badge}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-badges">
                Complete activities to unlock
                badges.
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function FlameIcon() {
  return (
    <span className="flame-icon">
      🔥
    </span>
  );
}

export default AIRobot;
