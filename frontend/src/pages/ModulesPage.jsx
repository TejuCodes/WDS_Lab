import { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaGraduationCap, FaSearch, FaTimes } from "react-icons/fa";
import {
  MANIFEST_FAMILIES,
  MODULE_COUNT,
  bySeverity,
  searchManifest,
} from "../data/modules/manifest";
import ModuleIcon from "../components/module/ModuleIcon";

/**
 * ============================================================
 * MODULES INDEX
 * ------------------------------------------------------------
 * The catalogue, grouped by family. The family blurb does the
 * sorting of ideas for you: within a family, the modules are
 * related in a way the author chose, so that order is kept, and
 * the severity is shown as a label rather than used to reorder.
 *
 * Search is a plain substring match over the fields a learner would
 * actually type - title, the one-line tagline, the CWE id, and any
 * framework reference. Typing "CWE-89" or "att&ck" or "oauth"
 * all find the right module, which is the point of having four
 * vocabularies of references in the data.
 *
 * The deep part of that haystack - the impact bullets, every
 * reference id - is pre-folded into one lowercase `search` string
 * by the manifest generator, from the same field list this page
 * used to build in the browser. The behaviour is unchanged; the
 * lessons themselves are no longer needed to produce these cards.
 * ============================================================ */

const SEVERITY_BADGE = {
  critical: "badge--danger",
  high: "badge--warn",
  medium: "badge--info",
  low: "badge--muted",
};

export default function ModulesPage() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const matches = searchManifest(q);
  const results = matches ? matches.slice().sort(bySeverity) : null;

  return (
    <>
      <header className="page-head">
        <span className="eyebrow">
          <FaGraduationCap style={{ marginRight: 6 }} /> Catalogue
        </span>
        <h1>{MODULE_COUNT} modules</h1>
        <p className="lead">
          Every module carries a plain-English explanation, a flowchart of the attack, a dated history
          of how the class of bug became possible, and at least one interactive puzzle. References
          span OWASP, CWE, MITRE ATT&amp;CK, NIST and the RFCs, so nothing here depends on one list.
        </p>
      </header>

      <div className="search search--modules">
        <span className="search__icon" aria-hidden="true">
          <FaSearch />
        </span>
        <input
          type="search"
          className="search__input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a title, a CWE id, an ATT&amp;CK technique, an RFC..."
          aria-label="Search the module catalogue"
        />
        {query && (
          <button type="button" className="search__clear" onClick={() => setQuery("")} aria-label="Clear search">
            <FaTimes />
          </button>
        )}
        {/* aria-live on the count: a screen-reader user typing in the
            search box otherwise gets no feedback that the result set
            actually changed. The input is labelled, so this is the
            only confirmation they get. */}
        <span className="search__count" role="status" aria-live="polite">
          {matches ? `${matches.length} of ${MODULE_COUNT}` : `${MODULE_COUNT} total`}
        </span>
      </div>

      {results ? (
        results.length ? (
          <div className="grid grid--3">
            {results.map((m) => (
              <ModuleCard key={m.key} module={m} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Nothing matches “{query}”</h2>
            <p>
              Try a title, an id such as <code>CWE-89</code>, a technique such as{" "}
              <code>T1190</code>, or a source such as <code>NIST</code>.
            </p>
          </div>
        )
      ) : (
        MANIFEST_FAMILIES.map((family) => (
          <section key={family.id} className="section modfam">
            <div className="modfam__head">
              <h2>{family.label}</h2>
              <span className="badge badge--muted">{family.modules.length}</span>
            </div>
            <p className="muted modfam__blurb">{family.blurb}</p>
            <div className="grid grid--3">
              {family.modules.map((m) => (
                <ModuleCard key={m.key} module={m} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}

function ModuleCard({ module }) {
  return (
    <Link to={`/modules/${module.key}`} className="card modcard">
      <div className="modcard__head">
        <span className={`modcard__icon modcard__icon--${module.severity}`}>
          <ModuleIcon name={module.icon} />
        </span>
        <span className={`badge ${SEVERITY_BADGE[module.severity]}`}>{module.severity}</span>
      </div>
      <h3>{module.title}</h3>
      <p className="muted">{module.tagline}</p>
      <div className="modcard__foot">
        <span className="badge badge--muted">{module.cwe}</span>
        <span className="badge badge--muted">{module.historyCount} history entries</span>
        <span className="modcard__go">
          Open <FaArrowRight />
        </span>
      </div>
    </Link>
  );
}
