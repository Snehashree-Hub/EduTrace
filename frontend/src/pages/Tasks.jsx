import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  CalendarDays,
  Clock3,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Flag,
  X,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";
import "./tasks.css";

const STORAGE_KEY = "edutrace_tasks";

const defaultTasks = [
  {
    id: 1,
    title: "Revise Python Basics",
    description: "Review variables, data types, operators and conditional statements.",
    category: "Learning",
    date: "2026-10-04",
    time: "10:00",
    priority: "High",
    status: "Pending",
  },
  {
    id: 2,
    title: "Complete ML Assignment",
    description: "Finish the supervised learning assignment.",
    category: "Assignment",
    date: "2026-10-05",
    time: "18:00",
    priority: "Medium",
    status: "In Progress",
  },
  {
    id: 3,
    title: "Read Knowledge Vault Notes",
    description: "Continue reading the uploaded machine learning notes.",
    category: "Study",
    date: "2026-10-06",
    time: "20:00",
    priority: "Low",
    status: "Pending",
  },
];

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      return JSON.parse(saved);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTasks));
    return defaultTasks;
  } catch {
    return defaultTasks;
  }
}

function formatDate(date) {
  if (!date) return "No date";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isToday(date) {
  const today = new Date().toISOString().split("T")[0];
  return date === today;
}

function isPast(date) {
  const today = new Date().toISOString().split("T")[0];
  return date < today;
}

function priorityClass(priority) {
  return priority.toLowerCase();
}

function emptyForm() {
  return {
    title: "",
    description: "",
    category: "Learning",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    priority: "Medium",
    status: "Pending",
  };
}

export default function Tasks() {
  const [tasks, setTasks] = useState(loadTasks);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const saveTasks = (updated) => {
    setTasks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const openCreate = () => {
    setEditingTask(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      category: task.category || "Learning",
      date: task.date || "",
      time: task.time || "10:00",
      priority: task.priority || "Medium",
      status: task.status || "Pending",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setForm(emptyForm());
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim()) return;

    if (editingTask) {
      const updated = tasks.map((task) =>
        task.id === editingTask.id
          ? {
              ...task,
              ...form,
              title: form.title.trim(),
            }
          : task
      );

      saveTasks(updated);
    } else {
      const newTask = {
        id: Date.now(),
        ...form,
        title: form.title.trim(),
      };

      saveTasks([newTask, ...tasks]);
    }

    closeModal();
  };

  const toggleComplete = (task) => {
    const updated = tasks.map((item) =>
      item.id === task.id
        ? {
            ...item,
            status: item.status === "Completed" ? "Pending" : "Completed",
          }
        : item
    );

    saveTasks(updated);
  };

  const deleteTask = (id) => {
    const updated = tasks.filter((task) => task.id !== id);
    saveTasks(updated);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase()) ||
        task.category.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        (filter === "Today" && isToday(task.date)) ||
        (filter === "Upcoming" && !isPast(task.date) && task.status !== "Completed") ||
        (filter === "Completed" && task.status === "Completed") ||
        (filter === "High Priority" && task.priority === "High");

      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, filter]);

  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "Completed").length;
  const pending = tasks.filter((task) => task.status !== "Completed").length;
  const highPriority = tasks.filter(
    (task) => task.priority === "High" && task.status !== "Completed"
  ).length;

  const progress = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="tasks-page">
      <div className="tasks-background-glow glow-one" />
      <div className="tasks-background-glow glow-two" />

      <header className="tasks-header">
        <div>
          <div className="tasks-eyebrow">
            <ClipboardList size={15} />
            PRODUCTIVITY WORKSPACE
          </div>

          <h1>
            My <span>Tasks</span>
          </h1>

          <p>
            Organize your learning, assignments and daily work in one place.
          </p>
        </div>

        <button className="tasks-add-btn" onClick={openCreate}>
          <Plus size={19} />
          Add Task
        </button>
      </header>

      <section className="tasks-overview">
        <div className="task-stat-card">
          <div className="task-stat-icon purple">
            <ClipboardList size={20} />
          </div>

          <div>
            <span>Total Tasks</span>
            <strong>{total}</strong>
          </div>
        </div>

        <div className="task-stat-card">
          <div className="task-stat-icon blue">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Pending</span>
            <strong>{pending}</strong>
          </div>
        </div>

        <div className="task-stat-card">
          <div className="task-stat-icon green">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Completed</span>
            <strong>{completed}</strong>
          </div>
        </div>

        <div className="task-stat-card">
          <div className="task-stat-icon orange">
            <Flag size={20} />
          </div>

          <div>
            <span>High Priority</span>
            <strong>{highPriority}</strong>
          </div>
        </div>
      </section>

      <section className="task-progress-card">
        <div className="task-progress-info">
          <div>
            <span>Task Progress</span>
            <strong>{progress}% completed</strong>
          </div>

          <div className="task-progress-number">
            {completed}/{total}
          </div>
        </div>

        <div className="task-progress-track">
          <div
            className="task-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      <section className="tasks-toolbar">
        <div className="task-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="task-filters">
          {["All", "Today", "Upcoming", "High Priority", "Completed"].map(
            (item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            )
          )}
        </div>
      </section>

      <section className="tasks-list-section">
        <div className="section-heading">
          <div>
            <span className="section-label">YOUR WORKSPACE</span>
            <h2>{filter === "All" ? "All Tasks" : filter}</h2>
          </div>

          <span className="task-count">
            {filteredTasks.length} task
            {filteredTasks.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-tasks">
            <div className="empty-task-icon">
              <CheckCircle2 size={30} />
            </div>

            <h3>No tasks found</h3>
            <p>
              Nothing matches your current filter. Create a new task and keep
              your workspace moving.
            </p>

            <button onClick={openCreate}>
              <Plus size={17} />
              Create Task
            </button>
          </div>
        ) : (
          <div className="tasks-grid">
            {filteredTasks.map((task) => (
              <article
                key={task.id}
                className={`task-card ${
                  task.status === "Completed" ? "completed" : ""
                }`}
              >
                <div className="task-card-top">
                  <button
                    className="task-check"
                    onClick={() => toggleComplete(task)}
                    aria-label="Complete task"
                  >
                    {task.status === "Completed" ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      <Circle size={24} />
                    )}
                  </button>

                  <div className="task-card-title">
                    <div className="task-category">
                      {task.category}
                    </div>

                    <h3>{task.title}</h3>
                  </div>

                  <div className="task-actions">
                    <button
                      onClick={() => openEdit(task)}
                      aria-label="Edit task"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      aria-label="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-card-bottom">
                  <div className="task-meta">
                    <span>
                      <CalendarDays size={15} />
                      {formatDate(task.date)}
                    </span>

                    <span>
                      <Clock3 size={15} />
                      {task.time}
                    </span>
                  </div>

                  <span
                    className={`priority-badge ${priorityClass(
                      task.priority
                    )}`}
                  >
                    <Flag size={13} />
                    {task.priority}
                  </span>
                </div>

                {isPast(task.date) && task.status !== "Completed" && (
                  <div className="overdue-label">
                    <ArrowUpRight size={14} />
                    Overdue
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div className="task-modal-overlay" onMouseDown={closeModal}>
          <div
            className="task-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="task-modal-header">
              <div>
                <span className="section-label">
                  {editingTask ? "UPDATE TASK" : "NEW TASK"}
                </span>

                <h2>
                  {editingTask ? "Edit your task" : "Create a new task"}
                </h2>
              </div>

              <button className="modal-close" onClick={closeModal}>
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Task title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Prepare Chemistry revision"
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Add a short description..."
                  rows="3"
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    <option>Learning</option>
                    <option>Study</option>
                    <option>Assignment</option>
                    <option>Exam</option>
                    <option>Work</option>
                    <option>Personal</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="form-group">
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

                <div className="form-group">
                  <label>Due date</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group form-full">
                  <label>Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              <div className="task-modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="save-task-btn">
                  {editingTask ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
