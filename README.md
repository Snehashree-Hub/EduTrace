# EduTrace – AI-Powered Personalized Learning Assistant

EduTrace is an AI-powered personalized learning platform designed to help school students, college students, and lifelong learners identify learning gaps, understand difficult concepts, practice effectively, and track their learning progress.

## 🎯 Problem Statement

Traditional learning platforms often provide the same content and practice questions to every learner. They may not clearly identify an individual's weak topics or guide them through a personalized improvement process.

EduTrace aims to make learning more personalized by connecting performance analysis, trusted learning resources, AI-powered explanations, and practice activities.

## ✨ Key Features

- **Learning Gap Identification:** Analyze available academic and quiz performance data to identify topics that may need improvement.
- **AI Study Assistant:** Get explanations and learning support through an AI-powered assistant.
- **Retrieval-Augmented Generation (RAG):** Use relevant information from configured learning materials to support answers.
- **Practice and Quizzes:** Reinforce concepts through quizzes and learning activities.
- **Progress Tracking:** Review learning activity and performance to understand progress.
- **Study Planning:** Organize goals, tasks, and study activities.
- **Knowledge Resources:** Work with learning materials configured in the application.

*Feature availability depends on the current application configuration and backend services.*

## 🛠️ Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI

### AI and Learning Support
- Groq API integration
- Retrieval-Augmented Generation (RAG)
- Academic performance analysis
- Quiz and practice workflows
## 📸 Screenshots

### Dashboard
![EduTrace Dashboard](docs/screenshots/dashboard.png)

### AI Study Assistant
![AI Study Assistant](docs/screenshots/ai-assistant.png)

### Learning Analytics
![Learning Analytics](docs/screenshots/analytics.png)

### Quiz Practice
![Quiz Practice](docs/screenshots/quiz.png)
## 🏗️ Project Structure

```text
EduTrace/
├── frontend/    # React and Vite application
├── backend/
│   ├── app/     # FastAPI APIs and services
│   ├── data/    # Application data
│   └── rag/     # Retrieval-augmented generation logic
└── .gitignore
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone -b clean-main https://github.com/Snehashree-Hub/EduTrace.git
cd EduTrace
```

### 2. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local URL for the frontend.

### 3. Set up the backend

Open a separate terminal from the project root:

```bash
python -m venv .venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies from the dependency file provided by the project, if available. Then configure the required environment variables and start the FastAPI application using the project's configured entry point.

Check the backend `main.py` and dependency configuration for the exact startup command before running it.

## 🔐 Environment Variables

Configure the required API credentials in a local `.env` file or the environment variables expected by the backend.

- Never commit API keys, passwords, or private credentials.
- Keep `.env` files out of version control.
- Store production credentials in your deployment platform's secret settings.

## 🌱 Project Goal

EduTrace aims to support a continuous learning cycle:

**Analyze → Identify Learning Gaps → Explain → Practice → Reassess → Track Progress**

The goal is not simply to provide answers, but to help learners understand concepts and make measurable progress over time.

## 📌 Project Status

This repository contains the current project source code. Setup, configuration, and feature availability may vary as development continues.

## 👩‍💻 Author

**Snehashree-Hub**

GitHub: https://github.com/Snehashree-Hub
