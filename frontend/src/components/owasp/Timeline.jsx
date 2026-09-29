import { Link } from "react-router-dom";
import { FaExternalLinkAlt } from "react-icons/fa";

/**
 * ============================================================
 * TIMELINE
 * ------------------------------------------------------------
 * The spine of the history module: all 8 official editions, oldest
 * first, each one expandable.
 *
 * Why the years are always in this order:
 *   OWASP has published the Top 10 in 2003, 2004, 2007, 2010, 2013,
 *   2017, 2021 and 2025. There is no 2005, no 2006, no 2014 and no
 *   2026 edition - the gaps are real, and the API validates them.
 *
 * The API already returns everything this needs in ONE request
 * (GET /api/owasp/timeline), so expanding a year never waits on the
 * network: all 10 titles per year are already in memory.
 * ============================================================ */
export default function Timeline({ releases = [], onSelectYear, selectedYear }) {
  if (releases.length === 0) {
    return <div className="empty-state">No releases found. Run `npm run seed` in the backend.</div>;
  }

  return (
    <div className="timeline">
      {releases.map((release) => {
        const isOpen = selectedYear === release.year;

        return (
          <section className={`timeline__row${isOpen ? " is-open" : ""}`} key={release.year}>
            {/* the rail + year marker */}
            <div className="timeline__marker">
              <span className="timeline__year">{release.year}</span>
              <span className="timeline__dot" aria-hidden="true" />
            </div>

            <div className="timeline__card card">
              <header className="timeline__head">
                <div>
                  <h3 className="timeline__title">{release.title}</h3>
                  <p className="timeline__summary">{release.summary}</p>
                </div>
                <div className="timeline__badges">
                  {release.isLatest && <span className="badge badge--latest">LATEST</span>}
                  <span className="badge badge--muted">{release.totalItems} entries</span>
                </div>
              </header>

              {/* Always visible: the 10 category titles of this edition.
                  This is what makes all 80 entries clickable. */}
              <ol className="timeline__items">
                {release.items.map((item) => (
                  <li key={item.slug}>
                    <Link to={`/owasp/vulnerability/${item.slug}`} className="timeline__item">
                      <span className="timeline__id">{item.owaspId}</span>
                      <span className="timeline__item-title">{item.title}</span>
                      {item.isNewCategoryInThisYear && (
                        <span className="badge badge--new">new</span>
                      )}
                      {item.isRemovedVsPreviousYear && (
                        <span className="badge badge--removed">dropped</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ol>

              <footer className="timeline__foot">
                {onSelectYear && (
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => onSelectYear(release.year)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? "Hide the change summary" : "What changed this year?"}
                  </button>
                )}
                {release.sourceUrl && (
                  <a
                    className="btn btn--sm btn--ghost"
                    href={release.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <FaExternalLinkAlt /> Official OWASP page
                  </a>
                )}
              </footer>
            </div>
          </section>
        );
      })}
    </div>
  );
}
