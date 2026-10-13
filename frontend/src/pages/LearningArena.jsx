import React, { useMemo, useState } from "react";
import {
  Trophy,
  Flame,
  Zap,
  Target,
  Brain,
  Play,
  Lock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Crown,
  Star,
  Medal,
  BookOpen,
  Code2,
  Atom,
  Calculator,
  FlaskConical,
  Dna,
  Globe,
  Cpu,
  Database,
  Shield,
  BarChart3,
} from "lucide-react";

import "./learningArena.css";

const PROGRESS_KEY = "edutrace_arena_progress";

const SUBJECTS = [
  {
    id: "mathematics",
    name: "Mathematics",
    category: "Academic",
    icon: Calculator,
    description: "Numbers, algebra, geometry and problem solving.",
  },
  {
    id: "physics",
    name: "Physics",
    category: "Academic",
    icon: Atom,
    description: "Understand forces, energy, motion and matter.",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    category: "Academic",
    icon: FlaskConical,
    description: "Master atoms, reactions, bonding and compounds.",
  },
  {
    id: "biology",
    name: "Biology",
    category: "Academic",
    icon: Dna,
    description: "Explore cells, genetics, organisms and life.",
  },
  {
    id: "computer-science",
    name: "Computer Science",
    category: "Academic",
    icon: Cpu,
    description: "Algorithms, data structures and computing concepts.",
  },
  {
    id: "python",
    name: "Python",
    category: "Technology",
    icon: Code2,
    description: "Build your programming fundamentals.",
  },
  {
    id: "artificial-intelligence",
    name: "Artificial Intelligence",
    category: "Technology",
    icon: Brain,
    description: "Learn AI concepts and intelligent systems.",
  },
  {
    id: "machine-learning",
    name: "Machine Learning",
    category: "Technology",
    icon: Database,
    description: "Models, training, prediction and evaluation.",
  },
  {
    id: "data-science",
    name: "Data Science",
    category: "Technology",
    icon: BarChart3,
    description: "Discover data analysis and insights.",
  },
  {
    id: "web-development",
    name: "Web Development",
    category: "Technology",
    icon: Globe,
    description: "HTML, CSS, JavaScript and modern web concepts.",
  },
  {
    id: "general-studies",
    name: "General Studies",
    category: "Competitive",
    icon: BookOpen,
    description: "Build broad knowledge for competitive exams.",
  },
  {
    id: "indian-polity",
    name: "Indian Polity",
    category: "Competitive",
    icon: Shield,
    description: "Constitution, Parliament and governance.",
  },
  {
    id: "aptitude",
    name: "Aptitude",
    category: "Competitive",
    icon: Target,
    description: "Sharpen numerical and logical reasoning.",
  },
];

