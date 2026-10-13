import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Trophy,
  Target,
  Brain,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Sparkles,
  AlertCircle,
  Info,
  Clock,
  Filter,
  X,
  RefreshCw,
} from "lucide-react";
import "./notifications.css";

const STORAGE_KEY = "edutrace_notifications";
const QUIZ_RESULTS_KEY = "edutrace_quiz_results";
const GOALS_KEY = "edutrace_goals";
const ACHIEVEMENTS_KEY = "edutrace_achievements";
const STUDY_PLAN_KEY = "edutrace_study_plan";

const TYPE_CONFIG = {
  achievement: {
    label: "Achievement",
    icon: Trophy,
    className: "achievement",
  },
  quiz: {
    label: "Quiz",
    icon: ClipboardCheck,
    className: "quiz",
  },
  goal: {
    label: "Goal",
    icon: Target,
    className: "goal",
  },
  ai: {
    label: "AI Learning",
    icon: Brain,
    className: "ai",
  },
  knowledge: {
    label: "Knowledge Vault",
    icon: BookOpen,
    className: "knowledge",
  },
  study: {
    label: "Study Plan",
    icon: GraduationCap,
    className: "study",
  },
  system: {
    label: "System",
    icon: Info,
    className: "system",
  },
};

const DEFAULT_NOTIFICATIONS = [
  {
    id: "welcome-notification",
    type: "system",
    title: "Welcome to EduTrace",
    message:
      "Your personal AI learning and productivity workspace is ready.",
    timestamp: new Date().toISOString(),
    read: false,
    priority: "normal",
  },
  {
    id: "learning-tip",
    type: "ai",
    title: "Your AI tutor is ready",
    message:
      "Ask EduTrace to explain a concept, prepare revision questions, or help you understand your study material.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    priority: "normal",
  },
];

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

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
}

function makeId(prefix = "notification") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getInitialNotifications() {
  const stored = readStorage(STORAGE_KEY, null);

  if (Array.isArray(stored)) {
    return stored;
  }

  writeStorage(STORAGE_KEY, DEFAULT_NOTIFICATIONS);

  return DEFAULT_NOTIFICATIONS;
}

