import React, { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  CircleHelp,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import "./interactiveActivity.css";

const DEFAULT_ACTIVITY = {
  type: "mcq",
  title: "Quick Challenge",
  description: "Let's check what you understood!",
  question: "Which answer is correct?",
  options: [
    "Option A",
    "Option B",
    "Option C",
    "Option D",
  ],
  correctAnswer: 0,
  explanation: "Great job! You understood the concept.",
  hint: "Think about the main idea EduBot just explained.",
};

const TOPIC_ACTIVITIES = {
  "newton's second law": {
    type: "physics",
    title: "Push the Cart!",
    description: "Discover how force and mass change acceleration.",
    question: "What happens when you increase the force while keeping mass the same?",
    options: [
      "Acceleration increases",
      "Acceleration decreases",
      "Mass disappears",
      "Nothing changes",
    ],
    correctAnswer: 0,
    explanation:
      "Exactly! With the same mass, increasing the net force increases the acceleration.",
    hint:
      "Think about pushing the same cart harder. Does it speed up more or less?",
  },

  "newton's laws": {
    type: "physics",
    title: "Push the Cart!",
    description: "Discover how force and mass affect motion.",
    question: "If the same force is applied to a heavier cart, what happens to acceleration?",
    options: [
      "It increases",
      "It decreases",
      "It becomes infinite",
      "It stays exactly the same",
    ],
    correctAnswer: 1,
    explanation:
      "Correct! For the same net force, a larger mass produces a smaller acceleration.",
    hint:
      "Compare pushing an empty cart with pushing a very heavy cart.",
  },

  "photosynthesis": {
    type: "biology",
    title: "Help the Plant!",
    description: "Choose what the plant needs to make food.",
    question: "Which combination is essential for photosynthesis?",
    options: [
      "Light, carbon dioxide and water",
      "Only oxygen",
      "Only soil",
      "Only nitrogen",
    ],
    correctAnswer: 0,
    explanation:
      "Yes! Plants use light energy, carbon dioxide and water to carry out photosynthesis.",
    hint:
      "Think about what plants take from sunlight, air and water.",
  },

  "fractions": {
    type: "math",
    title: "Fraction Pizza!",
    description: "Let's make the fraction match the pizza.",
    question: "A pizza is divided into 4 equal pieces. You eat 1 piece. What fraction did you eat?",
    options: [
      "1/2",
      "1/3",
      "1/4",
      "4/1",
    ],
    correctAnswer: 2,
    explanation:
      "Correct! One piece out of four equal pieces is 1/4.",
    hint:
      "The denominator tells you how many equal pieces the whole has.",
  },

  "python basics": {
    type: "code",
    title: "Python Detective!",
    description: "Find the line that prints Hello World.",
    question: "Which Python statement prints Hello World?",
    options: [
      'print("Hello World")',
      'echo("Hello World")',
      'console("Hello World")',
      'show("Hello World")',
    ],
    correctAnswer: 0,
    explanation:
      "That's right! Python uses the print() function to display text.",
    hint:
      "Think about Python's built-in function for displaying output.",
  },
};

function normalizeTopic(topic) {
  return String(topic || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getActivity(topic, activity) {
  if (activity && typeof activity === "object") {
    return {
      ...DEFAULT_ACTIVITY,
      ...activity,
    };
  }

  const normalized = normalizeTopic(topic);

  if (TOPIC_ACTIVITIES[normalized]) {
    return TOPIC_ACTIVITIES[normalized];
  }

  if (normalized.includes("newton")) {
    return TOPIC_ACTIVITIES["newton's second law"];
  }

  if (normalized.includes("photosynthesis")) {
    return TOPIC_ACTIVITIES["photosynthesis"];
  }

  if (normalized.includes("fraction")) {
    return TOPIC_ACTIVITIES["fractions"];
  }

  if (
    normalized.includes("python") ||
    normalized.includes("programming")
  ) {
    return TOPIC_ACTIVITIES["python basics"];
  }

  return DEFAULT_ACTIVITY;
}

function PhysicsActivity({ activity, onComplete }) {
  const [force, setForce] = useState(5);
  const [mass, setMass] = useState(5);
  const [moving, setMoving] = useState(false);
  const [finished, setFinished] = useState(false);

  const acceleration = useMemo(() => {
    return Number((force / mass).toFixed(2));
  }, [force, mass]);

  const pushCart = () => {
    setMoving(false);

    requestAnimationFrame(() => {
      setMoving(true);
    });
  };

  const answerQuestion = (index) => {
    if (finished) return;

    if (index === activity.correctAnswer) {
      setFinished(true);
      onComplete?.(true, {
        force,
        mass,
        acceleration,
      });
    }
  };

  return (
    <div className="et-interactive-physics">
      <div className="et-physics-scene">
        <div className="et-physics-sky">
          <div className="et-physics-cloud cloud-one" />
          <div className="et-physics-cloud cloud-two" />
        </div>

        <div className="et-physics-ground" />

        <div
          className={[
            "et-cart",
            moving ? "moving" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="et-cart-box">
            <span>🛒</span>
          </div>
          <div className="et-cart-wheel wheel-one" />
          <div className="et-cart-wheel wheel-two" />
        </div>

        <div className="et-force-arrow">
          <Zap size={17} />
          <span>{force} N</span>
        </div>
      </div>

      <div className="et-physics-controls">
        <div className="et-control-row">
          <div>
            <strong>Force</strong>
            <span>How hard do you push?</span>
          </div>

          <strong>{force} N</strong>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={force}
          onChange={(event) => {
            setForce(Number(event.target.value));
            setMoving(false);
          }}
          aria-label="Force"
        />

        <div className="et-control-row">
          <div>
            <strong>Mass</strong>
            <span>How heavy is the cart?</span>
          </div>

          <strong>{mass} kg</strong>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={mass}
          onChange={(event) => {
            setMass(Number(event.target.value));
            setMoving(false);
          }}
          aria-label="Mass"
        />

        <button
          type="button"
          className="et-push-button"
          onClick={pushCart}
        >
          <Zap size={18} />
          PUSH THE CART
        </button>

        <div className="et-result-mini">
          <span>Acceleration</span>
          <strong>{acceleration} m/s²</strong>
        </div>
      </div>

      <div className="et-activity-question">
        <div className="et-question-label">
          <Target size={16} />
          YOUR CHALLENGE
        </div>

        <h4>{activity.question}</h4>

        <div className="et-question-options">
          {activity.options.map((option, index) => (
            <button
              type="button"
              key={option}
              className={[
                "et-answer-option",
                finished && index === activity.correctAnswer
                  ? "correct"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => answerQuestion(index)}
              disabled={finished}
            >
              <span className="et-answer-letter">
                {String.fromCharCode(65 + index)}
              </span>

              <span>{option}</span>

              {finished && index === activity.correctAnswer && (
                <Check size={18} />
              )}
            </button>
          ))}
        </div>

        {!finished && (
          <div className="et-hint">
            <CircleHelp size={15} />
            <span>{activity.hint}</span>
          </div>
        )}

        {finished && (
          <div className="et-success-message">
            <Trophy size={21} />
            <div>
              <strong>Amazing! 🎉</strong>
              <span>{activity.explanation}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function McqActivity({ activity, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const submitAnswer = () => {
    if (selected === null) return;

    setSubmitted(true);

    onComplete?.(
      selected === activity.correctAnswer,
      {
        selected,
        correctAnswer: activity.correctAnswer,
      }
    );
  };

  const reset = () => {
    setSelected(null);
    setSubmitted(false);
  };

  return (
    <div className="et-generic-activity">
      <div className="et-activity-question">
        <div className="et-question-label">
          <Target size={16} />
          YOUR CHALLENGE
        </div>

        <h4>{activity.question}</h4>

        <div className="et-question-options">
          {activity.options.map((option, index) => {
            const isCorrect =
              submitted && index === activity.correctAnswer;

            const isWrong =
              submitted &&
              index === selected &&
              index !== activity.correctAnswer;

            return (
              <button
                type="button"
                key={option}
                className={[
                  "et-answer-option",
                  selected === index ? "selected" : "",
                  isCorrect ? "correct" : "",
                  isWrong ? "wrong" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  if (!submitted) {
                    setSelected(index);
                  }
                }}
                disabled={submitted}
              >
                <span className="et-answer-letter">
                  {String.fromCharCode(65 + index)}
                </span>

                <span>{option}</span>

                {isCorrect && <Check size={18} />}
                {isWrong && <X size={18} />}
              </button>
            );
          })}
        </div>

        {!submitted && (
          <>
            <div className="et-hint">
              <CircleHelp size={15} />
              <span>{activity.hint}</span>
            </div>

            <button
              type="button"
              className="et-submit-answer"
              disabled={selected === null}
              onClick={submitAnswer}
            >
              CHECK MY ANSWER
              <ChevronRight size={17} />
            </button>
          </>
        )}

        {submitted && (
          <div
            className={[
              "et-feedback-box",
              selected === activity.correctAnswer
                ? "success"
                : "try-again",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {selected === activity.correctAnswer ? (
              <>
                <Trophy size={22} />
                <div>
                  <strong>Excellent! 🎉</strong>
                  <span>{activity.explanation}</span>
                </div>
              </>
            ) : (
              <>
                <CircleHelp size={22} />
                <div>
                  <strong>Almost there! 💡</strong>
                  <span>
                    Not quite. Look at the highlighted correct answer and
                    try another example.
                  </span>
                </div>
              </>
            )}

            <button
              type="button"
              className="et-reset-activity"
              onClick={reset}
              title="Try again"
            >
              <RotateCcw size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InteractiveActivity({
  topic = "",
  activity = null,
  onComplete,
}) {
  const data = getActivity(topic, activity);

  const handleComplete = (correct, result) => {
    onComplete?.({
      correct,
      topic,
      activity: data,
      result,
    });
  };

  return (
    <section className="et-interactive-activity">
      <div className="et-interactive-header">
        <div className="et-interactive-icon">
          <Sparkles size={21} />
        </div>

        <div>
          <span className="et-interactive-kicker">
            EDUBOT INTERACTIVE
          </span>

          <h3>{data.title}</h3>

          <p>{data.description}</p>
        </div>
      </div>

      {data.type === "physics" ? (
        <PhysicsActivity
          activity={data}
          onComplete={handleComplete}
        />
      ) : (
        <McqActivity
          activity={data}
          onComplete={handleComplete}
        />
      )}
    </section>
  );
}
