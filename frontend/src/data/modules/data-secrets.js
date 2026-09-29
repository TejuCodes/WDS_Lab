/**
 * ============================================================
 * MODULE FAMILY: DATA & SECRETS
 * ------------------------------------------------------------
 * Same schema as ./injection.js - read that file for the full
 * key-by-key contract. Nothing here depends on the OWASP backend
 * dataset; OWASP is one reference among several and the
 * `owaspConceptKey` / `owaspYear` / `owaspId` keys are optional.
 *
 * The four lessons in this family share one shape of mistake: the
 * attacker supplies a *locator* rather than a payload. A file path,
 * a URL, an XML document, a serialized byte string - in each case
 * the dangerous text is interpreted by something the application
 * trusts, and the attacker only has to influence which document is
 * read.
 *
 * SAFETY: nothing here is a working exploit. Paths and payloads are
 * shown the way a textbook shows them.
 * ============================================================ */

export const dataSecretsModules = [
  /* ==========================================================
     1. PATH TRAVERSAL & DIRECTORY LISTING
     ========================================================== */
  {
    key: "path-traversal",
    title: "Path Traversal & Directory Listing",
    family: "data-secrets",
    icon: "FaRoute",
    severity: "high",
    tagline: "A filename that points outside the document root turns your server into a file browser.",
    refs: [
      { src: "OWASP Top 10 2025", id: "A01 Broken Access Control" },
      { src: "OWASP Top 10 2017", id: "A5 Broken Access Control" },
      { src: "CWE", id: "CWE-22" },
      { src: "CWE", id: "CWE-36" },
      { src: "RFC", id: "RFC 3986" },
      { src: "OWASP Cheat Sheet", id: "Path Traversal Prevention Cheat Sheet" },
      { src: "MITRE ATT&CK", id: "T1083 File and Directory Discovery" },
    ],
    cwe: { id: "CWE-22", name: "Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal')" },

    explain: {
      what:
        "The application takes part of a path from the request and hands it to the filesystem, intending it to stay under one directory. A path is not just a name; it can be relative, and it can contain dot-segments that mean \"go up one level\". So if the application does not decide where the result must land, the caller decides for it. Traversal reads a known file outside the root; directory listing is the sibling mistake where the application enumerates a directory for the caller and hands back names, sizes and dates, which turns one guessed path into a map of the disk.",
      how:
        "The critical point is that ../ is not a hack. RFC 3986 defines the dot-segments and the relative-reference resolution algorithm, so a URI is *specified* to climb the tree; the operating system is simply following the specification when it resolves the same syntax. That is why naive concatenation fails: \"/var/www/uploads/\" + name is only correct while name contains no separators and no parent references, and the attacker supplies both. Naive filters then fail a second time, because a browser or proxy will happily send the separators percent-encoded (%2e%2e%2f) and sometimes doubly encoded, so a filter that searches the decoded string once can be bypassed by encoding the traversal characters. The reliable control is to stop working with caller-chosen names at all: map an opaque file id to a path the application looks up itself, so the caller supplies a value and never a path. If paths must be accepted, resolve the candidate to a canonical absolute path, then check containment against the root, and enumerate the root once at startup so a symlink planted later cannot move the boundary.",
      impact: [
        "Read any file the service account can read: private keys, source, environment files, database credentials.",
        "Directory listing turns a single guess into a full inventory of a directory you did not intend to publish.",
        "On older stacks, a truncated path can be written as well as read, so the bug becomes arbitrary file write.",
        "Source disclosure is usually the real prize: credentials in the code are the next stage, not the end.",
      ],
      prevent: [
        "Take a file id, not a path, and resolve it against a server-side table or a generated opaque name.",
        "If a path is unavoidable, canonicalise it with a realpath-style call and then verify it is still inside the allowed root.",
        "Never build a filesystem path by concatenating a request value; pass the components to a library that takes them separately.",
        "Run the service with no read permission on anything outside the directory it must serve, so the containment check is a second line rather than the only one.",
        "Disable directory indexes in the web server, and never generate a listing in application code for an arbitrary directory.",
      ],
    },

    history: [
      {
        year: 1984,
        title: "The null byte in the filename",
        text: "On Unix, a filename is a string of bytes and nothing reserves a value as a terminator, so application code that treats a filename as a C string - copied into a fixed buffer, or passed to a library that uses strcpy - could be cut short with a null byte. Combined with a file path that did not exist yet but would be created, or with an extension check performed after truncation, this let an attacker request a file the server would otherwise refuse. It is a historical note rather than a live bug: the truncation was in the application, not in the kernel, and it is essentially impossible to reintroduce in managed-runtime stacks. The pattern matters because it is the first clear example of a validation step that ran in the wrong order - the extension was checked after the whole string had already been committed to.",
      },
      {
        year: 1995,
        title: "Web servers make it reachable over HTTP",
        text: "As static file serving became the normal way to publish content, the directory on disk became reachable through a URL, and the mapping from one to the other became a security boundary. Any dynamic application that also served files inherited the same boundary. This is where the CWE-22 family was catalogued: the weakness is not the filesystem, it is an application that lets a caller influence a path without constraining the result.",
      },
      {
        year: 2003,
        title: "In the first OWASP Top 10, as a sub-point of injection",
        text: "The inaugural OWASP Top 10 did not give path traversal its own entry. The original list put it under \"Improper Include/Execute of File\" style flaws and, as later editions framed it, under the broader A6 \"Insecure Application Configuration\". The category was understood as configuration: the directory and the mapping were the configuration, and getting them right was a deployment concern.",
      },
      {
        year: 2007,
        title: "Insecure Application Configuration, still",
        text: "\"Insecure Application Configuration\" carried the class at A2, alongside the more general \"Improper Filename or Path\" wording that was later formalised as CWE-73 External Control of File Name or Path. The interesting development is that the listing became about component hardening and directory permissions rather than about the input string, which pushed the problem away from the developers writing path concatenation and towards the administrators who chose the process privileges.",
      },
      {
        year: 2013,
        title: "Broken Access Control at A5",
        text: "The 2013 edition separated the idea of authorisation from the idea of misconfiguration. Path traversal is arguably the clearest case of the two overlapping: the application has an intended boundary, the document root or the upload directory, and the bug is that the boundary is not enforced. This edition also included A4 Insecure Direct Object References, the neighbouring bug where a caller substitutes a valid but unauthorized identifier - the same weakness with a cleaner name attached.",
      },
      {
        year: 2017,
        title: "Broken Access Control at A5, consolidated",
        text: "OWASP 2017 folded IDOR into \"Broken Access Control\" and moved the category to A5, describing it as the number one web application security risk. Path traversal and directory listing live here comfortably, because both are failures to constrain which resource a caller may reach rather than failures to encode a string.",
      },
      {
        year: 2021,
        title: "A01 Broken Access Control",
        text: "The 2021 rewrite of the category to A01 made the word \"access\" explicit and grouped everything about not being where you should be, including server-side request forgery, which was simultaneously promoted to A10 in the same edition. Reading a file outside the root is the canonical example of the category: the file is real, the identifier is valid, and the only failure is that the caller should not have been allowed to ask for it.",
      },
      {
        year: 2025,
        title: "A01 again, and the fix is no longer a string check",
        text: "Broken Access Control remains A01 in the 2025 edition. The lasting change is on the defence side: the advice is no longer to filter the path but to never construct one from request data. The modern default is an opaque id, a canonicalisation step, and process permissions that mean a mistake in application code cannot read the secrets anyway. The remaining exposure is where paths genuinely must be user-shaped - archive extraction, template includes, document converters - where containment checks have to be done after canonicalisation, and where null-byte and encoding tricks still find legacy components.",
      },
    ],

    diagram: {
      caption: "One filename, two different ways to lose the boundary",
      nodes: [
        { text: "Attacker sends ?file=../../etc/passwd", tone: "attacker" },
        { text: "Handler builds the path by concatenation", tone: "app" },
        { text: "Filesystem resolves the dot-segments upward", tone: "danger" },
        { text: "Read returns a file outside the document root", tone: "danger" },
        { text: "Directory listing returns names, sizes, dates", tone: "danger" },
        { text: "Attacker maps the disk and picks a better target", tone: "attacker" },
        { text: "Fix: map an opaque file id to a fixed base directory", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2, label: "RFC 3986 dot-segments" },
        { from: 2, to: 3 },
        { from: 2, to: 4, label: "no listing" },
        { from: 4, to: 5 },
        { from: 1, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "payload",
      title: "Payload Workshop: which value actually escapes the root?",
      prompt:
        "The endpoint reads a file with fs.readFile(base + req.query.file). Only one of these four values makes the resolved path land outside the base directory. Pick it, then judge the proposed control.",
      base: "GET /download?file={slot} HTTP/1.1",
      slot: "file",
      options: [
        {
          text: "report%20q3.pdf",
          note: "A percent-encoded space and an ordinary name. Decodes to a filename inside the base directory; the path stays where the application put it.",
        },
        {
          text: "..%2f..%2f..%2fetc%2fpasswd",
          note: "The classic traversal string, percent-encoded so a filter that greps the raw query string for '..' does not match it. Decoded, the separators are real and the path climbs out of the base directory.",
        },
        {
          text: "a_very_long_but_harmless_filename_v2.pdf",
          note: "Long, but no separators and no dot-segments. Length is not the weakness here; the resolved path is still inside the base directory.",
        },
        {
          text: "index.html#download",
          note: "The fragment is never sent to the server, so the application only ever sees index.html. This is a client-side address-bar trick, not a path manipulation.",
        },
      ],
      answer: 1,
      why: {
        "0": "Correct that it is safe, and correct about why: an encoded space is a character in a filename, not a separator. The decoded value is a single path component, so concatenation produces a path still rooted at the base directory.",
        "1": "Correct. %2f is the separator and %2e%2e the parent reference, so after a single decode the concatenated string contains real dot-segments and the filesystem resolves them, landing on a file outside the base directory. This is the one option that actually demonstrates the flaw.",
        "2": "Safe. There is nothing to decode into a separator and no parent reference, so the result is a long filename in the same directory. A length limit is a separate control entirely.",
        "3": "Ineffective as an attack, and it never reaches the handler in this form. A fragment after # is a client-side concept and is not part of the request target the server receives, so the server sees only index.html.",
      },
      check: {
        prompt:
          "Will a WAF rule that blocks any request whose query string contains the literal text /etc/passwd stop option 1?",
        answer: false,
        why:
          "No, and the reason is the same encoding gap that makes the attack work. The WAF inspects the query string as transmitted, where the text is ..%2f..%2f..%2fetc%2fpasswd and the substring /etc/passwd does not appear. The application decodes after the WAF has already decided. A rule would have to match the decoded form, and at that point it is re-implementing the parser badly, because the same request can be encoded once, twice, or normalised differently by each hop. The check that holds is containment on the server after canonicalisation, not a string match in front of it.",
      },
    },
  },

  /* ==========================================================
     2. SSRF
     ========================================================== */
  {
    key: "ssrf",
    title: "Server-Side Request Forgery (SSRF)",
    family: "data-secrets",
    icon: "FaBroadcastTower",
    severity: "high",
    tagline: "The attacker supplies the address; the server makes the request, from inside the network.",
    refs: [
      { src: "OWASP Top 10 2021", id: "A10 Server-Side Request Forgery (SSRF)" },
      { src: "OWASP Top 10 2025", id: "A01 Broken Access Control" },
      { src: "CWE", id: "CWE-918" },
      { src: "CWE", id: "CWE-441" },
      { src: "OWASP Cheat Sheet", id: "Server Side Request Forgery Prevention Cheat Sheet" },
      { src: "MITRE ATT&CK", id: "T1018 Remote System Discovery" },
      { src: "MITRE ATT&CK", id: "T1046 Network Service Discovery" },
    ],
    cwe: { id: "CWE-918", name: "Server-Side Request Forgery (SSRF)" },
    owaspConceptKey: "ssrf",
    owaspYear: 2021,
    owaspId: "A10",

    explain: {
      what:
        "The application fetches a URL supplied by the caller - to preview a link, import a feed, call a partner API, resize a remote image. The request is issued by the server, from the server's network position, using the server's credentials. That makes the server a confused deputy: it holds trust that the caller does not have and spends it on the caller's instruction. SSRF is a network-position problem first and a parsing problem second.",
      how:
        "The traditional framing comes from request smuggling: an internal service trusts a network perimeter, and anything that can send a request from inside that perimeter inherits the trust. SSRF supplies that ability from the internet, so the interesting targets are addresses the attacker cannot reach directly - admin panels, unauthenticated internal APIs, and the cloud instance metadata endpoint, which on most cloud providers is a plain HTTP address reachable only from the host and which returns short-lived credentials for the role attached to the instance. The endpoint being a credential store is why SSRF moved up rather than staying an oddity. Getting past an allow-list of hostnames takes three distinct tricks, and each defeats a different control: a redirect, where an allowed host answers 302 with a Location pointing at a forbidden one; DNS rebinding, where the name resolves to an allowed address at check time and a forbidden one when the fetch actually connects; and scheme variation, where WebSocket and gopher handlers are more capable than the HTTP client the author had in mind. Blind SSRF, where the response never comes back, is still an attack: detection uses out-of-band interaction, since a change in timing, a connection the service makes outward, or a DNS lookup the attacker's own name server observes is enough to confirm the server made the request. The reason host allow-listing underdelivers is that every URL parser disagrees about where the authority actually ends - backslashes, credentials before the host, encoded separators, trailing dots, and case - so the string the validator approved and the URL the client fetched can be two different hosts.",
      impact: [
        "Read the instance metadata service and take short-lived cloud credentials, escalating far beyond the web process.",
        "Reach internal admin interfaces and unauthenticated APIs that assume every caller is on the local network.",
        "Port-scan the internal network from outside, using response timing, status codes or out-of-band callbacks to tell open ports from closed ones.",
        "Abuse the server as a relay to attack third parties, which can make your address the source of the traffic and your logs the evidence.",
      ],
      prevent: [
        "Prefer not to fetch arbitrary URLs. Where a fixed partner set exists, allow-list those and nothing else.",
        "Validate with a strict parser and a strict allow-list of scheme, host and port, then re-validate the host you actually connected to.",
        "Resolve the name yourself, check every returned address against the allow-list, and pin that address for the connection so a second lookup cannot change the answer.",
        "Disable redirect following, or re-run the full allow-list check on every hop rather than only on the first.",
        "Put an egress proxy or network policy in place so the application cannot reach link-local and metadata addresses or the RFC 1918 ranges at all - the control that holds even when the application is wrong.",
      ],
    },

    history: [
      {
        year: 2004,
        title: "The trust-the-network era it lives in",
        text: "SSRF is not really a new bug; it is a consequence of a trust model. Networks were treated as the security boundary, internal services authenticated the network rather than the caller, and any host on the segment could reach any service on it. A 2004-era application that fetched a caller-supplied URL had no reason to distrust the response, because the attacker who could supply the URL was usually already trusted. The flaw only became visible once that assumption stopped holding.",
      },
      {
        year: 2013,
        title: "Public research names the class",
        text: "PortSwigger Web Security Academy research published in 2013 gave SSRF its public shape, with the discovery technique that remains its signature: vary a single letter of the domain and watch the DNS server, because a request that resolves a name the attacker controls proves the server is making the connection. The same work popularised the gopher and other-protocol routes into internal services, showing that a validator checking for http:// is not the same as a client that can only do http.",
      },
      {
        year: 2017,
        title: "Absent from the Top 10",
        text: "The 2017 OWASP Top 10 had no SSRF entry. The closest homes were A5 Broken Access Control and A1 Injection, neither of which described the distinctive part: the server's network position being used as an attack surface. The absence is often cited as a sign that the list lagged behind practice, since SSRF was already a routine bug bounty finding and a common cloud-metadata path to credentials.",
      },
      {
        year: 2018,
        title: "The cloud metadata endpoint turns it into a credential path",
        text: "Cloud instance metadata services turned SSRF from a reconnaissance problem into a privilege escalation one. The endpoint is a plain HTTP address on a link-local address that the host can reach and the internet cannot, and it hands back short-lived credentials for the role attached to the instance. SSRF therefore stopped being about curiosity and became the standard first move after a server-side request forgery in a cloud environment.",
      },
      {
        year: 2021,
        title: "Promoted to A10 in its own right",
        text: "The 2021 edition of the OWASP Top 10 gave SSRF its own category, A10, on the reasoning that its blast radius is different from ordinary injection: the payload is not text that escapes a parser, it is a request that leaves from a privileged position. The entry also pushed the new generation of defences - allow-listing rather than block-listing, and network-level egress control - which is a rare case of the Top 10 recommending a control outside the application.",
      },
      {
        year: 2023,
        title: "Parsing bugs become the main defensive failure",
        text: "By this point the community's attention had moved to the gap between validation and connection. URL parsers disagree about where the authority ends - backslash as separator, a userinfo section before the real host, encoded delimiters, a trailing dot, differing handling of IPv4 shorthand and IPv6 brackets - so a validator and the client can be looking at two different hosts while both believe they are reading one string. The accepted answer became: parse once with a strict parser, allow-list, resolve, check every address, and pin the connection to the address that was checked.",
      },
      {
        year: 2025,
        title: "Absorbed into Broken Access Control at A01",
        text: "The 2025 edition folded SSRF into A01 Broken Access Control rather than keeping a separate entry. The reasoning is the same grouping that moved path traversal there: the vulnerability is about a caller reaching a resource it should not be able to reach, using a valid identifier - a URL - that the server then dereferences with its own authority. The rank fell, not the risk. Most of the same mitigations still apply, and the network-level control is now the consensus answer: if the application never had egress to the metadata address or the private ranges, none of the parsing subtleties matter.",
      },
    ],

    diagram: {
      caption: "The server spends its network position on someone else's instruction",
      nodes: [
        { text: "Attacker supplies a URL for the service to fetch", tone: "attacker" },
        { text: "Service fetches it from inside the network", tone: "wire" },
        { text: "Allow-list passed; the name resolves to a different address", tone: "danger" },
        { text: "Request lands on an internal-only service", tone: "danger" },
        { text: "Response carries cloud credentials or internal data", tone: "impact" },
        { text: "Block egress to metadata and private ranges at the network", tone: "defence" },
        { text: "Fix: allow-list scheme, host and port before any fetch", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2, label: "after the allow-list check" },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 1, to: 5, label: "defence in depth" },
        { from: 1, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "headers",
      mode: "pick",
      title: "Where should the outbound fetch be constrained?",
      prompt: "The service calls partner APIs. Pick the control that actually removes SSRF as an attack surface.",
      question:
        "An endpoint takes a URL and fetches it with an HTTP client that follows redirects, resolves DNS itself, and accepts any scheme the handler library supports. Which single change most reliably removes the ability to reach internal addresses?",
      options: [
        {
          text: "Blocklist the string '127.0.0.1' and the private ranges in the URL before fetching.",
          note: "A string check on the caller's input. It has to guess the encoding the client will end up using, and it knows nothing about what the hostname resolves to.",
        },
        {
          text: "Allow-list the exact scheme, host and port the service is allowed to call, and re-check after every redirect hop.",
          note: "Decides in advance what may be contacted, rather than guessing what must not be. Re-checking each hop closes the 302 route out of the allow-list.",
        },
        {
          text: "Resolve the hostname, and if it returns a private address, retry once in case it was a stale answer.",
          note: "The right instinct, wrong implementation. Retrying is the hole: the answer can differ between the two lookups, so the address that gets checked is not the address that gets dialled.",
        },
        {
          text: "Set a short timeout on the HTTP client and limit the response body size.",
          note: "Availability and resource limits. Sensible hygiene, but the request still goes out and still reaches the target.",
        },
      ],
      answer: 1,
      why: {
        "0": "Wrong in the general case. Blocklists enumerate what you have thought of, and a host can reach a private address without those strings ever appearing in the input: a name that resolves to one, a redirect, or a URL whose authority parses differently for the validator than for the client. A permissive validator with a blocklist is a smaller version of the same mistake as relying on the default rules.",
        "1": "Correct. An allow-list is a decision about what is permitted rather than a prediction of what might be attempted, so an address nobody allow-listed is never contacted - including one reached through a redirect, which is why the per-hop re-check matters. It also fails closed: a scheme, host or port you did not list is refused rather than inspected.",
        "2": "Wrong, and instructive. A single check followed by a retry is exactly the race that DNS rebinding exploits: the first lookup, done by the validator, returns an allowed address; the second, done by the client, returns the forbidden one the attacker wanted. The check has to be bound to the connection - resolve once, filter the addresses, then connect to the address that was filtered.",
        "3": "Wrong as a security control. A timeout and a body limit protect the service's own resources and reduce how much an attacker can learn, but they do not stop the request. The server still contacts the internal address, which is the part that matters.",
      },
    },
  },

  /* ==========================================================
     3. XXE
     ========================================================== */
  {
    key: "xxe",
    title: "XML External Entity (XXE)",
    family: "data-secrets",
    icon: "FaFileCode",
    severity: "high",
    tagline: "An XML document can name another document, so parsing input can be made to read the disk.",
    refs: [
      { src: "OWASP Top 10 2017", id: "A4 XML External Entities (XXE)" },
      { src: "OWASP Top 10 2021", id: "A03 Injection" },
      { src: "CWE", id: "CWE-611" },
      { src: "CWE", id: "CWE-776" },
      { src: "W3C", id: "XML 1.0 specification" },
      { src: "OWASP Cheat Sheet", id: "XML External Entity Prevention Cheat Sheet" },
      { src: "MITRE ATT&CK", id: "T1005 Data from Local System" },
    ],
    cwe: { id: "CWE-611", name: "Improper Restriction of XML External Entity Reference" },
    owaspConceptKey: "xxe",
    owaspYear: 2017,
    owaspId: "A4",

    explain: {
      what:
        "XML has a feature that other data formats do not: a document can declare a symbolic name for some text, and the parser substitutes it wherever that name appears. The text can be written inline, or it can be said to live somewhere else - in a file, or at a URL. That is the entity declaration, and it is defined by the XML specification, not invented by any parser. So a document that arrives from a stranger is not just data; it is a small program in a substitution language, and if the parser honours external entities it will go and read what the document names. The marker to look for is DOCTYPE: it is the declaration section of a document, and in practice a document that needs it is uncommon, which is why the presence of a DOCTYPE in input is a useful signal on its own.",
      how:
        "There are several ways the document reaches outside, and they are worth separating because the defences differ. External general entities are declared with a SYSTEM identifier and are the classic case, used either to read a local file into a field or to make the server fetch a URL the attacker watches. Parameter entities are the same mechanism for the DTD itself rather than the document body, and because they are only allowed in certain positions they were historically the way to reach the classic case when a parser blocked the obvious form. XInclude is a separate XML feature, an element that pulls in another document, which is not an entity at all and so survives a policy that only disables entities. XSLT can reference documents from a stylesheet, which means a feature intended for document transformation can be a file read if the stylesheet is attacker-influenced. The denial-of-service variant is different in mechanism: nested entity declarations that each expand to references of the next, so one short document expands into an astronomical amount of text, which is CWE-776 rather than CWE-611. The reason the correct fix is in the parser configuration is that every variant is the same underlying mistake: a parser configured to resolve external references. Turning off DTD processing and external entity resolution removes the class rather than one payload, because a filter that only blocks the phrase DOCTYPE does nothing about an obfuscated declaration, about parameter entities, or about XInclude.",
      impact: [
        "Read local files as the service account, including configuration, keys and anything the application can see.",
        "Cause the server to make outbound requests to arbitrary hosts, which becomes SSRF with a different payload format.",
        "Denial of service through entity expansion, where a small document expands into gigabytes of text.",
        "Where the parsed result is reflected without encoding, a file read turns into data exfiltration to the attacker directly.",
      ],
      prevent: [
        "Disable DTD processing and external entity resolution in the parser. This is the primary control and it is a configuration setting, not a code path.",
        "Where XML is not required, accept a format with no entities at all - JSON is the common answer - and keep the XML parser out of the build entirely.",
        "If DTDs are genuinely needed, allow them for trusted internal XML only, and never for input crossing a trust boundary.",
        "Apply entity-expansion and attribute-count limits so a document that is allowed cannot become a denial of service.",
        "Disable XInclude and XSLT in parsers exposed to untrusted input, since neither is an entity and neither is covered by the entity settings.",
      ],
    },

    history: [
      {
        year: 1998,
        title: "XML 1.0 defines the entity mechanism",
        text: "The XML 1.0 specification from W3C defines external entity references: a document may declare an entity with a SYSTEM identifier, and the parser retrieves the entity's replacement text from that location. The intent was composition - a shared header, a standard entity set, a vocabulary defined once and reused - and the same feature lets a document name any file the parser process can read. The design is not a bug in XML; it is a capability that has to be switched off when the document is untrusted.",
      },
      {
        year: 2004,
        title: "The blind and in-band forms are distinguished",
        text: "As XML became the default format for SOAP services, document type definitions, Office formats and configuration files, the practical consequences of external entities worked themselves out into two forms. In-band, the entity's text is substituted into the parsed result and often reflected in a response, so the file contents come back directly. Out-of-band, the parser only needs to make the retrieval - the content is never returned - which is enough to confirm the vulnerability through a callback and to use the parser as a request proxy. Recognising that the blind form is still exploitable, and is often the only form available, was an important part of the practical guidance.",
      },
      {
        year: 2008,
        title: "The billion-laughs variant appears",
        text: "A small set of nested entity declarations, each referencing the previous one several times, expands into an enormous amount of text. It needs no external access at all, so it also works on parsers that already refuse external entities, and it is a denial of service rather than a disclosure. The pattern is usually called the billion laughs after the joke in the original paper, and the defence is a different one: limits on total expansion size, total entity count and attribute count, set on the parser independently of the entity settings.",
      },
      {
        year: 2012,
        title: "Parser defaults start to change",
        text: "Library maintainers began disabling external entity resolution and DTD processing by default after the class appeared repeatedly in vulnerability databases and in framework advisories. The change is quiet but decisive: the vulnerability disappears not because the application was fixed, but because the parser the application already used stopped honouring the feature. Applications that explicitly re-enabled the features to handle a trusted partner's DTDs, or that shelled out to a command-line parser which kept the old defaults, kept the bug.",
      },
      {
        year: 2014,
        title: "A dedicated OWASP category",
        text: "OWASP made XXE a named entry in the 2014 release, on the grounds that it deserved its own ranking: it produced remote file disclosure and outbound request forgery through a single feature of a widely deployed format, and no other category covered it. The 2017 edition kept it at A4, and the accompanying text called out in-band disclosure, blind exfiltration by parameter entity, denial of service through entity expansion, and the fact that the errors are often swallowed in the parser's response.",
      },
      {
        year: 2017,
        title: "A4, the peak of public reporting",
        text: "The 2017 edition placed XML External Entities (XXE) at A4 and it was at its most visible. The reporting peak was driven by new parser bindings and new SOAP-consuming services appearing with the old defaults still in place, plus the discovery that error messages from verbose parsers leaked the file contents back to the caller. Documentation and mailing-list traffic in this period is the source of most of the specific hardening advice still in use: disable DTDs, disable external entities, cap expansion, and do not echo parser errors to the client.",
      },
      {
        year: 2021,
        title: "Dissolved into A03 Injection",
        text: "The 2021 edition dropped the dedicated category. XXE is now covered under A03 Injection, on the reasoning that it is the same root cause as the rest of the list: untrusted text reaching an interpreter, in this case an XML parser rather than a database or a template engine. The category text names external entity resolution explicitly, so the practical guidance did not change, only where a reader would look for it.",
      },
      {
        year: 2025,
        title: "A05, and largely a solved problem",
        text: "Injection sits at A05 in the 2025 edition. By now the mainstream parsers refuse DTDs and external entities by default, so most applications that accept XML are not vulnerable without deliberately turning the features back on. What remains is the interesting residue: components that shell out to an external command-line tool whose defaults were never changed, SOAP clients and document converters with their own configuration, and XInclude and XSLT, which are separate features and are not covered by the entity settings at all. The class did not disappear because developers got better at writing parsers. It disappeared because the library stopped doing the dangerous thing by default.",
      },
    ],

    diagram: {
      caption: "A DOCTYPE in the input makes the parser fetch a document",
      nodes: [
        { text: "Attacker uploads XML with a DOCTYPE and an entity", tone: "attacker" },
        { text: "Parser reads the DTD and resolves the SYSTEM identifier", tone: "app" },
        { text: "External entity expands to local file contents", tone: "danger" },
        { text: "File text is substituted into the parsed result", tone: "danger" },
        { text: "Error or reflected value returns it to the attacker", tone: "danger" },
        { text: "Nested entities instead expand until memory is gone", tone: "danger" },
        { text: "Fix: disable DTD processing in the parser", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2, label: "SYSTEM" },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 0, to: 5, label: "billion laughs" },
        { from: 1, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which line makes the parser reachable?",
      prompt: "A service accepts a SOAP-ish XML body. Three configuration lines; only one leaves XXE possible.",
      language: "java",
      lines: [
        { text: "DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();", vulnerable: true },
        { text: "f.setFeature(\"http://apache.org/xml/features/disallow-doctype-decl\", true);" },
        { text: "f.setExpandEntityReferences(false);" },
        { text: "Document doc = f.newDocumentBuilder().parse(body);" },
        { text: "return readOrderId(doc.getDocumentElement());" },
      ],
      explain:
        "A bare DocumentBuilderFactory.newInstance() takes the platform's default configuration, and the long-standing default for a JAXP parser is to permit DTDs and to resolve external entities - so the two lines after it are what remove the risk, not the line itself. Line 2 disallows the DOCTYPE declaration outright, which is the strongest of the three settings because a document that cannot declare entities cannot reference one. Line 3 turns off expansion, which closes the substitution path and the in-band disclosure but still lets a nested-declaration denial of service run, so it is not sufficient on its own. Line 4 is fine: parsing the body is exactly what the service has to do, and once the factory is configured correctly there is nothing dangerous about the call. Line 5 is fine for the same reason - the resulting DOM holds only what the document actually declared.",
    },
  },

  /* ==========================================================
     4. INSECURE DESERIALIZATION
     ========================================================== */
  {
    key: "deserialization",
    title: "Insecure Deserialization",
    family: "data-secrets",
    icon: "FaCubes",
    severity: "critical",
    tagline: "Some serialization formats carry the class name as data, and the runtime will believe it.",
    refs: [
      { src: "OWASP Top 10 2021", id: "A08 Software and Data Integrity Failures" },
      { src: "OWASP Top 10 2017", id: "A8 Insecure Deserialization" },
      { src: "CWE", id: "CWE-502" },
      { src: "OWASP Cheat Sheet", id: "Deserialization Cheat Sheet" },
      { src: "MITRE ATT&CK", id: "T1204.002 Malicious File" },
      { src: "MITRE ATT&CK", id: "T1195.002 Compromise Software Supply Chain" },
    ],
    cwe: { id: "CWE-502", name: "Deserialization of Untrusted Data" },
    owaspConceptKey: "integrity-failures",
    owaspYear: 2021,
    owaspId: "A08",

    explain: {
      what:
        "Serialization formats are grammars for rebuilding an object graph: a type declaration, then a stream of values. Most formats are explicit that they carry values only - JSON has no place to write a class name, so deserializing it is a type-directed walk of a structure the parser already knows. The dangerous formats are the other kind, where the byte stream says what it is, and the runtime instantiates that type and populates it. If the type is attacker-chosen, the attacker is choosing which class the runtime will construct, and the runtime is the confused deputy. The vulnerability is not code injection; it is the absence of any check that the type named in the stream was the type expected.",
      how:
        "Java's native serialization is the standard example. ObjectInputStream reads a class name from the stream, loads that class, and calls its readObject; a serialized object graph is a program that the runtime executes step by step, so any class on the application's classpath whose readObject or finalizer does something useful can be chained together - trigger a hash lookup, reach into a comparison, a class loader, or a proxy - and the chain ends in a command. There is no payload string to spot, because the payload is the type graph. PHP object injection is the same shape with different mechanics: unserialize honours a class name in the string, and a class with a magic method such as __wakeup or __destruct is invoked during reconstruction, so any magic method on the classpath can be the hook. Python's pickle is blunter still - the opcode set includes instructions for calling functions and importing modules, so unpickling untrusted bytes is arbitrary code execution by design, and the documentation says so. .NET's BinaryFormatter had the same problem, and the runtime team eventually removed it from the framework and issued guidance to stop using it, which is the clearest example of a platform treating the design rather than a single bug as the defect. The defence is a signature. Signing or encrypting the bytes and verifying the signature before deserializing is what prevents the type-confusion attack, because the attacker can no longer change the type graph without invalidating the signature; if the bytes are unchanged, the graph is the one the publisher wrote. Where signing is impractical, the alternative is a format that cannot express a type at all.",
      impact: [
        "Remote code execution on the server, with the privileges of the application and no injection string to filter.",
        "Reading or corrupting any application state the process can reach, including caches, sessions and stored credentials.",
        "Where deserialization happens in a client, code execution in the victim rather than on the server, which is the supply-chain case.",
        "A gadget chain that is not patched in a shared library still works after the application itself is fixed, so the defect outlives the fix.",
      ],
      prevent: [
        "Do not deserialize untrusted data. Replace the format with one that carries values only, which is why JSON is the right default for anything crossing a trust boundary.",
        "Where the format must be kept, verify a cryptographic signature over the exact bytes before parsing, and fail closed if verification is unavailable.",
        "Do not use the dangerous deserializers at all: Python pickle for untrusted input, PHP unserialize on user-controlled strings, Java ObjectInputStream on anything off the network, .NET BinaryFormatter anywhere.",
        "Keep the classpath minimal, since a gadget chain can only use classes the runtime can actually load - the deserialization filter allow-list is the direct implementation of this.",
        "Treat signed payloads as secrets: protect the key, rotate it, and never accept a format that permits both a signature and attacker-controlled extra fields after it.",
      ],
    },

    history: [
      {
        year: 1996,
        title: "Java serialization ships with the platform",
        text: "Java's native object serialization went into the JDK as a general-purpose remote-object feature, and the format was designed for objects talking to objects that already trust each other. The stream carries class names, and ObjectInputStream instantiates them, so the format assumes the sender is inside the trust boundary. Every deserialization vulnerability in the Java ecosystem follows from that assumption rather than from a flaw in the mechanism, and it is why the 2016-era guidance recommended narrow ObjectInputFilter allow-lists rather than replacement.",
      },
      {
        year: 2003,
        title: "The academic write-up names the mechanism",
        text: "Kent's paper \"Serialization and Unserialization Security Risks\" presented at EuroPython analysed the Java case formally, describing the class hierarchy as a directed graph in which certain classes are dangerous vertices and reflection turns a path through them into an invocation chain. Its lasting contribution was the idea of the gadget chain: the attacker does not supply a dangerous call, they supply a type graph that makes existing harmless code do something harmful. That framing is why filters are written as class-path restrictions rather than as pattern matching.",
      },
      {
        year: 2008,
        title: "The platforms' in-language formats are all the same shape",
        text: "Around this period the same weakness became visible in several ecosystems at once, and it is worth naming because it shows the flaw is in the design rather than in one implementation. PHP's unserialize honours a class name embedded in the string and invokes magic methods during reconstruction. Python's pickle format is documented as unsafe for untrusted data, because its opcode set includes calling functions and importing modules. .NET's BinaryFormatter carries an assembly-qualified type name per object. The common property is a format that can express type, in a runtime that will construct whatever the type says.",
      },
      {
        year: 2013,
        title: "Demonstrated gadget chains in real frameworks",
        text: "Published gadget chains moved the issue from theory to practice by finding a usable path through libraries that had no reason to believe they were dangerous. Collections, comparison functions, class loaders and proxies turn out to be enough to reach command execution, which made the finding uncomfortable: an application that did nothing unusual, and used a popular library, was exploitable. From this point the practical defence was a class-path allow-list at the deserializer rather than a fix in any single library, because the chain is assembled at run time from parts nobody owns.",
      },
      {
        year: 2015,
        title: "A dedicated OWASP category",
        text: "OWASP gave insecure deserialization its own entry in the 2015 release as A8, recognising that it produced remote code execution without any of the usual injection strings and therefore escaped filters looking for SQL, shell or script syntax. The category text made the point that it should be avoided wherever possible, and where it cannot be, that the input must be integrity-checked - a cryptographic signature - before deserialization, not merely validated afterwards.",
      },
      {
        year: 2017,
        title: "A8 Insecure Deserialization",
        text: "The 2017 edition kept the dedicated category at A8, ranked high because the consequence is code execution. The 2017 OWASP Deserialization Cheat Sheet consolidated the practical advice into three tiers: avoid the format, authenticate the data with a signature, or constrain the runtime with an allow-list of types. The signature tier is the important one, because it is the only option that does not require the application author to enumerate what is dangerous.",
      },
      {
        year: 2017,
        title: "Fowler states the case for not using it at all",
        text: "Martin Fowler's \"On Deserialization Safety\" the same year restated the argument in terms of trust: deserialization instantiates whatever the stream names, so any stream from a less-trusted source is a request for code execution dressed as a request for data. His recommendation was to prefer languages and formats that have no type field, and to treat a signed payload as a capability rather than a value. The framing has aged well, because it does not depend on any particular chain or library - it describes the format.",
      },
      {
        year: 2021,
        title: "Absorbed into A08 Software and Data Integrity Failures",
        text: "The 2021 edition replaced A8 Insecure Deserialization with A08 Software and Data Integrity Failures, and folded deserialization in. The grouping argues that the root cause is the absence of an integrity check on data that will be acted upon, which is also what CWE-502's official name now says: deserialization of untrusted data. The category text names the fixes directly - do not accept untrusted serialized objects, and if a signature exists, verify it before parsing rather than after.",
      },
      {
        year: 2025,
        title: "A08, with the platform problem largely retired",
        text: "Software and Data Integrity Failures is A08 in the 2025 edition. The interesting development is that the platforms have started removing the capability rather than documenting the risk: BinaryFormatter was removed from the .NET framework, and the other ecosystems have spent years deprecating their equivalents. What remains is a much smaller residue - PHP unserialize on user-controlled strings, pickle files arriving from users or from a data lake, and signed payloads whose key management is weak. The remaining risk has moved from the deserializer to the supply chain, which is why the integrity framing of A08 fits better than the old dedicated category did.",
      },
    ],

    diagram: {
      caption: "The type graph in the stream becomes the program that runs",
      nodes: [
        { text: "Attacker posts a serialized object to an endpoint", tone: "attacker" },
        { text: "ObjectInputStream reads a class name from the stream", tone: "app" },
        { text: "Runtime loads that class and instantiates it", tone: "danger" },
        { text: "readObject chains into classes already on the classpath", tone: "danger" },
        { text: "The chain reaches a class that runs a process", tone: "danger" },
        { text: "Or use a format with no type field, such as JSON", tone: "defence" },
        { text: "Fix: verify a signature over the bytes before parsing", tone: "defence" },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2, label: "type from data" },
        { from: 2, to: 3, label: "readObject" },
        { from: 3, to: 4 },
        { from: 0, to: 5, label: "the better fix" },
        { from: 0, to: 6, label: "the fix" },
      ],
    },

    puzzle: {
      type: "spot",
      title: "Which line turns a value into an instruction?",
      prompt: "A Python service restores objects from a cache directory. Two lines look defensive; only one is.",
      language: "python",
      lines: [
        { text: "raw = (CACHE_DIR / name).read_bytes()" },
        { text: "obj = pickle.loads(raw, fix_imports=True)          // runs the stream as code", vulnerable: true },
        { text: "if not name.endswith('.pkl'):" },
        { text: "    raise ValueError('unknown cache format')" },
        { text: "return obj" },
      ],
      explain:
        "pickle is a stack language whose opcodes include calling functions and importing modules, so unpickling a byte string is remote code execution by design - the Python documentation says as much. fix_imports only renames classes moved between Python 2 and 3; it does nothing about the opcodes, so it reads like a safety setting without being one. The filename check on the last two lines is also a trap in the same way: it constrains which files are loaded, not what is in them, so an attacker who can write a .pkl file into the cache directory - through an upload, a shared volume or a different endpoint - has already won. Line 1 is fine as a path read: joining against a fixed base and not concatenating a caller-supplied string is the same discipline path traversal requires, but it is not what makes the deserialization dangerous. Line 5 is fine mechanically; by then the instruction has already run. The real fix is to stop unpickling untrusted bytes, or to verify a signature over the file before this line.",
    },
  },
];

export default dataSecretsModules;