const QUESTIONS = {
  mathematics: [
    {
      question: "What is the value of 12 × 8?",
      options: ["86", "96", "108", "112"],
      answer: 1,
      explanation:
        "12 × 8 = 96.",
      difficulty: "Easy",
    },
    {
      question: "If x + 7 = 15, what is x?",
      options: ["6", "7", "8", "9"],
      answer: 2,
      explanation:
        "Subtract 7 from both sides: x = 15 − 7 = 8.",
      difficulty: "Easy",
    },
    {
      question: "What is the area of a rectangle with length 8 cm and width 5 cm?",
      options: ["13 cm²", "26 cm²", "40 cm²", "80 cm²"],
      answer: 2,
      explanation:
        "Area = length × width = 8 × 5 = 40 cm².",
      difficulty: "Easy",
    },
    {
      question: "What is 25% of 200?",
      options: ["25", "40", "50", "75"],
      answer: 2,
      explanation:
        "25% = 25/100, so 25% of 200 = 50.",
      difficulty: "Medium",
    },
    {
      question: "What is the next number in the sequence 2, 4, 8, 16, ...?",
      options: ["20", "24", "30", "32"],
      answer: 3,
      explanation:
        "Each number is multiplied by 2, so the next number is 32.",
      difficulty: "Medium",
    },
  ],

  physics: [
    {
      question: "What is the SI unit of force?",
      options: ["Joule", "Newton", "Watt", "Pascal"],
      answer: 1,
      explanation:
        "Force is measured in newtons (N).",
      difficulty: "Easy",
    },
    {
      question: "Which quantity is measured in metres per second?",
      options: ["Force", "Energy", "Speed", "Power"],
      answer: 2,
      explanation:
        "Speed is commonly measured in metres per second (m/s).",
      difficulty: "Easy",
    },
    {
      question: "Which law explains action and reaction forces?",
      options: [
        "Newton's First Law",
        "Newton's Second Law",
        "Newton's Third Law",
        "Law of Gravitation",
      ],
      answer: 2,
      explanation:
        "Newton's Third Law states that forces occur in equal and opposite pairs.",
      difficulty: "Medium",
    },
    {
      question: "What happens to an object's kinetic energy when its speed increases?",
      options: [
        "It decreases",
        "It increases",
        "It becomes zero",
        "It remains unchanged",
      ],
      answer: 1,
      explanation:
        "Kinetic energy depends on the square of velocity, so it increases as speed increases.",
      difficulty: "Medium",
    },
    {
      question: "Which form of energy is stored in a stretched spring?",
      options: [
        "Chemical energy",
        "Elastic potential energy",
        "Nuclear energy",
        "Sound energy",
      ],
      answer: 1,
      explanation:
        "A stretched spring stores elastic potential energy.",
      difficulty: "Easy",
    },
  ],

  chemistry: [
    {
      question: "What is the smallest unit of an element that retains its chemical identity?",
      options: ["Cell", "Atom", "Molecule", "Compound"],
      answer: 1,
      explanation:
        "An atom is the smallest unit of an element that retains its chemical identity.",
      difficulty: "Easy",
    },
    {
      question: "What is the chemical symbol for oxygen?",
      options: ["Ox", "O", "Og", "On"],
      answer: 1,
      explanation:
        "The chemical symbol for oxygen is O.",
      difficulty: "Easy",
    },
    {
      question: "A solution with pH 7 at standard conditions is generally described as:",
      options: ["Acidic", "Basic", "Neutral", "Strongly acidic"],
      answer: 2,
      explanation:
        "A pH of 7 is commonly treated as neutral at standard conditions.",
      difficulty: "Easy",
    },
    {
      question: "Which particle has a negative electric charge?",
      options: ["Proton", "Neutron", "Electron", "Nucleus"],
      answer: 2,
      explanation:
        "Electrons carry negative electric charge.",
      difficulty: "Easy",
    },
    {
      question: "What type of bond involves sharing electron pairs between atoms?",
      options: [
        "Ionic bond",
        "Covalent bond",
        "Metallic bond",
        "Hydrogen bond",
      ],
      answer: 1,
      explanation:
        "Covalent bonds involve shared electron pairs between atoms.",
      difficulty: "Medium",
    },
  ],

  biology: [
    {
      question: "What is the basic structural and functional unit of life?",
      options: ["Atom", "Tissue", "Cell", "Organ"],
      answer: 2,
      explanation:
        "The cell is the basic structural and functional unit of life.",
      difficulty: "Easy",
    },
    {
      question: "Which organelle is primarily associated with cellular energy production?",
      options: ["Ribosome", "Mitochondrion", "Nucleus", "Golgi apparatus"],
      answer: 1,
      explanation:
        "Mitochondria are major sites of ATP production in eukaryotic cells.",
      difficulty: "Easy",
    },
    {
      question: "Which molecule carries genetic information in most organisms?",
      options: ["ATP", "DNA", "Glucose", "Lipase"],
      answer: 1,
      explanation:
        "DNA stores genetic information in most organisms.",
      difficulty: "Easy",
    },
    {
      question: "Photosynthesis primarily converts light energy into:",
      options: [
        "Stored chemical energy",
        "Sound energy",
        "Mechanical energy",
        "Nuclear energy",
      ],
      answer: 0,
      explanation:
        "Photosynthesis converts light energy into chemical energy stored in organic molecules.",
      difficulty: "Medium",
    },
    {
      question: "Which blood cells help defend the body against pathogens?",
      options: [
        "Red blood cells",
        "White blood cells",
        "Platelets",
        "Plasma cells only",
      ],
      answer: 1,
      explanation:
        "White blood cells are central to immune defense against pathogens.",
      difficulty: "Easy",
    },
  ],

  "computer-science": [
    {
      question: "What does CPU stand for?",
      options: [
        "Central Processing Unit",
        "Computer Primary Unit",
        "Central Program Utility",
        "Core Processing User",
      ],
      answer: 0,
      explanation:
        "CPU stands for Central Processing Unit.",
      difficulty: "Easy",
    },
    {
      question: "Which data structure follows LIFO?",
      options: ["Queue", "Stack", "Array", "Graph"],
      answer: 1,
      explanation:
        "A stack follows Last In, First Out (LIFO).",
      difficulty: "Easy",
    },
    {
      question: "Which data structure generally follows FIFO?",
      options: ["Stack", "Tree", "Queue", "Heap"],
      answer: 2,
      explanation:
        "A queue follows First In, First Out (FIFO).",
      difficulty: "Easy",
    },
    {
      question: "Which is a valid example of an operating system?",
      options: ["Python", "Linux", "HTML", "SQL"],
      answer: 1,
      explanation:
        "Linux is an operating system.",
      difficulty: "Easy",
    },
    {
      question: "What is an algorithm?",
      options: [
        "A programming language",
        "A step-by-step procedure for solving a problem",
        "A computer component",
        "A database table",
      ],
      answer: 1,
      explanation:
        "An algorithm is a finite, structured procedure for solving a problem.",
      difficulty: "Medium",
    },
  ],

  python: [
    {
      question: "Which symbol starts a comment in Python?",
      options: ["//", "#", "/*", "--"],
      answer: 1,
      explanation:
        "Python uses # for single-line comments.",
      difficulty: "Easy",
    },
    {
      question: "Which data type stores True or False?",
      options: ["str", "int", "bool", "list"],
      answer: 2,
      explanation:
        "The bool type represents True and False values.",
      difficulty: "Easy",
    },
    {
      question: "Which keyword defines a function in Python?",
      options: ["function", "func", "def", "define"],
      answer: 2,
      explanation:
        "Python uses the def keyword to define a function.",
      difficulty: "Easy",
    },
    {
      question: "Which collection is ordered and mutable?",
      options: ["Tuple", "Set", "List", "Frozen set"],
      answer: 2,
      explanation:
        "A Python list is ordered and mutable.",
      difficulty: "Medium",
    },
    {
      question: "What does len([10, 20, 30]) return?",
      options: ["2", "3", "30", "60"],
      answer: 1,
      explanation:
        "The list contains three elements, so len() returns 3.",
      difficulty: "Easy",
    },
  ],

  "artificial-intelligence": [
    {
      question: "What is AI primarily concerned with?",
      options: [
        "Only storing files",
        "Building systems that perform tasks associated with intelligence",
        "Only designing websites",
        "Only creating databases",
      ],
      answer: 1,
      explanation:
        "AI focuses on systems capable of performing tasks that commonly require aspects of human intelligence.",
      difficulty: "Easy",
    },
    {
      question: "Which is an example of an AI application?",
      options: [
        "Recommendation systems",
        "A simple light bulb",
        "A paper notebook",
        "A wooden table",
      ],
      answer: 0,
      explanation:
        "Recommendation systems are a common application of AI and machine learning.",
      difficulty: "Easy",
    },
    {
      question: "What is NLP?",
      options: [
        "Network Logic Protocol",
        "Natural Language Processing",
        "Numerical Learning Program",
        "Neural Logic Processor",
      ],
      answer: 1,
      explanation:
        "NLP stands for Natural Language Processing.",
      difficulty: "Easy",
    },
    {
      question: "Which technique allows a system to improve from examples?",
      options: [
        "Machine learning",
        "Manual printing",
        "File compression",
        "Screen resolution",
      ],
      answer: 0,
      explanation:
        "Machine learning uses data and examples to learn patterns for tasks.",
      difficulty: "Medium",
    },
    {
      question: "What does a chatbot primarily process when responding to text questions?",
      options: [
        "Only images",
        "Natural language input",
        "Only keyboard hardware",
        "Only electricity",
      ],
      answer: 1,
      explanation:
        "Text-based chatbots process natural language input to generate responses.",
      difficulty: "Easy",
    },
  ],

  "machine-learning": [
    {
      question: "What is supervised learning based on?",
      options: [
        "Labeled training data",
        "Only random numbers",
        "No data",
        "Only hardware signals",
      ],
      answer: 0,
      explanation:
        "Supervised learning learns from examples where target labels are provided.",
      difficulty: "Easy",
    },
    {
      question: "Which task predicts a continuous numerical value?",
      options: ["Classification", "Regression", "Clustering", "Tokenization"],
      answer: 1,
      explanation:
        "Regression predicts continuous numerical outputs.",
      difficulty: "Easy",
    },
    {
      question: "What is overfitting?",
      options: [
        "A model performs well on training data but poorly on unseen data",
        "A model has no parameters",
        "A model never trains",
        "A model only uses test data",
      ],
      answer: 0,
      explanation:
        "Overfitting occurs when a model captures training-specific patterns and generalizes poorly.",
      difficulty: "Medium",
    },
    {
      question: "What is the purpose of a test set?",
      options: [
        "To evaluate generalization on unseen data",
        "To replace the training set",
        "To delete the model",
        "To create labels manually",
      ],
      answer: 0,
      explanation:
        "A test set provides unseen examples for evaluating model performance.",
      difficulty: "Medium",
    },
    {
      question: "Which task groups similar unlabeled data points?",
      options: ["Regression", "Classification", "Clustering", "Compilation"],
      answer: 2,
      explanation:
        "Clustering groups data points based on similarity without requiring target labels.",
      difficulty: "Medium",
    },
  ],

  "data-science": [
    {
      question: "What is the main purpose of data visualization?",
      options: [
        "To hide data",
        "To communicate patterns and insights visually",
        "To delete missing values",
        "To replace databases",
      ],
      answer: 1,
      explanation:
        "Visualization helps people understand patterns, relationships and trends in data.",
      difficulty: "Easy",
    },
    {
      question: "What is a dataset?",
      options: [
        "A collection of related data",
        "Only a programming language",
        "A computer processor",
        "A web browser",
      ],
      answer: 0,
      explanation:
        "A dataset is an organized collection of related observations or records.",
      difficulty: "Easy",
    },
    {
      question: "Which measure represents the middle value after sorting observations?",
      options: ["Mean", "Median", "Range", "Variance"],
      answer: 1,
      explanation:
        "The median is the middle value in an ordered dataset, subject to the usual even/odd rules.",
      difficulty: "Easy",
    },
    {
      question: "Which Python library is widely used for tabular data manipulation?",
      options: ["Pandas", "Flask", "Pygame", "Tkinter"],
      answer: 0,
      explanation:
        "Pandas provides DataFrame and Series structures for data manipulation.",
      difficulty: "Easy",
    },
    {
      question: "What does EDA commonly stand for?",
      options: [
        "External Data Architecture",
        "Exploratory Data Analysis",
        "Electronic Data Access",
        "Estimated Dataset Algorithm",
      ],
      answer: 1,
      explanation:
        "EDA stands for Exploratory Data Analysis.",
      difficulty: "Medium",
    },
  ],

  "web-development": [
    {
      question: "What does HTML primarily define?",
      options: [
        "Page structure and content",
        "Database indexes",
        "Machine learning models",
        "Operating system drivers",
      ],
      answer: 0,
      explanation:
        "HTML structures the content of web pages.",
      difficulty: "Easy",
    },
    {
      question: "What is CSS mainly used for?",
      options: [
        "Styling web pages",
        "Creating databases",
        "Compiling Python",
        "Managing operating systems",
      ],
      answer: 0,
      explanation:
        "CSS controls presentation and visual styling.",
      difficulty: "Easy",
    },
    {
      question: "Which language adds behavior and interactivity to web pages?",
      options: ["HTML", "CSS", "JavaScript", "SQL"],
      answer: 2,
      explanation:
        "JavaScript is commonly used to add interactive behavior to web pages.",
      difficulty: "Easy",
    },
    {
      question: "What does HTTP commonly provide?",
      options: [
        "A protocol for web communication",
        "A graphics card",
        "A database engine",
        "A programming language",
      ],
      answer: 0,
      explanation:
        "HTTP is an application-layer protocol used for communication on the web.",
      difficulty: "Medium",
    },
    {
      question: "What does responsive web design aim to achieve?",
      options: [
        "Adapt layouts to different screen sizes",
        "Remove all CSS",
        "Use only desktop screens",
        "Disable mobile browsers",
      ],
      answer: 0,
      explanation:
        "Responsive design adapts layouts and interfaces to different viewport sizes.",
      difficulty: "Easy",
    },
  ],

  "general-studies": [
    {
      question: "What is the capital of India?",
      options: ["Mumbai", "New Delhi", "Chennai", "Kolkata"],
      answer: 1,
      explanation:
        "New Delhi is the capital of India.",
      difficulty: "Easy",
    },
    {
      question: "Which branch of government generally interprets laws?",
      options: ["Legislature", "Executive", "Judiciary", "Election Commission"],
      answer: 2,
      explanation:
        "The judiciary interprets and applies laws.",
      difficulty: "Easy",
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Mercury"],
      answer: 1,
      explanation:
        "Mars is commonly called the Red Planet because of its reddish appearance.",
      difficulty: "Easy",
    },
    {
      question: "Which ocean is the largest?",
      options: [
        "Atlantic Ocean",
        "Indian Ocean",
        "Pacific Ocean",
        "Arctic Ocean",
      ],
      answer: 2,
      explanation:
        "The Pacific Ocean is the largest ocean on Earth.",
      difficulty: "Easy",
    },
    {
      question: "What is the currency of Japan?",
      options: ["Won", "Yuan", "Yen", "Ringgit"],
      answer: 2,
      explanation:
        "Japan uses the yen.",
      difficulty: "Easy",
    },
  ],

  "indian-polity": [
    {
      question: "What is the supreme law of India?",
      options: [
        "Parliamentary Rules",
        "The Constitution of India",
        "The Indian Penal Code",
        "Cabinet Rules",
      ],
      answer: 1,
      explanation:
        "The Constitution of India is the supreme legal framework of the country.",
      difficulty: "Easy",
    },
    {
      question: "Which body is the lower house of India's Parliament?",
      options: ["Rajya Sabha", "Lok Sabha", "Supreme Court", "NITI Aayog"],
      answer: 1,
      explanation:
        "Lok Sabha is the lower house of Parliament.",
      difficulty: "Easy",
    },
    {
      question: "Fundamental Rights are primarily contained in which part of the Constitution?",
      options: ["Part I", "Part II", "Part III", "Part IV"],
      answer: 2,
      explanation:
        "Fundamental Rights are contained in Part III.",
      difficulty: "Medium",
    },
    {
      question: "Who is the constitutional head of the Union Executive?",
      options: [
        "Prime Minister",
        "President",
        "Chief Justice",
        "Speaker of Lok Sabha",
      ],
      answer: 1,
      explanation:
        "The President is the constitutional head of the Union Executive.",
      difficulty: "Medium",
    },
    {
      question: "Which institution is the highest court in India?",
      options: [
        "High Court",
        "District Court",
        "Supreme Court",
        "Tribunal",
      ],
      answer: 2,
      explanation:
        "The Supreme Court is India's highest court.",
      difficulty: "Easy",
    },
  ],

  aptitude: [
    {
      question: "If a train travels 60 km in 1 hour, what is its speed?",
      options: ["30 km/h", "40 km/h", "60 km/h", "120 km/h"],
      answer: 2,
      explanation:
        "Speed = distance ÷ time = 60 km ÷ 1 h = 60 km/h.",
      difficulty: "Easy",
    },
    {
      question: "What is 15% of 200?",
      options: ["15", "20", "30", "40"],
      answer: 2,
      explanation:
        "15% of 200 = 30.",
      difficulty: "Easy",
    },
    {
      question: "If 5 workers complete a task in 10 days at the same rate, how many worker-days are required?",
      options: ["15", "25", "50", "100"],
      answer: 2,
      explanation:
        "5 workers × 10 days = 50 worker-days.",
      difficulty: "Medium",
    },
    {
      question: "What is the average of 10, 20 and 30?",
      options: ["15", "20", "25", "30"],
      answer: 1,
      explanation:
        "(10 + 20 + 30) ÷ 3 = 20.",
      difficulty: "Easy",
    },
    {
      question: "A number increased by 20% becomes 120. What was the original number?",
      options: ["90", "100", "110", "115"],
      answer: 1,
      explanation:
        "120 represents 120% of the original, so the original is 120 ÷ 1.2 = 100.",
      difficulty: "Medium",
    },
  ],
};

