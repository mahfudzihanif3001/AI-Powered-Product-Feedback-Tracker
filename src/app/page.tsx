"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Types ─── */
interface FeedbackItem {
  id: string;
  text: string;
  status: "open" | "in-progress" | "resolved";
  sentiment: "positive" | "negative" | "neutral";
  category: "Bug" | "Feature" | "UX" | "Performance" | "Other";
  action_summary: string;
}

/* ─── Icon Components (Expo-style line icons, 24px, 1.5pt stroke) ─── */
const Icons = {
  MessageSquare: () => (
    <svg viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Send: () => (
    <svg viewBox="0 0 24 24">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Trash2: () => (
    <svg viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Inbox: () => (
    <svg viewBox="0 0 24 24">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  Sparkles: () => (
    <svg viewBox="0 0 24 24">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  ),
};

/* ─── Sentiment label mapping ─── */
const sentimentLabels: Record<string, string> = {
  positive: "Positive",
  negative: "Negative",
  neutral: "Neutral",
};

/* ─── Status display helpers ─── */
const statusLabels: Record<string, string> = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
};

/* ─── Main Page ─── */
export default function HomePage() {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  /* ─── Toast auto-dismiss ─── */
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  /* ─── Fetch all feedback on mount ─── */
  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data);
      }
    } catch {
      console.error("Failed to fetch feedback");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();

    // Re-sync when the tab regains focus (handles hot-reload data loss)
    const onFocus = () => fetchFeedback();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchFeedback]);

  /* ─── Submit new feedback ─── */
  const handleSubmit = async () => {
    if (!inputText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText.trim() }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setFeedbackList((prev) => [newItem, ...prev]);
        setInputText("");
        setToast({ message: "Feedback submitted & analyzed by AI", type: "success" });
      } else {
        setToast({ message: "Failed to submit feedback", type: "error" });
      }
    } catch {
      setToast({ message: "Network error. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Update status ─── */
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setFeedbackList((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
      } else if (res.status === 404) {
        // Item no longer exists on server (e.g. after hot-reload)
        setFeedbackList((prev) => prev.filter((item) => item.id !== id));
        setToast({ message: "Item expired — server was restarted. List refreshed.", type: "error" });
        fetchFeedback();
      }
    } catch {
      setToast({ message: "Failed to update status", type: "error" });
    }
  };

  /* ─── Delete feedback ─── */
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });

      if (res.ok || res.status === 204 || res.status === 404) {
        // 204 = deleted, 404 = already gone (e.g. after server restart)
        setFeedbackList((prev) => prev.filter((item) => item.id !== id));
        setToast({ message: "Feedback deleted", type: "success" });
      }
    } catch {
      setToast({ message: "Failed to delete feedback", type: "error" });
    }
  };

  /* ─── Keyboard shortcut: Ctrl+Enter to submit ─── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <main className="container">
      {/* ── Header ── */}
      <header className="header">
        <div className="header__icon">
          <Icons.Sparkles />
        </div>
        <h1 className="header__title">Feedback Tracker</h1>
        <p className="header__subtitle">
          AI-powered product feedback analysis
        </p>
      </header>

      {/* ── Submission Form ── */}
      <section className="card form-card" id="feedback-form">
        <label className="form-card__label" htmlFor="feedback-input">
          Submit Feedback
        </label>
        <textarea
          id="feedback-input"
          className="form-card__textarea"
          placeholder="Describe a bug, feature request, or any product feedback…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          rows={4}
        />
        <div className="form-card__actions">
          <button
            id="submit-button"
            className="btn btn--primary"
            onClick={handleSubmit}
            disabled={!inputText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Analyzing with AI…
              </>
            ) : (
              <>
                <Icons.Send />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </section>

      {/* ── Feedback List ── */}
      <section id="feedback-list">
        <div className="list-header">
          <h2 className="list-header__title">All Feedback</h2>
          {feedbackList.length > 0 && (
            <span className="list-header__count">
              {feedbackList.length} item{feedbackList.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="card">
          {isLoading ? (
            <div className="loading-overlay">
              <span className="spinner" />
              Loading feedback…
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <Icons.Inbox />
              </div>
              <p className="empty-state__title">No feedback yet</p>
              <p className="empty-state__text">
                Submit your first feedback above to get started.
              </p>
            </div>
          ) : (
            feedbackList.map((item) => (
              <article
                key={item.id}
                className="feedback-item"
                id={`feedback-${item.id}`}
              >
                {/* Top row: text + delete */}
                <div className="feedback-item__top">
                  <p className="feedback-item__text">{item.text}</p>
                  <button
                    className="btn btn--danger-ghost"
                    onClick={() => handleDelete(item.id)}
                    title="Delete feedback"
                    aria-label="Delete feedback"
                  >
                    <Icons.Trash2 />
                  </button>
                </div>

                {/* Badges */}
                <div className="feedback-item__badges">
                  <span className={`badge badge--${item.sentiment}`}>
                    {sentimentLabels[item.sentiment] || item.sentiment}
                  </span>
                  <span className={`badge badge--${item.category}`}>
                    {item.category}
                  </span>
                </div>

                {/* AI Action Summary */}
                <div className="feedback-item__action">
                  <span className="feedback-item__action-icon">
                    <Icons.Zap />
                  </span>
                  <span className="feedback-item__action-text">
                    {item.action_summary}
                  </span>
                </div>

                {/* Controls: Status + meta */}
                <div className="feedback-item__controls">
                  <div className="feedback-item__status-control">
                    <span className="feedback-item__status-label">Status</span>
                    <select
                      className={`select select--${item.status}`}
                      value={item.status}
                      onChange={(e) =>
                        handleStatusChange(item.id, e.target.value)
                      }
                      aria-label={`Change status for feedback`}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`toast ${toast.type === "error" ? "toast--error" : ""}`}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
