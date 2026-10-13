import React from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  ClipboardCheck,
  ChevronRight,
  FileText,
  Gamepad2,
  Goal,
  Home,
  LayoutDashboard,
  ListTodo,
  MessageCircle,
  NotebookTabs,
  Settings,
  Sparkles,
  Trophy,
  UserCircle,
  X,
} from "lucide-react";

const workspaceItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "AI Assistant", path: "/ai-assistant", icon: MessageCircle },
  { label: "EduBot", path: "/ai-robot", icon: Bot, special: true },
  { label: "Knowledge", path: "/knowledge", icon: FileText },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
];

const productivityItems = [
  { label: "Tasks", path: "/tasks", icon: ListTodo },
  { label: "Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Planner", path: "/planner", icon: LayoutDashboard },
  { label: "Study Plan", path: "/study-plan", icon: NotebookTabs },
  { label: "Goals", path: "/goals", icon: Goal },
];

const learningItems = [
  { label: "Learning Arena", path: "/learning-arena", icon: Gamepad2 },
  { label: "Quizzes", path: "/quizzes", icon: ClipboardCheck },
  { label: "Achievements", path: "/achievements", icon: Trophy },
  { label: "Activity", path: "/activity", icon: Activity },
];

function SidebarItem({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "et-sidebar-link",
          isActive ? "active" : "",
          item.special ? "edubot-link" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      <span className="et-sidebar-link-icon">
        <Icon size={18} strokeWidth={1.9} />
      </span>

      <span className="et-sidebar-link-label">
        {item.label}
      </span>

      {item.special && (
        <span className="et-sidebar-ai-badge">
          AI
        </span>
      )}
    </NavLink>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="et-sidebar-section-title">
      {children}
    </div>
  );
}

export default function Sidebar({
  mobileOpen = false,
  onCloseMobile,
}) {
  if (!mobileOpen) {
    return null;
  }

  const handleNavigate = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      <button
        type="button"
        className="et-sidebar-overlay"
        aria-label="Close navigation"
        onClick={onCloseMobile}
      />

      <aside className="et-sidebar et-sidebar-drawer">
        <div className="et-sidebar-brand">
          <NavLink
            to="/"
            className="et-sidebar-brand-link"
            onClick={handleNavigate}
          >
            <div className="et-sidebar-logo">
              <Sparkles size={20} />
            </div>

            <div className="et-sidebar-brand-text">
              <strong>EduTrace</strong>
              <span>AI Learning Workspace</span>
            </div>
          </NavLink>

          <button
            type="button"
            className="et-sidebar-mobile-close"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="et-sidebar-nav">
          <SectionTitle>
            WORKSPACE
          </SectionTitle>

          <div className="et-sidebar-group">
            {workspaceItems.map((item) => (
              <SidebarItem
                key={item.path}
                item={item}
                onNavigate={handleNavigate}
              />
            ))}
          </div>

          <SectionTitle>
            PRODUCTIVITY
          </SectionTitle>

          <div className="et-sidebar-group">
            {productivityItems.map((item) => (
              <SidebarItem
                key={item.path}
                item={item}
                onNavigate={handleNavigate}
              />
            ))}
          </div>

          <SectionTitle>
            LEARNING ARENA
          </SectionTitle>

          <div className="et-sidebar-group">
            {learningItems.map((item) => (
              <SidebarItem
                key={item.path}
                item={item}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </nav>

        <div className="et-sidebar-bottom">
          <div className="et-sidebar-divider" />

          <NavLink
            to="/notifications"
            onClick={handleNavigate}
            className={({ isActive }) =>
              ["et-sidebar-link", isActive ? "active" : ""]
                .filter(Boolean)
                .join(" ")
            }
          >
            <span className="et-sidebar-link-icon notification-icon-wrap">
              <Bell size={18} strokeWidth={1.9} />
              <span className="et-notification-dot" />
            </span>

            <span className="et-sidebar-link-label">
              Notifications
            </span>
          </NavLink>

          <NavLink
            to="/profile"
            onClick={handleNavigate}
            className={({ isActive }) =>
              ["et-sidebar-link", isActive ? "active" : ""]
                .filter(Boolean)
                .join(" ")
            }
          >
            <span className="et-sidebar-link-icon">
              <UserCircle size={18} strokeWidth={1.9} />
            </span>

            <span className="et-sidebar-link-label">
              Profile
            </span>
          </NavLink>

          <NavLink
            to="/settings"
            onClick={handleNavigate}
            className={({ isActive }) =>
              ["et-sidebar-link", isActive ? "active" : ""]
                .filter(Boolean)
                .join(" ")
            }
          >
            <span className="et-sidebar-link-icon">
              <Settings size={18} strokeWidth={1.9} />
            </span>

            <span className="et-sidebar-link-label">
              Settings
            </span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
