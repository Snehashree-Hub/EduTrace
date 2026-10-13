import React, { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Lock,
  Unlock,
  Star,
  Flame,
  Brain,
  Target,
  BookOpen,
  Sparkles,
  Award,
  CheckCircle2,
  Circle,
  Zap,
  BarChart3,
  ShieldCheck,
  Crown,
  Medal,
  Rocket,
  GraduationCap,
  FileText,
  RefreshCw,
} from "lucide-react";
import "./achievements.css";

const QUIZ_RESULTS_KEY = "edutrace_quiz_results";
const GOALS_KEY = "edutrace_goals";
const AI_HISTORY_KEY = "edutrace_ai_history";
const ACHIEVEMENTS_KEY = "edutrace_achievements";

const BASE_ACHIEVEMENTS = [
  {
    id: "first-step",
    title: "First Step",
    description: "Complete your first learning session with EduTrace AI.",
    category: "AI Learning",
    icon: Rocket,
    reward: 100,
    target: 1,
    color: "purple",
  },
  {
    id: "ai-explorer",
    title: "AI Explorer",
    description: "Ask EduTrace AI 10 learning questions.",
    category: "AI Learning",
    icon: Brain,
    reward: 200,
    target: 10,
    color: "blue",
  },
  {
    id: "ai-master",
    title: "AI Master",
    description: "Complete 50 AI learning interactions.",
    category: "AI Learning",
    icon: Sparkles,
    reward: 500,
    target: 50,
    color: "violet",
  },
  {
    id: "quiz-starter",
    title: "Quiz Starter",
    description: "Complete your first quiz.",
    category: "Quizzes",
    icon: Medal,
    reward: 100,
    target: 1,
    color: "orange",
  },
  {
    id: "quiz-master",
    title: "Quiz Master",
    description: "Complete 10 quizzes.",
    category: "Quizzes",
    icon: Trophy,
    reward: 500,
    target: 10,
    color: "gold",
  },
  {
    id: "quiz-legend",
    title: "Quiz Legend",
    description: "Complete 25 quizzes.",
    category: "Quizzes",
    icon: Crown,
    reward: 1000,
    target: 25,
    color: "pink",
  },
  {
    id: "perfect-score",
    title: "Perfect Score",
    description: "Get 100% in a quiz.",
    category: "Quizzes",
    icon: Star,
    reward: 300,
    target: 1,
    color: "yellow",
  },
  {
    id: "knowledge-hunter",
    title: "Knowledge Hunter",
    description: "Add your first document to Knowledge Vault.",
    category: "Knowledge Vault",
    icon: BookOpen,
    reward: 150,
    target: 1,
    color: "cyan",
  },
  {
    id: "knowledge-collector",
    title: "Knowledge Collector",
    description: "Build a Knowledge Vault with 5 documents.",
    category: "Knowledge Vault",
    icon: FileText,
    reward: 400,
    target: 5,
    color: "blue",
  },
  {
    id: "goal-crusher",
    title: "Goal Crusher",
    description: "Create 5 learning or productivity goals.",
    category: "Goals",
    icon: Target,
    reward: 400,
    target: 5,
    color: "green",
  },
  {
    id: "goal-finisher",
    title: "Goal Finisher",
    description: "Complete 5 goals.",
    category: "Goals",
    icon: CheckCircle2,
    reward: 600,
    target: 5,
    color: "emerald",
  },
  {
    id: "milestone-hunter",
    title: "Milestone Hunter",
    description: "Complete 10 goal milestones.",
    category: "Goals",
    icon: Medal,
    reward: 350,
    target: 10,
    color: "orange",
  },
  {
    id: "seven-day-streak",
    title: "7-Day Streak",
    description: "Maintain a 7-day learning streak.",
    category: "Streaks",
    icon: Flame,
    reward: 500,
    target: 7,
    color: "red",
  },
  {
    id: "fourteen-day-streak",
    title: "14-Day Streak",
    description: "Maintain a 14-day learning streak.",
    category: "Streaks",
    icon: Flame,
    reward: 1000,
    target: 14,
    color: "orange",
  },
  {
    id: "thirty-day-streak",
    title: "30-Day Streak",
    description: "Maintain a 30-day learning streak.",
    category: "Streaks",
    icon: Flame,
    reward: 2000,
    target: 30,
    color: "gold",
  },
  {
    id: "learning-planner",
    title: "Learning Planner",
    description: "Create a study plan.",
    category: "Study Plan",
    icon: GraduationCap,
    reward: 150,
    target: 1,
    color: "purple",
  },
  {
    id: "study-warrior",
    title: "Study Warrior",
    description: "Complete 10 study sessions.",
    category: "Study Plan",
    icon: ShieldCheck,
    reward: 400,
    target: 10,
    color: "blue",
  },
];