const LEVELS = [
  {
    id: 1,
    name: "Starter",
    requiredXP: 0,
    color: "violet",
  },
  {
    id: 2,
    name: "Explorer",
    requiredXP: 150,
    color: "blue",
  },
  {
    id: 3,
    name: "Challenger",
    requiredXP: 350,
    color: "cyan",
  },
  {
    id: 4,
    name: "Achiever",
    requiredXP: 650,
    color: "purple",
  },
  {
    id: 5,
    name: "Master",
    requiredXP: 1000,
    color: "gold",
  },
];

const DEFAULT_PROGRESS = {
  xp: 0,
  answered: 0,
  correct: 0,
  wrong: 0,
  completedChallenges: 0,
  streak: 0,
  lastPlayed: null,
  subjectProgress: {},
  badges: [],
};

function readProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);

    if (!raw) {
      return DEFAULT_PROGRESS;
    }

    return {
      ...DEFAULT_PROGRESS,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify(progress)
    );
  } catch {
    // Ignore localStorage failures.
  }
}

function getCurrentLevel(xp) {
  let current = LEVELS[0];

  LEVELS.forEach((level) => {
    if (xp >= level.requiredXP) {
      current = level;
    }
  });

  return current;
}

function getNextLevel(xp) {
  return (
    LEVELS.find((level) => level.requiredXP > xp) ||
    null
  );
}

