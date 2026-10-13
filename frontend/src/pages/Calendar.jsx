import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Clock3,
  Flag,
  CheckCircle2,
  X,
} from "lucide-react";
import "./calendar.css";

const STORAGE_KEY = "edutrace_tasks";

const FALLBACK_TASKS = [
  {
    id: 1,
    title: "Revise Python Basics",
    category: "Learning",
    date: "2026-10-04",
    time: "10:00",
    priority: "High",
    status: "Pending",
  },
  {
    id: 2,
    title: "Complete ML Assignment",
    category: "Assignment",
    date: "2026-10-05",
    time: "18:00",
    priority: "Medium",
    status: "In Progress",
  },
];

function getTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : FALLBACK_TASKS;
  } catch {
    return FALLBACK_TASKS;
  }
}

function dateKey(date) {
  return date.toISOString().split("T")[0];
}

function formatMonth(date) {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function formatFullDate(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getCalendarDays(currentDate) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const previousMonthDays = new Date(year, month, 0).getDate();

  const days = [];

  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, previousMonthDays - i),
      outside: true,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: new Date(year, month, day),
      outside: false,
    });
  }

  let nextDay = 1;

  while (days.length < 42) {
    days.push({
      date: new Date(year, month + 1, nextDay),
      outside: true,
    });

    nextDay++;
  }

  return days;
}

