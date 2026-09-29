/**
 * ============================================================
 * MODULE FAMILY: INJECTION
 * ------------------------------------------------------------
 * A module is a self-contained lesson object. It does NOT depend on
 * the OWASP backend dataset: OWASP is one source among several, and
 * `refs` can point at CWE, MITRE ATT&CK, NIST or STRIDE as well.
 * `owaspConceptKey` / `owaspYear` / `owaspId` are OPTIONAL - when
 * they are present the module page offers a link into the matching
 * lesson of the 80-entry OWASP history, and when they are absent the
 * module still works on its own.
 *
 * SCHEMA (every key documented once, here)
 * ----------------------------------------
 * key        string   url slug, unique across all families
 * title      string   display name
 * family     string   one of the FAMILIES ids in ./index.js
 * icon       string   a react-icons/fa export name, resolved by the page
 * severity   string   low | medium | high | critical
 * tagline    string   one sentence, shown on the module card
 *
 * refs       array    { src, id } - at least 2, and at least one of
 *                      them must NOT be OWASP. Keep the ids real.
 * cwe        object   { id, name } the CWE id and its official name
 *
 * owaspConceptKey / owaspYear / owaspId
 *                      optional link into the OWASP dataset
 *
 * explain    object   what / how / impact[] / prevent[]
 *                      impact and prevent are short bullet arrays
 *
 * history    array    { year, title, text } - the real history of how
 *                      this attack became possible. Dated, factual.
 *                      OWASP appearances use the project's own data.
 *
 * diagram    object   caption / nodes[] / edges[]
 *                      nodes[i] = { text, tone, lane? }
 *                      tone: neutral | attacker | wire | app | danger
 *                      | defence | data
 *                      edges[i] = { from, to, label? } (indexes into
 *                      nodes). A node with no outgoing edge ends a
 *                      branch. The node list is ALSO used to build
 *                      the "Order the Attack" puzzle for free.
 *
 * puzzle     object   optional SECOND puzzle, for variety. One of
 *                      { type: "spot" | "payload" | "headers", ... }
 *                      See ./index.js for the shape of each.
 *
 * SAFETY: nothing here is an exploit. Payloads are shown the way a
 * textbook shows them, and every lab step in this project runs on
 * localhost against data you made up.
 * ============================================================ */

