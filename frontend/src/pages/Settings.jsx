import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Palette,
  Bot,
  BookOpen,
  Bell,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Check,
  RotateCcw,
  Trash2,
  ChevronRight,
  Moon,
  Zap,
  Volume2,
  Eye,
  Database,
  MessageCircle,
  GraduationCap,
  Clock3,
  Brain,
  Trophy,
  Target,
  AlertTriangle,
} from "lucide-react";
import "./settings.css";

const SETTINGS_KEY = "edutrace_preferences";

const DEFAULT_SETTINGS = {
  appearance: {
    theme: "dark",
    compactMode: false,
    animations: true,
  },

  ai: {
    responseStyle: "Friendly",
    explanationLevel: "Detailed",
    autoStartLearning: true,
    showSources: true,
    markdown: true,
  },

  learning: {
    preparationType: "College Exams",
    dailyDuration: "2 Hours",
    difficulty: "Adaptive",
    examples: true,
    practiceQuestions: true,
  },

  notifications: {
    studyReminders: true,
    quizNotifications: true,
    goalReminders: true,
    achievementNotifications: true,
    aiUpdates: true,
  },

  privacy: {
    personalData: false,
    rag: true,
    saveHistory: true,
  },
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(
      SETTINGS_KEY
    );

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const saved = JSON.parse(raw);

    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      appearance: {
        ...DEFAULT_SETTINGS.appearance,
        ...(saved.appearance || {}),
      },
      ai: {
        ...DEFAULT_SETTINGS.ai,
        ...(saved.ai || {}),
      },
      learning: {
        ...DEFAULT_SETTINGS.learning,
        ...(saved.learning || {}),
      },
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(saved.notifications || {}),
      },
      privacy: {
        ...DEFAULT_SETTINGS.privacy,
        ...(saved.privacy || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );

    window.dispatchEvent(
      new CustomEvent(
        "edutrace-settings-updated"
      )
    );

    return true;
  } catch {
    return false;
  }
}

function Toggle({
  checked,
  onChange,
  label,
}) {
  return (
    <button
      type="button"
      className={`settings-toggle ${
        checked ? "active" : ""
      }`}
      onClick={() =>
        onChange(!checked)
      }
      aria-label={label}
      aria-pressed={checked}
    >
      <span />
    </button>
  );
}

function SelectControl({
  value,
  options,
  onChange,
}) {
  return (
    <select
      className="settings-select"
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
    >
      {options.map((option) => (
        <option
          key={option}
          value={option}
        >
          {option}
        </option>
      ))}
    </select>
  );
}

