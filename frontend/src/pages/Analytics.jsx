import React, { useMemo, useState } from "react";
import {
  Activity,
  Award,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Flame,
  Gamepad2,
  GraduationCap,
  Lightbulb,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import "./analytics.css";

const STORAGE_KEYS = {
  aiHistory: "edutrace_ai_history",
  quizResults: "edutrace_quiz_results",
  arena: "edutrace_arena_progress",
  goals: "edutrace_goals",
  achievements: "edutrace_achievements",
  studyPlan: "edutrace_study_plan",
};

function readStorage(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);

    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.results)) return value.results;
    if (Array.isArray(value.data)) return value.data;
  }

  return [];
}

function getDateValue(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  return (
    item.completedAt ||
    item.completed_at ||
    item.createdAt ||
    item.created_at ||
    item.timestamp ||
    item.date ||
    item.updatedAt ||
    item.updated_at ||
    null
  );
}

function isWithinRange(item, range) {
  if (range === "all") {
    return true;
  }

  const dateValue = getDateValue(item);

  if (!dateValue) {
    return true;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return true;
  }

  const now = new Date();
  const days = range === "7" ? 7 : 30;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  return date >= start;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Recent";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recent";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calculateStreak(items) {
  const dates = new Set();

  items.forEach((item) => {
    const dateValue = getDateValue(item);

    if (!dateValue) return;

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return;

    dates.add(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).getTime()
    );
  });

  if (dates.size === 0) {
    return 0;
  }

  const sorted = [...dates].sort((a, b) => b - a);

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

  let current = sorted.includes(todayStart)
    ? todayStart
    : sorted.includes(yesterdayStart)
      ? yesterdayStart
      : null;

  if (current === null) {
    return 0;
  }

  let streak = 0;

  while (dates.has(current)) {
    streak += 1;
    current -= 24 * 60 * 60 * 1000;
  }

  return streak;
}

function getQuizScore(result) {
  const percentage = Number(
    result?.percentage ??
      result?.accuracy ??
      result?.scorePercentage ??
      0
  );

  if (Number.isFinite(percentage) && percentage > 0) {
    return Math.min(100, percentage);
  }

  const total = Number(result?.total ?? result?.totalQuestions ?? 0);
  const correct = Number(result?.correct ?? result?.correctAnswers ?? 0);

  if (total > 0) {
    return Math.min(100, Math.round((correct / total) * 100));
  }

  return 0;
}

function getQuizCorrect(result) {
  return Number(result?.correct ?? result?.correctAnswers ?? 0);
}

function getQuizTotal(result) {
  return Number(
    result?.total ??
      result?.totalQuestions ??
      result?.questionsCount ??
      0
  );
}

function getGoalProgress(goal) {
  const progress = Number(
    goal?.progress ??
      goal?.percentage ??
      goal?.completion ??
      goal?.completedPercentage ??
      0
  );

  if (Number.isFinite(progress)) {
    return Math.max(0, Math.min(100, progress));
  }

  return 0;
}

function getArenaXP(arena) {
  if (!arena || typeof arena !== "object") {
    return 0;
  }

  return Number(
    arena.xp ??
      arena.totalXP ??
      arena.totalXp ??
      arena.experience ??
      arena.totalExperience ??
      0
  );
}

function getArenaChallenges(arena) {
  if (!arena || typeof arena !== "object") {
    return 0;
  }

  return Number(
    arena.challengesCompleted ??
      arena.completedChallenges ??
      arena.totalChallenges ??
      arena.challenges ??
      0
  );
}

function getXPFromAchievements(achievements) {
  return achievements.reduce((total, item) => {
    if (!item || typeof item !== "object") {
      return total;
    }

    const claimed =
      item.claimed === true ||
      item.isClaimed === true ||
      item.unlocked === true;

    if (!claimed) {
      return total;
    }

    return total + Number(item.xp ?? item.reward ?? 0);
  }, 0);
}

