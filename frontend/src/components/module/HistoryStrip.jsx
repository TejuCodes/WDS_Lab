import { useMemo, useState } from "react";

/**
 * ============================================================
 * HISTORY STRIP
 * ------------------------------------------------------------
 * The dated history of one vulnerability class, rendered as a
 * vertical timeline with a year column.
 *
 * WHY THE YEARS ARE NOT EVENLY SPACED
 * They are not, deliberately. A vulnerability class often has four
 * entries in the 2010s and then three in the 2020s, and a timeline
 * with equal spacing would make that look like even coverage. The
 * year is a label, not a scale, so the gaps read correctly as gaps.
 *
 * OWASP appearances are marked, because the version history of the
 * Top 10 is one of the few genuinely long-running records of how a
 * whole field changed its mind, and it is worth seeing in place
 * next to the technical history.
 * ============================================================ */

const OWASP = /owasp top 10 (\d{4})/i;

function markerFor(entry) {
  const m = entry.text.match(OWASP);
  return m ? { kind: "owasp", label: `OWASP Top 10 ${m[1]}` } : null;
}

export default function HistoryStrip({ history = [] }) {
  const [open, setOpen] = useState(() => new Set([history.length - 1]));

  const entries = useMemo(
    () =>
      history
        .map((e, i) => ({ ...e, index: i, marker: markerFor(e) }))
        .slice()
        .sort((a, b) => a.year - b.year || a.index - b.index),
    [history],
  );

  function toggle(i) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <ol className="hist">
      {entries.map((entry, k) => {
        const isOpen = open.has(entry.index);
        return (
          <li key={`${entry.year}-${entry.index}`} className={`hist__item${isOpen ? " is-open" : ""}`}>
            <span className="hist__year">{entry.year}</span>
            <span className="hist__dot" aria-hidden="true" />
            <div className="hist__body">
              <button
                type="button"
                className="hist__toggle"
                onClick={() => toggle(entry.index)}
                aria-expanded={isOpen}
              >
                <span className="hist__title">{entry.title}</span>
                {entry.marker && <span className="badge badge--info">{entry.marker.label}</span>}
              </button>
              {isOpen && <p className="hist__text">{entry.text}</p>}
              {k === 0 && <span className="hist__earliest">earliest</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
