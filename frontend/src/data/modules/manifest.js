/**
 * ============================================================
 * MODULE MANIFEST  -  GENERATED, DO NOT EDIT
 * ------------------------------------------------------------
 * Written by scripts/build-manifest.mjs from the five family files.
 * Run `npm run manifest` after changing any module, and
 * `npm run smoke` to prove this file still matches its source.
 *
 * This is the light half of the catalogue. It carries what the
 * sidebar, the home page and the catalogue index need - and the
 * pre-lowercased search string, so search still reaches into the
 * impact bullets and the reference ids - without the lesson prose. A
 * module page loads its own family on demand.
 * ============================================================ */

export const MANIFEST_FAMILIES = [
  {
    id: "injection",
    label: "Injection",
    blurb: "Untrusted text handed to an interpreter that cannot tell data from instructions. The shell, the database and the template engine all fall for the same mistake.",
    modules: [
      {
        key: "sql-injection",
        title: "SQL Injection",
        family: "injection",
        icon: "FaDatabase",
        severity: "critical",
        tagline: "One line that builds a query by gluing strings together lets a stranger read your database.",
        historyCount: 10,
        refCount: 4,
        cwe: "CWE-89",
        search: "sql injection one line that builds a query by gluing strings together lets a stranger read your database. cwe-89 improper neutralization of special elements used in an sql command injection read any table the application account can reach, including other users' password hashes. bypass the login form entirely without knowing any password. change or delete data if the database account has write permission. in poorly configured databases, escalate to reading files or running operating system commands. owasp top 10 2025 a05 injection owasp top 10 2021 a03 injection cwe cwe-89 mitre att&ck t1190 exploit public-facing application",
      },
      {
        key: "xss",
        title: "Cross-Site Scripting (XSS)",
        family: "injection",
        icon: "FaCode",
        severity: "high",
        tagline: "The victim runs the attacker's code, in the victim's own logged-in session.",
        historyCount: 8,
        refCount: 4,
        cwe: "CWE-79",
        search: "cross-site scripting (xss) the victim runs the attacker's code, in the victim's own logged-in session. cwe-79 improper neutralization of input during web page generation injection read cookies and anything the session token gives access to, without needing the password. act as the victim: change settings, approve a payment, post in their name. read the page the victim can see, including data only their account is allowed to load. rewrite the page to show a convincing fake login form and harvest the password directly. owasp top 10 2025 a05 injection owasp top 10 2017 a7 cwe cwe-79 mitre att&ck t1059.007 javascript",
      },
      {
        key: "command-injection",
        title: "OS Command Injection",
        family: "injection",
        icon: "FaTerminal",
        severity: "critical",
        tagline: "The server runs a shell command that the user helped to write.",
        historyCount: 7,
        refCount: 4,
        cwe: "CWE-78",
        search: "os command injection the server runs a shell command that the user helped to write. cwe-78 improper neutralization of special elements used in an os command injection read any file the service account can read, including private keys and environment secrets. full remote code execution on the server, with the privileges of the web process. pivot to internal hosts that are not exposed to the internet at all. destroy data, or be used as a jump host to attack other machines in the same network. owasp top 10 2025 a05 injection owasp top 10 2003 a6 cwe cwe-78 mitre att&ck t1059 command and scripting interpreter",
      },
      {
        key: "ssti",
        title: "Server-Side Template Injection",
        family: "injection",
        icon: "FaSitemap",
        severity: "critical",
        tagline: "The template engine itself is the interpreter, and it can reach further than the page.",
        historyCount: 6,
        refCount: 5,
        cwe: "CWE-1336",
        search: "server-side template injection the template engine itself is the interpreter, and it can reach further than the page. cwe-1336 improper neutralization of special elements used in a template engine injection remote code execution on the server, with the privileges of the application. read configuration and source, including database credentials held in the environment. server-side template injection in a pdf or email generator often also means reading local files. because it happens server-side, no browser protection applies: there is no victim to protect. owasp top 10 2025 a05 injection owasp top 10 2021 a03 injection cwe cwe-1336 mitre att&ck t1059 command and scripting interpreter owasp cheat sheet server side template injection prevention",
      },
    ],
  },
  {
    id: "identity",
    label: "Identity & Access",
    blurb: "Who you are, what you may touch, and how long that proof stays valid. Most of the findings here are a missing check rather than a broken one.",
    modules: [
      {
        key: "idor",
        title: "IDOR & Broken Object-Level Authorization",
        family: "identity",
        icon: "FaFolderOpen",
        severity: "critical",
        tagline: "The server proves who you are, then serves the object you asked for without asking whether it is yours.",
        historyCount: 7,
        refCount: 5,
        cwe: "CWE-639",
        search: "idor & broken object-level authorization the server proves who you are, then serves the object you asked for without asking whether it is yours. cwe-639 authorization bypass through user-controlled key identity read another user's invoices, addresses, uploaded documents or medical details using an account of your own. change or delete objects you do not own whenever the same handler serves the write path. vertical escalation: a normal account reaches administrative endpoints and whatever data sits behind them. one missing check exposes every object of that type, so a single endpoint is often the whole attack surface. owasp top 10 2010 a4 insecure direct object references owasp top 10 2021 a01 broken access control cwe cwe-639 cwe cwe-862 mitre att&ck t1190 exploit public-facing application",
      },
      {
        key: "broken-auth",
        title: "Broken Authentication",
        family: "identity",
        icon: "FaUserLock",
        severity: "critical",
        tagline: "Authentication is a lifecycle, and the parts outside the login form are where it usually fails.",
        historyCount: 8,
        refCount: 8,
        cwe: "CWE-287",
        search: "broken authentication authentication is a lifecycle, and the parts outside the login form are where it usually fails. cwe-287 improper authentication identity an attacker signs in as a real user using a password pair from an unrelated breach, with no technical skill required at all. password reset becomes account takeover when the token is guessable, long-lived, or still valid after it has been used. the login endpoint can be turned into a username oracle, which supplies targets for the next round of attempts and for phishing. a second factor can be spammed at the user until they approve it, or skipped entirely by a flow that treats the password step as the whole login. owasp top 10 2021 a07 identification and authentication failures owasp top 10 2017 a2 broken authentication cwe cwe-287 cwe cwe-307 cwe cwe-640 mitre att&ck t1110 brute force mitre att&ck t1078 valid accounts nist sp 800-63b digital identity guidelines",
      },
      {
        key: "session-management",
        title: "Session Management Flaws",
        family: "identity",
        icon: "FaIdCard",
        severity: "high",
        tagline: "The session token is the credential, so it has to be protected like a password.",
        historyCount: 7,
        refCount: 7,
        cwe: "CWE-384",
        search: "session management flaws the session token is the credential, so it has to be protected like a password. cwe-384 session fixation identity a token read out of a log, a proxy, a shared machine or a script can be replayed until it expires, with no password required. a session that is never rotated can be fixed in advance by an attacker and then used after the victim authenticates. sessions that live for weeks turn a single theft into long-term access, and make revocation depend on the user noticing. a cookie without httponly hands the token to any script that runs on the page, which is exactly what an injection bug produces. owasp top 10 2017 a3 sensitive data exposure owasp top 10 2021 a07 identification and authentication failures cwe cwe-384 cwe cwe-613 cwe cwe-1004 mitre att&ck t1539 steal web session cookie nist sp 800-63c digital identity guidelines: authentication and authenticator management",
      },
      {
        key: "csrf",
        title: "Cross-Site Request Forgery (CSRF)",
        family: "identity",
        icon: "FaExchangeAlt",
        severity: "medium",
        tagline: "The browser attaches your credentials to a request you never intended to make.",
        historyCount: 6,
        refCount: 5,
        cwe: "CWE-352",
        search: "cross-site request forgery (csrf) the browser attaches your credentials to a request you never intended to make. cwe-352 cross-site request forgery identity any state change a logged-in user can trigger by clicking a link or loading a page, performed without their consent. account takeover by changing the recovery email address and then triggering a password reset. financial actions, address changes and permission grants, made in a session the user can see and does not understand. no read access for the attacker, which is why the bug is found through victim reports rather than through scanning. owasp top 10 2013 a8 cross-site request forgery (csrf) owasp top 10 2010 a5 cross-site request forgery (csrf) cwe cwe-352 mitre att&ck t1190 exploit public-facing application owasp cheat sheet csrf prevention cheat sheet",
      },
      {
        key: "oauth-oidc",
        title: "OAuth 2.0 & OIDC Misconfiguration",
        family: "identity",
        icon: "FaKey",
        severity: "high",
        tagline: "The authorization server is the identity provider, so a mistake there is bigger than any client mistake.",
        historyCount: 8,
        refCount: 10,
        cwe: "CWE-347",
        search: "oauth 2.0 & oidc misconfiguration the authorization server is the identity provider, so a mistake there is bigger than any client mistake. cwe-347 improper verification of cryptographic signature identity an authorization code or token is delivered to the attacker's site through a loosely matched redirect_uri, and the account is taken over. a stolen refresh token produces long-lived access to the victim's data with no further user interaction. accepting alg none, or honouring the token's own alg header, means the attacker signs their own tokens and no longer needs the private key. an open redirect anywhere in the chain is enough to break a redirect_uri that is otherwise configured correctly. rfc rfc 9700 best current practice for oauth 2.0 security rfc rfc 6749 the oauth 2.0 authorization framework rfc rfc 7636 proof key for code exchange (pkce) rfc rfc 8252 oauth 2.0 for native apps rfc rfc 8725 jwt best current practices openid connect openid connect core 1.0 cwe cwe-347 cwe cwe-601 mitre att&ck t1550.001 application access token owasp cheat sheet oauth 2.0 cheat sheet",
      },
    ],
  },
  {
    id: "data-secrets",
    label: "Data & Secrets",
    blurb: "Reading what you should not have been able to read: files outside the root, hosts inside the network, documents that reach out on their own, and formats that rebuild objects.",
    modules: [
      {
        key: "path-traversal",
        title: "Path Traversal & Directory Listing",
        family: "data-secrets",
        icon: "FaRoute",
        severity: "high",
        tagline: "A filename that points outside the document root turns your server into a file browser.",
        historyCount: 8,
        refCount: 7,
        cwe: "CWE-22",
        search: "path traversal & directory listing a filename that points outside the document root turns your server into a file browser. cwe-22 improper limitation of a pathname to a restricted directory ('path traversal') data-secrets read any file the service account can read: private keys, source, environment files, database credentials. directory listing turns a single guess into a full inventory of a directory you did not intend to publish. on older stacks, a truncated path can be written as well as read, so the bug becomes arbitrary file write. source disclosure is usually the real prize: credentials in the code are the next stage, not the end. owasp top 10 2025 a01 broken access control owasp top 10 2017 a5 broken access control cwe cwe-22 cwe cwe-36 rfc rfc 3986 owasp cheat sheet path traversal prevention cheat sheet mitre att&ck t1083 file and directory discovery",
      },
      {
        key: "ssrf",
        title: "Server-Side Request Forgery (SSRF)",
        family: "data-secrets",
        icon: "FaBroadcastTower",
        severity: "high",
        tagline: "The attacker supplies the address; the server makes the request, from inside the network.",
        historyCount: 7,
        refCount: 7,
        cwe: "CWE-918",
        search: "server-side request forgery (ssrf) the attacker supplies the address; the server makes the request, from inside the network. cwe-918 server-side request forgery (ssrf) data-secrets read the instance metadata service and take short-lived cloud credentials, escalating far beyond the web process. reach internal admin interfaces and unauthenticated apis that assume every caller is on the local network. port-scan the internal network from outside, using response timing, status codes or out-of-band callbacks to tell open ports from closed ones. abuse the server as a relay to attack third parties, which can make your address the source of the traffic and your logs the evidence. owasp top 10 2021 a10 server-side request forgery (ssrf) owasp top 10 2025 a01 broken access control cwe cwe-918 cwe cwe-441 owasp cheat sheet server side request forgery prevention cheat sheet mitre att&ck t1018 remote system discovery mitre att&ck t1046 network service discovery",
      },
      {
        key: "xxe",
        title: "XML External Entity (XXE)",
        family: "data-secrets",
        icon: "FaFileCode",
        severity: "high",
        tagline: "An XML document can name another document, so parsing input can be made to read the disk.",
        historyCount: 8,
        refCount: 7,
        cwe: "CWE-611",
        search: "xml external entity (xxe) an xml document can name another document, so parsing input can be made to read the disk. cwe-611 improper restriction of xml external entity reference data-secrets read local files as the service account, including configuration, keys and anything the application can see. cause the server to make outbound requests to arbitrary hosts, which becomes ssrf with a different payload format. denial of service through entity expansion, where a small document expands into gigabytes of text. where the parsed result is reflected without encoding, a file read turns into data exfiltration to the attacker directly. owasp top 10 2017 a4 xml external entities (xxe) owasp top 10 2021 a03 injection cwe cwe-611 cwe cwe-776 w3c xml 1.0 specification owasp cheat sheet xml external entity prevention cheat sheet mitre att&ck t1005 data from local system",
      },
      {
        key: "deserialization",
        title: "Insecure Deserialization",
        family: "data-secrets",
        icon: "FaCubes",
        severity: "critical",
        tagline: "Some serialization formats carry the class name as data, and the runtime will believe it.",
        historyCount: 9,
        refCount: 6,
        cwe: "CWE-502",
        search: "insecure deserialization some serialization formats carry the class name as data, and the runtime will believe it. cwe-502 deserialization of untrusted data data-secrets remote code execution on the server, with the privileges of the application and no injection string to filter. reading or corrupting any application state the process can reach, including caches, sessions and stored credentials. where deserialization happens in a client, code execution in the victim rather than on the server, which is the supply-chain case. a gadget chain that is not patched in a shared library still works after the application itself is fixed, so the defect outlives the fix. owasp top 10 2021 a08 software and data integrity failures owasp top 10 2017 a8 insecure deserialization cwe cwe-502 owasp cheat sheet deserialization cheat sheet mitre att&ck t1204.002 malicious file mitre att&ck t1195.002 compromise software supply chain",
      },
    ],
  },
  {
    id: "browser",
    label: "Browser & Client",
    blurb: "The controls that live between the server and the browser, and the places the browser keeps things. A lot of the attack surface is on the client you did not build.",
    modules: [
      {
        key: "cors",
        title: "CORS Misconfiguration",
        family: "browser",
        icon: "FaGlobe",
        severity: "high",
        tagline: "The browser only lets another origin read a response when the server says so, and servers say so too easily.",
        historyCount: 8,
        refCount: 9,
        cwe: "CWE-942",
        search: "cors misconfiguration the browser only lets another origin read a response when the server says so, and servers say so too easily. cwe-942 permissive cross-domain policy with untrusted domains browser a script on any site reads a private api response as if it were its own, once a user with a live session visits the page. account data, order history, internal identifiers and anything else the endpoint returns to the signed-in caller. the leaked response is usually proxied straight to the attacker's own origin, so nothing is left in the victim's browser to notice. no tokens are stolen to do it: the browser sends the session itself, so the whole thing works on a cookie the attacker never had. owasp top 10 2021 a01 broken access control owasp top 10 2025 a01 broken access control cwe cwe-942 cwe cwe-346 cwe cwe-940 w3c fetch standard (the cors protocol browsers implement) rfc rfc 6454 the web origin concept owasp cheat sheet http headers cheat sheet mitre att&ck t1189 drive-by compromise",
      },
      {
        key: "clickjacking",
        title: "Clickjacking",
        family: "browser",
        icon: "FaWindowRestore",
        severity: "medium",
        tagline: "The user clicks what they can see, and the browser delivers the click to a button they cannot.",
        historyCount: 8,
        refCount: 10,
        cwe: "CWE-1021",
        search: "clickjacking the user clicks what they can see, and the browser delivers the click to a button they cannot. cwe-1021 improper restriction of rendered ui layers or frames browser a state-changing action the user never intended - a transfer, a permission grant, a settings change - performed in a session they can see. credential capture, where the overlaid decoy is a login form belonging to the attacker rather than a button belonging to you. escalation of any existing xss or open-redirect weakness, because the attacker chooses what the user is looking at when it fires. typically needs social engineering to land - the user has to be logged in and has to visit the framing page - which is why the severity is usually medium rather than high. owasp top 10 2021 a05 security misconfiguration owasp top 10 2025 a02 security misconfiguration owasp top 10 2017 a6 security misconfiguration cwe cwe-1021 w3c html living standard (the iframe and sandboxing model) rfc rfc 9110 http semantics owasp cheat sheet http headers cheat sheet owasp cheat sheet html5 security cheat sheet portswigger web security academy clickjacking labs mitre att&ck t1189 drive-by compromise",
      },
      {
        key: "client-storage",
        title: "Client-Side Data Storage",
        family: "browser",
        icon: "FaFingerprint",
        severity: "high",
        tagline: "The browser will hold your secret somewhere, and only one of the places keeps it away from a script on the page.",
        historyCount: 8,
        refCount: 14,
        cwe: "CWE-922",
        search: "client-side data storage the browser will hold your secret somewhere, and only one of the places keeps it away from a script on the page. cwe-922 insecure storage of sensitive information browser one injection bug, or one compromised dependency, becomes full session takeover with no further work by the attacker. access tokens and refresh tokens in web storage outlive the tab, outlive the browser session, and survive until somebody clears them. anything else stored for convenience is exposed the same way: email addresses, draft content, cached account identifiers, feature flags derived from the user's role. the data is on disk as well as in memory, so it persists across sessions and is readable by anything else that runs on the machine. owasp top 10 2017 a3 sensitive data exposure owasp top 10 2013 a6 sensitive data exposure owasp top 10 2021 a02 cryptographic failures cwe cwe-922 cwe cwe-312 cwe cwe-614 cwe cwe-1004 cwe cwe-1275 rfc rfc 6265 http state management mechanism w3c html living standard (the web storage and indexeddb models) owasp cheat sheet html5 security cheat sheet owasp cheat sheet session management cheat sheet mitre att&ck t1539 steal web session cookie mitre att&ck t1552.001 credentials in files",
      },
      {
        key: "web-cache",
        title: "Web Cache Poisoning & Deception",
        family: "browser",
        icon: "FaBolt",
        severity: "high",
        tagline: "An intermediary reuses one visitor's response and hands it to another, and the cache key decides who sees whose.",
        historyCount: 8,
        refCount: 13,
        cwe: "CWE-525",
        search: "web cache poisoning & deception an intermediary reuses one visitor's response and hands it to another, and the cache key decides who sees whose. cwe-525 use of web browser cache containing sensitive information browser a response built for one signed-in user is served to another, exposing rendered account data, identifiers and whatever the page put in the markup. a poisoned entry turns the cdn into a distribution point: the attacker's script runs for every visitor who hits the cached url, not just for one. session identifiers leak directly wherever they are rendered into html, or wherever a predictable path can be made to return one user's page to another. the leak is often discovered long after the fact, because the cached entry keeps serving the stale response until an eviction, which makes it hard to scope who was affected. owasp top 10 2021 a05 security misconfiguration owasp top 10 2017 a6 security misconfiguration owasp top 10 2025 a02 security misconfiguration cwe cwe-525 cwe cwe-1022 cwe cwe-524 cwe cwe-444 rfc rfc 9111 http caching rfc rfc 9110 http semantics portswigger research web cache deception research (2017) mdn mdn http caching documentation owasp cheat sheet http headers cheat sheet mitre att&ck t1213 data from information repositories",
      },
    ],
  },
  {
    id: "platform",
    label: "Platform & Supply Chain",
    blurb: "The category OWASP created to hold everything that is not a bug in your code: configuration, dependencies, artifact trust, cryptography, and the proxy in front of you.",
    modules: [
      {
        key: "security-misconfig",
        title: "Security Misconfiguration",
        family: "platform",
        icon: "FaServer",
        severity: "high",
        tagline: "The secure setting is a different line in a different file for every deployment, so it gets missed.",
        historyCount: 7,
        refCount: 5,
        cwe: "CWE-16",
        search: "security misconfiguration the secure setting is a different line in a different file for every deployment, so it gets missed. cwe-16 configuration platform default or hard-coded credentials give an attacker an authenticated session without exploiting anything. verbose errors and stack traces hand out file paths, framework versions and query structure. open storage buckets or over-broad network rules expose data that the application itself protects correctly. because the surface is enumerable, the same request works from anywhere, forever, until somebody reads the config. owasp top 10 2025 a02 owasp top 10 2021 a05 cwe cwe-16 mitre att&ck t1190 nist sp 800-53",
      },
      {
        key: "outdated-components",
        title: "Outdated & Vulnerable Components",
        family: "platform",
        icon: "FaBoxes",
        severity: "high",
        tagline: "You did not choose most of the code you are running, and you cannot patch what you do not know about.",
        historyCount: 6,
        refCount: 5,
        cwe: "CWE-1104",
        search: "outdated & vulnerable components you did not choose most of the code you are running, and you cannot patch what you do not know about. cwe-1104 use of unmaintained third party components platform a public exploit for a common library reaches every application that never upgraded it. transitive code is invisible in a code review, so the dependency is usually a surprise rather than a decision. unmaintained packages will never receive a fix, so the exposure is permanent and has to be removed, not patched. a single shared library in an internal monorepo can put the same flaw into dozens of products at once. owasp top 10 2025 a03 software supply chain failures owasp top 10 2021 a06 cwe cwe-1104 mitre att&ck t1195.001 nist sp 800-218",
      },
      {
        key: "integrity-failures",
        title: "Software & Data Integrity Failures",
        family: "platform",
        icon: "FaStamp",
        severity: "high",
        tagline: "The code and the data are trusted without asking who is allowed to change them.",
        historyCount: 6,
        refCount: 4,
        cwe: "CWE-494",
        search: "software & data integrity failures the code and the data are trusted without asking who is allowed to change them. cwe-494 download of code without integrity check platform remote code execution with the privileges of the process, achieved by changing bytes rather than by exploiting a bug in code. persistence that survives a restart, because the trusted artifact is the artifact that loads every time. a compromised build pipeline turns every downstream product into a delivery mechanism at once. data-side variants poison decisions rather than run code: a rendered template, a rules engine, or a deserialized object can be made to act. owasp top 10 2025 a08 owasp top 10 2021 a08 cwe cwe-494 mitre att&ck t1195.002",
      },
      {
        key: "crypto-weakness",
        title: "Cryptographic Failures",
        family: "platform",
        icon: "FaLock",
        severity: "high",
        tagline: "Two different failures under one name: no cryptography where there must be, and bad cryptography where there is.",
        historyCount: 6,
        refCount: 5,
        cwe: "CWE-327",
        search: "cryptographic failures two different failures under one name: no cryptography where there must be, and bad cryptography where there is. cwe-327 use of a broken or risky cryptographic algorithm platform a stolen credential table is cracked far faster than the design assumed, and reuse turns one breach into many. plaintext or weakly-encrypted personal data is readable by anyone who gets the file, with no brute force required. a key committed to a repository is a permanent leak, because the history keeps it even after the code is fixed. ecb mode leaks the equality and repetition of plaintext blocks, so structured data becomes readable from ciphertext alone. owasp top 10 2025 a04 owasp top 10 2021 a02 cwe cwe-327 mitre att&ck t1552.001 nist sp 800-131a",
      },
      {
        key: "jwt",
        title: "JWT & Token Validation Flaws",
        family: "platform",
        icon: "FaLink",
        severity: "high",
        tagline: "A JWT is signed, not encrypted, and the header inside it says how to verify it.",
        historyCount: 6,
        refCount: 5,
        cwe: "CWE-347",
        search: "jwt & token validation flaws a jwt is signed, not encrypted, and the header inside it says how to verify it. cwe-347 improper verification of cryptographic signature platform full authentication bypass: a forged token with an arbitrary payload is accepted as genuine. privilege escalation, by putting an admin role in a payload that verifies correctly. a confused-deputy flaw where a token valid for one audience is honoured by another service. long-lived tokens with no revocation turn a single leak into permanent access. owasp top 10 2025 a07 owasp top 10 2021 a07 cwe cwe-347 rfc rfc 8725 mitre att&ck t1550.001",
      },
      {
        key: "request-smuggling",
        title: "HTTP Request Smuggling",
        family: "platform",
        icon: "FaProjectDiagram",
        severity: "high",
        tagline: "A proxy and a server disagree about where one request ends, so the leftover becomes part of somebody else's.",
        historyCount: 7,
        refCount: 4,
        cwe: "CWE-444",
        search: "http request smuggling a proxy and a server disagree about where one request ends, so the leftover becomes part of somebody else's. cwe-444 inconsistent interpretation of http requests ('request smuggling') platform one user's request is executed in another user's session, so the attacker inherits that session's cookies and identity. front-end security controls are bypassed, because the back end sees a request the front end never inspected. web cache poisoning, where an attacker's response is cached and served to every later visitor. response queue poisoning and denial of service, when many requests get desynchronised at once. cwe cwe-444 cwe cwe-441 rfc rfc 9112 mitre att&ck t1190",
      },
      {
        key: "graphql-api",
        title: "GraphQL & API Abuse",
        family: "platform",
        icon: "FaHashtag",
        severity: "high",
        tagline: "One endpoint that accepts a whole document turns many small checks into one large hole.",
        historyCount: 6,
        refCount: 5,
        cwe: "CWE-770",
        search: "graphql & api abuse one endpoint that accepts a whole document turns many small checks into one large hole. cwe-770 allocation of resources without limits or throttling platform denial of service from a single small request, because depth multiplies work rather than adding to it. unauthorised data access through a resolver that returns any object the client asks for by id. rate limits bypassed by batching many operations into one http request. introspection in production hands an attacker the complete schema to plan against. owasp api security top 10 2023 api1:2023 broken object level authorization owasp api security top 10 2023 api4:2023 unrestricted resource consumption owasp top 10 2025 a01 cwe cwe-770 mitre att&ck t1190",
      },
    ],
  },
];

/** Every module, in family order. */
export const MANIFEST = MANIFEST_FAMILIES.flatMap((f) => f.modules);

export const MODULE_COUNT = 24;

const BY_KEY = new Map(MANIFEST.map((m) => [m.key, m]));

export const getManifest = (key) => BY_KEY.get(key) ?? null;

export const getManifestFamily = (id) => MANIFEST_FAMILIES.find((f) => f.id === id) ?? null;

/** Search the catalogue. Field list mirrors `searchTextFor` exactly. */
export function searchManifest(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return MANIFEST.filter((m) => m.search.includes(q));
}

/** Severity order, worst first - used by the "worst first" sort. */
export const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export const bySeverity = (a, b) =>
  (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
