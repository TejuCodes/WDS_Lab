import { useMemo, useState } from "react";
import { FaCheck, FaTimes, FaRedo, FaLightbulb, FaGripVertical, FaArrowDown } from "react-icons/fa";
import { getAttackPath } from "../../lib/diagramLayout";

/**
 * ============================================================
 * PUZZLE
 * ------------------------------------------------------------
 * Four interactive shapes, chosen per module in the data file. Every
 * module gets "order the attack" for free from its diagram, plus one
 * more shape so the exercises do not all feel the same.
 *
 *   order    - rebuild the attack as a numbered sequence. Derived
 *              from the diagram, so the two can never disagree.
 *   spot     - click the line that is genuinely wrong. The wrong
 *              lines are marked in the data, and the explanation
 *              says why the others are fine, which is the part
 *              people actually want.
 *   payload  - substitute a value into a real request, see what the
 *              server would do, then decide whether a named control
 *              stops it. Two steps, because "here is a payload" and
 *              "here is what actually stops it" are two ideas.
 *   headers  - a security header or configuration value, either
 *              pick-the-correct-one or put-the-layers-in-order.
 *
 * All state is local and the answers are in the bundle, so nothing
 * here calls the API. That is a deliberate trade: the OWASP quizzes
 * grade on the server so a learner cannot cheat, but these puzzles
 * are about reading code and reading a request, and the explanation
 * is the reward, so shipping the answer in the bundle costs nothing.
 * ============================================================ */

