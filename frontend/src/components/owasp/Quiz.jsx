import { useMemo, useRef, useState } from "react";
import { submitQuiz } from "../../api/owaspApi";
import { getLearnerId } from "../../api/learner";

/**
 * ============================================================
 * QUIZ
 * ------------------------------------------------------------
 * IMPORTANT TEACHING POINT
 * The correct answers are NOT sent to this component. The server
 * strips `correctIndex` and `explanation` from the detail endpoint,
 * and grading happens in `POST /api/vulnerabilities/:slug/quiz`.
 *
 * That matters for two reasons:
 *   1. A learner cannot cheat by opening developer tools.
 *   2. The scoring logic lives in one place, so every quiz is
 *      graded the same way.
 * ============================================================
 */
export default function Quiz({ slug, questions = [] }) {
  // `answers` is an array parallel to `questions`: the index the
  // learner picked for each question, or undefined if unanswered.
  const [answers, setAnswers] = useState(() => questions.map(() => undefined));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // Focused after grading so the score is announced and visible.
  const scoreRef = useRef(null);

  const answered = useMemo(() => answers.filter((a) => a !== undefined).length, [answers]);
  const allAnswered = answered === questions.length;

  function choose(qIndex, optionIndex) {
    // After grading, lock the form so the score cannot change.
    if (result) return;
    setAnswers((prev) => prev.map((a, i) => (i === qIndex ? optionIndex : a)));
  }

  async function grade() {
    setBusy(true);
    setError(null);
    try {
      const res = await submitQuiz(slug, answers, getLearnerId());
      setResult(res.data);
      // Move focus to the score rather than only scrolling. A
      // keyboard or screen-reader user otherwise has no idea the
      // grading finished, because the new content is off-screen and
      // silent. `requestAnimationFrame` waits for React to paint it.
      requestAnimationFrame(() => {
        scoreRef.current?.focus();
      });
    } catch (err) {
      setError(err.response?.data?.message || "The quiz could not be graded. Is the API running?");
    } finally {
      setBusy(false);
    }
  }

  function retry() {
    setAnswers(questions.map(() => undefined));
    setResult(null);
    setError(null);
  }

  if (questions.length === 0) return null;

  return (
    <section className="card section quiz" id="quiz">
      <h2>Quick check: do you understand it?</h2>
      <p>
        {questions.length} questions. Answers are checked on the server, and you get an explanation
        either way.
      </p>

      {questions.map((q, qi) => {
        const picked = answers[qi];
        // isCorrect === null while grading has not happened yet.
        const verdict = result ? result.results?.[qi]?.isCorrect : null;
        return (
          <div className="quiz__q" key={q.id || qi}>
            <h3 className="quiz__prompt" id={`quiz-q-${qi}`}>
              {qi + 1}. {q.question}
            </h3>
            {/* role="group" + the question as its accessible name:
                without it the four buttons are an unlabelled clump.
                aria-pressed carries "you picked this one", which is
                the state a screen-reader user cannot otherwise see,
                because the green/red styling only appears after
                grading. */}
            <div
              className="quiz__options"
              role="group"
              aria-labelledby={`quiz-q-${qi}`}
            >
              {q.options.map((opt, oi) => {
                const isPicked = picked === oi;
                // Styling logic: green for the right answer, red for a
                // wrong pick. Only applied once the server has graded.
                let cls = "quiz__option";
                if (result) {
                  if (result.results?.[qi]?.correctIndex === oi) cls += " is-correct";
                  else if (isPicked) cls += " is-wrong";
                } else if (isPicked) {
                  cls += " is-selected";
                }
                return (
                  <button
                    type="button"
                    key={oi}
                    className={cls}
                    onClick={() => choose(qi, oi)}
                    disabled={Boolean(result)}
                    aria-pressed={isPicked}
                  >
                    <span className="quiz__letter">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {result && (
              <div className={`quiz__feedback${verdict ? " is-good" : " is-bad"}`} role="status">
                <strong>{verdict ? "Correct." : "Not quite."}</strong>{" "}
                {result.results?.[qi]?.explanation}
              </div>
            )}
          </div>
        );
      })}

      {error && (
        <div className="notice notice--danger" role="alert">
          {error}
        </div>
      )}

      <div className="quiz__actions">
        {!result ? (
          <>
            <button
              type="button"
              className="btn btn--primary"
              onClick={grade}
              disabled={!allAnswered || busy}
            >
              {busy ? "Checking..." : "Submit answers"}
            </button>
            {/* role="status" so the count is announced as it changes,
                and so a screen-reader user knows why the button is
                still disabled. */}
            <span className="quiz__counter" role="status">
              {answered} of {questions.length} answered
            </span>
          </>
        ) : (
          <>
            {/* `score` from the API is already a percentage.
                tabIndex={-1} + ref lets focus land here after
                grading; role="status" announces the outcome. */}
            <div
              ref={scoreRef}
              tabIndex={-1}
              role="status"
              className={`quiz__score ${result.score >= 70 ? "is-good" : "is-bad"}`}
            >
              {result.correctCount} / {result.total} correct &middot; {result.score}%
              {result.score >= 70 ? " - passed" : " - have another look above"}
            </div>
            <button type="button" className="btn" onClick={retry}>
              Try again
            </button>
          </>
        )}
      </div>
    </section>
  );
}