function priorityClass(priority) {
  return (priority || "Medium").toLowerCase();
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState(getTasks);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [view, setView] = useState("Month");

  const days = useMemo(
    () => getCalendarDays(currentDate),
    [currentDate]
  );

  const todayKey = dateKey(new Date());

  const selectedKey = dateKey(selectedDate);

  const selectedDayTasks = tasks.filter(
    (task) => task.date === selectedKey
  );

  const upcomingTasks = [...tasks]
    .filter((task) => task.status !== "Completed")
    .sort((a, b) => {
      const first = `${a.date} ${a.time || ""}`;
      const second = `${b.date} ${b.time || ""}`;
      return first.localeCompare(second);
    })
    .slice(0, 6);

  const completedCount = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const pendingCount = tasks.filter(
    (task) => task.status !== "Completed"
  ).length;

  const goPrevious = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    );
  };

  const goNext = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    );
  };

  const goToday = () => {
    const today = new Date();

    setCurrentDate(today);
    setSelectedDate(today);
  };

  const selectDay = (date) => {
    setSelectedDate(date);

    if (
      date.getMonth() !== currentDate.getMonth() ||
      date.getFullYear() !== currentDate.getFullYear()
    ) {
      setCurrentDate(
        new Date(date.getFullYear(), date.getMonth(), 1)
      );
    }
  };

  const markCompleted = (task) => {
    const updated = tasks.map((item) =>
      item.id === task.id
        ? {
            ...item,
            status:
              item.status === "Completed"
                ? "Pending"
                : "Completed",
          }
        : item
    );

    setTasks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (selectedTask) {
      setSelectedTask({
        ...task,
        status:
          task.status === "Completed"
            ? "Pending"
            : "Completed",
      });
    }
  };

  const openTaskPage = () => {
    window.location.href = "/tasks";
  };

  return (
    <div className="calendar-page">
      <div className="calendar-glow calendar-glow-one" />
      <div className="calendar-glow calendar-glow-two" />

      <header className="calendar-header">
        <div>
          <div className="calendar-eyebrow">
            <CalendarDays size={15} />
            PRODUCTIVITY CALENDAR
          </div>

          <h1>
            Your <span>Calendar</span>
          </h1>

          <p>
            See your study sessions, assignments and tasks in one timeline.
          </p>
        </div>

        <button className="calendar-add-btn" onClick={openTaskPage}>
          <Plus size={18} />
          Add Task
        </button>
      </header>

      <section className="calendar-summary">
        <div className="calendar-summary-card">
          <div className="summary-icon purple">
            <CalendarDays size={20} />
          </div>

          <div>
            <span>Scheduled</span>
            <strong>{tasks.length}</strong>
          </div>
        </div>

        <div className="calendar-summary-card">
          <div className="summary-icon blue">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>

        <div className="calendar-summary-card">
          <div className="summary-icon green">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
        </div>
      </section>

      <div className="calendar-layout">
        <section className="calendar-main-card">
          <div className="calendar-toolbar">
            <div className="calendar-navigation">
              <button onClick={goPrevious}>
                <ChevronLeft size={18} />
              </button>

              <h2>{formatMonth(currentDate)}</h2>

              <button onClick={goNext}>
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="calendar-toolbar-right">
              <button className="today-btn" onClick={goToday}>
                Today
              </button>

              <div className="view-switch">
                {["Month", "Week"].map((item) => (
                  <button
                    key={item}
                    className={view === item ? "active" : ""}
                    onClick={() => setView(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="calendar-weekdays">
            {[
              "SUN",
              "MON",
              "TUE",
              "WED",
              "THU",
              "FRI",
              "SAT",
            ].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {view === "Month" ? (
            <div className="calendar-grid">
              {days.map(({ date, outside }) => {
                const key = dateKey(date);
                const dayTasks = tasks.filter(
                  (task) => task.date === key
                );

                const isTodayDate = key === todayKey;
                const isSelected = key === selectedKey;

                return (
                  <button
                    key={key}
                    className={`calendar-day ${
                      outside ? "outside" : ""
                    } ${isTodayDate ? "today" : ""} ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => selectDay(date)}
                  >
                    <div className="day-number">
                      {date.getDate()}
                    </div>

                    <div className="day-events">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className={`calendar-event ${priorityClass(
                            task.priority
                          )} ${
                            task.status === "Completed"
                              ? "event-completed"
                              : ""
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedTask(task);
                          }}
                        >
                          <span />
                          {task.title}
                        </div>
                      ))}

                      {dayTasks.length > 3 && (
                        <small>
                          +{dayTasks.length - 3} more
                        </small>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="week-view">
              <div className="week-view-message">
                <CalendarDays size={32} />
                <h3>Week View</h3>
                <p>
                  Your weekly schedule is ready. Select any date from
                  the calendar to view its tasks.
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="calendar-sidebar">
          <div className="selected-date-card">
            <div className="selected-date-top">
              <span>SELECTED DATE</span>
              <CalendarDays size={16} />
            </div>

            <h3>{formatFullDate(selectedDate)}</h3>

            <div className="selected-date-count">
              <strong>{selectedDayTasks.length}</strong>
              <span>
                task
                {selectedDayTasks.length !== 1 ? "s" : ""} scheduled
              </span>
            </div>
          </div>

          <div className="day-tasks-card">
            <div className="day-tasks-heading">
              <div>
                <span className="calendar-section-label">
                  DAILY SCHEDULE
                </span>
                <h3>
                  {isToday(selectedDate)
                    ? "Today"
                    : "Selected Day"}
                </h3>
              </div>
            </div>

            {selectedDayTasks.length === 0 ? (
              <div className="no-day-tasks">
                <div>
                  <CalendarDays size={22} />
                </div>

                <p>No tasks scheduled for this day.</p>

                <button onClick={openTaskPage}>
                  <Plus size={15} />
                  Add Task
                </button>
              </div>
            ) : (
              <div className="day-task-list">
                {selectedDayTasks.map((task) => (
                  <button
                    key={task.id}
                    className="day-task-item"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div
                      className={`day-task-dot ${priorityClass(
                        task.priority
                      )}`}
                    />

                    <div className="day-task-content">
                      <strong>{task.title}</strong>

                      <span>
                        <Clock3 size={12} />
                        {task.time || "No time"}
                      </span>
                    </div>

                    {task.status === "Completed" && (
                      <CheckCircle2
                        className="completed-mark"
                        size={17}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="upcoming-card">
            <div className="upcoming-heading">
              <div>
                <span className="calendar-section-label">
                  NEXT UP
                </span>
                <h3>Upcoming</h3>
              </div>

              <span>{upcomingTasks.length}</span>
            </div>

            <div className="upcoming-list">
              {upcomingTasks.length === 0 ? (
                <p className="empty-upcoming">
                  No upcoming tasks.
                </p>
              ) : (
                upcomingTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);

                      const taskDate = new Date(
                        `${task.date}T00:00:00`
                      );

                      setSelectedDate(taskDate);
                      setCurrentDate(
                        new Date(
                          taskDate.getFullYear(),
                          taskDate.getMonth(),
                          1
                        )
                      );
                    }}
                  >
                    <div className="upcoming-date">
                      <strong>
                        {new Date(
                          `${task.date}T00:00:00`
                        ).getDate()}
                      </strong>

                      <span>
                        {new Date(
                          `${task.date}T00:00:00`
                        ).toLocaleDateString("en-IN", {
                          month: "short",
                        })}
                      </span>
                    </div>

                    <div className="upcoming-content">
                      <strong>{task.title}</strong>
                      <span>{task.category}</span>
                    </div>

                    <Flag
                      size={14}
                      className={`priority-icon ${priorityClass(
                        task.priority
                      )}`}
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {selectedTask && (
        <div
          className="calendar-modal-overlay"
          onMouseDown={() => setSelectedTask(null)}
        >
          <div
            className="calendar-task-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="calendar-modal-close"
              onClick={() => setSelectedTask(null)}
            >
              <X size={18} />
            </button>

            <span className="calendar-modal-category">
              {selectedTask.category}
            </span>

            <h2>{selectedTask.title}</h2>

            <div className="calendar-modal-details">
              <div>
                <CalendarDays size={17} />
                <span>{formatDate(selectedTask.date)}</span>
              </div>

              <div>
                <Clock3 size={17} />
                <span>{selectedTask.time || "No time set"}</span>
              </div>

              <div>
                <Flag size={17} />
                <span>{selectedTask.priority} Priority</span>
              </div>
            </div>

            <div
              className={`calendar-status ${
                selectedTask.status === "Completed"
                  ? "completed"
                  : ""
              }`}
            >
              {selectedTask.status === "Completed" ? (
                <>
                  <CheckCircle2 size={16} />
                  Completed
                </>
              ) : (
                <>
                  <Clock3 size={16} />
                  {selectedTask.status}
                </>
              )}
            </div>

            <div className="calendar-modal-actions">
              <button
                className="modal-complete-btn"
                onClick={() => markCompleted(selectedTask)}
              >
                <CheckCircle2 size={16} />
                {selectedTask.status === "Completed"
                  ? "Mark Pending"
                  : "Mark Completed"}
              </button>

              <button
                className="modal-task-btn"
                onClick={openTaskPage}
              >
                Open Tasks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isToday(date) {
  return dateKey(date) === dateKey(new Date());
}

function formatDate(date) {
  if (!date) return "No date";

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}