function useShuffle(seed) {
  return useMemo(() => {
    // Deterministic per module so a re-render never reorders the
    // tiles under the learner's cursor.
    const arr = seed.map((_, i) => i);
    let n = seed.length;
    let s = seed.length * 2654435761 + 1013904223;
    for (let i = n - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [seed]);
}

/* ------------------------------------------------------------------ order */

function OrderPuzzle({ module }) {
  const path = getAttackPath(module);
  const correct = path.map((i) => module.diagram.nodes[i].text);
  const order = useShuffle(path);
  const [placed, setPlaced] = useState([]);
  const [done, setDone] = useState(false);

  const remaining = order.filter((i) => !placed.includes(i));

  function place(i) {
    if (done || placed.includes(i)) return;
    const next = [...placed, i];
    setPlaced(next);
    if (next.length === path.length) setDone(true);
  }

  /**
   * Taking a step back truncates from that position rather than
   * splicing the one tile out. The steps after it were placed on the
   * assumption that it came first, so leaving them in place would
   * silently produce a sequence that can never be completed.
   */
  function takeBack(at) {
    if (done) return;
    setPlaced(placed.slice(0, at));
  }

  function reset() {
    setPlaced([]);
    setDone(false);
  }

  const wrongAt = done
    ? placed.findIndex((nodeIndex, k) => module.diagram.nodes[nodeIndex].text !== correct[k])
    : -1;

  return (
    <div className="pz">
      <p className="pz__prompt">
        Put these {path.length} steps in the order the attack happens. Click a step to place it; click a
        placed step to take it back.
      </p>

      <ol className={`pz__slots${done ? (wrongAt === -1 ? " is-solved" : " is-failed") : ""}`}>
        {placed.map((nodeIndex, k) => {
          const isRight = module.diagram.nodes[nodeIndex].text === correct[k];
          return (
            <li key={nodeIndex}>
              <button
                type="button"
                className={`pz__slot${done ? (isRight ? " is-right" : " is-wrong") : ""}`}
                onClick={() => takeBack(k)}
                disabled={done}
              >
                <span className="pz__slot-n">{k + 1}</span>
                {module.diagram.nodes[nodeIndex].text}
              </button>
            </li>
          );
        })}
        {Array.from({ length: path.length - placed.length }, (_, k) => (
          <li key={`empty-${k}`} className="pz__slot-empty" aria-hidden="true">
            <span className="pz__slot-n">{placed.length + k + 1}</span>
          </li>
        ))}
      </ol>

      <div className="pz__pool">
        {remaining.map((i) => (
          <button key={i} type="button" className="pz__tile" onClick={() => place(i)}>
            <FaGripVertical aria-hidden="true" />
            {module.diagram.nodes[i].text}
          </button>
        ))}
        {remaining.length === 0 && !done ? <span className="muted">All placed.</span> : null}
      </div>

      {done && (
        /* role="status" so a screen reader announces the verdict the
           moment it appears. Without it the result is silent: a
           blind user clicks the last tile and hears nothing. */
        <div
          className={`notice notice--${wrongAt === -1 ? "success" : "danger"}`}
          role="status"
        >
          {wrongAt === -1 ? (
            <>
              <strong>Correct.</strong> That is the whole chain, ending at step {placed.length}. Compare it
              with the diagram above - the last step is where the result lands.
            </>
          ) : (
            <>
              <strong>Not quite.</strong> Step {wrongAt + 1} is out of place, and the first thing that follows it
              is the step you need there. Compare it with the diagram above.
            </>
          )}
        </div>
      )}

      <div className="pz__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={reset} disabled={!placed.length}>
          <FaRedo /> Start again
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- spot */

function SpotPuzzle({ puzzle }) {
  const [picked, setPicked] = useState([]);
  const solved = picked.length > 0;

  function toggle(i) {
    if (solved) return;
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  }

  const hits = picked.filter((i) => puzzle.lines[i].vulnerable).length;
  const total = puzzle.lines.filter((l) => l.vulnerable).length;

  return (
    <div className="pz">
      <p className="pz__prompt">{puzzle.prompt}</p>

      <ul className="pz__code">
        {puzzle.lines.map((line, i) => {
          const isVuln = Boolean(line.vulnerable);
          const wasPicked = picked.includes(i);
          const state = solved ? (isVuln ? " is-vuln" : " is-safe") : wasPicked ? " is-picked" : "";
          return (
            <li key={i}>
              <button
                type="button"
                className={`pz__code-line${state}`}
                onClick={() => toggle(i)}
                disabled={solved}
              >
                <span className="pz__line-no">{i + 1}</span>
                <code>{line.text}</code>
                <span className="pz__mark" aria-hidden="true">
                  {solved ? (isVuln ? <FaTimes /> : <FaCheck />) : wasPicked ? <FaCheck /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {solved && (
        <div
          className={`notice notice--${hits === total ? "success" : "danger"}`}
          role="status"
        >
          <strong>
            {hits} of {total} found.
          </strong>{" "}
          {puzzle.explain}
        </div>
      )}

      <div className="pz__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPicked([])} disabled={!picked.length}>
          <FaRedo /> Clear
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- payload */

function PayloadPuzzle({ puzzle }) {
  const [chosen, setChosen] = useState(null);
  // `revealed` is the "show me the verdict" step. `checkAnswer` is the
  // follow-up question about the control. They are deliberately
  // SEPARATE states: sharing one variable meant the second question
  // overwrote the first answer, so the payload verdict disappeared
  // and a learner could silently change their mind after grading.
  const [revealed, setRevealed] = useState(false);
  const [checkAnswer, setCheckAnswer] = useState(null);

  const assembled = puzzle.base.replace("{slot}", puzzle.options[chosen]?.text ?? "{slot}");
  const isRight = chosen === puzzle.answer;
  const checkIsRight = checkAnswer === puzzle.check?.answer;

  function reset() {
    setChosen(null);
    setRevealed(false);
    setCheckAnswer(null);
  }

  return (
    <div className="pz">
      <p className="pz__prompt">{puzzle.prompt}</p>

      <div className="pz__pool pz__pool--stack">
        {puzzle.options.map((opt, i) => {
          const isAnswer = chosen === i;
          return (
            <button
              key={i}
              type="button"
              className={`pz__tile pz__tile--block${isAnswer ? " is-picked" : ""}`}
              onClick={() => {
                if (revealed) return;
                setChosen(i);
              }}
              disabled={revealed}
            >
              <code>{opt.text}</code>
            </button>
          );
        })}
      </div>

      <div className="pz__request">
        <span className="pz__request-label">The request the server would receive</span>
        <pre className="pz__request-body">
          <code>{assembled}</code>
        </pre>
      </div>

      {chosen !== null && (
        <div className="pz__feedback">
          <p className="pz__note">{puzzle.options[chosen].note}</p>
          <div className="pz__actions">
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setRevealed(true)}>
              Reveal the verdict
            </button>
          </div>
        </div>
      )}

      {revealed && (
        <>
          <div className={`notice notice--${isRight ? "success" : "danger"}`} role="status">
            {isRight ? <strong>That is the one.</strong> : <strong>Not the vulnerability.</strong>}{" "}
            {puzzle.why[String(chosen)]}
          </div>

          {puzzle.check && (
            <div className="pz__check">
              <p className="pz__check-q">
                <FaLightbulb aria-hidden="true" /> {puzzle.check.prompt}
              </p>
              <div className="pz__actions">
                <button
                  type="button"
                  className={`btn btn--sm${checkAnswer === true ? " btn--primary" : " btn--ghost"}`}
                  onClick={() => setCheckAnswer(true)}
                  disabled={checkAnswer !== null}
                  aria-pressed={checkAnswer === true}
                >
                  Yes, it stops this
                </button>
                <button
                  type="button"
                  className={`btn btn--sm${checkAnswer === false ? " btn--primary" : " btn--ghost"}`}
                  onClick={() => setCheckAnswer(false)}
                  disabled={checkAnswer !== null}
                  aria-pressed={checkAnswer === false}
                >
                  No, it does not
                </button>
              </div>
              {checkAnswer !== null && (
                <div
                  className={`notice notice--${checkIsRight ? "success" : "danger"}`}
                  role="status"
                >
                  <strong>
                    {checkAnswer ? "You said yes." : "You said no."} {checkIsRight ? "Correct." : "Not quite."}
                  </strong>{" "}
                  {puzzle.check.why}
                </div>
              )}
            </div>
          )}

          <div className="pz__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>
              <FaRedo /> Try another
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- headers */

/**
 * Dispatcher only. It holds no state of its own, so switching
 * between the pick and sort variants cannot change the number or the
 * order of hooks a single component instance runs - which is what
 * would happen if the mode check lived above a useState call.
 */
function HeadersPuzzle({ puzzle }) {
  return puzzle.mode === "sort" ? <SortPuzzle puzzle={puzzle} /> : <PickPuzzle puzzle={puzzle} />;
}

function PickPuzzle({ puzzle }) {
  const [chosen, setChosen] = useState(null);
  const isRight = chosen === puzzle.answer;

  return (
    <div className="pz">
      <p className="pz__prompt">{puzzle.prompt}</p>
      <p className="pz__question">{puzzle.question}</p>

      <div className="pz__pool pz__pool--stack">
        {puzzle.options.map((opt, i) => {
          const state =
            chosen === null
              ? ""
              : i === puzzle.answer
              ? " is-picked is-right"
              : i === chosen
              ? " is-picked is-wrong"
              : " is-dim";
          return (
            <button
              key={i}
              type="button"
              className={`pz__tile pz__tile--block${state}`}
              onClick={() => chosen === null && setChosen(i)}
              disabled={chosen !== null}
            >
              <code>{opt.text}</code>
              <span className="pz__tile-note">{opt.note}</span>
            </button>
          );
        })}
      </div>

      {chosen !== null && (
        <>
          <div className={`notice notice--${isRight ? "success" : "danger"}`} role="status">
            {isRight ? <strong>Correct.</strong> : <strong>Not the one.</strong>}{" "}
            {puzzle.why[String(chosen)]}
          </div>
          {chosen !== puzzle.answer && (
            <details className="pz__others">
              <summary>Why the other three are wrong</summary>
              <ul>
                {puzzle.options.map((_, i) =>
                  i === chosen ? null : (
                    <li key={i}>
                      <strong>{puzzle.options[i].text}</strong>
                      <span className="muted">{puzzle.why[String(i)]}</span>
                    </li>
                  ),
                )}
              </ul>
            </details>
          )}
          <div className="pz__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setChosen(null)}>
              <FaRedo /> Ask again
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SortPuzzle({ puzzle }) {
  const [order, setOrder] = useState(() => puzzle.items.map((_, i) => i));
  const solved = order.every((itemIndex, k) => itemIndex === puzzle.order[k]);

  function move(k, delta) {
    const next = order.slice();
    const target = k + delta;
    if (target < 0 || target >= next.length) return;
    [next[k], next[target]] = [next[target], next[k]];
    setOrder(next);
  }

  return (
    <div className="pz">
      <p className="pz__prompt">{puzzle.prompt}</p>

      <ol className={`pz__stack${solved ? " is-solved" : ""}`}>
        {order.map((itemIndex, k) => (
          <li key={itemIndex} className="pz__stack-item">
            <span className="pz__stack-n">{k + 1}</span>
            <div className="pz__stack-body">
              <strong>{puzzle.items[itemIndex].text}</strong>
              {solved && <span className="muted">{puzzle.items[itemIndex].why}</span>}
            </div>
            <span className="pz__stack-moves">
              <button
                type="button"
                className="pz__move"
                onClick={() => move(k, -1)}
                disabled={k === 0 || solved}
                aria-label={`Move "${puzzle.items[itemIndex].text}" up`}
              >
                <FaArrowDown style={{ transform: "rotate(180deg)" }} />
              </button>
              <button
                type="button"
                className="pz__move"
                onClick={() => move(k, 1)}
                disabled={k === order.length - 1 || solved}
                aria-label={`Move "${puzzle.items[itemIndex].text}" down`}
              >
                <FaArrowDown />
              </button>
            </span>
          </li>
        ))}
      </ol>

      {solved ? (
        <div className="notice notice--success">
          <strong>Correct order.</strong> Each step depends on the one before it, which is why a control that
          runs after the request is parsed is already too late.
        </div>
      ) : (
        <p className="muted pz__hint">Use the arrows to move a layer up or down.</p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- wrapper */

const LABELS = {
  order: "Order the attack",
  spot: "Spot the flaw",
  payload: "Payload workshop",
  headers: "Header and config check",
};

export default function Puzzle({ module }) {
  const path = getAttackPath(module);
  const puzzle = module.puzzle;
  const [extra, setExtra] = useState(0); // remounts the children on demand

  return (
    <div className="puzzle">
      {/* This heading is visually hidden but real: without it the
          exercises are three anonymous regions of controls with no
          landmark a screen-reader user can jump between. `h3` sits
          correctly under the page's `h2` for this section. */}
      <h3 className="sr-only">Exercises for this module</h3>
      <div className="puzzle__head">
        <span className="puzzle__kind">{puzzle ? LABELS[puzzle.type] : LABELS.order}</span>
        <h4>{puzzle ? puzzle.title : "Put the attack in order"}</h4>
      </div>

      {/* The order puzzle is always available, derived from the diagram. */}
      <section className="puzzle__block" aria-label="Order the attack">
        <OrderPuzzle key={`order-${extra}`} module={module} />
      </section>

      {puzzle && (
        <section className="puzzle__block" aria-label={LABELS[puzzle.type]}>
          {puzzle.type === "spot" && <SpotPuzzle key={`p-${extra}`} puzzle={puzzle} />}
          {puzzle.type === "payload" && <PayloadPuzzle key={`p-${extra}`} puzzle={puzzle} />}
          {puzzle.type === "headers" && <HeadersPuzzle key={`p-${extra}`} puzzle={puzzle} />}
        </section>
      )}

      <div className="puzzle__foot">
        <span className="muted">
          {path.length} steps in the chain, and {puzzle ? "one" : "no"} extra exercise in this module.
        </span>
      </div>
    </div>
  );
}
