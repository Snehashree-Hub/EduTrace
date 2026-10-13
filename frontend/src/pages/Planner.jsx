import React, { useMemo, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  BookOpen,
  BriefcaseBusiness,
  UserRound,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  X,
  Target,
  Sparkles,
} from "lucide-react";
import "./planner.css";

const STORAGE_KEY = "edutrace_planner";

const INITIAL_BLOCKS = [
  {
    id: 1,
    title: "Python Fundamentals",
    description: "Variables, data types and conditional statements.",
    category: "Study",
    date: "2026-10-04",
    start: "09:00",
    end: "10:30",
    priority: "High",
    completed: false,
  },
  {
    id: 2,
    title: "ML Assignment",
    description: "Complete supervised learning implementation.",
    category: "Work",
    date: "2026-10-04",
    start: "11:00",
    end: "12:00",
    priority: "Medium",
    completed: false,
  },
  {
    id: 3,
    title: "Revision Session",
    description: "Quick revision of yesterday's topics.",
    category: "Study",
    date: "2026-10-04",
    start: "18:00",
    end: "19:00",
    priority: "Medium",
    completed: true,
  },
];

const HOURS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function loadPlanner() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      return JSON.parse(saved);
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(INITIAL_BLOCKS)
    );

    return INITIAL_BLOCKS;
  } catch {
    return INITIAL_BLOCKS;
  }
}

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
    }
  );
}

function emptyForm(date) {
  return {
    title: "",
    description: "",
    category: "Study",
    date,
    start: "09:00",
    end: "10:00",
    priority: "Medium",
  };
}

function categoryIcon(category) {
  if (category === "Study") return <BookOpen size={15} />;
  if (category === "Work") return <BriefcaseBusiness size={15} />;
  return <UserRound size={15} />;
}

function categoryClass(category) {
  return category.toLowerCase();
}