const CATEGORY_ICONS = {
  All: Trophy,
  "AI Learning": Brain,
  Quizzes: Medal,
  "Knowledge Vault": BookOpen,
  Goals: Target,
  Streaks: Flame,
  "Study Plan": GraduationCap,
};

function readStorage(key, fallback) {
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

function getQuizResults() {
  const data = readStorage(QUIZ_RESULTS_KEY, []);

  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.results)) {
    return data.results;
  }

  return [];
}

function getGoals() {
  const data = readStorage(GOALS_KEY, []);

  return Array.isArray(data) ? data : [];
}

function getAIHistory() {
  const localHistory = readStorage(AI_HISTORY_KEY, []);

  if (Array.isArray(localHistory)) {
    return localHistory;
  }

  return [];
}

function getKnowledgeCount() {
  return 0;
}

function calculateCurrentStreak() {
  const dates = [];

  const quizResults = getQuizResults();

  quizResults.forEach((quiz) => {
    if (quiz.completedAt) {
      dates.push(new Date(quiz.completedAt));
    }
  });

  const aiHistory = getAIHistory();

  aiHistory.forEach((item) => {
    const dateValue =
      item.timestamp ||
      item.createdAt ||
      item.date ||
      item.time;

    if (dateValue) {
      dates.push(new Date(dateValue));
    }
  });

  const validDates = dates
    .filter((date) => !Number.isNaN(date.getTime()))
    .map((date) => {
      const copy = new Date(date);
      copy.setHours(0, 0, 0, 0);
      return copy.getTime();
    });

  const uniqueDates = [...new Set(validDates)].sort((a, b) => b - a);

  if (!uniqueDates.length) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (
    uniqueDates[0] !== today.getTime() &&
    uniqueDates[0] !== yesterday.getTime()
  ) {
    return 0;
  }

  let streak = 1;

  for (let i = 1; i < uniqueDates.length; i += 1) {
    const difference =
      (uniqueDates[i - 1] - uniqueDates[i]) /
      (1000 * 60 * 60 * 24);

    if (difference === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function calculateProgress(achievement, data) {
  switch (achievement.id) {
    case "first-step":
      return Math.min(data.aiInteractions > 0 ? 1 : 0, 1);

    case "ai-explorer":
      return Math.min(data.aiInteractions, achievement.target);

    case "ai-master":
      return Math.min(data.aiInteractions, achievement.target);

    case "quiz-starter":
      return Math.min(data.quizCount, achievement.target);

    case "quiz-master":
      return Math.min(data.quizCount, achievement.target);

    case "quiz-legend":
      return Math.min(data.quizCount, achievement.target);

    case "perfect-score":
      return data.perfectScores > 0 ? 1 : 0;

    case "knowledge-hunter":
      return Math.min(data.knowledgeCount, achievement.target);

    case "knowledge-collector":
      return Math.min(data.knowledgeCount, achievement.target);

    case "goal-crusher":
      return Math.min(data.goalCount, achievement.target);

    case "goal-finisher":
      return Math.min(data.completedGoals, achievement.target);

    case "milestone-hunter":
      return Math.min(data.completedMilestones, achievement.target);

    case "seven-day-streak":
      return Math.min(data.streak, achievement.target);

    case "fourteen-day-streak":
      return Math.min(data.streak, achievement.target);

    case "thirty-day-streak":
      return Math.min(data.streak, achievement.target);

    case "learning-planner":
      return data.studyPlanExists ? 1 : 0;

    case "study-warrior":
      return Math.min(data.studySessions, achievement.target);

    default:
      return 0;
  }
}

function getData() {
  const quizResults = getQuizResults();
  const goals = getGoals();
  const aiHistory = getAIHistory();

  const perfectScores = quizResults.filter((quiz) => {
    return (
      Number(quiz.percentage) === 100 ||
      Number(quiz.score) === 100
    );
  }).length;

  const completedGoals = goals.filter((goal) => {
    return (
      goal.completed === true ||
      goal.status === "completed" ||
      Number(goal.progress) >= 100
    );
  }).length;

  const completedMilestones = goals.reduce((total, goal) => {
    const milestones = Array.isArray(goal.milestones)
      ? goal.milestones
      : [];

    return (
      total +
      milestones.filter(
        (milestone) =>
          milestone.completed === true ||
          milestone.isCompleted === true
      ).length
    );
  }, 0);

  const studyPlan = readStorage("edutrace_study_plan", null);

  const studySessions =
    Array.isArray(studyPlan?.days)
      ? studyPlan.days.filter(
          (day) =>
            day.completed === true ||
            day.status === "completed"
        ).length
      : 0;

  return {
    quizCount: quizResults.length,
    perfectScores,
    goalCount: goals.length,
    completedGoals,
    completedMilestones,
    aiInteractions: aiHistory.length,
    knowledgeCount: getKnowledgeCount(),
    streak: calculateCurrentStreak(),
    studyPlanExists: Boolean(studyPlan),
    studySessions,
  };
}

function AchievementIcon({ achievement, locked = false }) {
  const Icon = achievement.icon || Trophy;

  return (
    <div
      className={`achievement-icon achievement-icon-${achievement.color} ${
        locked ? "is-locked" : ""
      }`}
    >
      <Icon size={25} strokeWidth={2.2} />
    </div>
  );
}

function ProgressBar({ value, target }) {
  const percentage =
    target > 0
      ? Math.min((value / target) * 100, 100)
      : 0;

  return (
    <div className="achievement-progress">
      <div className="achievement-progress-track">
        <div
          className="achievement-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <span>
        {Math.min(value, target)} / {target}
      </span>
    </div>
  );
}

export default function Achievements() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [data, setData] = useState(getData);
  const [claimed, setClaimed] = useState(() =>
    readStorage(ACHIEVEMENTS_KEY, [])
  );

  const refresh = () => {
    setData(getData());
  };

  useEffect(() => {
    refresh();

    const handleStorage = () => {
      refresh();
      setClaimed(readStorage(ACHIEVEMENTS_KEY, []));
    };

    window.addEventListener("storage", handleStorage);

    const interval = setInterval(refresh, 3000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const achievements = useMemo(() => {
    return BASE_ACHIEVEMENTS.map((achievement) => {
      const progress = calculateProgress(achievement, data);

      return {
        ...achievement,
        progress,
        unlocked: progress >= achievement.target,
      };
    });
  }, [data]);

  const filteredAchievements = useMemo(() => {
    if (activeCategory === "All") {
      return achievements;
    }

    return achievements.filter(
      (achievement) =>
        achievement.category === activeCategory
    );
  }, [achievements, activeCategory]);

  const unlockedAchievements = achievements.filter(
    (achievement) => achievement.unlocked
  );

  const lockedAchievements = achievements.filter(
    (achievement) => !achievement.unlocked
  );

  const totalPossibleXP = achievements.reduce(
    (total, achievement) => total + achievement.reward,
    0
  );

  const earnedXP = unlockedAchievements.reduce(
    (total, achievement) => total + achievement.reward,
    0
  );

  const overallProgress =
    achievements.length > 0
      ? Math.round(
          (unlockedAchievements.length /
            achievements.length) *
            100
        )
      : 0;

  const categories = [
    "All",
    "AI Learning",
    "Quizzes",
    "Knowledge Vault",
    "Goals",
    "Streaks",
    "Study Plan",
  ];

  const saveClaimed = (next) => {
    setClaimed(next);
    localStorage.setItem(
      ACHIEVEMENTS_KEY,
      JSON.stringify(next)
    );
  };

  const claimAchievement = (achievement) => {
    if (!achievement.unlocked) {
      return;
    }

    if (claimed.includes(achievement.id)) {
      return;
    }

    saveClaimed([...claimed, achievement.id]);
  };

  return (
    <div className="achievements-page">
      <div className="achievements-shell">
        <section className="achievements-hero">
          <div className="achievements-hero-content">
            <div className="hero-eyebrow">
              <Trophy size={15} />
              EduTrace Achievement Center
            </div>

            <h1>
              Your learning journey,
              <span> rewarded.</span>
            </h1>

            <p>
              Turn your learning activity into milestones,
              badges, XP and visible progress.
            </p>
          </div>

          <div className="hero-trophy">
            <div className="hero-trophy-glow" />
            <Trophy size={72} strokeWidth={1.5} />
          </div>
        </section>

        <section className="achievement-overview-grid">
          <div className="achievement-overview-card">
            <div className="overview-icon purple">
              <Trophy size={20} />
            </div>

            <div>
              <span>Total Achievements</span>
              <strong>{achievements.length}</strong>
            </div>
          </div>

          <div className="achievement-overview-card">
            <div className="overview-icon green">
              <Unlock size={20} />
            </div>

            <div>
              <span>Unlocked</span>
              <strong>
                {unlockedAchievements.length}
              </strong>
            </div>
          </div>

          <div className="achievement-overview-card">
            <div className="overview-icon orange">
              <Lock size={20} />
            </div>

            <div>
              <span>Locked</span>
              <strong>
                {lockedAchievements.length}
              </strong>
            </div>
          </div>

          <div className="achievement-overview-card">
            <div className="overview-icon gold">
              <Zap size={20} />
            </div>

            <div>
              <span>XP Earned</span>
              <strong>{earnedXP.toLocaleString()}</strong>
            </div>
          </div>
        </section>

        <section className="achievement-progress-card">
          <div className="progress-card-top">
            <div>
              <span className="section-kicker">
                Overall Progress
              </span>

              <h2>
                {overallProgress}% of achievements unlocked
              </h2>
            </div>

            <div className="progress-percent">
              {overallProgress}%
            </div>
          </div>

          <div className="big-progress-track">
            <div
              className="big-progress-fill"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          <div className="progress-card-footer">
            <span>
              {earnedXP.toLocaleString()} XP earned
            </span>

            <span>
              {totalPossibleXP.toLocaleString()} XP available
            </span>
          </div>
        </section>

        <section className="achievement-stats-row">
          <div className="mini-achievement-stat">
            <Flame size={19} />
            <div>
              <span>Current Streak</span>
              <strong>{data.streak} days</strong>
            </div>
          </div>

          <div className="mini-achievement-stat">
            <Brain size={19} />
            <div>
              <span>AI Interactions</span>
              <strong>{data.aiInteractions}</strong>
            </div>
          </div>

          <div className="mini-achievement-stat">
            <Medal size={19} />
            <div>
              <span>Quizzes Completed</span>
              <strong>{data.quizCount}</strong>
            </div>
          </div>

          <div className="mini-achievement-stat">
            <Target size={19} />
            <div>
              <span>Goals Created</span>
              <strong>{data.goalCount}</strong>
            </div>
          </div>
        </section>

        <section className="achievements-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                Achievement Library
              </span>
              <h2>Unlock your next milestone</h2>
            </div>

            <button
              type="button"
              className="refresh-achievements"
              onClick={refresh}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="achievement-filters">
            {categories.map((category) => {
              const Icon =
                CATEGORY_ICONS[category] || Trophy;

              return (
                <button
                  key={category}
                  type="button"
                  className={
                    activeCategory === category
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveCategory(category)
                  }
                >
                  <Icon size={16} />
                  {category}
                </button>
              );
            })}
          </div>

          <div className="achievement-grid">
            {filteredAchievements.map((achievement) => {
              const isClaimed = claimed.includes(
                achievement.id
              );

              return (
                <article
                  key={achievement.id}
                  className={`achievement-card ${
                    achievement.unlocked
                      ? "unlocked"
                      : "locked"
                  }`}
                >
                  <div className="achievement-card-top">
                    <AchievementIcon
                      achievement={achievement}
                      locked={!achievement.unlocked}
                    />

                    <div className="achievement-status">
                      {achievement.unlocked ? (
                        isClaimed ? (
                          <span className="status-pill claimed">
                            <CheckCircle2 size={13} />
                            Claimed
                          </span>
                        ) : (
                          <span className="status-pill unlocked">
                            <Unlock size={13} />
                            Unlocked
                          </span>
                        )
                      ) : (
                        <span className="status-pill locked">
                          <Lock size={13} />
                          Locked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="achievement-card-content">
                    <span className="achievement-category">
                      {achievement.category}
                    </span>

                    <h3>{achievement.title}</h3>

                    <p>{achievement.description}</p>

                    <ProgressBar
                      value={achievement.progress}
                      target={achievement.target}
                    />

                    <div className="achievement-card-bottom">
                      <div className="xp-reward">
                        <Zap size={15} />
                        +{achievement.reward} XP
                      </div>

                      {achievement.unlocked &&
                        !isClaimed && (
                          <button
                            type="button"
                            className="claim-button"
                            onClick={() =>
                              claimAchievement(
                                achievement
                              )
                            }
                          >
                            Claim
                          </button>
                        )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="achievement-empty-tip">
          <div className="tip-icon">
            <Sparkles size={22} />
          </div>

          <div>
            <strong>
              Keep learning to unlock more rewards
            </strong>

            <p>
              Complete quizzes, ask the AI, build your
              Knowledge Vault, finish goals and maintain
              your streak to unlock achievements
              automatically.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
