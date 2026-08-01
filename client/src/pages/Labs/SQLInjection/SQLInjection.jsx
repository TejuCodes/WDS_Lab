import React, { useState, useMemo, useEffect } from "react";
import "../SQLInjection/SQLInjection.css";

const FAKE_USERS = [
  { id: 1, username: "admin", password: "P@ssw0rd!", role: "administrator" },
  { id: 2, username: "guest", password: "guest123", role: "viewer" },
];

const FAKE_LEAK_TABLE = [
  { id: 1, card: "4111-xxxx-xxxx-1234", note: "sample-only, not real" },
  { id: 2, card: "5500-xxxx-xxxx-5678", note: "sample-only, not real" },
];


const DIFFICULTIES = [
  {
    id: "easy",
    label: "Easy",
    tag: "NO FILTERING",
    blurb: "Raw concatenation. Every classic payload works exactly as written.",
  },
  {
    id: "hard",
    label: "Hard",
    tag: "NAIVE ESCAPING",
    blurb: "Single quotes escaped, but double quotes are not.",
  },
  {
    id: "impossible",
    label: "Impossible",
    tag: "PARAMETERIZED",
    blurb: "Prepared statements – input is always inert data.",
  },
];

const QUIZ = [
  {
    q: "What makes ' OR '1'='1 dangerous in a login query?",
    options: [
      "It always evaluates to TRUE, matching a row regardless of password",
      "It deletes the users table",
      "It's a valid username",
      "It only works over HTTPS",
    ],
    correct: 0,
  },
  {
    q: "Why did the 'Hard' difficulty get bypassed with double-quote payload?",
    options: [
      "Double quotes are ignored",
      "Escaping only handled single quotes – incomplete fix",
      "The server had no password",
      "Hard mode is unbeatable",
    ],
    correct: 1,
  },
  {
    q: "What is the most reliable defense against SQL injection?",
    options: [
      "Blocklisting SELECT",
      "Hiding the login form",
      "Parameterized queries / prepared statements",
      "Renaming the users table",
    ],
    correct: 2,
  },
  {
    q: "What does the SQL comment sequence -- (or #) typically do?",
    options: [
      "Encrypts the query",
      "Truncates / comments out the remainder of the query",
      "Adds a new user",
      "Nothing – comments are stripped",
    ],
    correct: 1,
  },
  {
    q: "Besides parameterized queries, which practice reduces impact of a successful injection?",
    options: [
      "Giving the DB user full admin rights",
      "Disabling logging",
      "Applying least privilege to the DB account",
      "Storing passwords in plain text",
    ],
    correct: 2,
  },
];

