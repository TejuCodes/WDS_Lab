/**
 * ============================================================
 * FILE: src/data/profiles/data-family.js
 * PURPOSE: Concept profiles for data protection, cryptography,
 *          components, logging, design and integrity.
 *
 * The 2025 edition of the Top 10 is dominated by this file:
 *   A02 Security Misconfiguration, A03 Software Supply Chain
 *   Failures, A04 Cryptographic Failures, A06 Insecure Design,
 *   A08 Software or Data Integrity Failures, A09 Security Logging
 *   & Alerting Failures, A10 Mishandling of Exceptional
 *   Conditions. That is the clearest story in the whole history:
 *   the list moved from "avoid bad code" to "design, verify and
 *   observe the whole system".
 * ============================================================
 */

const dataFamilyProfiles = {
  /* ---------------------------------------------------------------- */
  "insecure-cryptography": {
    title: "Insecure Cryptographic Storage",
    relatedConcepts: ["sensitive-data-exposure", "insecure-transport", "broken-authentication", "integrity-failures"],
    simpleExplanation:
      "Insecure cryptographic storage means protecting something that should be secret with the wrong tool - an old algorithm, a home-made scheme, a hard-coded key, or a password stored in plain sight. OWASP tracked this in 2004 as 'Insecure Storage', 2007 and 2010 as 'Insecure Cryptographic Storage', and 2021 and 2025 as 'Cryptographic Failures'.",
    whyItHappens:
      "Cryptography is treated as a setting rather than a decision. A developer uses an old example from a tutorial, a library offers a 'simple encryption' helper with a default key, or a team stores a hash where it needed a password hash. Nobody owns the question 'which algorithm, which key length, where is the key, when do we rotate it'.",
    howItWorks:
      "1. Passwords are stored with a fast general-purpose hash such as MD5 or SHA-1. 2. The database is copied, stolen or dumped. 3. The attacker runs a dictionary through a fast hash and recovers most passwords in minutes, because fast hashes are designed for speed, not for resisting guesses. 4. The same password is often reused on other services, so one breach becomes many.",
    safeExample:
      "It is a safe versus a padlock. MD5 is a cardboard box with a picture of a lock on it - it looks protective and opens instantly. Argon2 or bcrypt is a real safe: deliberately slow, and configured so that trying a million guesses is expensive. The slow part is the whole point, and it is why password hashing uses a different tool from file hashing.",
    impact: [
      "Recover user passwords, then attack other services with them.",
      "Decrypt stored secrets, personal data or payment information.",
      "Forge data or messages if a weak MAC/signature scheme is used.",
      "Permanent compromise: once plaintext is recovered, changing the algorithm later does not help."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "crypto mistakes - IN SAFE",
      code: `const crypto = require("crypto");
const md5 = require("md5");

// (a) Fast general-purpose hash for passwords. A 6-character
//     password is found in seconds with a GPU rig.
const hash1 = md5(req.body.password);

// (b) Hand-rolled "encryption" with a fixed key in the source.
const cipher1 = crypto.createCipheriv("aes-256-cbc",
  Buffer.from("mySecretKey12345mySecretKey12"), crypto.randomBytes(16));

// (c) A hard-coded IV. The same plaintext then always produces the
//     same ciphertext, which destroys semantic security.
const cipher2 = crypto.createCipheriv("aes-256-cbc", KEY, Buffer.alloc(16));

// (d) A home-made cipher, which is never a cipher.
function myEncrypt(text) {
  return Buffer.from(text).reverse().toString("hex");
}

// (e) Storing the encryption key in the same database.
await User.create({ email, password: hash1, apiKey: cipher1 });`,
      walkthrough: [
        "(a) MD5/SHA-1 are designed to be fast. That is correct for file checksums and wrong for passwords.",
        "(b) and (e) Key next to ciphertext offers no protection: stealing the database steals both.",
        "(c) A fixed or reused IV makes identical plaintexts produce identical ciphertexts, so an attacker learns when two users share a value.",
        "(d) Any cipher you design yourself will be broken; use a reviewed library and standard modes like AES-GCM."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "crypto done right - SAFE",
      code: `const crypto = require("crypto");
const argon2 = require("argon2");        // or bcrypt / scrypt

// 1) PASSWORDS: a slow, salted, memory-hard hash.
//    The salt is per-user and stored WITH the hash - that is fine,
//    the point is that identical passwords produce different hashes.
app.post("/register", async (req, res) => {
  const hash = await argon2.hash(req.body.password, {
    type: argon2.argon2id,
    memoryCost: 19456,   // 19 MB
    timeCost: 2,
    parallelism: 1
  });
  await User.create({ email: req.body.email, passwordHash: hash });
  res.status(201).json({ ok: true });
});

// 2) DATA AT REST: a standard AEAD cipher, random IV per record,
//    key from a secret manager - never from the code.
const ALGO = "aes-256-gcm";              // authenticated: detects tampering

function encrypt(plaintext, key) {
  const iv = crypto.randomBytes(12);                     // NEVER reuse an IV
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();                       // 16 bytes
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decrypt(blob, key) {
  const buf = Buffer.from(blob, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);                              // throws if tampered
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// 3) WHERE THE KEY LIVES
//    - environment variable from a secret manager in development
//    - KMS / Vault / cloud secret store in production
//    - rotated on a schedule, and versioned so old data still decrypts
const KEY = Buffer.from(process.env.DATA_ENCRYPTION_KEY, "base64");
if (KEY.length !== 32) throw new Error("DATA_ENCRYPTION_KEY must be 32 bytes");

// 4) Do not roll your own: no ECB mode, no custom ciphers, no
//    homemade key derivation. Use a library's standard construction.`,
      explanation:
        "The rules are short and absolute: slow salted hashing for passwords (Argon2id, bcrypt, scrypt), a vetted standard algorithm in a vetted standard mode (AES-GCM or ChaCha20-Poly1305) for data, a fresh random IV for every encryption, keys kept outside the code and outside the database, and a plan for rotation. Anything else - fast hashes for passwords, fixed IVs, ECB, home-made schemes - fails."
    },
    prevention: [
      "Hash passwords with Argon2id, bcrypt or scrypt, with a per-user random salt and tuned cost.",
      "Never use MD5, SHA-1 or plain SHA-256 for passwords. They are for checksums and signatures, not for passwords.",
      "Encrypt sensitive data at rest with a vetted AEAD cipher such as AES-256-GCM or ChaCha20-Poly1305.",
      "Generate a fresh random IV for every single encryption, and never reuse one with the same key.",
      "Keep keys in a secret manager or KMS, separate from the data, with access control and audit logs.",
      "Version your keys so you can rotate and still decrypt old records.",
      "Use TLS 1.2 or higher in transit, with certificate validation on.",
      "Plan deprecation: know which algorithms you use and when you will replace them."
    ],
    securePractices: [
      "Ask three questions about every secret: where is it, who can read it, and when is it rotated?",
      "Distinguish three operations - hashing (one way, for passwords), encryption (reversible, for data you need back), signing (proves authorship) - and use the right one.",
      "Use authenticated encryption so a tampered record fails loudly instead of decrypting to garbage.",
      "Benchmark the password hash cost on your production hardware and re-tune it as hardware improves.",
      "Never log plaintext passwords, tokens or decrypted personal data - not even in a debug branch.",
      "Write a 'no custom crypto' rule into your code review checklist."
    ],
    furtherReading: [
      "OWASP Password Storage Cheat Sheet",
      "OWASP Cryptographic Storage Cheat Sheet",
      "OWASP Key Management Cheat Sheet",
      "NIST Cryptographic Standards and Guidelines"
    ],
    quiz: [
      {
        question: "Why is MD5 wrong for storing passwords?",
        options: [
          "It produces too long an output",
          "It is deliberately fast, so billions of guesses per second are possible",
          "It cannot handle special characters",
          "It requires a salt and MD5 has no salt parameter"
        ],
        correctIndex: 1,
        explanation:
          "Speed is the enemy here. Password hashing must be slow and memory-hard so that guessing becomes expensive."
      },
      {
        question: "Why must the IV be random and unique per encryption?",
        options: [
          "To make the ciphertext longer",
          "Reusing an IV with the same key leaks patterns and can break confidentiality outright",
          "Because the library refuses a fixed IV",
          "To speed up decryption"
        ],
        correctIndex: 1,
        explanation:
          "An IV must be unique per encryption with a given key. A fixed or repeated IV is the classic mistake in home-grown implementations."
      },
      {
        question: "Where should an encryption key live?",
        options: [
          "In the source code, obfuscated",
          "In a secret manager or KMS, separate from the data, with audited access",
          "In the same table as the encrypted column",
          "In a comment above the function"
        ],
        correctIndex: 1,
        explanation:
          "If the attacker steals the database they must not get the key at the same time. Separation of data and key is the essential control."
      }
    ],
    lab: {
      title: "Compare password hashing costs",
      type: "design-review",
      task:
        "Measure how long it takes to guess one password with MD5, SHA-256 and Argon2id, and explain the difference in seconds per guess.",
      steps: [
        "Write a local script that hashes one password with each algorithm.",
        "Time a single hash for each, and extrapolate the guesses per second a GPU rig could achieve.",
        "Explain why the recommended cost settings exist and would need re-tuning as hardware improves.",
        "Write the storage format you would use, including where the salt and parameters are kept."
      ],
      hint: "Notice that the fast hashes are so fast that the difference is astronomical, not just noticeable.",
      solution:
        "Fast general-purpose hashes allow billions of attempts per second, so an 8-character password falls instantly. A memory-hard function such as Argon2id deliberately costs tens of milliseconds and a fixed amount of memory per attempt, which cuts the attacker's throughput by many orders of magnitude. The stored value includes the algorithm name, version, parameters and salt, so you can raise the cost later and still verify old hashes.",
      isSafe: true,
      estimatedMinutes: 20
    }
  },

  /* ---------------------------------------------------------------- */
  "insecure-storage": {
    title: "Insecure Storage",
    relatedConcepts: ["insecure-cryptography", "sensitive-data-exposure", "security-misconfiguration"],
    simpleExplanation:
      "The 2004 OWASP category for secrets kept in the wrong place: passwords in a spreadsheet, card numbers in a log file, a database backup in a public folder, an API key in a shared document. The idea is simple: if the secret lives next to the data it protects, or somewhere the whole team can read, then any one mistake exposes it.",
    whyItHappens:
      "Convenience and a lack of ownership. Storing a password in a notes app is quicker than running a password manager, and downloading a backup to a laptop is quicker than learning a backup tool. Nobody is accountable for where secrets live, so every engineer invents their own answer.",
    howItWorks:
      "1. A developer copies production data into a spreadsheet to debug a report. 2. The spreadsheet is shared with a colleague. 3. A third party gets access, or the file is committed to a repository. 4. The secret is now in several places, none of which are monitored or revocable. Even rotating it does not remove the old copies.",
    safeExample:
      "It is keeping the building master key in an unlocked drawer of the office you are trying to protect. Copying the key to a colleague's desk did not add security; it multiplied the number of doors the key opens. A secret has exactly one home, and that home is access-controlled and auditable.",
    impact: [
      "Credentials, keys and personal data exposed through backups, logs or shared files.",
      "Data copies that cannot be deleted, so a later incident keeps growing.",
      "Compliance failures, because storage location is usually part of the policy.",
      "No audit trail: nobody can tell who read the file."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "storage mistakes - IN SAFE",
      code: `// (a) The database URL, including the password, in the source.
const MONGO = "mongodb://admin:RealPassword123@10.0.0.5:27017/prod";

// (b) Sensitive fields written to the application log.
console.log("login attempt", req.body.email, req.body.password);

// (c) Full request bodies persisted for debugging.
await RequestLog.create({ body: req.body, headers: req.headers });

// (d) An unencrypted dump file inside a served directory.
fs.writeFileSync(__dirname + "/public/dump.json", JSON.stringify(allUsers));

// (e) Secrets in a client-side bundle. Anything in a React bundle is
//     public, no matter how it is named or minified.
const STRIPE_KEY = "sk_live_xxxxx";`,
      walkthrough: [
        "(a) A connection string in source is a full database credential, and it ends up in git history forever.",
        "(b) Passwords in logs are read by log aggregation tools, error trackers and support staff - and logs are often less protected than the database.",
        "(c) Dumping whole bodies records card numbers, tokens and personal data that no screen ever needed.",
        "(d) A file under the static directory is public by definition.",
        "(e) Front-end code is delivered to the user's browser; anything in it is public. Secrets belong on the server only."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "storage done right - SAFE",
      code: `// 1) Secrets come from the environment, never from the code.
const MONGO = process.env.MONGO_URI;     // value lives in .env / secret manager
// .env is in .gitignore. .env.example documents the KEYS only.

// 2) A redaction helper used by the logger everywhere.
const SENSITIVE = new Set(["password", "token", "authorization", "cvv", "secret"]);
function redact(obj) {
  return Object.fromEntries(
    Object.entries(obj || {}).map(([k, v]) => [k, SENSITIVE.has(k.toLowerCase()) ? "[redacted]" : v])
  );
}
app.use(morgan("combined", {
  skip: (req) => req.path === "/api/health"     // keep logs small and cheap
}));

// 3) Log only what you need to debug, and never the whole body.
app.post("/login", async (req, res) => {
  console.log("login attempt", { email: req.body.email, ip: req.ip });
  // Never: console.log(req.body)
});

// 4) Debug logs get a short TTL, so temporary copies disappear.
await RequestLog.create(
  { route: req.path, userId: req.session.userId },
  { expires: 60 * 60 }          // MongoDB TTL index: gone after an hour
);

// 5) Never put data under the static directory.
fs.writeFileSync("/var/lib/app/exports/dump.json", JSON.stringify(allUsers));

// 6) Encrypt sensitive columns at rest, with the key in a secret
//    manager - see the Cryptographic Failures profile.
await User.create({ email, ssnEncrypted: encrypt(ssn, KEY) });`,
      explanation:
        "The rule is: one home per secret, and that home is access-controlled. Environment variables and a secret manager for credentials, a redacting logger, no sensitive fields in logs, short TTLs on debug data, and nothing sensitive under a publicly served path. Front-end bundles are public, so they never contain secrets."
    },
    prevention: [
      "Keep secrets in a secret manager or environment variables, never in source control.",
      "Add .env and all credential files to .gitignore, and scan history and CI logs for leaks.",
      "Redact passwords, tokens, card numbers and national IDs in logs and error trackers.",
      "Never put sensitive data under a publicly served static directory.",
      "Encrypt sensitive columns at rest, with keys stored separately.",
      "Give debug and audit data a short retention period so temporary copies expire on their own.",
      "Minimise collection: not storing a field at all is the strongest protection.",
      "Restrict and audit access to backups, and encrypt them.",
      "Remember that anything shipped to the browser is public."
    ],
    securePractices: [
      "Adopt one secret store for the whole team and make it the only allowed way.",
      "Run a secret scanner in CI, and rotate anything it finds immediately.",
      "Ask 'does this need to be written down at all?' before writing it down.",
      "Write down which systems hold which classes of data, so the answer is not a guess.",
      "Review log access rights: logs often contain more sensitive data than the database does."
    ],
    furtherReading: [
      "OWASP Secrets Management Cheat Sheet",
      "OWASP Logging Cheat Sheet (data to exclude)",
      "OWASP Sensitive Data Exposure"
    ],
    quiz: [
      {
        question: "Why is a database connection string with a password in the source code dangerous?",
        options: [
          "It makes the code longer",
          "It is committed to version control forever, so anyone with read access to the repository has full database access",
          "It slows down the connection",
          "MongoDB does not allow it"
        ],
        correctIndex: 1,
        explanation:
          "Removing the line later does not remove it from history. Secrets belong in environment variables or a secret manager."
      },
      {
        question: "What is the best way to handle a password in a log statement?",
        options: [
          "Log it, since admins are trusted",
          "Log only a redacted form - use a logging helper that removes sensitive fields",
          "Log it at debug level only",
          "Encrypt it before logging"
        ],
        correctIndex: 1,
        explanation:
          "Logs are copied into many tools and read by many people. Redaction at the logger is reliable; discipline is not."
      },
      {
        question: "Why should debug data have a short retention period?",
        options: [
          "To save disk space",
          "So temporary copies of sensitive data expire automatically instead of living forever in backups and archives",
          "To make queries faster",
          "Because MongoDB requires it"
        ],
        correctIndex: 1,
        explanation:
          "Least data, least time. Automatic expiry is far more reliable than remembering to delete a file later."
      }
    ],
    lab: {
      title: "Audit where your secrets live",
      type: "design-review",
      task:
        "For a project you control, list every place a secret is stored or written, and mark whether it is controlled.",
      steps: [
        "Search the codebase and config files for keys, passwords, tokens and connection strings.",
        "List every log statement and check whether it could contain sensitive fields.",
        "List every file your app writes and decide which are publicly reachable.",
        "For each uncontrolled item, write the one-line fix."
      ],
      hint: "Include .env files, CI configuration, docker-compose, notebooks and screenshots in documentation.",
      solution:
        "The audit almost always finds the same categories: a credential in source or a committed .env, sensitive fields reaching logs or error trackers, a data export written somewhere public, and a secret pasted into a front-end bundle. Each has a one-line fix - environment variable plus .gitignore, a redacting logger, a private directory, and moving the secret to the server. Add a secret scanner to CI so the category does not come back.",
      isSafe: true,
      estimatedMinutes: 25
    }
  },

  /* ---------------------------------------------------------------- */
  "insecure-transport": {
    title: "Insufficient Transport Layer Protection",
    relatedConcepts: ["insecure-cryptography", "sensitive-data-exposure", "broken-authentication"],
    simpleExplanation:
      "This category is about data travelling unencrypted. HTTP instead of HTTPS, no HSTS, certificates that are expired or wrongly configured, sensitive data mixed into URLs. OWASP tracked it as 'Insecure Communications' (2007) and 'Insufficient Transport Layer Protection' (2010), and today it is folded into Cryptographic Failures.",
    whyItHappens:
      "TLS was historically expensive and awkward, so mixed content and plain HTTP survived for years. HTTP/2 and modern certificates are now free, so there is no cost justification left. The other cause is not knowing what is sensitive: developers do not realise that a session cookie in a URL, a token in a query string or a full page in a referrer header is all transport data.",
    howItWorks:
      "1. The site serves an insecure login form, or the developer tests over plain HTTP and forgets to switch. 2. An attacker on the same network sees the credentials in clear text. 3. A mixed-content image from http:// leaks the page URL in the Referer header. 4. Without HSTS, a user typing the domain gets the HTTP version first, which is the perfect place to intercept.",
    safeExample:
      "It is posting a bank statement through the post. The envelope protects the contents from anyone standing behind you. A website without TLS is a bank statement handed over on a tray, and the referrer header is the envelope printed on the outside, showing your account number to every website the statement links to.",
    impact: [
      "Intercept credentials, session cookies and tokens on a shared or hostile network.",
      "Downgrade attacks when HSTS is missing, sending a user to HTTP first.",
      "Exposure of sensitive URLs through the Referer header and browser history.",
      "Compliance failures for any regulation requiring encryption in transit."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "transport settings - IN SAFE",
      code: `// (a) No HTTPS enforcement: HTTP is served happily.
app.listen(3000);

// (b) Secure cookie flag disabled, so the session travels in clear.
app.session.cookie.secure = false;

// (c) No HSTS, so a first visit can be intercepted on the way to TLS.
app.use((req, res, next) => next());

// (d) Secrets placed in the URL, which is logged and referrer-leaked.
app.get("/reset", async (req, res) => {
  await User.updateOne({ _id: req.query.id }, { password: req.query.newPassword });
  res.send("done");
});

// (e) Mixed content: an http:// resource on an https:// page.
res.send('<img src="http://cdn.example.com/logo.png">');`,
      walkthrough: [
        "(a) and (b) together mean the session cookie is readable by anyone on the path.",
        "(c) Without HSTS the very first request is unprotected, which is enough to serve a fake page and steal the next login.",
        "(d) A password in a query string ends up in access logs, browser history and the Referer header.",
        "(e) A single http:// subresource is a downgrade opportunity and leaks the page URL."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "transport protection - SAFE",
      code: `const helmet = require("helmet");
const app = require("express");

// 1) TLS is terminated at the proxy or load balancer. Behind it we
//    still need to know the original scheme for secure cookies.
app.set("trust proxy", 1);

// 2) Force https, and never serve the insecure version.
app.use((req, res, next) => {
  if (req.secure) return next();
  return res.redirect(301, "https://" + req.headers.host + req.originalUrl);
});

// 3) HSTS: tell the browser to refuse plain HTTP for this domain for
//    a year, including subdomains. max-age first, preload later.
app.use(helmet({
  strictTransportSecurity: {
    maxAge: 31536000,       // 1 year
    includeSubDomains: true,
    preload: true           // only if you can meet the preload requirements
  },
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
  referrerPolicy: { policy: "no-referrer" },   // stops URL leakage
  hsts: undefined          // replaced by strictTransportSecurity above
}));

// 4) Cookie flags.
app.session.cookie = { secure: true, httpOnly: true, sameSite: "lax" };

// 5) Never put a secret in a URL.
app.post("/reset", async (req, res) => {
  await User.updateOne(
    { resetTokenHash: hashToken(req.body.token) },   // token in the BODY
    { $set: { password: await hash(req.body.newPassword) } }
  );
  res.json({ ok: true });
});`,
      explanation:
        "The complete set is: TLS terminated properly, HTTP redirected to HTTPS, HSTS to protect the first request, Secure/HttpOnly/SameSite cookies, a strict referrer policy to stop URL leakage, and no secrets in URLs. The redirect and HSTS pair matter because HSTS only protects requests after the browser has seen the header once."
    },
    prevention: [
      "Serve everything over TLS 1.2 or higher, with a valid, automatically renewed certificate.",
      "Redirect all HTTP traffic to HTTPS with a 301.",
      "Send HSTS with a long max-age, includeSubDomains, and consider preloading.",
      "Set secure, httpOnly and sameSite on every cookie.",
      "Never put passwords, tokens or personal data in a URL, query string or fragment.",
      "Use a strict referrer policy so page URLs are not leaked to third parties.",
      "Eliminate mixed content, and add upgrade-insecure-requests.",
      "Set the correct content type on every response so the browser cannot be tricked into sniffing.",
      "Monitor certificate expiry - an expired certificate trains users to click through the warning, which removes all protection."
    ],
    securePractices: [
      "Automate certificate renewal; expiry is the most common way HTTPS quietly stops working.",
      "Test from a mobile network: many captive portals show how brittle 'it worked on the office wifi' is.",
      "Keep a list of what is considered sensitive, and check whether any of it appears in a URL.",
      "Use TLS between internal services too, so an insider on the network is not enough.",
      "Remember that encryption does not fix authorisation: HTTPS does not stop IDOR."
    ],
    furtherReading: [
      "OWASP Transport Layer Protection Cheat Sheet",
      "OWASP TLS Cheat Sheet",
      "MDN: Strict-Transport-Security"
    ],
    quiz: [
      {
        question: "What does HSTS protect against that a plain HTTPS redirect does not?",
        options: [
          "SQL injection",
          "The first request to the site, where an attacker could still intercept before the redirect",
          "Slow certificate renewal",
          "Cookie theft via JavaScript"
        ],
        correctIndex: 1,
        explanation:
          "HSTS tells the browser to go straight to HTTPS and never offer the insecure version, closing the interception window on the first visit."
      },
      {
        question: "Why is a password in a query string a bad idea?",
        options: [
          "URLs cannot contain special characters",
          "It is stored in browser history, server access logs and can leak through the Referer header",
          "It is slower than a POST",
          "HTTPS does not encrypt query strings"
        ],
        correctIndex: 1,
        explanation:
          "A query string is the worst place for a secret: it is logged, cached and shared far more freely than a request body."
      },
      {
        question: "Does HTTPS prevent IDOR?",
        options: [
          "Yes, it encrypts the object ids",
          "No - it protects data in transit, not authorisation decisions on the server",
          "Yes, if HSTS is enabled",
          "Only for POST requests"
        ],
        correctIndex: 1,
        explanation:
          "Transport security and access control are different problems. An authorised user can still ask for someone else's record over a perfectly encrypted connection."
      }
    ],
    lab: {
      title: "Check the transport configuration of a local app",
      type: "identify-the-bug",
      task:
        "Run your own app locally and check every transport-related setting, then list the changes needed for production.",
      steps: [
        "Check whether HTTP is redirected to HTTPS and whether HSTS is set.",
        "Check the cookie flags, and confirm a password never appears in a URL.",
        "Check the referrer policy and whether any page mixes http:// resources.",
        "Check certificate configuration in your local setup and confirm renewal would be automated."
      ],
      hint: "Use the browser's Network panel on your own localhost site, and the Security panel to read the HSTS state.",
      solution:
        "The list is always the same: TLS everywhere, 301 from HTTP to HTTPS, HSTS with includeSubDomains, secure/httpOnly/sameSite cookies, secrets only in request bodies, a strict referrer policy, no mixed content, and automated certificate renewal. Verify each one against the browser's own tooling on your own machine, and remember the redirect only helps after the first safe visit - HSTS is what closes that gap.",
      isSafe: true,
      estimatedMinutes: 20
    }
  },

  /* ---------------------------------------------------------------- */
  "sensitive-data-exposure": {
    title: "Sensitive Data Exposure",
    relatedConcepts: ["insecure-cryptography", "insecure-transport", "insecure-storage", "broken-access-control"],
    simpleExplanation:
      "Sensitive data exposure means information that should be protected is handed out to anyone who asks - a full user record when the screen only needs a name, a response with 200 rows when the page shows 10, a database error containing a schema, or a backup file left in a folder. OWASP introduced it as A6 in 2013 and kept it in 2017.",
    whyItHappens:
      "Over-fetching and over-sharing. The API returns a whole database document because it is easy, a public endpoint returns more than the page needs, and a developer copies production data into a test environment. Nobody asks the question 'does this response need this field for this screen?'",
    howItWorks:
      "1. An endpoint returns the full user object, including passwordHash, internal notes, and a national ID. 2. The frontend only renders the name, but the response is visible in the browser's Network tab. 3. A mobile client or another team calls the same endpoint and gets everything too. 4. Some unrelated field ends up in a log, a support ticket, or a third-party analytics call.",
    safeExample:
      "It is a receptionist who photocopies the whole personnel file when all the visitor needs is a name badge. Nothing was stolen by the visitor, but every copy that travels is now data you must protect. The safe design hands over exactly what the task requires and keeps the rest in the system of record.",
    impact: [
      "Exposure of personal data, which triggers notification duties and fines.",
      "Leaked password hashes, internal identifiers and business data.",
      "An API that reveals more than intended becomes a permanent, documented contract.",
      "Data copied into test environments is forgotten, then breached years later."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "over-exposure - IN SAFE",
      code: `// (a) Returning the whole document - including fields the UI
//     never shows and fields that should never leave the server.
app.get("/api/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);            // passwordHash, internalNotes, mfaSecret...
});

// (b) No pagination: 50,000 rows in one response.
app.get("/api/users", async (req, res) => {
  res.json(await User.find({}));
});

// (c) Verbose database errors sent to the client.
try {
  await save();
} catch (err) {
  res.status(500).json({ error: err.message });  // may include the query
}

// (d) Production data copied into a test database or a fixture file.
await User.create({ email: "real.customer@example.com", ssn: "123-45-6789" });

// (e) Over-broad CORS or a public bucket means "no data exposure"
//     is not the same as "no one can read it".
res.json(await fs.readFile("public/dump.json"));`,
      walkthrough: [
        "(a) The full document is the classic over-fetch. The response is public to whoever can call the endpoint.",
        "(b) Unbounded result sets are both a data leak and a denial-of-service risk.",
        "(c) Database errors reveal table and column names, which makes the next attack much faster.",
        "(d) Real personal data in test fixtures is a compliance incident waiting for the day the repository is cloned.",
        "(e) Data is not protected just because the app is secure; the storage and the response headers matter too."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "minimise exposure - SAFE",
      code: `// 1) A whitelist DTO: the response is built field by field.
function toPublicUser(u) {
  return { id: u._id, name: u.name, avatarUrl: u.avatarUrl };
}

// 2) Never return a mongoose document straight to a client.
app.get("/api/users/:id", requireLogin, async (req, res) => {
  const user = await User.findById(req.params.id).select("name avatarUrl");
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(toPublicUser(user));
});

// 3) Selective queries: .select() at the database, not a delete later.
app.get("/api/reports", requirePermission("reports:read:own"), async (req, res) => {
  const page = Math.min(Number(req.query.page) || 1, 1);
  const size = Math.min(Number(req.query.size) || 20, 100);   // hard cap
  const [items, total] = await Promise.all([
    Report.find({ ownerId: req.session.userId })
         .select("id title status createdAt")
         .skip((page - 1) * size).limit(size).lean(),
    Report.countDocuments({ ownerId: req.session.userId })
  ]);
  res.json({ items, total, page, size });
});

// 4) Generic client errors; the detail goes to the log with a
//    correlation id, never to the response.
app.use((err, req, res, next) => {
  const ref = crypto.randomUUID();
  logger.error({ ref, err, userId: req.session?.userId });
  res.status(500).json({ error: "Something went wrong", ref });
});

// 5) Real-looking but fake data in fixtures.
const FIXTURES = [{ email: "user1@example.test", ssn: "000-00-0000" }];

// 6) Classify the data you hold, and delete what you no longer need.
app.delete("/api/account", requireLogin, async (req, res) => {
  await User.deleteOne({ _id: req.session.userId });
  res.status(204).end();
});`,
      explanation:
        "The habit to build is explicit response shaping. A whitelist DTO makes it obvious what leaves the system, and it is the moment to notice that a field should never be exposed. Select at the database, cap and paginate every list, return generic errors with a correlation id, use synthetic data in tests, and delete data you no longer need - the most reliable protection."
    },
    prevention: [
      "Return only the fields a screen needs, using an explicit whitelist, never the raw document.",
      "Apply .select() in the query so unwanted fields never leave the database.",
      "Paginate and hard-cap every list endpoint.",
      "Return generic error messages with a correlation id; log the detail server-side.",
      "Encrypt sensitive fields at rest and in transit, and separate keys from data.",
      "Use synthetic or anonymised data in development and test environments.",
      "Classify your data, set a retention period, and delete on schedule.",
      "Audit third parties and integrations: analytics, support tools and CDNs all receive real data.",
      "Check CORS, and make sure storage is not publicly readable."
    ],
    securePractices: [
      "Treat every API response as public to the caller, and shape it deliberately.",
      "Ask 'who is the least-privileged consumer of this field?' and answer before you add it to the response.",
      "Automate a test that asserts a sensitive field is absent from the JSON, so a future refactor cannot re-add it.",
      "Minimise at the source: not collecting a field is better than protecting one.",
      "Write a data inventory so retention and deletion are not guesses."
    ],
    furtherReading: [
      "OWASP Sensitive Data Exposure",
      "OWASP Cryptographic Storage Cheat Sheet",
      "OWASP Data Protection Cheat Sheet"
    ],
    quiz: [
      {
        question: "Why is res.json(user) risky?",
        options: [
          "It is slow for large documents",
          "It returns every field, including ones the UI never shows and ones that must never leave the server",
          "It does not set a content type",
          "Mongoose documents cannot be serialised"
        ],
        correctIndex: 1,
        explanation:
          "Serialising a whole document publishes the entire schema. Whitelist DTOs keep the contract small and reviewable."
      },
      {
        question: "What is the most reliable way to protect a field you no longer need?",
        options: [
          "Encrypt it",
          "Delete it on a schedule - data you do not hold cannot leak",
          "Restrict access to it",
          "Hash it"
        ],
        correctIndex: 1,
        explanation:
          "Protection can fail; deletion removes the exposure entirely. Minimise and expire data by default."
      },
      {
        question: "A stack trace shown to the user is...",
        options: [
          "Helpful and harmless",
          "An information leak that reveals file paths, library versions and sometimes connection details",
          "Required by Node.js",
          "A performance optimisation"
        ],
        correctIndex: 1,
        explanation:
          "Verbose errors help the attacker map your system. Send a generic message plus a correlation id, and log the detail."
      }
    ],
    lab: {
      title: "Minimise an API response",
      type: "fix-the-code",
      task:
        "Take one endpoint that returns a whole document, and rewrite it to return exactly what the screen needs.",
      steps: [
        "List every field the current response contains.",
        "Mark each as: needed for this screen, needed for another screen, internal only, or should not exist.",
        "Write the whitelist and the .select() call.",
        "Add a test that asserts a forbidden field is absent from the response body."
      ],
      hint: "Open your own app's Network tab and look at the raw JSON - the data you did not intend to publish is already visible there.",
      solution:
        "You will find fields you did not know were being sent. The fix is a DTO function plus a .select() so the reduction happens at the database, not in the frontend. Cap and paginate the list, and add a regression test that fails if a forbidden key reappears - that test is what stops the leak from coming back after the next refactor.",
      isSafe: true,
      estimatedMinutes: 20
    }
  },

  /* ---------------------------------------------------------------- */
  "information-leakage": {
    title: "Information Leakage and Improper Error Handling",
    relatedConcepts: ["improper-error-handling", "sensitive-data-exposure", "security-misconfiguration"],
    simpleExplanation:
      "The 2007 category that combined two problems: revealing more than you should, and handling errors badly. Verbose errors, stack traces, debug pages, verbose directory listings, and detailed database errors all tell an attacker how your system is built. The 2003 and 2004 lists had called the same idea 'Error Handling Problems' and 'Improper Error Handling'.",
    whyItHappens:
      "Developers optimise the error path for themselves, not for users. Showing a stack trace makes debugging faster, so it stays in. Verbose logging is genuinely useful - but the same output is often written somewhere with weaker access control than the database.",
    howItWorks:
      "1. An unhandled error returns a page with the full stack trace: file paths, line numbers, framework versions, and sometimes a database connection string. 2. An attacker collects these from many endpoints to build a map. 3. Version numbers tell them which known vulnerabilities apply. 4. A detailed SQL error confirms a table name, so the next injection attempt is aimed correctly.",
    safeExample:
      "It is a help desk that says 'your account is fine, but our technician Ashok will call you back, ticket #4471, and the error was E_TIMEOUT on node-3'. The last part is not useful to the customer and is extremely useful to an attacker. Professional error handling gives the customer a reference number and keeps the technical detail inside.",
    impact: [
      "Reveals technology versions, file paths and internal hostnames.",
      "Confirms table, column and framework details that make other attacks precise.",
      "Leaks stack traces containing secrets or connection strings.",
      "Debug pages in production can expose environment variables and source."
    ],
    typicalSeverity: "medium",
    vulnerableCode: {
      language: "javascript",
      filename: "error handling - IN SAFE",
      code: `// (a) Stack trace to the client
app.use((err, req, res, next) => {
  res.status(500).send(err.stack);
});

// (b) A framework debug route left enabled
app.use("/debug", require("debug")());

// (c) Detailed database errors returned to the user
try {
  await User.create(req.body);
} catch (err) {
  res.status(400).json({
    error: err.message,
    // Mongoose ValidationError leaks field names and internal paths
    collection: err.collection?.collectionName,
    keys: Object.keys(err.keyPattern || {})
  });
}

// (d) Verbose logging of full request bodies
logger.info("request", { body: req.body, headers: req.headers });

// (e) Directory listing / default error pages that disclose the stack
app.use(express.static("public", { index: ["index.html", "index.htm"] }));`,
      walkthrough: [
        "(a) err.stack contains absolute file paths, node_modules locations and the framework version.",
        "(b) Express's debug module can dump the whole request and route table.",
        "(c) Validation and duplicate-key errors reveal your schema.",
        "(d) Headers include cookies and authorization values, so logging them is logging credentials.",
        "(e) Directory listing publishes filenames that should not be guessed."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "error handling - SAFE",
      code: `const { v4: uuid } = require("crypto").randomUUID
  ? { v4: require("crypto").randomUUID }
  : { v4: () => require("crypto").randomUUID() };

// 1) TWO handlers: verbose locally, generic in production.
app.use((err, req, res, next) => {
  const ref = require("crypto").randomUUID();

  if (process.env.NODE_ENV === "production") {
    // Full detail goes to the log, WITH the reference the user can quote.
    logger.error({ ref, message: err.message, stack: err.stack,
                   userId: req.session?.userId, path: req.path });
    return res.status(500).json({ error: "Something went wrong", ref });
  }
  return res.status(500).send(err.stack);     // development only
});

// 2) Validation errors: helpful, but about the DATA, not the schema.
try {
  await User.create(pickAllowedFields(req.body));
} catch (err) {
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Some fields are invalid",
      fields: Object.fromEntries(
        Object.entries(err.errors).map(([k, e]) => [k, e.message])
      )
    });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "That value is already registered" });
  }
  throw err;                                  // let the handler log it
});

// 3) Redacted logging.
const SENSITIVE = new Set(["password", "token", "authorization", "cookie"]);
const safeLog = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) =>
    [k, SENSITIVE.has(k.toLowerCase()) ? "[redacted]" : v]));

logger.info("request", safeLog({ method: req.method, path: req.path,
                                 userId: req.session?.userId }));

// 4) No directory listing.
app.use(express.static("public", { index: false, dotfiles: "deny" }));`,
      explanation:
        "The pattern is: one reference number for the user, full detail in the log, redacted fields, friendly messages for expected failures such as validation, and no directory listing. Note that a 500 with a correlation id is not a failure to handle - it is exactly the right response to an unexpected error."
    },
    prevention: [
      "Never send stack traces to the client in production; use a correlation id instead.",
      "Log the full detail server-side, with a reference the user can quote to support.",
      "Return validation messages about the input, not about your schema or query.",
      "Disable framework debug routes and verbose error pages outside development.",
      "Redact passwords, tokens, cookies and personal data from logs and error trackers.",
      "Disable directory listing and do not serve the project root.",
      "Return correct status codes - 400 for bad input, 401 unauthenticated, 403 forbidden, 404 unknown, 409 conflict, 429 rate limited - because clients and monitoring depend on them.",
      "Alert on error spikes: a sudden rise in 500s is an attack signal, not a nuisance."
    ],
    securePractices: [
      "Write your own error response format once and use it everywhere.",
      "Test: trigger an error on your own app and check the response for anything internal.",
      "Read your logs as an outsider would - that is the attacker's view.",
      "Distinguish 'expected' failures (validation) from 'unexpected' ones, and handle them differently.",
      "Keep error messages useful to developers in the log and harmless to users in the response."
    ],
    furtherReading: [
      "OWASP Error Handling Cheat Sheet",
      "OWASP Logging Cheat Sheet"
    ],
    quiz: [
      {
        question: "What belongs in a production 500 response?",
        options: [
          "The full stack trace",
          "A generic message plus a correlation id that matches a server-side log entry",
          "The database query that failed",
          "The environment variables"
        ],
        correctIndex: 1,
        explanation:
          "The user gets a reference they can quote; the operator gets the detail. That is both better support and less leakage."
      },
      {
        question: "Why is logging request headers risky?",
        options: [
          "Headers are too large",
          "They contain cookies and authorization values, so logging them is logging credentials",
          "Headers are not text",
          "It breaks HTTPS"
        ],
        correctIndex: 1,
        explanation:
          "Redact cookie, authorization and any token-like field before anything reaches a log aggregator."
      },
      {
        question: "Which status code means 'you are authenticated but not allowed'?",
        options: ["200", "401", "403", "500"],
        correctIndex: 2,
        explanation:
          "401 is 'not authenticated'; 403 is 'authenticated but forbidden'. Getting these right matters for clients and for monitoring."
      }
    ],
    lab: {
      title: "Compare two error handlers on your own app",
      type: "identify-the-bug",
      task:
        "Run your app locally, trigger several different errors, and record exactly what each response reveals.",
      steps: [
        "Trigger: a validation failure, a database error, an unhandled exception, and a 404.",
        "For each, record the status code and everything the response body reveals.",
        "Write the improved handler for each case.",
        "Check the logs and confirm the full detail is still available there, behind the correlation id."
      ],
      hint: "The 404 page of a framework often names the framework and its version.",
      solution:
        "You will usually find at least a framework name, a file path or a schema detail in the responses. The fix is a single production error handler that returns a generic message and a correlation id, a validation path that reports only field-level problems, disabled debug routes, and no directory listing. Then confirm the operator experience did not get worse: the detail is still in the log, keyed by the same id.",
      isSafe: true,
      estimatedMinutes: 20
    }
  },

  /* ---------------------------------------------------------------- */
  "improper-error-handling": {
    title: "Improper Error Handling",
    relatedConcepts: ["information-leakage", "exceptional-conditions", "logging-monitoring"],
    simpleExplanation:
      "Failing badly is a security problem. The 2003 and 2004 categories ('Error Handling Problems', 'Improper Error Handling') are about what happens when something goes wrong: unhandled crashes, ignored return values, silently swallowed exceptions, and errors that leave the system in a half-finished state. OWASP came back to the same idea in 2025 as A10 Mishandling of Exceptional Conditions.",
    whyItHappens:
      "Error paths are the code nobody tests, so they are written quickly, often with an empty catch block. A developer suppresses the error to 'stop the noise', and in doing so removes the only signal that the attack worked. In the middle of a multi-step operation, an unhandled failure can leave data half-written and the system inconsistent.",
    howItWorks:
      "1. A handler does try { await transfer() } catch (e) {} - the error is ignored. 2. The transfer failed after the debit but before the credit, so the money is gone and no log records it. 3. Alternatively, a failure is thrown mid-loop, leaving a partially written record with no rollback. 4. The application continues in an undefined state, and the next request sees corrupted data.",
    safeExample:
      "It is a bank teller moving money from one account to another. If the machine stops after taking the money and the teller simply carries on with the next customer without a receipt, nobody can reconcile the account later. Handling the exception means stopping, undoing, and writing down what happened - the transaction is either complete or it never happened.",
    impact: [
      "Partial operations leave data corrupted or lost, with no record.",
      "Silent failures mean an attack produces no alert at all.",
      "Unchecked errors crash the process, giving an easy denial of service.",
      "Leaks of stack traces and internal details (see the related leakage category)."
    ],
    typicalSeverity: "medium",
    vulnerableCode: {
      language: "javascript",
      filename: "exception handling - IN SAFE",
      code: `// (a) The error is swallowed: no log, no alert, no rollback.
try {
  await debit(userId, amount);
  await credit(targetId, amount);
} catch (err) {
  // nothing - the money is now in the wrong place and nobody knows
}

// (b) An empty catch used to silence noise
try { await parseLegacyRow(row); } catch {}

// (c) A partially written record when step 2 fails
await Order.create({ total, status: "created" });
await reserveStock(items);          // may throw
await Payment.charge(order);        // never runs - order is half-made

// (d) Fire and forget with no tracking
sendEmail(user.email, "welcome");   // rejection is unhandled

// (e) Errors mapped to the wrong status code
app.use((err, req, res, next) => res.status(200).json({ error: err.message }));`,
      walkthrough: [
        "(a) The dangerous part is not the throw, it is the empty catch: the operation is neither completed nor undone, and no log entry exists.",
        "(b) Silencing errors removes your only detection signal.",
        "(c) No transaction means partial writes are permanent.",
        "(d) An unhandled promise rejection can terminate the process in newer Node versions.",
        "(e) A 200 with an error body breaks every client and every monitoring rule that relies on status codes."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "exception handling - SAFE",
      code: `// 1) A transaction: all steps or none. (MongoDB replica set,
//    Postgres, SQL Server all support this.)
const session = await mongoose.startSession();
try {
  await session.withTransaction(async () => {
    await Account.updateOne({ _id: from }, { $inc: { balance: -amount } }, { session });
    await Account.updateOne({ _id: to },   { $inc: { balance: +amount } }, { session });
    await Ledger.create({ from, to, amount, at: new Date() }, { session });
  });
} finally {
  await session.endSession();
}

// 2) Never swallow silently. Classify, log, and react.
class DomainError extends Error {
  constructor(message, code) { super(message); this.name = "DomainError"; this.code = code; }
}

try {
  await transfer(from, to, amount);
} catch (err) {
  if (err instanceof DomainError) {
    // Expected business failure: safe, specific message, no stack.
    logger.warn({ code: err.code, userId, message: err.message });
    return res.status(400).json({ error: friendlyFor(err.code) });
  }
  // Unexpected: full detail to the log, generic to the user.
  const ref = require("crypto").randomUUID();
  logger.error({ ref, stack: err.stack, message: err.message });
  res.status(500).json({ error: "Something went wrong", ref });
}

// 3) Background work is tracked, not fire-and-forget.
await mailQueue.add("welcome", { to: user.email });   // durable, retried, logged

// 4) Fail closed on security checks: a failed authorisation must
//    NOT fall through to "allowed".
const allowed = await checkAccess(user, resource);
if (!allowed) return res.status(403).json({ error: "Not allowed" });

// 5) Startup self-checks: fail fast and loudly if the app is
//    misconfigured, rather than at 3am on the first request.
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not set - refusing to start");
}`,
      explanation:
        "The four habits are: make multi-step operations atomic, never swallow an exception without recording it, distinguish expected failures from unexpected ones, and fail closed on security decisions. The transaction is the important structural fix, because it removes the whole class of 'it half happened' bugs."
    },
    prevention: [
      "Wrap multi-step state changes in a database transaction so partial writes cannot persist.",
      "Never use an empty catch block; if an error is truly ignorable, log it at a low level with context.",
      "Classify errors: expected business failures get a specific safe message, unexpected ones get a generic message plus a log entry.",
      "Put background work on a durable queue with retries and a dead-letter path, not fire-and-forget promises.",
      "Fail closed: an error in a permission check must deny, never allow.",
      "Validate configuration at startup and refuse to boot if something required is missing.",
      "Map every failure to the correct HTTP status code so clients and monitors behave.",
      "Alert on error-rate spikes - a sudden rise is usually an attack in progress."
    ],
    securePractices: [
      "Write tests for the failure path, not just the happy path - it is where the bugs are.",
      "Ask of every catch block: 'if this throws, what state is the system in?'",
      "Make failure visible: a silent failure is indistinguishable from a successful attack.",
      "Prefer explicit result objects over exceptions in hot paths where you must handle errors anyway.",
      "Review the code for `catch {}` and empty catch blocks during review - it is a fast, high-value check."
    ],
    furtherReading: [
      "OWASP Error Handling Cheat Sheet",
      "MDN: Graceful degradation and fail-safe design"
    ],
    quiz: [
      {
        question: "What is the real danger of an empty catch block in a multi-step operation?",
        options: [
          "It uses too much memory",
          "The operation can be left half-completed with no rollback and no log, so corruption is invisible",
          "It prevents the request from finishing",
          "It disables the database"
        ],
        correctIndex: 1,
        explanation:
          "The partial-write problem is structural. A transaction, or an idempotent design, removes it."
      },
      {
        question: "When a permission check itself throws an error, what should happen?",
        options: [
          "Allow the request, to avoid breaking the user experience",
          "Deny the request - fail closed",
          "Retry indefinitely",
          "Log a warning and allow it"
        ],
        correctIndex: 1,
        explanation:
          "Failing open on a security decision turns any bug in the check into a bypass. Fail closed."
      },
      {
        question: "Why classify errors into expected and unexpected?",
        options: [
          "To reduce code size",
          "Expected failures can return a specific safe message, while unexpected ones need a generic response plus a full server-side log entry",
          "So users do not see stack traces",
          "To avoid using try/catch"
        ],
        correctIndex: 1,
        explanation:
          "The two classes need different responses: one is a business outcome, the other is an incident. Mixing them produces either noisy responses or hidden incidents."
      }
    ],
    lab: {
      title: "Find every empty catch in a project",
      type: "identify-the-bug",
      task:
        "Search your own code for swallowed errors, and for each one decide what state the system is in when it triggers.",
      steps: [
        "Grep for catch, catch {}, and .catch(() => {}), and for ignored promises.",
        "For each, write down what the system state would be if the error fired.",
        "For each that matters, choose a fix: transaction, typed error, queue, or explicit log.",
        "Add one test that forces the error and asserts the correct outcome."
      ],
      hint: "Also look for places where a failed security check does not stop the request.",
      solution:
        "The pattern that shows up is 'I suppressed it to stop the noise'. Each one removes a detection signal and often leaves a partial state. Fix by transaction for multi-step writes, typed errors for expected outcomes with safe messages, a durable queue for background work, fail-closed for security decisions, and always a log entry with a correlation id for the unexpected case. Then add the test, because an untested error path silently rots.",
      isSafe: true,
      estimatedMinutes: 25
    }
  },

  /* ---------------------------------------------------------------- */
  "vulnerable-components": {
    title: "Using Components with Known Vulnerabilities",
    relatedConcepts: ["supply-chain", "integrity-failures", "security-misconfiguration", "buffer-overflow"],
    simpleExplanation:
      "You run code that someone else wrote, and a public list says that code has a known flaw. You may never have to write the vulnerable line yourself - you only have to install the package. OWASP tracked this as A9 in 2013 and 2017, and as A06 Vulnerable and Outdated Components in 2021.",
    whyItHappens:
      "Nobody owns the dependency list. Developers add packages to solve a problem in two minutes and never look again. Nobody knows which version is deployed in production, so even when a critical advisory lands there is no way to tell whether you are affected. Component count grows faster than anyone's ability to review it.",
    howItWorks:
      "1. A popular library ships a version with a critical vulnerability, disclosed publicly with a CVE. 2. Your application runs that version, often transitively - you never chose it directly. 3. An attacker checks your public assets, headers and behaviour to fingerprint the version. 4. They use the published exploit, which needs no creativity at all.",
    safeExample:
      "It is buying a car with a known recall. The manufacturer published the fix and the affected model years. Owning the car is fine - but only if you know which model and year you have, and you apply the recall. Not knowing your own inventory is the real problem, not the recall itself.",
    impact: [
      "Exploitation is trivial because a working exploit is public.",
      "The flaw may sit several packages deep, in code you never wrote or reviewed.",
      "Component counts are large - a typical web app has hundreds, so manual review is impossible.",
      "An unmaintained package can disappear, taking your build with it."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "dependency habits - IN SAFE",
      code: `// (a) Versions pinned loosely, so what runs in production is unknown.
{
  "dependencies": {
    "express": "*",          // whatever is newest at install time
    "lodash": "latest",
    "some-internal-lib": "^1.0.0"
  }
}

// (b) No lockfile committed: two installs of the same commit give
//     different trees.
$ npm install        # package-lock.json never committed

// (c) Transitive packages nobody has looked at.
$ npm ls --depth=0    # direct only
$ npm ls | wc -l      // often 500+ including transitive

// (d) No automated vulnerability scan in CI.
$ npm audit --production    // run manually, months apart

// (e) An unmaintained fork is copied in "temporarily".
vendor/old-jsonparser/  (last commit: 2016)`,
      walkthrough: [
        "(a) A wildcard or 'latest' range means the deployed version depends on when the install ran.",
        "(b) Without a lockfile, two developers and production can run different code from the same commit - the reproducibility hole behind most 'works on my machine' incidents.",
        "(c) Transitive dependencies are the majority, and they carry the majority of advisories.",
        "(d) A manual audit is a snapshot; advisories are published daily.",
        "(e) A vendored copy of unmaintained code is a permanent, invisible liability."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "dependency hygiene - SAFE",
      code: `// 1) Commit the lockfile, and install with it in CI.
$ npm ci              // fails if package.json and the lockfile disagree

// 2) Pin exact versions for runtime dependencies; use ranges only
//    where you actively update.
{
  "dependencies": { "express": "4.21.1" }
}

// 3) Scan automatically, on every push, and fail the build on
//    high-severity findings in production dependencies.
$ npm ci
$ npm audit --omit=dev --audit-level=high
$ npx snyk test        // or: osv-scanner, dependabot, trivy

// 4) Continuous updates: Dependabot / Renovate open pull requests
//    with tests and changelogs, so updating is routine, not a project.

// 5) Know what you actually ship.
$ npm ls --omit=dev --all > shipped-deps.txt
$ npm why express        // why is this here at all?

// 6) Remove what you do not use. Fewer packages, less surface.
$ npm prune
// Review the whole tree once a quarter and delete abandoned packages.

// 7) Provenance for anything you vendor: record the upstream
//    commit, the licence and who approved it.`,
      explanation:
        "The controls are process, not code: commit the lockfile, install with npm ci, scan in CI on every build, keep dependencies patched through automated pull requests, and prune what you no longer use. The most important habit is making updates routine - a weekly five-minute pull request beats an annual emergency rebuild."
    },
    prevention: [
      "Commit the lockfile and use npm ci (or an equivalent) so every environment installs the same tree.",
      "Pin exact versions for runtime dependencies; let ranges exist only where you actively update.",
      "Run automated dependency scanning in CI and fail the build on high-severity production findings.",
      "Enable automated update pull requests and review them like any other change.",
      "Remove unused, abandoned and duplicated dependencies - the tree shrinks, the risk shrinks.",
      "Track what you ship, and fingerprint your own production build to know which versions are exposed.",
      "For vendored code, record the upstream source, version and licence, and set a review date.",
      "Prefer well-maintained, widely used components with a clear security policy.",
      "Rate new dependencies: how many maintainers, how active, how big is the surface, can you write it yourself?"
    ],
    securePractices: [
      "Make 'dependencies are patched' a visible, owned status, not an assumption.",
      "Read an advisory for the packages you actually depend on; CVE severity does not equal your exposure.",
      "Do not add a 40-package library to replace ten lines of your own code.",
      "Keep development-only dependencies out of the production image - build tooling often has its own advisories.",
      "Rehearse an urgent upgrade before you need one; the hard part is usually the test suite, not the version bump."
    ],
    furtherReading: [
      "OWASP Software Component Verification Standard",
      "OWASP Dependency-Check and CycloneDX guidance",
      "GitHub Advisory Database, OSV database"
    ],
    quiz: [
      {
        question: "Why must the lockfile be committed?",
        options: [
          "It makes installs faster",
          "Without it, two installs of the same commit can produce different dependency trees, so you cannot say what code is running in production",
          "It reduces the number of packages",
          "npm requires it"
        ],
        correctIndex: 1,
        explanation:
          "The lockfile is the record of exactly what is deployed. Without it, 'we use an old version' is a guess."
      },
      {
        question: "Which dependency carries the most risk in a typical app?",
        options: [
          "The one you wrote",
          "A transitive dependency you did not choose and have never looked at",
          "The one with the most stars",
          "Development-only tooling"
        ],
        correctIndex: 1,
        explanation:
          "Transitive dependencies outnumber direct ones many times over, and the majority of advisories appear there."
      },
      {
        question: "What is the best way to keep patched?",
        options: [
          "One big upgrade each year",
          "Small, frequent, automated update pull requests reviewed by the same process as any other change",
          "Never upgrade, it is safer",
          "Upgrade only when something breaks"
        ],
        correctIndex: 1,
        explanation:
          "Small frequent changes keep the test suite honest and make a regression easy to find. Large rare upgrades are where projects get stuck."
      }
    ],
    lab: {
      title: "Take inventory of your own dependencies",
      type: "design-review",
      task:
        "For a project you own, produce a full inventory and a maintenance plan.",
      steps: [
        "Run npm ls --all and count the total, including transitive packages.",
        "Run a vulnerability scan and record how many findings are direct versus transitive.",
        "List the five dependencies you would most like to remove, and why.",
        "Write down your update cadence and who owns it."
      ],
      hint: "A large part of the tree is often unused or duplicated functionality.",
      solution:
        "The inventory usually shocks people: hundreds of packages for a modest app, with most advisories in code nobody chose. The plan that works is: commit the lockfile, install with npm ci, scan in CI on every build, enable automated update PRs, prune unused packages, and remove dev-only tooling from the production image. Ownership and a weekly review are what turn this from a good intention into a maintained posture.",
      isSafe: true,
      estimatedMinutes: 25
    }
  },

  /* ---------------------------------------------------------------- */
  "logging-monitoring": {
    title: "Insufficient Logging and Monitoring",
    relatedConcepts: ["exceptional-conditions", "information-leakage", "broken-access-control", "vulnerable-components"],
    simpleExplanation:
      "If you cannot see it, you cannot stop it. This category is about not noticing attacks in time: no login-failure log, no alert when one account fails from twenty countries, no record of who read a patient's file, no detection of a mass data download. OWASP called it 'Insufficient Logging and Monitoring' in 2017 and 'Security Logging and Monitoring Failures' in 2021, and 2025 renamed it to add the word Alerting.",
    whyItHappens:
      "Logging is treated as a debugging tool rather than a security control, so teams log what is easy (requests) and not what matters (authorisation failures, privilege changes, data access). Alerts then go to a channel nobody watches, and the logs themselves are not protected, so an attacker with access can delete the evidence.",
    howItWorks:
      "1. An attacker probes an admin endpoint 5,000 times. Every response is 403 and nothing is recorded at all. 2. They find a working credential pair after 20 attempts, log in, and export the customer table. 3. The export looks like a normal query, so it appears in access logs - if anyone looks. 4. The breach is discovered six months later, from an external tip, and the logs no longer cover the period.",
    safeExample:
      "It is a warehouse with valuable goods and no cameras, no stock records and no alarm. Nothing is wrong until the morning the goods are gone - and then there is no way to tell when they left, who carried them out, or whether it happened once or a hundred times. Logging is the stock record; monitoring is the alarm.",
    impact: [
      "Breaches go undetected for months; median dwell time is measured in weeks to months.",
      "Attacks cannot be attributed because there is no record of who did what.",
      "Forensics fail because logs are missing, rotated too fast, or were deleted.",
      "Repeat attacks succeed because there is no feedback loop from detection to blocking."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "logging gaps - IN SAFE",
      code: `// (a) Only HTTP access is logged. No security events at all.
app.use(morgan("dev"));

// (b) A failed login is silently ignored.
app.post("/login", async (req, res) => {
  if (!ok) return res.status(401).json({ error: "Invalid" });   // no event
});

// (c) Authorisation failures are not recorded, so probing is invisible.
if (!can(user, "reports:read:any")) {
  return res.status(403).json({ error: "Not allowed" });     // no event
}

// (d) Logs are not protected: an app-level admin can delete them.
app.get("/admin/logs", requireLogin, (req, res) => res.sendFile("/var/log/app.log"));

// (e) Sensitive values are written into logs.
logger.info("payment", req.body);   // card number

// (f) No alerting, and logs live only on the web server.
logger.info("unusual activity");    // nobody is notified`,
      walkthrough: [
        "(a) Access logs record requests, not decisions. They will not tell you that 5,000 authorisations were denied.",
        "(b) and (c) The most important security events - failed logins, denied access, privilege changes - are the ones most often missing.",
        "(d) If the application can delete its own evidence, it is not an audit trail.",
        "(e) Over-logging creates its own risk and makes real signals harder to find.",
        "(f) Logs without alerts are a filing cabinet nobody opens."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "security logging that works - SAFE",
      code: `// 1) A structured security event, with a fixed schema so it
//    can be queried and alerted on later.
function securityEvent({ type, outcome, actor, target, ip, ua, extra = {} }) {
  logger.info({
    type,                       // "auth.login", "authz.denied", "data.export"
    outcome,                    // "success" | "failure"
    actorId: actor?.id ?? null,  // WHO
    actorRole: actor?.role ?? null,
    target,                     // WHAT
    ip, userAgent: ua,
    correlationId: req.correlationId,
    at: new Date().toISOString(),
    ...extra
  });
}

// 2) Log the security events, not just the requests.
app.post("/login", loginLimiter, async (req, res) => {
  const ok = await verify(req.body);
  securityEvent({
    type: "auth.login",
    outcome: ok ? "success" : "failure",
    actor: ok ? ok.user : null,
    target: "session",
    ip: req.ip, ua: req.get("user-agent"),
    extra: { reason: ok ? undefined : "bad_credentials" }   // no password!
  });
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });
  ...
});

app.use((req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode === 403 || res.statusCode === 401) {
      securityEvent({ type: "authz.denied", actor: req.session?.user,
                      target: req.path, ip: req.ip, ua: req.get("user-agent") });
    }
  });
  next();
});

// 3) Alerts on patterns, not on volume.
const ALERTS = [
  { name: "credential-stuffing", when: "login failures > 50 in 10 min from > 5 IPs" },
  { name: "probing",            when: "authz.denied > 100 in 5 min for one actor" },
  { name: "privilege-change",    when: "any role or MFA change" },
  { name: "bulk-read",          when: "one actor reads > 500 records in 5 min" },
  { name: "export",             when: "any data export endpoint" }
];

// 4) Log hygiene
//    - redaction helper applied to EVERY log line
//    - ship off-box immediately, append-only, with integrity checks
//    - retain long enough to investigate (90+ days), and define who
//      can read them
//    - the application cannot delete the shipped copies
//    - synchronise host clocks (NTP) or the timeline is useless`,
      explanation:
        "Effective logging is a fixed schema of security events (who, what, when, outcome), shipped off the box where the application cannot tamper with it, with alerts for specific patterns rather than volume. A redaction helper must be applied at the logger so no call site can leak a password. And clock synchronisation matters more than people expect: an unsynchronised server makes the whole timeline unusable."
    },
    prevention: [
      "Log all authentication events: success, failure, logout, password change, MFA change, account lockout.",
      "Log every access-control decision that denies access, with actor, target and reason.",
      "Log privileged and administrative actions, and all data exports.",
      "Use a structured, consistent schema so events can be queried and correlated.",
      "Redact passwords, tokens, session ids and personal data from every log line, by default at the logger.",
      "Ship logs off the application server, append-only, with integrity protection and a defined retention period.",
      "Alert on specific patterns: credential stuffing, probing, privilege escalation, bulk reads, unusual volume.",
      "Synchronise clocks on every host, or your incident timeline is unusable.",
      "Review who can read the logs, and treat log access as a privileged permission.",
      "Test the pipeline: deliberately trigger an alert and confirm a human receives it."
    ],
    securePractices: [
      "Log decisions, not just requests. Access logs will not tell you that access was denied 5,000 times.",
      "Use a correlation id so one user's journey can be reconstructed across services.",
      "Keep the format structured; free-text logs cannot be alerted on reliably.",
      "Write down what you would need to prove after an incident, and make sure you collect it.",
      "Test alerting end to end, including the part where a human reads it. Unread alerts are the same as no alerts."
    ],
    furtherReading: [
      "OWASP Logging Cheat Sheet",
      "OWASP Web Security Testing Guide - Review Old Backup and Unreferenced Files",
      "MITRE ATT&CK for detection mapping"
    ],
    quiz: [
      {
        question: "Which event is most valuable to log that people usually forget?",
        options: [
          "Successful page loads",
          "Denied access-control decisions, because a burst of them is a clear sign of probing",
          "Static asset requests",
          "Server start-up time"
        ],
        correctIndex: 1,
        explanation:
          "Attacks that fail tell you exactly what an attacker is looking for, and they arrive before any successful compromise."
      },
      {
        question: "Why must logs be shipped off the application server?",
        options: [
          "To save disk space",
          "An attacker who compromises the application would otherwise be able to delete or edit the evidence of their own activity",
          "Servers cannot store logs",
          "To make them searchable"
        ],
        correctIndex: 1,
        explanation:
          "Audit evidence has to be beyond the reach of the thing being audited. Append-only, off-box storage is the standard answer."
      },
      {
        question: "What is a common reason an alert never reaches anyone?",
        options: [
          "The alert channel is unwatched or unowned",
          "The log format is too old",
          "The server is too fast"
        ],
        correctIndex: 0,
        explanation:
          "A detection nobody receives is not a control. Test the pipeline by deliberately triggering an alert and confirming a human sees it."
      }
    ],
    lab: {
      title: "Design a detection for one attack you already learned",
      type: "design-review",
      task:
        "Pick one vulnerability from this module and design the log event and the alert that would catch it in use.",
      steps: [
        "Write the single log event, with every field you would store.",
        "Write the alert rule as a concrete condition with numbers.",
        "Decide who receives it and what they would do in the first five minutes.",
        "Test the design by generating the event on your own local app."
      ],
      hint: "If the alert says 'review logs', it is not an alert. It needs a threshold and an owner.",
      solution:
        "For example, for IDOR: log authz.denied with actor, target object id and outcome; alert when one actor accumulates more than 50 denials on sequential ids in five minutes. The action is to rate-limit and then review. For credential stuffing: alert on failures above 50 in ten minutes from more than five source addresses. Writing the numbers down is what turns an intention into something a system can evaluate.",
      isSafe: true,
      estimatedMinutes: 25
    }
  },

  /* ---------------------------------------------------------------- */
  "insecure-design": {
    title: "Insecure Design",
    relatedConcepts: ["broken-access-control", "ssrf", "exceptional-conditions", "vulnerable-components"],
    simpleExplanation:
      "Insecure design is a flaw that no code review would catch, because the code does exactly what it was designed to do. The design itself has no security requirement. OWASP created this category, A4, in 2021 to say that a perfect implementation of a bad design is still insecure.",
    whyItHappens:
      "Security is added at the end, if at all. Requirements describe features and screens, not threats. There is no abuse-case step, no threat model, and no security acceptance criteria, so the design review checks whether the feature works and not what an attacker could do with it.",
    howItWorks:
      "1. A password-reset feature is designed as 'user requests a link, we e-mail it'. 2. There is no rate limit, no expiry, and the token is guessable, and the confirmation page reveals whether an account exists. 3. Anyone can request resets for any address and use the differences to enumerate accounts and to lock out real users. 4. No individual line of code is wrong; the design simply never considered abuse.",
    safeExample:
      "It is a bank designing a safe with a brilliant lock and an open display panel showing the balance. The lock works perfectly. But the requirement list never mentioned hiding the balance, so nobody built a screen for it. Secure design starts by asking 'what must never happen?', not 'what shall this do?'.",
    impact: [
      "Missing controls that no implementation step was ever asked to add: no rate limit, no captcha, no audit, no transaction.",
      "Business logic flaws: applying a coupon twice, returning more than was paid, skipping a step in a workflow.",
      "Abuse of features that were only designed for the honest path.",
      "Expensive to fix later, because the design is in the database schema, the API and the client."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "correct code, unsafe design - IN SAFE",
      code: `// Every line here is correct. The DESIGN is the problem.
app.post("/forgot-password", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ error: "No such account" }); // leaks existence

  // Token: short, no expiry, single use not enforced
  const token = Math.random().toString(36).slice(2, 8);
  user.resetToken = token;
  user.resetExpires = null;                    // never expires
  await user.save();
  await mail(user.email, "Reset: " + token);
  res.json({ ok: true });
});

// The design assumed: one honest user, one request, no attacker.
// Missing BY DESIGN:
//   - rate limiting per account and per address
//   - token entropy and expiry
//   - single-use invalidation after success
//   - a uniform response so accounts cannot be enumerated
//   - notification to the account owner when a reset is requested

// Business-logic example, also a design failure:
app.post("/checkout", async (req, res) => {
  const total = await priceBasket(req.body.items);  // client sends items
  await Charge.charge(req.user, total);
  res.json({ paid: total });
});
// The design never stated: prices come from the catalogue, never the client.`,
      walkthrough: [
        "The 404 leaks which addresses are registered - a design requirement was missing, not a code bug.",
        "A six-character token from Math.random with no expiry is a design decision, not an implementation slip.",
        "Nothing invalidates the token after use, so a leaked link stays valid.",
        "No notification to the owner, so an attacker can act invisibly.",
        "The checkout trusts client-supplied prices, which the design never addressed."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "secure by design - SAFE",
      code: `// 1) THREAT MODEL FIRST, as a required design artefact.
//    For each feature write: asset, actor, abuse case, control,
//    test. "We considered: attacker resets another user's password
//    to take over the account -> controls: 64-bit random token,
//    15 min expiry, single use, uniform response, notify owner."

// 2) Secure design expressed as requirements, then implemented.
const RESET_TTL_MS = 15 * 60 * 1000;

app.post("/forgot-password", forgotLimiter, async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const user = await User.findOne({ email });

  // 3) UNIFORM response, always 202, whether or not the user exists.
  if (user) {
    // 4) Cryptographically random, single use, expiring token. Store
    //    only a hash of it, so a database leak is not an account leak.
    const raw = crypto.randomBytes(32).toString("base64url");
    user.resetTokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    user.resetExpiresAt = new Date(Date.now() + RESET_TTL_MS);
    await user.save();
    await mailQueue.add("reset", { to: user.email, token: raw });
    await audit("auth.reset_requested", { userId: user._id, ip: req.ip });
  }
  // 5) Always tell the OWNER that a reset was requested.
  if (user) await mailQueue.add("reset_notice", { to: user.email });
  res.status(202).json({ message: "If that account exists, we sent an email." });
});

// 6) Business rules enforced server-side, by design.
app.post("/checkout", async (req, res) => {
  const items = await Catalogue.resolve(req.body.skuIds);   // SERVER prices
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  if (!Number.isInteger(total) || total <= 0) {
    return res.status(400).json({ error: "Invalid basket" });
  }
  const order = await Order.create({ userId: req.user.id, items, total });
  await Charge.charge(req.user, total, { idempotencyKey: order.id });
  res.status(201).json({ orderId: order._id, total });
});`,
      explanation:
        "The fix was never 'write better code in the forgot-password handler' - it was adding four requirements to the design: uniform responses, a random expiring single-use token, ownership notification, and abuse-case rate limits. Secure design is a written artefact (a threat model), and the acceptance test for it belongs in the requirements too."
    },
    prevention: [
      "Write a threat model for each significant feature: assets, actors, abuse cases, controls, tests.",
      "Add security acceptance criteria to requirements, so 'secure' is testable and not a preference.",
      "Design for misuse: assume every field, every parameter and every sequence step is attacker-controlled.",
      "State invariants explicitly - 'a coupon applies once', 'a price comes from the catalogue', 'a token is single use' - and enforce them server-side.",
      "Use the STRIDE or CIA-triad model as a checklist during design review.",
      "Design data flows and trust boundaries on paper before writing endpoints.",
      "Ask 'how would I abuse this feature?' and require an answer for each feature.",
      "Include abuse cases in the test plan, not only the happy path.",
      "Keep design decisions in version control so reviewers can see why a control exists."
    ],
    securePractices: [
      "Make the threat model a required design document, with a short version: five lines per feature.",
      "Distinguish a bug (code does not do what it should) from a design flaw (it does exactly what it should, unsafely). Both matter; only one is found by testing.",
      "Enforce invariants in one shared place, so they cannot be forgotten on one route.",
      "Design abuse resistance in: limits, uniform responses, and idempotency.",
      "Review the design, not just the diff, when reviewing a new feature."
    ],
    furtherReading: [
      "OWASP Threat Modeling Cheat Sheet",
      "OWASP Application Security Verification Standard",
      "STRIDE threat modelling"
    ],
    quiz: [
      {
        question: "What is the difference between a bug and an insecure design flaw?",
        options: [
          "There is no difference",
          "A bug means the code failed to do what was intended; a design flaw means it did exactly what was intended, and the intention was unsafe",
          "Design flaws only exist in front-end code",
          "Bugs are found by users, design flaws by developers"
        ],
        correctIndex: 1,
        explanation:
          "Code review and testing find the first. Only threat modelling and design review find the second."
      },
      {
        question: "What is a required artefact of a secure design review?",
        options: [
          "A UML diagram",
          "A threat model with abuse cases and the controls that address them",
          "A performance benchmark",
          "A list of libraries"
        ],
        correctIndex: 1,
        explanation:
          "The threat model is what forces the team to consider misuse. Without it, security is discovered during implementation or after an incident."
      },
      {
        question: "Why must a password-reset endpoint return the same response whether or not the account exists?",
        options: [
          "For better performance",
          "Different responses let an attacker enumerate which e-mail addresses are registered",
          "Because HTTP requires it",
          "To reduce server load"
        ],
        correctIndex: 1,
        explanation:
          "A uniform response is a design requirement, not an implementation detail - exactly the kind of thing that has to be written down before coding."
      }
    ],
    lab: {
      title: "Threat model one feature you know well",
      type: "design-review",
      task:
        "Take the login or password-reset flow of a project you control and produce a one-page threat model.",
      steps: [
        "List the assets: accounts, sessions, personal data, money.",
        "List the actors: anonymous user, logged-in user, attacker, insider.",
        "For each actor write an abuse case: what would they try to achieve, and which asset does it touch?",
        "For each abuse case write the control and the test that proves the control works."
      ],
      hint: "If you cannot write an abuse case, that is a useful finding too - it usually means the feature is simpler than you thought, or unexamined.",
      solution:
        "A useful one-page threat model produces concrete requirements: uniform responses to prevent enumeration, a random expiring single-use token stored as a hash, rate limits per account and address, owner notification, session invalidation after a reset, and MFA for high-value actions. Each control has a matching test, which is what turns a design intention into something the team can verify. The value is not the document - it is the arguments that happen while writing it.",
      isSafe: true,
      estimatedMinutes: 30
    }
  },

  /* ---------------------------------------------------------------- */
  "integrity-failures": {
    title: "Software and Data Integrity Failures",
    relatedConcepts: ["supply-chain", "vulnerable-components", "insecure-deserialization", "insecure-cryptography"],
    simpleExplanation:
      "These are failures of trust in the things your software relies on. Code, packages, containers, updates and data are all accepted without checking that they are authentic and unchanged. Somebody can then modify what runs on your server, or what your server believes is true. OWASP added this as A08 in 2021.",
    whyItHappens:
      "Trust is implicit. An update is installed from a URL over HTTPS, which proves the server is who it says but not that the build is untampered. A CI pipeline pulls a base image by tag, and tags move. A webhook is trusted because it came from a known IP. A deserialised object is trusted because the connection is encrypted.",
    howItWorks:
      "1. An application auto-updates a library or a container from a channel that has no signature verification. 2. An attacker compromises a distribution point, or a dependency is typosquatted, or a mutable tag now points to a malicious image. 3. Your server runs the modified code with full access to production. 4. Because there was no integrity check and no pinned hash, nothing detects the change.",
    safeExample:
      "It is accepting a delivery without checking who sent it or that the seal is intact. The van is from a familiar company, so you open it. If you had demanded a signature and checked the seal number against a known list, a substituted parcel would be obvious. Cryptographic signing and hash pinning are the seal number.",
    impact: [
      "Arbitrary code execution on every server that installs the tampered component.",
      "Silent data modification, since the data pipeline itself is compromised.",
      "Loss of trust in the build pipeline, and long rebuild times before you know you are clean.",
      "Often undetectable: tampered code behaves normally."
    ],
    typicalSeverity: "critical",
    vulnerableCode: {
      language: "yaml",
      filename: "CI pipeline and update paths - IN SAFE",
      code: `# (a) An update fetched over HTTPS with no signature check.
curl -sSL https://example.com/latest.sh | bash

# (b) A container image referenced by a MUTABLE tag. The tag can
#     point at different content tomorrow - or at an attacker's image.
image: myapp:latest
image: node:20
image: somevendor/framework:1.2.3        # tags are mutable

# (c) A pipeline that trusts whatever a job downloads.
- run: curl -o tool https://get.example.com/install.sh && sh install.sh

# (d) A webhook with no signature verification.
app.post("/webhooks/payment", async (req, res) => {
  await Order.updateOne({ _id: req.body.orderId }, { paid: true });   // anyone can post
});

# (e) Deserialising data whose integrity nobody verified.
ObjectInputStream(stream).readObject();`,
      walkthrough: [
        "(a) TLS proves the server's identity, not the content's integrity, and piping a download straight into a shell removes any chance to review it.",
        "(b) Tags are mutable labels. Pin the digest, not the tag.",
        "(c) Same problem inside CI, where a compromised step reaches the build output.",
        "(d) A webhook with no HMAC signature check means anyone who knows the URL can mark orders paid.",
        "(e) Data integrity and deserialisation are the same family: unverifiable bytes should not become executable objects."
      ]
    },
    secureCode: {
      language: "yaml",
      filename: "verified pipeline - SAFE",
      code: `# 1) Pin the DIGEST, not the tag. The digest is the content hash.
image: myapp@sha256:1f0b3c...c9d2
image: node:20@sha256:8a4e...71b0

# 2) Verify signatures on anything you download.
- name: Verify installer
  run: |
    curl -fsSLO https://get.example.com/install.sh
    curl -fsSLO https://get.example.com/install.sh.sig
    curl -fsSLO https://get.example.com/install.sh.sig.asc
    # 3) Verify against a key in your organisation's trust store,
    #    NOT a key downloaded from the same place as the file.
    gpg --verify install.sh.sig.asc install.sh
    sha256sum -c install.sh.sha256
    sh install.sh

# 4) Build provenance: sign what you build, not just what you consume.
- run: |
    cosign sign --key cosign.key $IMAGE_DIGEST
    cosign attest --predicate provenance.json $IMAGE_DIGEST

# 5) Webhook: verify the signature over the RAW body, in constant time.
app.post("/webhooks/payment", async (req, res) => {
  const raw = req.rawBody;                  // unparsed bytes
  const sig = req.get("x-signature");
  const expected = hmac(WEBHOOK_SECRET, raw);
  if (!timingSafeEqual(String(sig || ""), expected)) {
    return res.status(401).json({ error: "Bad signature" });
  }
  await applyPaymentEvent(JSON.parse(raw));
  res.status(200).json({ received: true });
});

# 6) Lock and verify your own dependencies.
npm ci
npm audit --omit=dev --audit-level=high`,
      explanation:
        "Integrity means two things: the artifact is authentic (signed by someone you trust, verified against a key you already had) and it is unmodified (a hash of the exact bytes you expected). Digest pinning gives you the second for containers; signature verification gives you the first. Neither is much work; both are impossible to retrofit after an incident."
    },
    prevention: [
      "Pin dependencies, container images and actions by digest, not by a mutable tag.",
      "Verify signatures on downloaded artifacts using a key already in your trust store.",
      "Never pipe a download straight into a shell; download, verify, review, then run.",
      "Sign your own build outputs and generate provenance attestations.",
      "Verify webhook signatures over the raw request body, and compare in constant time.",
      "Sign session cookies, tokens and any data that crosses a trust boundary with integrity in mind.",
      "Protect the pipeline itself: pin actions, require review, use short-lived credentials, separate build from deploy.",
      "Keep an inventory of what runs in production, so a tampered component can be identified.",
      "Adopt an SBOM so you can answer 'are we affected?' quickly after an advisory."
    ],
    securePractices: [
      "Ask for every download: who signed this, and where did I get the key from?",
      "Digest pinning is cheap and removes a whole class of supply-chain substitution.",
      "Treat the build pipeline as production infrastructure with production protection.",
      "Keep short-lived, least-privilege credentials in CI; long-lived tokens are the favourite target.",
      "Have a rehearsed answer for 'how quickly can we list everything affected by this advisory?' - that is what an SBOM is for."
    ],
    furtherReading: [
      "OWASP Software and Data Integrity Failures",
      "OWASP Supply Chain Cheat Sheet",
      "SLSA framework for build provenance",
      "Sigstore / cosign documentation"
    ],
    quiz: [
      {
        question: "Why is installing from a mutable tag such as 'latest' risky?",
        options: [
          "It downloads more slowly",
          "The same reference can resolve to different content later, including an attacker's build",
          "Tags cannot be used with HTTPS",
          "It prevents caching"
        ],
        correctIndex: 1,
        explanation:
          "A tag is a label, not an identity. Pinning the digest pins the exact content you reviewed."
      },
      {
        question: "What does a signature on a downloaded artifact prove?",
        options: [
          "That the file is free of malware",
          "That the artifact was produced by the holder of a specific key you already trust, and has not changed since",
          "That the download was fast",
          "That the vendor has tested it"
        ],
        correctIndex: 1,
        explanation:
          "A signature authenticates the producer and provides integrity. It does not prove quality, which is why you still review and scan."
      },
      {
        question: "Why verify a webhook signature against the RAW request body?",
        options: [
          "Raw bodies are smaller",
          "Parsing and re-serialising can change the bytes, so a signature over the parsed form will not match what was signed",
          "It is faster",
          "Because JSON signatures are insecure"
        ],
        correctIndex: 1,
        explanation:
          "Signatures are computed over exact bytes. Any reformatting - whitespace, key order, unicode escaping - changes them."
      }
    ],
    lab: {
      title: "Harden your own build and update path",
      type: "fix-the-code",
      task:
        "Find every place your project downloads or pulls something, and convert each to a verified, pinned, reviewable step.",
      steps: [
        "List every curl/wget, every container image reference, and every CI action used by tag.",
        "For each, note whether the source and the integrity are pinned.",
        "Replace one image tag with a digest, and one download with verify-then-run.",
        "For a webhook you own, add HMAC verification over the raw body."
      ],
      hint: "Include the base image of your Dockerfile and any action referenced as uses/owner/repo@v3.",
      solution:
        "Every unverified download is a place where trust is assumed. Pin container images and CI actions by digest, download to a file, verify a signature or a published checksum against a key you already hold, review the script, then run it. For webhooks, verify the HMAC over the raw bytes in constant time before parsing. Finally, sign your own build output and keep an SBOM, so 'what is affected?' has an answer.",
      isSafe: true,
      estimatedMinutes: 30
    }
  },

  /* ---------------------------------------------------------------- */
  "supply-chain": {
    title: "Software Supply Chain Failures",
    relatedConcepts: ["integrity-failures", "vulnerable-components", "vulnerable-design", "logging-monitoring"],
    simpleExplanation:
      "Software supply chain failures mean the harm came from something you trusted before you wrote any code. A dependency, a build system, a container base image, a CI action, a package registry account, or a developer machine was compromised - and the damage reaches every system that trusted it. This is a new category, A03, in the 2025 list: the risk moved from 'my code has a bug' to 'something in my supply chain was replaced'.",
    whyItHappens:
      "Modern software is assembled from hundreds of pieces, most of which no one on the team has read. Trust is granted transitively and automatically by a package manager. A single account compromise, a typosquatted package name, or an unmaintained maintainer account is enough to reach thousands of downstream projects at once.",
    howItWorks:
      "1. An attacker registers a package name similar to a popular one (typosquatting), or compromises a maintainer's publishing token. 2. They publish an update that looks version-compatible and contains malicious install scripts. 3. Your CI installs it during a normal build, before any code review of yours happens. 4. The build environment, the CI secrets and the artefacts are all exposed, and the malicious code is now inside your release.",
    safeExample:
      "It is a factory that assembles your product from 800 components, of which you have inspected three. A fault in one component - a contaminated batch - reaches every product on the assembly line. The controls are the same as in food safety: approved suppliers, certificates of analysis, traceability, and a recall plan. The 2025 category is the software industry's version of that lesson.",
    impact: [
      "Compromise of every build and every customer who installs your product.",
      "Access to CI/CD secrets, signing keys and release credentials.",
      "Backdoors that survive review because they arrive as 'just another dependency'.",
      "Long recovery: you must rebuild, re-sign and re-release everything from known-good sources."
    ],
    typicalSeverity: "critical",
    vulnerableCode: {
      language: "javascript",
      filename: "supply chain weak points - IN SAFE",
      code: `// (a) Install scripts run automatically, with full build access.
{
  "dependencies": { "some-package": "^2.1.0" }
}
// package.json of some-package may contain:
//   "scripts": { "postinstall": "node ./setup.js" }
// Those scripts run with your CI's credentials and network access.

// (b) A GitHub Action referenced by a MUTABLE tag
- uses: some-org/setup-node@v3        // v3 can point anywhere, any time

// (c) Install from an arbitrary branch or a fork
$ npm install github:contributor/fix-urgent --save

// (d) A wildcard range resolves to whatever is newest
"dependencies": { "critical-lib": "*" }

// (e) No provenance, no inventory, no verification step
$ docker pull myapp:latest && docker push myapp:latest

// (f) Long-lived CI credentials with write access to everything
- uses: some-org/deploy-action
  with:
    registry_token: \${{ secrets.DOCKER_TOKEN }}   // valid for a year`,
      walkthrough: [
        "(a) postinstall scripts run automatically during install, before your tests or review, with the build's credentials.",
        "(b) Mutable action tags mean a compromised or transferred repository changes what your build runs.",
        "(c) Installing from a personal fork is unreviewed code with production access.",
        "(d) A wildcard range means a new version can appear under a familiar name.",
        "(f) Long-lived, broad tokens are the prize an attacker is aiming for."
      ]
    },
    secureCode: {
      language: "yaml",
      filename: "hardened supply chain - SAFE",
      code: `# 1) Pin EVERYTHING to an immutable reference.
- uses: some-org/setup-node@8a4e7b1c...        # full commit SHA, not @v3
image: myapp@sha256:1f0b3c...c9d2

# 2) Avoid install scripts where possible; if a package needs one,
#    install it in an isolated step and inspect what it did.
npm ci --ignore-scripts
npm rebuild --foreground-scripts        # so postinstall output is visible

# 3) Restrict what a build can do, so a compromised step is contained.
permissions:
  contents: read          # default: nothing to write
jobs:
  build:
    steps:
      - run: npm ci
      - run: npm test
      - uses: some-org/publish@1a2b3c4d...    # separate job, needs write
        with:
          token: \${{ secrets.PUBLISH_TOKEN }}   # SHORT-LIVED, scoped

# 4) Verify provenance of what you consume and produce.
cosign verify --key cosign.pub nodejs/container@sha256:...
cosign sign --key cosign.key $MY_IMAGE_DIGEST
syft packages myapp -o cyclonedx-json > sbom.json    # 5) SBOM for fast impact queries

# 6) Monitor for new advisories continuously, not once.
- run: osv-scanner --lockfile package-lock.json
- uses: osv-scanner-action/osv-scanner-action@1b2c3d4...

# 7) Dependabot/Renovate for routine, small updates.
# 8) A rehearsed response plan: who revokes, who rebuilds, who
#    notifies, and how customers are told.`,
      explanation:
        "Supply chain security is mostly about reducing trust and increasing verifiability: pin immutable references, isolate and minimise what each step can do, verify signatures and provenance, keep an SBOM so an advisory can be answered in minutes, and rehearse the response. The isolation in (3) is what limits the blast radius when a step is compromised."
    },
    prevention: [
      "Pin every external reference to an immutable digest or commit SHA - packages, images, actions, toolchains.",
      "Understand and minimise install scripts; run them in an isolated, network-restricted step.",
      "Apply least privilege to CI: read-only by default, write scopes only where needed, short-lived credentials.",
      "Separate build from publish, and require review between the two.",
      "Verify signatures and provenance of consumed and produced artifacts; generate an SBOM.",
      "Maintain an inventory of every dependency, including transitive ones, and monitor advisories continuously.",
      "Use short-lived, scoped tokens rather than long-lived broad credentials in pipelines.",
      "Prefer well-maintained packages with multiple maintainers, clear ownership and a published security policy.",
      "Have a rehearsed incident plan: revoke, rebuild from known-good sources, rotate every secret the pipeline could reach, and notify users.",
      "Apply the same controls to your developers' machines, since a laptop is part of the supply chain."
    ],
    securePractices: [
      "Think of every dependency as code written by a stranger who runs first.",
      "Ask of each new dependency: who maintains it, how many, what does its install script do, and how would we remove it?",
      "Keep the tree small; every package is a company you now depend on.",
      "Automate the routine work (updates, scanning, SBOM generation) and rehearse the emergency work.",
      "Treat signing keys and CI credentials as crown jewels: short-lived, scoped, and rotated."
    ],
    furtherReading: [
      "OWASP Software Supply Chain Failures (2025 Top 10)",
      "SLSA framework",
      "Sigstore, cosign and in-toto documentation",
      "OpenSSF Scorecard and Securing the Software Supply Chain guidance",
      "NIST SP 800-218 Secure Software Development Framework"
    ],
    quiz: [
      {
        question: "Why can a single compromised dependency be so damaging?",
        options: [
          "It makes installs slower",
          "It runs automatically during install or build with access to your CI credentials and artefacts, and it reaches every downstream user of your product",
          "It only affects the CLI",
          "It cannot run scripts"
        ],
        correctIndex: 1,
        explanation:
          "Supply chain risk is amplified by automatic execution and transitive trust. One bad package reaches every install of your software."
      },
      {
        question: "What is the main benefit of pinning to a digest?",
        options: [
          "Faster pulls",
          "The reference cannot be repointed, so the exact content you reviewed is what runs",
          "It signs the image automatically",
          "It reduces the image size"
        ],
        correctIndex: 1,
        explanation:
          "A digest is the content's identity. Pinning it removes the mutable-label attack entirely."
      },
      {
        question: "Why is an SBOM valuable?",
        options: [
          "It makes builds faster",
          "It lets you answer 'which of our releases contain this affected component?' in minutes rather than weeks",
          "It replaces code review",
          "It proves code is vulnerability-free"
        ],
        correctIndex: 1,
        explanation:
          "An SBOM turns an incident from an inventory exercise into a query. It does not prove anything is safe; it tells you what you have."
      },
      {
        question: "Which CI practice most reduces the blast radius of a compromised step?",
        options: [
          "Use a single powerful job with all secrets",
          "Least-privilege permissions per job, short-lived credentials, and separate build from publish",
          "Run the pipeline more often",
          "Disable pull request checks"
        ],
        correctIndex: 1,
        explanation:
          "Containment is the point: a compromised build step should not hold credentials that can deploy or publish."
      }
    ],
    lab: {
      title: "Assess your own project's supply chain",
      type: "design-review",
      task:
        "Produce a one-page supply chain assessment for a project you control, and fix the two highest risks.",
      steps: [
        "Inventory: direct dependencies, transitive count, base images, CI actions, and any install scripts.",
        "For each external reference, record whether it is pinned to an immutable digest or SHA.",
        "List the credentials available to the build and publish jobs, and their scope and lifetime.",
        "Fix the two highest risks, then write the incident response steps you would run if a component were compromised tomorrow."
      ],
      hint: "Look for @v1, @v3, :latest and github:user/repo references - those are the mutable ones.",
      solution:
        "You will usually find a mix of mutable action tags, a floating base image tag, wildcard dependency ranges, a postinstall script nobody has read, and one long-lived token that can deploy. Fixing the top two - pinning the build references and scoping the deploy credential - removes most of the exposure. Then the response plan matters: revoke the token, rebuild from known-good commits, rotate anything the pipeline touched, use the SBOM to find affected releases, and notify users quickly.",
      isSafe: true,
      estimatedMinutes: 30
    }
  },

  /* ---------------------------------------------------------------- */
  "exceptional-conditions": {
    title: "Mishandling of Exceptional Conditions",
    relatedConcepts: ["improper-error-handling", "logging-monitoring", "security-misconfiguration", "integrity-failures"],
    simpleExplanation:
      "A new category in 2025, A10. It is about what happens when something does not go as planned: an error handler that keeps running with half-loaded state, a check that fails open, a service that silently degrades, a retry that repeats a side effect, or a system that stays in a broken state and nobody notices. Most security controls live on the error path, which is exactly where testing is weakest.",
    whyItHappens:
      "The happy path gets the tests and the attention. Exception handling is added under time pressure, often with a broad catch that continues as if nothing happened. Availability failures get special treatment - the system is designed to keep serving, sometimes by skipping the very checks that protect it. That instinct is understandable and is also how breaches happen.",
    howItWorks:
      "1. A permission service is unavailable during an outage. 2. The application is written to 'fail open' so users can still work. 3. For two hours, every protected action is allowed without a permission check. 4. A batch job also fails partway and retries, applying a refund three times. 5. Nothing alerts, because errors are being handled - they are just not being noticed.",
    safeExample:
      "It is a vault whose lock is connected to the electricity. When the power fails, a design decision says 'open the door so staff can get in'. That decision is reasonable for availability and catastrophic for security. The safe design keeps a mechanical lock that engages when power is lost - fail closed for valuables, fail open for convenience, chosen deliberately for each specific door rather than as a global default.",
    impact: [
      "Security controls silently disabled exactly when the system is under stress, which is when an attacker also tries.",
      "Duplicate or skipped side effects from retries: double charges, double refunds, repeated emails.",
      "Partial state that later produces wrong decisions, with no clear point of origin.",
      "Silent corruption, because 'handled' errors never reach the alerting pipeline."
    ],
    typicalSeverity: "high",
    vulnerableCode: {
      language: "javascript",
      filename: "failing unsafely - IN SAFE",
      code: `// (a) FAIL OPEN: a permission service outage disables the control.
let allowed = true;
try {
  allowed = await permissions.check(user, action);
} catch (err) {
  allowed = true;                     // DANGEROUS default
}

// (b) Continue with half-initialised state.
const config = await loadConfig();
try {
  startWorkers(config);                // throws on bad config
} catch (err) {
  // swallowed - some workers are running, some are not, and the
  // system is now in a state nobody has defined
}

// (c) A retry that repeats a side effect.
for (let i = 0; i < 5; i++) {
  try {
    await charge(order);               // charged, then the response is lost
    break;
  } catch (err) {
    await sleep(1000 * i);             // charges again on the next try
  }
}

// (d) Partial failure across systems with no compensation.
await debit(user);
await reserveStock(items);
await chargeCard(total);               // stock reserved, card never charged

// (e) A default that quietly changes behaviour.
const TIMEOUT = process.env.REQUEST_TIMEOUT_MS ?? 30000;   // fine
// but a failed DNS lookup falls back to an infinite wait somewhere else`,
      walkthrough: [
        "(a) Failing open turns an availability incident into a security incident. The default for a security decision must be deny.",
        "(b) Partial initialisation is a system state nobody designed or tested, so its behaviour is undefined.",
        "(c) A retry is only safe if the operation is idempotent, or carries an idempotency key.",
        "(d) Cross-system work needs a saga with compensating actions, because there is no single transaction.",
        "(e) Fallback defaults that differ between environments turn an outage into an incident nobody can reproduce."
      ]
    },
    secureCode: {
      language: "javascript",
      filename: "failing safely - SAFE",
      code: `// 1) Fail CLOSED on security decisions. If you need availability,
//    scope the exception explicitly and loudly - never globally.
async function authorize(user, action) {
  try {
    return await permissions.check(user, action);
  } catch (err) {
    metrics.increment("authz.check_failed", { action });
    logger.error({ msg: "permission service unavailable", action, userId: user.id });
    // 2) Explicit, logged, alerted degradation - not a silent default.
    if (FEATURE_FLAGS.authzFailOpen === true) {   // narrow and monitored
      metrics.increment("authz.degraded");
      alertOnce("authz-degraded");                  // make it visible
      return false;
    }
    return false;                                    // the safe default
  }
}

// 3) Make retries safe: idempotency keys, and a bounded, jittered
//    backoff that stops rather than hammering a struggling service.
async function chargeWithRetry(order) {
  const key = "charge:" + order.id;                  // same key on every attempt
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await chargeCard(order.total, { idempotencyKey: key });
    } catch (err) {
      if (!isRetryable(err) || attempt === 2) throw err;
      await sleep(Math.random() * 250 * 2 ** attempt);   // jitter
    }
  }
}

// 4) Sagas with compensation for cross-system work.
const saga = new Saga();
saga.step("debit",   () => debit(user),   () => credit(user));    // undo
saga.step("reserve", () => reserve(items), () => release(items));  // undo
saga.step("charge",  () => charge(order));
await saga.run();

// 5) Make partial states EXPLICIT and self-healing.
await db.updateOne({ _id: id }, { $set: { state: "starting" } });
try {
  await startWorkers(config);
  await db.updateOne({ _id: id }, { $set: { state: "ready" } });
} catch (err) {
  await stopWorkers();                                  // clean up first
  await db.updateOne({ _id: id }, { $set: { state: "failed", error: err.code } });
  throw err;                                            // and let the operator know
}

// 6) Every exceptional path is LOGGED and ALERTED - being "handled"
//    is not the same as being noticed.`,
      explanation:
        "The discipline is to choose, per decision, whether to fail open or closed - and to never do it by accident. Security decisions fail closed; convenience features may fail open but only behind an explicit, logged and alerted flag. Then make the retry and partial-failure behaviour safe with idempotency keys and compensation, and make sure every exceptional path produces a log entry and an alert, because handled and noticed are different things."
    },
    prevention: [
      "Fail closed on every authorisation, authentication and validation decision.",
      "Choose fail-open behaviour only per feature, behind a flag, with metrics and an alert attached.",
      "Make all retried operations idempotent, using idempotency keys where the provider supports them.",
      "Use a saga with compensating actions for work spanning multiple systems, since no distributed transaction exists.",
      "Define and record explicit lifecycle states, so a half-initialised component is detectable and recoverable.",
      "Clean up on failure: stop what you started before reporting the failure.",
      "Log and alert on every exceptional path, and alert on error-rate changes rather than on individual errors.",
      "Add bounded, jittered retries with a circuit breaker, so a struggling dependency is not hammered.",
      "Test the failure paths deliberately: kill the dependency, cut the network, fill the disk, expire the certificate.",
      "Record the chosen behaviour in the design, so 'why does this fail open?' has a documented answer."
    ],
    securePractices: [
      "Write 'what happens when this dependency is down?' for every external call.",
      "Prefer a clean, fast failure over a slow, confusing one - a timeout with a clear error beats a hang.",
      "Test availability failures as deliberately as you test security ones; they arrive at the worst time.",
      "Make the degraded mode visible on a dashboard. Degradation you cannot see is an outage you cannot explain.",
      "Review fail-open decisions in code review, one by one, and require an explicit justification."
    ],
    furtherReading: [
      "OWASP Mishandling of Exceptional Conditions (2025 Top 10)",
      "Pattern: Circuit Breaker, Retry with Backoff and Jitter",
      "Saga pattern for distributed transactions"
    ],
    quiz: [
      {
        question: "A dependency that checks permissions is unavailable. What is the safe default?",
        options: [
          "Allow the action, so users are not blocked",
          "Deny the action, log it, and alert - fail closed",
          "Allow it silently for cached users only",
          "Crash the whole application"
        ],
        correctIndex: 1,
        explanation:
          "A security decision must fail closed. If availability genuinely requires otherwise, scope it to one feature, measure it, and alert loudly."
      },
      {
        question: "Why is a retry unsafe for a payment?",
        options: [
          "Retries are slow",
          "Because the first attempt may have succeeded while its response was lost, so retrying charges twice",
          "Because servers forbid it",
          "Because it uses more memory"
        ],
        correctIndex: 1,
        explanation:
          "Network failures are ambiguous. An idempotency key makes a repeated request safe by telling the provider you already have it."
      },
      {
        question: "What is the difference between an error being handled and an error being noticed?",
        options: [
          "No difference",
          "Handled means code continued; noticed means a log entry and an alert reached someone. Being handled is not evidence that anyone knows",
          "Noticed means it was printed to the console",
          "Handled implies a 500 response"
        ],
        correctIndex: 1,
        explanation:
          "This is the core lesson of the category: silent degradation is the danger. Every exceptional path needs a signal that reaches a human."
      },
      {
        question: "How should you handle work that spans a payment and an inventory system?",
        options: [
          "A single database transaction across both",
          "A saga with compensating actions, because there is no distributed transaction",
          "Retrying until it works",
          "Ignoring failures and reconciling manually later"
        ],
        correctIndex: 1,
        explanation:
          "Once work crosses system boundaries you need explicit compensation. That is why idempotency keys and undo steps matter."
      }
    ],
    lab: {
      title: "Design the failure behaviour of one flow",
      type: "design-review",
      task:
        "Pick a multi-step flow in a project you control - registration, checkout, or upload - and write down exactly what happens at each failure point.",
      steps: [
        "List the steps in order and mark which ones have side effects.",
        "For each step, write the failure behaviour: fail open or closed, retry or abort, what state remains.",
        "Identify the places a partial state can be left behind, and add compensation or an explicit state machine.",
        "Test one failure locally by making a dependency fail, and confirm you get a log entry and an alert."
      ],
      hint: "Ask of each step: 'if the next line never runs, is the system still in a state I designed?'",
      solution:
        "For each step, decide explicitly: security checks fail closed, business steps abort with a clear error, retried operations carry an idempotency key, and cross-system work uses a saga with compensating actions. Then record explicit states so a half-initialised component is visible, clean up before reporting failure, and make sure every exceptional path logs and alerts. Finally, break a dependency on purpose in your local environment - that test is what proves the behaviour, and it is exactly what production will do at 3am.",
      isSafe: true,
      estimatedMinutes: 30
    }
  },
};

module.exports = dataFamilyProfiles;
