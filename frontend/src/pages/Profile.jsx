import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  Trophy,
  Star,
  Flame,
  Zap,
  Target,
  Brain,
  BookOpen,
  ClipboardCheck,
  Award,
  Pencil,
  Check,
  X,
  Camera,
  GraduationCap,
  CalendarDays,
  BarChart3,
  Sparkles,
  Medal,
  Clock3,
  Save,
  RotateCcw,
} from "lucide-react";

import "./profile.css";

const PROFILE_KEY = "edutrace_profile";
const USER_KEY = "edutrace_user";
const EDU_ID_KEY = "edutrace_edu_id";
const QUIZ_KEY = "edutrace_quiz_results";
const GOALS_KEY = "edutrace_goals";
const AI_HISTORY_KEY = "edutrace_ai_history";
const ACHIEVEMENTS_KEY = "edutrace_achievements";
const STUDY_PLAN_KEY = "edutrace_study_plan";

const DEFAULT_PROFILE = {
  name: "EduTrace User",
  email: "learner@edutrace.ai",
  role: "Learner",
  learningGoal: "Exam Preparation",
  bio: "Building consistent learning habits with EduTrace AI.",
  avatar: "",
  institution: "EduTrace Learning Workspace",
  joined: "2026",
};

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

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));

    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue: JSON.stringify(value),
      })
    );

    return true;
  } catch {
    return false;
  }
}

function getArray(key) {
  const value = readStorage(key, []);
  return Array.isArray(value) ? value : [];
}

function formatDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  const clean = String(name || "EduTrace User").trim();

  if (!clean) return "EU";

  const parts = clean.split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function calculateStreak() {
  const quizResults = getArray(QUIZ_KEY);
  const aiHistory = getArray(AI_HISTORY_KEY);

  const dates = [
    ...quizResults.map((item) => item.completedAt || item.createdAt),
    ...aiHistory.map(
      (item) => item.createdAt || item.timestamp || item.date
    ),
  ]
    .filter(Boolean)
    .map((value) => {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) return null;

      return date.toISOString().slice(0, 10);
    })
    .filter(Boolean);

  const uniqueDates = [...new Set(dates)].sort().reverse();

  if (!uniqueDates.length) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayString = today.toISOString().slice(0, 10);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayString = yesterday.toISOString().slice(0, 10);

  if (
    uniqueDates[0] !== todayString &&
    uniqueDates[0] !== yesterdayString
  ) {
    return 0;
  }

  let streak = 0;
  let expectedDate =
    uniqueDates[0] === todayString ? today : yesterday;

  for (const dateString of uniqueDates) {
    const expectedString = expectedDate.toISOString().slice(0, 10);

    if (dateString !== expectedString) {
      break;
    }

    streak += 1;

    expectedDate = new Date(expectedDate);
    expectedDate.setDate(expectedDate.getDate() - 1);
  }

  return streak;
}

function calculateXP() {
  const quizResults = getArray(QUIZ_KEY);
  const goals = getArray(GOALS_KEY);
  const achievements = getArray(ACHIEVEMENTS_KEY);
  const aiHistory = getArray(AI_HISTORY_KEY);
  const studyPlan = readStorage(STUDY_PLAN_KEY, null);

  let xp = 100;

  quizResults.forEach((quiz) => {
    const percentage = Number(quiz.percentage || 0);

    if (percentage >= 90) {
      xp += 150;
    } else if (percentage >= 75) {
      xp += 100;
    } else if (percentage >= 50) {
      xp += 60;
    } else {
      xp += 30;
    }
  });

  goals.forEach((goal) => {
    const progress = Number(goal.progress || 0);

    xp += Math.round(progress * 2);
  });

  xp += aiHistory.length * 15;

  achievements.forEach((achievement) => {
    if (
      achievement.claimed ||
      achievement.unlocked ||
      achievement.completed
    ) {
      xp += Number(achievement.xp || achievement.reward || 0);
    }
  });

  if (studyPlan) {
    xp += 50;
  }

  return xp;
}