function formatTime(timestamp) {
  if (!timestamp) {
    return "Recently";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const now = new Date();
  const difference = now.getTime() - date.getTime();

  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (hours < 24) {
    return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  }

  if (days < 7) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function createActivityNotifications(existing) {
  const generated = [...existing];

  const quizzes = readStorage(QUIZ_RESULTS_KEY, []);

  const quizResults = Array.isArray(quizzes)
    ? quizzes
    : Array.isArray(quizzes?.results)
      ? quizzes.results
      : [];

  quizResults.slice(-10).forEach((quiz, index) => {
    const completedAt =
      quiz.completedAt ||
      quiz.date ||
      new Date().toISOString();

    const id = `quiz-${completedAt}-${index}`;

    if (
      generated.some(
        (notification) => notification.sourceId === id
      )
    ) {
      return;
    }

    const percentage =
      quiz.percentage ??
      quiz.score ??
      0;

    generated.push({
      id: makeId("quiz"),
      sourceId: id,
      type: "quiz",
      title: "Quiz completed",
      message: `You completed ${
        quiz.subject || "your quiz"
      } with ${percentage}% accuracy.`,
      timestamp: completedAt,
      read: true,
      priority:
        Number(percentage) >= 90
          ? "high"
          : "normal",
    });
  });

  const goals = readStorage(GOALS_KEY, []);

  if (Array.isArray(goals)) {
    goals.forEach((goal, index) => {
      const completed =
        goal.completed === true ||
        goal.status === "completed" ||
        Number(goal.progress) >= 100;

      if (!completed) {
        return;
      }

      const id = `goal-${goal.id || index}-completed`;

      if (
        generated.some(
          (notification) => notification.sourceId === id
        )
      ) {
        return;
      }

      generated.push({
        id: makeId("goal"),
        sourceId: id,
        type: "goal",
        title: "Goal completed 🎯",
        message: `Great work! You completed "${
          goal.title || goal.name || "your goal"
        }".`,
        timestamp:
          goal.completedAt ||
          new Date().toISOString(),
        read: false,
        priority: "high",
      });
    });
  }

  const achievements = readStorage(
    ACHIEVEMENTS_KEY,
    []
  );

  if (Array.isArray(achievements)) {
    achievements.forEach((achievementId) => {
      const id = `achievement-${achievementId}`;

      if (
        generated.some(
          (notification) => notification.sourceId === id
        )
      ) {
        return;
      }

      generated.push({
        id: makeId("achievement"),
        sourceId: id,
        type: "achievement",
        title: "Achievement unlocked 🏆",
        message:
          "You unlocked a new EduTrace achievement. Keep going!",
        timestamp: new Date().toISOString(),
        read: false,
        priority: "high",
      });
    });
  }

  const studyPlan = readStorage(
    STUDY_PLAN_KEY,
    null
  );

  if (studyPlan) {
    const id = "study-plan-created";

    if (
      !generated.some(
        (notification) =>
          notification.sourceId === id
      )
    ) {
      generated.push({
        id: makeId("study"),
        sourceId: id,
        type: "study",
        title: "Study plan is ready",
        message:
          "Your EduTrace study plan is available. Start your next learning session.",
        timestamp: new Date().toISOString(),
        read: true,
        priority: "normal",
      });
    }
  }

  return generated.slice(-50).reverse();
}

export default function Notifications() {
  const [notifications, setNotifications] =
    useState(getInitialNotifications);

  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [showFilters, setShowFilters] =
    useState(false);

  useEffect(() => {
    const enhanced =
      createActivityNotifications(
        getInitialNotifications()
      );

    setNotifications(enhanced);
    writeStorage(STORAGE_KEY, enhanced);
  }, []);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.read
      ).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (
        filter === "unread" &&
        notification.read
      ) {
        return false;
      }

      if (
        filter === "read" &&
        !notification.read
      ) {
        return false;
      }

      if (
        category !== "all" &&
        notification.type !== category
      ) {
        return false;
      }

      return true;
    });
  }, [notifications, filter, category]);

  const updateNotifications = (next) => {
    setNotifications(next);
    writeStorage(STORAGE_KEY, next);
  };

  const markAsRead = (id) => {
    updateNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    updateNotifications(
      notifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const deleteNotification = (id) => {
    updateNotifications(
      notifications.filter(
        (notification) =>
          notification.id !== id
      )
    );
  };

  const clearAll = () => {
    updateNotifications([]);
  };

  const refreshNotifications = () => {
    const current =
      readStorage(STORAGE_KEY, []);

    const enhanced =
      createActivityNotifications(
        Array.isArray(current) ? current : []
      );

    updateNotifications(enhanced);
  };

  const getTypeConfig = (type) =>
    TYPE_CONFIG[type] || TYPE_CONFIG.system;

  return (
    <div className="notifications-page">
      <div className="notifications-shell">
        <section className="notifications-hero">
          <div className="notifications-hero-main">
            <div className="notification-hero-icon">
              <Bell size={30} />
              {unreadCount > 0 && (
                <span>{unreadCount}</span>
              )}
            </div>

            <div>
              <div className="notifications-eyebrow">
                EduTrace Notification Center
              </div>

              <h1>
                Stay in the loop.
              </h1>

              <p>
                Important updates from your learning,
                quizzes, goals, achievements and
                Knowledge Vault — all in one place.
              </p>
            </div>
          </div>

          <div className="notification-hero-stat">
            <span>Unread</span>
            <strong>{unreadCount}</strong>
          </div>
        </section>

        <section className="notification-toolbar">
          <div className="notification-tabs">
            <button
              type="button"
              className={
                filter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("all")
              }
            >
              All
              <span>{notifications.length}</span>
            </button>

            <button
              type="button"
              className={
                filter === "unread"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("unread")
              }
            >
              Unread
              <span>{unreadCount}</span>
            </button>

            <button
              type="button"
              className={
                filter === "read"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("read")
              }
            >
              Read
            </button>
          </div>

          <div className="notification-actions">
            <button
              type="button"
              className="notification-action secondary"
              onClick={() =>
                setShowFilters(
                  !showFilters
                )
              }
            >
              <Filter size={16} />
              Filters
            </button>

            <button
              type="button"
              className="notification-action secondary"
              onClick={refreshNotifications}
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              className="notification-action primary"
              onClick={markAllAsRead}
              disabled={!unreadCount}
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          </div>
        </section>

        {showFilters && (
          <section className="notification-filter-panel">
            <div>
              <span>Category</span>

              <div className="category-filter-list">
                <button
                  type="button"
                  className={
                    category === "all"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCategory("all")
                  }
                >
                  All
                </button>

                {Object.entries(
                  TYPE_CONFIG
                ).map(
                  ([
                    key,
                    config,
                  ]) => {
                    const Icon =
                      config.icon;

                    return (
                      <button
                        type="button"
                        key={key}
                        className={
                          category === key
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setCategory(key)
                        }
                      >
                        <Icon
                          size={14}
                        />
                        {config.label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        )}

        <section className="notification-content">
          <div className="notification-list-header">
            <div>
              <span className="section-kicker">
                Activity
              </span>

              <h2>
                {filter === "unread"
                  ? "Unread notifications"
                  : filter === "read"
                    ? "Read notifications"
                    : "Recent notifications"}
              </h2>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                className="clear-all-button"
                onClick={clearAll}
              >
                <Trash2 size={15} />
                Clear all
              </button>
            )}
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="notifications-empty">
              <div className="empty-bell">
                <Bell size={34} />
              </div>

              <h3>
                {filter === "unread"
                  ? "You're all caught up!"
                  : "No notifications here"}
              </h3>

              <p>
                {filter === "unread"
                  ? "There are no unread updates right now."
                  : "New learning activity and important updates will appear here."}
              </p>

              {filter !== "all" && (
                <button
                  type="button"
                  onClick={() =>
                    setFilter("all")
                  }
                >
                  View all notifications
                </button>
              )}
            </div>
          ) : (
            <div className="notification-list">
              {filteredNotifications.map(
                (notification) => {
                  const config =
                    getTypeConfig(
                      notification.type
                    );

                  const Icon =
                    config.icon;

                  return (
                    <article
                      key={
                        notification.id
                      }
                      className={`notification-item ${
                        notification.read
                          ? "read"
                          : "unread"
                      } ${
                        notification.priority ===
                        "high"
                          ? "high-priority"
                          : ""
                      }`}
                    >
                      <div
                        className={`notification-type-icon ${config.className}`}
                      >
                        <Icon
                          size={21}
                        />
                      </div>

                      <div className="notification-body">
                        <div className="notification-top">
                          <div className="notification-title-row">
                            {!notification.read && (
                              <span className="unread-dot" />
                            )}

                            <h3>
                              {
                                notification.title
                              }
                            </h3>

                            {notification.priority ===
                              "high" && (
                              <span className="priority-badge">
                                Important
                              </span>
                            )}
                          </div>

                          <span className="notification-time">
                            <Clock
                              size={12}
                            />
                            {formatTime(
                              notification.timestamp
                            )}
                          </span>
                        </div>

                        <p>
                          {
                            notification.message
                          }
                        </p>

                        <div className="notification-bottom">
                          <span
                            className={`notification-category ${config.className}`}
                          >
                            {config.label}
                          </span>

                          <div className="notification-item-actions">
                            {!notification.read && (
                              <button
                                type="button"
                                onClick={() =>
                                  markAsRead(
                                    notification.id
                                  )
                                }
                              >
                                <Check
                                  size={14}
                                />
                                Mark read
                              </button>
                            )}

                            <button
                              type="button"
                              className="delete-notification"
                              onClick={() =>
                                deleteNotification(
                                  notification.id
                                )
                              }
                              aria-label="Delete notification"
                            >
                              <Trash2
                                size={14}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section className="notification-footer-card">
          <div className="notification-footer-icon">
            <Sparkles size={21} />
          </div>

          <div>
            <strong>
              EduTrace keeps your learning activity visible
            </strong>

            <p>
              Quiz results, goals, AI learning,
              achievements and study-plan activity can
              appear here automatically.
            </p>
          </div>

          <AlertCircle size={18} />
        </section>
      </div>
    </div>
  );
}