function SettingRow({
  icon,
  title,
  description,
  children,
}) {
  return (
    <div className="settings-row">
      <div className="settings-row-icon">
        {icon}
      </div>

      <div className="settings-row-content">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <div className="settings-row-control">
        {children}
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="settings-section-header">
      <div className="settings-section-icon">
        {icon}
      </div>

      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Settings() {
  const [
    settings,
    setSettings,
  ] = useState(loadSettings);

  const [
    savedMessage,
    setSavedMessage,
  ] = useState("");

  const updateSection = (
    section,
    key,
    value
  ) => {
    setSettings((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        [key]: value,
      },
    }));

    setSavedMessage("");
  };

  const handleSave = () => {
    saveSettings(settings);
    setSavedMessage(
      "Preferences saved successfully"
    );

    window.setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  };

  const handleReset = () => {
    const confirmed =
      window.confirm(
        "Reset all EduTrace settings to their default values?"
      );

    if (!confirmed) {
      return;
    }

    setSettings(
      JSON.parse(
        JSON.stringify(
          DEFAULT_SETTINGS
        )
      )
    );

    saveSettings(DEFAULT_SETTINGS);

    setSavedMessage(
      "Settings restored to defaults"
    );

    window.setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  };

  const handleClearData = () => {
    const confirmed =
      window.confirm(
        "This will remove EduTrace local learning data, quiz results, goals, AI history and preferences. Continue?"
      );

    if (!confirmed) {
      return;
    }

    const keysToRemove = [
      "edutrace_ai_history",
      "edutrace_ai_prefill",
      "edutrace_quiz_results",
      "edutrace_goals",
      "edutrace_achievements",
      "edutrace_study_plan",
      "edutrace_notifications",
      "edutrace_preferences",
    ];

    keysToRemove.forEach(
      (key) =>
        localStorage.removeItem(key)
    );

    setSettings(
      JSON.parse(
        JSON.stringify(
          DEFAULT_SETTINGS
        )
      )
    );

    setSavedMessage(
      "Local learning data cleared"
    );

    window.setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  };

  useEffect(() => {
    const syncSettings = () => {
      setSettings(loadSettings());
    };

    window.addEventListener(
      "storage",
      syncSettings
    );

    window.addEventListener(
      "edutrace-settings-updated",
      syncSettings
    );

    return () => {
      window.removeEventListener(
        "storage",
        syncSettings
      );

      window.removeEventListener(
        "edutrace-settings-updated",
        syncSettings
      );
    };
  }, []);

  return (
    <div className="settings-page">
      <div className="settings-shell">

        {/* HEADER */}

        <section className="settings-hero">
          <div className="settings-hero-glow" />

          <div className="settings-hero-content">
            <div className="settings-hero-icon">
              <SettingsIcon size={25} />
            </div>

            <div>
              <span className="settings-kicker">
                Workspace Configuration
              </span>

              <h1>
                Settings
              </h1>

              <p>
                Personalize how EduTrace
                looks, learns, communicates
                and works for you.
              </p>
            </div>
          </div>

          <div className="settings-status">
            <span />
            Preferences synced locally
          </div>
        </section>

        {/* SAVE BAR */}

        <div className="settings-save-bar">
          <div>
            <Sparkles size={16} />

            <span>
              Your preferences are saved
              locally on this device.
            </span>
          </div>

          <div className="settings-save-actions">
            <button
              type="button"
              className="settings-reset-button"
              onClick={handleReset}
            >
              <RotateCcw size={14} />
              Reset
            </button>

            <button
              type="button"
              className="settings-save-button"
              onClick={handleSave}
            >
              <Check size={15} />
              Save Changes
            </button>
          </div>
        </div>

        {savedMessage && (
          <div className="settings-toast">
            <Check size={15} />
            {savedMessage}
          </div>
        )}

        <div className="settings-layout">

          {/* SIDEBAR */}

          <aside className="settings-navigation">
            <a
              href="#appearance"
              className="active"
            >
              <Palette size={16} />
              Appearance
            </a>

            <a href="#ai">
              <Bot size={16} />
              AI Assistant
            </a>

            <a href="#learning">
              <BookOpen size={16} />
              Learning
            </a>

            <a href="#notifications">
              <Bell size={16} />
              Notifications
            </a>

            <a href="#privacy">
              <Shield size={16} />
              Privacy & Data
            </a>
          </aside>

          {/* CONTENT */}

          <main className="settings-content">

            {/* APPEARANCE */}

            <section
              id="appearance"
              className="settings-card"
            >
              <SectionHeader
                icon={<Palette size={19} />}
                eyebrow="Interface"
                title="Appearance"
                description="Choose how EduTrace feels and behaves on your screen."
              />

              <div className="settings-divider" />

              <SettingRow
                icon={<Moon size={17} />}
                title="Theme"
                description="EduTrace currently uses the premium dark workspace theme."
              >
                <SelectControl
                  value={
                    settings.appearance.theme
                  }
                  options={[
                    "dark",
                    "system",
                  ]}
                  onChange={(value) =>
                    updateSection(
                      "appearance",
                      "theme",
                      value
                    )
                  }
                />
              </SettingRow>

              <SettingRow
                icon={<SlidersHorizontal size={17} />}
                title="Compact mode"
                description="Use tighter spacing for a more information-dense workspace."
              >
                <Toggle
                  checked={
                    settings.appearance
                      .compactMode
                  }
                  onChange={(value) =>
                    updateSection(
                      "appearance",
                      "compactMode",
                      value
                    )
                  }
                  label="Compact mode"
                />
              </SettingRow>

              <SettingRow
                icon={<Zap size={17} />}
                title="Animations"
                description="Enable interface transitions, hover effects and learning motion."
              >
                <Toggle
                  checked={
                    settings.appearance
                      .animations
                  }
                  onChange={(value) =>
                    updateSection(
                      "appearance",
                      "animations",
                      value
                    )
                  }
                  label="Animations"
                />
              </SettingRow>
            </section>

            {/* AI */}

            <section
              id="ai"
              className="settings-card"
            >
              <SectionHeader
                icon={<Bot size={19} />}
                eyebrow="Intelligence"
                title="AI Assistant"
                description="Control how EduTrace AI explains concepts and interacts with you."
              />

              <div className="settings-divider" />

              <SettingRow
                icon={<MessageCircle size={17} />}
                title="Response style"
                description="Choose the personality of your AI tutor."
              >
                <SelectControl
                  value={
                    settings.ai.responseStyle
                  }
                  options={[
                    "Friendly",
                    "Professional",
                    "Teacher",
                    "Concise",
                    "Encouraging",
                  ]}
                  onChange={(value) =>
                    updateSection(
                      "ai",
                      "responseStyle",
                      value
                    )
                  }
                />
              </SettingRow>

              <SettingRow
                icon={<Brain size={17} />}
                title="Explanation level"
                description="Control how deeply concepts are explained."
              >
                <SelectControl
                  value={
                    settings.ai
                      .explanationLevel
                  }
                  options={[
                    "Simple",
                    "Balanced",
                    "Detailed",
                    "Deep Dive",
                  ]}
                  onChange={(value) =>
                    updateSection(
                      "ai",
                      "explanationLevel",
                      value
                    )
                  }
                />
              </SettingRow>

              <SettingRow
                icon={<GraduationCap size={17} />}
                title="Auto-start learning"
                description="Automatically begin teaching when you select Start Learning."
              >
                <Toggle
                  checked={
                    settings.ai
                      .autoStartLearning
                  }
                  onChange={(value) =>
                    updateSection(
                      "ai",
                      "autoStartLearning",
                      value
                    )
                  }
                  label="Auto-start learning"
                />
              </SettingRow>

              <SettingRow
                icon={<Eye size={17} />}
                title="Show knowledge sources"
                description="Display RAG source information when answers use your documents."
              >
                <Toggle
                  checked={
                    settings.ai
                      .showSources
                  }
                  onChange={(value) =>
                    updateSection(
                      "ai",
                      "showSources",
                      value
                    )
                  }
                  label="Show knowledge sources"
                />
              </SettingRow>

              <SettingRow
                icon={<SlidersHorizontal size={17} />}
                title="Markdown formatting"
                description="Render headings, lists, tables and code blocks in AI responses."
              >
                <Toggle
                  checked={
                    settings.ai
                      .markdown
                  }
                  onChange={(value) =>
                    updateSection(
                      "ai",
                      "markdown",
                      value
                    )
                  }
                  label="Markdown formatting"
                />
              </SettingRow>
            </section>

            {/* LEARNING */}

            <section
              id="learning"
              className="settings-card"
            >
              <SectionHeader
                icon={<BookOpen size={19} />}
                eyebrow="Personal Learning"
                title="Learning Preferences"
                description="Set your default preparation and study behavior."
              />

              <div className="settings-divider" />

              <SettingRow
                icon={<Target size={17} />}
                title="Default preparation type"
                description="Used when starting a new preparation plan."
              >
                <SelectControl
                  value={
                    settings.learning
                      .preparationType
                  }
                  options={[
                    "Government Exams",
                    "Entrance Exams",
                    "School Exams",
                    "College Exams",
                    "Competitive Exams",
                    "Skill / Career Learning",
                    "Custom Preparation",
                  ]}
                  onChange={(value) =>
                    updateSection(
                      "learning",
                      "preparationType",
                      value
                    )
                  }
                />
              </SettingRow>

              <SettingRow
                icon={<Clock3 size={17} />}
                title="Daily study duration"
                description="Your preferred daily learning time."
              >
                <SelectControl
                  value={
                    settings.learning
                      .dailyDuration
                  }
                  options={[
                    "30 Minutes",
                    "1 Hour",
                    "1.5 Hours",
                    "2 Hours",
                    "3 Hours",
                    "4 Hours",
                    "5 Hours",
                    "6 Hours",
                  ]}
                  onChange={(value) =>
                    updateSection(
                      "learning",
                      "dailyDuration",
                      value
                    )
                  }
                />
              </SettingRow>

              <SettingRow
                icon={<SlidersHorizontal size={17} />}
                title="Difficulty"
                description="Choose how difficult generated practice should be."
              >
                <SelectControl
                  value={
                    settings.learning
                      .difficulty
                  }
                  options={[
                    "Beginner",
                    "Intermediate",
                    "Advanced",
                    "Adaptive",
                  ]}
                  onChange={(value) =>
                    updateSection(
                      "learning",
                      "difficulty",
                      value
                    )
                  }
                />
              </SettingRow>

              <SettingRow
                icon={<Sparkles size={17} />}
                title="Use examples"
                description="Ask EduTrace AI to include practical examples while teaching."
              >
                <Toggle
                  checked={
                    settings.learning
                      .examples
                  }
                  onChange={(value) =>
                    updateSection(
                      "learning",
                      "examples",
                      value
                    )
                  }
                  label="Use examples"
                />
              </SettingRow>

              <SettingRow
                icon={<Trophy size={17} />}
                title="Practice questions"
                description="Include important questions and practice tasks after explanations."
              >
                <Toggle
                  checked={
                    settings.learning
                      .practiceQuestions
                  }
                  onChange={(value) =>
                    updateSection(
                      "learning",
                      "practiceQuestions",
                      value
                    )
                  }
                  label="Practice questions"
                />
              </SettingRow>
            </section>

            {/* NOTIFICATIONS */}

            <section
              id="notifications"
              className="settings-card"
            >
              <SectionHeader
                icon={<Bell size={19} />}
                eyebrow="Alerts"
                title="Notifications"
                description="Choose which learning activities should appear in your notification center."
              />

              <div className="settings-divider" />

              <SettingRow
                icon={<Clock3 size={17} />}
                title="Study reminders"
                description="Receive reminders for planned study sessions."
              >
                <Toggle
                  checked={
                    settings.notifications
                      .studyReminders
                  }
                  onChange={(value) =>
                    updateSection(
                      "notifications",
                      "studyReminders",
                      value
                    )
                  }
                  label="Study reminders"
                />
              </SettingRow>

              <SettingRow
                icon={<Trophy size={17} />}
                title="Quiz notifications"
                description="Show notifications when quiz activity is completed."
              >
                <Toggle
                  checked={
                    settings.notifications
                      .quizNotifications
                  }
                  onChange={(value) =>
                    updateSection(
                      "notifications",
                      "quizNotifications",
                      value
                    )
                  }
                  label="Quiz notifications"
                />
              </SettingRow>

              <SettingRow
                icon={<Target size={17} />}
                title="Goal reminders"
                description="Keep track of active learning goals and deadlines."
              >
                <Toggle
                  checked={
                    settings.notifications
                      .goalReminders
                  }
                  onChange={(value) =>
                    updateSection(
                      "notifications",
                      "goalReminders",
                      value
                    )
                  }
                  label="Goal reminders"
                />
              </SettingRow>

              <SettingRow
                icon={<AwardIcon />}
                title="Achievement notifications"
                description="Get notified when you unlock learning achievements."
              >
                <Toggle
                  checked={
                    settings.notifications
                      .achievementNotifications
                  }
                  onChange={(value) =>
                    updateSection(
                      "notifications",
                      "achievementNotifications",
                      value
                    )
                  }
                  label="Achievement notifications"
                />
              </SettingRow>

              <SettingRow
                icon={<Bot size={17} />}
                title="AI updates"
                description="Receive updates related to your AI learning activity."
              >
                <Toggle
                  checked={
                    settings.notifications
                      .aiUpdates
                  }
                  onChange={(value) =>
                    updateSection(
                      "notifications",
                      "aiUpdates",
                      value
                    )
                  }
                  label="AI updates"
                />
              </SettingRow>
            </section>

            {/* PRIVACY */}

            <section
              id="privacy"
              className="settings-card"
            >
              <SectionHeader
                icon={<Shield size={19} />}
                eyebrow="Control"
                title="Privacy & Data"
                description="Control how EduTrace uses locally available learning information."
              />

              <div className="settings-divider" />

              <SettingRow
                icon={<Database size={17} />}
                title="Personal learning data"
                description="Allow AI features to use available personal learning context."
              >
                <Toggle
                  checked={
                    settings.privacy
                      .personalData
                  }
                  onChange={(value) =>
                    updateSection(
                      "privacy",
                      "personalData",
                      value
                    )
                  }
                  label="Personal learning data"
                />
              </SettingRow>

              <SettingRow
                icon={<BookOpen size={17} />}
                title="Knowledge Vault RAG"
                description="Allow AI Assistant to search uploaded documents for grounded answers."
              >
                <Toggle
                  checked={
                    settings.privacy
                      .rag
                  }
                  onChange={(value) =>
                    updateSection(
                      "privacy",
                      "rag",
                      value
                    )
                  }
                  label="Knowledge Vault RAG"
                />
              </SettingRow>

              <SettingRow
                icon={<Database size={17} />}
                title="Save AI history"
                description="Keep AI conversations locally so your learning activity can be remembered."
              >
                <Toggle
                  checked={
                    settings.privacy
                      .saveHistory
                  }
                  onChange={(value) =>
                    updateSection(
                      "privacy",
                      "saveHistory",
                      value
                    )
                  }
                  label="Save AI history"
                />
              </SettingRow>

              <div className="danger-zone">
                <div className="danger-icon">
                  <AlertTriangle
                    size={19}
                  />
                </div>

                <div className="danger-content">
                  <strong>
                    Clear local learning data
                  </strong>

                  <span>
                    Remove locally stored
                    AI history, quiz
                    results, goals,
                    achievements,
                    study plans,
                    notifications and
                    preferences.
                  </span>
                </div>

                <button
                  type="button"
                  className="clear-data-button"
                  onClick={
                    handleClearData
                  }
                >
                  <Trash2 size={14} />
                  Clear Data
                </button>
              </div>
            </section>

            {/* FOOTER */}

            <div className="settings-footer">
              <div>
                <Shield size={15} />
                <span>
                  EduTrace settings are
                  stored locally on this
                  device.
                </span>
              </div>

              <span>
                EduTrace Workspace
              </span>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function AwardIcon() {
  return (
    <Trophy
      size={17}
    />
  );
}
