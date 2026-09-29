import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import { getTimeline, getRelease, getChanges, search } from "../api/owaspApi";
import Timeline from "../components/owasp/Timeline";
import SearchBox from "../components/owasp/SearchBox";

/**
 * ============================================================
 * OWASP TOP 10 - HISTORY PAGE
 * ------------------------------------------------------------
 * The centre of the project. Three things live here:
 *   1. the timeline of all 8 editions (all 80 entries, clickable)
 *   2. a "what changed?" panel for the year in the URL (?year=2021)
 *   3. free text search across every entry in every year
 *
 * WHY THE YEAR IS IN THE URL
 *   Storing it in ?year=2021 instead of in a React variable means the
 *   year survives a refresh and can be shared in a link. We read and
 *   write it with useSearchParams, which is React Router's version of
 *   a query string state.
 * ============================================================ */
export default function OwaspHistoryPage() {
  const [params, setParams] = useSearchParams();
  const year = params.get("year") ? Number(params.get("year")) : null;

  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  const [release, setRelease] = useState(null);
  const [changes, setChanges] = useState(null);
  const [yearLoading, setYearLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  /* ---------- load the timeline once ---------- */
  useEffect(() => {
    let cancelled = false;
    getTimeline()
      .then((res) => {
        if (!cancelled) setReleases(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPageError(
            err.response?.data?.message ||
              "Could not reach the API. Start it with: cd backend && npm run dev"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- load one edition when the URL asks for a year ---------- */
  useEffect(() => {
    if (!year) {
      setRelease(null);
      setChanges(null);
      return undefined;
    }

    let cancelled = false;
    setYearLoading(true);

    // The release gives us the 10 summaries; the changes endpoint gives
    // us the added / removed / carried comparison. Two independent
    // calls, so we let them resolve separately and do not wait for the
    // less important one.
    getRelease(year)
      .then((res) => {
        if (!cancelled) setRelease(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPageError(err.response?.data?.message || `Could not load ${year}.`);
        }
      });

    getChanges(year)
      .then((res) => {
        if (!cancelled) setChanges(res.data);
      })
      .catch(() => {
        if (!cancelled) setChanges(null);
      })
      .finally(() => {
        if (!cancelled) setYearLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  /* ---------- run the search when the term changes ---------- */
  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setResults(null);
      return undefined;
    }

    let cancelled = false;
    setSearching(true);

    // 300 ms of quiet before searching, so typing "injection" fires
    // one request instead of nine.
    const timer = window.setTimeout(() => {
      search(q)
        .then((res) => {
          if (!cancelled) setResults(res.data);
        })
        .catch((err) => {
          if (!cancelled) {
            setResults([]);
            setPageError(err.response?.data?.message || "Search failed.");
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term]);

  function selectYear(nextYear) {
    if (year === nextYear) {
      // Clicking the selected year again collapses the panel.
      setParams({});
    } else {
      setParams({ year: String(nextYear) });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearSearch() {
    setQuery("");
    setTerm("");
  }

  if (loading) {
    return (
      <div className="loading" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" /> Loading the OWASP history...
      </div>
    );
  }

  return (
    <>
      <header className="page-head">
        <span className="eyebrow">The history module</span>
        <h1>OWASP Top 10 through the years</h1>
        <p>
          Eight official editions: 2003, 2004, 2007, 2010, 2013, 2017, 2021 and 2025. Each one has
          exactly ten categories. Follow the timeline from the oldest edition to the current one and
          click any entry to open its full lesson.
        </p>
        <SearchBox value={query} onChange={setQuery} onSubmit={setTerm} />
        {searching && (
          <p className="muted" role="status" aria-live="polite">
            <span className="spinner spinner--inline" aria-hidden="true" /> Searching...
          </p>
        )}
      </header>

      {pageError && (
        <div className="notice notice--danger" role="alert">
          {pageError}
        </div>
      )}

      {/* ---------- search results replace the timeline ---------- */}
      {results ? (
        <section className="card section">
          <div className="section__head">
            <h2>
              {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{term.trim()}&rdquo;
            </h2>
            <button type="button" className="btn btn--sm" onClick={clearSearch}>
              <FaTimes /> Clear search
            </button>
          </div>

          {results.length === 0 ? (
            <p className="muted">Nothing matched. Try &ldquo;injection&rdquo;, &ldquo;xss&rdquo; or a year.</p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.slug}>
                      <td>{r.year}</td>
                      <td>{r.owaspId}</td>
                      <td>
                        <Link to={`/owasp/vulnerability/${r.slug}`}>{r.title}</Link>
                      </td>
                      <td>
                        <span className={`badge badge--${r.typicalSeverity}`}>
                          {r.typicalSeverity}
                        </span>
                      </td>
                      <td className="muted">
                        {r.isNewCategoryInThisYear
                          ? "New category this year"
                          : r.isRemovedVsPreviousYear
                            ? "Dropped this year"
                            : "Carried over"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* ---------- the selected year ---------- */}
          {year && release && (
            <section className="card section year-panel">
              <div className="section__head">
                <div>
                  <span className="eyebrow">Selected edition</span>
                  <h2>
                    {release.title} ({release.year})
                  </h2>
                </div>
                <button type="button" className="btn btn--sm" onClick={() => setParams({})}>
                  <FaTimes /> Close
                </button>
              </div>

              <p>{release.summary}</p>

              <div className="grid grid--4">
                <div className="stat">
                  <div className="stat__label">Categories</div>
                  <div className="stat__value">10</div>
                </div>
                <div className="stat">
                  <div className="stat__label">New this year</div>
                  <div className="stat__value">{changes?.counts?.added ?? "-"}</div>
                </div>
                <div className="stat">
                  <div className="stat__label">Dropped</div>
                  <div className="stat__value">{changes?.counts?.removed ?? "-"}</div>
                </div>
                <div className="stat">
                  <div className="stat__label">Carried over</div>
                  <div className="stat__value">{changes?.counts?.carried ?? "-"}</div>
                </div>
              </div>

              {yearLoading && (
                <p className="muted" role="status" aria-live="polite">
                  <span className="spinner spinner--inline" aria-hidden="true" /> Loading the change
                  summary...
                </p>
              )}

              {changes && (
                <div className="grid grid--3">
                  <div>
                    <h3 className="sub">
                      Added <span className="badge badge--new">{changes.diff.added.length}</span>
                    </h3>
                    <ul className="link-list">
                      {changes.diff.added.map((e) => (
                        <li key={e.owaspId}>
                          <span className="link-list__id">{e.owaspId}</span> {e.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="sub">
                      Removed{" "}
                      <span className="badge badge--removed">{changes.diff.removed.length}</span>
                    </h3>
                    <ul className="link-list">
                      {changes.diff.removed.length === 0 ? (
                        <li className="muted">Nothing dropped this year.</li>
                      ) : (
                        changes.diff.removed.map((e) => (
                          <li key={e.owaspId}>
                            <span className="link-list__id">{e.owaspId}</span> {e.title}
                            {e.absorbedBy && <span className="muted"> &rarr; {e.absorbedBy}</span>}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="sub">
                      Carried over{" "}
                      <span className="badge badge--carried">{changes.diff.carried.length}</span>
                    </h3>
                    <ul className="link-list">
                      {changes.diff.carried.map((e) => (
                        <li key={e.owaspId}>
                          <span className="link-list__id">{e.owaspId}</span> {e.title}
                          {e.renamed && <span className="muted"> (renamed)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {changes?.changes?.length > 0 && (
                <>
                  <h3 className="sub">OWASP&apos;s own notes for {year}</h3>
                  <ul className="bullets">
                    {changes.changes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </>
              )}

              {release.sourceUrl && (
                <a
                  className="btn btn--sm"
                  href={release.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <FaExternalLinkAlt /> Read the official {year} list
                </a>
              )}
            </section>
          )}

          {/* ---------- the timeline itself ---------- */}
          <Timeline releases={releases} onSelectYear={selectYear} selectedYear={year} />
        </>
      )}
    </>
  );
}