function getLevel(xp) {
  if (xp >= 5000) return 10;
  if (xp >= 4000) return 9;
  if (xp >= 3200) return 8;
  if (xp >= 2500) return 7;
  if (xp >= 1900) return 6;
  if (xp >= 1400) return 5;
  if (xp >= 1000) return 4;
  if (xp >= 650) return 3;
  if (xp >= 350) return 2;

  return 1;
}

function getLevelProgress(xp) {
  const level = getLevel(xp);

  const thresholds = {
    1: [0, 350],
    2: [350, 650],
    3: [650, 1000],
    4: [1000, 1400],
    5: [1400, 1900],
    6: [1900, 2500],
    7: [2500, 3200],
    8: [3200, 4000],
    9: [4000, 5000],
    10: [5000, 6000],
  };

  const [start, end] = thresholds[level] || [0, 350];

  const percentage =
    level >= 10
      ? 100
      : Math.min(
          100,
          Math.max(0, ((xp - start) / (end - start)) * 100)
        );

  return {
    level,
    percentage,
    nextXP: end,
  };
}

function getQuizStats() {
  const quizzes = getArray(QUIZ_KEY);

  let correct = 0;
  let wrong = 0;
  let attempted = 0;

  quizzes.forEach((quiz) => {
    correct += Number(quiz.correct || 0);
    wrong += Number(quiz.wrong || 0);
    attempted += Number(
      quiz.attempted ??
        Number(quiz.correct || 0) + Number(quiz.wrong || 0)
    );
  });

  const average =
    quizzes.length > 0
      ? Math.round(
          quizzes.reduce(
            (sum, quiz) => sum + Number(quiz.percentage || 0),
            0
          ) / quizzes.length
        )
      : 0;

  return {
    total: quizzes.length,
    correct,
    wrong,
    attempted,
    average,
  };
}

function getGoalStats() {
  const goals = getArray(GOALS_KEY);

  const completed = goals.filter(
    (goal) =>
      goal.completed === true ||
      Number(goal.progress || 0) >= 100
  ).length;

  const active = goals.length - completed;

  const progress =
    goals.length > 0
      ? Math.round(
          goals.reduce(
            (sum, goal) => sum + Number(goal.progress || 0),
            0
          ) / goals.length
        )
      : 0;

  return {
    total: goals.length,
    completed,
    active,
    progress,
  };
}

function getAchievementStats() {
  const achievements = getArray(ACHIEVEMENTS_KEY);

  const unlocked = achievements.filter(
    (item) =>
      item.claimed ||
      item.unlocked ||
      item.completed
  ).length;

  return {
    total: achievements.length,
    unlocked,
  };
}

function buildRecentActivity() {
  const quizzes = getArray(QUIZ_KEY);
  const goals = getArray(GOALS_KEY);
  const aiHistory = getArray(AI_HISTORY_KEY);

  const activities = [];

  quizzes.slice(-5).forEach((quiz, index) => {
    activities.push({
      id: `quiz-${index}-${quiz.completedAt || index}`,
      type: "quiz",
      title: `Completed ${quiz.subject || "Quiz"}`,
      description: `${quiz.correct || 0} correct answers • ${
        quiz.percentage || 0
      }%`,
      date: quiz.completedAt,
      icon: ClipboardCheck,
    });
  });

  goals.slice(-5).forEach((goal, index) => {
    activities.push({
      id: `goal-${index}-${goal.title || index}`,
      type: "goal",
      title: goal.title || "Learning goal",
      description: `${goal.progress || 0}% progress`,
      date: goal.updatedAt || goal.createdAt,
      icon: Target,
    });
  });

  aiHistory.slice(-5).forEach((item, index) => {
    activities.push({
      id: `ai-${index}-${item.createdAt || index}`,
      type: "ai",
      title: "AI learning session",
      description:
        item.message ||
        item.prompt ||
        "Asked EduTrace AI for help",
      date: item.createdAt || item.timestamp,
      icon: Brain,
    });
  });

  return activities
    .sort((a, b) => {
      const aDate = new Date(a.date || 0).getTime();
      const bDate = new Date(b.date || 0).getTime();

      return bDate - aDate;
    })
    .slice(0, 6);
}