function escapeSingleQuotesOnly(str) {
  return str.replace(/'/g, "\\'");
}
function looksLikeTautology(input) {
  return /('|")\s*or\s*('|")?\s*1\s*=\s*1|'\s*or\s*'1'\s*=\s*'1|"\s*or\s*"1"\s*=\s*"1/i.test(input);
}
function looksLikeCommentBypass(input) {
  return /^(admin|guest)\s*('|")\s*(--|#|\/\*)/i.test(input.trim());
}
function looksLikeUnion(input) {
  return /union\s+select/i.test(input);
}
function looksLikeStacked(input) {
  return /;\s*drop\s+table|;\s*delete\s+from/i.test(input);
}
function looksLikeBlind(input) {
  return /and\s+1\s*=\s*[12]--|sleep\s*\(/i.test(input);
}
function containsRawQuote(input) {
  return /['"]/.test(input);
}

function runSimulatedLogin(username, password, difficulty) {
  const combined = `${username} ${password}`;

  if (difficulty === "impossible") {
    const match = FAKE_USERS.find((u) => u.username === username && u.password === password);
    return {
      query: `PREPARE stmt FROM 'SELECT * FROM users WHERE username = ? AND password = ?';\nEXECUTE stmt USING '${"•".repeat(
        Math.min(username.length, 12)
      )}', '${"•".repeat(Math.min(password.length, 12))}';`,
      verdict: match ? "SECURE_LOGIN" : "ACCESS_DENIED",
      message: match
        ? `Bound params matched — welcome, ${match.username}. Input never became SQL syntax.`
        : "Bound params do not match any row. No payload can escape.",
      leak: null,
    };
  }

  if (difficulty === "hard") {
    const rawHasTautology = looksLikeTautology(combined);
    const rawHasComment = looksLikeCommentBypass(username);
    const rawHasUnion = looksLikeUnion(combined);
    const rawHasStacked = looksLikeStacked(combined);
    const usesSingleQuoteOnly = /'/.test(combined) && !/"/.test(combined);
    const escapedUser = escapeSingleQuotesOnly(username);
    const escapedPass = escapeSingleQuotesOnly(password);
    const query = `SELECT * FROM users WHERE username='${escapedUser}' AND password='${escapedPass}'`;

    if (usesSingleQuoteOnly && (rawHasTautology || rawHasComment || rawHasUnion || rawHasStacked)) {
      return {
        query,
        verdict: "INJECTION_BLOCKED",
        message: "Single quote escaped — try double-quote variant.",
        leak: null,
      };
    }
    if (rawHasStacked) {
      return {
        query: `SELECT * FROM users WHERE username="${username}" AND password="${password}"`,
        verdict: "INJECTION_SUCCESS_DESTRUCTIVE",
        message: "Stacked query accepted (simulated).",
        leak: null,
      };
    }
    if (rawHasUnion) {
      return {
        query: `SELECT * FROM users WHERE username="${username}" AND password="${password}"`,
        verdict: "INJECTION_SUCCESS_LEAK",
        message: "UNION accepted via double-quote path.",
        leak: FAKE_LEAK_TABLE,
      };
    }
    if (rawHasTautology || rawHasComment) {
      return {
        query: `SELECT * FROM users WHERE username="${username}" AND password="${password}"`,
        verdict: "INJECTION_SUCCESS_BYPASS",
        message: "Double-quote payload bypassed escaping.",
        leak: null,
      };
    }
    const match = FAKE_USERS.find((u) => u.username === username && u.password === password);
    return {
      query,
      verdict: match ? "SECURE_LOGIN" : "ACCESS_DENIED",
      message: match ? `Welcome, ${match.username}.` : "Invalid credentials.",
      leak: null,
    };
  }
  const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
  if (looksLikeStacked(combined)) {
    return {
      query,
      verdict: "INJECTION_SUCCESS_DESTRUCTIVE",
      message: "Stacked query executed (simulated).",
      leak: null,
    };
  }
  if (looksLikeUnion(combined)) {
    return {
      query,
      verdict: "INJECTION_SUCCESS_LEAK",
      message: "UNION SELECT executed, leaked data.",
      leak: FAKE_LEAK_TABLE,
    };
  }
  if (looksLikeBlind(combined)) {
    return {
      query,
      verdict: "INJECTION_SUCCESS_BYPASS",
      message: "Boolean/time-based payload accepted.",
      leak: null,
    };
  }
  if (looksLikeTautology(combined) || looksLikeCommentBypass(username)) {
    return {
      query,
      verdict: "INJECTION_SUCCESS_BYPASS",
      message: "WHERE clause always true — auth bypass.",
      leak: null,
    };
  }
  if (containsRawQuote(combined)) {
    return {
      query: `SELECT * FROM users WHERE username='${username}' AND password='${password}'  -- ⚠ malformed`,
      verdict: "SYNTAX_ERROR",
      message: "Stray quote broke syntax — error leak.",
      leak: null,
    };
  }
  const match = FAKE_USERS.find((u) => u.username === username && u.password === password);
  return {
    query,
    verdict: match ? "SECURE_LOGIN" : "ACCESS_DENIED",
    message: match ? `Welcome, ${match.username}.` : "Invalid credentials.",
    leak: null,
  };
}
const VERDICT_META = {
  SECURE_LOGIN: { label: "ACCESS GRANTED — VALID LOGIN", tone: "safe" },
  ACCESS_DENIED: { label: "ACCESS DENIED", tone: "neutral" },
  SYNTAX_ERROR: { label: "MALFORMED QUERY", tone: "warn" },
  INJECTION_BLOCKED: { label: "INJECTION BLOCKED", tone: "safe" },
  INJECTION_SUCCESS_BYPASS: { label: "INJECTION SUCCESS — AUTH BYPASS", tone: "danger" },
  INJECTION_SUCCESS_LEAK: { label: "INJECTION SUCCESS — DATA LEAK", tone: "danger" },
  INJECTION_SUCCESS_DESTRUCTIVE: { label: "INJECTION SUCCESS — DESTRUCTIVE", tone: "danger" },
};
function isInjectionSuccess(verdict) {
  return verdict && verdict.startsWith("INJECTION_SUCCESS");
}


function EasterEgg({ onClose }) {
  return (
    <div className="egg-overlay" role="dialog">
      <div className="egg-content">
        <p className="egg-glitch">ACCESS GRANTED</p>
        <p className="egg-sub">🥚 you found the injection easter egg.</p>
        <button className="btn btn-primary" onClick={onClose}>
          close [x]
        </button>
      </div>
    </div>
  );
}

export default function SqlInjectionLab() {
  const [difficulty, setDifficulty] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState(null);
  const [showEgg, setShowEgg] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  // Theme effect — matches Sidebar behavior
  useEffect(() => {
    document.body.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const currentDiff = useMemo(() => DIFFICULTIES.find((d) => d.id === difficulty), [difficulty]);

  function handleLogin(e) {
    e.preventDefault();
    if (!difficulty) return;
    const outcome = runSimulatedLogin(username, password, difficulty);
    setResult(outcome);
    if (isInjectionSuccess(outcome.verdict)) setShowEgg(true);
  }

  function pickPayload(payload) {
    setUsername(payload);
    setPassword("anything");
  }

  function selectQuizAnswer(optionIndex) {
    if (quizSubmitted) return;
    const next = [...quizAnswers];
    next[quizIndex] = optionIndex;
    setQuizAnswers(next);
  }

  function score() {
    return QUIZ.reduce((acc, q, i) => acc + (quizAnswers[i] === q.correct ? 1 : 0), 0);
  }

  function resetQuiz() {
    setQuizIndex(0);
    setQuizAnswers([]);
    setQuizSubmitted(false);
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <div className="lab-container">
      {showEgg && <EasterEgg onClose={() => setShowEgg(false)} />}

      <header className="lab-header">
        <p className="eyebrow">OWASP <b>A05:2025 - Injection</b></p>
        <h1>SQL Injection Range</h1>
        <p className="lede">
          A simulated login form to practice SQL injection techniques and understand why
          defenses work or fail. No real database — for education only.
        </p>
      </header>

      <section className="panel">
        <h2>
          <span className="step-no">01</span> Choose difficulty
        </h2>
        <div className="tabs">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              className={`tab tab-${d.id} ${difficulty === d.id ? "tab-active" : ""}`}
              onClick={() => {
                setDifficulty(d.id);
                setResult(null);
              }}
            >
              <span className="tab-label">{d.label}</span>
              <span className="tab-tag">{d.tag}</span>
            </button>
          ))}
        </div>
        {currentDiff && <p className="diff-blurb">{currentDiff.blurb}</p>}
      </section>

      <section className={`panel ${!difficulty ? "panel-disabled" : ""}`}>
        <h2>
          <span className="step-no">02</span> Login
        </h2>
        {!difficulty && <p className="hint">Select a difficulty above to unlock the login form.</p>}
        {difficulty && (
          <>
            <div className="login-card">
              <form className="login-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div className="form-options">
                  <label className="remember-me">
                    <input type="checkbox" /> Remember me
                  </label>
                  <a href="#" className="forgot-password">Forgot Password?</a>
                </div>
                <button type="submit" className="btn btn-primary btn-login">
                  LOGIN
                </button>
              </form>
            </div>

          </>
        )}
      </section>

      <section className={`panel ${!result ? "panel-disabled" : ""}`}>
        <h2>
          <span className="step-no">03</span> Result
        </h2>
        {!result && <p className="hint">Submit the form to see the simulated query.</p>}
        {result && (
          <div className="result">
            <div className={`verdict verdict-${VERDICT_META[result.verdict].tone}`}>
              {VERDICT_META[result.verdict].label}
            </div>
            <pre className="terminal">
              <span className="terminal-prompt">sim@lab:~$ </span>
              {result.query}
              <span className="cursor">▊</span>
            </pre>
            <p className="result-message">{result.message}</p>
            {result.leak && (
              <div className="leak-table">
                <p className="leak-title">⚠ Leaked table (simulated data):</p>
                <table>
                  <thead>
                    <tr>
                      <th>id</th>
                      <th>card</th>
                      <th>note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.leak.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.card}</td>
                        <td>{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Step 4 — What is SQL Injection? (replaces the old explanation accordion) */}
      <section className="panel">
        <h2>
          <span className="step-no">04</span> Understanding SQL Injection
        </h2>
        <div className="sql-definition">
          <div className="def-box">
            <h4>🔓 The core flaw</h4>
            <p>
              SQL injection occurs when untrusted user input is concatenated directly into a SQL query.
              Attackers can craft input that changes the query's logic — bypassing authentication,
              leaking data, or even deleting tables.
            </p>
          </div>
          <div className="def-box">
            <h4>🛡️ Why parameterization works</h4>
            <p>
              Parameterized queries (prepared statements) send the SQL structure and the user data
              separately to the database. The input is always treated as a value, never as executable
              code — eliminating the injection surface.
            </p>
          </div>
          <div className="def-box">
            <h4>⚡ Common attack patterns</h4>
            <p>
              Tautologies (' OR 1=1), UNION queries, stacked statements (; DROP TABLE),
              comment termination (--), and blind boolean/time-based techniques are all classic vectors.
            </p>
          </div>
          <div className="def-box">
            <h4>🔍 Defense in depth</h4>
            <p>
              Besides parameterization: apply least privilege to the DB account, validate input types,
              return generic errors, and monitor for suspicious query patterns.
            </p>
          </div>
        </div>
      </section>
      <section className="panel">
        <h2>
          <span className="step-no">05</span> Quiz
        </h2>
        {!quizSubmitted ? (
          <div className="quiz">
            <p className="quiz-progress">
              Question {quizIndex + 1} of {QUIZ.length}
            </p>
            <p className="quiz-q">{QUIZ[quizIndex].q}</p>
            <div className="quiz-options">
              {QUIZ[quizIndex].options.map((opt, i) => (
                <button
                  key={i}
                  className={`quiz-option ${quizAnswers[quizIndex] === i ? "quiz-option-selected" : ""}`}
                  onClick={() => selectQuizAnswer(i)}
                  type="button"
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="quiz-nav">
              <button
                className="btn btn-ghost"
                disabled={quizIndex === 0}
                onClick={() => setQuizIndex((i) => Math.max(0, i - 1))}
                type="button"
              >
                ◂ back
              </button>
              {quizIndex < QUIZ.length - 1 ? (
                <button
                  className="btn btn-primary"
                  disabled={quizAnswers[quizIndex] === undefined}
                  onClick={() => setQuizIndex((i) => Math.min(QUIZ.length - 1, i + 1))}
                  type="button"
                >
                  next ▸
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={quizAnswers.length < QUIZ.length}
                  onClick={() => setQuizSubmitted(true)}
                  type="button"
                >
                  submit ✔
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="quiz-results">
            <p className="quiz-score">Score: {score()} / {QUIZ.length}</p>
            {QUIZ.map((q, i) => (
              <div
                key={i}
                className={`quiz-review ${quizAnswers[i] === q.correct ? "quiz-review-correct" : "quiz-review-wrong"}`}
              >
                <p className="quiz-review-q">{q.q}</p>
                <p className="quiz-review-a">
                  Your answer: {q.options[quizAnswers[i]]}
                  {quizAnswers[i] !== q.correct && (
                    <>
                      <br />
                      Correct: {q.options[q.correct]}
                    </>
                  )}
                </p>
              </div>
            ))}
            <button className="btn btn-primary" onClick={resetQuiz} type="button">
              retake quiz
            </button>
          </div>
        )}
      </section>

      <footer className="lab-footer">
        Built for educational security training only. Never test these techniques against systems you
        don't own or have written authorization to assess.
      </footer>
    </div>
  );
}