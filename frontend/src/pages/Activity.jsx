import React, { useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  Award,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  Flame,
  Gamepad2,
  GraduationCap,
  RefreshCw,
  Search,
  Target,
  Trash2,
  Trophy,
  BookOpen,
  Zap,
  X,
} from "lucide-react";
import "./activity.css";

const STORAGE_KEYS = {
  aiHistory: "edutrace_ai_history",
  quizResults: "edutrace_quiz_results",
  arena: "edutrace_arena_progress",
  goals: "edutrace_goals",
  achievements: "edutrace_achievements",
  studyPlan: "edutrace_study_plan",
  notifications: "edutrace_notifications",
};

const FILTERS = [
  { id: "all", label: "All Activity" },
  { id: "ai", label: "AI Learning" },
  { id: "quiz", label: "Quizzes" },
  { id: "arena", label: "Learning Arena" },
  { id: "goal", label: "Goals" },
  { id: "achievement", label: "Achievements" },
  { id: "knowledge", label: "Knowledge" },
  { id: "study", label: "Study Plan" },
];

function readStorage(key, fallback) {
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

function safeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getScore(item) {
  const percentage = Number(
    item?.percentage ??
      item?.accuracy ??
      item?.scorePercentage ??
      0
  );

  if (Number.isFinite(percentage) && percentage > 0) {
    return Math.round(Math.min(100, percentage));
  }

  const total = Number(
    item?.total ??
      item?.totalQuestions ??
      0
  );

  const correct = Number(
    item?.correct ??
      item?.correctAnswers ??
      0
  );

  if (total > 0) {
    return Math.round((correct / total) * 100);
  }

  return 0;
}

function getGoalProgress(goal) {
  const progress = Number(
    goal?.progress ??
      goal?.percentage ??
      goal?.completion ??
      goal?.completedPercentage ??
      0
  );

  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.max(0, Math.min(100, progress));
}

function formatRelativeTime(value) {
  const date = safeDate(value);

  if (!date) {
    return "Recently";
  }

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 0) {
    return "Just now";
  }

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  if (days < 30) {
    return `${Math.floor(days / 7)}w ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFullDate(value) {
  const date = safeDate(value);

  if (!date) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(value) {
  const date = safeDate(value);

  if (!date) {
    return false;
  }

  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isThisWeek(value) {
  const date = safeDate(value);

  if (!date) {
    return false;
  }

  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const day = start.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;

  start.setDate(start.getDate() - diffToMonday);

  return date >= start;
}

function buildActivities({
  aiHistory,
  quizResults,
  arena,
  goals,
  achievements,
  studyPlan,
}) {
  const activities = [];

  aiHistory.forEach((item, index) => {
    const date = getDateValue(item);

    activities.push({
      id: `ai-${index}-${date || index}`,
      type: "ai",
      title: "AI learning session",
      description:
        item.message ||
        item.topic ||
        item.subject ||
        "You interacted with EduTrace AI.",
      meta:
        item.topic ||
        item.subject ||
        "AI Assistant",
      date,
      icon: Bot,
      accent: "purple",
    });
  });

  quizResults.forEach((item, index) => {
    const score = getScore(item);
    const correct = Number(
      item.correct ??
        item.correctAnswers ??
        0
    );

    const total = Number(
      item.total ??
        item.totalQuestions ??
        0
    );

    activities.push({
      id: `quiz-${index}-${getDateValue(item) || index}`,
      type: "quiz",
      title: "Quiz completed",
      description:
        total > 0
          ? `${correct} of ${total} questions answered correctly.`
          : "A quiz was completed.",
      meta:
        item.subject ||
        item.exam ||
        item.preparationType ||
        "Practice Quiz",
      date: getDateValue(item),
      score,
      icon: GraduationCap,
      accent: "blue",
    });
  });

  if (arena && typeof arena === "object") {
    const challenges = Number(
      arena.challengesCompleted ??
        arena.completedChallenges ??
        arena.totalChallenges ??
        arena.challenges ??
        0
    );

    const xp = Number(
      arena.xp ??
        arena.totalXP ??
        arena.totalXp ??
        arena.experience ??
        0
    );

    if (challenges > 0 || xp > 0) {
      activities.push({
        id: "arena-summary",
        type: "arena",
        title: "Learning Arena progress",
        description: `${challenges} challenge${
          challenges === 1 ? "" : "s"
        } completed and ${xp.toLocaleString()} XP earned.`,
        meta: "Learning Arena",
        date:
          arena.lastActivityAt ||
          arena.updatedAt ||
          arena.updated_at ||
          null,
        score: xp,
        icon: Gamepad2,
        accent: "orange",
      });
    }
  }

  goals.forEach((goal, index) => {
    const progress = getGoalProgress(goal);
    const completed = progress >= 100;

    activities.push({
      id: `goal-${index}-${goal.id || index}`,
      type: "goal",
      title: completed
        ? "Goal completed"
        : "Goal updated",
      description: `${
        goal.title ||
        goal.name ||
        "Learning goal"
      } is at ${progress}% progress.`,
      meta:
        goal.category ||
        "Goals",
      date:
        goal.updatedAt ||
        goal.updated_at ||
        goal.createdAt ||
        goal.created_at ||
        null,
      score: progress,
      icon: Target,
      accent: "violet",
    });
  });

  achievements.forEach((achievement, index) => {
    const unlocked =
      achievement.unlocked === true ||
      achievement.claimed === true ||
      achievement.isClaimed === true;

    activities.push({
      id: `achievement-${index}-${achievement.id || index}`,
      type: "achievement",
      title: unlocked
        ? "Achievement unlocked"
        : "Achievement progress",
      description:
        achievement.description ||
        achievement.title ||
        achievement.name ||
        "Achievement activity recorded.",
      meta:
        achievement.title ||
        achievement.name ||
        "Achievement",
      date:
        achievement.unlockedAt ||
        achievement.claimedAt ||
        achievement.completedAt ||
        achievement.createdAt ||
        null,
      score: Number(
        achievement.xp ??
          achievement.reward ??
          0
      ),
      icon: Trophy,
      accent: "gold",
    });
  });

  if (studyPlan) {
    const plans = toArray(studyPlan);

    plans.forEach((item, index) => {
      activities.push({
        id: `study-${index}`,
        type: "study",
        title: "Study plan activity",
        description:
          item.title ||
          item.topic ||
          item.subject ||
          "Study plan updated.",
        meta:
          item.subject ||
          item.topic ||
          "Study Plan",
        date:
          item.completedAt ||
          item.updatedAt ||
          item.createdAt ||
          null,
        icon: CalendarDays,
        accent: "cyan",
      });
    });

    if (
      !Array.isArray(studyPlan) &&
      typeof studyPlan === "object"
    ) {
      activities.push({
        id: "study-plan-summary",
        type: "study",
        title: "Study plan available",
        description:
          "Your personalized learning plan is available in EduTrace.",
        meta: "Study Plan",
        date: null,
        icon: CalendarDays,
        accent: "cyan",
      });
    }
  }

  return activities.sort((a, b) => {
    const dateA = safeDate(a.date)?.getTime() || 0;
    const dateB = safeDate(b.date)?.getTime() || 0;

    return dateB - dateA;
  });
}

function Activity() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [period, setPeriod] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [clearedAt, setClearedAt] = useState(() => {
    try {
      return Number(
        localStorage.getItem("edutrace_activity_cleared_at") || 0
      );
    } catch {
      return 0;
    }
  });

  const data = useMemo(() => {
    const aiHistory = toArray(
      readStorage(STORAGE_KEYS.aiHistory, [])
    );

    const quizResults = toArray(
      readStorage(STORAGE_KEYS.quizResults, [])
    );

    const goals = toArray(
      readStorage(STORAGE_KEYS.goals, [])
    );

    const achievements = toArray(
      readStorage(STORAGE_KEYS.achievements, [])
    );

    const arena = readStorage(
      STORAGE_KEYS.arena,
      {}
    );

    const studyPlan = readStorage(
      STORAGE_KEYS.studyPlan,
      []
    );

    const allActivities = buildActivities({
      aiHistory,
      quizResults,
      arena,
      goals,
      achievements,
      studyPlan,
    });

    const visibleActivities = allActivities.filter((item) => {
      const itemTime = safeDate(item.date)?.getTime() || 0;

      if (
        clearedAt &&
        itemTime &&
        itemTime <= clearedAt
      ) {
        return false;
      }

      if (
        activeFilter !== "all" &&
        item.type !== activeFilter
      ) {
        return false;
      }

      if (period === "today" && !isToday(item.date)) {
        return false;
      }

      if (
        period === "week" &&
        !isThisWeek(item.date)
      ) {
        return false;
      }

      if (searchText.trim()) {
        const query = searchText
          .trim()
          .toLowerCase();

        const searchable = [
          item.title,
          item.description,
          item.meta,
          item.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) {
          return false;
        }
      }

      return true;
    });

    const todayCount = allActivities.filter((item) =>
      isToday(item.date)
    ).length;

    const weekCount = allActivities.filter((item) =>
      isThisWeek(item.date)
    ).length;

    const aiCount = allActivities.filter(
      (item) => item.type === "ai"
    ).length;

    const quizCount = allActivities.filter(
      (item) => item.type === "quiz"
    ).length;

    const arenaCount = allActivities.filter(
      (item) => item.type === "arena"
    ).length;

    const goalCount = allActivities.filter(
      (item) => item.type === "goal"
    ).length;

    const achievementCount = allActivities.filter(
      (item) => item.type === "achievement"
    ).length;

    const studyCount = allActivities.filter(
      (item) => item.type === "study"
    ).length;

    return {
      allActivities,
      visibleActivities,
      todayCount,
      weekCount,
      aiCount,
      quizCount,
      arenaCount,
      goalCount,
      achievementCount,
      studyCount,
    };
  }, [
    activeFilter,
    period,
    searchText,
    refreshKey,
    clearedAt,
  ]);

  const handleRefresh = () => {
    setRefreshKey((value) => value + 1);
  };

  const handleClearActivity = () => {
    const confirmed = window.confirm(
      "Clear the activity timeline? This will hide existing activity from this page."
    );

    if (!confirmed) {
      return;
    }

    const timestamp = Date.now();

    try {
      localStorage.setItem(
        "edutrace_activity_cleared_at",
        String(timestamp)
      );
    } catch {
      // Ignore storage failures.
    }

    setClearedAt(timestamp);
    setRefreshKey((value) => value + 1);
  };

  const clearSearch = () => {
    setSearchText("");
  };

  return (
    <div className="activity-page">
      <div className="activity-shell">

        {/* HEADER */}
        <header className="activity-header">
          <div>
            <div className="activity-eyebrow">
              <ActivityIcon size={15} />
              LEARNING TIMELINE
            </div>

            <h1>Activity</h1>

            <p>
              A complete timeline of your learning,
              practice, goals and progress inside EduTrace.
            </p>
          </div>

          <div className="activity-header-actions">
            <button
              type="button"
              className="activity-action-btn"
              onClick={handleRefresh}
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              className="activity-action-btn danger"
              onClick={handleClearActivity}
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        </header>

        {/* SUMMARY */}
        <section className="activity-summary-grid">
          <div className="activity-summary-card">
            <div className="activity-summary-icon purple">
              <ActivityIcon size={20} />
            </div>

            <div>
              <span>Total Activity</span>
              <strong>
                {data.allActivities.length}
              </strong>
              <small>
                Recorded learning actions
              </small>
            </div>
          </div>

          <div className="activity-summary-card">
            <div className="activity-summary-icon blue">
              <Clock3 size={20} />
            </div>

            <div>
              <span>This Week</span>
              <strong>
                {data.weekCount}
              </strong>
              <small>
                Activity in the current week
              </small>
            </div>
          </div>

          <div className="activity-summary-card">
            <div className="activity-summary-icon orange">
              <Flame size={20} />
            </div>

            <div>
              <span>Today</span>
              <strong>
                {data.todayCount}
              </strong>
              <small>
                Actions completed today
              </small>
            </div>
          </div>

          <div className="activity-summary-card">
            <div className="activity-summary-icon violet">
              <Bot size={20} />
            </div>

            <div>
              <span>AI Sessions</span>
              <strong>
                {data.aiCount}
              </strong>
              <small>
                AI learning interactions
              </small>
            </div>
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="activity-toolbar">
          <div className="activity-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search your activity..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />

            {searchText && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            type="button"
            className={`activity-filter-toggle ${
              showFilters ? "active" : ""
            }`}
            onClick={() =>
              setShowFilters((value) => !value)
            }
          >
            <Filter size={16} />
            Filters
          </button>

          <div className="activity-period">
            <button
              type="button"
              className={
                period === "all" ? "active" : ""
              }
              onClick={() => setPeriod("all")}
            >
              All
            </button>

            <button
              type="button"
              className={
                period === "today" ? "active" : ""
              }
              onClick={() => setPeriod("today")}
            >
              Today
            </button>

            <button
              type="button"
              className={
                period === "week" ? "active" : ""
              }
              onClick={() => setPeriod("week")}
            >
              This Week
            </button>
          </div>
        </section>

        {/* FILTERS */}
        {showFilters && (
          <section className="activity-filter-panel">
            <div className="activity-filter-title">
              <Filter size={15} />
              Activity Type
            </div>

            <div className="activity-filter-list">
              {FILTERS.map((filter) => (
                <button
                  type="button"
                  key={filter.id}
                  className={
                    activeFilter === filter.id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveFilter(filter.id)
                  }
                >
                  {filter.label}

                  {filter.id === "all" && (
                    <span>
                      {data.allActivities.length}
                    </span>
                  )}

                  {filter.id === "ai" && (
                    <span>{data.aiCount}</span>
                  )}

                  {filter.id === "quiz" && (
                    <span>{data.quizCount}</span>
                  )}

                  {filter.id === "arena" && (
                    <span>{data.arenaCount}</span>
                  )}

                  {filter.id === "goal" && (
                    <span>{data.goalCount}</span>
                  )}

                  {filter.id === "achievement" && (
                    <span>
                      {data.achievementCount}
                    </span>
                  )}

                  {filter.id === "study" && (
                    <span>{data.studyCount}</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* TIMELINE */}
        <section className="activity-content">
          <div className="activity-content-header">
            <div>
              <span className="activity-section-kicker">
                TIMELINE
              </span>

              <h2>
                {activeFilter === "all"
                  ? "Your recent activity"
                  : FILTERS.find(
                      (filter) =>
                        filter.id === activeFilter
                    )?.label}
              </h2>
            </div>

            <span className="activity-count">
              {data.visibleActivities.length} item
              {data.visibleActivities.length === 1
                ? ""
                : "s"}
            </span>
          </div>

          {data.visibleActivities.length > 0 ? (
            <div className="activity-timeline">
              {data.visibleActivities.map(
                (item, index) => {
                  const Icon =
                    item.icon || ActivityIcon;

                  return (
                    <article
                      className="activity-item"
                      key={item.id}
                    >
                      <div className="activity-line">
                        <div
                          className={`activity-timeline-icon ${item.accent}`}
                        >
                          <Icon size={18} />
                        </div>

                        {index !==
                          data.visibleActivities.length - 1 && (
                          <div className="activity-connector" />
                        )}
                      </div>

                      <div className="activity-item-card">
                        <div className="activity-item-main">
                          <div className="activity-item-heading">
                            <div>
                              <span
                                className={`activity-type ${item.accent}`}
                              >
                                {item.type === "ai"
                                  ? "AI LEARNING"
                                  : item.type === "quiz"
                                    ? "QUIZ"
                                    : item.type === "arena"
                                      ? "ARENA"
                                      : item.type === "goal"
                                        ? "GOAL"
                                        : item.type ===
                                            "achievement"
                                          ? "ACHIEVEMENT"
                                          : "STUDY PLAN"}
                              </span>

                              <h3>
                                {item.title}
                              </h3>
                            </div>

                            <span className="activity-time">
                              {formatRelativeTime(
                                item.date
                              )}
                            </span>
                          </div>

                          <p>
                            {item.description}
                          </p>

                          <div className="activity-item-footer">
                            <span className="activity-meta">
                              {item.type === "ai" && (
                                <Bot size={13} />
                              )}

                              {item.type === "quiz" && (
                                <GraduationCap size={13} />
                              )}

                              {item.type === "arena" && (
                                <Gamepad2 size={13} />
                              )}

                              {item.type === "goal" && (
                                <Target size={13} />
                              )}

                              {item.type ===
                                "achievement" && (
                                <Trophy size={13} />
                              )}

                              {item.type === "study" && (
                                <BookOpen size={13} />
                              )}

                              {item.meta}
                            </span>

                            <span className="activity-date">
                              <CalendarDays size={12} />
                              {formatFullDate(
                                item.date
                              )}
                            </span>

                            {item.type === "quiz" &&
                              item.score !== undefined && (
                                <span className="activity-score">
                                  {item.score}%
                                </span>
                              )}

                            {item.type === "goal" &&
                              item.score !== undefined && (
                                <span className="activity-score">
                                  {Math.round(
                                    item.score
                                  )}
                                  %
                                </span>
                              )}

                            {item.type ===
                              "achievement" &&
                              item.score > 0 && (
                                <span className="activity-xp">
                                  <Zap size={12} />
                                  +{item.score} XP
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          ) : (
            <div className="activity-empty">
              <div className="activity-empty-icon">
                <ActivityIcon size={30} />
              </div>

              <h3>No activity found</h3>

              <p>
                {searchText
                  ? "Try a different search term."
                  : "Start learning, complete a quiz or use Learning Arena to create activity."}
              </p>

              {(searchText ||
                activeFilter !== "all" ||
                period !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchText("");
                    setActiveFilter("all");
                    setPeriod("all");
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* ACTIVITY BREAKDOWN */}
        <section className="activity-breakdown">
          <div className="activity-breakdown-card">
            <div className="breakdown-icon purple">
              <Bot size={18} />
            </div>
            <span>AI Learning</span>
            <strong>{data.aiCount}</strong>
          </div>

          <div className="activity-breakdown-card">
            <div className="breakdown-icon blue">
              <GraduationCap size={18} />
            </div>
            <span>Quizzes</span>
            <strong>{data.quizCount}</strong>
          </div>

          <div className="activity-breakdown-card">
            <div className="breakdown-icon orange">
              <Gamepad2 size={18} />
            </div>
            <span>Arena</span>
            <strong>{data.arenaCount}</strong>
          </div>

          <div className="activity-breakdown-card">
            <div className="breakdown-icon violet">
              <Target size={18} />
            </div>
            <span>Goals</span>
            <strong>{data.goalCount}</strong>
          </div>

          <div className="activity-breakdown-card">
            <div className="breakdown-icon gold">
              <Award size={18} />
            </div>
            <span>Achievements</span>
            <strong>
              {data.achievementCount}
            </strong>
          </div>

          <div className="activity-breakdown-card">
            <div className="breakdown-icon cyan">
              <BookOpen size={18} />
            </div>
            <span>Study Plan</span>
            <strong>{data.studyCount}</strong>
          </div>
        </section>

        <footer className="activity-footer">
          <div>
            <CheckCircle2 size={15} />
            <span>
              Activity is connected to your EduTrace
              learning workspace.
            </span>
          </div>

          <span>
            Local activity timeline
          </span>
        </footer>
      </div>
    </div>
  );
}

export default Activity;