function Avatar({ profile, size = "large" }) {
  const initials = getInitials(profile.name);

  if (profile.avatar) {
    return (
      <img
        className={`profile-avatar profile-avatar-${size}`}
        src={profile.avatar}
        alt={profile.name}
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.nextElementSibling?.classList.remove(
            "avatar-hidden"
          );
        }}
      />
    );
  }

  return (
    <div className={`profile-avatar profile-avatar-${size}`}>
      {initials}
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(() => {
    const storedProfile = readStorage(
      PROFILE_KEY,
      DEFAULT_PROFILE
    );

    const storedUser = readStorage(USER_KEY, {});

    return {
      ...DEFAULT_PROFILE,
      ...(storedProfile || {}),
      ...(storedUser || {}),
    };
  });

  const [editForm, setEditForm] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleStorage = () => {
      setRefreshKey((value) => value + 1);
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const eduId = useMemo(() => {
    const existing = localStorage.getItem(EDU_ID_KEY);

    if (existing) {
      return existing;
    }

    const generated = `EDU${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    localStorage.setItem(EDU_ID_KEY, generated);

    return generated;
  }, []);

  const quizStats = useMemo(
    () => getQuizStats(),
    [refreshKey]
  );

  const goalStats = useMemo(
    () => getGoalStats(),
    [refreshKey]
  );

  const achievementStats = useMemo(
    () => getAchievementStats(),
    [refreshKey]
  );

  const streak = useMemo(
    () => calculateStreak(),
    [refreshKey]
  );

  const xp = useMemo(
    () => calculateXP(),
    [refreshKey]
  );

  const levelInfo = useMemo(
    () => getLevelProgress(xp),
    [xp]
  );

  const activities = useMemo(
    () => buildRecentActivity(),
    [refreshKey]
  );

  const memberSince = profile.joined || "2026";

  const handleEditOpen = () => {
    setEditForm({
      ...DEFAULT_PROFILE,
      ...profile,
    });

    setSaved(false);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditForm({
      ...profile,
    });

    setEditing(false);
    setSaved(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = (event) => {
    event.preventDefault();

    const cleanedProfile = {
      ...DEFAULT_PROFILE,
      ...editForm,
      name:
        editForm.name?.trim() ||
        DEFAULT_PROFILE.name,
      email:
        editForm.email?.trim() ||
        DEFAULT_PROFILE.email,
      role:
        editForm.role?.trim() ||
        DEFAULT_PROFILE.role,
      learningGoal:
        editForm.learningGoal?.trim() ||
        DEFAULT_PROFILE.learningGoal,
      bio:
        editForm.bio?.trim() ||
        DEFAULT_PROFILE.bio,
      avatar:
        editForm.avatar?.trim() || "",
      institution:
        editForm.institution?.trim() ||
        DEFAULT_PROFILE.institution,
    };

    setProfile(cleanedProfile);

    writeStorage(PROFILE_KEY, cleanedProfile);

    const existingUser = readStorage(USER_KEY, {});

    writeStorage(USER_KEY, {
      ...existingUser,
      name: cleanedProfile.name,
      email: cleanedProfile.email,
      role: cleanedProfile.role,
      avatar: cleanedProfile.avatar,
    });

    setSaved(true);

    setTimeout(() => {
      setEditing(false);
      setSaved(false);
    }, 800);
  };

  const resetProfile = () => {
    const confirmed = window.confirm(
      "Reset your profile information to the default EduTrace profile?"
    );

    if (!confirmed) return;

    const reset = {
      ...DEFAULT_PROFILE,
    };

    setProfile(reset);
    setEditForm(reset);

    writeStorage(PROFILE_KEY, reset);

    const existingUser = readStorage(USER_KEY, {});

    writeStorage(USER_KEY, {
      ...existingUser,
      name: reset.name,
      email: reset.email,
      role: reset.role,
      avatar: "",
    });
  };

  return (
    <div className="profile-page">
      <div className="profile-background-orb profile-orb-one" />
      <div className="profile-background-orb profile-orb-two" />

      <div className="profile-container">
        <header className="profile-page-header">
          <div>
            <div className="profile-eyebrow">
              <Sparkles size={15} />
              Personal Workspace
            </div>

            <h1>Your Profile</h1>

            <p>
              Manage your EduTrace identity, learning preferences
              and personal progress.
            </p>
          </div>

          <button
            className="profile-edit-button"
            onClick={handleEditOpen}
            type="button"
          >
            <Pencil size={17} />
            Edit Profile
          </button>
        </header>

        <section className="profile-hero-card">
          <div className="profile-hero-main">
            <div className="profile-avatar-wrapper">
              <Avatar profile={profile} size="large" />

              <button
                type="button"
                className="avatar-camera"
                onClick={handleEditOpen}
                title="Edit profile photo"
              >
                <Camera size={15} />
              </button>
            </div>

            <div className="profile-identity">
              <div className="profile-name-row">
                <h2>{profile.name}</h2>

                <span className="verified-badge">
                  <ShieldCheck size={14} />
                  Verified Learner
                </span>
              </div>

              <p className="profile-role">
                {profile.role}
              </p>

              <p className="profile-bio">
                {profile.bio}
              </p>

              <div className="profile-meta-row">
                <span>
                  <Mail size={14} />
                  {profile.email}
                </span>

                <span>
                  <GraduationCap size={14} />
                  {profile.institution}
                </span>

                <span>
                  <CalendarDays size={14} />
                  Member since {memberSince}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-id-card">
            <span>EDU ID</span>
            <strong>{eduId}</strong>
            <small>Personal learning identity</small>
          </div>
        </section>

        <section className="profile-stat-grid">
          <div className="profile-stat-card">
            <div className="stat-icon purple">
              <Zap size={20} />
            </div>

            <div>
              <span>Total XP</span>
              <strong>{xp.toLocaleString()}</strong>
              <small>Level {levelInfo.level}</small>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="stat-icon orange">
              <Flame size={20} />
            </div>

            <div>
              <span>Learning Streak</span>
              <strong>{streak} days</strong>
              <small>Keep learning</small>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="stat-icon blue">
              <ClipboardCheck size={20} />
            </div>

            <div>
              <span>Quizzes</span>
              <strong>{quizStats.total}</strong>
              <small>{quizStats.average}% average</small>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="stat-icon gold">
              <Trophy size={20} />
            </div>

            <div>
              <span>Achievements</span>
              <strong>{achievementStats.unlocked}</strong>
              <small>Unlocked badges</small>
            </div>
          </div>
        </section>

        <div className="profile-content-grid">
          <main className="profile-main-column">
            <section className="profile-card">
              <div className="section-heading">
                <div>
                  <span className="section-label">
                    LEARNING LEVEL
                  </span>

                  <h3>Level {levelInfo.level} Learner</h3>
                </div>

                <div className="level-badge">
                  <Star size={16} />
                  Level {levelInfo.level}
                </div>
              </div>

              <div className="level-progress">
                <div className="level-progress-top">
                  <span>
                    {xp.toLocaleString()} XP
                  </span>

                  <span>
                    {levelInfo.level >= 10
                      ? "Max level"
                      : `${levelInfo.nextXP.toLocaleString()} XP`}
                  </span>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${levelInfo.percentage}%`,
                    }}
                  />
                </div>

                <p>
                  Keep learning, complete quizzes and achieve
                  your goals to earn more XP.
                </p>
              </div>
            </section>

            <section className="profile-card">
              <div className="section-heading">
                <div>
                  <span className="section-label">
                    LEARNING SNAPSHOT
                  </span>

                  <h3>Your progress</h3>
                </div>

                <BarChart3 size={21} />
              </div>

              <div className="snapshot-grid">
                <div className="snapshot-item">
                  <div className="snapshot-icon">
                    <Target size={18} />
                  </div>

                  <div>
                    <strong>{goalStats.total}</strong>
                    <span>Total Goals</span>
                  </div>
                </div>

                <div className="snapshot-item">
                  <div className="snapshot-icon">
                    <Check size={18} />
                  </div>

                  <div>
                    <strong>{goalStats.completed}</strong>
                    <span>Completed Goals</span>
                  </div>
                </div>

                <div className="snapshot-item">
                  <div className="snapshot-icon">
                    <BookOpen size={18} />
                  </div>

                  <div>
                    <strong>{goalStats.progress}%</strong>
                    <span>Goal Progress</span>
                  </div>
                </div>

                <div className="snapshot-item">
                  <div className="snapshot-icon">
                    <Brain size={18} />
                  </div>

                  <div>
                    <strong>{quizStats.attempted}</strong>
                    <span>Questions Attempted</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="profile-card">
              <div className="section-heading">
                <div>
                  <span className="section-label">
                    RECENT ACTIVITY
                  </span>

                  <h3>Learning timeline</h3>
                </div>

                <Clock3 size={20} />
              </div>

              {activities.length === 0 ? (
                <div className="empty-activity">
                  <div className="empty-icon">
                    <Brain size={24} />
                  </div>

                  <h4>No activity yet</h4>

                  <p>
                    Start a quiz, chat with EduTrace AI or create
                    a goal to see your learning activity here.
                  </p>
                </div>
              ) : (
                <div className="activity-list">
                  {activities.map((activity) => {
                    const Icon = activity.icon;

                    return (
                      <div
                        className="activity-item"
                        key={activity.id}
                      >
                        <div className="activity-icon">
                          <Icon size={17} />
                        </div>

                        <div className="activity-content">
                          <strong>{activity.title}</strong>

                          <p>{activity.description}</p>
                        </div>

                        <time>
                          {formatDate(activity.date)}
                        </time>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>

          <aside className="profile-side-column">
            <section className="profile-card goal-card">
              <div className="section-heading">
                <div>
                  <span className="section-label">
                    CURRENT FOCUS
                  </span>

                  <h3>Learning Goal</h3>
                </div>

                <Target size={20} />
              </div>

              <div className="focus-box">
                <div className="focus-icon">
                  <GraduationCap size={22} />
                </div>

                <div>
                  <strong>{profile.learningGoal}</strong>
                  <span>
                    Your current preparation focus
                  </span>
                </div>
              </div>

              <div className="focus-progress">
                <div className="focus-progress-label">
                  <span>Overall progress</span>
                  <strong>{goalStats.progress}%</strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${goalStats.progress}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="profile-card">
              <div className="section-heading">
                <div>
                  <span className="section-label">
                    QUIZ PERFORMANCE
                  </span>

                  <h3>Performance</h3>
                </div>

                <Medal size={20} />
              </div>

              <div className="performance-main">
                <div className="performance-circle">
                  <strong>{quizStats.average}%</strong>
                  <span>Average</span>
                </div>
              </div>

              <div className="performance-stats">
                <div>
                  <span>Correct</span>
                  <strong>{quizStats.correct}</strong>
                </div>

                <div>
                  <span>Wrong</span>
                  <strong>{quizStats.wrong}</strong>
                </div>

                <div>
                  <span>Attempted</span>
                  <strong>{quizStats.attempted}</strong>
                </div>
              </div>
            </section>

            <section className="profile-card">
              <div className="section-heading">
                <div>
                  <span className="section-label">
                    ACHIEVEMENTS
                  </span>

                  <h3>Badges</h3>
                </div>

                <Award size={20} />
              </div>

              <div className="achievement-summary">
                <div className="achievement-big-icon">
                  <Trophy size={25} />
                </div>

                <div>
                  <strong>
                    {achievementStats.unlocked}
                  </strong>

                  <span>
                    {achievementStats.total > 0
                      ? `of ${achievementStats.total} unlocked`
                      : "Start earning badges"}
                  </span>
                </div>
              </div>

              <div className="badge-row">
                <div className="mini-badge">
                  <Zap size={16} />
                </div>

                <div className="mini-badge">
                  <Flame size={16} />
                </div>

                <div className="mini-badge">
                  <Target size={16} />
                </div>

                <div className="mini-badge">
                  <Brain size={16} />
                </div>
              </div>
            </section>

            <button
              className="profile-reset-button"
              type="button"
              onClick={resetProfile}
            >
              <RotateCcw size={16} />
              Reset Profile Information
            </button>
          </aside>
        </div>
      </div>

      {editing && (
        <div
          className="profile-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCancel();
            }
          }}
        >
          <div className="profile-edit-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">
                  PERSONAL INFORMATION
                </span>

                <h2>Edit Profile</h2>

                <p>
                  Update your EduTrace profile information.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={handleCancel}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="edit-avatar-section">
                <Avatar profile={editForm} size="medium" />

                <div>
                  <strong>Profile picture</strong>

                  <p>
                    Add an image URL if you want to display a
                    profile picture.
                  </p>

                  <input
                    name="avatar"
                    value={editForm.avatar || ""}
                    onChange={handleChange}
                    placeholder="https://example.com/profile.jpg"
                  />
                </div>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>
                    <User size={15} />
                    Full Name
                  </span>

                  <input
                    name="name"
                    value={editForm.name || ""}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                  />
                </label>

                <label className="form-field">
                  <span>
                    <Mail size={15} />
                    Email
                  </span>

                  <input
                    name="email"
                    type="email"
                    value={editForm.email || ""}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </label>

                <label className="form-field">
                  <span>
                    <GraduationCap size={15} />
                    Role
                  </span>

                  <select
                    name="role"
                    value={editForm.role || ""}
                    onChange={handleChange}
                  >
                    <option>Learner</option>
                    <option>Student</option>
                    <option>College Student</option>
                    <option>Working Professional</option>
                    <option>Exam Aspirant</option>
                    <option>Developer</option>
                    <option>Researcher</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>
                    <Target size={15} />
                    Learning Goal
                  </span>

                  <select
                    name="learningGoal"
                    value={editForm.learningGoal || ""}
                    onChange={handleChange}
                  >
                    <option>Exam Preparation</option>
                    <option>Skill Development</option>
                    <option>Career Preparation</option>
                    <option>Interview Preparation</option>
                    <option>Academic Learning</option>
                    <option>Competitive Exams</option>
                    <option>Personal Learning</option>
                  </select>
                </label>

                <label className="form-field full-width">
                  <span>
                    <BookOpen size={15} />
                    Institution / Organization
                  </span>

                  <input
                    name="institution"
                    value={editForm.institution || ""}
                    onChange={handleChange}
                    placeholder="College, school or organization"
                  />
                </label>

                <label className="form-field full-width">
                  <span>
                    <Brain size={15} />
                    About You
                  </span>

                  <textarea
                    name="bio"
                    value={editForm.bio || ""}
                    onChange={handleChange}
                    placeholder="Tell something about your learning journey..."
                    rows={4}
                  />
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-action"
                >
                  {saved ? (
                    <>
                      <Check size={17} />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}