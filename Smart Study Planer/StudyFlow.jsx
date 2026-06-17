// StudyFlow.jsx — single-file React component version
// Usage: import StudyFlow from "./StudyFlow"; then <StudyFlow />
// Requires: React 18+, and the accompanying styles.css from this bundle.

import React, { useState } from "react";
import "./styles.css";

const FEATURES = [
  { icon: "📚", title: "Subject management", desc: "Organise subjects with priority, difficulty and colour coding.", to: "/subjects" },
  { icon: "📅", title: "Exam scheduling",    desc: "Live countdowns so you always know what's next.",               to: "/exams" },
  { icon: "✅", title: "Daily tasks",         desc: "Lightweight task list with priorities and due dates.",          to: "/tasks" },
  { icon: "📈", title: "Progress tracking",   desc: "Visualise completion rates per subject with charts.",           to: "/progress" },
  { icon: "⏱️", title: "Pomodoro timer",      desc: "Built-in 25/5 timer to keep focus sessions deep.",              to: "/pomodoro" },
  { icon: "🧠", title: "Smart planner",       desc: "Weekly study slots auto-prioritised by what matters most.",     to: "/planner" },
];

function FeatureCard({ icon, title, desc, onOpen, loading }) {
  return (
    <button
      type="button"
      className="feature-card"
      onClick={onOpen}
      disabled={loading}
      aria-label={`Open ${title}`}
    >
      <div className="icon">{loading ? "⏳" : icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </button>
  );
}

export default function StudyFlow() {
  const [loadingTo, setLoadingTo] = useState(null);

  const openFeature = (to) => {
    setLoadingTo(to);
    setTimeout(() => {
      console.log("Navigate to", to);
      setLoadingTo(null);
      // In a real app: navigate(to) or window.location.href = to;
    }, 350);
  };

  return (
    <div>
      {/* NAV */}
      <header className="nav">
        <div className="container nav-inner">
          <a href="#" className="logo">
            <span className="logo-mark">🎓</span>
            <span>StudyFlow</span>
          </a>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#" className="btn btn-ghost">Sign in</a>
            <a href="#" className="btn btn-primary">Get started →</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <span className="pill">✨ Smart Study Planner</span>
          <h1>StudyFlow <span className="gradient-text">– Plan. Focus. Achieve.</span></h1>
          <p className="lead">
            StudyFlow brings your subjects, exams, daily tasks and progress into one
            focused dashboard — so you can spend less time organising and more time learning.
          </p>
          <div className="hero-cta">
            <a href="#" className="btn btn-primary btn-lg">Start free →</a>
            <a href="#features" className="btn btn-outline btn-lg">Explore features</a>
          </div>
          <ul className="hero-badges">
            {["No credit card","Dark mode","Pomodoro built-in","Streak tracking"].map(t =>
              <li key={t}>✓ {t}</li>
            )}
          </ul>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section">
        <div className="container">
          <div className="section-head">
            <h2>Smart Planning for Better Learning.</h2>
            <p>Let StudyFlow organize your schedule so you can focus on learning.</p>
          </div>
          <div className="grid features">
            {FEATURES.map(f => (
              <FeatureCard
                key={f.title}
                {...f}
                loading={loadingTo === f.to}
                onOpen={() => openFeature(f.to)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="section section-alt">
        <div className="container grid how">
          {[
            { n: "01", t: "Add your subjects",      d: "Capture what you're studying with priority and difficulty." },
            { n: "02", t: "Schedule exams & tasks", d: "Pin exam dates, then break work into focused daily tasks." },
            { n: "03", t: "Track progress",         d: "Watch your streak grow and completion charts climb." },
          ].map(s => (
            <div key={s.n}>
              <div className="step-num">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="cta-card">
            <h2>Study flow &gt; Netflix flow</h2>
            <p>"Ditch the Scroll, build the Streak"</p>
            <a href="#" className="btn btn-primary btn-lg">Create your account →</a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} StudyFlow</span>
          <span>🌙 Dark mode included</span>
        </div>
      </footer>
    </div>
  );
}
