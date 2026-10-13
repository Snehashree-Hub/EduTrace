import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import "./studyPlan.css";

const STORAGE_KEY = "edutrace_ai_prefill";

const PREPARATION_TYPES = [
  "Government Exams",
  "Entrance Exams",
  "School Exams",
  "College Exams",
  "Competitive Exams",
  "Skill / Career Learning",
  "Custom Preparation",
];

const FOCUS_DATA = {
  "Government Exams": {
    exams: [
      "TNPSC",
      "UPSC",
      "SSC",
      "Banking",
      "Railway",
      "Defence Exams",
      "Other Government Exams",
    ],
    subjects: {
      TNPSC: [
        "General Studies",
        "General Tamil",
        "General English",
        "Aptitude & Mental Ability",
      ],
      UPSC: [
        "History",
        "Geography",
        "Polity",
        "Economy",
        "Environment",
        "Science & Technology",
        "Current Affairs",
      ],
      SSC: [
        "Quantitative Aptitude",
        "Reasoning",
        "English",
        "General Awareness",
      ],
      Banking: [
        "Quantitative Aptitude",
        "Reasoning",
        "English",
        "General Awareness",
        "Banking Awareness",
      ],
      Railway: [
        "Mathematics",
        "Reasoning",
        "General Science",
        "General Awareness",
      ],
      "Defence Exams": [
        "Mathematics",
        "English",
        "General Knowledge",
        "Reasoning",
        "Science",
      ],
      "Other Government Exams": [
        "General Studies",
        "Aptitude",
        "Reasoning",
        "English",
        "Current Affairs",
      ],
    },
  },

  "Entrance Exams": {
    exams: [
      "JEE Main",
      "JEE Advanced",
      "NEET",
      "CUET",
      "Other Entrance Exam",
    ],
    subjects: {
      "JEE Main": ["Physics", "Chemistry", "Mathematics"],
      "JEE Advanced": ["Physics", "Chemistry", "Mathematics"],
      NEET: ["Physics", "Chemistry", "Biology"],
      CUET: ["English", "General Test", "Domain Subject"],
      "Other Entrance Exam": [
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "English",
      ],
    },
  },

  "School Exams": {
    exams: [
      "Class 6",
      "Class 7",
      "Class 8",
      "Class 9",
      "Class 10",
      "Class 11",
      "Class 12",
    ],
    subjects: {
      "Class 6": ["Mathematics", "Science", "English", "Social Science"],
      "Class 7": ["Mathematics", "Science", "English", "Social Science"],
      "Class 8": ["Mathematics", "Science", "English", "Social Science"],
      "Class 9": ["Mathematics", "Science", "English", "Social Science"],
      "Class 10": [
        "Mathematics",
        "Science",
        "English",
        "Social Science",
      ],
      "Class 11": [
        "Physics",
        "Chemistry",
        "Mathematics",
        "Biology",
        "Computer Science",
        "English",
      ],
      "Class 12": [
        "Physics",
        "Chemistry",
        "Mathematics",
        "Biology",
        "Computer Science",
        "English",
      ],
    },
  },

  "College Exams": {
    exams: [
      "Semester Exam",
      "Internal Exam",
      "End Semester Exam",
      "University Exam",
      "Model Exam",
      "Custom College Exam",
    ],
    subjects: {
      "Semester Exam": [
        "Computer Science",
        "Artificial Intelligence",
        "Data Science",
        "Mathematics",
        "Physics",
        "Engineering",
      ],
      "Internal Exam": [
        "Computer Science",
        "Artificial Intelligence",
        "Data Science",
        "Mathematics",
        "Engineering",
      ],
      "End Semester Exam": [
        "Computer Science",
        "Artificial Intelligence",
        "Data Science",
        "Machine Learning",
        "Engineering",
      ],
      "University Exam": [
        "Computer Science",
        "Artificial Intelligence",
        "Data Science",
        "Engineering",
        "Mathematics",
      ],
      "Model Exam": [
        "Computer Science",
        "Artificial Intelligence",
        "Data Science",
        "Engineering",
      ],
      "Custom College Exam": [
        "Computer Science",
        "Artificial Intelligence",
        "Data Science",
        "Other Subject",
      ],
    },
  },

  "Competitive Exams": {
    exams: [
      "CAT",
      "GATE",
      "CLAT",
      "GRE",
      "GMAT",
      "Other Competitive Exam",
    ],
    subjects: {
      CAT: [
        "Quantitative Aptitude",
        "Logical Reasoning",
        "Verbal Ability",
      ],
      GATE: [
        "Engineering Mathematics",
        "Technical Subject",
        "General Aptitude",
      ],
      CLAT: [
        "English",
        "Legal Reasoning",
        "Logical Reasoning",
        "Current Affairs",
        "Quantitative Techniques",
      ],
      GRE: [
        "Quantitative Reasoning",
        "Verbal Reasoning",
        "Analytical Writing",
      ],
      GMAT: [
        "Quantitative Reasoning",
        "Verbal Reasoning",
        "Data Insights",
      ],
      "Other Competitive Exam": [
        "Quantitative Aptitude",
        "Reasoning",
        "English",
        "General Awareness",
      ],
    },
  },

  "Skill / Career Learning": {
    exams: [
      "Python",
      "Data Science",
      "Machine Learning",
      "Artificial Intelligence",
      "Web Development",
      "Automation",
      "Cyber Security",
      "Cloud Computing",
    ],
    subjects: {
      Python: ["Python Basics", "OOP", "Data Structures", "Advanced Python"],
      "Data Science": [
        "Python for Data Science",
        "Statistics",
        "Pandas",
        "NumPy",
        "Data Visualization",
      ],
      "Machine Learning": [
        "ML Basics",
        "Regression",
        "Classification",
        "Clustering",
        "Model Evaluation",
      ],
      "Artificial Intelligence": [
        "AI Basics",
        "Machine Learning",
        "Deep Learning",
        "Generative AI",
        "RAG",
      ],
      "Web Development": [
        "HTML",
        "CSS",
        "JavaScript",
        "React",
        "Backend Development",
      ],
      Automation: [
        "Automation Basics",
        "Selenium",
        "API Automation",
        "Test Automation",
      ],
      "Cyber Security": [
        "Security Basics",
        "Network Security",
        "Web Security",
        "Ethical Security",
      ],
      "Cloud Computing": [
        "Cloud Basics",
        "AWS",
        "Azure",
        "Cloud Deployment",
      ],
    },
  },

  "Custom Preparation": {
    exams: ["My Exam / Goal"],
    subjects: ["My Subject"],
  },
};

