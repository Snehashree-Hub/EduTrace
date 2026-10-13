import React, { useMemo, useState } from "react";
import {
  Plus,
  Target,
  CheckCircle2,
  Circle,
  CalendarDays,
  Flag,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Sparkles,
  Trophy,
  ChevronRight,
} from "lucide-react";
import "./goals.css";

const STORAGE_KEY = "edutrace_goals";

const INITIAL_GOALS = [
  {
    id: 1,
    title: "Master Python Programming",
    description:
      "Build strong Python fundamentals and become comfortable solving coding problems.",
    category: "Career",
    priority: "High",
    deadline: "2026-11-15",
    color: "purple",
    milestones: [
      { id: 11, title: "Python Basics", completed: true },
      { id: 12, title: "Functions & Modules", completed: true },
      { id: 13, title: "OOP Concepts", completed: false },
      { id: 14, title: "Build Mini Project", completed: false },
    ],
  },
  {
    id: 2,
    title: "Complete Semester Preparation",
    description:
      "Finish core subjects and prepare important concepts before examinations.",
    category: "Education",
    priority: "High",
    deadline: "2026-11-30",
    color: "blue",
    milestones: [
      { id: 21, title: "Collect syllabus", completed: true },
      { id: 22, title: "Complete Unit 1", completed: true },
      { id: 23, title: "Complete Unit 2", completed: false },
      { id: 24, title: "Revision", completed: false },
      { id: 25, title: "Practice questions", completed: false },
    ],
  },
  {
    id: 3,
    title: "Build EduTrace MVP",
    description:
      "Complete the core frontend experience and prepare the project for demonstration.",
    category: "Project",
    priority: "Medium",
    deadline: "2026-12-10",
    color: "orange",
    milestones: [
      { id: 31, title: "Frontend workspace", completed: true },
      { id: 32, title: "AI Assistant", completed: true },
      { id: 33, title: "Productivity modules", completed: false },
      { id: 34, title: "Learning modules", completed: false },
    ],
  },
];

function loadGoals() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      return JSON.parse(saved);
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(INITIAL_GOALS)
    );

    return INITIAL_GOALS;
  } catch {
    return INITIAL_GOALS;
  }
}

