import { useState } from "react";
import { FaFlask, FaLightbulb, FaEye, FaCheckCircle } from "react-icons/fa";
import { getLabSolution, markComplete } from "../../api/owaspApi";
import { getLearnerId } from "../../api/learner";

/**
 * ============================================================
 * LAB PANEL
 * ------------------------------------------------------------
 * The safe practice exercise for this vulnerability.
 *
 * SAFETY IS THE POINT HERE. Every lab is either a paper exercise
 * or something that runs entirely on localhost against data you
 * made up. Nothing in this project scans, attacks or reaches out
 * to any other host. The banner is repeated in the UI so the rule
 * is impossible to miss.
 *
 * Note what the API does and does not send:
 *   GET /:slug/lab              -> task, steps, hint, isSafe   (no solution)
 *   GET /:slug/lab/solution     -> the model answer, on request
 * A learner therefore has to actually attempt the exercise before
 * the answer exists in their browser.
 * ============================================================ */

// Turns the stored machine value into something readable, e.g.
// "identify-the-bug" -> "Identify the bug"
const LAB_TYPES = {
  "identify-the-bug": "Identify the bug",
  "fix-the-code": "Fix the code",
  "spot-the-change": "Spot the change",
  "design-review": "Design review",
};

export default function LabPanel({ slug, lab }) {
  const [solution, setSolution] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  async function revealSolution() {
    setLoadingSolution(true);
    setError(null);
    try {
      const res = await getLabSolution(slug);
      setSolution(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the solution.");
    } finally {
      setLoadingSolution(false);
    }
  }

  async function markLabDone() {
    setError(null);
    try {
      await markComplete(getLearnerId(), { kind: "lab", ref: slug });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your progress.");
    }
  }

  if (!lab) return null;

  return (
    <section className="card section lab" id="lab">
      <div className="lab__head">
        <h2>
          <FaFlask style={{ marginRight: 8, color: "var(--accent)" }} />
          Safe local lab: {lab.title}
        </h2>
        <span className="badge badge--muted">
          {LAB_TYPES[lab.type] || lab.type} &middot; {lab.estimatedMinutes} min
        </span>
      </div>

      <div className="notice notice--warn">
        <strong>Local only.</strong> This exercise runs on your own machine, against sample data you
        made up, or on paper. Never point a payload, scanner or crafted request at a system you do
        not own &mdash; always get written permission first. Practising on someone else&apos;s site
        without permission is illegal in most countries.
      </div>

      <h3 className="sub">Your task</h3>
      <p className="lead">{lab.task}</p>

      {lab.steps?.length > 0 && (
        <>
          <h3 className="sub">Steps</h3>
          <ol className="bullets bullets--numbered">
            {lab.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </>
      )}

      {lab.hint && (
        <details className="lab__hints">
          <summary>
            <FaLightbulb /> Need a hint?
          </summary>
          <p>{lab.hint}</p>
        </details>
      )}

      <div className="lab__actions">
        <button
          type="button"
          className="btn"
          onClick={revealSolution}
          disabled={loadingSolution || Boolean(solution)}
          aria-busy={loadingSolution}
        >
          <FaEye aria-hidden="true" />{" "}
          {solution
            ? "Solution shown below"
            : loadingSolution
              ? "Loading..."
              : "Show model solution"}
        </button>
        <button
          type="button"
          className={`btn ${done ? "btn--success" : "btn--primary"}`}
          onClick={markLabDone}
          disabled={done}
        >
          <FaCheckCircle aria-hidden="true" /> {done ? "Lab completed" : "I finished the lab"}
        </button>
      </div>

      {error && (
        <div className="notice notice--danger" role="alert">
          {error}
        </div>
      )}

      {solution && (
        <div className="lab__solution">
          <h3 className="sub">Model solution</h3>
          {/* `solution` is stored as a single string of prose on purpose:
              it reads as a mentor explaining the ideal answer. */}
          <p className="lead">{solution.solution}</p>

          {solution.relatedPrevention?.length > 0 && (
            <>
              <h4 className="sub">How the prevention list ties in</h4>
              <ul className="bullets">
                {solution.relatedPrevention.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