function getActivityItems(aiHistory, quizResults, arena) {
  const activities = [];

  aiHistory.forEach((item, index) => {
    activities.push({
      id: `ai-${index}`,
      type: "AI",
      title: "AI learning session",
      subject:
        item.subject ||
        item.topic ||
        item.message ||
        "AI Assistant",
      date: getDateValue(item),
      icon: Bot,
    });
  });

  quizResults.forEach((item, index) => {
    activities.push({
      id: `quiz-${index}`,
      type: "Quiz",
      title: "Quiz completed",
      subject: item.subject || item.exam || "Practice Quiz",
      date: getDateValue(item),
      score: getQuizScore(item),
      icon: GraduationCap,
    });
  });

  if (arena && getArenaChallenges(arena) > 0) {
    activities.push({
      id: "arena-summary",
      type: "Arena",
      title: "Learning Arena activity",
      subject: `${getArenaChallenges(arena)} challenges completed`,
      date: null,
      score: getArenaXP(arena),
      icon: Gamepad2,
    });
  }

  return activities
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;

      return dateB - dateA;
    })
    .slice(0, 8);
}

function Analytics() {
  const [range, setRange] = useState("7");
  const [refreshKey, setRefreshKey] = useState(0);

  const data = useMemo(() => {
    const aiHistory = toArray(
      readStorage(STORAGE_KEYS.aiHistory, [])
    );

    const allQuizResults = toArray(
      readStorage(STORAGE_KEYS.quizResults, [])
    );

    const allGoals = toArray(
      readStorage(STORAGE_KEYS.goals, [])
    );

    const achievements = toArray(
      readStorage(STORAGE_KEYS.achievements, [])
    );

    const studyPlan = readStorage(
      STORAGE_KEYS.studyPlan,
      []
    );

    const arena = readStorage(
      STORAGE_KEYS.arena,
      {}
    );

    const filteredAI = aiHistory.filter((item) =>
      isWithinRange(item, range)
    );

    const filteredQuizzes = allQuizResults.filter((item) =>
      isWithinRange(item, range)
    );

    const filteredAchievements = achievements.filter((item) =>
      isWithinRange(item, range)
    );

    const filteredGoals = allGoals.filter((item) =>
      isWithinRange(item, range)
    );

    const quizScores = filteredQuizzes.map(getQuizScore);

    const quizAccuracy =
      quizScores.length > 0
        ? Math.round(
            quizScores.reduce((sum, score) => sum + score, 0) /
              quizScores.length
          )
        : 0;

    const totalQuestions = filteredQuizzes.reduce(
      (sum, quiz) => sum + getQuizTotal(quiz),
      0
    );

    const totalCorrect = filteredQuizzes.reduce(
      (sum, quiz) => sum + getQuizCorrect(quiz),
      0
    );

    const calculatedAccuracy =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : quizAccuracy;

    const averageGoalProgress =
      filteredGoals.length > 0
        ? Math.round(
            filteredGoals.reduce(
              (sum, goal) => sum + getGoalProgress(goal),
              0
            ) / filteredGoals.length
          )
        : 0;

    const completedGoals = filteredGoals.filter(
      (goal) => getGoalProgress(goal) >= 100
    ).length;

    const xpFromQuizzes = filteredQuizzes.reduce(
      (sum, quiz) => {
        const score = getQuizScore(quiz);

        return (
          sum +
          Number(
            quiz.xp ??
              quiz.xpEarned ??
              Math.round(score * 2)
          )
        );
      },
      0
    );

    const xpFromAchievements =
      getXPFromAchievements(filteredAchievements);

    const arenaXP = getArenaXP(arena);

    const totalXP =
      xpFromQuizzes +
      xpFromAchievements +
      arenaXP;

    const allActivity = [
      ...filteredAI,
      ...filteredQuizzes,
      ...filteredAchievements,
    ];

    const streak = calculateStreak(allActivity);

    const subjectMap = {};

    filteredQuizzes.forEach((quiz) => {
      const subject =
        quiz.subject ||
        quiz.exam ||
        "General";

      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          subject,
          attempts: 0,
          total: 0,
          correct: 0,
          accuracy: 0,
        };
      }

      subjectMap[subject].attempts += 1;
      subjectMap[subject].total += getQuizTotal(quiz);
      subjectMap[subject].correct += getQuizCorrect(quiz);
    });

    const subjects = Object.values(subjectMap)
      .map((item) => ({
        ...item,
        accuracy:
          item.total > 0
            ? Math.round(
                (item.correct / item.total) * 100
              )
            : 0,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const activityByDay = Array.from(
      { length: range === "7" ? 7 : 14 },
      (_, index) => {
        const date = new Date();

        date.setHours(0, 0, 0, 0);
        date.setDate(
          date.getDate() -
            ((range === "7" ? 6 : 13) - index)
        );

        const dayKey = date.toDateString();

        const aiCount = filteredAI.filter((item) => {
          const value = getDateValue(item);
          return value
            ? new Date(value).toDateString() === dayKey
            : false;
        }).length;

        const quizCount = filteredQuizzes.filter((item) => {
          const value = getDateValue(item);
          return value
            ? new Date(value).toDateString() === dayKey
            : false;
        }).length;

        const achievementCount =
          filteredAchievements.filter((item) => {
            const value = getDateValue(item);
            return value
              ? new Date(value).toDateString() === dayKey
              : false;
          }).length;

        return {
          label: date.toLocaleDateString("en-IN", {
            weekday: "short",
          }),
          date: date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          }),
          value:
            aiCount +
            quizCount +
            achievementCount,
        };
      }
    );

    const maxActivity = Math.max(
      ...activityByDay.map((item) => item.value),
      1
    );

    const activities = getActivityItems(
      filteredAI,
      filteredQuizzes,
      arena
    );

    const bestSubject = subjects[0] || null;
    const weakSubject =
      subjects.length > 1
        ? subjects[subjects.length - 1]
        : null;

    return {
      aiSessions: filteredAI.length,
      quizCount: filteredQuizzes.length,
      quizAccuracy: calculatedAccuracy,
      totalQuestions,
      totalCorrect,
      totalXP,
      arenaXP,
      arenaChallenges: getArenaChallenges(arena),
      streak,
      averageGoalProgress,
      completedGoals,
      goalsCount: filteredGoals.length,
      achievementsCount: filteredAchievements.length,
      subjects,
      bestSubject,
      weakSubject,
      activityByDay,
      maxActivity,
      activities,
      studyPlan,
      allQuizResults: filteredQuizzes,
      allGoals: filteredGoals,
    };
  }, [range, refreshKey]);

  const rangeLabel =
    range === "7"
      ? "Last 7 days"
      : range === "30"
        ? "Last 30 days"
        : "All time";

  const refreshAnalytics = () => {
    setRefreshKey((value) => value + 1);
  };

  return (
    <div className="analytics-page">
      <div className="analytics-shell">
        <header className="analytics-header">
          <div>
            <div className="analytics-eyebrow">
              <BarChart3 size={15} />
              LEARNING INTELLIGENCE
            </div>

            <h1>Analytics</h1>

            <p>
              Understand your learning activity, quiz performance,
              goals and AI learning progress.
            </p>
          </div>

          <div className="analytics-actions">
            <div className="analytics-select-wrap">
              <ChevronDown size={16} />

              <select
                value={range}
                onChange={(event) =>
                  setRange(event.target.value)
                }
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            <button
              type="button"
              className="analytics-refresh"
              onClick={refreshAnalytics}
              title="Refresh analytics"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </header>

        <section className="analytics-stat-grid">
          <article className="analytics-stat-card">
            <div className="analytics-stat-icon purple">
              <Zap size={21} />
            </div>

            <div>
              <span>Total XP</span>
              <strong>{data.totalXP.toLocaleString()}</strong>
              <small>
                From quizzes, arena and achievements
              </small>
            </div>
          </article>

          <article className="analytics-stat-card">
            <div className="analytics-stat-icon blue">
              <Target size={21} />
            </div>

            <div>
              <span>Quiz Accuracy</span>
              <strong>{data.quizAccuracy}%</strong>
              <small>
                {data.quizCount} quiz
                {data.quizCount === 1 ? "" : "zes"} completed
              </small>
            </div>
          </article>

          <article className="analytics-stat-card">
            <div className="analytics-stat-icon violet">
              <Bot size={21} />
            </div>

            <div>
              <span>AI Sessions</span>
              <strong>{data.aiSessions}</strong>
              <small>
                Learning conversations with EduTrace AI
              </small>
            </div>
          </article>

          <article className="analytics-stat-card">
            <div className="analytics-stat-icon orange">
              <Flame size={21} />
            </div>

            <div>
              <span>Learning Streak</span>
              <strong>{data.streak} days</strong>
              <small>
                Keep your learning momentum going
              </small>
            </div>
          </article>
        </section>

        <section className="analytics-main-grid">
          <article className="analytics-card activity-card">
            <div className="analytics-card-header">
              <div>
                <span className="analytics-card-kicker">
                  ACTIVITY
                </span>
                <h2>Learning activity</h2>
                <p>
                  Your activity for {rangeLabel.toLowerCase()}.
                </p>
              </div>

              <div className="analytics-card-icon">
                <Activity size={19} />
              </div>
            </div>

            <div className="activity-chart">
              {data.activityByDay.map((item) => {
                const height =
                  item.value === 0
                    ? 8
                    : Math.max(
                        12,
                        Math.round(
                          (item.value / data.maxActivity) * 100
                        )
                      );

                return (
                  <div
                    className="activity-column"
                    key={`${item.date}-${item.label}`}
                  >
                    <div className="activity-value">
                      {item.value}
                    </div>

                    <div className="activity-bar-area">
                      <div
                        className="activity-bar"
                        style={{
                          height: `${height}%`,
                        }}
                      />
                    </div>

                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="activity-legend">
              <span>
                <i className="legend-dot ai" />
                AI Learning
              </span>

              <span>
                <i className="legend-dot quiz" />
                Quizzes
              </span>

              <span>
                <i className="legend-dot achievement" />
                Achievements
              </span>
            </div>
          </article>

          <article className="analytics-card performance-card">
            <div className="analytics-card-header">
              <div>
                <span className="analytics-card-kicker">
                  PERFORMANCE
                </span>
                <h2>Quiz performance</h2>
                <p>
                  Your overall quiz accuracy.
                </p>
              </div>

              <div className="analytics-card-icon">
                <GraduationCap size={19} />
              </div>
            </div>

            <div className="performance-ring-wrap">
              <div
                className="performance-ring"
                style={{
                  "--progress": `${data.quizAccuracy * 3.6}deg`,
                }}
              >
                <div className="performance-ring-inner">
                  <strong>{data.quizAccuracy}%</strong>
                  <span>Accuracy</span>
                </div>
              </div>
            </div>

            <div className="performance-summary">
              <div>
                <strong>{data.totalCorrect}</strong>
                <span>Correct</span>
              </div>

              <div>
                <strong>{data.totalQuestions}</strong>
                <span>Total Questions</span>
              </div>

              <div>
                <strong>{data.quizCount}</strong>
                <span>Quizzes</span>
              </div>
            </div>
          </article>
        </section>

        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <span className="analytics-card-kicker">
                SUBJECT INSIGHTS
              </span>
              <h2>Subject performance</h2>
              <p>
                See where you're performing well and where you
                can improve.
              </p>
            </div>

            <div className="analytics-card-icon">
              <Brain size={19} />
            </div>
          </div>

          {data.subjects.length > 0 ? (
            <div className="subject-list">
              {data.subjects.slice(0, 8).map((subject) => (
                <div
                  className="subject-row"
                  key={subject.subject}
                >
                  <div className="subject-info">
                    <div className="subject-icon">
                      <BookIconFallback />
                    </div>

                    <div>
                      <strong>{subject.subject}</strong>
                      <span>
                        {subject.attempts} attempt
                        {subject.attempts === 1 ? "" : "s"} ·{" "}
                        {subject.correct}/{subject.total} correct
                      </span>
                    </div>
                  </div>

                  <div className="subject-progress-wrap">
                    <div className="subject-progress">
                      <div
                        className="subject-progress-fill"
                        style={{
                          width: `${subject.accuracy}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {subject.accuracy}%
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="analytics-empty">
              <div>
                <Brain size={26} />
              </div>

              <h3>No subject data yet</h3>

              <p>
                Complete a quiz to start seeing subject-level
                performance here.
              </p>
            </div>
          )}
        </section>

        <section className="analytics-insight-grid">
          <article className="analytics-card insight-card">
            <div className="analytics-card-header">
              <div>
                <span className="analytics-card-kicker">
                  LEARNING INSIGHTS
                </span>
                <h2>What your data says</h2>
              </div>

              <div className="analytics-card-icon">
                <Lightbulb size={19} />
              </div>
            </div>

            <div className="insight-list">
              {data.bestSubject ? (
                <div className="insight-item positive">
                  <div className="insight-icon">
                    <TrendingUp size={18} />
                  </div>

                  <div>
                    <strong>
                      Strongest subject:{" "}
                      {data.bestSubject.subject}
                    </strong>

                    <p>
                      You're currently scoring around{" "}
                      {data.bestSubject.accuracy}% in this
                      subject.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="insight-item">
                  <div className="insight-icon">
                    <Brain size={18} />
                  </div>

                  <div>
                    <strong>
                      Build your first performance signal
                    </strong>

                    <p>
                      Complete a quiz to let EduTrace identify
                      your strongest subjects.
                    </p>
                  </div>
                </div>
              )}

              {data.weakSubject ? (
                <div className="insight-item warning">
                  <div className="insight-icon">
                    <TrendingDown size={18} />
                  </div>

                  <div>
                    <strong>
                      Focus area: {data.weakSubject.subject}
                    </strong>

                    <p>
                      Review this subject and use AI Assistant
                      for concept-based explanations.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="insight-item">
                <div className="insight-icon">
                  <Bot size={18} />
                </div>

                <div>
                  <strong>
                    {data.aiSessions} AI learning session
                    {data.aiSessions === 1 ? "" : "s"}
                  </strong>

                  <p>
                    Use EduTrace AI regularly to turn difficult
                    concepts into simple explanations.
                  </p>
                </div>
              </div>

              <div className="insight-item">
                <div className="insight-icon">
                  <Flame size={18} />
                </div>

                <div>
                  <strong>
                    {data.streak > 0
                      ? `${data.streak}-day learning streak`
                      : "Start a learning streak"}
                  </strong>

                  <p>
                    Consistent short sessions are better than
                    irregular long study sessions.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="analytics-card goals-card">
            <div className="analytics-card-header">
              <div>
                <span className="analytics-card-kicker">
                  GOALS
                </span>
                <h2>Goals overview</h2>
                <p>
                  Your current goal completion progress.
                </p>
              </div>

              <div className="analytics-card-icon">
                <Target size={19} />
              </div>
            </div>

            <div className="goal-progress-main">
              <div
                className="goal-circle"
                style={{
                  "--goal-progress": `${data.averageGoalProgress}%`,
                }}
              >
                <div>
                  <strong>
                    {data.averageGoalProgress}%
                  </strong>
                  <span>Average</span>
                </div>
              </div>

              <div className="goal-summary">
                <div>
                  <span>Active goals</span>
                  <strong>
                    {Math.max(
                      0,
                      data.goalsCount - data.completedGoals
                    )}
                  </strong>
                </div>

                <div>
                  <span>Completed</span>
                  <strong>
                    {data.completedGoals}
                  </strong>
                </div>

                <div>
                  <span>Total</span>
                  <strong>{data.goalsCount}</strong>
                </div>
              </div>
            </div>

            {data.allGoals.length > 0 ? (
              <div className="goal-mini-list">
                {data.allGoals.slice(0, 4).map((goal, index) => {
                  const progress = getGoalProgress(goal);

                  return (
                    <div
                      className="goal-mini-item"
                      key={
                        goal.id ||
                        goal.title ||
                        `goal-${index}`
                      }
                    >
                      <div className="goal-mini-top">
                        <strong>
                          {goal.title ||
                            goal.name ||
                            "Learning Goal"}
                        </strong>

                        <span>{progress}%</span>
                      </div>

                      <div className="goal-mini-progress">
                        <div
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="analytics-small-empty">
                <Target size={20} />
                <span>
                  Create goals to track your progress here.
                </span>
              </div>
            )}
          </article>
        </section>

        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <span className="analytics-card-kicker">
                RECENT ACTIVITY
              </span>
              <h2>Latest learning activity</h2>
              <p>
                Recent actions captured by EduTrace.
              </p>
            </div>

            <div className="analytics-card-icon">
              <Clock3 size={19} />
            </div>
          </div>

          {data.activities.length > 0 ? (
            <div className="recent-activity-list">
              {data.activities.map((item) => {
                const Icon = item.icon || Activity;

                return (
                  <div
                    className="recent-activity-item"
                    key={item.id}
                  >
                    <div className="recent-activity-icon">
                      <Icon size={18} />
                    </div>

                    <div className="recent-activity-content">
                      <strong>{item.title}</strong>

                      <span>
                        {item.subject}
                      </span>
                    </div>

                    <div className="recent-activity-meta">
                      {item.score !== undefined &&
                      item.type === "Quiz" ? (
                        <strong>
                          {Math.round(item.score)}%
                        </strong>
                      ) : null}

                      <span>
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="analytics-empty">
              <div>
                <Activity size={26} />
              </div>

              <h3>No recent activity</h3>

              <p>
                Start learning, complete a quiz or use Learning
                Arena to generate activity.
              </p>
            </div>
          )}
        </section>

        <section className="analytics-bottom-grid">
          <div className="analytics-mini-card">
            <div className="analytics-mini-icon">
              <Gamepad2 size={20} />
            </div>

            <div>
              <span>Learning Arena</span>
              <strong>
                {data.arenaXP.toLocaleString()} XP
              </strong>
              <small>
                {data.arenaChallenges} challenge
                {data.arenaChallenges === 1 ? "" : "s"} completed
              </small>
            </div>
          </div>

          <div className="analytics-mini-card">
            <div className="analytics-mini-icon">
              <Trophy size={20} />
            </div>

            <div>
              <span>Achievements</span>
              <strong>{data.achievementsCount}</strong>
              <small>
                Achievements recorded in your workspace
              </small>
            </div>
          </div>

          <div className="analytics-mini-card">
            <div className="analytics-mini-icon">
              <Award size={20} />
            </div>

            <div>
              <span>Quiz Progress</span>
              <strong>{data.quizCount}</strong>
              <small>
                Completed quiz
                {data.quizCount === 1 ? "" : "zes"}
              </small>
            </div>
          </div>

          <div className="analytics-mini-card">
            <div className="analytics-mini-icon">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span>Goal Completion</span>
              <strong>
                {data.completedGoals}
              </strong>
              <small>
                Goal
                {data.completedGoals === 1 ? "" : "s"} completed
              </small>
            </div>
          </div>
        </section>

        <footer className="analytics-footer">
          <div>
            <Users size={16} />
            <span>
              EduTrace analytics uses your local learning
              workspace data.
            </span>
          </div>

          <span>
            {rangeLabel}
          </span>
        </footer>
      </div>
    </div>
  );
}

function BookIconFallback() {
  return <GraduationCap size={18} />;
}

export default Analytics;