function formatDeadline(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getProgress(goal) {
  if (!goal.milestones.length) return 0;

  const completed = goal.milestones.filter(
    (milestone) => milestone.completed
  ).length;

  return Math.round(
    (completed / goal.milestones.length) * 100
  );
}

function getDaysLeft(deadline) {
  const today = new Date();
  const target = new Date(`${deadline}T00:00:00`);

  today.setHours(0, 0, 0, 0);

  return Math.ceil(
    (target.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function emptyGoal() {
  return {
    title: "",
    description: "",
    category: "Education",
    priority: "Medium",
    deadline: "",
    color: "purple",
    milestones: [],
  };
}

export default function Goals() {
  const [goals, setGoals] = useState(loadGoals);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState(emptyGoal());
  const [newMilestone, setNewMilestone] = useState("");

  const saveGoals = (updated) => {
    setGoals(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const activeGoals = goals.filter(
    (goal) => getProgress(goal) < 100
  );

  const completedGoals = goals.filter(
    (goal) => getProgress(goal) === 100
  );

  const overallProgress = goals.length
    ? Math.round(
        goals.reduce(
          (sum, goal) => sum + getProgress(goal),
          0
        ) / goals.length
      )
    : 0;

  const filteredGoals = useMemo(() => {
    if (filter === "Active") {
      return activeGoals;
    }

    if (filter === "Completed") {
      return completedGoals;
    }

    return goals;
  }, [filter, goals, activeGoals, completedGoals]);

  const openCreate = () => {
    setEditingGoal(null);
    setForm(emptyGoal());
    setNewMilestone("");
    setShowModal(true);
  };

  const openEdit = (goal) => {
    setEditingGoal(goal);

    setForm({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: goal.priority,
      deadline: goal.deadline,
      color: goal.color,
      milestones: goal.milestones.map((item) => ({
        ...item,
      })),
    });

    setNewMilestone("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGoal(null);
    setForm(emptyGoal());
    setNewMilestone("");
  };

  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const addMilestone = () => {
    const title = newMilestone.trim();

    if (!title) return;

    setForm((previous) => ({
      ...previous,
      milestones: [
        ...previous.milestones,
        {
          id: Date.now(),
          title,
          completed: false,
        },
      ],
    }));

    setNewMilestone("");
  };

  const removeMilestone = (id) => {
    setForm((previous) => ({
      ...previous,
      milestones: previous.milestones.filter(
        (item) => item.id !== id
      ),
    }));
  };

  const submitGoal = (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.deadline) return;

    if (editingGoal) {
      const updated = goals.map((goal) =>
        goal.id === editingGoal.id
          ? {
              ...goal,
              ...form,
              title: form.title.trim(),
            }
          : goal
      );

      saveGoals(updated);
    } else {
      const newGoal = {
        id: Date.now(),
        ...form,
        title: form.title.trim(),
      };

      saveGoals([...goals, newGoal]);
    }

    closeModal();
  };

  const toggleMilestone = (goalId, milestoneId) => {
    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;

      return {
        ...goal,
        milestones: goal.milestones.map((milestone) =>
          milestone.id === milestoneId
            ? {
                ...milestone,
                completed: !milestone.completed,
              }
            : milestone
        ),
      };
    });

    saveGoals(updated);
  };

  const deleteGoal = (id) => {
    saveGoals(goals.filter((goal) => goal.id !== id));
  };

  return (
    <div className="goals-page">
      <div className="goals-glow goals-glow-one" />
      <div className="goals-glow goals-glow-two" />

      <header className="goals-header">
        <div>
          <div className="goals-eyebrow">
            <Sparkles size={15} />
            PERSONAL GOALS
          </div>

          <h1>
            Turn plans into <span>progress.</span>
          </h1>

          <p>
            Set meaningful goals, break them into milestones,
            and keep moving forward.
          </p>
        </div>

        <button
          className="goals-add-btn"
          onClick={openCreate}
        >
          <Plus size={18} />
          Create Goal
        </button>
      </header>

      <section className="goals-overview">
        <div className="goal-overview-card main">
          <div className="goal-overview-icon">
            <Target size={21} />
          </div>

          <div>
            <span>OVERALL PROGRESS</span>
            <strong>{overallProgress}%</strong>
          </div>

          <div className="goal-overview-progress">
            <div
              style={{
                width: `${overallProgress}%`,
              }}
            />
          </div>

          <small>
            Across {goals.length} personal goals
          </small>
        </div>

        <div className="goal-overview-card">
          <div className="goal-mini-icon blue">
            <Target size={18} />
          </div>

          <div>
            <span>ACTIVE GOALS</span>
            <strong>{activeGoals.length}</strong>
          </div>
        </div>

        <div className="goal-overview-card">
          <div className="goal-mini-icon green">
            <Trophy size={18} />
          </div>

          <div>
            <span>COMPLETED</span>
            <strong>{completedGoals.length}</strong>
          </div>
        </div>

        <div className="goal-overview-card">
          <div className="goal-mini-icon orange">
            <Flag size={18} />
          </div>

          <div>
            <span>MILESTONES</span>
            <strong>
              {goals.reduce(
                (total, goal) =>
                  total + goal.milestones.length,
                0
              )}
            </strong>
          </div>
        </div>
      </section>

      <section className="goals-toolbar">
        <div>
          <span className="goals-section-label">
            YOUR GOALS
          </span>

          <h2>What are you working towards?</h2>
        </div>

        <div className="goals-filter">
          {["All", "Active", "Completed"].map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {filteredGoals.length === 0 ? (
        <section className="goals-empty">
          <Target size={34} />
          <h3>No goals here yet</h3>
          <p>
            Create a goal and start turning it into milestones.
          </p>

          <button onClick={openCreate}>
            <Plus size={16} />
            Create Goal
          </button>
        </section>
      ) : (
        <section className="goals-grid">
          {filteredGoals.map((goal) => {
            const progress = getProgress(goal);
            const daysLeft = getDaysLeft(goal.deadline);

            return (
              <article
                className={`goal-card ${goal.color}`}
                key={goal.id}
              >
                <div className="goal-card-top">
                  <div className="goal-category">
                    <span>{goal.category}</span>

                    <span
                      className={`goal-priority ${goal.priority.toLowerCase()}`}
                    >
                      {goal.priority}
                    </span>
                  </div>

                  <div className="goal-card-actions">
                    <button
                      onClick={() => openEdit(goal)}
                      title="Edit goal"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => deleteGoal(goal.id)}
                      title="Delete goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3>{goal.title}</h3>

                <p className="goal-description">
                  {goal.description}
                </p>

                <div className="goal-progress-row">
                  <div>
                    <strong>{progress}%</strong>
                    <span>complete</span>
                  </div>

                  <span className="goal-deadline">
                    <CalendarDays size={13} />
                    {daysLeft >= 0
                      ? `${daysLeft} days left`
                      : "Deadline passed"}
                  </span>
                </div>

                <div className="goal-progress-bar">
                  <div
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="goal-milestones-header">
                  <span>
                    Milestones
                  </span>

                  <strong>
                    {
                      goal.milestones.filter(
                        (item) => item.completed
                      ).length
                    }
                    /{goal.milestones.length}
                  </strong>
                </div>

                <div className="goal-milestones">
                  {goal.milestones
                    .slice(0, 4)
                    .map((milestone) => (
                      <button
                        key={milestone.id}
                        className={
                          milestone.completed
                            ? "completed"
                            : ""
                        }
                        onClick={() =>
                          toggleMilestone(
                            goal.id,
                            milestone.id
                          )
                        }
                      >
                        {milestone.completed ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          <Circle size={15} />
                        )}

                        <span>
                          {milestone.title}
                        </span>
                      </button>
                    ))}

                  {goal.milestones.length > 4 && (
                    <div className="goal-more">
                      +
                      {goal.milestones.length - 4} more
                      milestones
                    </div>
                  )}
                </div>

                <div className="goal-card-footer">
                  <span>
                    <CalendarDays size={13} />
                    Due {formatDeadline(goal.deadline)}
                  </span>

                  <button
                    onClick={() => openEdit(goal)}
                  >
                    View details
                    <ChevronRight size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {showModal && (
        <div
          className="goals-modal-overlay"
          onMouseDown={closeModal}
        >
          <div
            className="goals-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="goals-modal-header">
              <div>
                <span className="goals-section-label">
                  {editingGoal
                    ? "EDIT GOAL"
                    : "NEW GOAL"}
                </span>

                <h2>
                  {editingGoal
                    ? "Update your goal"
                    : "Create a meaningful goal"}
                </h2>
              </div>

              <button
                className="goals-close"
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitGoal}>
              <div className="goals-form-group">
                <label>Goal title</label>

                <input
                  name="title"
                  value={form.title}
                  onChange={updateForm}
                  placeholder="e.g. Crack JEE Main 2027"
                  required
                  autoFocus
                />
              </div>

              <div className="goals-form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  placeholder="What do you want to achieve?"
                  rows="3"
                />
              </div>

              <div className="goals-form-grid">
                <div className="goals-form-group">
                  <label>Category</label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={updateForm}
                  >
                    <option>Education</option>
                    <option>Career</option>
                    <option>Project</option>
                    <option>Personal</option>
                    <option>Health</option>
                    <option>Finance</option>
                  </select>
                </div>

                <div className="goals-form-group">
                  <label>Priority</label>

                  <select
                    name="priority"
                    value={form.priority}
                    onChange={updateForm}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div className="goals-form-group">
                  <label>Deadline</label>

                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={updateForm}
                    required
                  />
                </div>

                <div className="goals-form-group">
                  <label>Theme</label>

                  <select
                    name="color"
                    value={form.color}
                    onChange={updateForm}
                  >
                    <option value="purple">
                      Purple
                    </option>
                    <option value="blue">
                      Blue
                    </option>
                    <option value="orange">
                      Orange
                    </option>
                  </select>
                </div>
              </div>

              <div className="goals-milestone-builder">
                <div className="goals-milestone-title">
                  <div>
                    <label>Milestones</label>
                    <p>
                      Break the goal into smaller wins.
                    </p>
                  </div>
                </div>

                <div className="milestone-input">
                  <input
                    value={newMilestone}
                    onChange={(event) =>
                      setNewMilestone(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addMilestone();
                      }
                    }}
                    placeholder="Add a milestone..."
                  />

                  <button
                    type="button"
                    onClick={addMilestone}
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {form.milestones.length > 0 && (
                  <div className="builder-list">
                    {form.milestones.map(
                      (milestone, index) => (
                        <div
                          className="builder-item"
                          key={milestone.id}
                        >
                          <span>{index + 1}</span>

                          <p>
                            {milestone.title}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              removeMilestone(
                                milestone.id
                              )
                            }
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="goals-modal-actions">
                <button
                  type="button"
                  className="goals-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="goals-save"
                >
                  {editingGoal
                    ? "Update Goal"
                    : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
