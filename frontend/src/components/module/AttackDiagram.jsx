import { useMemo, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { computeLayout, getAttackPath, FONT } from "../../lib/diagramLayout";

/**
 * ============================================================
 * ATTACK DIAGRAM
 * ------------------------------------------------------------
 * A dependency-free SVG flowchart. There is no layout library and no
 * diagram syntax: each module ships a small graph of nodes and edges
 * in its data file, diagramLayout.js works out where the boxes go,
 * and this file only draws them.
 *
 * WHY THERE ARE NO STEP NUMBERS BY DEFAULT
 * The "Order the Attack" puzzle is derived from this same graph, so
 * printing 1-2-3 on the boxes would hand the learner the answer.
 * The reveal toggle is opt-in, and it is the only thing that shows
 * the sequence.
 *
 * The defence node is drawn as a branch hanging off the point where
 * the attack is decided, with a dashed outline, rather than as the
 * next step in a chain. It is a control, not a continuation.
 * ============================================================ */

export default function AttackDiagram({ module }) {
  const [revealed, setRevealed] = useState(false);

  // There used to be a "Redraw" button here. It incremented a nonce
  // used as the SVG's `key`, which forced React to unmount and remount
  // the same element. The layout is computed by `computeLayout(module)`
  // and memoised on `[module]`, so every remount produced a
  // pixel-identical picture: the button looked like it did something
  // and did nothing. The SVG also carries a `viewBox` with
  // `width="100%"`, so it already rescales itself when the window
  // changes and there was never anything to redraw. Removed rather
  // than left in as a control that misleads.
  const { pos, width, height, wrapped, stepOf, routes } = useMemo(
    () => computeLayout(module),
    [module],
  );
  const path = useMemo(() => getAttackPath(module), [module]);

  return (
    <figure className="dia">
      <div className="dia__toolbar">
        <figcaption className="dia__caption">{module.diagram.caption}</figcaption>
        <div className="dia__actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setRevealed((v) => !v)}
            aria-pressed={revealed}
          >
            {revealed ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
            {revealed ? "Hide the order" : `Reveal the ${path.length}-step order`}
          </button>
        </div>
      </div>

      {/* The same chain as an ordered list, for screen readers and for
          any browser that will not lay the SVG out sensibly. */}
      <ol className="sr-only">
        {path.map((i) => (
          <li key={i}>{module.diagram.nodes[i].text}</li>
        ))}
      </ol>

      <svg
        className="dia__svg"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={module.diagram.caption}
        preserveAspectRatio="xMidYMin meet"
      >
        <defs>
          <marker
            id="dia-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="dia__arrowhead" />
          </marker>
        </defs>

        {routes.map((r, k) => (
          <g key={k}>
            <path d={r.d} className="dia__edge" markerEnd="url(#dia-arrow)" />
            {r.label ? (
              <text x={pos.get(r.to).x + pos.get(r.to).w / 2} y={r.mid - 5} className="dia__edge-label" textAnchor="middle">
                {r.label}
              </text>
            ) : null}
          </g>
        ))}

        {module.diagram.nodes.map((node, i) => {
          const p = pos.get(i);
          if (!p) return null;
          const step = revealed ? stepOf.get(i) : null;
          return (
            <g key={i} className={`dia__node dia__node--${node.tone}`}>
              <rect x={p.x} y={p.y} width={p.w} height={p.h} className="dia__box" />
              {step ? (
                <>
                  <rect x={p.x - 10} y={p.y - 10} width={22} height={22} className="dia__step" />
                  <text x={p.x + 1} y={p.y + 6} className="dia__step-text" textAnchor="middle">
                    {step}
                  </text>
                </>
              ) : null}
              {wrapped[i].map((line, k) => (
                <text
                  key={k}
                  x={p.x + p.w / 2}
                  y={p.y + 16 + k * (FONT + 4)}
                  className="dia__text"
                  textAnchor="middle"
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>

      <p className="dia__legend">
        The dashed branch is the control that prevents the flow it branches from.
      </p>
    </figure>
  );
}
