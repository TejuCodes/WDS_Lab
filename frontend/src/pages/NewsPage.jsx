import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaExternalLinkAlt,
  FaRss,
  FaSyncAlt,
  FaExclamationCircle,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import { getTimeline } from "../api/owaspApi";
import { getNews } from "../api/newsApi";

/**
 * ============================================================
 * CYBER NEWS
 * ------------------------------------------------------------
 * A REAL, live feed - and the honest parts still matter.
 *
 * The feed comes from our own backend, which reads a fixed list of
 * public RSS/Atom feeds. No API key is needed because RSS is open.
 * Every headline below was published by one of those sources; this
 * page never invents one. If the backend or a publisher is
 * unavailable we SAY SO rather than filling the gap with fiction,
 * because a security page that shows made-up data teaches exactly
 * the wrong lesson.
 *
 * The shape of the request matters as a teaching point:
 *
 *   browser --> our /api/news --> allowlisted publishers
 *
 * and never
 *
 *   browser --> arbitrary URL
 *
 * That middle box is the safe design. It is what stops a visitor
 * from pointing our server at an internal address (SSRF), and it is
 * where the feed HTML gets turned into plain text before it ever
 * reaches the browser (XSS). Both are modules in this project.
 *
 * OWASP's own milestones stay below the feed, pulled from the same
 * dataset as the rest of the site.
 * ============================================================
 */

/** Reference sites that are not part of the feed. Real, stable links. */
const SOURCES = [
  {
    name: "OWASP Foundation",
    url: "https://owasp.org/",
    why: "The organisation behind the Top 10. The latest official edition is the 2025 list.",
  },
  {
    name: "OWASP Top 10 (project page)",
    url: "https://owasp.org/www-project-top-ten/",
    why: "Where each edition, its data and its FAQ live.",
  },
  {
    name: "CWE - Common Weakness Enumeration",
    url: "https://cwe.mitre.org/",
    why: "The catalogue of weakness types the Top 10 entries are drawn from. Great for going deeper.",
  },
  {
    name: "NVD - National Vulnerability Database",
    url: "https://nvd.nist.gov/",
    why: "Real CVE records, useful for looking up a specific product flaw.",
  },
  {
    name: "CISA Known Exploited Vulnerabilities",
    url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
    why: "Which vulnerabilities are actually being exploited in the wild right now.",
  },
  {
    name: "PortSwigger Web Security Academy",
    url: "https://portswigger.net/web-security",
    why: "Free, excellent labs. Everything there is run against deliberately vulnerable apps.",
  },
];

const KINDS = [
  { id: "", label: "Everything" },
  { id: "advisory", label: "Advisories" },
  { id: "news", label: "News" },
  { id: "research", label: "Deep research" },
];

const HOW_MANY = 24;

