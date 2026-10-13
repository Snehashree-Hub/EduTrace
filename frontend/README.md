
# 🎓 EduTrace – AI-Powered Personalized Learning Assistant

**Learn • Track • Grow**

EduTrace is an AI-powered personalized learning platform that helps school students, college students, and working professionals identify learning gaps, understand difficult concepts, practice effectively, and track their learning progress.

By combining academic performance analysis, AI-assisted explanations, Retrieval-Augmented Generation (RAG), quizzes, study planning, and productivity tools, EduTrace aims to make learning more personalized and organized.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Learning Workflow](#-learning-workflow)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Installation and Setup](#-installation-and-setup)
- [Environment Configuration](#-environment-configuration)
- [How EduTrace Works](#-how-edutrace-works)
- [Target Users](#-target-users)
- [What Makes EduTrace Different?](#-what-makes-edutrace-different)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [Disclaimer](#-disclaimer)

---

## 🌟 Overview

Traditional learning platforms often provide the same learning materials to every user, even when learners have different strengths, weaknesses, and learning needs.

EduTrace aims to provide a personalized learning experience by helping users explore academic performance, identify topics that need more attention, understand concepts with AI assistance, practice through quizzes, and review progress.

Rather than functioning only as a chatbot, EduTrace brings learning support, knowledge resources, analytics, and productivity tools together in one workspace.

### 🎯 Mission

To make learning more personalized, understandable, measurable, and accessible through AI-assisted education.

---

## ❗ Problem Statement

Learners commonly experience the following challenges:

- Difficulty identifying specific weak topics.
- Limited access to personalized concept explanations.
- Time spent searching different sources for learning materials.
- Lack of structured practice and reassessment.
- Difficulty tracking learning progress consistently.
- Challenges organizing study goals, tasks, and schedules.

A general-purpose AI chatbot can answer questions, but answering questions alone does not necessarily create a complete learning improvement process.

EduTrace aims to connect learning-gap identification, personalized learning support, practice, and progress tracking in one platform.

---

## 💡 Our Solution

EduTrace provides a unified learning workspace designed to help users:

1. Explore academic performance and identify topics needing attention.
2. Receive AI-assisted explanations of difficult concepts.
3. Access relevant information from available learning materials.
4. Reinforce understanding through quizzes and learning activities.
5. Organize study sessions, tasks, and learning goals.
6. Review available analytics and monitor progress.
7. Revisit topics that require further practice.

The overall goal is to support continuous learning and improvement.

---

## 🚀 Key Features

### 🤖 1. AI Study Assistant

- AI-powered question answering.
- Personalized, learner-friendly explanations.
- Examples and step-by-step concept clarification.
- Support for studying and exam preparation.
- Integration with the configured AI backend.

### 🎓 2. EduBotAI

- Interactive AI-assisted learning experience.
- Educational concept explanations.
- Designed to make learning more engaging.

### 📚 3. Knowledge Base

- Support for adding supported learning documents.
- Access to available learning resources.
- Retrieval of relevant information for AI responses where RAG is configured.
- A centralized place for learning materials.

### 📊 4. Learning Analytics

- Explore available academic performance data.
- Review topic-level performance information.
- Identify potential areas for improvement using implemented analysis.
- Visualize available learning metrics.

### 📝 5. Quizzes and Learning Arena

- Practice through available quiz activities.
- Reinforce concepts.
- Check understanding through practice.
- Support repeated learning and reassessment where implemented.

### 📖 6. Personalized Study Plan

- Organize study activities.
- Plan learning sessions.
- Prioritize topics needing attention.
- Structure learning goals and routines.

### 🎯 7. Goals and Achievements

- Organize learning objectives.
- Track goals using available functionality.
- Encourage consistent learning habits.
- Review achievements where supported.

### ✅ 8. Productivity Workspace

- Task management.
- Calendar.
- Planner.
- Study plans.
- Activity tracking.
- Notifications.
- Profile and settings.

*Feature behavior depends on the current implementation and connected backend services.*

---

## 🔄 Learning Workflow

EduTrace is designed around a continuous learning improvement cycle.

```text
        Academic Performance Data
                   |
                   v
          Performance Analysis
                   |
                   v
          Identify Weak Topics
                   |
                   v
        Select Learning Priorities
                   |
                   v
        AI-Assisted Explanations
                   |
                   v
        Learn from Available
            Resources
                   |
                   v
          Practice with Quizzes
                   |
                   v
        Reassess Understanding
                   |
                   v
          Review Progress
                   |
                   v
        Update Learning Priorities
                   |
                   +------> Repeat
```

This workflow describes the intended learning cycle. Fully automated transitions between performance analysis, recommendations, quizzes, and reassessment depend on the corresponding features being implemented and connected.

---

## 🛠️ Technology Stack

### Frontend

- **React** — Building reusable UI components.
- **Vite** — Frontend development server and build tooling.
- **JavaScript** — Frontend application logic.
- **CSS** — Layout, styling, and responsive design.
- **React Router** — Page navigation, where used.
- **Recharts** — Data visualization, where used.
- **Lucide React** — Icons, where used.
- **Framer Motion** — UI animations, where used.

### Backend

- **Python** — Backend programming language.
- **FastAPI** — REST API development.
- **Uvicorn** — ASGI server.

### Artificial Intelligence

- **Groq API** — AI model access through the configured backend.
- **Retrieval-Augmented Generation (RAG)** — Retrieves relevant learning information to provide context for AI-generated responses, where configured.
- **Document processing** — Supports processing configured learning resources.

### Data Processing and Storage

- **Pandas** — Data processing, where used.
- **CSV datasets** — Academic and topic-level performance information.
- **ChromaDB** — Vector database technology if enabled in the current RAG implementation.

*Some technologies may be optional or limited to specific modules. Refer to the actual project dependencies and configuration for the definitive list.*

---

## 🏗️ System Architecture

```text
+------------------------------------+
|            USER                    |
+-----------------+------------------+
                  |
                  v
+------------------------------------+
|         React + Vite Frontend      |
|                                    |
| Dashboard | AI Assistant | Quizzes |
| Knowledge | Analytics | Study Plan |
+-----------------+------------------+
                  |
                  v
+------------------------------------+
|         Frontend API Layer         |
+-----------------+------------------+
                  |
                  v
+------------------------------------+
|           FastAPI Backend          |
|                                    |
| Academic Data Analysis             |
| AI Assistant Services              |
| Knowledge Retrieval                |
| Learning and Quiz Services         |
+----------+-------------------------+
           |
           +------------------+
           |                  |
           v                  v
+-------------------+  +-------------------+
| Academic Datasets |  | Learning Documents|
| and Performance   |  | and Knowledge Base|
+-------------------+  +---------+---------+
                                 |
                                 v
                       +-------------------+
                       | Configured AI API |
                       | and RAG Services  |
                       +-------------------+
```

The frontend communicates with the backend through API requests. The backend processes requests using the services, datasets, AI provider, and knowledge-retrieval components configured in the project.

---

## 📁 Project Structure

```text
EduTrace/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   └── services/
│   │
│   ├── data/
│   ├── rag/
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   │   └── images/
│   │       ├── dashboard.png
│   │       ├── ai-assistant.png
│   │       ├── ai-robot.png
│   │       ├── knowledge.png
│   │       ├── tasks.png
│   │       └── study-plan.png
│   │
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

*This is a simplified overview. Refer to the repository for the complete source tree.*

## 📸 Screenshots

### 🏠 Home Dashboard
![EduTrace Home Dashboard](https://raw.githubusercontent.com/Snehashree-Hub/EduTrace/clean-main/frontend/public/images/dashboard.png)

### 🤖 AI Study Assistant
![EduTrace AI Study Assistant](https://raw.githubusercontent.com/Snehashree-Hub/EduTrace/clean-main/frontend/public/images/ai-assistant.png)

### 🎓 EduBotAI
![EduTrace EduBotAI](https://raw.githubusercontent.com/Snehashree-Hub/EduTrace/clean-main/frontend/public/images/ai-robot.png)

### 📚 Knowledge Base
![EduTrace Knowledge Base](https://raw.githubusercontent.com/Snehashree-Hub/EduTrace/clean-main/frontend/public/images/knowledge.png)

### ✅ Tasks
![EduTrace Tasks](https://raw.githubusercontent.com/Snehashree-Hub/EduTrace/clean-main/frontend/public/images/tasks.png)

### 📖 Personalized Study Plan
![EduTrace Personalized Study Plan](https://raw.githubusercontent.com/Snehashree-Hub/EduTrace/clean-main/frontend/public/images/study-plan.png)

### 📊 Learning Analytics
*Analytics screenshot will be added when available.*


## 💻 Installation and Setup

### Prerequisites

Install the following:

- Python version supported by the backend dependencies.
- Node.js and npm.
- Git.
- A Groq API key if required by the configured AI service.

### 1. Clone the Repository

```bash
git clone https://github.com/Snehashree-Hub/EduTrace.git
cd EduTrace
```

### 2. Set Up the Backend

From the project root, run:

**Windows PowerShell**

```powershell
cd backend

python -m venv venv

.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

Return to the project root:

```powershell
cd ..
```

Configure the required environment variables before starting the backend.

Start the backend using the module path, if it matches your repository structure:

```powershell
python -m uvicorn backend.app.main:app --reload
```

The default local addresses are commonly:

- API: `http://127.0.0.1:8000`
- API documentation: `http://127.0.0.1:8000/docs`

Use the actual port configured in your project if it differs.

### 3. Set Up the Frontend

Open a second PowerShell terminal:

```powershell
cd frontend

npm install

npm run dev
```

Open the local URL printed by Vite. The default development URL is commonly:

`http://localhost:5173`

Keep both backend and frontend terminals running while testing features that require the API.

---

## 🔐 Environment Configuration

The backend may require environment variables for AI functionality.

Create a local `.env` file in the location expected by the backend configuration.

Example:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Replace the placeholder with your own API key. Use the exact variable name expected by the backend source code.

### Security Guidelines

- Never commit real API keys or passwords.
- Keep `.env` files out of Git.
- Never expose private API keys in frontend JavaScript.
- Use `.env.example` for placeholders only.
- Avoid committing private user data or confidential documents.
- Revoke and rotate any credential that has been exposed.

---

## ⚙️ How EduTrace Works

### Step 1: Analyze Available Data

The backend can process available academic performance data to identify performance patterns.

### Step 2: Identify Learning Gaps

Topic-level performance analysis can help determine which topics may require additional attention. Results depend on data quality and the implemented analysis method.

### Step 3: Provide AI-Assisted Explanations

Users can ask questions through the AI Study Assistant and receive responses from the configured AI service.

### Step 4: Retrieve Relevant Learning Resources

Where RAG is enabled, the system retrieves relevant information from available learning documents and supplies it as context for AI response generation.

### Step 5: Practice and Reassess

Quizzes and learning activities allow users to check their understanding. Reassessment can help determine whether additional practice is needed.

### Step 6: Review Progress

Users can review available analytics, activity information, and goals to plan their next learning activities.

---

## 👥 Target Users

### 🏫 School Students

- Understand difficult concepts.
- Revise lessons.
- Practice topics needing attention.
- Organize study activities.

### 🎓 College Students

- Review academic concepts.
- Prepare for assessments.
- Practice and evaluate understanding.
- Organize learning goals.

### 💼 Working Professionals

- Learn new skills.
- Organize personal learning schedules.
- Track learning activities.
- Balance professional and learning goals.

---

## 🌈 What Makes EduTrace Different?

EduTrace aims to connect several learning activities in one workspace:

- Academic performance analysis.
- Weak-topic identification.
- AI-assisted concept explanations.
- Retrieval from available learning materials.
- Practice and reassessment.
- Learning analytics.
- Study planning and productivity tools.

The key idea is to go beyond answering questions by supporting a broader learning process: identify a gap, learn the concept, practice it, and review progress.

The actual effectiveness of this approach depends on the quality of the datasets, recommendations, AI responses, and connections between the implemented modules.

---

## 🔮 Future Enhancements

Potential future improvements include:

- More reliable weak-topic detection.
- Adaptive quiz difficulty.
- Automated reassessment after practice.
- Recommendations based on previous performance.
- Better source citations for RAG responses.
- Email and mobile notifications.
- Study reminders and calendar integration.
- Detailed learning progress reports.
- Expanded subject coverage.
- Improved mobile responsiveness and accessibility.

These are potential enhancements and are not claims that all features are already implemented.

---

## 🤝 Contributing

Suggestions and contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Test your changes.
5. Submit a pull request with a clear explanation.

For significant changes, consider opening an issue first to discuss the proposed improvement.

---

## ⚠️ Disclaimer

EduTrace is an educational project intended to support learning and academic planning. AI-generated responses may contain errors, and learning insights depend on the quality and completeness of available data. Users should verify important information with reliable learning resources.

---

## 👩‍💻 Project Information

**Project:** EduTrace – AI-Powered Personalized Learning Assistant

**Tagline:** Learn • Track • Grow

**Repository:** [Snehashree-Hub/EduTrace](https://github.com/Snehashree-Hub/EduTrace)

---
