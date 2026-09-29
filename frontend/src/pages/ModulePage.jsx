import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  MANIFEST,
  MANIFEST_FAMILIES,
  MODULE_COUNT,
  getManifest,
  getManifestFamily,
} from "../data/modules/manifest";
import { refsBySource } from "../lib/moduleFormat";
import { loadModule } from "../data/modules/loadModule";
import { getByYear, getEvolution } from "../api/owaspApi";
import {
  FaArrowRight,
  FaBullseye,
  FaCrosshairs,
  FaExternalLinkAlt,
  FaGraduationCap,
  FaHistory,
  FaLink as FaLinkIcon,
  FaShieldAlt,
  FaSitemap,
} from "react-icons/fa";
import AttackDiagram from "../components/module/AttackDiagram";
import HistoryStrip from "../components/module/HistoryStrip";
import ModuleIcon from "../components/module/ModuleIcon";
import Puzzle from "../components/module/Puzzle";

/**
 * ============================================================
 * MODULE PAGE
 * ------------------------------------------------------------
 * A module is a self-contained lesson in ../data/modules. It does not
 * need the OWASP dataset to work: the explanation, the flowchart,
 * the history and the puzzles are all in the module itself.
 *
 * The OWASP cross-link is additive. Twenty of the twenty-four
 * modules have an `owaspConceptKey`, and when they do, this page
 * also fetches the one edition that names the category and every
 * other edition that covered the same idea. The remaining four -
 * OAuth, request smuggling, GraphQL and path traversal - are not
 * OWASP Top 10 categories, and they render without the section at
 * all rather than pretending it is there.
 *
 * The lesson is fetched defensively: if the API is down, the module
 * still reads in full.
 * ============================================================ */

const SEVERITY_BADGE = {
  critical: "badge--danger",
  high: "badge--warn",
  medium: "badge--info",
  low: "badge--muted",
};