/** "3 hours ago" style. `publishedAt` is null when a feed omits it. */
function timeAgo(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hour${Math.round(seconds / 3600) === 1 ? "" : "s"} ago`;
  const days = Math.round(seconds / 86400);
  if (days < 31) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const KIND_LABEL = { advisory: "Advisory", news: "News", research: "Research" };

export default function NewsPage() {
  const [timeline, setTimeline] = useState([]);

  // Live feed state
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [kind, setKind] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (activeKind) => {
      setRefreshing(true);
      try {
        const res = await getNews({ kind: activeKind || undefined, limit: HOW_MANY });
        setItems(res.data || []);
        setMeta(res.meta || null);
        setStatus("ready");
        setError("");
      } catch (err) {
        // The message comes from our own error middleware, so it is
        // safe to show. We still keep any items already on screen
        // rather than blanking the page.
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not reach the news service. Is the backend running?"
        );
        setStatus((prev) => (prev === "ready" ? "ready" : "error"));
      } finally {
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    load(kind);
  }, [kind, load]);

  useEffect(() => {
    let cancelled = false;
    getTimeline()
      .then((res) => {
        if (!cancelled) setTimeline(res.data);
      })
      .catch(() => {
        if (!cancelled) setTimeline([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const okSources = meta?.sources?.filter((s) => s.ok) || [];
  const badSources = meta?.sources?.filter((s) => !s.ok) || [];
  // A source that failed to refresh but still has a cached copy is
  // reported by the API as ok + stale. It counts towards
  // "sources reachable", which is technically true and quietly
  // misleading: the stories are old. Counting it separately lets the
  // UI say so.
  const staleSources = okSources.filter((s) => s.stale);

  return (
    <>
      <header className="page-head">
        <span className="eyebrow">
          <FaRss style={{ marginRight: 6 }} /> Staying informed
        </span>
        <h1>Cyber news and sources</h1>
        <p>
          A live feed from {okSources.length || "several"} independent security publications, fetched
          by this project&apos;s own backend and sanitised before it reaches your browser. Nothing
          here is generated. Every story links to the publisher it came from.
        </p>
      </header>

      {/* ---------- the live feed ---------- */}
      <section className="card section">
        <div className="section__head">
          <h2>Latest</h2>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => load(kind)}
            disabled={refreshing}
            aria-busy={refreshing}
          >
            {refreshing ? (
              <>
                <span className="spinner spinner--inline" aria-hidden="true" />
                Refreshing
              </>
            ) : (
              <>
                <FaSyncAlt style={{ marginRight: 6 }} aria-hidden="true" />
                Refresh
              </>
            )}
          </button>
        </div>

        <div className="feed-filters" role="group" aria-label="Filter news by kind">
          {KINDS.map((k) => (
            <button
              key={k.id || "all"}
              type="button"
              className={`chip${kind === k.id ? " chip--on" : ""}`}
              onClick={() => setKind(k.id)}
              aria-pressed={kind === k.id}
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Honest status reporting. Each of these is a real state the
            page can genuinely be in, and each says so in words. */}
        {status === "loading" && (
          <div className="feed-note" role="status">
            <FaClock style={{ marginRight: 8 }} />
            Fetching stories from the publishers...
          </div>
        )}

        {status === "error" && (
          <div className="feed-note feed-note--bad" role="alert">
            <FaExclamationCircle style={{ marginRight: 8 }} aria-hidden="true" />
            <span>
              <strong>The live feed is unavailable.</strong> {error} The source list and the OWASP
              milestones below are served from this project&apos;s own data and still work.
            </span>
          </div>
        )}

        {/* A refresh that fails after a successful load keeps the old
            stories on screen, which is the right call - but it used
            to do so completely silently. The message was written to
            state and then never rendered, so the user was looking at
            stale news with no idea it was stale. Now it is called
            out explicitly and the timestamp below stops claiming the
            list is current. */}
        {status === "ready" && error && (
          <div className="feed-note feed-note--bad" role="alert">
            <FaExclamationCircle style={{ marginRight: 8 }} aria-hidden="true" />
            <span>
              <strong>Could not refresh.</strong> {error} These are the stories from the last
              successful fetch, not necessarily the newest published.
            </span>
          </div>
        )}

        {status === "ready" && items.length === 0 && (
          <div className="feed-note" role="status">
            No stories came back for this filter. That usually means the publishers are rate
            limiting us, or the backend is not running.
          </div>
        )}

        {items.length > 0 && (
          <ul className="feed">
            {items.map((item) => {
              const ago = timeAgo(item.publishedAt);
              return (
                <li key={item.id} className={`feed__item feed__item--${item.sourceKind}`}>
                  <div className="feed__meta">
                    <span className={`feed__kind feed__kind--${item.sourceKind}`}>
                      {KIND_LABEL[item.sourceKind] || item.sourceKind}
                    </span>
                    <span className="feed__source">{item.sourceName}</span>
                    {/* A missing date is real, so we say "no date"
                        rather than implying the story is new. */}
                    <span className="feed__when">
                      {ago ? <time dateTime={item.publishedAt}>{ago}</time> : "no date given"}
                    </span>
                  </div>
                  <h3 className="feed__title">
                    <a href={item.url} target="_blank" rel="noreferrer noopener">
                      {item.title}
                      <FaExternalLinkAlt className="feed__ext" aria-hidden="true" />
                      <span className="sr-only"> (opens in a new tab, at {item.sourceName})</span>
                    </a>
                  </h3>
                  {item.summary && <p className="feed__summary">{item.summary}</p>}
                </li>
              );
            })}
          </ul>
        )}

        {meta && (
          <p className="feed__status muted">
            {meta.counts?.returned} of {meta.counts?.total} stories &middot;{" "}
            {meta.counts?.sourcesOk}/{meta.counts?.sourcesTotal} sources reachable
            {meta.fetchedAt && <> &middot; updated {timeAgo(meta.fetchedAt)}</>}
          </p>
        )}

        {/* Saying the list is partial, and why, before the user has to
            expand anything. */}
        {meta?.partial && (
          <div className="feed-note" role="status">
            <FaClock style={{ marginRight: 8 }} aria-hidden="true" />
            <span>
              This list is incomplete.
              {badSources.length > 0 && (
                <>
                  {" "}
                  {badSources.length} source{badSources.length === 1 ? " is" : "s are"} unreachable
                  right now.
                </>
              )}
              {badSources.length > 0 && staleSources.length > 0 && " "}
              {staleSources.length > 0 && (
                <>
                  {staleSources.length} more
                  {staleSources.length === 1 ? " is" : " are"} showing cached stories from an earlier
                  fetch.
                </>
              )}
            </span>
          </div>
        )}

        {/* If a publisher is down we name it, instead of quietly
            showing a short list that looks complete. */}
        {badSources.length > 0 && (
          <details className="feed__unreachable">
            <summary>
              <FaExclamationCircle style={{ marginRight: 6 }} />
              {badSources.length} source{badSources.length === 1 ? "" : "s"} could not be reached
            </summary>
            <ul>
              {badSources.map((s) => (
                <li key={s.id}>
                  <strong>{s.name}</strong>
                  {/* `lastError` is the field the API actually puts on
                      a source record. Reading `s.reason` here (which
                      only exists on the separate `failures` array)
                      meant every failure just said "unavailable",
                      hiding the real cause. `reason` stays as a
                      fallback in case the shape changes. */}
                  <span className="muted"> &mdash; {s.lastError || s.reason || "unavailable"}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        {okSources.length > 0 && (
          <details className="feed__unreachable">
            <summary>
              <FaCheckCircle style={{ marginRight: 6 }} />
              The {okSources.length} publications in this feed
            </summary>
            <ul>
              {okSources.map((s) => (
                <li key={s.id}>
                  <a href={s.site} target="_blank" rel="noreferrer noopener">
                    {s.name}
                  </a>
                  {s.stale && <span className="muted"> &mdash; cached copy, last fetch failed</span>}
                  {!s.stale && s.blurb && <span className="muted"> &mdash; {s.blurb}</span>}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* ---------- OWASP milestones (this project's own data) ---------- */}
      <section className="card section">
        <h2>Milestones from the OWASP dataset</h2>
        <p>These come from the same API as the rest of the site, so they cannot drift out of date.</p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Year</th>
                <th>Edition</th>
                <th>What it marked</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {timeline.map((r) => (
                <tr key={r.year}>
                  <td>
                    <strong>{r.year}</strong>
                  </td>
                  <td>{r.title}</td>
                  <td className="muted">{r.summary}</td>
                  <td>
                    <Link to={`/owasp?year=${r.year}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- reference links ---------- */}
      <section className="card section">
        <h2>Where else to follow the real news</h2>
        <p>
          Reference sites that are not part of the feed above, plus a few worth bookmarking for
          deeper work.
        </p>
        <div className="grid grid--2">
          {SOURCES.map((s) => (
            <a
              key={s.url}
              className="source-card"
              href={s.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              <strong>
                {s.name} <FaExternalLinkAlt style={{ fontSize: "0.75rem", opacity: 0.6 }} />
              </strong>
              <span className="muted">{s.why}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="card section">
        <h2>How this feed works</h2>
        <p>
          The browser never contacts a news publisher. It asks{" "}
          <em>this project&apos;s own</em> backend, which reads a fixed allowlist of public RSS and
          Atom feeds, strips every tag and entity out of them, and caches the result for a few
          minutes.
        </p>
        <p className="muted">
          That middle box is the point. Because the fetch happens server-side against a hardcoded
          list, a visitor cannot use this endpoint to make our server request an internal address
          (SSRF), and because the HTML is removed before the response is built, a publisher cannot
          inject markup into this page (XSS). Both are covered as hands-on modules. There is no API
          key in this project and nothing secret in the browser bundle: public feeds need neither.
        </p>
      </section>
    </>
  );
}
