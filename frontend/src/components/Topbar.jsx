import React from "react";
import { Bell, Menu, Search, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";

const PAGE_NAMES = {
  "/": "Home",
  "/ai-assistant": "AI Assistant",
  "/ai-robot": "EduBot",
  "/knowledge": "Knowledge",
  "/analytics": "Analytics",
  "/tasks": "Tasks",
  "/calendar": "Calendar",
  "/planner": "Planner",
  "/study-plan": "Study Plan",
  "/goals": "Goals",
  "/learning-arena": "Learning Arena",
  "/quizzes": "Quizzes",
  "/achievements": "Achievements",
  "/activity": "Activity",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/settings": "Settings",
};

export default function Topbar({ onMenuClick }) {
  const location = useLocation();

  const pageName =
    PAGE_NAMES[location.pathname] ||
    location.pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ")
      ?.replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
    "Home";

  return (
    <header className="et-topbar">
      <div className="et-topbar-left">
        <button
          type="button"
          className="et-topbar-menu"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          title="Open menu"
        >
          <Menu size={22} strokeWidth={2} />
        </button>

        <div className="et-topbar-breadcrumb">
          <span className="et-topbar-root">EduTrace</span>
          <span className="et-topbar-separator">/</span>
          <span className="et-topbar-current">{pageName}</span>
        </div>
      </div>

      <div className="et-topbar-actions">
        <button
          type="button"
          className="et-topbar-icon-button"
          title="Search"
        >
          <Search size={18} strokeWidth={1.9} />
        </button>

        <button
          type="button"
          className="et-topbar-icon-button"
          title="AI Tools"
        >
          <Sparkles size={18} strokeWidth={1.9} />
        </button>

        <button
          type="button"
          className="et-topbar-icon-button et-topbar-notification"
          title="Notifications"
        >
          <Bell size={18} strokeWidth={1.9} />
          <span className="et-topbar-notification-dot" />
        </button>

        <div className="et-topbar-user">
          <div className="et-topbar-avatar">
            E
          </div>
        </div>
      </div>
    </header>
  );
}