export default function Planner() {
  const [blocks, setBlocks] = useState(loadPlanner);
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [form, setForm] = useState(emptyForm(getToday()));
  const [view, setView] = useState("Day");

  const saveBlocks = (updated) => {
    setBlocks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const selectedBlocks = useMemo(() => {
    return blocks
      .filter((block) => block.date === selectedDate)
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [blocks, selectedDate]);

  const totalBlocks = blocks.length;
  const completedBlocks = blocks.filter(
    (block) => block.completed
  ).length;

  const focusBlocks = blocks.filter(
    (block) => block.category === "Study" && !block.completed
  ).length;

  const completionRate = totalBlocks
    ? Math.round((completedBlocks / totalBlocks) * 100)
    : 0;

  const selectedDateLabel = formatDate(selectedDate);

  const changeDate = (amount) => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + amount);

    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToday = () => {
    setSelectedDate(getToday());
  };

  const openCreate = () => {
    setEditingBlock(null);
    setForm(emptyForm(selectedDate));
    setShowModal(true);
  };

  const openEdit = (block) => {
    setEditingBlock(block);

    setForm({
      title: block.title,
      description: block.description || "",
      category: block.category,
      date: block.date,
      start: block.start,
      end: block.end,
      priority: block.priority,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBlock(null);
    setForm(emptyForm(selectedDate));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const submitBlock = (event) => {
    event.preventDefault();

    if (!form.title.trim()) return;

    if (editingBlock) {
      const updated = blocks.map((block) =>
        block.id === editingBlock.id
          ? {
              ...block,
              ...form,
              title: form.title.trim(),
            }
          : block
      );

      saveBlocks(updated);
    } else {
      const newBlock = {
        id: Date.now(),
        ...form,
        title: form.title.trim(),
        completed: false,
      };

      saveBlocks([...blocks, newBlock]);
    }

    closeModal();
  };

  const toggleBlock = (id) => {
    const updated = blocks.map((block) =>
      block.id === id
        ? {
            ...block,
            completed: !block.completed,
          }
        : block
    );

    saveBlocks(updated);
  };

  const deleteBlock = (id) => {
    saveBlocks(blocks.filter((block) => block.id !== id));
  };

  const weekDays = useMemo(() => {
    const base = new Date(`${selectedDate}T00:00:00`);
    const day = base.getDay();

    const sunday = new Date(base);
    sunday.setDate(base.getDate() - day);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + index);

      return {
        key: date.toISOString().split("T")[0],
        day: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        number: date.getDate(),
      };
    });
  }, [selectedDate]);

  const dayTaskCount = (date) =>
    blocks.filter((block) => block.date === date).length;

  return (
    <div className="planner-page">
      <div className="planner-glow planner-glow-one" />
      <div className="planner-glow planner-glow-two" />

      <header className="planner-header">
        <div>
          <div className="planner-eyebrow">
            <Sparkles size={15} />
            PERSONAL PLANNING WORKSPACE
          </div>

          <h1>
            Plan your <span>day</span>
          </h1>

          <p>
            Organize study, work and personal time without losing focus.
          </p>
        </div>

        <button className="planner-add-btn" onClick={openCreate}>
          <Plus size={18} />
          Add Time Block
        </button>
      </header>

      <section className="planner-stats">
        <div className="planner-stat">
          <div className="planner-stat-icon purple">
            <Target size={19} />
          </div>

          <div>
            <span>Total Blocks</span>
            <strong>{totalBlocks}</strong>
          </div>
        </div>

        <div className="planner-stat">
          <div className="planner-stat-icon blue">
            <BookOpen size={19} />
          </div>

          <div>
            <span>Study Focus</span>
            <strong>{focusBlocks}</strong>
          </div>
        </div>

        <div className="planner-stat">
          <div className="planner-stat-icon green">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <span>Completed</span>
            <strong>{completedBlocks}</strong>
          </div>
        </div>

        <div className="planner-stat">
          <div className="planner-stat-icon orange">
            <Clock3 size={19} />
          </div>

          <div>
            <span>Completion</span>
            <strong>{completionRate}%</strong>
          </div>
        </div>
      </section>

      <section className="planner-week-strip">
        <div className="planner-week-controls">
          <button onClick={() => changeDate(-7)}>
            <ChevronLeft size={17} />
          </button>

          <button onClick={goToday} className="planner-today">
            Today
          </button>

          <button onClick={() => changeDate(7)}>
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="planner-week-days">
          {weekDays.map((day) => (
            <button
              key={day.key}
              className={
                selectedDate === day.key ? "selected" : ""
              }
              onClick={() => setSelectedDate(day.key)}
            >
              <span>{day.day}</span>
              <strong>{day.number}</strong>

              {dayTaskCount(day.key) > 0 && (
                <i>{dayTaskCount(day.key)}</i>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="planner-toolbar">
        <div>
          <span className="planner-section-label">
            DAILY PLAN
          </span>

          <h2>{selectedDateLabel}</h2>
        </div>

        <div className="planner-view-switch">
          {["Day", "Timeline"].map((item) => (
            <button
              key={item}
              className={view === item ? "active" : ""}
              onClick={() => setView(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {view === "Day" ? (
        <section className="planner-content">
          <div className="planner-timeline">
            {HOURS.map((hour) => {
              const hourBlocks = selectedBlocks.filter(
                (block) => block.start.slice(0, 2) === hour.slice(0, 2)
              );

              return (
                <div className="timeline-row" key={hour}>
                  <div className="timeline-time">
                    {hour}
                  </div>

                  <div className="timeline-line">
                    {hourBlocks.length === 0 ? (
                      <button
                        className="empty-slot"
                        onClick={() => {
                          setForm({
                            ...emptyForm(selectedDate),
                            start: hour,
                            end: `${String(
                              Number(hour.slice(0, 2)) + 1
                            ).padStart(2, "0")}:00`,
                          });

                          setEditingBlock(null);
                          setShowModal(true);
                        }}
                      >
                        <Plus size={13} />
                        Add focus block
                      </button>
                    ) : (
                      <div className="timeline-blocks">
                        {hourBlocks.map((block) => (
                          <article
                            key={block.id}
                            className={`planner-block ${categoryClass(
                              block.category
                            )} ${
                              block.completed ? "completed" : ""
                            }`}
                          >
                            <div className="block-accent" />

                            <div className="block-main">
                              <div className="block-heading">
                                <div className="block-category">
                                  {categoryIcon(block.category)}
                                  {block.category}
                                </div>

                                <div className="block-actions">
                                  <button
                                    onClick={() =>
                                      openEdit(block)
                                    }
                                  >
                                    <Edit3 size={14} />
                                  </button>

                                  <button
                                    onClick={() =>
                                      deleteBlock(block.id)
                                    }
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              <h3>{block.title}</h3>

                              {block.description && (
                                <p>{block.description}</p>
                              )}

                              <div className="block-footer">
                                <span>
                                  <Clock3 size={13} />
                                  {block.start} – {block.end}
                                </span>

                                <span
                                  className={`block-priority ${block.priority.toLowerCase()}`}
                                >
                                  {block.priority}
                                </span>

                                <button
                                  className="block-complete"
                                  onClick={() =>
                                    toggleBlock(block.id)
                                  }
                                >
                                  {block.completed ? (
                                    <>
                                      <CheckCircle2 size={15} />
                                      Done
                                    </>
                                  ) : (
                                    <>
                                      <Circle size={15} />
                                      Complete
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="planner-side">
            <div className="focus-card">
              <div className="focus-card-icon">
                <Target size={20} />
              </div>

              <span>DAILY FOCUS</span>

              <h3>
                {selectedBlocks.filter(
                  (block) => !block.completed
                ).length}{" "}
                active blocks
              </h3>

              <p>
                Keep your most important work visible and finish one
                block at a time.
              </p>

              <div className="focus-progress">
                <div
                  style={{
                    width: `${completionRate}%`,
                  }}
                />
              </div>

              <small>{completionRate}% completed overall</small>
            </div>

            <div className="category-card">
              <div className="planner-side-heading">
                <span className="planner-section-label">
                  CATEGORIES
                </span>
                <h3>Your planning mix</h3>
              </div>

              {["Study", "Work", "Personal"].map((category) => {
                const count = selectedBlocks.filter(
                  (block) => block.category === category
                ).length;

                return (
                  <div className="category-row" key={category}>
                    <div
                      className={`category-row-icon ${categoryClass(
                        category
                      )}`}
                    >
                      {categoryIcon(category)}
                    </div>

                    <span>{category}</span>

                    <strong>{count}</strong>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>
      ) : (
        <section className="planner-timeline-view">
          <div className="timeline-view-header">
            <div>
              <span className="planner-section-label">
                TIMELINE
              </span>

              <h2>Your complete schedule</h2>
            </div>

            <button onClick={openCreate}>
              <Plus size={16} />
              Add Block
            </button>
          </div>

          {selectedBlocks.length === 0 ? (
            <div className="planner-empty">
              <Clock3 size={30} />
              <h3>No blocks planned</h3>
              <p>
                Add your first time block to build your schedule.
              </p>

              <button onClick={openCreate}>
                <Plus size={16} />
                Create Block
              </button>
            </div>
          ) : (
            <div className="timeline-list">
              {selectedBlocks.map((block) => (
                <article
                  className={`timeline-list-item ${
                    block.completed ? "completed" : ""
                  }`}
                  key={block.id}
                >
                  <div className="timeline-list-time">
                    <strong>{block.start}</strong>
                    <span>{block.end}</span>
                  </div>

                  <div
                    className={`timeline-list-icon ${categoryClass(
                      block.category
                    )}`}
                  >
                    {categoryIcon(block.category)}
                  </div>

                  <div className="timeline-list-info">
                    <span>{block.category}</span>
                    <h3>{block.title}</h3>
                    <p>{block.description}</p>
                  </div>

                  <button
                    className="timeline-list-check"
                    onClick={() => toggleBlock(block.id)}
                  >
                    {block.completed ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {showModal && (
        <div
          className="planner-modal-overlay"
          onMouseDown={closeModal}
        >
          <div
            className="planner-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="planner-modal-header">
              <div>
                <span className="planner-section-label">
                  {editingBlock
                    ? "EDIT TIME BLOCK"
                    : "NEW TIME BLOCK"}
                </span>

                <h2>
                  {editingBlock
                    ? "Update your plan"
                    : "Plan a new block"}
                </h2>
              </div>

              <button
                className="planner-close"
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitBlock}>
              <div className="planner-form-group">
                <label>Block title</label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. JEE Physics Revision"
                  required
                  autoFocus
                />
              </div>

              <div className="planner-form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="What do you want to accomplish?"
                  rows="3"
                />
              </div>

              <div className="planner-form-grid">
                <div className="planner-form-group">
                  <label>Category</label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    <option>Study</option>
                    <option>Work</option>
                    <option>Personal</option>
                  </select>
                </div>

                <div className="planner-form-group">
                  <label>Priority</label>

                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div className="planner-form-group">
                  <label>Date</label>

                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                  />
                </div>

                <div className="planner-form-group">
                  <label>Start time</label>

                  <input
                    type="time"
                    name="start"
                    value={form.start}
                    onChange={handleChange}
                  />
                </div>

                <div className="planner-form-group planner-form-full">
                  <label>End time</label>

                  <input
                    type="time"
                    name="end"
                    value={form.end}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="planner-modal-actions">
                <button
                  type="button"
                  className="planner-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="planner-save"
                >
                  {editingBlock
                    ? "Update Block"
                    : "Add to Planner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
