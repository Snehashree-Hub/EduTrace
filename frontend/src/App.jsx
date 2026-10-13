import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/AppLayout";

import Home from "./pages/Home";
import AIStudyAssistant from "./pages/AIStudyAssistant";
import AIRobot from "./pages/AIRobot";
import Knowledge from "./pages/Knowledge";
import Analytics from "./pages/Analytics";

import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Planner from "./pages/Planner";
import StudyPlan from "./pages/StudyPlan";
import Goals from "./pages/Goals";

import LearningArena from "./pages/LearningArena";
import Quizzes from "./pages/Quizzes";
import Achievements from "./pages/Achievements";
import Activity from "./pages/Activity";

import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function App() {
  return (
    <AppLayout>
      <Routes>
        {/* =========================
            WORKSPACE
        ========================== */}
        <Route path="/" element={<Home />} />

        <Route
          path="/ai-assistant"
          element={<AIStudyAssistant />}
        />

        <Route
          path="/ai-robot"
          element={<AIRobot />}
        />

        <Route
          path="/knowledge"
          element={<Knowledge />}
        />

        <Route
          path="/analytics"
          element={<Analytics />}
        />

        {/* =========================
            PRODUCTIVITY
        ========================== */}
        <Route
          path="/tasks"
          element={<Tasks />}
        />

        <Route
          path="/calendar"
          element={<Calendar />}
        />

        <Route
          path="/planner"
          element={<Planner />}
        />

        <Route
          path="/study-plan"
          element={<StudyPlan />}
        />

        <Route
          path="/goals"
          element={<Goals />}
        />

        {/* =========================
            LEARNING ARENA
        ========================== */}
        <Route
          path="/learning-arena"
          element={<LearningArena />}
        />

        <Route
          path="/quizzes"
          element={<Quizzes />}
        />

        <Route
          path="/achievements"
          element={<Achievements />}
        />

        <Route
          path="/activity"
          element={<Activity />}
        />

        {/* =========================
            ACCOUNT / SYSTEM
        ========================== */}
        <Route
          path="/notifications"
          element={<Notifications />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        {/* =========================
            FALLBACK
        ========================== */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </AppLayout>
  );
}

export default App;