function getXPProgress(xp) {
  const current = getCurrentLevel(xp);
  const next = getNextLevel(xp);

  if (!next) {
    return 100;
  }

  const range =
    next.requiredXP - current.requiredXP;

  const progress =
    ((xp - current.requiredXP) / range) * 100;

  return Math.min(100, Math.max(0, progress));
}

function getBadgeForProgress(progress) {
  const badges = [];

  if (progress.answered >= 1) {
    badges.push("first-challenge");
  }

  if (progress.correct >= 5) {
    badges.push("quick-learner");
  }

  if (progress.correct >= 15) {
    badges.push("knowledge-builder");
  }

  if (progress.completedChallenges >= 5) {
    badges.push("arena-warrior");
  }

  if (progress.xp >= 500) {
    badges.push("xp-hunter");
  }

  return badges;
}

export default function LearningArena() {
  const [progress, setProgress] = useState(readProgress);

  const [selectedSubject, setSelectedSubject] =
    useState(null);

  const [difficulty, setDifficulty] =
    useState("All");

  const [screen, setScreen] = useState("home");

  const [questionIndex, setQuestionIndex] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState(null);

  const [answered, setAnswered] = useState(false);

  const [sessionQuestions, setSessionQuestions] =
    useState([]);

  const [sessionScore, setSessionScore] =
    useState(0);

  const [sessionXP, setSessionXP] =
    useState(0);

  const [category, setCategory] =
    useState("All");

  const currentLevel = getCurrentLevel(progress.xp);
  const nextLevel = getNextLevel(progress.xp);

  const xpProgress = getXPProgress(progress.xp);

  const categories = [
    "All",
    "Academic",
    "Technology",
    "Competitive",
  ];

  const filteredSubjects = useMemo(() => {
    if (category === "All") {
      return SUBJECTS;
    }

    return SUBJECTS.filter(
      (subject) => subject.category === category
    );
  }, [category]);

  const currentQuestion =
    sessionQuestions[questionIndex];

  const selectedSubjectData = SUBJECTS.find(
    (subject) => subject.id === selectedSubject
  );

  const startChallenge = (subjectId) => {
    const subjectQuestions =
      QUESTIONS[subjectId] ||
      QUESTIONS["general-studies"];

    let filtered = [...subjectQuestions];

    if (difficulty !== "All") {
      const matching = filtered.filter(
        (question) =>
          question.difficulty === difficulty
      );

      if (matching.length > 0) {
        filtered = matching;
      }
    }

    const shuffled = [...filtered].sort(
      () => Math.random() - 0.5
    );

    const selected = shuffled.slice(0, 5);

    setSelectedSubject(subjectId);
    setSessionQuestions(selected);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setSessionScore(0);
    setSessionXP(0);
    setScreen("challenge");
  };

  const selectAnswer = (index) => {
    if (answered) return;

    setSelectedAnswer(index);
    setAnswered(true);

    const isCorrect =
      index === currentQuestion.answer;

    const earnedXP = isCorrect ? 20 : 5;

    setSessionXP((value) => value + earnedXP);

    if (isCorrect) {
      setSessionScore((value) => value + 1);
    }

    const updated = {
      ...progress,
      xp: progress.xp + earnedXP,
      answered: progress.answered + 1,
      correct:
        progress.correct + (isCorrect ? 1 : 0),
      wrong:
        progress.wrong + (isCorrect ? 0 : 1),
      subjectProgress: {
        ...progress.subjectProgress,
        [selectedSubject]:
          (progress.subjectProgress?.[selectedSubject] ||
            0) + (isCorrect ? 20 : 5),
      },
    };

    const badges = getBadgeForProgress(updated);

    updated.badges = [
      ...new Set([
        ...(updated.badges || []),
        ...badges,
      ]),
    ];

    setProgress(updated);
    saveProgress(updated);
  };

  const nextQuestion = () => {
    if (
      questionIndex <
      sessionQuestions.length - 1
    ) {
      setQuestionIndex((value) => value + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      return;
    }

    const updated = {
      ...progress,
      completedChallenges:
        progress.completedChallenges + 1,
      lastPlayed: new Date().toISOString(),
    };

    setProgress(updated);
    saveProgress(updated);

    setScreen("result");
  };

  const restartChallenge = () => {
    if (!selectedSubject) return;

    startChallenge(selectedSubject);
  };

  const goHome = () => {
    setScreen("home");
    setSelectedAnswer(null);
    setAnswered(false);
  };

  const renderAnswerClass = (index) => {
    if (!answered) {
      return "";
    }

    if (index === currentQuestion.answer) {
      return "arena-option correct";
    }

    if (
      index === selectedAnswer &&
      index !== currentQuestion.answer
    ) {
      return "arena-option wrong";
    }

    return "arena-option disabled";
  };

  return (
    <div className="arena-page">
      <div className="arena-glow arena-glow-one" />
      <div className="arena-glow arena-glow-two" />

      <div className="arena-container">
        {screen === "home" && (
          <>
            <header className="arena-header">
              <div>
                <div className="arena-eyebrow">
                  <Sparkles size={15} />
                  LEARNING ARENA
                </div>

                <h1>
                  Learn.
                  <span> Play.</span>
                  <br />
                  Level Up.
                </h1>

                <p>
                  Turn your learning journey into an
                  interactive challenge. Answer questions,
                  earn XP and unlock new levels.
                </p>
              </div>

              <div className="arena-level-card">
                <div className="arena-level-icon">
                  <Crown size={22} />
                </div>

                <div>
                  <span>Current Level</span>
                  <strong>
                    {currentLevel.name}
                  </strong>
                  <small>
                    Level {currentLevel.id}
                  </small>
                </div>
              </div>
            </header>

            <section className="arena-stats">
              <div className="arena-stat">
                <div className="arena-stat-icon xp">
                  <Zap size={19} />
                </div>

                <div>
                  <span>Total XP</span>
                  <strong>
                    {progress.xp.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="arena-stat">
                <div className="arena-stat-icon streak">
                  <Flame size={19} />
                </div>

                <div>
                  <span>Streak</span>
                  <strong>
                    {progress.streak} days
                  </strong>
                </div>
              </div>

              <div className="arena-stat">
                <div className="arena-stat-icon challenge">
                  <Target size={19} />
                </div>

                <div>
                  <span>Challenges</span>
                  <strong>
                    {progress.completedChallenges}
                  </strong>
                </div>
              </div>

              <div className="arena-stat">
                <div className="arena-stat-icon correct">
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <span>Correct</span>
                  <strong>
                    {progress.correct}
                  </strong>
                </div>
              </div>
            </section>

            <section className="arena-progress-card">
              <div className="arena-progress-header">
                <div>
                  <span>LEVEL PROGRESS</span>
                  <strong>
                    Level {currentLevel.id} ·{" "}
                    {currentLevel.name}
                  </strong>
                </div>

                <div className="arena-xp-value">
                  {progress.xp} XP
                </div>
              </div>

              <div className="arena-progress-track">
                <div
                  className="arena-progress-fill"
                  style={{
                    width: `${xpProgress}%`,
                  }}
                />
              </div>

              <div className="arena-progress-footer">
                <span>
                  {nextLevel
                    ? `${Math.max(
                        0,
                        nextLevel.requiredXP -
                          progress.xp
                      )} XP to ${nextLevel.name}`
                    : "Maximum level reached"}
                </span>

                <span>
                  {Math.round(xpProgress)}%
                </span>
              </div>
            </section>

            <section className="daily-challenge">
              <div className="daily-content">
                <div className="daily-icon">
                  <Trophy size={26} />
                </div>

                <div>
                  <span className="daily-label">
                    DAILY CHALLENGE
                  </span>

                  <h2>
                    Test your knowledge today
                  </h2>

                  <p>
                    Complete a challenge and earn XP
                    toward your next level.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  startChallenge("general-studies")
                }
              >
                <Play size={17} />
                Start Challenge
              </button>
            </section>

            <section className="arena-selection">
              <div className="arena-section-header">
                <div>
                  <span className="arena-section-label">
                    CHOOSE YOUR ARENA
                  </span>

                  <h2>Select a subject</h2>

                  <p>
                    Pick a topic and challenge yourself.
                  </p>
                </div>

                <div className="category-tabs">
                  {categories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={
                        category === item
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setCategory(item)
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="difficulty-row">
                <span>Difficulty:</span>

                {["All", "Easy", "Medium"].map(
                  (item) => (
                    <button
                      type="button"
                      key={item}
                      className={
                        difficulty === item
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setDifficulty(item)
                      }
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <div className="subject-grid">
                {filteredSubjects.map((subject) => {
                  const Icon = subject.icon;

                  const subjectXP =
                    progress.subjectProgress?.[
                      subject.id
                    ] || 0;

                  const subjectProgress =
                    Math.min(
                      100,
                      subjectXP
                    );

                  return (
                    <button
                      type="button"
                      className="subject-card"
                      key={subject.id}
                      onClick={() =>
                        startChallenge(subject.id)
                      }
                    >
                      <div className="subject-icon">
                        <Icon size={22} />
                      </div>

                      <div className="subject-card-body">
                        <div className="subject-title">
                          <strong>
                            {subject.name}
                          </strong>

                          <ChevronRight size={17} />
                        </div>

                        <span>
                          {subject.description}
                        </span>

                        <div className="subject-progress">
                          <div>
                            <div
                              className="subject-progress-fill"
                              style={{
                                width: `${subjectProgress}%`,
                              }}
                            />
                          </div>

                          <small>
                            {subjectXP} XP
                          </small>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="badges-section">
              <div className="arena-section-header">
                <div>
                  <span className="arena-section-label">
                    ACHIEVEMENTS
                  </span>

                  <h2>Arena badges</h2>
                </div>

                <Medal size={22} />
              </div>

              <div className="badge-grid">
                <div
                  className={`arena-badge ${
                    progress.badges.includes(
                      "first-challenge"
                    )
                      ? "unlocked"
                      : ""
                  }`}
                >
                  <div>
                    {progress.badges.includes(
                      "first-challenge"
                    ) ? (
                      <CheckCircle2 />
                    ) : (
                      <Lock />
                    )}
                  </div>

                  <strong>First Challenge</strong>

                  <span>
                    Complete your first challenge
                  </span>
                </div>

                <div
                  className={`arena-badge ${
                    progress.badges.includes(
                      "quick-learner"
                    )
                      ? "unlocked"
                      : ""
                  }`}
                >
                  <div>
                    {progress.badges.includes(
                      "quick-learner"
                    ) ? (
                      <CheckCircle2 />
                    ) : (
                      <Lock />
                    )}
                  </div>

                  <strong>Quick Learner</strong>

                  <span>
                    Answer 5 questions correctly
                  </span>
                </div>

                <div
                  className={`arena-badge ${
                    progress.badges.includes(
                      "knowledge-builder"
                    )
                      ? "unlocked"
                      : ""
                  }`}
                >
                  <div>
                    {progress.badges.includes(
                      "knowledge-builder"
                    ) ? (
                      <CheckCircle2 />
                    ) : (
                      <Lock />
                    )}
                  </div>

                  <strong>Knowledge Builder</strong>

                  <span>
                    Get 15 correct answers
                  </span>
                </div>

                <div
                  className={`arena-badge ${
                    progress.badges.includes(
                      "arena-warrior"
                    )
                      ? "unlocked"
                      : ""
                  }`}
                >
                  <div>
                    {progress.badges.includes(
                      "arena-warrior"
                    ) ? (
                      <CheckCircle2 />
                    ) : (
                      <Lock />
                    )}
                  </div>

                  <strong>Arena Warrior</strong>

                  <span>
                    Complete 5 challenges
                  </span>
                </div>
              </div>
            </section>
          </>
        )}

        {screen === "challenge" &&
          currentQuestion && (
            <section className="challenge-screen">
              <div className="challenge-topbar">
                <button
                  type="button"
                  onClick={goHome}
                  className="back-button"
                >
                  <ChevronRight
                    size={17}
                    style={{
                      transform: "rotate(180deg)",
                    }}
                  />
                  Exit
                </button>

                <div className="challenge-title">
                  <span>
                    {selectedSubjectData?.name}
                  </span>

                  <strong>
                    Challenge {questionIndex + 1} /{" "}
                    {sessionQuestions.length}
                  </strong>
                </div>

                <div className="challenge-xp">
                  <Zap size={16} />
                  +{sessionXP} XP
                </div>
              </div>

              <div className="challenge-progress">
                <div
                  style={{
                    width: `${
                      ((questionIndex + 1) /
                        sessionQuestions.length) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div className="challenge-card">
                <div className="question-meta">
                  <span>
                    {currentQuestion.difficulty}
                  </span>

                  <span>
                    +20 XP
                  </span>
                </div>

                <div className="question-icon">
                  <Brain size={28} />
                </div>

                <h1>
                  {currentQuestion.question}
                </h1>

                <div className="answer-grid">
                  {currentQuestion.options.map(
                    (option, index) => (
                      <button
                        type="button"
                        key={option}
                        className={renderAnswerClass(
                          index
                        )}
                        onClick={() =>
                          selectAnswer(index)
                        }
                        disabled={answered}
                      >
                        <span className="option-letter">
                          {String.fromCharCode(
                            65 + index
                          )}
                        </span>

                        <span>
                          {option}
                        </span>

                        {answered &&
                          index ===
                            currentQuestion.answer && (
                            <CheckCircle2
                              className="answer-result-icon"
                              size={19}
                            />
                          )}

                        {answered &&
                          index ===
                            selectedAnswer &&
                          index !==
                            currentQuestion.answer && (
                            <XCircle
                              className="answer-result-icon"
                              size={19}
                            />
                          )}
                      </button>
                    )
                  )}
                </div>

                {answered && (
                  <div
                    className={`answer-feedback ${
                      selectedAnswer ===
                      currentQuestion.answer
                        ? "correct"
                        : "wrong"
                    }`}
                  >
                    <div>
                      {selectedAnswer ===
                      currentQuestion.answer ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <XCircle size={20} />
                      )}
                    </div>

                    <div>
                      <strong>
                        {selectedAnswer ===
                        currentQuestion.answer
                          ? "Excellent! +20 XP"
                          : "Not quite. +5 XP"}
                      </strong>

                      <p>
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                )}

                <div className="challenge-footer">
                  <span>
                    {answered
                      ? "Answer submitted"
                      : "Choose the best answer"}
                  </span>

                  {answered && (
                    <button
                      type="button"
                      className="next-question-button"
                      onClick={nextQuestion}
                    >
                      {questionIndex ===
                      sessionQuestions.length - 1
                        ? "Finish Challenge"
                        : "Next Question"}

                      <ChevronRight size={17} />
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

        {screen === "result" && (
          <section className="result-screen">
            <div className="result-card">
              <div className="result-trophy">
                <Trophy size={40} />
              </div>

              <span className="arena-section-label">
                CHALLENGE COMPLETE
              </span>

              <h1>
                {sessionScore ===
                sessionQuestions.length
                  ? "Perfect Run!"
                  : "Great Work!"}
              </h1>

              <p>
                You completed the{" "}
                {selectedSubjectData?.name} challenge.
              </p>

              <div className="result-score">
                <strong>
                  {sessionScore}
                </strong>

                <span>
                  / {sessionQuestions.length}
                </span>
              </div>

              <div className="result-stats">
                <div>
                  <Zap size={18} />
                  <strong>
                    +{sessionXP} XP
                  </strong>
                  <span>Earned</span>
                </div>

                <div>
                  <CheckCircle2 size={18} />
                  <strong>
                    {sessionScore}
                  </strong>
                  <span>Correct</span>
                </div>

                <div>
                  <Star size={18} />
                  <strong>
                    {Math.round(
                      (sessionScore /
                        sessionQuestions.length) *
                        100
                    )}
                    %
                  </strong>
                  <span>Accuracy</span>
                </div>
              </div>

              <div className="result-actions">
                <button
                  type="button"
                  className="secondary-result-button"
                  onClick={goHome}
                >
                  Choose Another
                </button>

                <button
                  type="button"
                  className="primary-result-button"
                  onClick={restartChallenge}
                >
                  <RotateCcw size={17} />
                  Try Again
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}