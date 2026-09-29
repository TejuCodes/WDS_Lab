import { Link } from "react-router-dom";
import { FaHistory } from "react-icons/fa";

/**
 * ============================================================
 * HISTORY NOTE - "What Changed?"
 * ------------------------------------------------------------
 * Answers the question every learner eventually asks:
 * "was this in the list last time, and what happened to it?"
 *
 * The API groups the comparison for us under `diff`:
 *   added   - a concept that did not exist in the previous edition
 *   removed - a concept that WAS there and is gone now
 *   carried - still on the list, maybe renamed or moved
 *
 * We highlight the row for the entry the learner is currently
 * reading, so the note stays connected to the lesson on screen.
 * ============================================================ */
export default function HistoryNote({ changes, year, owaspId }) {
  if (!changes) return null;

  const { diff, counts, changes: officialNotes, previousYear, summary } = changes;
  const added = diff?.added ?? [];
  const removed = diff?.removed ?? [];
  const carried = diff?.carried ?? [];

  // Find which bucket this specific A-number belongs to.
  const inAdded = added.find((a) => a.owaspId === owaspId);
  const inRemoved = removed.find((r) => r.owaspId === owaspId);
  const inCarried = carried.find((c) => c.owaspId === owaspId);

  const mine = inAdded
    ? { kind: "new", entry: inAdded }
    : inRemoved
      ? { kind: "removed", entry: inRemoved }
      : inCarried
        ? { kind: "carried", entry: inCarried }
        : null;

  return (
    <section className="card section history">
      <h2>
        <FaHistory style={{ marginRight: 8, color: "var(--accent)" }} />
        What changed in {year}?
      </h2>

      <p>
        {summary}
        {previousYear ? (
          <>
            {" "}
            Compared with <strong>{previousYear}</strong>: {counts?.added} added,{" "}
            {counts?.removed} removed, {counts?.carried} carried over.
          </>
        ) : (
          <> This is the first official OWASP Top 10, so there is nothing to compare it against yet.</>
        )}
      </p>

      {officialNotes?.length > 0 && (
        <ul className="bullets">
          {officialNotes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      )}

      {mine && (
        <div
          className={`notice notice--${
            mine.kind === "removed" ? "warn" : mine.kind === "new" ? "success" : "info"
          }`}
        >
          {mine.kind === "new" && (
            <>
              <strong>This is a new entry in {year}.</strong>{" "}
              {mine.entry.replacedFrom?.length
                ? `It took over from ${mine.entry.replacedFrom.join(", ")}.`
                : "It did not exist as its own category before."}
            </>
          )}
          {mine.kind === "carried" && (
            <>
              <strong>This idea was already on the list.</strong>{" "}
              {mine.entry.wasTitle && mine.entry.wasTitle !== mine.entry.title
                ? `It was called "${mine.entry.wasTitle}" in ${previousYear}.`
                : `It was already present in ${previousYear}.`}
              {mine.entry.renamed ? " The name was updated." : ""}
              {mine.entry.moved ? " Its position in the ranking also changed." : ""}
            </>
          )}
          {mine.kind === "removed" && (
            <>
              <strong>Removed in {year}.</strong> {mine.entry.changeNote}
              {mine.entry.absorbedBy ? ` Now covered by ${mine.entry.absorbedBy}.` : ""}
            </>
          )}
        </div>
      )}

      <div className="grid grid--3 history__cols">
        <div>
          <h3 className="sub">
            Added <span className="badge badge--new">{added.length}</span>
          </h3>
          {added.length === 0 ? (
            <p className="muted">Nothing new this year.</p>
          ) : (
            <ul className="link-list">
              {added.map((e) => (
                <li key={`${e.owaspId}-${e.title}`}>
                  <span className="link-list__id">{e.owaspId}</span> {e.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="sub">
            Removed <span className="badge badge--removed">{removed.length}</span>
          </h3>
          {removed.length === 0 ? (
            <p className="muted">Nothing dropped this year.</p>
          ) : (
            <ul className="link-list">
              {removed.map((e) => (
                <li key={`${e.owaspId}-${e.title}`}>
                  <span className="link-list__id">{e.owaspId}</span> {e.title}
                  {e.absorbedBy && <span className="muted"> &rarr; {e.absorbedBy}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="sub">
            Carried over <span className="badge badge--carried">{carried.length}</span>
          </h3>
          <ul className="link-list">
            {carried.map((e) => (
              <li key={`${e.owaspId}-${e.title}`}>
                <span className="link-list__id">{e.owaspId}</span> {e.title}
                {e.renamed && <span className="muted"> (renamed)</span>}
                {e.moved && !e.renamed && <span className="muted"> (moved up)</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="history__link">
        <Link to={`/owasp?year=${year}`}>See the full {year} list</Link>
      </p>
    </section>
  );
}
