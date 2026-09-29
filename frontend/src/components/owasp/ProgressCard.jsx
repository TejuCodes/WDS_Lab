import { useEffect, useState } from "react";
import { getProgress, resetProgress } from "../../api/owaspApi";
import { getLearnerId } from "../../api/learner";
import { Link } from "react-router-dom";

/**
 * ============================================================
 * PROGRESS CARD
 * ------------------------------------------------------------
 * Shows what the learner has finished.
 *
 * There is no login, so the "account" is a generated learnerId in
 * localStorage. When you add real authentication, delete
 * src/api/learner.js and read the id from the logged-in user - the
 * component itself does not have to change.
 * ============================================================ */
export default function ProgressCard({ compact = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // Runs once when the card mounts.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await getProgress(getLearnerId());
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load your progress.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleReset() {
    // A destructive action always needs a confirmation.
    if (!window.confirm("Delete all of your saved progress and start again?")) return;
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      await resetProgress(getLearnerId());
      const res = await getProgress(getLearnerId());
      setData(res.data);
      // Confirm the outcome. Without this a failed reset is silent:
      // the card just stops updating and the learner assumes it
      // worked, which is the worst possible thing to assume about a
      // delete.
      setNotice("Your progress was reset.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset your progress.");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="notice notice--danger" role="alert">
        {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="loading" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" /> Loading your progress...
      </div>
    );
  }

  const stats = data.stats || {};
  const activities = data.activities || [];

  // The three most recent things the learner did.
  const recent = [...activities]
    .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
    .slice(0, compact ? 5 : 20);

  return (
    <div className="progress-card">
      <div className="grid grid--4">
        <div className="stat">
          <div className="stat__label">Lessons done</div>
          <div className="stat__value">
            {stats.vulnerabilitiesCompleted ?? 0}
            <span className="stat__hint"> / {stats.totalCatalogue ?? 80}</span>
          </div>
          <div className="stat__hint">{stats.percentOfCatalogue ?? 0}% of the catalogue</div>
        </div>
        <div className="stat">
          <div className="stat__label">Quizzes taken</div>
          <div className="stat__value">{stats.quizzesCompleted ?? 0}</div>
          <div className="stat__hint">
            average score {stats.averageQuizScore ?? 0}%
          </div>
        </div>
        <div className="stat">
          <div className="stat__label">Labs finished</div>
          <div className="stat__value">{stats.labsCompleted ?? 0}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Editions visited</div>
          <div className="stat__value">{stats.yearsTouched ?? 0}</div>
        </div>
      </div>

      {/* The bar is decorative, but the number it represents must not
          be. `aria-hidden` on the graphic plus a real progressbar
          role on a wrapper means a screen reader gets "42% complete"
          as a sentence instead of two disconnected numbers. */}
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(stats.percentOfCatalogue ?? 0))}
        aria-label={`Catalogue completion: ${Math.min(100, Math.round(stats.percentOfCatalogue ?? 0))} percent`}
      >
        <div
          className="progress-bar__fill"
          aria-hidden="true"
          style={{ width: `${Math.min(100, stats.percentOfCatalogue ?? 0)}%` }}
        />
      </div>

      {recent.length === 0 ? (
        <p className="muted">
          Nothing completed yet. Start with any year in the timeline - your progress saves as you go.
        </p>
      ) : (
        <ul className="activity-list">
          {recent.map((a, i) => (
            <li key={`${a.kind}-${a.ref}-${i}`} className="activity">
              <span className={`badge badge--${a.kind === "lab" ? "info" : a.kind === "quiz" ? "carried" : "new"}`}>
                {a.kind}
              </span>
              <span className="activity__title">
                {a.owaspId ? `${a.owaspId} ` : ""}
                {a.title}
              </span>
              {typeof a.score === "number" && <span className="muted">{a.score}%</span>}
              {a.completedAt && (
                <span className="muted activity__date">
                  {new Date(a.completedAt).toLocaleDateString()}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="progress-card__actions">
        <Link to="/owasp" className="btn btn--sm">
          Continue learning
        </Link>
        <button
          type="button"
          className="btn btn--sm btn--ghost"
          onClick={handleReset}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Resetting..." : "Reset my progress"}
        </button>
      </div>

      {notice && (
        <p className="muted" role="status" aria-live="polite">
          {notice}
        </p>
      )}
    </div>
  );
}