const TOPICS = {
  "General Studies": [
    "Indian Constitution",
    "Indian History",
    "Indian Geography",
    "Indian Economy",
    "Environment",
    "Science & Technology",
    "Current Affairs",
  ],

  "General Tamil": [
    "Grammar",
    "Literature",
    "Vocabulary",
    "Comprehension",
  ],

  "General English": [
    "Grammar",
    "Vocabulary",
    "Reading Comprehension",
    "Sentence Correction",
  ],

  "Aptitude & Mental Ability": [
    "Number System",
    "Percentages",
    "Ratio & Proportion",
    "Time & Work",
    "Profit & Loss",
  ],

  Physics: [
    "Units & Measurements",
    "Motion",
    "Laws of Motion",
    "Work, Energy & Power",
    "Electricity",
    "Optics",
  ],

  Chemistry: [
    "Atomic Structure",
    "Periodic Table",
    "Chemical Bonding",
    "Thermodynamics",
    "Organic Chemistry",
    "Electrochemistry",
  ],

  Mathematics: [
    "Algebra",
    "Calculus",
    "Coordinate Geometry",
    "Probability",
    "Statistics",
    "Trigonometry",
  ],

  Biology: [
    "Cell Biology",
    "Human Physiology",
    "Genetics",
    "Ecology",
    "Plant Biology",
  ],

  "Computer Science": [
    "Programming Basics",
    "Data Structures",
    "Algorithms",
    "Database Systems",
    "Operating Systems",
    "Computer Networks",
  ],

  "Artificial Intelligence": [
    "AI Fundamentals",
    "Machine Learning",
    "Deep Learning",
    "Generative AI",
    "Natural Language Processing",
    "RAG",
  ],

  "Data Science": [
    "Python for Data Science",
    "Statistics",
    "Data Cleaning",
    "Data Visualization",
    "Machine Learning",
  ],

  "Machine Learning": [
    "ML Fundamentals",
    "Linear Regression",
    "Classification",
    "Clustering",
    "Model Evaluation",
  ],

  Python: [
    "Python Basics",
    "Variables & Data Types",
    "Lists",
    "Tuples",
    "Dictionaries",
    "Loops",
    "Functions",
    "OOP",
  ],

  "Python Basics": [
    "Variables",
    "Data Types",
    "Operators",
    "Conditional Statements",
    "Loops",
    "Functions",
  ],

  HTML: [
    "HTML Basics",
    "Forms",
    "Tables",
    "Semantic HTML",
  ],

  CSS: [
    "CSS Basics",
    "Selectors",
    "Flexbox",
    "Grid",
    "Responsive Design",
  ],

  JavaScript: [
    "Variables",
    "Functions",
    "Arrays",
    "Objects",
    "DOM",
    "Async JavaScript",
  ],

  React: [
    "Components",
    "Props",
    "State",
    "Hooks",
    "React Router",
    "API Integration",
  ],

  "Indian Constitution": [
    "Preamble",
    "Fundamental Rights",
    "Directive Principles",
    "Fundamental Duties",
    "Union Government",
    "Judiciary",
  ],
};

