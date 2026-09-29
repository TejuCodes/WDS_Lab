/**
 * ============================================================
 * MODULE FAMILY: IDENTITY & ACCESS
 * ------------------------------------------------------------
 * The same schema as ./injection.js. Read the header comment
 * there first: every key is documented once, in that file.
 *
 * What is specific to this family:
 *
 *  - `refs` leans on NIST SP 800-63B / 800-63C and on the OAuth
 *    and JWT RFCs, because the interesting questions here (how
 *    long may a session live, what makes a redirect_uri safe,
 *    which algorithm may a token ask for) are answered by
 *    standards rather than by the Top 10.
 *
 *  - Only four of the five modules link into the OWASP history.
 *    OAuth and OIDC misconfiguration is deliberately left without
 *    owaspConceptKey / owaspYear / owaspId: it is not an OWASP
 *    Top 10 category, and pretending otherwise would be a worse
 *    teaching error than the missing link.
 *
 * SAFETY: no exploit here targets anything real. The payloads
 * are illustrative strings of the kind a textbook prints, and
 * every lab in this project runs on localhost against data that
 * was made up for it.
 * ============================================================ */

export const identityModules = [
  /* ==========================================================
     1. IDOR / BOLA
     ========================================================== */
  {
    key: "idor",
    title: "IDOR & Broken Object-Level Authorization",
    family: "identity",
    icon: "FaFolderOpen",
    severity: "critical",
    tagline: "The server proves who you are, then serves the object you asked for without asking whether it is yours.",
    refs: [
      { src: "OWASP Top 10 2010", id: "A4 Insecure Direct Object References" },
      { src: "OWASP Top 10 2021", id: "A01 Broken Access Control" },
      { src: "CWE", id: "CWE-639" },
      { src: "CWE", id: "CWE-862" },
      { src: "MITRE ATT&CK", id: "T1190 Exploit Public-Facing Application" },
    ],
    cwe: { id: "CWE-639", name: "Authorization Bypass Through User-Controlled Key" },
    owaspConceptKey: "idor",
    owaspYear: 2010,
    owaspId: "A4",

    explain: {
      what:
        "An object reference - a document id, an order number, a user id - arrives from the client and is used to load the object. The route usually sits behind a login, so the request really is authenticated, and that authentication is the only thing that gets checked. What nobody asks is the second question: may this authenticated user act on this particular record. That missing question is object-level authorization, and CWE-639 names its characteristic shape, a key the user controls selecting a record the user does not own.",
      how:
        "The mechanics are dull, which is why the bug survives. A handler takes the id from the path or the query string, runs something like SELECT * FROM invoices WHERE id = ?, and returns the row it finds. Sequential integers are the giveaway: if invoice 41 is yours, then asking for 42, 43 and 44 is enumeration rather than intrusion, and the attacker never leaves their own account. Horizontal escalation reads another user's objects with an ordinary account; vertical escalation does the same thing with a role, where a normal user calls an endpoint that only administrators are meant to reach. The fix is not to hide the route, it is to make ownership part of the lookup - WHERE id = ? AND owner_id = ? - so that the other person's row simply is not in the result set. In GraphQL the same mistake is easier to make, because the client chooses which fields it wants back and each resolver has to enforce access per field and per argument rather than once per route.",
      impact: [
        "Read another user's invoices, addresses, uploaded documents or medical details using an account of your own.",
        "Change or delete objects you do not own whenever the same handler serves the write path.",
        "Vertical escalation: a normal account reaches administrative endpoints and whatever data sits behind them.",
        "One missing check exposes every object of that type, so a single endpoint is often the whole attack surface.",
      ],
      prevent: [
        "Authorise against the object, not just the route: load the row, then compare its owner field to the session's user id.",
        "Push the ownership test into the query itself, so a record that is not yours is indistinguishable from one that does not exist.",
        "Use unpredictable identifiers such as UUIDs as defence in depth, never as the authorisation - a leaked id should not be a working key.",
        "Centralise the check in middleware or a data-access layer, so a new endpoint inherits it by default instead of by memory.",
        "Test deny-by-default: for every endpoint, assert that user A receives 404 for an object belonging to user B.",
      ],
    },

    history: [
      {
        year: 2003,
        title: "Access control is a category from the first list",
        text: "\"Broken Access Control\" appears at A2 in the inaugural OWASP Top 10 and stays on every edition since. In that first list the idea is framed around pages and URLs: a user who should not reach a page reaches it anyway. The finer distinction between which function a role may call and which record that function may return has not been drawn yet, and both live in the same entry.",
      },
      {
        year: 2010,
        title: "The concrete weakness gets its own name",
        text: "\"Insecure Direct Object References\" is promoted to a named entry at A4, with CWE references behind it. This is the year the abbreviation IDOR enters professional vocabulary, replacing a phrase that had been circulating informally for years. The framing shifts from hiding pages to checking objects, and the name is a genuinely better description of the mistake.",
      },
      {
        year: 2012,
        title: "OAuth puts the scope in the token",
        text: "RFC 6749 gives the authorisation question a formal vocabulary: a scope is what the client may ask for, and the access token carries the grant. The lesson transfers to ordinary web applications. Authorisation is a value that has to be carried with the request and compared against a server-side record, not an assumption about who happens to be calling.",
      },
      {
        year: 2013,
        title: "The list splits access control in two",
        text: "The 2013 edition keeps \"Insecure Direct Object References\" at A4 and adds \"Missing Function Level Access Control\" at A7. The split is the useful part: one entry is about which functions a role may call, the other is about which records those functions may return. Both are broken access control, and confusing them is why role checks get written on routes and owner checks get left out of queries.",
      },
      {
        year: 2017,
        title: "Folded into A5, and renamed in the API list",
        text: "The 2017 web list has a single \"Broken Access Control\" at A5 covering both halves, while the API Security Top 10 gives the object-level case its own name, Broken Object Level Authorization, usually shortened to BOLA. The web list merges and the API list separates, because an API is almost entirely object-level: there are no pages to hide, only records to return.",
      },
      {
        year: 2021,
        title: "A01, and the rank reflects the evidence",
        text: "Broken Access Control takes A01 in the 2021 edition, at the top of the list. The rank is empirical rather than theoretical: it is the most frequent class of finding in published bug bounty reports, and a large share of those are an authenticated user reading a record that belongs to somebody else. Nothing about the attack got cleverer; there are simply more APIs than there were.",
      },
      {
        year: 2025,
        title: "The check moved into the query",
        text: "A01 in the 2025 edition, and encryption of data at rest is no longer offered as a mitigation for it, because encryption never addressed the problem. What has changed is where the decision is expected to live: the object lookup itself carries the authorisation condition, and permissions are modelled per resource rather than as a role check on a handful of URLs. The mistake is exactly the one from 2003, written in a newer style of code.",
      },
    ],

    diagram: {
      caption: "A valid session is not an ownership check",
      nodes: [
        { text: "Attacker logs in with their own account", tone: "attacker" },
        { text: "GET /api/invoice?id=42 with a valid session", tone: "wire" },
        { text: "Handler loads the row WHERE id = 42", tone: "app" },
        { text: "Session is valid, so the route passes", tone: "app" },
        { text: "Nothing compares owner_id to the session user", tone: "danger" },
        { text: "Invoice 42 belongs to somebody else", tone: "data" },
        { text: "Response returns it to the attacker", tone: "danger" },
        { text: "Fix: look the row up by id AND owner_id", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 6 },
        { from: 2, to: 7, label: "the fix" },
      ],
    },

    puzzle: {
      type: "payload",
      title: "Payload Workshop: which id actually demonstrates the flaw",
      prompt: "Substitute a value for {slot}, then say which substitution really exercises the missing authorisation check.",
      base: "GET /api/invoice?id={slot} HTTP/1.1",
      slot: "id",
      options: [
        { text: "42", note: "The invoice this session owns. Nothing is demonstrated." },
        { text: "43", note: "The neighbouring invoice - a record this account did not create." },
        { text: "9f31c0de", note: "A long random-looking id. The id format alone proves nothing." },
        { text: "../admin/flags", note: "A path shape, not an id. It would be rejected or coerced before any query runs." },
      ],
      answer: 1,
      why: {
        "0": "This is the value the account is entitled to. The request succeeds, the owner check passes, and nothing has been shown. A demonstration needs a record the attacker may not have.",
        "1": "This is the demonstration. The handler loads the row by id alone, so a neighbouring integer returns a document belonging to a different user - horizontal escalation, performed without leaving the attacker's own session.",
        "2": "A long value looks more secure but is not. Unless the owner is checked, any id that resolves to a row returns that row, and a well-formed random id that belongs to someone else fails in exactly the same way a predictable one does. Obfuscation is not authorisation.",
        "3": "This is a different bug. Whether a slashes-and-dots value reaches the query depends on the driver and the storage layer, and the interesting question there is input handling, not object-level access. Even if it resolved, the authorisation check would still be missing.",
      },
      check: {
        prompt: "Will replacing the sequential id with a UUID stop this?",
        answer: false,
        why: "A UUID makes guessing impractical, which is worth having, but it does not make the request legitimate. The id is still a user-controlled key, and any single leak of a real one - a page that renders it, a log line, a Referer header, a support screenshot - reopens the hole completely. The control that closes it is the comparison against the owner.",
      },
    },
  },

  /* ==========================================================
     2. BROKEN AUTHENTICATION
     ========================================================== */
  {
    key: "broken-auth",
    title: "Broken Authentication",
    family: "identity",
    icon: "FaUserLock",
    severity: "critical",
    tagline: "Authentication is a lifecycle, and the parts outside the login form are where it usually fails.",
    refs: [
      { src: "OWASP Top 10 2021", id: "A07 Identification and Authentication Failures" },
      { src: "OWASP Top 10 2017", id: "A2 Broken Authentication" },
      { src: "CWE", id: "CWE-287" },
      { src: "CWE", id: "CWE-307" },
      { src: "CWE", id: "CWE-640" },
      { src: "MITRE ATT&CK", id: "T1110 Brute Force" },
      { src: "MITRE ATT&CK", id: "T1078 Valid Accounts" },
      { src: "NIST", id: "SP 800-63B Digital Identity Guidelines" },
    ],
    cwe: { id: "CWE-287", name: "Improper Authentication" },
    owaspConceptKey: "broken-authentication",
    owaspYear: 2017,
    owaspId: "A2",

    explain: {
      what:
        "Authentication is a lifecycle, not a form. It starts with identification, runs through credential verification, a second factor, session creation, password recovery and email change, and ends at logout or expiry. The login page is the part developers test; the rest is where the failures live, in predictable reset tokens, response differences that reveal which accounts exist, missing rate limits, and sessions handed out before the second factor has been checked.",
      how:
        "A credential-stuffing run does not guess, it replays: a list of email and password pairs gathered from earlier breaches is posted at the login endpoint, and every pair that still works belongs to a real person. Two small things make that cheap. The first is no rate limiting, so the attacker gets unlimited attempts per account and per source address, which is what turns T1110 from an inconvenience into an operation. The second is user enumeration, where a different message, a different status code, or simply a faster response when the account does not exist turns the login form into a list of valid usernames - the difference is visible in the response body, and it is also measurable in the response time, because a missing user never runs a password hash comparison. Recovery is the other half of the story: a reset token that is short, derived from a timestamp, valid for a day or not invalidated after use turns password reset into account takeover. And on the login path itself, issuing a session before the second factor is verified produces a session that is not yet tied to a fully authenticated principal, which becomes a fixation target the moment its identifier is not rotated at that instant.",
      impact: [
        "An attacker signs in as a real user using a password pair from an unrelated breach, with no technical skill required at all.",
        "Password reset becomes account takeover when the token is guessable, long-lived, or still valid after it has been used.",
        "The login endpoint can be turned into a username oracle, which supplies targets for the next round of attempts and for phishing.",
        "A second factor can be spammed at the user until they approve it, or skipped entirely by a flow that treats the password step as the whole login.",
      ],
      prevent: [
        "Rate-limit per account and per source, and count failures rather than successes when deciding to block.",
        "Return one response, one status code and comparable work on every attempt, whether or not the account exists.",
        "Generate reset and verification tokens from a cryptographically secure random source, make each one single-use, and expire it quickly.",
        "Create the session only after every factor has passed, and issue a new session identifier at that moment.",
        "Prefer phishing-resistant second factors, and let a user decline a push prompt instead of demanding an approval.",
      ],
    },

    history: [
      {
        year: 2003,
        title: "Broken Account and Session Management",
        text: "The first OWASP Top 10 carries the idea at A3, under a name that treats account handling and sessions as one thing. That grouping was accurate for the era: the same sloppy code produced both problems, and the list had not yet separated the identity question from the token question. The entry is a category of weak defaults rather than a list of specific mistakes.",
      },
      {
        year: 2004,
        title: "Renamed to say authentication explicitly",
        text: "The 2004 edition renames it \"Broken Authentication and Session Management\". The change of wording is small but it splits the category into its two halves in the reader's mind, and it is also the point at which the list starts naming the lifecycle rather than the screen. Password storage, transport and lockout policy all sit inside this entry from here on.",
      },
      {
        year: 2010,
        title: "Moves up to A3",
        text: "The category climbs from A7 to A3, and the 2010 edition adds a sibling at A4 for the failure to restrict URL access. Together the two entries describe an application that authenticates well and authorises badly, which turned out to be the more common shape of the problem. Authentication and session management stayed together because an attacker who has a session has already skipped the hardest part.",
      },
      {
        year: 2013,
        title: "Rank 2",
        text: "\"Broken Authentication and Session Management\" sits at A2 in the 2013 edition, the slot injection vacated two years earlier. The description in this edition leans on credential reuse and weak password policies as much as on code defects, which is a sign that the centre of gravity had moved from implementation mistakes to the state of users' passwords.",
      },
      {
        year: 2017,
        title: "Shortened to Broken Authentication",
        text: "The 2017 edition shortens the name to \"Broken Authentication\" at A2, with session management folded in rather than dropped. Session Fixation, Insufficient Session Expiration and the cookie flags all remain inside the entry, which is why this family still treats them as one continuous discipline rather than two.",
      },
      {
        year: 2017,
        title: "The same year, the requirements are written down",
        text: "NIST SP 800-63B, the Digital Identity Guidelines, gives verifiers a requirement-level answer to questions the Top 10 only states as risks: how long a session may live, what makes a password acceptable, how a recovery flow has to work, and what an authenticator must prove. The practical effect on teams is that \"broken authentication\" stops being a mood and becomes a checklist that can be tested against.",
      },
      {
        year: 2021,
        title: "Identification and Authentication Failures",
        text: "The 2021 edition widens the name to \"Identification and Authentication Failures\" at A07. The added word matters: proving who you are and protecting the session that proves it are described as one problem, because a correct login that hands out a durable, fixable or non-expiring token is a failure of authentication even though nothing about the password check was wrong.",
      },
      {
        year: 2025,
        title: "Authentication Failures, and where the work went",
        text: "The 2025 edition shortens the name again, to \"Authentication Failures\" at A07, and the category is still ranked seventh. The interesting change is not the name but the practice around it: automated guessing is now the default first move against a login form, the defences that answer it are standard (throttling, MFA, breached-password checks, phishing-resistant factors), and the remaining human judgement goes into the recovery and enrolment flows, which are where most of the real findings still are.",
      },
    ],

    diagram: {
      caption: "Two responses that should have been identical",
      nodes: [
        { text: "Attacker posts a breach-derived list of credentials", tone: "attacker" },
        { text: "No throttling: thousands of attempts, all allowed", tone: "wire" },
        { text: "Unknown account: 404 and an instant reply", tone: "app" },
        { text: "Known account: 401 and a slower hash comparison", tone: "app" },
        { text: "The difference is a list of valid usernames", tone: "danger" },
        { text: "That list is replayed until a pair works", tone: "danger" },
        { text: "Fix: one response, one timing, throttled attempts", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 1, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which lines are the vulnerability?",
      prompt: "This login handler works. Three of its lines still give an attacker something they should not have.",
      language: "javascript",
      lines: [
        { text: "app.post('/login', rateLimit({ max: 10 }), async (req, res) => {" },
        { text: "  const user = await findByEmail(req.body.email);" },
        { text: "  if (!user) return res.status(404).json({ error: 'no such account' });", vulnerable: true },
        { text: "  const ok = await verifyPassword(req.body.password, user.passwordHash);" },
        { text: "  if (!ok) return res.status(401).json({ error: 'bad password' });", vulnerable: true },
        { text: "  await startSession(req, res, { id: user.id, mfaVerified: false });", vulnerable: true },
      ],
      explain:
        "Lines 3 and 5 give the endpoint away: one status code and one message for an unknown account, another for a wrong password, so the form is an account oracle. Line 3 is also faster, because returning early skips the hash comparison on line 4, and that timing gap is measurable. Line 6 creates the session before the second factor has been checked, and does not rotate the session identifier, so a session that exists at that moment can be carried through the second step. Line 1 is the pattern most handlers get right and line 4 is the correct comparison against a stored hash; neither is the problem.",
    },
  },

  /* ==========================================================
     3. SESSION MANAGEMENT
     ========================================================== */
  {
    key: "session-management",
    title: "Session Management Flaws",
    family: "identity",
    icon: "FaIdCard",
    severity: "high",
    tagline: "The session token is the credential, so it has to be protected like a password.",
    refs: [
      { src: "OWASP Top 10 2017", id: "A3 Sensitive Data Exposure" },
      { src: "OWASP Top 10 2021", id: "A07 Identification and Authentication Failures" },
      { src: "CWE", id: "CWE-384" },
      { src: "CWE", id: "CWE-613" },
      { src: "CWE", id: "CWE-1004" },
      { src: "MITRE ATT&CK", id: "T1539 Steal Web Session Cookie" },
      { src: "NIST", id: "SP 800-63C Digital Identity Guidelines: Authentication and Authenticator Management" },
    ],
    cwe: { id: "CWE-384", name: "Session Fixation" },
    owaspConceptKey: "sensitive-data-exposure",
    owaspYear: 2017,
    owaspId: "A3",

    explain: {
      what:
        "A session token is a bearer credential. Anyone holding it is the user, and nothing else about the request is checked - no password, no device, no second factor. Once a login is complete, the token is the entire security boundary, which means it should be generated with the same care as a password and protected the same way, with the added difficulty that it travels on every request by design.",
      how:
        "The first property is entropy. A session identifier must come from a cryptographically secure random source and be long enough that it cannot be enumerated; a counter, a timestamp, or a hash of the username is guessable by anyone who can time one login. The second is rotation: the identifier must be regenerated whenever the privilege level changes, especially at login, so that a value the attacker planted beforehand is worthless. The third is expiry, and there are two of them - an idle timeout for the case where a user simply walks away from an open machine, and an absolute lifetime for the case where a token is stolen and then used carefully for a week. The fourth is revocation: logout has to delete the record on the server, because clearing a cookie only removes the copy in one browser while every copy taken beforehand keeps working. Cookie attributes decide who else can read or move the token: HttpOnly removes it from JavaScript, Secure stops it travelling in clear text, and SameSite decides whether the browser attaches it to a request initiated by another site. A JWT does not fix any of this by itself; it changes where some of the work happens, not whether it happens.",
      impact: [
        "A token read out of a log, a proxy, a shared machine or a script can be replayed until it expires, with no password required.",
        "A session that is never rotated can be fixed in advance by an attacker and then used after the victim authenticates.",
        "Sessions that live for weeks turn a single theft into long-term access, and make revocation depend on the user noticing.",
        "A cookie without HttpOnly hands the token to any script that runs on the page, which is exactly what an injection bug produces.",
      ],
      prevent: [
        "Generate identifiers with a CSPRNG, of at least 128 bits of entropy, and never derive them from anything the user can see or influence.",
        "Regenerate the session identifier at login and at every privilege change, and invalidate the old value immediately.",
        "Set HttpOnly, Secure and an explicit SameSite value on every session cookie, and keep the token out of URLs.",
        "Enforce both an idle timeout and an absolute maximum lifetime, and let the user see and revoke their own active sessions.",
        "Make logout a server-side deletion, and keep a server-side record so that revocation is possible for stateless tokens too.",
      ],
    },

    history: [
      {
        year: 1994,
        title: "The cookie is invented",
        text: "The HTTP cookie is specified by Netscape as a way to let a server keep state between requests in a browser that was not designed to do so. The design that matters for security came almost immediately: the server issues an opaque identifier, stores what it means in its own database, and the browser returns the identifier on later requests. The token is therefore a password chosen by the server and handed to the client, which is the whole security question in one sentence.",
      },
      {
        year: 2003,
        title: "Sessions and accounts share a category",
        text: "\"Broken Account and Session Management\" appears at A3 in the first OWASP Top 10. The two are joined because the same code produced both failures, and because a session that survives a password change is an account problem. The practical advice of the era is still the core of it: unpredictable identifiers, an expiry, and a real logout.",
      },
      {
        year: 2013,
        title: "Rank 2, and the entry grows",
        text: "\"Broken Authentication and Session Management\" reaches A2 in the 2013 edition. By then the failure modes are enumerated rather than implied: session identifiers that are not rotated at login, timeout values that are effectively infinite, and cookies that carry the session without the flags that would keep them out of reach of scripts and networks.",
      },
      {
        year: 2015,
        title: "The token stops needing a server-side record",
        text: "RFC 7519 standardises JSON Web Tokens, and a large number of frameworks adopt them as the session format. The trade is explicit: a self-contained token is verifiable without a lookup, so applications scale more easily, and the server no longer holds the state that would let it expire a token or revoke one. Everything about expiry, rotation and logout that the server-side record made easy becomes the application's own responsibility again.",
      },
      {
        year: 2017,
        title: "Folded into Broken Authentication",
        text: "The 2017 edition shortens the entry to \"Broken Authentication\" and absorbs session management into it, while A3 \"Sensitive Data Exposure\" takes the other half of the story: a cookie carrying a secret that is not protected. The split is accurate. One category is about whether the token is treated as a credential, the other is about whether it is treated as a secret.",
      },
      {
        year: 2020,
        title: "Two defaults change at once",
        text: "Browser vendors make SameSite=Lax the default for cookies that do not set the attribute, which removes a large class of cross-site sends at the user agent rather than in application code. In the same year RFC 8725, Best Current Practices for JSON Web Tokens, tells token consumers to pin an expected algorithm and to reject anything else. Both are the same lesson: rely on a default, and state your expectations explicitly rather than inheriting whatever the token or the browser offers.",
      },
      {
        year: 2025,
        title: "A07, and the record is back",
        text: "The category is \"Authentication Failures\" at A07 in the 2025 edition, and session handling sits inside it. The direction of travel is mildly counter-intuitive: stateless tokens were supposed to remove the server-side session store, and the current advice is to put a server-side record back in a narrower form, a denylist or a short-lived reference, because that is what makes revocation, idle timeout and \"log out everywhere\" real operations rather than client-side gestures.",
      },
    ],

    diagram: {
      caption: "A stolen token is a password that never expires",
      nodes: [
        { text: "Token is read from a log, a proxy or a shared PC", tone: "attacker" },
        { text: "Attacker replays it as a normal Cookie header", tone: "wire" },
        { text: "Server finds the session record and accepts it", tone: "app" },
        { text: "No password, no device, no second factor involved", tone: "danger" },
        { text: "Idle timeout is long or absent", tone: "danger" },
        { text: "Logout only clears the cookie, not the record", tone: "danger" },
        { text: "Fix: rotate on login, expire, revoke server-side", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 2, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "headers",
      mode: "pick",
      title: "Which Set-Cookie value do you want?",
      prompt: "One cookie attribute set decides three separate questions at once. Choose the value you would ship.",
      question: "Which Set-Cookie line gives a session cookie the properties it needs?",
      options: [
        { text: "Set-Cookie: sid=...; HttpOnly; Secure; SameSite=Strict", note: "All three attributes present, and no cross-site sending at all." },
        { text: "Set-Cookie: sid=...; SameSite=Strict", note: "Blocks cross-site sends, but leaves the token readable by JavaScript and cleartext." },
        { text: "Set-Cookie: sid=...; HttpOnly; Secure", note: "Two of three right, and no SameSite means cross-site navigations still carry it." },
        { text: "Set-Cookie: sid=...; Secure; SameSite=None", note: "Explicitly opts in to cross-site sending, which is the opposite of the goal." },
      ],
      answer: 0,
      why: {
        "0": "HttpOnly keeps the token out of reach of page scripts, Secure keeps it off the wire in clear text, and Strict stops the browser attaching it to any request initiated by another site. Strict is the strongest of the three and has a real cost: it breaks inbound links from other sites and some identity-provider return trips, which is why Lax is the usual production compromise for a session cookie.",
        "1": "SameSite=Strict is doing real work here, but the other two attributes are missing, so a script on the page can read the token and a network observer on a plain HTTP request can take it. Three attributes, three separate protections - this value only provides one.",
        "2": "HttpOnly and Secure are both correct and worth having. What is missing is SameSite: with no attribute set, the browser falls back to its own default, and even where that default is Lax the value is no longer stated by the application, so it changes silently if the browser's default changes.",
        "3": "SameSite=None is a deliberate opt-in to being sent on cross-site requests, and it is only valid alongside Secure. It is the right choice for a cookie a third-party iframe genuinely needs, and exactly the wrong choice for a credential that represents a logged-in user.",
      },
    },
  },

  /* ==========================================================
     4. CSRF
     ========================================================== */
  {
    key: "csrf",
    title: "Cross-Site Request Forgery (CSRF)",
    family: "identity",
    icon: "FaExchangeAlt",
    severity: "medium",
    tagline: "The browser attaches your credentials to a request you never intended to make.",
    refs: [
      { src: "OWASP Top 10 2013", id: "A8 Cross-Site Request Forgery (CSRF)" },
      { src: "OWASP Top 10 2010", id: "A5 Cross-Site Request Forgery (CSRF)" },
      { src: "CWE", id: "CWE-352" },
      { src: "MITRE ATT&CK", id: "T1190 Exploit Public-Facing Application" },
      { src: "OWASP Cheat Sheet", id: "CSRF Prevention Cheat Sheet" },
    ],
    cwe: { id: "CWE-352", name: "Cross-Site Request Forgery" },
    owaspConceptKey: "csrf",
    owaspYear: 2013,
    owaspId: "A8",

    explain: {
      what:
        "A cross-site request forgery works because of a browser feature, not a server bug. Cookies are attached to requests by the user agent according to the destination, so a page on one site can cause a request to another and the credentials travel with it whether or not the user meant anything by it. The attacker never sees the response, and does not need to: they only need the request to have an effect.",
      how:
        "The attack needs three things, and it is worth being precise about each. First, a state-changing action reachable by a request the browser can be made to send - a form post, an image tag, a fetch without a cross-origin restriction, or a link. Second, a credential the browser attaches automatically, which in practice means a cookie. Third, an application that trusts the cookie alone, having no idea the request came from somewhere else. That is why the defence is layered rather than singular, and why the first layer is the cheapest: SameSite tells the browser not to attach the cookie to a cross-site request, so the request arrives unauthenticated and fails on its own. Where SameSite is not enough - older browsers, or endpoints that genuinely need to be called cross-site - the application adds its own evidence that the request was intended: a per-session token in a form field compared against a value held server-side, a custom header that a cross-origin form cannot set, or an Origin and Referer check. The method matters too. GET, HEAD and OPTIONS are defined to be safe and must not change state, so a logout, a deletion or a payment confirmation on a GET route is a design error that hands an attacker the request for free through nothing more than an image tag.",
      impact: [
        "Any state change a logged-in user can trigger by clicking a link or loading a page, performed without their consent.",
        "Account takeover by changing the recovery email address and then triggering a password reset.",
        "Financial actions, address changes and permission grants, made in a session the user can see and does not understand.",
        "No read access for the attacker, which is why the bug is found through victim reports rather than through scanning.",
      ],
      prevent: [
        "Set SameSite on every session cookie, and treat Lax as the floor rather than leaving it unset.",
        "For state-changing routes, require a per-session anti-CSRF token and compare it with a constant-time comparison.",
        "Require a custom request header or a JSON content type on such routes, neither of which a cross-origin form can produce.",
        "Validate Origin, and fall back to Referer, on every state-changing request rather than only on login.",
        "Keep GET free of side effects, and re-authenticate before irreversible actions such as changing credentials or paying.",
      ],
    },

    history: [
      {
        year: 2010,
        title: "Promoted to a named Top 10 entry",
        text: "\"Cross Site Request Forgery (CSRF)\" appears at A5 in the 2010 OWASP Top 10, with CWE-352 behind it. The name is new but the mechanism is old: browsers have attached cookies to cross-site requests by default since cookies were specified, and a set of frameworks had made the problem widespread by wrapping a form around a state-changing action without a token.",
      },
      {
        year: 2013,
        title: "Moves to A8, and splits from access control",
        text: "The 2013 edition places CSRF at A8 while \"Insecure Direct Object References\" stays at A4 and \"Missing Function Level Access Control\" appears at A7. Placing the three next to each other is the point: CSRF is an access-control failure in which the attacker does not need credentials of their own, because the victim supplies them.",
      },
      {
        year: 2017,
        title: "No longer a category of its own",
        text: "The 2017 edition has no CSRF entry; the risk is described inside A5 Broken Access Control. The grouping is defensible. A forged request is a request the user was never authorised to make, and the two share a root cause in the same sense that missing an ownership check and missing a request-intent check are the same omission at different layers.",
      },
      {
        year: 2020,
        title: "The browser starts carrying the weight",
        text: "Browser vendors make SameSite=Lax the default for cookies that do not set the attribute. This is the most effective CSRF mitigation ever shipped, and notably it is not an application fix: a large number of exploitable applications stopped being exploitable because the user agent changed its default, with no code change anywhere. Lax is not sufficient on its own, but it removes the classic cross-site form post.",
      },
      {
        year: 2021,
        title: "Folded into A01 Broken Access Control",
        text: "The 2021 edition places CSRF inside A01 Broken Access Control, and the accompanying guidance restates the same logic: access control has to be applied per request, using evidence that the request was intended, not merely evidence that a credential was present. The advice that emerges is defence in depth, with a token or an Origin check under the cookie's SameSite value rather than instead of it.",
      },
      {
        year: 2025,
        title: "A01, and the remaining work is design",
        text: "Broken Access Control is A01 in the 2025 edition, and CSRF is one of the forms it describes. What is left to get right is largely a design question: state-changing actions on routes that require a body and a custom header, no side effects on GET, and a re-authentication step in front of anything irreversible. The attacks did not get better, and the interesting remaining failures are the applications that put a logout or a deletion on a GET route.",
      },
    ],

    diagram: {
      caption: "A request the user never intended, carrying a cookie they did not choose",
      nodes: [
        { text: "Attacker publishes a page with a hidden form", tone: "attacker" },
        { text: "Victim, already signed in, visits that page", tone: "wire" },
        { text: "The page posts to POST /account/email on your site", tone: "attacker" },
        { text: "Browser attaches the session cookie automatically", tone: "wire" },
        { text: "Handler trusts the cookie and changes the address", tone: "app" },
        { text: "Recovery mail now goes to the attacker's inbox", tone: "danger" },
        { text: "Fix: reject on Origin or token, and set SameSite", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 2, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "headers",
      mode: "sort",
      title: "Order the defences",
      prompt: "One cross-site POST arrives. Put the checks in the order a careful implementation applies them, earliest first.",
      items: [
        {
          text: "The handler re-authenticates before an irreversible action",
          why: "An anti-CSRF token proves the request was intended, not that the person meant this particular irreversible outcome. Password changes, key recovery and payments ask for the credential again, and belong after the forged-request problem is already solved.",
        },
        {
          text: "The browser decides whether to send the cookie at all",
          why: "SameSite is enforced by the user agent before the request leaves the machine, which makes it the outermost layer even though the application does not write it. If the cookie is not attached, nothing below this line matters.",
        },
        {
          text: "The edge compares the Origin header against the expected origin",
          why: "A header check needs no session state and no lookup, so it is cheap enough to run on every request, and a cross-origin form cannot forge it. It rejects the common case immediately, before any application code is involved.",
        },
        {
          text: "The attempt is written to the security log",
          why: "Logging comes last because it is a record rather than a control: a rejected forgery tells you something is probing the endpoint, which is worth having and stops nothing on its own.",
        },
        {
          text: "The handler compares a per-session token from the form with the stored value",
          why: "This is the application-level control: the token exists in the form only because this session rendered it, and the comparison is against a value held server-side. It is the layer that still works when the browser sends the cookie, so it comes after the cheap rejections.",
        },
      ],
      order: [1, 2, 4, 0, 3],
    },
  },

  /* ==========================================================
     5. OAUTH 2.0 & OIDC
     ========================================================== */
  {
    key: "oauth-oidc",
    title: "OAuth 2.0 & OIDC Misconfiguration",
    family: "identity",
    icon: "FaKey",
    severity: "high",
    tagline: "The authorization server is the identity provider, so a mistake there is bigger than any client mistake.",
    refs: [
      { src: "RFC", id: "RFC 9700 Best Current Practice for OAuth 2.0 Security" },
      { src: "RFC", id: "RFC 6749 The OAuth 2.0 Authorization Framework" },
      { src: "RFC", id: "RFC 7636 Proof Key for Code Exchange (PKCE)" },
      { src: "RFC", id: "RFC 8252 OAuth 2.0 for Native Apps" },
      { src: "RFC", id: "RFC 8725 JWT Best Current Practices" },
      { src: "OpenID Connect", id: "OpenID Connect Core 1.0" },
      { src: "CWE", id: "CWE-347" },
      { src: "CWE", id: "CWE-601" },
      { src: "MITRE ATT&CK", id: "T1550.001 Application Access Token" },
      { src: "OWASP Cheat Sheet", id: "OAuth 2.0 Cheat Sheet" },
    ],
    cwe: { id: "CWE-347", name: "Improper Verification of Cryptographic Signature" },
    /* No owaspConceptKey / owaspYear / owaspId on purpose: OAuth and
       OIDC misconfiguration is not an OWASP Top 10 category. The
       module stands on the RFCs, CWE and ATT&CK alone. */

    explain: {
      what:
        "OAuth 2.0 is a delegation protocol, not a login protocol, and OIDC is the layer that adds identity on top of it. The architecture is the important part: there is an authorization server that authenticates the user and issues tokens, and one or more clients that receive them. A mistake in a client is bad; a mistake in the authorization server is bad for every client that trusts it, which is why the deployment decisions in this module are made once, centrally, and are hard to unwind.",
      how:
        "Start with the redirect. The client sends the user to the authorization endpoint with a redirect_uri, and the authorization server sends the result back to exactly that address, so a redirect_uri that is matched loosely - by prefix, by subdomain, by a fragment pattern - hands the result to whoever controls the matching part. Combined with an open redirect on the client, this is the standard code-leak and token-theft chain, and RFC 9700 is unambiguous that the comparison must be an exact string match against a registered value. The state parameter is the second control: it is an unguessable value the client generates and checks on return, and without it the attacker can start an authorization request and have the result delivered into their own session, which is a CSRF inside the protocol. The flow is the third. The implicit flow returned tokens in the URL fragment, where they land in browser history, in referer headers and in any script on the page, and it is retired in favour of the authorization code flow with PKCE, where the code is useless without the verifier that only the client holds. Token storage is the fourth, and it is a genuine trade rather than a right answer: localStorage is readable by any script that runs on the origin, which is tolerable only if the origin has no injection bug, and an httpOnly cookie is protected from that but then needs SameSite and CSRF handling because the browser will send it on its own. And if you validate the tokens yourself, the rule from RFC 8725 is to pin the algorithm you expect rather than reading the alg field out of the token and doing what it asks - accepting a token with alg set to none, or verifying an asymmetric signature as though it were an HMAC using the public key as a shared secret, hands over the whole system.",
      impact: [
        "An authorization code or token is delivered to the attacker's site through a loosely matched redirect_uri, and the account is taken over.",
        "A stolen refresh token produces long-lived access to the victim's data with no further user interaction.",
        "Accepting alg none, or honouring the token's own alg header, means the attacker signs their own tokens and no longer needs the private key.",
        "An open redirect anywhere in the chain is enough to break a redirect_uri that is otherwise configured correctly.",
      ],
      prevent: [
        "Compare redirect_uri with the registered value as an exact string; never with startsWith, a regex, or a wildcard.",
        "Generate an unguessable state value, store it in the session, and refuse to complete a callback where it does not match.",
        "Use the authorization code flow with PKCE for every client, including confidential ones, and retire the implicit flow.",
        "Keep tokens out of localStorage unless you can state why the origin cannot execute injected script; prefer httpOnly cookies with SameSite.",
        "In resource servers, pin the expected algorithm and the issuer, and verify the audience - never trust the header the token arrives with.",
      ],
    },

    history: [
      {
        year: 2012,
        title: "RFC 6749 defines the framework",
        text: "The OAuth 2.0 Authorization Framework is published in October 2012 and quickly becomes the default way for applications to act on a user's behalf. The protocol is explicit that it is not an authentication protocol, and that the state parameter exists to prevent cross-site request forgery inside the flow. Both facts are in the original document, and both are still the most commonly missed parts of a real implementation.",
      },
      {
        year: 2014,
        title: "OIDC adds identity on top",
        text: "OpenID Connect Core 1.0 is published, adding an identity layer with its own endpoints and an id_token as a JWT. The distinction it makes is the one that keeps being confused: authentication is proving who the user is, which is what the id_token is for, while authorisation is what the access token may be used for. A client that treats the access token as proof of identity has made the first mistake the protocol was designed to avoid.",
      },
      {
        year: 2015,
        title: "PKCE and the security considerations land",
        text: "RFC 7636 introduces Proof Key for Code Exchange, binding an authorization code to a verifier that never leaves the client, and RFC 6819 collects OAuth 2.0 Security Considerations. PKCE was designed for the case where the client cannot keep a secret, which is every browser and mobile application, and it turned out to be useful for confidential clients as well because it protects against an injected code in a maliciously registered redirect_uri.",
      },
      {
        year: 2017,
        title: "Native apps get their own profile",
        text: "RFC 8252 sets out OAuth 2.0 for native applications and makes the authorization code flow with PKCE the only recommended pattern, closing off the custom-URI-scheme alternatives that had been in informal use. The document also makes the loopback redirect rule precise, which matters because a redirect to a fixed port on localhost is a real, reachable endpoint and has to be handled exactly like any other registered URI.",
      },
      {
        year: 2019,
        title: "The security BCP spends years as a draft",
        text: "The OAuth security topics document, the ancestor of what became RFC 9700, begins circulating as a working draft and stays that way for most of the following decade. The delay is instructive: the guidance that practitioners actually follow has usually been ahead of the standard, and deployments have been built from the draft rather than from a published document.",
      },
      {
        year: 2020,
        title: "JWT consumers get their own best-practice list",
        text: "RFC 8725, Best Current Practices for JSON Web Tokens, tells consumers to pin the algorithms they accept, to validate every claim the application relies on, and to treat the header as untrusted input. It exists because a large amount of deployed token validation was written by hand, and hand-written validation is where algorithm confusion comes from.",
      },
      {
        year: 2025,
        title: "RFC 9700, and the implicit flow is retired",
        text: "Best Current Practice for OAuth 2.0 Security is published as RFC 9700 in January 2025, folding a decade of draft guidance into one document: exact redirect_uri matching, PKCE for all clients, the implicit flow and the resource owner password credentials grant both removed, and authorization server requests treated as untrusted input that must be validated. It is the first time these have been normative rather than advisory.",
      },
      {
        year: 2025,
        title: "Where the risk sits now",
        text: "The protocol-level mistakes have largely been written out of new deployments, and the remaining findings are configuration and integration errors rather than design flaws: a redirect_uri registered too broadly, a state value that is compared but not bound to a session, a client secret kept in a repository, a token accepted without checking the audience. The defensible posture is the one RFC 9700 describes, applied without exception - treat the browser, the client and the token as untrusted, and make the authorization server the single place where a decision is made.",
      },
    ],

    diagram: {
      caption: "A prefix match on redirect_uri hands the code to the wrong site",
      nodes: [
        { text: "Attacker sends the victim an authorization link", tone: "attacker" },
        { text: "The link carries a foreign redirect_uri", tone: "wire" },
        { text: "Server accepts it: the match is a prefix test", tone: "app" },
        { text: "Authorization code is posted to the attacker's host", tone: "danger" },
        { text: "Attacker redeems the code for tokens", tone: "danger" },
        { text: "The victim's account is now in their hands", tone: "danger" },
        { text: "Fix: exact match on the registered redirect_uri", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 2, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which line makes the signature check meaningless?",
      prompt: "This validator is doing everything right except for one line, and that one line removes the entire signature check.",
      language: "javascript",
      lines: [
        { text: "const [hdr, payload, sig] = token.split('.');" },
        { text: "const header = JSON.parse(Buffer.from(hdr, 'base64url').toString());" },
        { text: "if (header.alg !== 'HS256') throw new Error('unexpected alg');", vulnerable: true },
        { text: "const key = await jwks().then(set => set.get(header.kid));" },
        { text: "const mac = crypto.createHmac('sha256', key).update(hdr + '.' + payload).digest('base64url');" },
        { text: "if (mac !== sig) throw new Error('bad signature');" },
      ],
      explain:
        "Line 3 lets the token choose its own algorithm. The public key fetched from the JWKS on line 4 is, by definition, public, so an attacker who mints an unsigned-style JWT with alg set to HS256 and signs it with that public key produces a mac that matches on line 5. The signature check then passes for a token nobody with the private key ever signed, which is why the standard says to pin the algorithm you expect rather than read alg from the header. Line 5 and line 6 are correct code for an HMAC-verified token; lines 1 and 2 are just decoding, which is safe as long as the result is never treated as trusted. Compare the values with a constant-time comparison, and validate the issuer and audience as well.",
    },
  },
];

export default identityModules;
