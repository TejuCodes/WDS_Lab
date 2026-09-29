/**
 * ============================================================
 * MODULE FAMILY: BROWSER & CACHE
 * ------------------------------------------------------------
 * Same schema as ./injection.js - read the header comment there
 * first, it documents every key once. Nothing in this file
 * depends on the OWASP backend dataset; OWASP is one source
 * among several and the `owaspConceptKey` / `owaspYear` /
 * `owaspId` keys are optional.
 *
 * What is specific to this family:
 *
 *  - `refs` leans on the specifications the browsers and
 *    proxies actually implement - the W3C Fetch Standard, which
 *    defines CORS, the HTML Living Standard, which defines the
 *    iframe and Web Storage models, and RFC 9110 / RFC 9111
 *    for HTTP semantics and caching - because the interesting
 *    questions here are answered by a spec rather than by the
 *    Top 10.
 *
 *  - All four lessons share one theme. They are not bugs in
 *    business logic. They are the gap between what a document
 *    thinks it is allowed to read, what the user believes they
 *    are clicking, where the browser is willing to put a
 *    secret, and what an intermediary in the path is willing
 *    to reuse.
 *
 * SAFETY: nothing here is a working exploit. Payloads are
 * illustrative strings of the kind a textbook prints, and every
 * lab in this project runs on localhost against data that was
 * made up for it.
 * ============================================================ */

