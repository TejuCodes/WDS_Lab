/**
 * ============================================================
 * MODULE FAMILY: PLATFORM & SUPPLY CHAIN
 * ------------------------------------------------------------
 * Schema, tone and rules are documented in ./injection.js - read
 * that file first. Two of these seven modules (request-smuggling,
 * graphql-api) deliberately carry NO owaspConceptKey, because they
 * are not OWASP Top 10 categories. That is intentional: the
 * catalogue is broader than one list, and the optional OWASP link
 * is a cross-reference, not a requirement.
 * ============================================================ */

export const platformModules = [
  /* ==========================================================
     1. SECURITY MISCONFIGURATION
     ========================================================== */
  {
    key: "security-misconfig",
    title: "Security Misconfiguration",
    family: "platform",
    icon: "FaServer",
    severity: "high",
    tagline: "The secure setting is a different line in a different file for every deployment, so it gets missed.",
    refs: [
      { src: "OWASP Top 10 2025", id: "A02" },
      { src: "OWASP Top 10 2021", id: "A05" },
      { src: "CWE", id: "CWE-16" },
      { src: "MITRE ATT&CK", id: "T1190" },
      { src: "NIST", id: "SP 800-53" },
    ],
    cwe: { id: "CWE-16", name: "Configuration" },
    owaspConceptKey: "security-misconfiguration",
    owaspYear: 2021,
    owaspId: "A05",

    explain: {
      what:
        "Nothing is wrong with the code. The code is exactly as the author wrote it, and the environment around it is not what the author assumed. Default credentials, verbose errors, an unused debug endpoint, an open storage bucket, a permissive CORS rule - each one is a line of configuration that nobody changed, and each one is a way in.",
      how:
        "The attack is reconnaissance first. An attacker enumerates paths, reads what the server is willing to say, and looks for the things that were left at their defaults: a sample application that shipped with the framework, a directory index on a static folder, a stack trace naming the framework and its version. The payload is rarely clever. It is often a GET request for a path that should not have been reachable, or a login with the credentials printed in the documentation you are reading.",
      impact: [
        "Default or hard-coded credentials give an attacker an authenticated session without exploiting anything.",
        "Verbose errors and stack traces hand out file paths, framework versions and query structure.",
        "Open storage buckets or over-broad network rules expose data that the application itself protects correctly.",
        "Because the surface is enumerable, the same request works from anywhere, forever, until somebody reads the config.",
      ],
      prevent: [
        "Ship hardened defaults: no sample app, no debug routes, no directory listing, no stack traces in production.",
        "Write the insecure state down explicitly in code review, so the difference between environments is visible in the diff.",
        "Automate the header and configuration baseline (CSP, HSTS, cookie flags, TLS) rather than relying on someone to remember.",
        "Run a configuration scanner in the pipeline, and treat a new finding as a build failure.",
      ],
    },

    history: [
      {
        year: 2003,
        title: "Born as a catch-all",
        text: "The first OWASP Top 10 listed \"Insecure Application Configuration\" at A4, alongside \"Error Handling Problems\" and \"Remote Administration Flaws\". These entries describe a situation rather than a bug class, which tells you the category has always been defined by what is left over when every specific flaw is accounted for.",
      },
      {
        year: 2007,
        title: "\"Improper Include/Execute of File\"",
        text: "The 2007 edition replaced the vague entry with \"Improper Include/Execute of File\". This is a regression in precision: the category no longer covered open buckets or default passwords, only a specific remote-file-inclusion bug, and it excluded the things the original entry was there to catch.",
      },
      {
        year: 2010,
        title: "Returns as Security Misconfiguration",
        text: "\"Security Misconfiguration\" is back at A6, restored to the broad meaning. The 2010 edition also listed \"Failure to Restrict URL Access\" separately, which is the same idea narrowed to one place: the path was reachable that should not have been.",
      },
      {
        year: 2013,
        title: "Rank 5, and 'default' removed",
        text: "\"Security Misconfiguration\" sat at A5. By this point the wording no longer mentioned defaults, because default credentials and sample applications had become a solved problem in most stacks - frameworks stopped shipping them - and the category had to move on to cloud storage permissions and verbose error output.",
      },
      {
        year: 2017,
        title: "Rank 6",
        text: "The category settled at A6, described as a catch-all for everything left to configuration. The significant change was not the rank but the scope: by 2017 \"using default credentials\" had effectively disappeared from real findings while public cloud misconfiguration was rising fast.",
      },
      {
        year: 2021,
        title: "A05, and a new category takes its old territory",
        text: "The identifier became A05. \"Insecure Design\" was introduced at A4, which pulls away the class of mistakes that configuration cannot fix - a missing rate limit or an un-thought business flow is a design decision, not a setting.",
      },
      {
        year: 2025,
        title: "Promoted to rank 2",
        text: "Security Misconfiguration moved to A02, ahead of Injection for the first time. The reason is the same reason it was ever a category: it is not one bug, it is every bug that arrives from a value somebody set and nobody reviewed. Modern platforms made configuration fragmented across a dozen services, so the amount of un-reviewed surface went up rather than down.",
      },
    ],

    diagram: {
      caption: "Enumeration, then one request that should never have worked",
      nodes: [
        { text: "Attacker enumerates paths on the host", tone: "attacker" },
        { text: "Directory listing returns real filenames", tone: "wire" },
        { text: "A path that was left enabled responds 200", tone: "danger" },
        { text: "The response is a stack trace or a sample app", tone: "danger" },
        { text: "Attacker learns the framework and its version", tone: "danger" },
        { text: "Attacker logs in with documented defaults", tone: "danger" },
        { text: "Fix: hardened defaults, no listing, no debug routes", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 1, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "headers",
      mode: "pick",
      title: "Where does the policy have to be applied?",
      prompt: "Pick the option that describes the actual defect, rather than a tidier-looking fix.",
      question:
        "The application sets `X-Frame-Options: SAMEORIGIN` on every route it renders. The edge proxy serves the 404 page, the 502 error page and every static file itself, and none of those responses carry the header. What is the defect?",
      options: [
        {
          text: "The policy is applied per-route in the app, so the responses the app never generates carry none of it. Move it to the edge, where every response passes.",
          note: "the coverage problem",
        },
        {
          text: "SAMEORIGIN is too strict for the public pages, so it should be replaced with 'none' on those routes.",
          note: "loosens the policy",
        },
        {
          text: "The header should be added to the HTML files themselves so the static responses pick it up.",
          note: "headers are a response concern",
        },
        {
          text: "X-Frame-Options is legacy, so it should be dropped as soon as frame-ancestors is added to the CSP.",
          note: "drops a working control",
        },
      ],
      answer: 0,
      why: {
        0: "Correct, and this is the shape most real misconfiguration takes: the control is right and the deployment is wrong. An attacker does not need your login page to be frameable, only any page you serve - so the 404 page is a perfectly good target, and it is exactly the page nobody tests. A policy applied per-route is only as good as the routes you remembered, and error pages and static assets are where the list runs out. Moving the policy to the edge means it applies to responses the application never wrote.",
        1: "This weakens the policy rather than fixing anything. 'none' is stricter than SAMEORIGIN, not looser - SAMEORIGIN already refuses every cross-origin parent, and 'none' additionally refuses your own pages. The header was not the problem; the responses that lacked it were.",
        2: "Response headers are set by whatever produces the response, and they cannot be embedded in a file. A static file served by the proxy is written by a build step, not by the framework that would emit the header, so the two cannot be reconciled at the file.",
        3: "Both are useful and they are not interchangeable. X-Frame-Options is kept for a long tail of clients that do not implement frame-ancestors, and sending it costs one header. Removing a control that is working, in order to add another that works in more places, is a downgrade until you have measured the clients you are dropping.",
      },
    },
  },

  /* ==========================================================
     2. OUTDATED & VULNERABLE COMPONENTS
     ========================================================== */
  {
    key: "outdated-components",
    title: "Outdated & Vulnerable Components",
    family: "platform",
    icon: "FaBoxes",
    severity: "high",
    tagline: "You did not choose most of the code you are running, and you cannot patch what you do not know about.",
    refs: [
      { src: "OWASP Top 10 2025", id: "A03 Software Supply Chain Failures" },
      { src: "OWASP Top 10 2021", id: "A06" },
      { src: "CWE", id: "CWE-1104" },
      { src: "MITRE ATT&CK", id: "T1195.001" },
      { src: "NIST", id: "SP 800-218" },
    ],
    cwe: { id: "CWE-1104", name: "Use of Unmaintained Third Party Components" },
    owaspConceptKey: "vulnerable-components",
    owaspYear: 2021,
    owaspId: "A06",

    explain: {
      what:
        "An application is mostly other people's code. A modern web app pulls in hundreds of packages, each of which pulls in more, and most of those arrive because something you chose depended on them. If a version deep in that tree has a known flaw, you are running it, and the only reliable defence is knowing which versions you have.",
      how:
        "The attack is not clever. The attacker takes a public advisory for a component, looks for the reachable code path, and sends the documented input at it. What makes this dangerous is the distance between the vulnerable code and the person responsible for it, and the two distinct questions an inventory has to answer: is a vulnerable version present (which a scanner can tell you) and is the vulnerable function actually called by this application (which a scanner usually cannot). Most \"we have a critical finding\" tickets are the first question, and most of them are not exploitable.",
      impact: [
        "A public exploit for a common library reaches every application that never upgraded it.",
        "Transitive code is invisible in a code review, so the dependency is usually a surprise rather than a decision.",
        "Unmaintained packages will never receive a fix, so the exposure is permanent and has to be removed, not patched.",
        "A single shared library in an internal monorepo can put the same flaw into dozens of products at once.",
      ],
      prevent: [
        "Maintain an inventory - an SBOM - generated automatically, so it reflects what is actually deployed.",
        "Track unmaintained packages as strictly as vulnerable ones; a package with no maintainer has no patch coming.",
        "Use reachability rather than raw version matching, so effort goes to code that runs.",
        "Automate the update path: lockfiles, automated pulls, and a build that fails on a policy violation rather than a reminder.",
      ],
    },

    history: [
      {
        year: 2013,
        title: "Enters as \"Using Components with Known Vulnerabilities\"",
        text: "The category appears at A9 in the 2013 edition, with a name that is exactly right: it does not claim your code is wrong, it claims you are using somebody else's code that is known to be wrong. The first edition of the list to talk about dependencies at all.",
      },
      {
        year: 2014,
        title: "The tooling arrives",
        text: "Automated dependency scanning and the first public vulnerability databases for open source packages mature around this period. The important shift is that knowing which versions you run stops being something a human remembers and becomes something a machine reports.",
      },
      {
        year: 2017,
        title: "Rank 9, renamed to \"Vulnerable and Outdated\"",
        text: "The 2017 edition renamed the category, which is a small change with a large consequence. \"Outdated\" brought in software with no vulnerability at all, and - more importantly - software with no maintainer left to write the fix when one appears.",
      },
      {
        year: 2021,
        title: "Rank 6, and maintainedness made explicit",
        text: "The category moved to A06 and its explanatory text called out unmaintained software directly, with a lifecycle argument rather than a patching one: the risk is not only what is broken today but what will never be fixed. Supply chain attention across the industry peaked the same year.",
      },
      {
        year: 2025,
        title: "Dissolved into Software Supply Chain Failures",
        text: "The 2025 edition removed this category as a standalone entry. Its content was reworked into A03 Software Supply Chain Failures, and the list's reasoning was that \"a vulnerable library\" is a supply chain problem, not an application problem - the trust is in the pipeline that selected the artifact, not in the version number.",
      },
      {
        year: 2025,
        title: "What dissolution means in practice",
        text: "The ranking is not the interesting part. The interesting part is that the list stopped asking whether a component is vulnerable and started asking whether the artifact should be trusted at all: who published it, was it built from reviewed source, was it signed, and did anything in the pipeline verify it. Inventory, patching and provenance are now one problem rather than two.",
      },
    ],

    diagram: {
      caption: "How a dependency nobody chose becomes the attack surface",
      nodes: [
        { text: "App depends on a library it never selected", tone: "neutral" },
        { text: "That library depends on a deeper package", tone: "neutral" },
        { text: "A public advisory names a vulnerable version", tone: "attacker" },
        { text: "Nobody runs an inventory, so nobody knows", tone: "app" },
        { text: "Attacker sends the documented payload", tone: "attacker" },
        { text: "The deep vulnerable function executes", tone: "danger" },
        { text: "Fix: SBOM inventory, reachability, automatic updates", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 0, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which line leaves the app exposed?",
      prompt: "A build script. One of these means the deployed artifact cannot be trusted.",
      language: "javascript",
      lines: [
        { text: "const lock = JSON.parse(fs.readFileSync('./package-lock.json'));" },
        { text: "const resolved = await fetch(libTarballUrl).then(r => r.arrayBuffer());" },
        { text: "execSync('npm install ' + depName);   // name from the request", vulnerable: true },
        { text: "fs.writeFileSync(target, Buffer.from(resolved));" },
      ],
      explain:
        "Line 3 builds a shell string out of a value from the request, so the shell metacharacters in depName become a second command. Lines 1, 2 and 4 are the parts of a supply chain that are worth scrutinising on their own - an unpinned tarball fetched by URL is exactly the integrity problem this module is about - but only line 3 is the injection. Worth noticing that the insecure-looking lines 1 and 2 are the ones a reviewer would argue about for hours.",
    },
  },

  /* ==========================================================
     3. SOFTWARE & DATA INTEGRITY FAILURES
     ========================================================== */
  {
    key: "integrity-failures",
    title: "Software & Data Integrity Failures",
    family: "platform",
    icon: "FaStamp",
    severity: "high",
    tagline: "The code and the data are trusted without asking who is allowed to change them.",
    refs: [
      { src: "OWASP Top 10 2025", id: "A08" },
      { src: "OWASP Top 10 2021", id: "A08" },
      { src: "CWE", id: "CWE-494" },
      { src: "MITRE ATT&CK", id: "T1195.002" },
    ],
    cwe: { id: "CWE-494", name: "Download of Code Without Integrity Check" },
    owaspConceptKey: "integrity-failures",
    owaspYear: 2021,
    owaspId: "A08",

    explain: {
      what:
        "This is a category about trust rather than about cryptography. The application loads code, a plugin, a package or a configuration document, and treats it as correct because it arrived. Nothing in the loading step establishes who put it there, so anybody who can influence the source can decide what runs.",
      how:
        "The common path is a download. An update is fetched from a URL, written to disk, and executed, with no signature check and no pinned hash - so whoever can serve that response controls the code, whether that is a compromised CDN, a hijacked DNS answer, or a typo in a mirror. The data-side twin is the same mistake in a different medium: a document or object that carries instructions, or a CI pipeline that runs a pipeline file and a dependency list that arrived as unreviewed text. A hash only helps if the hash is known-good out of band, because a hash served by the same attacker-controlled endpoint protects nothing.",
      impact: [
        "Remote code execution with the privileges of the process, achieved by changing bytes rather than by exploiting a bug in code.",
        "Persistence that survives a restart, because the trusted artifact is the artifact that loads every time.",
        "A compromised build pipeline turns every downstream product into a delivery mechanism at once.",
        "Data-side variants poison decisions rather than run code: a rendered template, a rules engine, or a deserialized object can be made to act.",
      ],
      prevent: [
        "Verify signatures from a pinned key, not just hashes fetched alongside the artifact.",
        "Pin dependencies by version and integrity, and fail the build when the hash does not match.",
        "Review changes to pipeline definitions and lockfiles the way you review application code.",
        "Treat every document that can influence execution as untrusted input, which is what the deserialization module is about.",
      ],
    },

    history: [
      {
        year: 2003,
        title: "The capability exists before the category",
        text: "Every packaging and update mechanism of the era could fetch code by URL. Signing tools existed - they are how package repositories signed releases - but the practice of verifying on the consuming side was rare, so the trust was implicit in the URL.",
      },
      {
        year: 2017,
        title: "The data-side twin named",
        text: "The 2017 edition introduced \"Insecure Deserialization\" at A8. It is the same trust failure as this category, applied to data instead of code: a byte string is assumed to reconstruct exactly the structure the author intended, so the format becomes an instruction channel.",
      },
      {
        year: 2020,
        title: "Lockfiles become the norm",
        text: "Package manager lockfiles, which record an integrity hash for every resolved dependency, become a default feature across ecosystems. This is the most effective integrity control ever shipped and it is entirely unremarkable - the hash is pinned in a file that goes through code review.",
      },
      {
        year: 2021,
        title: "A brand new category at A08",
        text: "\"Software and Data Integrity Failures\" appears for the first time as its own entry, covering updates, plugins, CI/CD pipelines and deserialisation. Its existence is a statement that trust in artifacts had become a distinct problem from trust in code, and that a category for it was missing.",
      },
      {
        year: 2021,
        title: "The pipeline becomes the target",
        text: "Attention shifts from the application to the build. A pipeline that pulls dependencies and runs scripts on every commit has the credentials of the whole organisation and the ability to change what everybody else receives, which makes it the highest-leverage place to break integrity.",
      },
      {
        year: 2025,
        title: "A08, renamed and reworded",
        text: "The 2025 edition keeps the category at A08 as \"Software or Data Integrity Failures\" - a one-word change that makes the disjunction explicit. Alongside it, A03 Software Supply Chain Failures now owns provenance and build trust, so the two categories divide the question: A08 is about verifying what you received, A03 is about who was allowed to produce it.",
      },
    ],

    diagram: {
      caption: "Changing the artifact instead of attacking the code",
      nodes: [
        { text: "Application fetches an update from a URL", tone: "app" },
        { text: "The URL is resolved and the bytes are written", tone: "wire" },
        { text: "No signature or pinned hash is verified", tone: "danger" },
        { text: "Attacker controls the endpoint or the DNS answer", tone: "attacker" },
        { text: "Attacker serves a modified artifact", tone: "attacker" },
        { text: "The modified code runs with app privileges", tone: "danger" },
        { text: "Fix: verify a signature against a pinned key", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 3, to: 4 },
        { from: 2, to: 4, label: "unverified" },
        { from: 4, to: 5 },
        { from: 2, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which line makes the check worthless?",
      prompt: "An update verifier. It looks correct, and it is not.",
      language: "javascript",
      lines: [
        { text: "const data = await fetch(manifest.url).then(r => r.arrayBuffer());" },
        { text: "const digest = crypto.createHash('sha256').update(data).digest('hex');" },
        { text: "if (digest !== manifest.expected) throw new Error('bad artifact');", vulnerable: true },
        { text: "fs.writeFileSync(target, Buffer.from(data));" },
      ],
      explain:
        "The hash is computed correctly and compared correctly - the problem is where expected comes from. It was fetched from the same response as the artifact, so an attacker who can change the artifact changes the expected value too, and the check always passes. Integrity is only meaningful against a value that was known-good beforehand, which means a pinned key or a hash committed to the repository.",
    },
  },

  /* ==========================================================
     4. CRYPTOGRAPHIC FAILURES
     ========================================================== */
  {
    key: "crypto-weakness",
    title: "Cryptographic Failures",
    family: "platform",
    icon: "FaLock",
    severity: "high",
    tagline: "Two different failures under one name: no cryptography where there must be, and bad cryptography where there is.",
    refs: [
      { src: "OWASP Top 10 2025", id: "A04" },
      { src: "OWASP Top 10 2021", id: "A02" },
      { src: "CWE", id: "CWE-327" },
      { src: "MITRE ATT&CK", id: "T1552.001" },
      { src: "NIST", id: "SP 800-131A" },
    ],
    cwe: { id: "CWE-327", name: "Use of a Broken or Risky Cryptographic Algorithm" },
    owaspConceptKey: "insecure-cryptography",
    owaspYear: 2021,
    owaspId: "A02",

    explain: {
      what:
        "Half of this category is data nobody protected: a password column in plain text, a backup on a shared drive, a session token in a URL. The other half is data protected badly: a fast hash for passwords, ECB mode for structured data, a hard-coded key, a homebrew cipher. The common cause is treating a cryptographic library as something that makes any scheme safe.",
      how:
        "The password case is the one worth understanding in detail. Password hashes must be deliberately slow, because slowness is the entire cost model - it is what makes guessing expensive. A general-purpose hash is fast, which is exactly wrong here: a fast hash lets an attacker try billions of candidates per second against a stolen table. That is why Argon2id, scrypt and bcrypt exist, and why the guidance is a memory-hard function plus a unique salt per user so that identical passwords do not produce identical hashes. For data at rest the question is different - it is whether the mode leaks structure and whether the key is anywhere an attacker can reach.",
      impact: [
        "A stolen credential table is cracked far faster than the design assumed, and reuse turns one breach into many.",
        "Plaintext or weakly-encrypted personal data is readable by anyone who gets the file, with no brute force required.",
        "A key committed to a repository is a permanent leak, because the history keeps it even after the code is fixed.",
        "ECB mode leaks the equality and repetition of plaintext blocks, so structured data becomes readable from ciphertext alone.",
      ],
      prevent: [
        "Hash passwords with a memory-hard function and a unique per-user salt; never a general-purpose digest.",
        "Use authenticated encryption with a fresh nonce per encryption, and never reuse a nonce with the same key.",
        "Keep keys out of source and out of images, in a secrets manager, and rotate them on a schedule rather than on incident.",
        "Use TLS 1.2 or later, and prefer the platform's vetted TLS and password libraries over anything written in-house.",
      ],
    },

    history: [
      {
        year: 1995,
        title: "The hash function becomes the target",
        text: "MD5 is designed to be fast, which is what makes it useful for checksums and exactly what makes it wrong for passwords. The collision weakness published for MD5 in this period did not break every use of it at once; it took years for the message to land, and it is still routinely misapplied to integrity checks.",
      },
      {
        year: 2010,
        title: "Enters as \"Insecure Cryptographic Storage\"",
        text: "\"Insecure Cryptographic Storage\" appears at A7. The framing is about storage specifically, and the practical meaning was data at rest sitting in the database with no protection, so a database dump was enough to read everything.",
      },
      {
        year: 2013,
        title: "Broadens to \"Sensitive Data Exposure\"",
        text: "The 2013 edition renamed the category and moved it to A6, dropping \"cryptographic\" entirely. The reason is that the common failure was not a weak cipher - it was the sensitive data being reachable at all, over HTTP, in a URL, in a log file, in a backup.",
      },
      {
        year: 2017,
        title: "Rank 3, and transport folded in",
        text: "\"Sensitive Data Exposure\" moved to A3, making it the highest-ranked category that is not a specific vulnerability. It is a list entry about data handling, and it is ranked high because it is a precondition for so many other findings: leaks that start here never show up anywhere else.",
      },
      {
        year: 2021,
        title: "Becomes Cryptographic Failures at A02",
        text: "The category reverted to a cryptographic name at A02, explicitly covering both halves - the 2021 text notes it includes missing cryptography as well as weak cryptography. This is the modern, accurate framing: the interesting failures are the design choices, not just the storage.",
      },
      {
        year: 2025,
        title: "A04",
        text: "The category sits at A04 in the 2025 edition, below Broken Access Control and Security Misconfiguration. Post-quantum migration work through this period changed the practical advice on algorithm choice and key sizes, and the guidance is now versioned - NIST SP 800-131A is retired and superseded, and advice is expressed as a transition process rather than a fixed list of approved algorithms.",
      },
    ],

    diagram: {
      caption: "How a stolen table becomes plaintext passwords",
      nodes: [
        { text: "Attacker obtains the user table from a backup", tone: "attacker" },
        { text: "The password column is a fast general-purpose hash", tone: "app" },
        { text: "The design assumed a hash was protection", tone: "app" },
        { text: "Attacker guesses billions of candidates per second", tone: "attacker" },
        { text: "Fast hash makes guessing cheap, not expensive", tone: "danger" },
        { text: "Most real passwords are recovered within hours", tone: "danger" },
        { text: "Fix: Argon2id, scrypt or bcrypt, salt per user", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4, label: "the flaw" },
        { from: 4, to: 5 },
        { from: 1, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which line makes the passwords cheap to crack?",
      prompt: "A password storage routine. One line is the actual vulnerability.",
      language: "javascript",
      lines: [
        { text: "const hash = crypto.createHash('sha256').update(password).digest('hex');", vulnerable: true },
        { text: "const salt = crypto.randomBytes(16);" },
        { text: "const stored = await db.users.update({ password_hash: hash, salt });" },
        { text: "return { ok: true };" },
      ],
      explain:
        "SHA-256 is a general-purpose digest, optimised to be fast, and for passwords that is the wrong property - speed is the attacker's budget. Argon2id, scrypt or bcrypt with the per-user salt from line 2 would be the fix. Note that the salt is generated correctly and stored correctly, so this looks careful; the salt only stops identical passwords hashing identically and rainbow tables, and it does nothing about a fast digest.",
    },
  },

  /* ==========================================================
     5. JWT & TOKEN VALIDATION FLAWS
     ========================================================== */
  {
    key: "jwt",
    title: "JWT & Token Validation Flaws",
    family: "platform",
    icon: "FaLink",
    severity: "high",
    tagline: "A JWT is signed, not encrypted, and the header inside it says how to verify it.",
    refs: [
      { src: "OWASP Top 10 2025", id: "A07" },
      { src: "OWASP Top 10 2021", id: "A07" },
      { src: "CWE", id: "CWE-347" },
      { src: "RFC", id: "RFC 8725" },
      { src: "MITRE ATT&CK", id: "T1550.001" },
    ],
    cwe: { id: "CWE-347", name: "Improper Verification of Cryptographic Signature" },
    owaspConceptKey: "broken-authentication",
    owaspYear: 2021,
    owaspId: "A07",

    explain: {
      what:
        "A JWT is three base64url strings separated by dots: header, payload, signature. Anyone can read the header and the payload, so a token is not a secret container. What makes it trustworthy is the signature, and the verification step is where almost every serious JWT bug lives.",
      how:
        "The header declares the algorithm, and the classic flaw is trusting that declaration. If the server reads alg from the token and picks a verifier accordingly, an attacker can present a token with alg set to none and no signature at all, or change RS256 to HS256 and then sign it using the server's public key as the HMAC secret - which is public information, so the forged token verifies. The 2020 best-current-practice document exists to close exactly this: the algorithm must be fixed by configuration on the server, never read from the token. Beyond that, exp, nbf, iss and aud all have to be checked by the party that depends on them, and a gateway that verifies tokens for downstream services must be the one that the resource server actually trusts.",
      impact: [
        "Full authentication bypass: a forged token with an arbitrary payload is accepted as genuine.",
        "Privilege escalation, by putting an admin role in a payload that verifies correctly.",
        "A confused-deputy flaw where a token valid for one audience is honoured by another service.",
        "Long-lived tokens with no revocation turn a single leak into permanent access.",
      ],
      prevent: [
        "Fix the expected algorithm in server configuration; never select the verifier from the token header.",
        "Verify the signature, and check exp, nbf, iss and aud in code, on every request that depends on the token.",
        "Keep token lifetimes short and implement revocation or rotation rather than issuing tokens that live for a day.",
        "Distribute keys through a JWKS with a kid, and support rotation so old keys can be retired deliberately.",
      ],
    },

    history: [
      {
        year: 2015,
        title: "RFC 7519",
        text: "JSON Web Token is standardised, solving a real problem: passing claims between services without a shared session store. The design is deliberately minimal, and one property is stated plainly in the specification - the payload is signed but not encrypted, so its contents are readable by anyone holding the token.",
      },
      {
        year: 2016,
        title: "The ecosystem consolidates around OAuth 2.0",
        text: "JWT becomes the normal format for OAuth 2.0 access tokens and OpenID Connect ID tokens. This is where the design meets a much larger body of implementers than the specification anticipated, and where a family of verification bugs becomes common rather than theoretical.",
      },
      {
        year: 2018,
        title: "RFC 8725 - a best current practice for JWT",
        text: "A best-current-practice document is published specifically because the algorithm-negotiation problem was not going to be fixed in the core specification. It is short and prescriptive, and the headline guidance is the one that matters: perform algorithm verification with the algorithms the application expects, not with the ones the token requests.",
      },
      {
        year: 2020,
        title: "Algorithm confusion becomes the signature JWT flaw",
        text: "The RS256-to-HS256 substitution and the alg:none acceptance get wide coverage as the canonical JWT vulnerability. The confusion is subtle because both halves are legitimate: the asymmetric public key is public by design, and HMAC is a legitimate algorithm, and nothing about either is wrong until one is used as the other.",
      },
      {
        year: 2021,
        title: "Token flaws land in the authentication category",
        text: "OWASP A07 Identification and Authentication Failures absorbs JWT validation, on the reasoning that failing to verify a credential is an authentication failure regardless of the credential's format. The category's own guidance moved towards short-lived, scoped tokens over long-lived bearer tokens.",
      },
      {
        year: 2025,
        title: "Access tokens get their own profile, and the caveat set is real",
        text: "RFC 9068 standardises a JWT profile for OAuth 2.0 access tokens so that validators have one defined format rather than many. Alongside it, RFC 9700 (published January 2025) codifies OAuth 2.0 security best practice, and the wider conversation is about the limits of the bearer-token model itself: a token is a password that travels, and most deployments still have no way to know it leaked.",
      },
    ],

    diagram: {
      caption: "The token tells the server how to verify it, and the server listens",
      nodes: [
        { text: "Attacker takes a valid token and decodes the header", tone: "attacker" },
        { text: "Attacker rewrites alg as HS256 in the header", tone: "attacker" },
        { text: "Attacker signs the payload with the public key", tone: "attacker" },
        { text: "Server reads alg from the token and picks a verifier", tone: "app" },
        { text: "Server verifies with HMAC using the public key", tone: "danger" },
        { text: "Forged token accepted, role claim trusted", tone: "danger" },
        { text: "Fix: pin the expected algorithm in server config", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 4 },
        { from: 3, to: 4, label: "trusts the token" },
        { from: 4, to: 5 },
        { from: 3, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which line is the whole vulnerability?",
      prompt: "A JWT verification function. Four lines, one critical mistake.",
      language: "javascript",
      lines: [
        { text: "const [h, p, s] = token.split('.');" },
        { text: "const header = JSON.parse(Buffer.from(h, 'base64url').toString());" },
        { text: "const verifier = algs[header.alg];        // chosen by the token", vulnerable: true },
        { text: "if (verifier.verify(signingKey, `${h}.${p}`, s)) return JSON.parse(Buffer.from(p, 'base64url').toString());" },
      ],
      explain:
        "Line 3 takes the algorithm from the untrusted token, so the attacker chooses the verification method. With alg set to HS256 the signature is an HMAC and line 4 uses signingKey as the HMAC secret - and if signingKey is the RSA public key, the public key is not a secret, so the attacker can produce a valid signature. The fix is a hard-coded expected algorithm that is compared against the header rather than looked up, exactly as RFC 8725 requires.",
    },
  },

  /* ==========================================================
     6. HTTP REQUEST SMUGGLING
     ========================================================== */
  {
    key: "request-smuggling",
    title: "HTTP Request Smuggling",
    family: "platform",
    icon: "FaProjectDiagram",
    severity: "high",
    tagline: "A proxy and a server disagree about where one request ends, so the leftover becomes part of somebody else's.",
    refs: [
      { src: "CWE", id: "CWE-444" },
      { src: "CWE", id: "CWE-441" },
      { src: "RFC", id: "RFC 9112" },
      { src: "MITRE ATT&CK", id: "T1190" },
    ],
    cwe: { id: "CWE-444", name: "Inconsistent Interpretation of HTTP Requests ('Request Smuggling')" },

    explain: {
      what:
        "HTTP/1.1 allows two different ways to say how long a request is: a Content-Length header, or chunked Transfer-Encoding. When a request carries both, or two conflicting Content-Length headers, or a Transfer-Encoding header written in a form that one layer ignores and another honours, the front end and the back end can each pick a different answer. That disagreement is the vulnerability.",
      how:
        "Here is the mechanism end to end. The attacker sends a request where the two layers disagree about the body length, so the front end forwards the request plus a prefix of the attacker's body, and the back end stops parsing earlier than the front end did. The bytes the back end did not consume are left in its connection buffer. The front end now believes the connection is clean and sends the next user's request down it - and the back end reads that unconsumed attacker prefix as the start of it. The result is that part of the attacker's request is executed inside the next user's session. The same disagreement used against a cache instead stores a poisoned response that is served to everyone.",
      impact: [
        "One user's request is executed in another user's session, so the attacker inherits that session's cookies and identity.",
        "Front-end security controls are bypassed, because the back end sees a request the front end never inspected.",
        "Web cache poisoning, where an attacker's response is cached and served to every later visitor.",
        "Response queue poisoning and denial of service, when many requests get desynchronised at once.",
      ],
      prevent: [
        "Reject any request containing both Content-Length and Transfer-Encoding, rather than guessing which is meant.",
        "Run the same strict parser at every layer, and prefer an RFC 9112 implementation that rejects duplicate and malformed length headers.",
        "Normalise the message once, at the edge, so what one layer forwards is unambiguous to the next.",
        "Note that HTTP/2 removes the CL/TE ambiguity but not the class of bug: stream and connection-level desynchronisation still needs careful normalisation.",
      ],
    },

    history: [
      {
        year: 1996,
        title: "HTTP/1.0 and the one-length rule",
        text: "HTTP/1.0 had a single way to delimit a message body, so the framing was simple and the ambiguity did not exist. Every smuggling technique below depends on there being more than one way to express a length.",
      },
      {
        year: 1997,
        title: "HTTP/1.1 and two ways to express a length",
        text: "HTTP/1.1 keeps Content-Length and adds Transfer-Encoding for streams of unknown length. This is the origin of the entire problem class: the specification allows a message to contain both, and it tells implementations to prefer Transfer-Encoding, but \"prefer\" is an instruction to guess, and a parser that guesses differently from the layer in front of it is exploitable by construction.",
      },
      {
        year: 2010,
        title: "\"Insufficient Transport Layer Protection\"",
        text: "The 2010 OWASP Top 10 listed transport protection at A9. Not the same bug, but the same underlying attitude: the boundary between two implementations is assumed to agree. Smuggling needs two layers that each think they are talking to the same peer.",
      },
      {
        year: 2013,
        title: "The first public web-specific smuggling research",
        text: "Public research on smuggling in front-end-proxy deployments appears, establishing the CL.TE and TE.CL patterns as the two canonical cases. The finding was notable less for novelty than for reach: every topology with a CDN, a reverse proxy and an application server has at least one pair of implementations that can disagree.",
      },
      {
        year: 2019,
        title: "Transfer-Encoding obfuscation",
        text: "Researchers publish a broader set of techniques for smuggling without a simple CL/TE disagreement, including duplicate Transfer-Encoding headers and header values with odd whitespace or character variations. The practical effect is that a filter which only looks for a second TE header, or only looks for the word chunked, can be bypassed without changing the payload at all.",
      },
      {
        year: 2020,
        title: "Widespread disclosure and a standards fix",
        text: "Smuggling receives wide public disclosure, and the response at the specification level is to remove the guesswork: HTTP/1.1 messages containing both a Content-Length and a Transfer-Encoding, or invalid or multiple Content-Length values, must be treated as errors rather than resolved by preference. Implementations that ignore this remain exploitable by exactly the same payloads.",
      },
      {
        year: 2022,
        title: "RFC 9112 makes the rule normative",
        text: "HTTP semantics is split up, and RFC 9112 becomes the normative description of HTTP/1.1 message syntax, carrying the rejection rules forward as a requirement rather than advice. Desynchronisation as a category does not go away, because proxies and origin servers are still separate parsers written in different languages by different people.",
      },
    ],

    diagram: {
      caption: "Where the leftover bytes go",
      nodes: [
        { text: "Attacker sends CL and TE that disagree", tone: "attacker" },
        { text: "Front end honours TE, reads a short body", tone: "wire" },
        { text: "Back end honours CL, stops parsing later", tone: "app" },
        { text: "Unconsumed bytes sit in the back-end buffer", tone: "danger" },
        { text: "Front end sends the next real user request", tone: "wire" },
        { text: "Back end prepends the attacker's leftover bytes", tone: "danger" },
        { text: "The attacker's request runs in that user's session", tone: "danger" },
        { text: "Fix: reject ambiguous messages, normalise once", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 3 },
        { from: 0, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 5 },
        { from: 4, to: 5, label: "next user" },
        { from: 5, to: 6 },
        { from: 0, to: 7, label: "the fix" },
      ],
    },

    puzzle: {
      type: "headers",
      mode: "sort",
      title: "Put the mitigation in the order it happens",
      prompt: "Drag these into the order a correct edge proxy must apply them, earliest first.",
      items: [
        { text: "Reject the request outright", why: "the messages that are ambiguous are errors, not something to resolve - RFC 9112 makes this a requirement" },
        { text: "Parse the message once, strictly", why: "a single RFC 9112 implementation decides the framing, so there is only one answer to work with" },
        { text: "Drop any Content-Length or Transfer-Encoding the parser did not use", why: "the downstream must not see a length header the edge layer ignored, or it will re-disagree" },
        { text: "Forward the normalised request to the origin", why: "the origin now receives something unambiguous and cannot reach a different conclusion" },
      ],
      order: [1, 2, 0, 3],
    },
  },

  /* ==========================================================
     7. GRAPHQL & API ABUSE
     ========================================================== */
  {
    key: "graphql-api",
    title: "GraphQL & API Abuse",
    family: "platform",
    icon: "FaHashtag",
    severity: "high",
    tagline: "One endpoint that accepts a whole document turns many small checks into one large hole.",
    refs: [
      { src: "OWASP API Security Top 10 2023", id: "API1:2023 Broken Object Level Authorization" },
      { src: "OWASP API Security Top 10 2023", id: "API4:2023 Unrestricted Resource Consumption" },
      { src: "OWASP Top 10 2025", id: "A01" },
      { src: "CWE", id: "CWE-770" },
      { src: "MITRE ATT&CK", id: "T1190" },
    ],
    cwe: { id: "CWE-770", name: "Allocation of Resources Without Limits or Throttling" },

    explain: {
      what:
        "REST moves work into fixed paths that were designed and reviewed one at a time. GraphQL accepts a document and does whatever it asks, so the client chooses the shape, the depth and the number of fields in a single request. The result is that access control, cost and rate limiting all have to be enforced per request against a structure the server did not write.",
      how:
        "There are three distinct problems. The first is cost: a small query can name a field that resolves through several relationships, and a client can nest that pattern deeply enough to turn one HTTP request into millions of database lookups, so the fix is a depth and complexity limit computed before execution, not a timeout afterwards. The second is authorisation: a resolver that returns a record by id without checking whose record it is reintroduces IDOR inside a schema that looks carefully typed, and aliasing lets the client fetch many such fields while the server sees what looks like a single ordinary operation. The third is batching, where an array of many operations in one request defeats any limit that counts requests. Introspection is the fourth, and the simplest: it hands over the full schema, which is a map of the application.",
      impact: [
        "Denial of service from a single small request, because depth multiplies work rather than adding to it.",
        "Unauthorised data access through a resolver that returns any object the client asks for by id.",
        "Rate limits bypassed by batching many operations into one HTTP request.",
        "Introspection in production hands an attacker the complete schema to plan against.",
      ],
      prevent: [
        "Enforce authorisation in the resolver, against the current user, for every field that returns a record - not once at the entry point.",
        "Set query depth and complexity limits and evaluate them before execution, then throttle by cost rather than by request count.",
        "Disable introspection in production, or gate it behind authentication, and do not treat it as a security control on its own.",
        "Watch the API Security Top 10 as a separate list from the Top 10 - the two overlap but do not line up, and this category is where that shows most.",
      ],
    },

    history: [
      {
        year: 2012,
        title: "GraphQL is published",
        text: "A query language and runtime designed in the same period as the shift to mobile-first front ends. The motivation is efficiency: a mobile client declares the fields it needs, so a REST endpoint stops shipping fields nobody reads. The cost is that the server stops knowing the shape of the request in advance.",
      },
      {
        year: 2015,
        title: "Introspection in production",
        text: "Introspection, the query that describes the entire schema, is a headline feature. It is enormously useful for tooling and, deployed carelessly, it is a complete map of the application including every field name and type. Turning it off by default in production took years to become normal practice rather than a hardening recommendation.",
      },
      {
        year: 2017,
        title: "Query cost as a denial of service vector",
        text: "The recursive field-resolution problem becomes well understood: a query that is a few kilobytes of text can describe a pattern that expands into a very large number of backend operations. The resulting defence - a depth and complexity limit, or the alias-based rate limiting that counts the cost of the resolved document rather than the request - is now standard in GraphQL-aware gateways.",
      },
      {
        year: 2019,
        title: "Authorization moves into resolvers",
        text: "The industry's answer to GraphQL authorisation is that the entry point is the wrong place to check. One query can request many fields belonging to different owners, so a single check before execution cannot know whether the whole document is permitted. Field-level authorisation in each resolver becomes the accepted pattern, and it is a large amount of repetitive code - which is why it is often skipped.",
      },
      {
        year: 2023,
        title: "The OWASP API Security Top 10",
        text: "OWASP publishes a separate list for API security, and the first edition places broken object-level authorisation at API1:2023 and unrestricted resource consumption at API4:2023. Having a distinct list is the important development: the classic Top 10 is organised around a web application, and an API that authenticates every request and authorises none of its fields is not well described by it.",
      },
      {
        year: 2025,
        title: "The gateway becomes the boundary",
        text: "As GraphQL endpoints are consolidated behind a gateway that serves the schema to many teams, the gateway inherits the job of a new trust boundary. Schema composition, persisted queries and cost analysis all move into the gateway, which is where the practical control now lives - and where a single misconfiguration exposes every downstream service at once.",
      },
    ],

    diagram: {
      caption: "One small document, a very large amount of work",
      nodes: [
        { text: "Attacker sends a deeply nested query", tone: "attacker" },
        { text: "A field resolves through several relationships", tone: "app" },
        { text: "Depth multiplies instead of adding", tone: "danger" },
        { text: "The server fans out into millions of lookups", tone: "danger" },
        { text: "One request consumes the whole worker pool", tone: "danger" },
        { text: "Legitimate users get no response at all", tone: "danger" },
        { text: "Fix: depth and complexity limits, cost-based throttle", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2, label: "nesting" },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 0, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "payload",
      title: "Payload Workshop: which query is the expensive one?",
      prompt:
        "The same three resources, written four ways. Only one of these crosses the depth limit that should be set on this endpoint. Pick it, then say whether a per-request rate limit helps.",
      base:
        "POST /graphql HTTP/1.1\nContent-Type: application/json\n\n{\"query\":\"{ {slot} }\"}",
      slot: "query",
      options: [
        { text: "user { id name }", note: "two scalar fields, one resolver call" },
        { text: "user { id posts { id author { id } } }", note: "three levels, a small fixed multiple" },
        { text: "user { posts { author { posts { author { posts { id } } } } } }", note: "the pattern repeats on the way down and back up" },
        { text: "user { id } ", note: "one field, the cheapest possible query" },
      ],
      answer: 2,
      why: {
        0: "Correctly written and correctly scoped. Two scalar fields on one resolver is the shape the endpoint was designed for, and it costs almost nothing.",
        1: "Three levels is a normal, small multiple of the work. This is the deepest query an endpoint with a depth limit of four or five will accept, and it is what a real client sends.",
        2: "This is the one. The user-to-posts-to-author relationship is cyclic, so each level of nesting multiplies into another pass over the same two tables. A document a few hundred characters long expands into an enormous number of operations, and it is the only option here that a depth or complexity limit evaluated before execution would reject.",
        3: "Also valid and also cheap. Including it as a fourth option is deliberate: the trap in this question is assuming the dangerous query is a long one, when length and cost are unrelated.",
      },
      check: {
        prompt: "The endpoint has a rate limit of 60 requests per minute. Does that stop this?",
        answer: false,
        why: "No, and this is the whole point of cost-based limiting. A rate limit counts requests, and this attack spends one request. The fix has to evaluate the depth or complexity of the document before execution and reject or charge the request according to that number - which is the difference between a per-request limit and a per-cost limit.",
      },
    },
  },
];

export default platformModules;