export const injectionModules = [
  /* ==========================================================
     1. SQL INJECTION
     ========================================================== */
  {
    key: "sql-injection",
    title: "SQL Injection",
    family: "injection",
    icon: "FaDatabase",
    severity: "critical",
    tagline: "One line that builds a query by gluing strings together lets a stranger read your database.",
    refs: [
      { src: "OWASP Top 10 2025", id: "A05 Injection" },
      { src: "OWASP Top 10 2021", id: "A03 Injection" },
      { src: "CWE", id: "CWE-89" },
      { src: "MITRE ATT&CK", id: "T1190 Exploit Public-Facing Application" },
    ],
    cwe: { id: "CWE-89", name: "Improper Neutralization of Special Elements used in an SQL Command" },
    owaspConceptKey: "injection",
    owaspYear: 2021,
    owaspId: "A03",

    explain: {
      what:
        "Your code takes a value from the request and drops it into a SQL statement. If the statement is assembled by string concatenation, the value is no longer data - it is part of the command. An attacker closes your quote, adds their own SQL, and the database cannot tell the difference between what you meant and what they typed.",
      how:
        "The handler builds text like \"SELECT * FROM users WHERE name = '\" + input + \"'\". When input is bob, that is a harmless query. When input is bob' OR '1'='1, the final statement becomes \"... WHERE name = 'bob' OR '1'='1'\", which is true for every row. The classic next move is UNION SELECT to append a second query, so the attacker can choose which columns come back, and then a stacked query to write data instead of only reading it.",
      impact: [
        "Read any table the application account can reach, including other users' password hashes.",
        "Bypass the login form entirely without knowing any password.",
        "Change or delete data if the database account has write permission.",
        "In poorly configured databases, escalate to reading files or running operating system commands.",
      ],
      prevent: [
        "Use parameterised queries (prepared statements) so values can never become syntax.",
        "If you must build SQL dynamically, allow-list the column or direction names, never the values.",
        "Give the application's database account only the privileges it actually needs - read-only where possible.",
        "Turn off multiple statements in the driver so one request cannot stack two commands.",
      ],
    },

    history: [
      {
        year: 1998,
        title: "First public description",
        text: "The attack was written up in Phrack issue 49 as \"SQL Injection\", by Rain Forest Puppy (PACT). It is usually credited as the first public explanation of the technique, five years after the underlying mistake - building commands with string concatenation - became common in CGI and database-backed web pages.",
      },
      {
        year: 2003,
        title: "Reaches the OWASP Top 10",
        text: "The inaugural OWASP Top 10 listed \"Command Injection Flaws\" at A6. The name was narrow - it read as though it only concerned operating system commands - but the category already covered interpreters being handed attacker text.",
      },
      {
        year: 2004,
        title: "Renamed to Injection",
        text: "The category became \"Injection Flaws\" at A2. This is the year OWASP separated the idea from one payload: it is about any interpreter that receives untrusted text, so SQL, LDAP, XPath, OS commands and template engines all fall under the same root cause.",
      },
      {
        year: 2007,
        title: "Rank 2, and XSS splits off",
        text: "\"Injection Flaws\" sat at A2 while Cross-Site Scripting took A1. XSS left the category because it runs in the victim's browser rather than on the server, which is a different trust boundary even though the mistake - string concatenation into an interpreter - is identical.",
      },
      {
        year: 2010,
        title: "Injection becomes rank 1",
        text: "The category was renamed simply \"Injection\" and moved to A1, its most prominent position. From here to 2021 it holds rank 1 or 2 in every edition, which makes it the longest-running entry in the list's history.",
      },
      {
        year: 2013,
        title: "Rank 1 again",
        text: "\"Injection\" held A1 in the 2013 edition. The 2013 edition also added \"Sensitive Data Exposure\" at A6, which is what made injection so visible in public bug bounty reports: the leaked data was the headline, the injection was the cause.",
      },
      {
        year: 2017,
        title: "Rank 1, returned to server-side injection only",
        text: "\"Injection\" went back to number one in 2017, and the edition gave XSS its own entry again at A7 - the opposite of the 2013 arrangement, where A3 was the XSS entry. The two categories ran in parallel for this edition: A1 covered the interpreters on the server, A7 covered the one in the browser. The 2017 edition also added \"Broken Access Control\" at A5, so the ranks around injection moved even though injection itself did not.",
      },
      {
        year: 2021,
        title: "Structural rewrite to A03",
        text: "Identifiers became A01-A10 and Injection moved to A03. The category was reframed around a threat model rather than payloads, and XSS disappeared as a separate entry, its guidance folded into the Injection entry and its prevention cheat sheets rather than being given its own rank.",
      },
      {
        year: 2025,
        title: "Injection moves to A05",
        text: "The 2025 edition reorganises the list around assets and supply chains, and Injection lands at A5. The rank dropped, not the risk: the category is still the same root cause, while the new number one, Broken Access Control, absorbed SSRF.",
      },
      {
        year: 2025,
        title: "The attack moved, the mistake did not",
        text: "The interesting part of the last two decades is not the ranking. It is that the exploitable code barely changed: string concatenation into a query is still written every day. What changed is the defence - parameterised queries went from an expert trick to the default in most ORMs, and the remaining cases are second-order injection (data that was safely stored, then used unsafely later) and injection into the newer query languages that arrived after the defences were written, such as MongoDB, GraphQL and LDAP filters.",
      },
    ],

    diagram: {
      caption: "How a search box becomes someone else's SQL",
      nodes: [
        { text: "Attacker types into the search box", tone: "attacker" },
        { text: "Browser sends name=bob' OR '1'='1", tone: "wire" },
        { text: "Handler builds SQL by concatenation", tone: "app" },
        { text: "Query becomes: WHERE name='bob' OR '1'='1'", tone: "danger" },
        { text: "Condition is true for every row", tone: "danger" },
        { text: "All users returned to the attacker", tone: "danger" },
        { text: "Fix: prepared statement sends the value as data", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3, label: "no escaping" },
        { from: 3, to: 4, label: "'1'='1'" },
        { from: 4, to: 5 },
        { from: 2, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which line is the vulnerability?",
      prompt: "Click the line that lets the attacker change the meaning of the query.",
      language: "javascript",
      lines: [
        { text: "const sql = `SELECT * FROM users WHERE name = '${req.query.name}'`;", vulnerable: true },
        { text: "app.get('/search', requireLogin, async (req, res) => {" },
        { text: "  const rows = await db.query(sql, []);" },
        { text: "  res.json(rows);" },
        { text: "});" },
      ],
      explain:
        "The template literal is fine as long as the placeholder is a real bind variable. Here the value is interpolated into the string, so it is parsed as SQL syntax. Line 3 is a trap: it passes an empty parameter array, which looks like the safe pattern but has nothing to bind because line 1 already destroyed the separation.",
    },
  },

  /* ==========================================================
     2. CROSS-SITE SCRIPTING
     ========================================================== */
  {
    key: "xss",
    title: "Cross-Site Scripting (XSS)",
    family: "injection",
    icon: "FaCode",
    severity: "high",
    tagline: "The victim runs the attacker's code, in the victim's own logged-in session.",
    refs: [
      { src: "OWASP Top 10 2025", id: "A05 Injection" },
      { src: "OWASP Top 10 2017", id: "A7" },
      { src: "CWE", id: "CWE-79" },
      { src: "MITRE ATT&CK", id: "T1059.007 JavaScript" },
    ],
    cwe: { id: "CWE-79", name: "Improper Neutralization of Input During Web Page Generation" },
    owaspConceptKey: "xss",
    owaspYear: 2013,
    owaspId: "A3",

    explain: {
      what:
        "Your page takes a value and writes it into the HTML the browser parses. If the value is not encoded for the context it lands in, the browser reads the attacker's text as markup or script instead of as words. The code then runs with the victim's cookies, session and same-origin access - which is the whole problem, because the browser cannot tell your markup from the attacker's.",
      how:
        "There are three contexts, and each needs different encoding. In element text you must escape < and >. In an attribute you must escape the quote character used to close it, and the value must not be able to break out of the attribute at all. Inside a script block, HTML escaping does nothing, so the payload has to be encoded for JavaScript, or the value has to be put in a data attribute and read back with textContent. The three classic varieties are stored (the payload is saved and served to every visitor), reflected (it comes back in the same response) and DOM-based (it is never sent - it is assembled in client-side JavaScript from a URL fragment or a postMessage).",
      impact: [
        "Read cookies and anything the session token gives access to, without needing the password.",
        "Act as the victim: change settings, approve a payment, post in their name.",
        "Read the page the victim can see, including data only their account is allowed to load.",
        "Rewrite the page to show a convincing fake login form and harvest the password directly.",
      ],
      prevent: [
        "Encode on output, for the context - not on input. Escaping the value when you receive it is wrong, because the same value may legitimately be shown in two different contexts.",
        "Prefer textContent over innerHTML. Most client-side bugs are a single call to the wrong property.",
        "Send a Content-Security-Policy so that even if a payload lands, the browser refuses to run it.",
        "Turn HttpOnly on session cookies. It does not stop XSS, but it removes the most valuable thing the payload wants to steal.",
      ],
    },

    history: [
      {
        year: 1999,
        title: "Disclosed as a browser flaw",
        text: "The term \"Cross Site Scripting\" was coined at a Microsoft security conference. Early write-ups framed it as a browser trust bug - the browser executing script from another origin - which shaped how it was understood for years, and why the fix was often argued to be the browser's job.",
      },
      {
        year: 2003,
        title: "Enters the OWASP Top 10",
        text: "\"Cross Site Scripting (XSS) Flaws\" appeared at A4 in the first OWASP Top 10, listed separately from \"Command Injection Flaws\" at A6. The split is the important decision: XSS executes in the browser, not on the server, so it crosses a different trust boundary.",
      },
      {
        year: 2007,
        title: "Rank 1",
        text: "XSS took the number one slot at A1, ahead of injection, and stayed there for two editions. This was the era in which most public reports were reflected XSS in query strings, and the emphasis was on output encoding.",
      },
      {
        year: 2010,
        title: "Drops to rank 2",
        text: "\"Cross-Site Scripting (XSS)\" moved to A2 as Injection took A1. Reflected XSS was still the common case, and frameworks were by then making escaping the default.",
      },
      {
        year: 2013,
        title: "Rank 3",
        text: "XSS sat at A3. The 2013 edition's title is worth reading closely: \"Cross-Site Scripting (XSS)\" without the word \"Flaws\", matching the tightening of the other category names that year.",
      },
      {
        year: 2017,
        title: "A7, demoted from the top three",
        text: "XSS stayed a separate entry in 2017, moving to A7, well down the list from the A3 it held in 2013. It was one of the clearest signals of the 2017 edition's priorities: with reflected XSS increasingly blocked by browser-side filtering, the rank fell even though the underlying bug did not.",
      },
      {
        year: 2021,
        title: "Back under A03, with the DOM variant named",
        text: "Injection at A03 covers XSS again. The modern framing adds DOM-based XSS as a first-class variant, because it never reaches the server - a framework that safely escapes output on the server is still vulnerable if client-side JavaScript later writes an unencoded value into the page.",
      },
      {
        year: 2025,
        title: "A05, with CSP as the accepted control",
        text: "Injection is A5 in the 2025 edition. The defence story has changed more than the attack: encoding alone is treated as insufficient, and Content-Security-Policy with a nonce is now considered the control that actually limits what a successful injection can do.",
      },
    ],

    diagram: {
      caption: "The stored form of the attack, and the session it steals",
      nodes: [
        { text: "Attacker posts a comment containing a script tag", tone: "attacker" },
        { text: "Server stores the comment unencoded", tone: "app" },
        { text: "Victim opens the page", tone: "wire" },
        { text: "Server returns the raw comment inside the HTML", tone: "wire" },
        { text: "Browser parses the tag as markup, not text", tone: "danger" },
        { text: "Script runs as the victim, on the site origin", tone: "danger" },
        { text: "Attacker reads the response and the session", tone: "danger" },
        { text: "Fix: encode on output, and send a CSP", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 6 },
        { from: 3, to: 7, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which line lets the payload run?",
      prompt: "Two ways of writing the same string into the page. One is safe, one is not. Click the unsafe one.",
      language: "javascript",
      lines: [
        { text: "el.innerHTML = comment.body;              // runs a <script> tag", vulnerable: true },
        { text: "el.textContent = comment.body;           // always safe" },
        { text: "const el = document.getElementById('c');" },
        { text: "fetch('/comments').then(r => r.json());" },
      ],
      explain:
        "innerHTML parses the string as HTML, so a script tag in the data becomes an element and executes. textContent treats the same string as characters, so the tag is displayed rather than run. This single property is the most common source of DOM-based XSS.",
    },
  },

  /* ==========================================================
     3. COMMAND INJECTION
     ========================================================== */
  {
    key: "command-injection",
    title: "OS Command Injection",
    family: "injection",
    icon: "FaTerminal",
    severity: "critical",
    tagline: "The server runs a shell command that the user helped to write.",
    refs: [
      { src: "OWASP Top 10 2025", id: "A05 Injection" },
      { src: "OWASP Top 10 2003", id: "A6" },
      { src: "CWE", id: "CWE-78" },
      { src: "MITRE ATT&CK", id: "T1059 Command and Scripting Interpreter" },
    ],
    cwe: { id: "CWE-78", name: "Improper Neutralization of Special Elements used in an OS Command" },
    owaspConceptKey: "command-injection",
    owaspYear: 2003,
    owaspId: "A6",

    explain: {
      what:
        "The application needs the operating system to do something - convert a file, resize an image, ping a host - and does it by building a shell command out of a string that includes user input. A shell does not care which characters came from your code and which came from the user; separators like ; | & and newline are instructions to it, so the user can add a second command of their own.",
      how:
        "exec(\"convert \" + file) with file set to \"a.png; cat /etc/passwd\" runs two commands. It gets worse than reading a file, because the child process usually runs as the application user or worse, so writing a webshell, reading environment variables or reaching the internal network are all one payload away. The same mistake appears one layer up as argument injection, where the value does not need a separator - passing --output=/etc/cron.d/x to a tool that accepts flags is enough.",
      impact: [
        "Read any file the service account can read, including private keys and environment secrets.",
        "Full remote code execution on the server, with the privileges of the web process.",
        "Pivot to internal hosts that are not exposed to the internet at all.",
        "Destroy data, or be used as a jump host to attack other machines in the same network.",
      ],
      prevent: [
        "Never build a shell string. Use the library function that takes the arguments separately, such as execFile or subprocess with an argument array and shell disabled.",
        "If a shell is genuinely required, quote every value and understand which shell you are quoting for.",
        "Run the service as an unprivileged user in a container with a read-only filesystem.",
        "Do not pass user input as flags or options; allow-list the values the command accepts.",
      ],
    },

    history: [
      {
        year: 1970,
        title: "The shell is the ancestor",
        text: "Command injection is not really a web bug. It is what happens when a program built on the shell's convenience - a single line of text that means \"run this\" - is handed text that somebody else wrote. Every shell metacharacter that causes this, ; | & $() and newline, has existed since the original Bourne shell.",
      },
      {
        year: 2003,
        title: "In the first OWASP Top 10",
        text: "\"Command Injection Flaws\" appears at A6 in the inaugural OWASP Top 10. The category is named after the operating system, which is why it reads as the most technical entry on a list that also contained \"Error Handling Problems\" and \"Remote Administration Flaws\".",
      },
      {
        year: 2004,
        title: "Absorbed into Injection",
        text: "OWASP merged it into \"Injection Flaws\" at A2. This is the correct root-cause grouping: the shell, SQL and the template engine are all interpreters, and all three are defeated by the same mistake of gluing untrusted text into their input.",
      },
      {
        year: 2008,
        title: "The framework fixes land",
        text: "Languages add safe APIs - Ruby's array form of the system call, Python's shell=False default, PHP's escapeshellarg - and frameworks start calling them internally. Command injection drops sharply in new code and survives almost entirely in old code and in features that shell out by design, like build scripts and image processing.",
      },
      {
        year: 2010,
        title: "Rank 1 Injection, OS commands inside it",
        text: "\"Injection\" takes A1 and command injection is part of the category. The public profile of the risk shifts: web shells uploaded through file upload become the more common exploitation route, because they only need the same mistake once and then persist.",
      },
      {
        year: 2021,
        title: "A03, and a new sibling appears",
        text: "The 2021 edition reorders to A03 and, for the first time, gives deserialisation its own category at A08. Command injection stays inside Injection, but the adjacent category reflects that attackers increasingly get code execution through data structures rather than through the shell.",
      },
      {
        year: 2025,
        title: "A05, and the pipeline moves in",
        text: "Injection is A5 in the 2025 edition. The notable recent change is where the bad string comes from: build and deployment pipelines, which shell out constantly, now make CI configuration a part of the attack surface - an injection bug in a pipeline runs with the pipeline's credentials, not with a web user's.",
      },
    ],

    diagram: {
      caption: "Why a semicolon is a second command",
      nodes: [
        { text: "Upload form sends filename=a.png", tone: "attacker" },
        { text: "Server runs: convert a.png out.jpg", tone: "app" },
        { text: "Filename contains ; cat /etc/passwd", tone: "attacker" },
        { text: "Shell sees ; and splits the line in two", tone: "danger" },
        { text: "First command runs normally", tone: "app" },
        { text: "Second command runs as the service user", tone: "danger" },
        { text: "Contents of /etc/passwd come back to the attacker", tone: "danger" },
        { text: "Fix: execFile('convert', [file, out]) with no shell", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 3 },
        { from: 2, to: 3, label: "; is a separator" },
        { from: 3, to: 4 },
        { from: 3, to: 5 },
        { from: 5, to: 6 },
        { from: 1, to: 7, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which line is the vulnerability?",
      prompt: "Both versions convert an image. One lets the filename escape into the shell.",
      language: "javascript",
      lines: [
        { text: "exec(`convert ${req.file.originalname} out.jpg`);   // shell", vulnerable: true },
        { text: "execFile('convert', [req.file.originalname, 'out.jpg']); // no shell" },
        { text: "app.post('/upload', requireLogin, (req, res) => {" },
        { text: "  res.send('done');" },
        { text: "});" },
      ],
      explain:
        "The backticks build one string and hand it to /bin/sh, which is free to interpret ; | & and newline. execFile takes the program and each argument as separate values, so a filename containing a semicolon is just a filename - it is data, and it is never parsed.",
    },
  },

  /* ==========================================================
     4. SERVER-SIDE TEMPLATE INJECTION
     ========================================================== */
  {
    key: "ssti",
    title: "Server-Side Template Injection",
    family: "injection",
    icon: "FaSitemap",
    severity: "critical",
    tagline: "The template engine itself is the interpreter, and it can reach further than the page.",
    refs: [
      { src: "OWASP Top 10 2025", id: "A05 Injection" },
      { src: "OWASP Top 10 2021", id: "A03 Injection" },
      { src: "CWE", id: "CWE-1336" },
      { src: "MITRE ATT&CK", id: "T1059 Command and Scripting Interpreter" },
      { src: "OWASP Cheat Sheet", id: "Server Side Template Injection Prevention" },
    ],
    cwe: { id: "CWE-1336", name: "Improper Neutralization of Special Elements Used in a Template Engine" },
    owaspConceptKey: "injection",
    owaspYear: 2021,
    owaspId: "A03",

    explain: {
      what:
        "A template engine takes a document and merges data into it. If the document itself comes from a user - a custom email, a PDF layout, a page an admin uploaded - the user has written the template, not just the data. Most engines expose an expression language inside the template for logic, and that language is frequently powerful enough to call back into the application.",
      how:
        "The first step is identifying the engine, because the probe differs: {{7*7}} for Jinja/Twig/Handlebars, ${7*7} for Freemarker/Velocity/JS template literals, <%= 7*7 %> for ERB/EJS. When the arithmetic is evaluated, the user knows the expression language is live. From there the interesting payloads use the engine's own object access to walk from a template to code execution - in Jinja, reaching the class hierarchy from a string object's subclasses; in Freemarker, assigning an execution utility to a variable. The reason this is worse than plain XSS is direction: the code runs on the server, before any page is sent.",
      impact: [
        "Remote code execution on the server, with the privileges of the application.",
        "Read configuration and source, including database credentials held in the environment.",
        "Server-side template injection in a PDF or email generator often also means reading local files.",
        "Because it happens server-side, no browser protection applies: there is no victim to protect.",
      ],
      prevent: [
        "Never let users write templates. Pass user data as a variable to a template you control.",
        "Keep the template engine sandboxed and patched, and never hand it an object that can reach a class loader or a command runner.",
        "For user-supplied layouts, use a restricted, logic-less format instead of a real template engine.",
        "Sandbox the render step separately, because SSTI is code execution and the render should not have the same reach as the main app.",
      ],
    },

    history: [
      {
        year: 1999,
        title: "PHP arrives with the problem built in",
        text: "Server-side templates become a mainstream web feature with PHP, whose string interpolation puts a general-purpose language inside a page. The pattern of \"the page contains code\" is normal from the start, so there is a long period in which rendering a page and executing code are the same operation.",
      },
      {
        year: 2003,
        title: "Injected language arrives",
        text: "Jinja and ERB-style templating formalise the alternative: a template with placeholders, and logic written separately. The safety of this design depends entirely on whether the placeholder values are data or code, which is the decision SSTI later turns against the application.",
      },
      {
        year: 2010,
        title: "Web frameworks popularise user-editable templates",
        text: "CMS products, mailing systems and PDF generators begin letting staff edit templates without a developer. The template engine is still server-side and still expressive; what is new is that its input is now routinely supplied through a web form.",
      },
      {
        year: 2015,
        title: "Mass customisation of mail and PDF layouts",
        text: "Template injection becomes widely reported as apps add per-tenant customisation - branded emails, invoice layouts, printable reports. The feature is genuinely useful and the risk is rarely considered, because the editor is assumed to be trusted and, in the worst cases, that assumption is not even documented.",
      },
      {
        year: 2021,
        title: "Named as Injection, not as a new category",
        text: "OWASP A03 Injection covers SSTI, on the reasoning that it is the same root cause as SQL and OS injection: untrusted text reaching an interpreter. It is also the clearest example of why the list is organised by cause rather than by payload - SSTI shares a category with SQL injection despite having nothing in common at the payload level.",
      },
      {
        year: 2025,
        title: "A05, and templates move server-side again",
        text: "Injection is A5 in the 2025 edition. The newer pressure comes from server-side rendering and from multi-tenant SaaS products, where a template editor is a normal product feature and the boundary between \"content\" and \"code\" is exactly where the vulnerability lives.",
      },
    ],

    diagram: {
      caption: "A user-written template reaches the render step",
      nodes: [
        { text: "Attacker saves layout: {{ 7*7 }}", tone: "attacker" },
        { text: "Render step passes it to the engine", tone: "app" },
        { text: "Engine evaluates the expression", tone: "app" },
        { text: "Output contains 49, so the engine is live", tone: "danger" },
        { text: "Attacker walks the object graph to code exec", tone: "danger" },
        { text: "Attacker code runs on the server", tone: "danger" },
        { text: "Fix: engine only ever receives data values", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3, label: "{{ 7*7 }}" },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 1, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which line lets the caller write the template?",
      prompt: "A PDF generator whose layout is chosen by the user. One line turns a data problem into a code problem.",
      language: "javascript",
      lines: [
        { text: "const template = new Template(layoutFromUser);   // user writes the template", vulnerable: true },
        { text: "const data = { name: user.name, total: invoice.total };" },
        { text: "const out = engine.render(template, data);" },
        { text: "res.type('application/pdf').send(out);" },
      ],
      explain:
        "Line 1 makes the user the template author. Once the layout is user-supplied, the engine's expression language is reachable, and the two arguments on line 3 stop having different roles - the layout is code and data is just data. The fix is to keep the template under application control and pass user values as the data argument only.",
    },
  },
];

export default injectionModules;
