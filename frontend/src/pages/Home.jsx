import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  BookOpen,
  Bot,
  Database,
  FileText,
  GraduationCap,
  Layers3,
  Lightbulb,
  MessageSquareText,
  NotebookPen,
  PlayCircle,
  Search,
  Sparkles,
  Target,
  CalendarDays,
  CheckCircle2,
  Users,
  Zap,
  ShieldCheck,
  Network,
} from "lucide-react";

import "../styles/home.css";

const modules = [
  {
    icon: Bot,
    title: "AI Assistant",
    description:
      "Ask questions, understand concepts, generate explanations and interact with EduTrace AI.",
    link: "/ai-assistant",
  },
  {
    icon: Database,
    title: "Knowledge Vault",
    description:
      "Keep your notes, documents, study material and useful knowledge connected in one place.",
    link: "/knowledge",
  },
  {
    icon: GraduationCap,
    title: "Personalized Learning",
    description:
      "Learn according to your topics, goals, performance and the areas where you need more practice.",
    link: "/analytics",
  },
  {
    icon: BookOpen,
    title: "Exam Preparation",
    description:
      "Understand concepts, revise topics and work with important questions from your learning material.",
    link: "/study-plan",
  },
  {
    icon: NotebookPen,
    title: "Study Planning",
    description:
      "Organize learning activities and create structured study plans around your goals.",
    link: "/study-plan",
  },
  {
    icon: CalendarDays,
    title: "Productivity",
    description:
      "Manage tasks, schedules, plans and important activities from one connected workspace.",
    link: "/planner",
  },
];

const audiences = [
  {
    icon: GraduationCap,
    title: "School Students",
    text: "Understand subjects, organize notes and build consistent learning habits.",
  },
  {
    icon: BookOpen,
    title: "College Students",
    text: "Prepare for semester exams, projects, technical subjects and skill development.",
  },
  {
    icon: Target,
    title: "Exam Learners",
    text: "Connect your study material with concept learning, revision and practice.",
  },
  {
    icon: Users,
    title: "Working Professionals",
    text: "Learn new skills while managing tasks, schedules and personal knowledge.",
  },
];

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="home-feature-card">
      <div className="home-feature-icon">
        <Icon size={21} />
      </div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function ModuleCard({ icon: Icon, title, description, link }) {
  return (
    <Link to={link} className="home-module-card">
      <div className="home-module-icon">
        <Icon size={22} />
      </div>

      <div className="home-module-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <ArrowRight className="home-module-arrow" size={18} />
    </Link>
  );
}

