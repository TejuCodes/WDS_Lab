import { Link } from "react-router-dom";
import { FaShieldAlt, FaExternalLinkAlt, FaCode, FaDatabase, FaLock } from "react-icons/fa";

/**
 * ============================================================
 * ABOUT
 * ------------------------------------------------------------
 * Explains what the project is, how it is built, what it will not
 * do, and where the data came from. Useful for anyone who has to
 * run or extend it.
 * ============================================================ */
export default function AboutPage() {
  return (
    <>
      <header className="page-head">
        <span className="eyebrow">About this project</span>
        <h1>Web Vulnerability Learning Environment</h1>
        <p className="lead">
          A self-contained teaching app for the OWASP Top 10 and its history. It exists to make one
          point clearly: the list of the ten worst web security risks has changed every few years,
          and understanding <em>why</em> it changed is more useful than memorising a list.
        </p>
      </header>

      <section className="card section">
        <h2>
          <FaShieldAlt style={{ marginRight: 8, color: "var(--accent)" }} />
          The safety rule
        </h2>
        <p>
          Every exercise in this project is local. Labs are paper exercises, code reviews, or things
          you run on <code>localhost</code> against sample data you created yourself. Nothing here
          scans, exploits or contacts a system you do not own.
        </p>
        <div className="notice notice--warn">
          Testing a system without the owner&apos;s written permission is illegal in most countries
          and can carry prison sentences. This project is for learning on your own machine.
        </div>
      </section>

      <section className="grid grid--2">
        <div className="card section">
          <h2>
            <FaCode style={{ marginRight: 8, color: "var(--accent)" }} />
            How it is built
          </h2>
          <ul className="bullets">
            <li>
              <strong>Backend:</strong> Node.js, Express, Mongoose, MongoDB on port 5000.
            </li>
            <li>
              <strong>Frontend:</strong> React 19 with Vite, React Router, plain CSS with theme
              variables. Port 5173 in development.
            </li>
            <li>
              <strong>Data:</strong> 8 release documents and 80 vulnerability documents, loaded by
              a seed script you can re-run at any time.
            </li>
            <li>
              <strong>Quizzes:</strong> graded by the server. The answer key is never sent to the
              browser before you answer.
            </li>
          </ul>
        </div>

        <div className="card section">
          <h2>
            <FaDatabase style={{ marginRight: 8, color: "var(--accent)" }} />
            How the data is shaped
          </h2>
          <ul className="bullets">
            <li>
              One document per <strong>(year, A-number)</strong> pair, because 2017 A1 and 2021 A03
              are not the same category.
            </li>
            <li>
              Long teaching text lives in 29 shared concept profiles; the seed copies the right
              profile into each year-specific document.
            </li>
            <li>
              A <code>conceptKey</code> links the same idea across editions, which is what powers
              the evolution views and the Modules.
            </li>
            <li>
              The seed validates ranks 1&ndash;10, official year numbers and profile coverage, and
              refuses to run if the source data is wrong.
            </li>
          </ul>
        </div>
      </section>

      <section className="card section">
        <h2>
          <FaLock style={{ marginRight: 8, color: "var(--accent)" }} />
          Known limits, stated honestly
        </h2>
        <ul className="bullets">
          <li>
            <strong>No accounts.</strong> Progress is stored against a random id in your browser&apos;s
            localStorage. Clearing site data resets it, and the progress endpoints are not
            authenticated &mdash; fine for a lab machine, not for a public deployment.
          </li>
          <li>
            <strong>No live news feed.</strong> The Cyber News page links to real official sources
            rather than inventing headlines.
          </li>
          <li>
            <strong>Lab exercises are guided, not automated.</strong> They do not ship a scanner or
            a target application; the steps assume you write the sample code yourself.
          </li>
          <li>
            <strong>The latest list is 2025.</strong> There is no 2026 edition, and this project
            does not invent one.
          </li>
        </ul>
      </section>

      <section className="card section">
        <h2>Official sources</h2>
        <p>
          The titles, orderings and dates in this project follow OWASP&apos;s published editions. For
          anything authoritative, read the original:
        </p>
        <ul className="bullets">
          {[
            ["OWASP Top 10 project", "https://owasp.org/www-project-top-ten/"],
            ["OWASP Top 10 2025", "https://owasp.org/Top10/2025/"],
            ["OWASP Top 10 2021", "https://owasp.org/Top10/2021/"],
            ["OWASP Top 10 2017", "https://owasp.org/Top10/2017/"],
          ].map(([name, url]) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noreferrer noopener">
                {name} <FaExternalLinkAlt style={{ fontSize: "0.75rem", opacity: 0.6 }} />
              </a>
            </li>
          ))}
        </ul>
        <p>
          <Link to="/owasp">Back to the timeline</Link>
        </p>
      </section>
    </>
  );
}