const DURATIONS = [
  "1 Day",
  "3 Days",
  "5 Days",
  "7 Days",
  "10 Days",
  "14 Days",
  "21 Days",
  "30 Days",
  "60 Days",
  "90 Days",
];

const DAILY_TIMES = [
  "30 Minutes",
  "1 Hour",
  "1.5 Hours",
  "2 Hours",
  "3 Hours",
  "4 Hours",
  "5 Hours",
  "6 Hours",
];

function getTopicsForSubject(subject) {
  if (TOPICS[subject]) {
    return TOPICS[subject];
  }

  return [
    `${subject} Fundamentals`,
    `${subject} Core Concepts`,
    `${subject} Important Topics`,
    `${subject} Practice`,
    `${subject} Revision`,
  ];
}

function SelectBox({
  label,
  value,
  options,
  onChange,
  disabled = false,
}) {
  return (
    <div className="sp-field">
      <label>{label}</label>

      <div className="sp-select-wrap">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {options.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>

        <span className="sp-select-arrow">⌄</span>
      </div>
    </div>
  );
}

function StudyPlan() {
  const navigate = useNavigate();

  const [preparation, setPreparation] = useState("Government Exams");
  const [exam, setExam] = useState("TNPSC");
  const [subject, setSubject] = useState("General Studies");
  const [topic, setTopic] = useState("Indian Constitution");
  const [duration, setDuration] = useState("7 Days");
  const [dailyTime, setDailyTime] = useState("2 Hours");
  const [selectedDay, setSelectedDay] = useState(1);

  const examOptions =
    FOCUS_DATA[preparation]?.exams || ["My Exam / Goal"];

  const subjectOptions =
    FOCUS_DATA[preparation]?.subjects?.[exam] || [
      "My Subject",
    ];

  const topicOptions = getTopicsForSubject(subject);

  const totalDays = parseInt(duration, 10) || 7;

  const learningDays = useMemo(() => {
    return Array.from(
      { length: Math.min(totalDays, 14) },
      (_, index) => index + 1
    );
  }, [totalDays]);

  function handlePreparationChange(value) {
    setPreparation(value);

    const nextExam =
      FOCUS_DATA[value]?.exams?.[0] || "My Exam / Goal";

    const nextSubject =
      FOCUS_DATA[value]?.subjects?.[nextExam]?.[0] ||
      "My Subject";

    setExam(nextExam);
    setSubject(nextSubject);
    setTopic(getTopicsForSubject(nextSubject)[0]);
  }

  function handleExamChange(value) {
    setExam(value);

    const nextSubject =
      FOCUS_DATA[preparation]?.subjects?.[value]?.[0] ||
      "My Subject";

    setSubject(nextSubject);
    setTopic(getTopicsForSubject(nextSubject)[0]);
  }

  function handleSubjectChange(value) {
    setSubject(value);
    setTopic(getTopicsForSubject(value)[0]);
  }

  function getDayTopic(day) {
    if (day === 1) return topic;

    const topics = topicOptions;

    return topics[(day - 1) % topics.length];
  }

  function getDayDescription(day) {
    if (day === 1) {
      return `Learn ${topic} with simple explanations, examples and practice.`;
    }

    if (day % 3 === 0) {
      return `Practice and revise ${getDayTopic(day)} with AI-guided questions.`;
    }

    if (day % 2 === 0) {
      return `Understand ${getDayTopic(day)} through examples and important points.`;
    }

    return `Explore ${getDayTopic(day)} and strengthen your understanding.`;
  }

  function startLearning(day = selectedDay) {
    const selectedTopic = getDayTopic(day);

    const studyPlanContext = {
      preparationType: preparation,
      examGoal: exam,
      subject,
      topic: selectedTopic,
      duration,
      dailyLearningTime: dailyTime,
      selectedDay: day,
      totalDays,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        message: `Teach me ${selectedTopic} for ${subject}. Explain the concept simply, give examples, important points, and important questions.`,
        studyPlanContext,
      })
    );

    navigate("/ai-assistant", {
      state: {
        studyPlanContext,
        autoStart: true,
      },
    });
  }

  return (
    <div className="study-plan-page">
      {/* Header */}
      <section className="sp-header">
        <div>
          <div className="sp-eyebrow">
            <Sparkles size={14} />
            PERSONALIZED LEARNING
          </div>

          <h1>Create Your Study Plan</h1>

          <p>
            Choose what you want to prepare, set your schedule, and let
            EduTrace AI guide you day by day.
          </p>
        </div>

        <div className="sp-header-icon">
          <Target size={28} />
        </div>
      </section>

      {/* ONE HORIZONTAL CONTROL ROW */}
      <section className="sp-control-section">
        <div className="sp-control-row">
          {/* Preparation */}
          <div className="sp-control-card">
            <div className="sp-control-title">
              <div className="sp-control-icon">
                <BookOpen size={17} />
              </div>
              <span>PREPARATION</span>
            </div>

            <SelectBox
              label="Preparation Type"
              value={preparation}
              options={PREPARATION_TYPES}
              onChange={handlePreparationChange}
            />
          </div>

          {/* Exam */}
          <div className="sp-control-card">
            <div className="sp-control-title">
              <div className="sp-control-icon">
                <Target size={17} />
              </div>
              <span>EXAM / GOAL</span>
            </div>

            <SelectBox
              label="Exam / Goal"
              value={exam}
              options={examOptions}
              onChange={handleExamChange}
            />
          </div>

          {/* Subject */}
          <div className="sp-control-card">
            <div className="sp-control-title">
              <div className="sp-control-icon">
                <BookOpen size={17} />
              </div>
              <span>SUBJECT</span>
            </div>

            <SelectBox
              label="Subject"
              value={subject}
              options={subjectOptions}
              onChange={handleSubjectChange}
            />
          </div>

          {/* Schedule */}
          <div className="sp-control-card">
            <div className="sp-control-title">
              <div className="sp-control-icon">
                <CalendarDays size={17} />
              </div>
              <span>SCHEDULE</span>
            </div>

            <div className="sp-schedule-fields">
              <div className="sp-mini-field">
                <label>Duration</label>

                <div className="sp-select-wrap">
                  <select
                    value={duration}
                    onChange={(e) => {
                      setDuration(e.target.value);
                      setSelectedDay(1);
                    }}
                  >
                    {DURATIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <span className="sp-select-arrow">⌄</span>
                </div>
              </div>

              <div className="sp-mini-field">
                <label>Daily Time</label>

                <div className="sp-select-wrap">
                  <select
                    value={dailyTime}
                    onChange={(e) =>
                      setDailyTime(e.target.value)
                    }
                  >
                    {DAILY_TIMES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <span className="sp-select-arrow">⌄</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Selected Plan */}
      <section className="sp-plan-preview">
        <div className="sp-plan-main">
          <div className="sp-plan-label">
            <Sparkles size={15} />
            YOUR PLAN
          </div>

          <h2>
            {exam} · {subject}
          </h2>

          <p>
            Start with <strong>{topic}</strong> and build your
            understanding through AI-guided learning.
          </p>

          <div className="sp-plan-meta">
            <span>
              <CalendarDays size={15} />
              {duration}
            </span>

            <span>
              <Clock3 size={15} />
              {dailyTime} / day
            </span>

            <span>
              <BookOpen size={15} />
              {topicOptions.length} topic areas
            </span>
          </div>
        </div>

        <button
          className="sp-start-btn"
          onClick={() => startLearning(1)}
        >
          <Play size={17} fill="currentColor" />
          Start Learning
          <ArrowRight size={17} />
        </button>
      </section>

      {/* Learning Plan */}
      <section className="sp-learning-section">
        <div className="sp-section-heading">
          <div>
            <div className="sp-section-kicker">
              <CalendarDays size={15} />
              LEARNING PLAN
            </div>

            <h2>Your day-by-day journey</h2>

            <p>
              Select any day to start an interactive AI learning
              session.
            </p>
          </div>

          <div className="sp-day-count">
            {totalDays} days
          </div>
        </div>

        <div className="sp-days">
          {learningDays.map((day) => {
            const active = selectedDay === day;

            return (
              <button
                type="button"
                key={day}
                className={`sp-day-card ${
                  active ? "active" : ""
                }`}
                onClick={() => setSelectedDay(day)}
              >
                <div className="sp-day-top">
                  <span>DAY {String(day).padStart(2, "0")}</span>

                  {active && (
                    <CheckCircle2 size={18} />
                  )}
                </div>

                <h3>{getDayTopic(day)}</h3>

                <p>{getDayDescription(day)}</p>

                <div className="sp-day-footer">
                  <span>{dailyTime}</span>

                  <span className="sp-day-arrow">
                    <ArrowRight size={16} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {totalDays > 14 && (
          <div className="sp-more-days">
            Showing the first 14 days. Your complete{" "}
            {totalDays}-day plan will continue automatically.
          </div>
        )}

        <div className="sp-selected-learning">
          <div>
            <span>SELECTED SESSION</span>

            <strong>
              Day {String(selectedDay).padStart(2, "0")} ·{" "}
              {getDayTopic(selectedDay)}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => startLearning(selectedDay)}
          >
            <Play size={16} fill="currentColor" />
            Learn This Topic
          </button>
        </div>
      </section>
    </div>
  );
}

export default StudyPlan;