export default function Home() {
  return (
    <div className="home-page">
      {/* Background watermark */}
      <div className="home-watermark">
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=80"
          alt=""
        />
      </div>

      <div className="home-background-grid" />
      <div className="home-purple-glow home-purple-glow-one" />
      <div className="home-purple-glow home-purple-glow-two" />

      <main className="home-content">
        {/* HERO */}
        <section className="home-hero">
          <div className="home-hero-copy">
            <div className="home-eyebrow">
              <Sparkles size={15} />
              <span>PERSONAL AI WORKSPACE</span>
            </div>

            <h1>
              Meet
              <span className="home-gradient-text"> EduTrace</span>
            </h1>

            <h2>
              Your connected workspace for
              <span> learning, knowledge & productivity.</span>
            </h2>

            <p className="home-hero-description">
              EduTrace brings AI learning, your personal knowledge, exam
              preparation, skill development and everyday productivity
              together in one intelligent workspace.
            </p>

            <div className="home-hero-actions">
              <Link to="/ai-assistant" className="home-primary-button">
                <MessageSquareText size={18} />
                Ask EduTrace AI
                <ArrowRight size={17} />
              </Link>

              <Link to="/knowledge" className="home-secondary-button">
                <Database size={18} />
                Explore Knowledge Vault
              </Link>
            </div>

            <div className="home-trust-line">
              <CheckCircle2 size={16} />
              <span>
                Learn from your knowledge. Understand concepts. Get things
                done.
              </span>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="home-hero-visual">
            <div className="home-orbit orbit-one" />
            <div className="home-orbit orbit-two" />

            <div className="home-ai-core">
              <div className="home-ai-core-inner">
                <Brain size={48} strokeWidth={1.5} />
              </div>
            </div>

            <div className="home-floating-card card-top">
              <div className="floating-icon">
                <Bot size={18} />
              </div>
              <div>
                <strong>EduTrace AI</strong>
                <span>Ready to help</span>
              </div>
            </div>

            <div className="home-floating-card card-left">
              <div className="floating-icon">
                <FileText size={18} />
              </div>
              <div>
                <strong>Your Knowledge</strong>
                <span>Connected to AI</span>
              </div>
            </div>

            <div className="home-floating-card card-right">
              <div className="floating-icon">
                <Lightbulb size={18} />
              </div>
              <div>
                <strong>Learn Concepts</strong>
                <span>Not just answers</span>
              </div>
            </div>

            <div className="home-floating-card card-bottom">
              <div className="floating-icon">
                <Target size={18} />
              </div>
              <div>
                <strong>Personalized</strong>
                <span>Built around you</span>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT IS EDUTRACE */}
        <section className="home-section home-about-section">
          <div className="home-section-heading">
            <div className="home-section-label">
              <Zap size={15} />
              WHAT IS EDUTRACE?
            </div>

            <h2>
              More than an AI chatbot.
              <br />
              <span>A complete learning workspace.</span>
            </h2>

            <p>
              EduTrace is designed to connect the things you already use for
              learning and productivity instead of keeping them separated
              across different tools.
            </p>
          </div>

          <div className="home-feature-grid">
            <FeatureCard
              icon={Brain}
              title="Understand"
              text="Get clear explanations that help you understand concepts instead of simply receiving an answer."
            />

            <FeatureCard
              icon={Database}
              title="Connect Knowledge"
              text="Bring your notes, documents and learning resources into your Knowledge Vault."
            />

            <FeatureCard
              icon={Sparkles}
              title="Personalize"
              text="Use your learning context, goals and performance to make the experience more relevant."
            />

            <FeatureCard
              icon={Target}
              title="Take Action"
              text="Turn what you learn into study plans, tasks, practice sessions and measurable progress."
            />
          </div>
        </section>

        {/* WHAT CAN YOU DO */}
        <section className="home-section">
          <div className="home-section-heading centered">
            <div className="home-section-label">
              <Layers3 size={15} />
              ONE WORKSPACE
            </div>

            <h2>
              What can you do
              <span> with EduTrace?</span>
            </h2>

            <p>
              From understanding a difficult topic to organizing your entire
              learning workflow, EduTrace keeps everything connected.
            </p>
          </div>

          <div className="home-action-grid">
            <div className="home-action-card">
              <div className="home-action-number">01</div>
              <Search size={24} />
              <h3>Ask AI</h3>
              <p>
                Ask questions, request explanations, explore ideas and
                practice concepts through an AI learning assistant.
              </p>
            </div>

            <div className="home-action-card">
              <div className="home-action-number">02</div>
              <FileText size={24} />
              <h3>Use Your Material</h3>
              <p>
                Add notes, documents and study resources so your knowledge
                becomes available to your AI workspace.
              </p>
            </div>

            <div className="home-action-card">
              <div className="home-action-number">03</div>
              <BookOpen size={24} />
              <h3>Prepare & Practice</h3>
              <p>
                Learn concepts, revise topics, work with important questions
                and practice through quizzes.
              </p>
            </div>

            <div className="home-action-card">
              <div className="home-action-number">04</div>
              <CalendarDays size={24} />
              <h3>Plan & Organize</h3>
              <p>
                Convert your learning goals into study plans, tasks,
                schedules and daily actions.
              </p>
            </div>
          </div>
        </section>

        {/* RAG */}
        <section className="home-rag-section">
          <div className="home-rag-visual">
            <div className="rag-center">
              <Brain size={32} />
              <span>EduTrace AI</span>
            </div>

            <div className="rag-node rag-node-one">
              <FileText size={19} />
              <span>Your Notes</span>
            </div>

            <div className="rag-node rag-node-two">
              <Database size={19} />
              <span>Knowledge Vault</span>
            </div>

            <div className="rag-node rag-node-three">
              <Search size={19} />
              <span>Retrieve</span>
            </div>

            <div className="rag-node rag-node-four">
              <Lightbulb size={19} />
              <span>Response</span>
            </div>

            <div className="rag-line line-one" />
            <div className="rag-line line-two" />
            <div className="rag-line line-three" />
            <div className="rag-line line-four" />
          </div>

          <div className="home-rag-copy">
            <div className="home-section-label">
              <Network size={15} />
              RAG-POWERED KNOWLEDGE
            </div>

            <h2>
              Your knowledge.
              <br />
              <span>Connected to AI.</span>
            </h2>

            <p>
              EduTrace uses a Retrieval-Augmented Generation approach to
              connect AI responses with relevant information from your
              available knowledge sources.
            </p>

            <div className="home-rag-points">
              <div>
                <CheckCircle2 size={18} />
                <span>Retrieve relevant learning material</span>
              </div>

              <div>
                <CheckCircle2 size={18} />
                <span>Use your uploaded knowledge as context</span>
              </div>

              <div>
                <CheckCircle2 size={18} />
                <span>Generate useful, context-aware responses</span>
              </div>

              <div>
                <CheckCircle2 size={18} />
                <span>Keep learning connected to your resources</span>
              </div>
            </div>

            <Link to="/knowledge" className="home-text-link">
              Open Knowledge Vault
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        {/* KNOWLEDGE IMAGE */}
        <section className="home-knowledge-banner">
          <div className="home-knowledge-image">
            <img
              src="https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1400&q=80"
              alt="Learning workspace"
            />
          </div>

          <div className="home-knowledge-overlay">
            <div className="home-section-label">
              <BookOpen size={15} />
              KNOWLEDGE VAULT
            </div>

            <h2>
              Turn scattered resources into
              <span> connected knowledge.</span>
            </h2>

            <p>
              Keep your study material, notes, documents and useful resources
              organized so EduTrace can work with the knowledge you provide.
            </p>

            <Link to="/knowledge" className="home-primary-button">
              Explore Knowledge
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        {/* MODULES */}
        <section className="home-section">
          <div className="home-section-heading centered">
            <div className="home-section-label">
              <Layers3 size={15} />
              EDUTRACE MODULES
            </div>

            <h2>
              Everything connected in
              <span> one workspace.</span>
            </h2>

            <p>
              Explore the tools available across learning, knowledge,
              productivity and personal growth.
            </p>
          </div>

          <div className="home-module-grid">
            {modules.map((module) => (
              <ModuleCard key={module.title} {...module} />
            ))}
          </div>
        </section>

        {/* AUDIENCE */}
        <section className="home-section home-audience-section">
          <div className="home-section-heading">
            <div className="home-section-label">
              <Users size={15} />
              BUILT FOR DIFFERENT JOURNEYS
            </div>

            <h2>
              One workspace.
              <br />
              <span>Different ways to learn.</span>
            </h2>

            <p>
              EduTrace can support different learning and productivity
              journeys instead of being limited to one type of user.
            </p>
          </div>

          <div className="home-audience-grid">
            {audiences.map((item) => (
              <div className="home-audience-card" key={item.title}>
                <div className="home-audience-icon">
                  <item.icon size={22} />
                </div>

                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* LEARNING LOOP */}
        <section className="home-learning-loop">
          <div className="home-section-heading centered">
            <div className="home-section-label">
              <PlayCircle size={15} />
              THE EDUTRACE EXPERIENCE
            </div>

            <h2>
              Learn → Practice → Plan → Track
            </h2>

            <p>
              EduTrace connects the complete learning workflow instead of
              treating every activity as a separate experience.
            </p>
          </div>

          <div className="home-loop">
            <div className="home-loop-item">
              <span>01</span>
              <Brain size={23} />
              <strong>Learn</strong>
              <small>Understand concepts</small>
            </div>

            <ArrowRight className="home-loop-arrow" />

            <div className="home-loop-item">
              <span>02</span>
              <CheckCircle2 size={23} />
              <strong>Practice</strong>
              <small>Test your understanding</small>
            </div>

            <ArrowRight className="home-loop-arrow" />

            <div className="home-loop-item">
              <span>03</span>
              <NotebookPen size={23} />
              <strong>Plan</strong>
              <small>Organize your next step</small>
            </div>

            <ArrowRight className="home-loop-arrow" />

            <div className="home-loop-item">
              <span>04</span>
              <Target size={23} />
              <strong>Track</strong>
              <small>See your learning journey</small>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="home-final-cta">
          <div className="home-final-glow" />

          <div className="home-section-label">
            <Sparkles size={15} />
            START WITH EDUTRACE
          </div>

          <h2>
            Your learning workspace
            <br />
            <span>starts here.</span>
          </h2>

          <p>
            Ask a question, add your knowledge or explore the workspace and
            start building your own connected learning experience.
          </p>

          <div className="home-hero-actions">
            <Link to="/ai-assistant" className="home-primary-button">
              <Bot size={18} />
              Start with AI
              <ArrowRight size={17} />
            </Link>

            <Link to="/knowledge" className="home-secondary-button">
              <Database size={18} />
              Add Knowledge
            </Link>
          </div>
        </section>

        <footer className="home-footer">
          <div>
            <strong>EduTrace</strong>
            <span>Personal AI Workspace</span>
          </div>

          <span>
            Learning · Knowledge · Productivity
          </span>
        </footer>
      </main>
    </div>
  );
}
