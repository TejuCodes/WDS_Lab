import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaShieldAlt, FaHistory, FaGraduationCap, FaServer } from "react-icons/fa";
import { getStats, getTimeline } from "../api/owaspApi";
import ProgressCard from "../components/owasp/ProgressCard";
import { MODULE_COUNT } from "../data/modules/manifest";

/**
 * ============================================================
 * HOME
 * ------------------------------------------------------------
 * Answers "what is this?" before the learner clicks anything:
 *   - what the project is
 *   - how big the dataset is (live numbers from the API)
 *   - the three steps of the learning path
 *   - their own progress
 *
 * `useEffect(..., [])` means "run this once when the page appears".
 * The empty dependency array is the empty array - that is not a
 * bug, it is how you tell React there is nothing to watch.
 * ============================================================ */
export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Promise.allSettled, not Promise.all: with allSettled one failed
    // request no longer throws away the other. Previously a slow
    // /stats response would blank the timeline too, leaving the page
    // with every live number showing "-". Each half now reports its
    // own outcome.
    Promise.allSettled([getStats(), getTimeline()]).then(([statsRes, timelineRes]) => {
      if (cancelled) return;

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value.data);
      } else {
        setError(statsRes.reason?.response?.data?.message || "Could not load the live numbers.");
      }

      if (timelineRes.status === "fulfilled") {
        setTimeline(timelineRes.value.data);
      } else if (statsRes.status !== "fulfilled") {
        // Only surface one error when both are down; the first
        // message is more useful than two copies of itself.
        setError(
          statsRes.reason?.response?.data?.message ||
            "Could not reach the API. Start the backend with: cd backend && npm run dev"
        );
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const latest = timeline.at(-1);

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero card">
        <span className="eyebrow">24 modules &middot; OWASP Top 10 &middot; 2003 &rarr; 2025</span>
        <h1>Learn how web vulnerabilities actually changed</h1>
        <p className="lead">
          The OWASP Top 10 is not a fixed list. It is a series of editions, and comparing them shows
          you how attackers, developers and defenders all learned over twenty years. This project
          puts every edition side by side, and adds 24 focused modules that each carry a flowchart, a
          dated history and an interactive puzzle - cited against OWASP, CWE, MITRE ATT&amp;CK, NIST
          and the RFCs rather than OWASP alone.
        </p>
        <div className="hero__actions">
          <Link to="/modules/sql-injection" className="btn btn--primary">
            <FaGraduationCap /> Start with SQL Injection
          </Link>
          <Link to="/owasp" className="btn">
            <FaHistory /> Open the history timeline
          </Link>
        </div>
        <div className="hero__safety">
          <FaShieldAlt /> Every lab here is local and safe. Nothing scans or attacks anyone
          else&apos;s system.
        </div>
      </section>

      {/* role="alert" so a failed API is announced immediately. */}
      {error && (
        <div className="notice notice--danger" role="alert">
          {error}
        </div>
      )}

      {/* ---------- live numbers ---------- */}
      {/* aria-busy + the loading hint means a screen-reader user is
          told the numbers are still arriving instead of hearing a
          bare "-" read out as "dash". */}
      <section className="grid grid--4" aria-busy={loading} aria-label="Project at a glance">
        <div className="stat">
          <div className="stat__label">Editions stored</div>
          <div className="stat__value">{stats ? stats.releases : loading ? "..." : "-"}</div>
          <div className="stat__hint">2003 &rarr; 2025, no invented years</div>
        </div>
        <div className="stat">
          <div className="stat__label">Lessons available</div>
          <div className="stat__value">{stats ? stats.vulnerabilities : loading ? "..." : "-"}</div>
          <div className="stat__hint">10 categories per edition</div>
        </div>
        <div className="stat">
          <div className="stat__label">Latest official list</div>
          <div className="stat__value">
            {latest ? latest.year : stats ? "2025" : loading ? "..." : "-"}
          </div>
          <div className="stat__hint">OWASP has not published 2026</div>
        </div>
        <div className="stat">
          <div className="stat__label">Modules</div>
          <div className="stat__value">{MODULE_COUNT}</div>
          <div className="stat__hint">5 families, each with a flowchart and a puzzle</div>
        </div>
      </section>

      {/* ---------- the three steps ---------- */}
      <section className="grid grid--3">
        <div className="card section">
          <FaHistory className="card__icon" />
          <h2>1. Follow the timeline</h2>
          <p>
            Start at 2003 and move forward. For every year you see all ten categories, what was new,
            what was dropped and what was merely renamed.
          </p>
        </div>
        <div className="card section">
          <FaGraduationCap className="card__icon" />
          <h2>2. Read and test yourself</h2>
          <p>
            Each entry has a plain-English explanation, a vulnerable snippet with a line-by-line
            walkthrough, the fixed version, and a quiz graded on the server.
          </p>
        </div>
        <div className="card section">
          <FaServer className="card__icon" />
          <h2>3. Practise safely</h2>
          <p>
            Finish with a local lab: find the bug, fix the code, then compare with the model
            solution. Everything runs on your own machine.
          </p>
        </div>
      </section>

      {/* ---------- your progress ---------- */}
      <section className="card section">
        <h2>Your progress</h2>
        <p>
          Progress is stored against a learner id kept in your browser. There is no account and
          nothing is sent anywhere except this app&apos;s own database.
        </p>
        <ProgressCard compact />
      </section>
    </>
  );
}