export default function ModulePage() {
  const { moduleKey } = useParams();

  /**
   * The lesson itself is fetched, not imported. Opening one module
   * downloads that one family file and no other, so a reader who only
   * ever reads the injection family never downloads the other four.
   * The manifest decides which family, so a route is safe to render
   * from its title while the body is still in flight.
   *
   * `status` is one of loading | ready | missing, kept as explicit
   * state rather than `module === null` so that "still loading" and
   * "no such module" cannot be confused - the first shows a
   * placeholder, the second shows the not-found page. The initial
   * value is read from the manifest so a bad URL renders not-found on
   * the very first paint rather than flashing "Loading…" first.
   */
  const [module, setModule] = useState(null);
  const [status, setStatus] = useState(() => (getManifest(moduleKey) ? "loading" : "missing"));

  useEffect(() => {
    let cancelled = false;
    setModule(null);
    setStatus(getManifest(moduleKey) ? "loading" : "missing");

    loadModule(moduleKey)
      .then((m) => {
        if (cancelled) return;
        setModule(m);
        setStatus(m ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [moduleKey]);

  const [crossLink, setCrossLink] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [linkError, setLinkError] = useState(null);

  useEffect(() => {
    if (!module?.owaspConceptKey) {
      setCrossLink(null);
      setEvolution(null);
      setLinkError(null);
      return undefined;
    }

    let cancelled = false;
    setCrossLink(null);
    setEvolution(null);
    setLinkError(null);

    getByYear(module.owaspYear)
      .then((res) => {
        if (cancelled) return;
        const match = res.data.find(
          (v) => v.owaspId.toUpperCase() === String(module.owaspId).toUpperCase(),
        );
        if (!match) setLinkError(`No ${module.owaspId} entry found in ${module.owaspYear}.`);
        else setCrossLink(match);
      })
      .catch((err) => {
        if (!cancelled) setLinkError(err.response?.data?.message || "The OWASP dataset is unavailable.");
      });

    getEvolution(module.owaspConceptKey)
      .then((res) => {
        if (!cancelled) setEvolution(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setEvolution(null);
      });

    return () => {
      cancelled = true;
    };
  }, [module, moduleKey]);

  if (status === "loading") {
    const entry = getManifest(moduleKey);
    return (
      <div className="empty-state" aria-busy="true">
        <h1>{entry?.title ?? "Loading…"}</h1>
        <p className="muted">Fetching this module.</p>
      </div>
    );
  }

  if (status === "missing" || !module) {
    return (
      <div className="empty-state">
        <h1>Module not found</h1>
        <p>
          There is no module called <code>{moduleKey}</code>.{" "}
          <Link to="/modules">Browse all {MODULE_COUNT} modules</Link> instead.
        </p>
      </div>
    );
  }

  return (
    <ModuleLesson module={module} crossLink={crossLink} evolution={evolution} linkError={linkError} />
  );
}

/**
 * The lesson itself, with the module already in hand.
 *
 * Split out from the loader above so that the whole page - diagram,
 * history, references, puzzles - can be rendered directly by the
 * smoke test with a real module, rather than only its loading
 * placeholder. Anything that goes wrong in the markup shows up in
 * that test instead of in a browser.
 */
export function ModuleLesson({ module, crossLink, evolution, linkError }) {
  const family = getManifestFamily(module.family);
  const position = MANIFEST.findIndex((m) => m.key === module.key) + 1;
  const groupedRefs = refsBySource(module);
  const others = evolution
    ? evolution.filter((v) => v.year !== module.owaspYear).sort((a, b) => a.year - b.year)
    : [];

  return (
    <>
      <header className="page-head">
        <span className="eyebrow">
          <FaGraduationCap style={{ marginRight: 6 }} />
          {family?.label ?? module.family} &middot; module {position} of {MODULE_COUNT}
        </span>
        <h1 className="mod__title">
          <span className={`mod__icon mod__icon--${module.severity}`}>
            <ModuleIcon name={module.icon} />
          </span>
          {module.title}
        </h1>
        <p className="lead">{module.tagline}</p>
        <div className="detail__badges">
          <span className={`badge ${SEVERITY_BADGE[module.severity]}`}>{module.severity} impact</span>
          <span className="badge badge--muted">{module.cwe.id}</span>
          {module.refs.length} references
          {module.history.length} history entries
        </div>
      </header>

      <nav className="mod__jump" aria-label="Sections on this page">
        <a href="#explain">How it works</a>
        <a href="#diagram">Flowchart</a>
        <a href="#history">History</a>
        <a href="#puzzle">Puzzle</a>
        <a href="#refs">References</a>
      </nav>

      <section className="card section" id="explain">
        <h2>
          <FaBullseye aria-hidden="true" /> How it works
        </h2>
        <p className="mod__what">{module.explain.what}</p>
        <p>{module.explain.how}</p>

        <div className="mod__cols">
          <div>
            <h3>What it costs you</h3>
            <ul className="ticks ticks--danger">
              {module.explain.impact.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>What actually fixes it</h3>
            <ul className="ticks ticks--ok">
              {module.explain.prevent.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="card section" id="diagram">
        <h2>
          <FaSitemap aria-hidden="true" /> The attack, step by step
        </h2>
        <p className="muted">
          This is the same chain the puzzle asks you to rebuild. Reading it here is not cheating - it is how
          you check your answer afterwards.
        </p>
        <AttackDiagram module={module} />
      </section>

      <section className="card section" id="history">
        <h2>
          <FaHistory aria-hidden="true" /> How we got here
        </h2>
        <p>
          {module.history.length} entries, from the first public description to where the risk stands now.
          Entries mentioning an OWASP edition are marked.
        </p>
        <HistoryStrip history={module.history} />
      </section>

      <section className="card section" id="puzzle">
        <h2>
          <FaCrosshairs aria-hidden="true" /> Try it
        </h2>
        <Puzzle module={module} />
      </section>

      <section className="card section" id="refs">
        <h2>
          <FaLinkIcon aria-hidden="true" /> References
        </h2>
        <p>
          This module cites {groupedRefs.length} sources across {groupedRefs.length} frameworks. It is
          deliberately not only OWASP: the same class of bug is tracked by at least four independent
          vocabularies, and they do not always agree on what to call it.
        </p>
        <div className="mod__refs">
          {groupedRefs.map(({ src, ids }) => (
            <div key={src} className="mod__ref-group">
              <h3>
                {src} <span className="badge badge--muted">{ids.length}</span>
              </h3>
              <ul>
                {ids.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="muted mod__cwe">
          Primary weakness: <strong>{module.cwe.id}</strong> - {module.cwe.name}.
        </p>
      </section>

      {module.owaspConceptKey ? (
        <section className="card section">
          <h2>
            <FaShieldAlt aria-hidden="true" /> In the OWASP Top 10
          </h2>

          {/* role="alert" so a failed OWASP lookup is announced. It
              renders after the async resolve, so without this it
              appears silently. `notice--danger` matches the treatment
              used for failures elsewhere. */}
          {linkError && (
            <div className="notice notice--danger" role="alert">
              {linkError}
            </div>
          )}

          {crossLink ? (
            <div className="mod__owasp">
              <span className="badge badge--info">
                {crossLink.year} {crossLink.owaspId}
              </span>
              <h3>{crossLink.title}</h3>
              <p>{crossLink.simpleExplanation}</p>
              <Link to={`/owasp/vulnerability/${crossLink.slug}`} className="btn btn--primary">
                Open the full lesson <FaArrowRight />
              </Link>
            </div>
          ) : (
            !linkError && (
              <div className="loading" role="status" aria-live="polite">
                <span className="spinner" aria-hidden="true" /> Loading the OWASP lesson...
              </div>
            )
          )}

          {evolution && (
            <>
              <h3>The same idea across {evolution.length} editions</h3>
              <ol className="timeline-mini timeline-mini--wide">
                {evolution
                  .slice()
                  .sort((a, b) => a.year - b.year)
                  .map((v) => (
                    <li key={v.slug} className={v.year === module.owaspYear ? "is-current" : ""}>
                      <Link to={`/owasp/vulnerability/${v.slug}`}>
                        <strong>{v.year}</strong> {v.owaspId} {v.title}
                      </Link>
                      {v.isNewCategoryInThisYear && <span className="badge badge--new">new</span>}
                      {v.isRemovedVsPreviousYear && <span className="badge badge--removed">dropped</span>}
                    </li>
                  ))}
              </ol>
            </>
          )}

          {evolution && !others.length && (
            <p className="muted">This category has only ever appeared once in the editions on record.</p>
          )}
        </section>
      ) : (
        <section className="card section">
          <h2>
            <FaShieldAlt aria-hidden="true" /> Not an OWASP Top 10 category
          </h2>
          <p>
            {module.title} is tracked by other frameworks - {module.refs
              .filter((r) => !/^owasp top 10/i.test(r.src))
              .slice(0, 2)
              .map((r) => r.src)
              .join(" and ")} among them - but it has never been a Top 10 category of its own in any
            edition from 2003 to 2025. That is a fact about the list, not about the risk.
          </p>
          <Link to="/owasp" className="btn">
            See the whole Top 10 history <FaExternalLinkAlt />
          </Link>
        </section>
      )}

      <section className="card section">
        <h2>Keep going</h2>
        <div className="mod__next">
          {MANIFEST_FAMILIES.filter((f) => f.id === module.family).map((f) => (
            <div key={f.id}>
              <h3>{f.label}</h3>
              <div className="grid grid--3">
                {f.modules.map((m) => (
                  <Link
                    key={m.key}
                    to={`/modules/${m.key}`}
                    className={`module-chip${m.key === module.key ? " is-current" : ""}`}
                  >
                    <strong>
                      <ModuleIcon name={m.icon} /> {m.title}
                    </strong>
                    <span className="muted">{m.tagline}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