export const browserModules = [
  /* ==========================================================
     1. CORS MISCONFIGURATION
     ========================================================== */
  {
    key: "cors",
    title: "CORS Misconfiguration",
    family: "browser",
    icon: "FaGlobe",
    severity: "high",
    tagline: "The browser only lets another origin read a response when the server says so, and servers say so too easily.",
    refs: [
      { src: "OWASP Top 10 2021", id: "A01 Broken Access Control" },
      { src: "OWASP Top 10 2025", id: "A01 Broken Access Control" },
      { src: "CWE", id: "CWE-942" },
      { src: "CWE", id: "CWE-346" },
      { src: "CWE", id: "CWE-940" },
      { src: "W3C", id: "Fetch Standard (the CORS protocol browsers implement)" },
      { src: "RFC", id: "RFC 6454 The Web Origin Concept" },
      { src: "OWASP Cheat Sheet", id: "HTTP Headers Cheat Sheet" },
      { src: "MITRE ATT&CK", id: "T1189 Drive-by Compromise" },
    ],
    cwe: { id: "CWE-942", name: "Permissive Cross-domain Policy with Untrusted Domains" },
    owaspConceptKey: "broken-access-control",
    owaspYear: 2021,
    owaspId: "A01",

    explain: {
      what:
        "The same-origin policy is a rule the browser enforces, not the server: a script running on one origin may not read the response of a request to another, and is handed an opaque placeholder instead of the body even though the request happened and the server did the work. CORS is the negotiated exception - the browser attaches an Origin header, the server answers with Access-Control-Allow-Origin, and the browser compares the two before releasing the body. The decision about who may read a private API is therefore made by the API, on every response, which is why one misconfigured header is the whole vulnerability. Nothing about the request is malformed; a legitimate request from an illegitimate caller is the definition of the bug.",
      how:
        "Access-Control-Allow-Origin must name one origin you trust, compared against a fixed set in code. Reflecting whatever arrived in the Origin header - the snippet res.setHeader(\"Access-Control-Allow-Origin\", req.headers.origin) - turns the header into an allow-list containing the entire internet, and the null origin that sandboxed frames and local documents produce is a deliberate decision needing its own reasoning rather than an accident. The famous pair is Access-Control-Allow-Origin: * together with Access-Control-Allow-Credentials: true: the Fetch Standard requires browsers to refuse to expose a credentialed response when the allow-origin value is the wildcard, so a server shipping it sees the header ignored rather than the data leaked, and the bug survives instead in the two variants that do work - reflecting a foreign origin, and allowing null alongside credentials. Requests split in two: a simple GET with a handful of headers is sent directly and is indistinguishable from a navigation, so the only place to stop it is the response headers, while anything else - a JSON content type, PUT, DELETE, or a custom header - triggers a preflight OPTIONS carrying Access-Control-Request-Method and Access-Control-Request-Headers that the server can genuinely refuse. Send Vary: Origin on any response whose allow-origin value depends on the request, because without it a shared cache stores one origin's response and hands it to another, turning a per-user decision into a cross-user leak, and be blunt about what CORS is in the first place: it controls reading, not requesting, and it is a browser control that a command-line script, a mobile application or a server-side client ignores completely, so every one of those callers must make its own authorisation decision - which is why the same endpoint that is correctly locked down in a browser is often wide open to anything that is not one.",
      impact: [
        "A script on any site reads a private API response as if it were its own, once a user with a live session visits the page.",
        "Account data, order history, internal identifiers and anything else the endpoint returns to the signed-in caller.",
        "The leaked response is usually proxied straight to the attacker's own origin, so nothing is left in the victim's browser to notice.",
        "No tokens are stolen to do it: the browser sends the session itself, so the whole thing works on a cookie the attacker never had.",
      ],
      prevent: [
        "Return one allow-listed origin, compared against a fixed set in code. Never reflect the Origin header back without an exact match.",
        "If several origins are genuinely allowed, echo only the one that matched and always send Vary: Origin so caches key on it.",
        "Never send Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true. If a browser-facing API needs both, use an allow-list.",
        "Treat the null origin as a deliberate decision with a stated reason, and never pair it with credentials without checking who can produce it.",
        "Keep authentication and authorisation on the server for every request. CORS is not an access control and non-browser clients ignore it.",
      ],
    },

    history: [
      {
        year: 1996,
        title: "The same-origin policy arrives with scripting",
        text: "Browsers gained the ability to run script inside a document, and immediately gained the ability to run it inside a document that had not been written by the same people. The restriction that follows is the same-origin policy: a document may read another document's data only when the two share a scheme, host and port. It is a browser-side rule about documents and frames, and at this point nothing resembling CORS exists - a cross-origin read simply fails, and there is no protocol for asking permission. That origin is the whole context for everything that follows, because CORS is a mechanism for turning a hard failure into a negotiated exception.",
      },
      {
        year: 2004,
        title: "JSONP makes the exception the default",
        text: "The first widely used way around the same-origin policy was JSONP, and it is worth understanding because it explains the shape of the mistake that came later. JSONP asks the server to wrap its response in a JavaScript function call and loads the result with a script tag. Script loading is not subject to the read restriction - the browser runs it - so the calling page gets the data by executing it rather than by reading it. It works for exactly one origin, it cannot send credentials, and it hands the response to whatever function name the request asked for, which is a data-to-code conversion. Millions of APIs were built on it, and the culture it produced - relaxing cross-origin restrictions because there was a way to - did not survive contact with authenticated endpoints.",
      },
      {
        year: 2011,
        title: "The origin gets a written specification",
        text: "RFC 6454, The Web Origin Concept, states what an origin is: the tuple of scheme, host and port, with the serialisation rules that make two origins comparable as strings. This matters more than it looks, because every later comparison - in a server's allow-list, in the browser's check against Access-Control-Allow-Origin, in a CSP source list - is a comparison of serialised origins, and a rule written against hostnames instead of origins will disagree with the browser. The same year, RFC 6455 defines the WebSocket protocol, whose opening handshake is an ordinary HTTP request that a browser will send to a cross-origin endpoint and whose framing is deliberately outside the reach of the same-origin policy - a reminder that a cross-origin policy has to be chosen for each new transport rather than assumed to inherit.",
      },
      {
        year: 2014,
        title: "CORS is what browsers actually implement",
        text: "The W3C Cross-Origin Resource Sharing work was standardised and shipped across the major browsers, and it is now the mechanism in the Fetch Standard rather than a separate document. The design decision that shaped everything after it is that the permission is carried in the response to the request: the server sees the Origin header and answers with a policy, and the browser - not the server - enforces it. That is why a misconfigured server is the whole vulnerability, and why the vulnerability has the shape it does: a single header whose value should be chosen from a fixed set is instead computed from attacker-controlled input.",
      },
      {
        year: 2017,
        title: "The dangerous pair, and why it survives the browser's refusal",
        text: "By this point the combination of Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true was the most-shared snippet in tutorials, middleware examples and framework boilerplate, because it looks like the permissive setting you want. The Fetch Standard requires the browser to refuse to expose a credentialed response when the allow-origin value is the wildcard, so that particular pair fails closed. The bug does not disappear, it moves to the two variants that succeed: reflecting whatever Origin arrived, which works for any attacker-controlled domain, and allowing the null origin with credentials, which works for sandboxed frames and local documents. The lesson practitioners took from the browser refusal was the wrong one - that the wildcard pair was harmless - rather than the right one, that the header is an authorisation decision.",
      },
      {
        year: 2021,
        title: "Broken Access Control at A01",
        text: "The 2021 edition of the OWASP Top 10 places the failure mode at A01 Broken Access Control, which is number one on the list, and names it directly. CORS fits the grouping better than it fits any other entry: nothing about the request is malformed, no parser is confused, and no injection is involved - the request is legitimate, the caller is not, and the only defect is a missing check on who the caller is. The 2021 text is blunt about the consequence, which is that a permissive policy lets an unauthenticated caller read data that belongs to somebody else's authenticated session.",
      },
      {
        year: 2022,
        title: "The caching and framing rules get rewritten",
        text: "RFC 9110 and RFC 9111 reorganise HTTP semantics and HTTP caching, folding the earlier documents into a single numbered set and making the freshness, validation and Vary rules the primary statement rather than a restatement. For this family the important consequence is that the cache key and the set of request headers a response depends on are defined precisely, and that a response which varies on something the cache does not key on is the defect rather than a subtlety. Vary: Origin is the small piece of HTTP that decides whether a per-origin CORS decision survives a shared cache, and it is defined in the same document that explains freshness.",
      },
      {
        year: 2026,
        title: "The ecosystem is smaller than it was",
        text: "Where the risk stands today: CORS has become a routine line in every review checklist, and the naive reflection pattern is recognised quickly. Two things have changed the practical exposure rather than the bug. Browsers have restricted third-party cookies in stages, which narrows the credentialed cross-origin read considerably - a defence that arrived at the user agent rather than in the application, and which will not help an endpoint that authenticates with a bearer token rather than a cookie. And the Fetch Standard keeps tightening the parts that were ambiguous, so a wildcard-plus-credentials response is not merely blocked by convention. The remaining failures are the boring ones: a new service that echoes the Origin header because that is what the quickstart example did, an endpoint added to an existing allow-list without checking what it returns, and a Vary: Origin that was left out of a response that genuinely varies.",
      },
    ],

    diagram: {
      caption: "A page on one origin reads a response meant for another",
      nodes: [
        { text: "Attacker page runs fetch() against your API", tone: "attacker" },
        { text: "Browser sends Origin: https://attacker.example", tone: "wire" },
        { text: "Server reflects that Origin into allow-origin", tone: "app" },
        { text: "Browser accepts it and releases the body", tone: "danger" },
        { text: "Script reads the response and ships it away", tone: "danger" },
        { text: "The cookie never moved; the body did", tone: "data" },
        { text: "Fix: one allow-listed origin, plus Vary: Origin", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3, label: "values match" },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 2, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "payload",
      title: "Payload Workshop: which Origin actually opens the door?",
      prompt:
        "The API sets Access-Control-Allow-Credentials: true and copies whatever Origin it received into Access-Control-Allow-Origin. Only one substitution hands a stranger's page a readable, credentialed response. Pick it, then judge the proposed control.",
      base: "GET /api/me HTTP/1.1   |   Origin: {slot}",
      slot: "origin",
      options: [
        {
          text: "https://app.example.com",
          note: "The API's own trusted origin. The browser sends this from the app's own page, so reflecting it grants nobody new anything.",
        },
        {
          text: "https://attacker.example",
          note: "A domain the attacker controls. The browser sends it from the attacker's page, the server reflects it, and the values match - so the credentialed body is released.",
        },
        {
          text: "*",
          note: "The wildcard. With credentials the Fetch Standard forbids this pair and the browser refuses to expose the body; without credentials there is no session to abuse.",
        },
        {
          text: "https://app.example.com.attacker.example",
          note: "Suffix confusion. Origins are compared as whole strings, so this does not match the trusted origin and grants nothing - unless the server matches by endsWith, which is a separate validation bug.",
        },
      ],
      answer: 1,
      why: {
        "0": "Safe, and worth understanding why: the browser serialises the Origin of the requesting page, and only the app's own pages send this value. An attacker's page sends its own domain instead, the reflected header does not match, and the browser hands back an opaque placeholder rather than the body.",
        "1": "Correct. This is the one substitution that demonstrates the flaw. The browser sends Origin: https://attacker.example from the attacker's page, the server echoes that exact string back, Access-Control-Allow-Credentials: true means the session cookie travels with the request, and the browser's check passes - so the script reads a response it has no business reading and forwards it to its own origin.",
        "2": "Ineffective here, and instructive about why. The wildcard and credentials are a combination the Fetch Standard explicitly rejects for exposure, so the browser blocks the read. That refusal is why the reflection variant is the one that survives, and it is also why the wildcard on an unauthenticated endpoint is a much less urgent finding than the wildcard on a session-protected one.",
        "3": "Ineffective against a correct comparison, and the reason is worth internalising: an origin is the whole scheme, host and port tuple, compared byte for byte, not a suffix. This string is a different origin and does not match. It does become an attack against a server that allow-lists with endsWith or startsWith - that is CWE-346 Origin Validation Error rather than CWE-942 - which is the more common real bug in this family.",
      },
      check: {
        prompt: "Will SameSite=Strict on the session cookie stop this exposure?",
        answer: true,
        why:
          "Yes, and the mechanism is worth being precise about, because it is a defence the application did not write. SameSite tells the user agent not to attach the cookie to a request initiated by another site, and a cross-origin fetch is exactly that, so the request goes out without the session and the response comes back as an unauthenticated 401. That body is readable by the attacker's script but contains nothing private, which is the difference between a control and a mitigation. It is still a blunt instrument rather than the fix: it does nothing for an API that authenticates with a bearer token the page holds, it will break genuine cross-site flows such as an embedded partner widget, and it leaves the response headers still misconfigured for the next endpoint someone adds. Fix the allow-list; treat SameSite as a layer underneath it.",
      },
    },
  },

  /* ==========================================================
     2. CLICKJACKING
     ========================================================== */
  {
    key: "clickjacking",
    title: "Clickjacking",
    family: "browser",
    icon: "FaWindowRestore",
    severity: "medium",
    tagline: "The user clicks what they can see, and the browser delivers the click to a button they cannot.",
    refs: [
      { src: "OWASP Top 10 2021", id: "A05 Security Misconfiguration" },
      { src: "OWASP Top 10 2025", id: "A02 Security Misconfiguration" },
      { src: "OWASP Top 10 2017", id: "A6 Security Misconfiguration" },
      { src: "CWE", id: "CWE-1021" },
      { src: "W3C", id: "HTML Living Standard (the iframe and sandboxing model)" },
      { src: "RFC", id: "RFC 9110 HTTP Semantics" },
      { src: "OWASP Cheat Sheet", id: "HTTP Headers Cheat Sheet" },
      { src: "OWASP Cheat Sheet", id: "HTML5 Security Cheat Sheet" },
      { src: "PortSwigger Web Security Academy", id: "Clickjacking labs" },
      { src: "MITRE ATT&CK", id: "T1189 Drive-by Compromise" },
    ],
    cwe: { id: "CWE-1021", name: "Improper Restriction of Rendered UI Layers or Frames" },
    owaspConceptKey: "security-misconfiguration",
    owaspYear: 2021,
    owaspId: "A05",

    explain: {
      what:
        "An HTML page may embed another page in a frame, and the browser does not ask the embedded page's owner whether that is welcome. So an attacker puts your application inside a frame on a page they control and lays a transparent overlay on top of it, aligned so the button the user intends to press sits exactly over a button you did not intend them to press. The user sees a normal-looking page, sees a control, and clicks it; the browser routes the click to whatever is actually under the pointer, which is the framed application acting on the user's live session. Nothing is forged and nothing is injected - the genuine user, the genuine pointer and the genuine session are all doing exactly what they were built to do.",
      how:
        "A click inside a cross-origin frame still works because framing is not a cross-origin restriction, and the session cookie is attached because the frame's request to your own origin is same-site with your page as the top-level document, so SameSite does not help here at all. The framed document is the real one, served by you, running your own scripts with your own privileges - the attacker cannot read it, but they do not need to - which makes this the single most common misunderstanding about the class: the forged-request defences aim at a page on another site causing a request to yours, whereas in a clickjacking attack the top-level document is already your site. The one thing that stops it is a refusal to be framed, and there are two headers with a difference that matters in practice: X-Frame-Options is the older one with an allow-or-deny model (DENY, SAMEORIGIN) and no source list - ALLOW-FROM was proposed, never implemented by any browser and dropped, so \"my partner may frame this one page\" had no answer for years - while CSP's frame-ancestors takes a source list and composes with the rest of a policy. The modern variants need no pointer trick at all: drag-and-drop redressing induces the user to drop a file onto an invisible target in the frame, cursor-jacking moves or replaces the cursor so the visible pointer and the real one disagree, and keystroke injection builds a convincing form out of CSS boxes. The cost of getting this right is worth stating, because it is why the bug survives: an unframeable site cannot be embedded by a partner, a payment provider or an in-app browser view, and that is a product decision rather than a free hardening win.",
      impact: [
        "A state-changing action the user never intended - a transfer, a permission grant, a settings change - performed in a session they can see.",
        "Credential capture, where the overlaid decoy is a login form belonging to the attacker rather than a button belonging to you.",
        "Escalation of any existing XSS or open-redirect weakness, because the attacker chooses what the user is looking at when it fires.",
        "Typically needs social engineering to land - the user has to be logged in and has to visit the framing page - which is why the severity is usually medium rather than high.",
      ],
      prevent: [
        "Send Content-Security-Policy: frame-ancestors 'none' on every HTML response, or 'self' where you genuinely need to frame your own pages.",
        "Keep X-Frame-Options: DENY alongside it for older clients; it costs one header and covers the browsers that predate frame-ancestors.",
        "Where a partner genuinely must frame you, enumerate those origins in frame-ancestors. There is no way to allow one path only, so keep the exception as narrow as the surface allows.",
        "Make state-changing actions ask for something the overlay cannot supply: a re-authentication step, a typed confirmation, or a second deliberate click on a control the user can read.",
        "Do not rely on frame-busting JavaScript. It runs in the frame, it can be prevented, and it breaks on mobile browsers that do not show the URL at all.",
      ],
    },

    history: [
      {
        year: 2000,
        title: "Frames exist, and nothing can say no",
        text: "Frames are a core part of how HTML is built - page composition, layout, and the standard trick for putting content from two sites in one document. The specification gives the embedding document total control over the frame and gives the framed document no way to object: it is not consulted when the frame is created, and the only option available to it is JavaScript that inspects window.parent and tries to navigate or escape. That script is the entire original defence. It is fragile by construction, because it is code that runs after the frame is already on screen, it can be prevented, and it does nothing on the clients that display frames without a visible address bar.",
      },
      {
        year: 2007,
        title: "The class is named and written up",
        text: "Academic research published under the name clickjacking described the pattern in its modern form and gave it a framing that turned out to hold up: instead of delivering a false page, the attack delivers a true one under a false alignment, so every browser feature that verifies authenticity - the certificate, the address bar, the padlock - is satisfied and useless. The important contribution was framing UI redressing as a class rather than a single trick, and noticing that the user's authorisation is the thing being borrowed. CWE-1021 was catalogued for the underlying weakness: no restriction on which origins may render your interface as a layer.",
      },
      {
        year: 2009,
        title: "A response header appears",
        text: "X-Frame-Options shipped with Internet Explorer 8 and was adopted by the other vendors shortly after. It is a genuine fix and it changed the landscape, because for the first time the decision about framing could be made by the framed page rather than by script in the frame. Its design is deliberately blunt: DENY and SAMEORIGIN, an allow-or-deny model with no source list. That simplicity is why it worked everywhere quickly, and it is also why ALLOW-FROM - the value that would have permitted one trusted embedding origin - was never implemented by any browser and was eventually removed from the specification. For several years the honest advice was that you could not be framed by anyone except yourself, which is a good default and an awkward one for any site with partners.",
      },
      {
        year: 2012,
        title: "CSP 1.0 arrives, and frame-ancestors with it",
        text: "Content-Security-Policy 1.0 became a W3C Recommendation, and its frame-ancestors directive replaced the need for a separate header with a policy language. Where X-Frame-Options could only say yes or no, frame-ancestors takes a source list and therefore inherits everything CSP already knew how to express - a single origin, several origins, a subdomain, none. It also solved the awkward case, so the partner-embedding problem that X-Frame-Options could not express became a one-line policy. The two coexisted for years, which produced the standard advice of sending both: frame-ancestors where it is supported and X-Frame-Options as the floor for older clients.",
      },
      {
        year: 2017,
        title: "Security Misconfiguration at A6",
        text: "The 2017 OWASP Top 10 carried the risk inside A6 Security Misconfiguration, which is the right home for it. There is no code defect to find: the application is correct, the browser is correct, and the configuration - the framing policy the response declares - is the only thing wrong. The entry text's framing of configuration as a first-class risk is what keeps this class alive on checklists. A missing or wrong frame policy is also nearly invisible in a test suite, because the page works perfectly well when you open it directly, which is how it survives in applications that are otherwise carefully reviewed.",
      },
      {
        year: 2020,
        title: "The variants stop needing a fake button",
        text: "Attention moved from the classic overlay to variants that need less setup and are harder to notice. Drag-and-drop redressing works when a page invites the user to drop a file anywhere on it, by inducing them to drop onto an invisible target in the frame. Cursor-jacking moves, rotates or replaces the cursor so the pointer the user is tracking is not the one the browser is using. Keystroke injection constructs a convincing form out of CSS boxes and captures what is typed into it. What these have in common is that they remove the need for precise alignment, which was always the fragile part of the original attack, and they demonstrate that the attack surface is the user's intent rather than any particular overlay technique.",
      },
      {
        year: 2021,
        title: "Security Misconfiguration at A05",
        text: "The 2021 edition carries the risk inside A05 Security Misconfiguration, which sits far higher on the list than A06 did. The framing advice in this edition is also where the modern control is stated plainly: a Content-Security-Policy carrying frame-ancestors is the mechanism, and the recommendation is to set it globally rather than per page. A global default matters because the vulnerability is discovered one response at a time, and a per-page policy is only as good as the deployment of that policy across every route, including error pages and static assets that are easy to forget.",
      },
      {
        year: 2025,
        title: "A02, with one header carrying the whole defence",
        text: "Security Misconfiguration is A02 in the 2025 edition. Where the class stands today: the defence has consolidated from three mechanisms into one. Frame-busting script is dead - it was always a race and mobile browsers removed even the race. X-Frame-Options is legacy, kept because it still costs a header and still covers a long tail of clients, but ALLOW-FROM's absence means it cannot express a partial trust decision. frame-ancestors is the control, and the interesting work has moved to the exceptions: a policy of frame-ancestors 'none' on a login page, a partner embedded on one section, and a payment provider that insists on framing the confirmation page. Each exception is a small deliberate decision that should be written down, because it is the only thing standing between the next version of that page and the same attack.",
      },
    ],

    diagram: {
      caption: "The pointer lands on the real button, the user aimed at the decoy",
      nodes: [
        { text: "Attacker frames your page in an iframe", tone: "attacker" },
        { text: "A transparent overlay hides the real controls", tone: "attacker" },
        { text: "Victim aims at the decoy and clicks", tone: "wire" },
        { text: "Click reaches the framed page's real button", tone: "app" },
        { text: "Session cookie rides along with the action", tone: "danger" },
        { text: "The user consented to something they never saw", tone: "danger" },
        { text: "Fix: CSP frame-ancestors 'none' on every page", tone: "defence" },
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
      title: "Which framing policy do you ship?",
      prompt: "Four values a team proposed for the same HTML response. One is the correct modern control; the other three fail for three different reasons.",
      question:
        "An application must not be embeddable by any other origin. Which single response header value achieves that correctly?",
      options: [
        {
          text: "X-Frame-Options: ALLOW-FROM https://portal.example.com",
          note: "The permissive X-Frame-Options value that was never implemented. No browser shipped it and the specification dropped it.",
        },
        {
          text: "Content-Security-Policy: frame-ancestors 'none'",
          note: "The frame-ancestors directive with the source list that permits nobody. The modern control, expressed in the policy language.",
        },
        {
          text: "Content-Security-Policy: frame-src 'self'",
          note: "The right directive name in almost the right position. frame-src governs what this page may embed, not who may embed it.",
        },
        {
          text: "X-Frame-Options: SAMEORIGIN, added to the login route only",
          note: "A correct control applied to one route. Everything else in the application is still frameable, which is where the bug will be found.",
        },
      ],
      answer: 1,
      why: {
        "0": "Wrong, and historically interesting. ALLOW-FROM was proposed as the X-Frame-Options value for \"this one origin may frame me\", and it was never implemented by any browser, so the header is ignored and the page remains frameable by anybody. It was dropped from the specification. This is a good example of a control that looks permissive enough to be chosen and permissive enough to do nothing at all.",
        "1": "Correct. frame-ancestors takes a source list, and 'none' is the empty list, which means no origin may frame this document. It is the modern control because it lives in Content-Security-Policy, so it composes with the rest of a policy and can express a partial trust decision later without changing headers. Note what it is not: an allow-list that is enforced by the browser, so the server never sees the framing attempt at all.",
        "2": "Wrong directive, and the distinction is the whole lesson. frame-src controls which origins this document may load subresources and frames from; frame-ancestors controls which origins may load this document into a frame. They point in opposite directions, and shipping frame-src alone leaves the page perfectly frameable while appearing - to a reader skimming the header - to have been protected.",
        "3": "The right control on the wrong scope. X-Frame-Options: SAMEORIGIN does refuse cross-origin framing, so on that one route it works. The problem is coverage: the attack only needs any page of the application to be frameable, and route-level policies are missed on exactly the pages nobody tests - the account settings screen, the error page, the file preview. Sending it globally alongside frame-ancestors is fine; sending it on one route is the bug.",
      },
    },
  },

  /* ==========================================================
     3. CLIENT-SIDE DATA STORAGE
     ========================================================== */
  {
    key: "client-storage",
    title: "Client-Side Data Storage",
    family: "browser",
    icon: "FaFingerprint",
    severity: "high",
    tagline: "The browser will hold your secret somewhere, and only one of the places keeps it away from a script on the page.",
    refs: [
      { src: "OWASP Top 10 2017", id: "A3 Sensitive Data Exposure" },
      { src: "OWASP Top 10 2013", id: "A6 Sensitive Data Exposure" },
      { src: "OWASP Top 10 2021", id: "A02 Cryptographic Failures" },
      { src: "CWE", id: "CWE-922" },
      { src: "CWE", id: "CWE-312" },
      { src: "CWE", id: "CWE-614" },
      { src: "CWE", id: "CWE-1004" },
      { src: "CWE", id: "CWE-1275" },
      { src: "RFC", id: "RFC 6265 HTTP State Management Mechanism" },
      { src: "W3C", id: "HTML Living Standard (the Web Storage and IndexedDB models)" },
      { src: "OWASP Cheat Sheet", id: "HTML5 Security Cheat Sheet" },
      { src: "OWASP Cheat Sheet", id: "Session Management Cheat Sheet" },
      { src: "MITRE ATT&CK", id: "T1539 Steal Web Session Cookie" },
      { src: "MITRE ATT&CK", id: "T1552.001 Credentials In Files" },
    ],
    cwe: { id: "CWE-922", name: "Insecure Storage of Sensitive Information" },
    owaspConceptKey: "sensitive-data-exposure",
    owaspYear: 2017,
    owaspId: "A3",

    explain: {
      what:
        "A browser gives an application four places to keep things, and they have genuinely different trust models rather than being interchangeable buckets. Cookies are attached automatically to matching requests, are small, and are the only one of the four where the application can ask the browser not to expose the value to script. localStorage and sessionStorage are string dictionaries readable by any script running on the origin, with no attributes, no expiry and no access control; IndexedDB is the same trust model with more room and asynchronous access; the HTTP cache is a fourth store that persists responses on disk, where a shared machine and a habit of never clearing anything both matter. The core mistake is not using the wrong API - it is putting a bearer of identity, a session token, an access token, a role flag or a personal identifier, in any of the three script-readable places.",
      how:
        "The cookie attributes are where the trust model is actually expressed, and they are four separate decisions: HttpOnly removes the value from document.cookie, which is what stops a script reading a session identifier; Secure stops the browser sending it over plain HTTP; SameSite decides whether the browser attaches it to a request initiated by another site; and a host-only cookie with no Domain attribute keeps it off every subdomain. Set all four and the value is functionally unreadable by page script, which is the property that matters here. localStorage and sessionStorage offer none of this - there is no HttpOnly for them, because the specification assumes any script on the origin is entitled to the origin's data - their only difference is lifetime, and both are synchronous, so a few megabytes of string blocks the main thread, a denial-of-service lever as well as a design smell. IndexedDB is the right answer when data really is large and structured, being asynchronous and able to hold real object graphs, and it is exactly as readable by same-origin script as localStorage, which is the point people miss when they store a session there \"because IndexedDB is more secure\". The long argument about where an OAuth access token belongs comes down to that trade: in web storage it is readable by injected script but not sent automatically on every request, so there is no CSRF problem and no ambient authority, while in a cookie it is invisible to script but the browser attaches it to cross-site requests unless SameSite says otherwise, so the team inherits a second class of bug - neither is free, which is why the token's shape matters more than its storage, since a short-lived token scoped to one resource limits both problems at once and the authorization code flow with PKCE exists so the long-lived credential never reaches the browser at all, and the framing to give up last is that the XSS is somebody else's problem, because the two defects compound: any injection bug becomes full account takeover the moment a token sits in a readable store, and neither defect is fixed by fixing the other.",
      impact: [
        "One injection bug, or one compromised dependency, becomes full session takeover with no further work by the attacker.",
        "Access tokens and refresh tokens in web storage outlive the tab, outlive the browser session, and survive until somebody clears them.",
        "Anything else stored for convenience is exposed the same way: email addresses, draft content, cached account identifiers, feature flags derived from the user's role.",
        "The data is on disk as well as in memory, so it persists across sessions and is readable by anything else that runs on the machine.",
      ],
      prevent: [
        "Keep the session identifier in an HttpOnly, Secure, SameSite, host-only cookie and let the browser manage it. Never read or write it from script.",
        "Treat localStorage, sessionStorage and IndexedDB as one store with one rule: no credential, no token, no role claim. Preferences and caches are fine.",
        "Prefer short-lived, narrowly scoped access tokens over long-lived ones, so the value in the browser is worth less if it does escape.",
        "Send CSP with a nonce or a strict allow-list so that an injection that gets through has nothing to execute.",
        "Never persist anything sensitive through a URL, a fragment or a value that ends up in history, a referrer header or a log line.",
      ],
    },

    history: [
      {
        year: 2001,
        title: "HttpOnly appears, because scripts could read the cookie",
        text: "The cookie model was specified by Netscape and the security design that matters came with it: the server issues an opaque identifier, keeps the meaning in its own storage, and the browser returns the identifier. That design has one obvious weakness, which is that every script on the page could read the identifier through document.cookie, so any injection bug became immediate account compromise. HttpOnly was added as a response, in Internet Explorer 6, and it is the origin of the whole distinction this module is about: one storage API that can be told to withhold its contents from scripts, and a set of APIs where that option does not exist. It took several years for the other vendors to ship it, and during that window the token was simply readable by any script on the page.",
      },
      {
        year: 2009,
        title: "Web Storage gives scripts a place to put things",
        text: "The HTML5 Web Storage API added localStorage and sessionStorage: string dictionaries that persist, survive a restart, are shared across every tab on the origin, and are readable and writable by any script on that origin with no attributes and no access control. It exists for the same reason every new browser API is optimistic - it is genuinely better than cookies for large client-side preferences and for data a page needs synchronously - and the security question of who may read it was settled by leaving the old assumption in place, which is that script on the origin is trusted. The consequence is structural rather than a mistake anyone made in one application: from this point on there is a place on every origin where a token can be put, and reading it back is one line of code. Most applications that later had a token theft used this API because it was the documented, obvious place to put a token.",
      },
      {
        year: 2013,
        title: "Sensitive Data Exposure at A6",
        text: "The 2013 OWASP Top 10 introduced Sensitive Data Exposure at A6, and its text is largely about what not to store and how not to send it: weak cryptography on data at rest, and cleartext on the wire. Client storage sits inside the category as the unencrypted-at-rest end of it, though the framing was still mostly server-side - database encryption, TLS, and hashing passwords properly. The category's own title is a useful corrective: an exposure is not only something an attacker takes from the wire, it is equally something the browser was asked to hold on disk in a place that any script, any extension with permission, and anyone with the machine can reach.",
      },
      {
        year: 2014,
        title: "IndexedDB, the same trust model with more room",
        text: "IndexedDB was added as the storage answer for data that is genuinely large or structured: asynchronous, transactional, and able to hold object graphs rather than strings. It is the right tool for a document cache and a poor place for a credential, and the reason is the one people skip - it inherits the Web Storage trust model exactly. There is no IndexedDB equivalent of HttpOnly. Any script running on the origin can enumerate the databases, open them and read every record, which is why an architecture that moves a session token from localStorage to IndexedDB on the argument that the older API is legacy has changed nothing about its exposure.",
      },
      {
        year: 2017,
        title: "Sensitive Data Exposure at A3",
        text: "The 2017 edition carried the risk at A3, where it sat alongside the other 'things that should not have been exposed' categories rather than with the memory-corruption and injection material. The category text is explicit that sensitive data includes credentials, and it is the edition in which the practical guidance consolidated: do not put secrets in a client-side store, mark cookies HttpOnly and Secure, and treat anything cached in the browser as having been published. OWASP's HTML5 Security Cheat Sheet grew out of this period and is still the clearest statement of the trade-off between localStorage and an HttpOnly cookie for a browser-based OAuth client.",
      },
      {
        year: 2020,
        title: "The cookie specification is revised",
        text: "Work on the successor to RFC 6265 began, gathering a decade of practice - the __Host- and __Secure- prefixes that refuse a Domain attribute or a non-secure origin, the changed defaults around SameSite and the treatment of the null origin, and the long-running question of whether a browser should accept a cookie at all. The security-relevant point for this module is that the revision moved the defaults rather than the mechanics. Most of what protects a session identifier in a modern browser is now the default behaviour, and what the application still has to do is stop putting secrets in the places the specification has nothing to say about.",
      },
      {
        year: 2021,
        title: "The category splits in two",
        text: "The 2021 edition has no Sensitive Data Exposure entry. The concern is divided: A02 Cryptographic Failures covers the underlying data being unprotected at rest and in transit, and A01 Broken Access Control covers the case where an exposed token grants access it should not. Splitting it is arguably a more accurate description of the problem - exposing a session token and storing a password in cleartext are two different defects with two different fixes - but it has a practical cost for anyone reading the list, since a client-side storage mistake now has no obvious home and is easier to miss on a review checklist.",
      },
      {
        year: 2025,
        title: "A04, and the real fix is a shorter token",
        text: "Cryptographic Failures is A04 in the 2025 edition. Where the class stands: the storage decision itself is well understood, and the frameworks that encouraged tokens in localStorage have largely been corrected. What remains is a shorter list of habits. Client-side applications that are not browsers keep tokens in an equivalent readable store, because there is no HttpOnly available and the option is not on offer. Single-page applications still read the access token from web storage because that is what the tutorial said, even where the backend would happily take an HttpOnly cookie. And the largest remaining exposure is the one nobody calls storage: a token in a URL fragment or a query string, which lands in browser history, in server logs, in analytics and in the Referer header of the next request. The durable answer is not a better bucket, it is a token worth less: short-lived, single-resource, and revocable, so that an injection bug costs an attacker one narrow call rather than an account.",
      },
    ],

    diagram: {
      caption: "A token in a script-readable store turns an injection bug into an account",
      nodes: [
        { text: "A dependency or a stored XSS runs script", tone: "attacker" },
        { text: "Script reads localStorage.getItem('session')", tone: "wire" },
        { text: "Any same-origin script can read that value", tone: "danger" },
        { text: "Script posts the token to its own endpoint", tone: "danger" },
        { text: "Server accepts the token on the next request", tone: "app" },
        { text: "No password, no second factor, full account", tone: "data" },
        { text: "Fix: HttpOnly cookie, nothing sensitive in storage", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2, label: "no HttpOnly exists" },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 2, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which line hands the session to any script on the page?",
      prompt: "A login handler after a successful authentication. One line puts a credential somewhere JavaScript can read it. Click it.",
      language: "javascript",
      lines: [
        { text: "const { token, user } = await res.json();" },
        { text: "localStorage.setItem('session', token);      // readable by every script", vulnerable: true },
        { text: "localStorage.setItem('theme', dark ? 'dark' : 'light');" },
        { text: "sessionStorage.setItem('lastEmail', user.email);" },
        { text: "document.cookie = `theme=${dark ? 'dark' : 'light'}; SameSite=Strict`;" },
      ],
      explain:
        "Line 2 is the vulnerability. localStorage has no attribute that withholds its contents from script - there is no equivalent of HttpOnly, because the specification assumes that script running on your origin is entitled to your origin's data. So one injection bug, one malicious dependency, or one bad browser extension is enough to read the session identifier and post it somewhere, which is a full account takeover with no password and no second factor. Line 1 is safe: it reads the response body into a variable that never leaves the function, and the token's presence in memory for a moment is not what the rule is about. Line 3 is safe because a theme is not a credential - reading it costs an attacker nothing and authorises nothing. Line 4 is the same case with a slightly better argument: an email address is personal data worth protecting, but it is not a bearer of authority, so its disclosure is a privacy incident rather than a takeover. Line 5 is safe because it writes a preference through document.cookie rather than reading a secret out of it, and SameSite=Strict is the right thing to add to a cookie that is not a session credential. Note what line 5 also gets right by contrast: it is the cookie path, where the server issues the identifier and the browser manages it, that is where a session belongs. The fix is not a different storage API - IndexedDB has exactly the same trust model - it is setting the identifier in a Set-Cookie response header with HttpOnly, Secure and SameSite, and never reading it back from script at all.",
    },
  },

  /* ==========================================================
     4. WEB CACHE POISONING & DECEPTION
     ========================================================== */
  {
    key: "web-cache",
    title: "Web Cache Poisoning & Deception",
    family: "browser",
    icon: "FaBolt",
    severity: "high",
    tagline: "An intermediary reuses one visitor's response and hands it to another, and the cache key decides who sees whose.",
    refs: [
      { src: "OWASP Top 10 2021", id: "A05 Security Misconfiguration" },
      { src: "OWASP Top 10 2017", id: "A6 Security Misconfiguration" },
      { src: "OWASP Top 10 2025", id: "A02 Security Misconfiguration" },
      { src: "CWE", id: "CWE-525" },
      { src: "CWE", id: "CWE-1022" },
      { src: "CWE", id: "CWE-524" },
      { src: "CWE", id: "CWE-444" },
      { src: "RFC", id: "RFC 9111 HTTP Caching" },
      { src: "RFC", id: "RFC 9110 HTTP Semantics" },
      { src: "PortSwigger Research", id: "Web cache deception research (2017)" },
      { src: "MDN", id: "MDN HTTP caching documentation" },
      { src: "OWASP Cheat Sheet", id: "HTTP Headers Cheat Sheet" },
      { src: "MITRE ATT&CK", id: "T1213 Data from Information Repositories" },
    ],
    cwe: { id: "CWE-525", name: "Use of Web Browser Cache Containing Sensitive Information" },
    owaspConceptKey: "security-misconfiguration",
    owaspYear: 2021,
    owaspId: "A05",

    explain: {
      what:
        "Almost every request a browser makes today passes through something that is not the origin server: a CDN edge, a reverse proxy, a corporate cache, a service worker. Those intermediaries store responses and serve them again, which is why the web is fast, and it is also a second place where a security decision is made that the origin never sees. A cache serves a stored response when the request that arrives looks like a request that has been seen before, and the definition of looks like is the cache key. Two different bugs live in that one decision, and they fail in opposite directions: poisoning makes the cache store the wrong thing, deception makes it store the right thing under a key the wrong visitor will ask for.",
      how:
        "Poisoning is a problem with what is missing from the key: the cache key is normally built from the request target plus whatever headers the response said it varies on, so if a response is generated from an input that is not in the key, two different requests produce one entry and the second visitor gets the first visitor's answer. The classic unkeyed input is the Host header - a shared cache that keys on the path alone, or that normalises the host out of the key, will serve one stored response for example.com and for anything else pointed at the same edge - and because the attacker can then request the poisoned key themselves, the response that comes back is their own page served to every other visitor, which upgrades the bug from a data leak to a persistent script injection against everyone who hits that cache. Deception is a problem with what is in the key but not in the path: a naive cache decides what to store by looking at the file extension, treating a request ending .css or .js as a static asset and passing everything else through, while modern single-page applications serve dynamically generated, user-specific HTML from paths that end in .js, so the attacker requests a path that ends in .js and is otherwise ignored and the cache stores that victim's generated HTML as a static asset - which is how the next user's name, account identifiers and rendered session data reach the wrong person. PortSwigger Research published this class in 2017, and its power is that no unusual capability is required, only a guessable URL and an extension the cache treats specially. Underneath both sits a simpler root cause: a response that varies by the user is cached at all, so anything returning account-specific HTML should carry Cache-Control: private, no-store and Vary on every header it actually depends on, and the defence has to be per response rather than global, because the useful question is not whether caching is on but who is allowed to reuse this particular response - and that answer changes between two URLs on the same site.",
      impact: [
        "A response built for one signed-in user is served to another, exposing rendered account data, identifiers and whatever the page put in the markup.",
        "A poisoned entry turns the CDN into a distribution point: the attacker's script runs for every visitor who hits the cached URL, not just for one.",
        "Session identifiers leak directly wherever they are rendered into HTML, or wherever a predictable path can be made to return one user's page to another.",
        "The leak is often discovered long after the fact, because the cached entry keeps serving the stale response until an eviction, which makes it hard to scope who was affected.",
      ],
      prevent: [
        "Decide cacheability per response. Anything generated per user or per session gets Cache-Control: private, no-store, and that decision belongs in the handler rather than in a global setting.",
        "Send Vary on every request header the response actually depends on, and make sure the intermediary is actually honouring it.",
        "Configure the CDN route to cache on the full normalised URL, and never on a header such as Host that the client controls.",
        "Do not decide cacheability from the file extension. Use explicit route rules, and turn off caching on endpoints that render a signed-in user's HTML.",
        "Purge aggressively and scope keys per tenant, so one bad entry is short-lived and one tenant's cache cannot serve another tenant's.",
      ],
    },

    history: [
      {
        year: 1999,
        title: "Shared caching gets written down properly",
        text: "The HTTP caching model is formalised: freshness lifetimes, validators for revalidation, and the rule that a response may be stored only under conditions the origin declares. The mechanism that matters for everything in this module is Vary, which lets a response state the request headers its content depends on, so a cache can key on them. It is from this document that the cache key has a definition at all, and the definition has one gap that took twenty years to exploit: it describes what a cache should do, and says nothing about intermediaries that decide to cache more aggressively than the origin intended.",
      },
      {
        year: 2005,
        title: "Caching moves into the path of every request",
        text: "Content delivery networks turn caching from an optional HTTP feature into infrastructure that sits in front of most large sites. The economics are the reason: serving a stored response is cheaper than computing one, so the pressure is always towards caching more, and the operational pressure is towards a single rule - cache everything, exclude the paths that break - rather than a decision per response. This is where the modern default of cache-everything-at-the-edge comes from, and it is the origin of the class of bug in this module: a policy that decides for the whole site what should have been decided for one response.",
      },
      {
        year: 2017,
        title: "Web cache deception is published",
        text: "PortSwigger Research publishes web cache deception, and it lands because a single-page application had become ordinary: the application shell is fetched from a path ending in .js, and the router serves it as a dynamically generated, user-specific document. The attack needs nothing exotic - guess a path that ends in .js, be a signed-in user, request it, and the edge stores the generated HTML as a static asset because that is how it decides what is static. The significance is that it turned a performance setting into a data leak with no capability requirement, and that the fix is architectural: stop inferring cacheability from the URL. The sibling problem, unkeyed header cache poisoning, was described in the same period and shares the cache key as its root cause.",
      },
      {
        year: 2017,
        title: "Security Misconfiguration at A6",
        text: "The 2017 OWASP Top 10 places this inside A6 Security Misconfiguration. The framing fits: nothing is broken in the application, the origin sets a reasonable Cache-Control, and the defect lives in a layer that most teams do not own. That is the recurring difficulty with this class. The response is correct when it leaves the server, and it becomes a shared object in a cache whose rules nobody on the team wrote. The category text also put a name to the broader version of the problem, which is using components with known vulnerabilities - the misconfiguration is in the interaction between a component and the way it has been deployed.",
      },
      {
        year: 2020,
        title: "The cache key normalises, and that is the risk",
        text: "As CDNs matured, they began normalising URLs before using them as keys: lower-casing the host, collapsing duplicate slashes, decoding percent-encoding, resolving dot-segments, and stripping a default port. Every one of those rules is defensible on its own and every one of them is a place where two different requests can become one key. The security-relevant consequence is that the cache key is no longer something you can read off the request line, and the way to reason about it changed: rather than asking what the URL is, you have to ask what the edge will turn it into, and that function is configuration. This is the same shape of problem as URL parsing in SSRF, reached from the other direction.",
      },
      {
        year: 2021,
        title: "Security Misconfiguration at A05",
        text: "The 2021 edition carries the risk at A05. The important change is not the ranking but the framing of the control: the guidance is that caching decisions belong to the response, not to a blanket edge rule. In practice that means a Cache-Control value chosen in the handler for each class of content, Vary on whatever the response depends on, and a CDN route configured to match rather than to exclude. A global cache-everything rule is convenient and it is the reason this module exists.",
      },
      {
        year: 2022,
        title: "HTTP caching is rewritten as RFC 9111",
        text: "RFC 9110 and RFC 9111 reorganise the HTTP specifications, with caching given its own document and the semantics document reduced to what an origin server must do. The practical value here is precision about three things that were previously folklore: freshness and revalidation, the exact conditions under which a response may be stored and reused, and Vary as the declared list of request dimensions the response depends on. Every defence in this module - private, no-store, Vary, key normalisation - is an application of one of those rules, and having them in one document makes it much easier to argue about what a particular response is allowed to do.",
      },
      {
        year: 2025,
        title: "A02, and unkeyed inputs moved up the stack",
        text: "Security Misconfiguration is A02 in the 2025 edition. Where the class stands: the deception attack is well understood and mostly retired, because applications stopped generating user-specific HTML from paths that end in .js and CDNs stopped inferring cacheability from the extension. The poisoning half has not gone away, because it keeps finding inputs that are not in the key, and those inputs have multiplied: HTTP/2 multiplexing means several requests share one connection, so a front-end proxy and an origin server can disagree about where one request ends and the next begins - CWE-444, request smuggling - and a cache sitting in front of that disagreement has no way to tell which parsing was used to build its key. Host header injection remains the textbook unkeyed input. The durable answer is the same in both halves: the origin states the policy for each response explicitly, and the edge is configured from an explicit allow-list of routes rather than from a denial list of exceptions. Everything else is an argument with the edge's configuration, and that argument is lost one response at a time.",
      },
    ],

    diagram: {
      caption: "One stored response, served to whoever asks with the same key",
      nodes: [
        { text: "Attacker requests a URL whose extension lies", tone: "attacker" },
        { text: "Edge decides it is static and stores the body", tone: "app" },
        { text: "The body is another user's generated HTML", tone: "danger" },
        { text: "Next visitor to that path gets the stored page", tone: "wire" },
        { text: "Session data and account data in the markup", tone: "data" },
        { text: "Poisoned entries also run script for every visitor", tone: "danger" },
        { text: "Fix: private, no-store per response, full-URL keys", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1, label: "extension says static" },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 1, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "headers",
      mode: "sort",
      title: "Order the cache defences",
      prompt:
        "One request arrives at a CDN edge in front of an application that returns user-specific HTML. Five controls exist. Put them in the order a careful implementation applies them, earliest first.",
      items: [
        {
          text: "The edge forms its key from the normalised URL only, ignoring headers such as Host",
          why: "This is the first decision that happens, before the origin is even contacted: whether this request and some earlier request are the same object. If the key is built from a client-controlled header, two different requests collapse into one entry and everything after this point is answering the wrong question. It is also the decision nobody on the application team makes consciously, which is why it has to be first.",
        },
        {
          text: "Monitoring watches for one session's response being served to another",
          why: "Detection, not control. It cannot prevent the first poisoned entry and it does not stop a single leaked response from being delivered; what it buys is scope - knowing how many visitors were served a stale or wrong body, which is the difference between a fixable incident and an unanswerable one. It belongs after every control that would have prevented it.",
        },
        {
          text: "The origin sets Cache-Control: private, no-store on the user-specific response",
          why: "This is the origin's answer, and it arrives with the response rather than before the request. Its power is that it is unambiguous and that the fetch standard requires shared caches to honour it, so a CDN that respects the response cannot store the body regardless of what its extension heuristic says. It comes before Vary because a response that must not be stored makes the question of what to key on irrelevant.",
        },
        {
          text: "The CDN route rules refuse to cache paths whose extension does not match the content",
          why: "A refinement of the same edge decision, and it closes the deception case specifically: no amount of key correctness helps when the extension is what decides cacheability. It sits with the key formation because it is enforced in the same place and on the same request, and it is a coarse control - the right answer is to configure cacheability from an explicit route list rather than to exclude the dangerous extensions.",
        },
        {
          text: "The response declares the dimensions it varies on with Vary",
          why: "Vary only has meaning for a cache that is storing something, and for the responses that legitimately can be shared - an anonymous page with no session cookie, a public asset. It comes after Cache-Control has established that this response is in the shared category at all, and it is the mechanism that stops one origin's or one variant's entry being replayed for another.",
        },
      ],
      order: [0, 3, 2, 4, 1],
    },
  },
];

export default browserModules;
