/**
 * ============================================================
 * FILE: src/data/profiles/access-auth-family.js
 * PURPOSE: Concept profiles for authorisation, authentication and
 *          configuration weaknesses.
 *
 * The historical thread that runs through this file is worth
 * pointing out to your students:
 *   2003 "Broken Access Control"        -> present from the start
 *   2003 "Broken Account and Session Management"
 *   2004 "Broken Authentication and Session Management"
 *   2007/2010/2013 same title
 *   2017 "Broken Authentication"        -> shortened, session folded in
 *   2021 "Identification and Authentication Failures"
 *   2025 "Authentication Failures"      -> shortened again
 *
 *   The vulnerability never changed. Only the name and the grouping did.
 *   That is exactly what the History page is meant to teach.
 * ============================================================
 */

const accessAuthFamilyProfiles = {
  /* ---------------------------------------------------------------- */
  "broken-access-control": {
    title: "Broken Access Control",
    relatedConcepts: ["idor", "insecure-design", "csrf", "unvalidated-input"],
    simpleExplanation:
      "Broken access control means a user can reach something they are not allowed to reach. The server checks that you are logged in, but not that YOU are allowed to see THIS page, THIS row, or perform THIS action. Because the 2017 list, it has been the number one risk on every OWASP Top 10, and in 2025 it absorbed SSRF.",
    whyItHappens:
      "Access rules are scattered across controllers, hidden fields, UI visibility and middleware, and they are rarely tested. Developers trust client-side checks (a button that is hidden is not a permission), forget to check the server, and treat unpredictable URLs as protection. A related trap is assuming the framework's default denies everything - most defaults allow until you say otherwise.",
    howItWorks:
      "1. A user discovers an endpoint they should not have: /admin/users, /api/invoices/1042, or ?role=admin. 2. They change the path, the id, or the parameter. 3. The server either never checks, or checks a value supplied by the client. 4. The action succeeds. No exploit tool is needed - understanding the application's own rules is enough.",
    safeExample:
      "It is a flats building with a concierge who verifies you live there, but no locks on the individual flats. Everyone trusts the concierge; nobody checks the doors. Object-level and function-level checks are the locks. Another comparison: a restaurant where customers can read the kitchen's orders screen because the URL is just a number - the number is not a secret, the permission check is the control.",
    impact: [
      "Read other users' private records (invoices, results, medical data).",
      "Perform privileged actions: change roles, approve refunds, publish content.",
      "Access administrative panels and internal APIs.",
      "Because it is often hard to spot in logs, breaches can go unnoticed for months.",
      "Directly maps to regulatory penalties in most data-protection laws."
    ],
    typicalSeverity: "critical",
    vulnerableCode: {
      language: "javascript",
      filename: "express routes - IN SAFE",
      code: `// (a) No function-level check: any logged-in user is "admin".
app.get("/admin/users", requireLogin, async (req, res) => {
  res.json(await User.find({}));
});

// (b) Role taken from the REQUEST BODY, not from the session.
// A user can simply send {"role":"admin"} on registration.
app.post("/register", async (req, res) => {
  const user = await User.create({
    email: req.body.email,
    role: req.body.role || "student"        // BUG
  });
  res.status(201).json({ id: user._id });
});

// (c) URL-level protection without an ownership check (IDOR).
app.get("/api/reports/:id", requireLogin, async (req, res) => {
  res.json(await Report.findById(req.params.id));   // whose report?
});

// (d) Server-side template path from a parameter.
app.get("/preview", (req, res) => {
  res.render(req.query.page);     // may load files outside the folder
});`,
      walkthrough: [
        "(a) Authentication is present but authorisation is missing - this is the exact gap the category is named after.",
        "(b) Mass assignment: any field a client sends gets written. Never accept role, isAdmin or verified from the client.",
        "(c) Object-level authorisation is missing; see the IDOR profile for the full fix.",
        "(d) A user-controlled template or file path is a direct path-traversal risk."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "express routes - SAFE",
      code: `// 1) ONE permission helper, reused everywhere. Default deny.
const PERMISSIONS = {
  admin: ["users:read", "users:write", "reports:read:any"],
  teacher: ["reports:read:any", "grades:write"],
  student: ["reports:read:own", "grades:read:own"]
};

function can(user, permission) {
  return (PERMISSIONS[user?.role] || []).includes(permission);
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Sign in first" });
    if (!can(req.session.user, permission)) {
      return res.status(403).json({ error: "Not allowed" });
    }
    next();
  };
}

// 2) Function-level access control.
app.get("/admin/users", requireLogin, requirePermission("users:read"),
  async (req, res) => res.json(await User.find({}).select("email role")));

// 3) Object-level access control inside the query itself.
app.get("/api/reports/:id", requireLogin, async (req, res) => {
  const report = await Report.findOne({
    _id: req.params.id,
    // Owner OR a permission that allows reading anyone's report
    $or: [{ ownerId: req.session.userId }, { _id: await anyReportIdIfAllowed(req) }]
  });
  if (!report) return res.status(404).json({ error: "Report not found" });
  res.json(report);
});

// 4) Registration accepts ONLY fields on an allow-list.
const REGISTRATION_FIELDS = ["email", "name", "password"];
app.post("/register", async (req, res) => {
  const data = Object.fromEntries(
    REGISTRATION_FIELDS.map((k) => [k, req.body[k]]).filter(([, v]) => v !== undefined)
  );
  data.role = "student";   // set by the SERVER, always
  const user = await User.create(data);
  res.status(201).json({ id: user._id });
});`,
      explanation:
        "Access control becomes manageable when it is centralised: one permission map, one requirePermission helper, ownership predicates inside the queries, and an explicit allow-list of fields on write. Defence in depth also means the UI can hide things for usability, while the server is the only thing that actually enforces rules."
    },
    prevention: [
      "Deny by default. Every route must opt in to being accessible, not opt out of being protected.",
      "Enforce function-level (can this role use this endpoint?) and object-level (is this their record?) checks separately.",
      "Never take roles, permissions, ownership or prices from the request; read them from the session or a verified token.",
      "Use an allow-list of writable fields on every create and update.",
      "Do not rely on hidden menus, disabled buttons or hard-to-guess URLs as protection.",
      "Log every access decision, and alert on repeated 403 responses or sequential id probing.",
      "Test as a low-privilege user on purpose - automated tests should assert that a student gets 403 on /admin.",
      "Keep the permission map in one reviewed file so it can be audited, not scattered across controllers."
    ],
    securePractices: [
      "Ask two questions per route: 'who is allowed to call this?' and 'which objects may they touch?'",
      "Prefer 404 over 403 when existence itself is sensitive.",
      "Design the roles around the data, not around the screens.",
      "Review new endpoints in pull requests with the permission table open next to you.",
      "Remember that mobile apps and API clients bypass your UI entirely - only the server counts."
    ],
    furtherReading: [
      "OWASP Authorization Cheat Sheet",
      "OWASP Access Control Cheat Sheet",
      "OWASP API Security Top 10"
    ],
    quiz: [
      {
        question: "What is the difference between function-level and object-level access control?",
        options: [
          "They are the same thing",
          "Function-level asks WHICH endpoint a role may use; object-level asks WHICH records that user may touch",
          "Function-level is for GET, object-level for POST",
          "Object-level only applies to databases"
        ],
        correctIndex: 1,
        explanation:
          "Both are required. Checking the endpoint but not the row is exactly IDOR; checking the row but not the endpoint leaves admin panels open."
      },
      {
        question: "A hidden 'Admin' menu item is...",
        options: [
          "A valid access control mechanism",
          "A usability feature only - the server must still enforce the permission",
          "Enough if the URL is unguessable",
          "Required by OWASP"
        ],
        correctIndex: 1,
        explanation:
          "Any user can request any URL. UI hiding is for user experience; authorisation must live on the server."
      },
      {
        question: "Why is 'role: req.body.role' in a registration handler dangerous?",
        options: [
          "It is slow",
          "It is mass assignment: the client can grant themselves any role",
          "It breaks the database index",
          "It only works with GET"
        ],
        correctIndex: 1,
        explanation:
          "Never write client-supplied fields that describe permissions. Set the role on the server from a fixed default."
      }
    ],
    lab: {
      title: "Build and test a permission table",
      type: "design-review",
      task:
        "Write a permission table for three roles (student, teacher, admin) over five resources, implement requirePermission, and then write tests that try to break it.",
      steps: [
        "List your resources and the actions on each: read, create, update, delete.",
        "Fill in the table, then convert it into the PERMISSIONS map and the requirePermission helper.",
        "Write one test per cell asserting 403 for a role that should be denied.",
        "Add one object-level test: a student requesting another student's report must get 404."
      ],
      hint: "Start from a blank matrix and only fill cells you deliberately grant. Blank means deny.",
      solution:
        "A deny-by-default matrix plus one shared helper is the pattern that survives growth. The tests are what make it real: without a test that asserts a student gets 403 on /admin/users, the rule is only a wish. The object-level test is equally important, because a role can be correct while a row-level leak remains.",
      isSafe: true,
      estimatedMinutes: 30
    }
  },

  /* ---------------------------------------------------------------- */
  "broken-authentication": {
    title: "Broken Authentication and Session Management",
    relatedConcepts: ["broken-access-control", "insecure-cryptography", "csrf", "dos"],
    simpleExplanation:
      "Broken authentication means the website cannot reliably prove who you are, or forgets who you are once you have proved it. Typical examples: passwords that are checked badly, sessions that never expire, logout buttons that do nothing, passwords sent in a password-reset e-mail, and MFA that can be skipped by changing a URL. OWASP has renamed this entry three times: it is now simply Authentication Failures.",
    whyItHappens:
      "Authentication is a flow, and every step is a chance to get it wrong. Developers invent their own token formats, put identity data in a client-readable cookie, allow infinite password attempts, treat 'user found' as 'password right', and build 'remember me' as a plain database lookup with no expiry. Every one of these is easy to add and easy to forget to remove.",
    howItWorks:
      "1. A login form posts a password. 2. The code finds the user with email X and then compares passwords, but if no user matches it returns a different message or a slower response - a user-enumeration leak. 3. On success it issues a session id that never expires and is also written to localStorage. 4. The logout route clears the frontend but leaves the session valid on the server. 5. The token leaks through a log, a referrer header or a shared computer, and stays valid forever.",
    safeExample:
      "It is a coat check ticket. The coat is only safe if the ticket is hard to guess, is handed to the owner and not to anyone else, and the attendant destroys the ticket when the coat is collected. Broken authentication is a coat check that gives out tickets reading 'seat 42', never destroys them, and leaves the previous owner's coat accessible.",
    impact: [
      "Take over any account, including administrators.",
      "Keep access after the user has logged out or changed their password.",
      "Harvest credentials through a password-reset flow that leaks the token.",
      "Reuse a weak or leaked password across many services via credential stuffing.",
      "Skip the second factor by navigating directly to a post-MFA URL."
    ],
    typicalSeverity: "critical",
    vulnerableCode: {
      language: "javascript",
      filename: "express auth - IN SAFE",
      code: `app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  // (a) ENUMERATION: the messages and timing differ, so an attacker
  // learns which e-mail addresses are registered.
  if (!user) return res.status(404).json({ error: "No such user" });

  // (b) No rate limiting: unlimited guesses.
  if (!(await bcrypt.compare(req.body.password, user.passwordHash))) {
    return res.status(401).json({ error: "Wrong password" });
  }

  // (c) Session never expires and has no rotation on login.
  req.session.userId = user._id;
  req.session.save(() => res.json({ ok: true, token: req.session.id }));
});

// (d) "Remember me" = a plain database id in a long-lived cookie.
app.post("/remember", (req, res) => {
  res.cookie("uid", req.session.userId, {
    maxAge: 365 * 24 * 3600 * 1000, httpOnly: false, secure: false
  });
  res.json({ ok: true });
});

// (e) Logout only clears the client.
app.post("/logout", (req, res) => {
  res.clearCookie("uid");
  res.json({ ok: true });        // the SERVER session is still valid
});`,
      walkthrough: [
        "(a) Different status codes and messages reveal which accounts exist - use one identical message and one identical response time.",
        "(b) Without a limiter, a leaked password list can be tried thousands of times per minute.",
        "(c) Sessions with no absolute and no idle expiry, and no rotation after login, are a permanent liability.",
        "(d) A raw database id in a readable, non-secure cookie is a permanent account takeover waiting to happen.",
        "(e) Logout must destroy the server-side session and revoke refresh tokens, otherwise the cookie still works."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "express auth - SAFE",
      code: `const bcrypt = require("bcrypt");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

// 1) Per-account AND per-IP throttling, with a growing penalty.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  keyGenerator: (req) => req.ip + "|" + String(req.body.email || "").toLowerCase(),
  message: { error: "Too many attempts. Try again later." }
});

app.post("/login", loginLimiter, async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const user = await User.findOne({ email }).select("+passwordHash");

  // 2) Compare against a DUMMY hash when the user is missing, so both
  //    the message and the response time are identical.
  const hash = user?.passwordHash ?? DUMMY_BCRYPT_HASH;
  const passwordOk = await bcrypt.compare(String(req.body.password || ""), hash);

  if (!user || !passwordOk || !user.isActive) {
    // ONE message for every failure. Never say which part was wrong.
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // 3) Regenerate the session id on login (session fixation defence).
  return req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "Login failed" });
    req.session.userId = user._id;
    req.session.createdAt = Date.now();

    // 4) Absolute + idle expiry.
    req.session.cookie.maxAge = 1000 * 60 * 30;   // 30 minutes
    req.session.save(() =>
      res.json({ ok: true, user: { id: user._id, name: user.name } })
    );
  });
});

// 5) Secure cookie settings - set once, centrally.
app.session({
  secret: process.env.SESSION_SECRET,   // long random value, from .env
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,     // JavaScript cannot read it (helps vs XSS)
    secure: true,       // HTTPS only
    sameSite: "lax",    // helps vs CSRF
    maxAge: 1000 * 60 * 30
  }
});

// 6) "Remember me" = a random selector+verifier, not a database id.
app.post("/remember", async (req, res) => {
  const selector = crypto.randomBytes(16).toString("hex");
  const verifier = crypto.randomBytes(32).toString("hex");
  const verifierHash = crypto.createHash("sha256").update(verifier).digest("hex");

  await RememberToken.create({
    userId: req.session.userId,
    selector,
    verifierHash,
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000)
  });
  res.cookie("remember", selector + ":" + verifier, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/"
  });
  res.json({ ok: true });
});

// 7) Logout that actually logs out.
app.post("/logout", async (req, res) => {
  await RememberToken.deleteMany({ userId: req.session.userId });
  res.clearCookie("remember");
  req.session.destroy(() => res.json({ ok: true }));
});`,
      explanation:
        "The pattern is the same as for any security control: rate limit, do not leak which part was wrong, rotate the session id on login, expire sessions, keep the cookie out of JavaScript, and make 'remember me' a random secret instead of an identifier. Each item closes a specific published attack."
    },
    prevention: [
      "Rate limit and delay repeated login attempts, per account and per IP.",
      "Return one identical message and comparable response time for unknown user, wrong password and disabled account.",
      "Hash passwords with a slow algorithm such as bcrypt, scrypt or Argon2, and never store or log the plaintext.",
      "Rotate the session id on login, and set both idle and absolute expiry.",
      "Set the session cookie HttpOnly, Secure and SameSite.",
      "Use multi-factor authentication for administrative and financial actions.",
      "Make password reset tokens random, single use, short-lived, and invalidate them after use.",
      "Enforce MFA server-side on every protected endpoint, never only in the UI flow.",
      "Destroy the server session and revoke all tokens on logout, password change and account disable.",
      "Support multi-factor authentication and breached-password checks, and offer passkeys."
    ],
    securePractices: [
      "Log authentication events (success, failure, reset, MFA change) with enough detail to spot an attack.",
      "Alert on one account failing from many IPs, and on many accounts failing from one IP.",
      "Prefer password managers and long passphrases over forced rotation every 90 days.",
      "Review sessions: add a 'where you are signed in' page where users can revoke devices.",
      "Test the failure paths: no user, wrong password, disabled user, expired link, replayed MFA code."
    ],
    furtherReading: [
      "OWASP Authentication Cheat Sheet",
      "OWASP Session Management Cheat Sheet",
      "OWASP Credential Stuffing Prevention Cheat Sheet",
      "NIST Digital Identity Guidelines (SP 800-63B)"
    ],
    quiz: [
      {
        question: "Why should login return the same message for 'no such user' and 'wrong password'?",
        options: [
          "For better SEO",
          "Different messages let an attacker discover which e-mail addresses are registered",
          "It makes the code shorter",
          "To allow caching"
        ],
        correctIndex: 1,
        explanation:
          "Account enumeration is a real risk: leaked lists become targeted password attacks. Identical messages and comparable timing remove the signal."
      },
      {
        question: "What does session regeneration on login prevent?",
        options: [
          "SQL injection",
          "Session fixation, where an attacker sets a known session id before the victim logs in",
          "XSS",
          "Slow hashing"
        ],
        correctIndex: 1,
        explanation:
          "If the id does not change at login, an attacker who planted an id keeps a valid session after the victim authenticates."
      },
      {
        question: "What makes a 'remember me' cookie dangerous?",
        options: [
          "It is too small",
          "If it stores a database id, anyone who reads it gets permanent access with no password",
          "It cannot be revoked",
          "It uses too much bandwidth"
        ],
        correctIndex: 1,
        explanation:
          "It must be a long random secret that can be revoked server-side - a selector plus a hashed verifier - and it must expire."
      }
    ],
    lab: {
      title: "Harden a login flow, then attack it",
      type: "fix-the-code",
      task:
        "Take the vulnerable login routes and produce a hardened version, then write the three attack scripts that would have worked before.",
      steps: [
        "Fix enumeration: one message, and a dummy hash compare when the user is missing.",
        "Add rate limiting and session regeneration, and set the cookie flags.",
        "Rewrite 'remember me' as selector + verifier and make logout revoke it.",
        "Now write (on paper) the three attacks: user enumeration, brute force, and stolen remember-me cookie."
      ],
      hint: "Time your own responses. If 'no such user' is 5x faster, you have leaked the account list.",
      solution:
        "The hardened flow compares against a dummy bcrypt hash so timing is constant, returns one message, limits attempts per account and per IP, regenerates the session id on login, sets HttpOnly/Secure/SameSite with an idle timeout, stores only a hashed verifier for remember-me, and revokes everything on logout. Then the enumeration script cannot distinguish, the brute force hits the limiter, and the stolen cookie is a useless random string without the server-side hash.",
      isSafe: true,
      estimatedMinutes: 30
    }
  },

  /* ---------------------------------------------------------------- */
  "unvalidated-input": {
    title: "Unvalidated Input",
    relatedConcepts: ["injection", "xss", "open-redirect", "ssrf", "broken-access-control"],
    simpleExplanation:
      "Unvalidated input means the application never checks what the user sent before using it. The values in a form, a URL, a header or a JSON body are all just strings, and if your code trusts them without checking type, length, format and range, they can break your assumptions. In 2003 OWASP called this 'Unvalidated Parameters'; in 2004 it was renamed 'Unvalidated Input'.",
    whyItHappens:
      "Time pressure and the belief that the client already checked. Client-side validation is a usability feature that a user can bypass with one line in the browser console, so anything that matters must be repeated on the server. On top of that, developers often validate the wrong thing: a password field that checks length but not a JSON field that reaches a shell.",
    howItWorks:
      "1. A form posts age=notanumber. 2. The handler passes it to a function expecting a number, which either crashes or is coerced. 3. A value with 10,000 characters is used to build a regex, which hangs the process - a ReDoS. 4. A filename with ../ is used in a path, escaping the folder. 5. None of these are 'attacks on a firewall'; they are ordinary inputs that were never checked.",
    safeExample:
      "It is a form at a clinic. If the receptionist types 'twenty-two' into a field that only accepts digits, or a 5,000-character note into a box designed for 200, the system is not 'broken' - it is undefined. Validation is a contract: the caller promises a shape, and the code checks the promise. It is the digital version of 'type your date as DD/MM/YYYY'.",
    impact: [
      "Crashes and denial of service from unexpected types or sizes.",
      "Directly enables injection, XSS, path traversal, SSRF and open redirects.",
      "Corrupt data that quietly breaks reports and business logic.",
      "ReDoS: a crafted string can make a single request consume a CPU core for minutes."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "express handler - IN SAFE",
      code: `app.post("/signup", async (req, res) => {
  // 1) No type check. req.body.age may be a string, an object,
  //    or {"$gt": 0} if this were a Mongo filter.
  const age = req.body.age;

  // 2) Unbounded: a 5 MB "name" is happily stored.
  await User.create({ age, name: req.body.name });

  // 3) A user-supplied string is compiled into a REGEX. A pattern
  //    like (a+)+$ plus a long 'a' string is a ReDoS.
  if (/^\\d{4}$/.test(req.body.postcode)) { ... }

  // 4) A user-supplied string becomes a FILE PATH.
  const file = path.join("/uploads", req.body.filename);
  fs.readFileSync(file);

  res.json({ ok: true });
});`,
      walkthrough: [
        "Line 3: no validation at all. Type, length, format and range are all unchecked.",
        "Line 6: no maximum length, so storage and layout are at the mercy of the client.",
        "Line 8: building a RegExp from user input is a classic ReDoS and also allows matching bypasses.",
        "Line 10: a user-controlled path segment is path traversal; '../' walks out of the directory."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "express handler - SAFE",
      code: `const { z } = require("zod");        // a schema validation library

// 1) Declare the contract once. Everything else follows from it.
const SignupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  age: z.number().int().min(0).max(130),            // number, not string
  email: z.string().email().max(254),
  postcode: z.string().regex(/^\\d{4}$/, "4 digits"), // FIXED pattern, not built from input
  acceptTerms: z.literal(true)
}).strict();                                        // reject unknown keys

app.post("/signup", async (req, res) => {
  // 2) Parse and validate. On failure we answer 400 with the list.
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid input",
      issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message }))
    });
  }
  const { name, age, email, postcode } = parsed.data;

  // 3) Build the document from the PARSED object, so nothing extra
  //    can sneak in (no mass assignment).
  const user = await User.create({ name, age, email, postcode });

  // 4) Files: never join a client string onto a base path.
  const SAFE_ID = /^[a-f0-9]{32}$/;
  if (!SAFE_ID.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const full = path.join(UPLOAD_DIR, req.params.id + ".dat");

  res.status(201).json({ id: user._id });
});

// 5) Global limits as a safety net.
app.use(express.json({ limit: "16kb" }));`,
      explanation:
        "Validation is strongest when it is a schema you declare once and apply everywhere, because it validates shape and type at the boundary and gives a typed object downstream. Coercing with String() and Number() is better than nothing but can hide mistakes. Note the strict() mode: unknown keys are rejected, which closes mass assignment."
    },
    prevention: [
      "Validate on the server, always. Client-side validation is for usability only.",
      "Validate type, length, format, range and allowed values - whitelist, do not blacklist.",
      "Use a schema validation library (zod, joi, ajv, class-validator) at every route boundary.",
      "Reject unknown fields so clients cannot set privileged properties.",
      "Set global body size limits and cap every string, array, file and page size.",
      "Never compile a RegExp from user input; use fixed, pre-compiled patterns and avoid nested quantifiers.",
      "Never join a client string into a file path or command; use identifiers and allow-lists.",
      "Use allow-list parameters for sorts, filters and column names, and validate the type with something like Number.isInteger."
    ],
    securePractices: [
      "Write the schema first, then write the handler. It is faster and safer than validating ad hoc.",
      "Make the error message useful to the developer but harmless to the attacker.",
      "Ask 'what is the worst value this field could legally hold?' and enforce exactly that.",
      "Test the boundaries: empty string, exactly at the limit, one over the limit, wrong type, unexpected key.",
      "Remember that headers, cookies and file names are input too - not just the body."
    ],
    furtherReading: [
      "OWASP Input Validation Cheat Sheet",
      "OWASP Validation, Sanitization and Encoding Cheat Sheet"
    ],
    quiz: [
      {
        question: "Where must input validation happen?",
        options: [
          "In the browser, before sending",
          "On the server, at the request boundary - the browser check is only for usability",
          "In the database",
          "Only in the login form"
        ],
        correctIndex: 1,
        explanation:
          "Everything the client sends is attacker-controlled. A browser check is one line of JavaScript away from being removed."
      },
      {
        question: "Why prefer allow-listing over block-listing?",
        options: [
          "Allow-lists are shorter",
          "You can enumerate what you allow; attackers can enumerate what you block",
          "Block-lists are slower",
          "Allow-lists encrypt data"
        ],
        correctIndex: 1,
        explanation:
          "A block-list has to guess every possible bad input. An allow-list is a decision you make, and you can test it."
      },
      {
        question: "What is ReDoS?",
        options: [
          "A denial of service caused by a regex whose backtracking explodes on a crafted input",
          "A type of SQL injection",
          "A way to encrypt cookies",
          "A React state bug"
        ],
        correctIndex: 0,
        explanation:
          "Nested quantifiers such as (a+)+ can take exponential time. Never build a regex from user input, and prefer linear, anchored patterns."
      }
    ],
    lab: {
      title: "Write a validation schema and try to break it",
      type: "fix-the-code",
      task:
        "Write a schema for a signup form, then attack your own schema with at least ten inputs you invent.",
      steps: [
        "List every field, its type, and the legal range.",
        "Write the schema with strict mode on and sensible length limits.",
        "Test: missing field, wrong type, extra field, array instead of object, very long string, unicode tricks, number as string, boolean as number.",
        "Check what your handler does with the parsed output - can an unexpected key still be written?"
      ],
      hint: "Attack the parser, not just the fields. Arrays, nulls and duplicate keys are classic bypasses.",
      solution:
        "A robust schema validates every field with type, length and range, runs in strict mode so unknown keys are rejected, and returns a 400 with per-field messages. Then the handler must build the database document from the parsed object rather than spreading req.body, or mass assignment returns. Finally, a global body size limit catches everything your schema forgot.",
      isSafe: true,
      estimatedMinutes: 25
    }
  },

  /* ---------------------------------------------------------------- */
  "security-misconfiguration": {
    title: "Security Misconfiguration",
    relatedConcepts: ["broken-access-control", "vulnerable-components", "insecure-cryptography", "dos"],
    simpleExplanation:
      "A misconfigured application is not broken by clever code - it is broken by a setting nobody reviewed. Debug mode left on, default passwords, directory listing, a directory full of backups, verbose error pages, cloud storage that is public. The application code can be perfect and the site is still unsafe.",
    whyItHappens:
      "More settings than anyone can review, plus the gap between environments. A setting that is safe in development (open CORS, stack traces, no cookies) is dangerous in production, and copies get out of sync. Cloud providers make it worse by defaulting to 'public' for a bucket created in a hurry.",
    howItWorks:
      "1. The app is deployed with NODE_ENV=development, so errors return full stack traces. 2. The exception message includes a connection string, so a 500 page leaks the database password. 3. /uploads has directory listing on, and the deployment left a .env backup at /.env.bak. 4. The admin account still has the password from the setup guide, which is now public knowledge.",
    safeExample:
      "It is a house that is beautifully built and correctly designed, but the door is unlocked because the installer never came back, the alarm was left in test mode, and the spare keys are under the flowerpot. Nothing about the architecture is wrong; the configuration is unfinished. This is why OWASP calls it insecure defaults plus missing hardening.",
    impact: [
      "Leak source code, configuration files, credentials and stack traces.",
      "Default or shared credentials give immediate administrative access.",
      "Exposed admin consoles, debug endpoints and cloud storage buckets.",
      "Verbose errors assist every other attack by showing an attacker the internals."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "app + infrastructure - IN SAFE",
      code: `// (a) Debug left on in production
app.use(errorHandlerDev);            // sends err.stack to the client
app.listen(3000);

// (b) CORS set to "*" with credentials - a dangerous combination
app.use(cors({ origin: "*", credentials: true }));

// (c) A catch-all that serves anything in the project root
app.use(express.static(__dirname));

// (d) A "helpful" health endpoint that leaks the world
app.get("/debug/env", (req, res) => {
  res.json({ env: process.env });   // includes MONGO_URI and secrets
});

// (e) Infrastructure habit: a default admin account created at boot
if ((await Admin.count()) === 0) {
  await Admin.create({ user: "admin", password: "admin123" });
}`,
      walkthrough: [
        "(a) In development Express shows the stack trace; in production that is an information leak.",
        "(b) origin '*' plus credentials is a recipe for session theft; browsers actually reject it, but equivalent sloppy patterns with reflection do work.",
        "(c) Serving the project root publishes .env, source code and any backup file.",
        "(d) An endpoint that dumps environment variables is the single most common real-world data breach.",
        "(e) Seeding a well-known default password is the most common initial-access route in the OWASP testing guide."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "app + infrastructure - SAFE",
      code: `// (a) One code path, chosen by the environment
const isProd = process.env.NODE_ENV === "production";
app.use(isProd ? errorHandlerProd : errorHandlerDev);

// (b) Explicit origin allow-list
const ALLOWED = new Set((process.env.CLIENT_ORIGIN || "").split(","));
app.use(cors({
  origin: (o, cb) => cb(null, !o || ALLOWED.has(o)),
  credentials: true
}));

// (c) Serve ONE directory, never the project root
app.use("/static", express.static(path.join(__dirname, "public"), {
  dotfiles: "deny",          // never serve .env or .git
  index: false,              // no directory listing
  maxAge: "1d"
}));

// (d) No environment dumps. A health check that reveals only status.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptimeSeconds: Math.round(process.uptime()) });
});

// (e) No default accounts. First admin is created with a one-time,
//     random, printed-once secret - or through a setup flow.
async function bootstrapAdmin() {
  if (await Admin.exists({})) return;
  const password = crypto.randomBytes(18).toString("base64url");
  await Admin.create({ user: "bootstrap", passwordHash: await bcrypt.hash(password, 12) });
  console.log("[setup] One-time admin password (shown once):", password);
}

// (f) Infrastructure checklist
//   - storage buckets: private by default, signed URLs for reads
//   - debug endpoints and profiler routes removed or gated by env
//   - TLS enforced, HSTS enabled, HTTP redirected to HTTPS
//   - server banner/version hidden`,
      explanation:
        "The pattern is: one code path that changes behaviour based on the environment, explicit allow-lists instead of wildcards, serve the smallest possible directory, never expose internals, and no default credentials. Everything sensitive comes from environment variables that are never served to a browser."
    },
    prevention: [
      "Have a repeatable, automated deployment process so settings are not edited by hand.",
      "Keep a hardened, version-controlled configuration for each environment, and diff it on every release.",
      "Turn off debug mode, verbose errors and developer tool endpoints in production.",
      "Use a minimal repeatable base image or a configuration management tool rather than a hand-built server.",
      "Review every setting that has a security effect: CORS, cookies, TLS, headers, session, rate limits.",
      "Remove default accounts and change all shipped credentials immediately.",
      "Disable directory listing and never serve the project root or the .git folder.",
      "Scan dependencies and the running system automatically, not just at release time.",
      "Segregate environments and accounts, so a staging mistake cannot reach production data."
    ],
    securePractices: [
      "Write a short, version-controlled 'production readiness' checklist and run it before every launch.",
      "Add security headers in one place (middleware) rather than scattering them.",
      "Automate the boring parts: images, TLS, firewall rules, log shipping.",
      "Assume cloud defaults are not always safe - storage access, IAM roles and security groups all need review.",
      "Do a deliberate hunt: grep the app for DEBUG, dev, TODO, test and default credentials before launch."
    ],
    furtherReading: [
      "OWASP Secure Headers Project",
      "OWASP Secure Configuration Cheat Sheet",
      "OWASP Testing Guide - Configuration Management"
    ],
    quiz: [
      {
        question: "What is the single most dangerous common misconfiguration to expose publicly?",
        options: [
          "A missing favicon",
          "An endpoint or file that returns environment variables, secrets or source code",
          "Using HTTP/2",
          "A long page title"
        ],
        correctIndex: 1,
        explanation:
          "Leaks of .env, stack traces, backups or /debug endpoints are consistently the easiest initial access in real assessments."
      },
      {
        question: "How should you decide between a wildcard CORS origin and an allow-list?",
        options: [
          "Wildcards are always fine",
          "Always allow-list; a wildcard lets any site make authenticated requests to your API",
          "Allow-list only for POST",
          "CORS does not matter for APIs"
        ],
        correctIndex: 1,
        explanation:
          "CORS is a browser control, and a wildcard or reflected origin effectively disables the browser's protection for your API."
      },
      {
        question: "Why keep a separate hardened configuration for production?",
        options: [
          "To make the code shorter",
          "Because development settings such as stack traces, open CORS and weak cookies are dangerous in production, and manual edits get out of sync",
          "Because Node.js requires it",
          "To reduce bundle size"
        ],
        correctIndex: 1,
        explanation:
          "Configuration is code. Version it, review it, and diff it - otherwise 'temporary' debug flags survive for years."
      }
    ],
    lab: {
      title: "Run a configuration review on a local app",
      type: "design-review",
      task:
        "Start a local app and audit its configuration against a checklist. Fix everything you find, then write down what a production version would need.",
      steps: [
        "List every setting that affects security: CORS, cookies, sessions, headers, error verbosity, rate limits, file access.",
        "Check for leaks: request /debug, /.env, /.git/config, /uploads/ and see what your own local app returns.",
        "Check the defaults: is there an admin account with a known password? Is debug mode on?",
        "Write the fixes, and add one automated test that fails if NODE_ENV=production is not enforced in production."
      ],
      hint: "Run your own machine, not anybody else's. Never scan a system you do not own.",
      solution:
        "A configuration review finds the same handful of issues every time: debug endpoints, exposed .env or .git, directory listing, wildcard CORS, default credentials, missing security headers, and unbounded error detail. Fix them in code, put the settings in version-controlled environment templates, and add a CI check that fails when a known-dangerous setting is present. That converts a review habit into an enforced rule.",
      isSafe: true,
      estimatedMinutes: 30
    }
  },

  /* ---------------------------------------------------------------- */
  "remote-admin": {
    title: "Remote Administration Flaws",
    relatedConcepts: ["security-misconfiguration", "broken-authentication", "insecure-cryptography"],
    simpleExplanation:
      "A 2003 OWASP category about administration features that are reachable from the internet when they should not be - vendor admin panels, database consoles, remote desktop, management interfaces. Today the same problem is described as an exposed management interface, and it is treated as a security misconfiguration.",
    whyItHappens:
      "Administrators need access 'just for now' during setup or an incident, and the interface is left enabled. Vendors ship default credentials and remember-me features. Teams assume the interface is safe because it is 'only on the internal network', forgetting that VPN shares, port forwards and cloud security groups are not access control.",
    howItWorks:
      "1. A database admin console or a hosting control panel is exposed on a public port. 2. Credentials are default, or an admin reuses one of them on a personal site that later leaks. 3. An attacker logs in and has full control of the data or the machine. 4. Often nothing appears in the application's own logs, so the compromise is noticed months later.",
    safeExample:
      "It is a building's maintenance room. Staff need it, so the door stays unlocked, and the key ring has one key for every room in the building. Anyone who finds the ring gets everything. The safe version is a room reachable only through a badge check, with keys issued per person and a log of who opened it.",
    impact: [
      "Complete control of the server, database or hosting account.",
      "Silent data access, because management interfaces log elsewhere from application logs.",
      "Lateral movement to every system the interface can reach.",
      "Long dwell time: these compromises are typically discovered late."
    ],
    typicalSeverity: "critical",
    vulnerableCode: {
      language: "javascript",
      filename: "infrastructure - IN SAFE",
      code: `// A development-grade admin surface left in place.
app.use("/admin", adminRouter);          // no extra authentication
app.use("/phpmyadmin", serveStatic("./vendor/phpmyadmin"));

// A debug switch read from the environment, with no logging and no
// restriction on who may use it.
if (process.env.ENABLE_DEBUG_TOOLS === "true") {
  app.use("/debug", require("./routes/debug"));
}

// infrastructure mistakes that match the same category:
//   - a database or cache port published to 0.0.0.0 instead of localhost
//   - a vendor panel reachable at https://app.example.com:8888
//   - an SSH port open to the whole internet with password auth
app.listen(3000, "0.0.0.0");   // fine for HTTP, wrong for admin ports`,
      walkthrough: [
        "The admin router has no separate authentication or network restriction.",
        "A bundled tool such as phpMyAdmin is a full database client with its own history of vulnerabilities.",
        "The debug switch is only an environment variable - if it is on in production, the surface is public.",
        "Binding an admin port to 0.0.0.0 exposes it to every interface, including the public one."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "infrastructure - SAFE",
      code: `// 1) Put admin surfaces behind their OWN authentication, even if
//    they are also network restricted.
app.use("/admin", requireAdminSession, rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10
}), adminRouter);

// 2) Do not ship third-party admin tools inside the app directory.
const ADMIN_PATHS = new Set(process.env.ADMIN_PATHS?.split(",") ?? []);
app.get("/__admin-path", (req, res) => {
  if (process.env.NODE_ENV !== "production") {
    return res.json({ note: "admin UI runs on a separate host in production" });
  }
  res.status(404).json({ error: "Not found" });
});

// 3) Debug tools: impossible to enable in production, and audited.
if (process.env.NODE_ENV === "development" && process.env.ENABLE_DEBUG_TOOLS === "true") {
  app.use("/debug", require("./routes/debug"));
}

// 4) Infrastructure rules (not code, but the real control)
//   - database, cache and metrics ports bind to 127.0.0.1 only
//   - admin panels reachable via VPN or an SSH tunnel, never a public port
   - SSH: keys only, no root login, non-standard port, fail2ban
//   - vendor panels: change the default password at install time, then disable
//   - cloud security groups: default DENY inbound, add only what is needed
//   - management access is logged to a place the application team watches`,
      explanation:
        "Defence in depth: even a network-restricted panel should have strong authentication, because VPN credentials leak and port forwards are added in a hurry. The strongest pattern is that management surfaces live on a separate host reachable only through a tunnel, and their access is logged centrally so a compromise is visible quickly."
    },
    prevention: [
      "Never expose database, cache, metrics or vendor panels to the public internet.",
      "Put management interfaces behind a VPN, a bastion host or an SSH tunnel, with a small allow-list of source addresses.",
      "Change or disable every default credential at install time, including vendor panels.",
      "Require multi-factor authentication for administrative access.",
      "Use key-based SSH only, disable root login and password authentication.",
      "Log administrative access centrally and review it - application logs will not show it.",
      "Alert on logins to management interfaces from unexpected locations or times.",
      "Run a recurring check of your own public surface from a machine you control, and remove anything unexplained."
    ],
    securePractices: [
      "Treat 'internal only' as an assumption, not a control. Internal networks have flat trust and shared credentials.",
      "Prefer short-lived, revocable access (cloud session managers, federated identity) over standing admin passwords.",
      "Keep a written inventory of every management surface, its owner and its access rule.",
      "When something must be temporarily opened for an incident, write down when it closes - and close it."
    ],
    furtherReading: [
      "OWASP Security Misconfiguration Cheat Sheet",
      "OWASP Authentication Cheat Sheet (administrative access)",
      "CIS Benchmarks for relevant platforms"
    ],
    quiz: [
      {
        question: "Why is 'it's on the internal network, so it's fine' a weak argument?",
        options: [
          "Internal networks are always slow",
          "Internal networks are flat: a single compromised host, a shared VPN account or a port forward is enough to reach the panel",
          "Internal traffic is not encrypted",
          "Browsers block internal requests"
        ],
        correctIndex: 1,
        explanation:
          "Network location is not identity. Management surfaces need strong authentication and a real access rule, not an assumption about the network."
      },
      {
        question: "What is the strongest way to give an engineer admin access?",
        options: [
          "A shared static password in a wiki",
          "A short-lived, logged, revocable identity such as a federated session with MFA",
          "An SSH key kept in the repository",
          "A vendor panel with the default password"
        ],
        correctIndex: 1,
        explanation:
          "Short-lived and revocable access limits both the window and the blast radius, and produces an audit trail."
      }
    ],
    lab: {
      title: "Draw your management surface map",
      type: "design-review",
      task:
        "For a project you control, write down every management surface, who needs it, how it is reached, and how it is authenticated. Then rank the risks.",
      steps: [
        "List: app admin routes, database console, cache, metrics, CI/CD, hosting panel, SSH, log viewer.",
        "For each, record the access path, the authentication method, and whether access is logged.",
        "Mark every surface that is reachable from the public internet.",
        "For the three highest risks, write the change you would make first."
      ],
      hint: "Include anything with a port, a password, or a reset link.",
      solution:
        "Most real breaches start with one of these surfaces: a forgotten panel, a default credential, a CI/CD token, or an SSH password. The map forces you to see them all, and the ranking tells you where to spend effort first. The correct end state is that no management surface is publicly reachable, all use MFA or keys, all are logged centrally, and access is time-limited.",
      isSafe: true,
      estimatedMinutes: 20
    }
  },

  /* ---------------------------------------------------------------- */
  dos: {
    title: "Denial of Service",
    relatedConcepts: ["dos", "unvalidated-input", "vulnerable-components"],
    simpleExplanation:
      "A denial-of-service weakness lets an attacker make your application unavailable or unusably slow, usually by sending a small amount of traffic that triggers an expensive operation. A 2004 OWASP category (A9) that emphasises application-level resource problems rather than pure network floods.",
    whyItHappens:
      "Operations whose cost is not proportional to the request. One request that runs a huge database query, decrypts a 500 MB file, forks a process, or triggers a regex that backtracks exponentially, costs far more than a hundred cheap requests. A missing limit on retries, uploads, page size or concurrent logins turns that into an outage.",
    howItWorks:
      "1. A search endpoint accepts a 200,000-character pattern and compiles it into a regex. 2. The client sends a string designed for catastrophic backtracking, such as 40,000 a's followed by b. 3. One request occupies a CPU core for minutes; ten requests block the event loop or the worker pool. 4. Legitimate users see timeouts, and the site is effectively down.",
    safeExample:
      "It is a small post office that offers to look up any name in the city directory. Looking up one name is instant. Handing the clerk a 500-page scrambled list and asking for every possible match takes the whole afternoon - the cost is not proportional to the amount of mail. Limits, timeouts and a cost ceiling keep the counter moving.",
    impact: [
      "The site becomes unavailable, or unusable under normal load.",
      "Database or worker exhaustion caused by a handful of requests.",
      "Cloud bills spike if autoscaling reacts to the load.",
      "Repeated, cheap outages are a serious reputational and financial problem."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "express endpoint - IN SAFE",
      code: `app.get("/search", async (req, res) => {
  const q = String(req.query.q || "");

  // (a) Unbounded input, compiled into a REGEX
  const pattern = new RegExp("^(" + q.split("|").join(")|(") + ")$");
  // Crafted input causes catastrophic backtracking -> CPU pinned.

  // (b) Unbounded database work: no limit, no timeout
  const rows = await Item.find({ name: { $regex: pattern } }).limit(5000);

  // (c) Unbounded work per request: reads a file the user names
  const data = fs.readFileSync(req.body.path);

  // (d) An expensive password hash, with no rate limit
  await bcrypt.compare(req.body.password, hash, 12);

  res.json({ rows });
});`,
      walkthrough: [
        "(a) Building a regex from input plus nested quantifiers is a ReDoS: one request can occupy a core for minutes.",
        "(b) A regex search over a large collection with no timeout and a high limit is a database-level DoS.",
        "(c) An unbounded file read can exhaust memory.",
        "(d) bcrypt is deliberately slow, which is correct - but unlimited attempts turn it into a CPU amplifier."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "express endpoint - SAFE",
      code: `const rateLimit = require("express-rate-limit");

// 1) Rate limits per route, with a standard response.
app.get("/search", rateLimit({ windowMs: 60_000, limit: 30 }),
  async (req, res, next) => {
    try {
      // 2) Cap the input size first.
      const q = String(req.query.q || "").slice(0, 64);

      // 3) Never compile a regex from input. Use a literal, anchored
      //    pattern with no nested quantifiers, or a text index.
      const rows = await Item.find({ name: new RegExp("^" + escapeRegExp(q) + "$", "i") })
        .limit(50)
        .maxTimeMS(2000)          // 4) a query budget, in milliseconds
        .lean();

      res.json({ rows });
    } catch (err) {
      next(err);
    }
  });

function escapeRegExp(s) {
  return s.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
}

// 5) Global safety nets, in this order:
//    - request timeout middleware (e.g. 10s) and an abort signal
//    - body size limit (express.json({ limit: "16kb" }))
//    - concurrency cap so one request cannot hold every worker
//    - circuit breaker in front of slow third-party calls
//    - alerting on p95 latency and error rate, not just uptime

// 6) Resource limits in the environment, so a runaway process is
//    killed and restarted instead of taking the host down.
app.set("trust proxy", 1);`,
      explanation:
        "The principle is cost proportionality: bound the input, bound the work, bound the time. Input caps and escaping stop catastrophic algorithms; maxTimeMS and a limit stop database amplification; timeouts and concurrency caps stop a single slow request from consuming the whole worker pool; alerting tells you before the users do."
    },
    prevention: [
      "Cap every input: string length, array size, page size, file size, upload count.",
      "Never build a regular expression from user input, and avoid nested quantifiers in patterns you do write.",
      "Set timeouts on every database query and every outbound HTTP call.",
      "Rate limit per route, per account and per IP, and return 429 with a Retry-After header.",
      "Set a body size limit and a request timeout globally.",
      "Use a queue or worker pool with a bounded number of workers for expensive jobs.",
      "Apply circuit breakers and back-off to third-party dependencies.",
      "Monitor latency percentiles, error rates and queue depth, and alert before capacity is gone.",
      "Put process memory and CPU limits in place so a runaway process is restarted rather than crashing the host."
    ],
    securePractices: [
      "Ask 'what is the most expensive thing a single request can trigger?' and bound that first.",
      "Test your own service: send the worst input you can invent to your localhost instance and measure.",
      "Prefer an index-backed lookup over a regex scan.",
      "Cap the work per user, not just per request, so a script cannot spread a heavy operation over many calls.",
      "Rate limit on the server. Client-side rate limiting is a suggestion."
    ],
    furtherReading: [
      "OWASP Denial of Service Cheat Sheet",
      "OWASP Testing Guide - Denial of Service",
      "OWASP Automated Threats to Web Applications (resource consumption)"
    ],
    quiz: [
      {
        question: "What is ReDoS?",
        options: [
          "A DDoS from many machines",
          "Regular expression denial of service, where a crafted input causes exponential backtracking",
          "A firewall blocking regex",
          "A database lock"
        ],
        correctIndex: 1,
        explanation:
          "A pattern with nested quantifiers such as (a+)+ can take exponential time on a crafted string. Never compile a regex from user input."
      },
      {
        question: "Why set maxTimeMS on a database query?",
        options: [
          "To make queries faster",
          "So a runaway query is abandoned before it consumes resources and blocks other requests",
          "To enable caching",
          "To encrypt results"
        ],
        correctIndex: 1,
        explanation:
          "A query budget is a hard ceiling on the most expensive operation a request can start."
      },
      {
        question: "Which is the most useful place to rate limit a login endpoint?",
        options: [
          "In the browser",
          "On the server, per account and per IP, because the client is under the attacker's control",
          "In the CSS",
          "In the DNS record"
        ],
        correctIndex: 1,
        explanation:
          "Anything on the client can be removed. Limits enforced on the server are the only real control."
      }
    ],
    lab: {
      title: "Find the unbounded work in your own app",
      type: "identify-the-bug",
      task:
        "Write down every place your app can be asked to do a large amount of work, and put a bound on each one.",
      steps: [
        "List the endpoints and background jobs, and note the most expensive operation each can trigger.",
        "For each, write the bound you would apply: input cap, limit, timeout, rate limit, worker cap.",
        "Test one case locally: send the largest legal input and measure time and memory.",
        "Add alerting on latency p95 so you learn about problems from data rather than from users."
      ],
      hint: "Look for regex searches, file reads, bcrypt or other hashing, report generation and third-party calls.",
      solution:
        "Every unbounded operation gets a ceiling: input length caps, query limits and maxTimeMS, a route rate limit returning 429, a global request timeout and body size limit, a bounded worker pool for heavy jobs, and circuit breakers for dependencies. Then watch p95 latency and error rate so the alert arrives before the outage. The test on your own machine is what proves the bounds work.",
      isSafe: true,
      estimatedMinutes: 25
    }
  },
};

module.exports = accessAuthFamilyProfiles;
