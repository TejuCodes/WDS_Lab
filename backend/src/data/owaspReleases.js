/**
 * ============================================================
 * FILE: src/data/owaspReleases.js
 * PURPOSE: The single source of truth for the OWASP Top 10 history.
 *
 *   2003 -> 2004 -> 2007 -> 2010 -> 2013 -> 2017 -> 2021 -> 2025
 *
 * IMPORTANT ACCURACY NOTE
 *   These are the eight OFFICIAL OWASP Top 10 releases. 2025 is the
 *   most recent one. There is no 2026 edition, and the seed script
 *   will refuse to create one. If you ever see a "2026 list" in a
 *   blog, treat it with suspicion.
 *
 * WHAT IS IN HERE
 *   For each release:
 *     year, title, summary         - what the edition was about
 *     changes[]                    - the official "what changed" points
 *     sourceUrl                    - the OWASP page to verify against
 *     categories[]                 - the 10 entries, in published order
 *          owaspId, rank, title    - exactly as OWASP wrote them
 *          conceptKey              - links to the deep teaching profile
 *          isNew                   - true if the IDEA is new this edition
 *          changeNote              - one line for the What Changed view
 *          replacedFrom[]          - what it absorbed/renamed, if any
 *
 * HOW isNew IS CALCULATED (do it by hand, once, on purpose)
 *   An entry is "new" when its conceptKey does not appear in ANY
 *   earlier edition. Renames are NOT new. For example "Unvalidated
 *   Parameters" (2003) -> "Unvalidated Input" (2004) is a rename,
 *   so 2004 A1 is not new.
 * ============================================================
 */

const RELEASES = [
  /* ============================================================ */
  {
    year: 2003,
    title: "OWASP Top 10 - 2003",
    summary:
      "The first official OWASP Top 10. It was published from a community vote of web application security experts, and it described the dangers that came mostly from unsanitised input and from trusting the network. Server misconfiguration and broken session management are already here, which shows how much of web security was understood even at the beginning.",
    changes: [
      "This is the first official OWASP Top 10 release, so there is no earlier edition to compare it with.",
      "The list is organised around where the attacker meets the application: parameters, access control, sessions, the browser, memory, the operating system, error handling, cryptography, remote administration and server configuration.",
      "Several risks are architecture rather than code - remote administration and server misconfiguration were separate categories.",
      "Buffer overflows and command injection reflect the native-code and shell-heavy world of applications at the time."
    ],
    sourceUrl: "https://owasp.org/www-project-top-ten/2003/",
    categories: [
      {
        owaspId: "A1",
        rank: 1,
        title: "Unvalidated Parameters",
        conceptKey: "unvalidated-input",
        isNew: true,
        changeNote: "First appearance of the input-validation category, at number one."
      },
      {
        owaspId: "A2",
        rank: 2,
        title: "Broken Access Control",
        conceptKey: "broken-access-control",
        isNew: true,
        changeNote: "Authorisation failures are a category from the very first edition and stay on every list since."
      },
      {
        owaspId: "A3",
        rank: 3,
        title: "Broken Account and Session Management",
        conceptKey: "broken-authentication",
        isNew: true,
        changeNote: "Sessions and account handling treated as one category in this edition."
      },
      {
        owaspId: "A4",
        rank: 4,
        title: "Cross Site Scripting (XSS) Flaws",
        conceptKey: "xss",
        isNew: true,
        changeNote: "Client-side code injection appears as a named category."
      },
      {
        owaspId: "A5",
        rank: 5,
        title: "Buffer Overflows",
        conceptKey: "buffer-overflow",
        isNew: true,
        changeNote: "A memory-safety category, reflecting C and C++ applications of the era."
      },
      {
        owaspId: "A6",
        rank: 6,
        title: "Command Injection Flaws",
        conceptKey: "command-injection",
        isNew: true,
        changeNote: "In this edition the injection category means passing user input to the operating system."
      },
      {
        owaspId: "A7",
        rank: 7,
        title: "Error Handling Problems",
        conceptKey: "improper-error-handling",
        isNew: true,
        changeNote: "Error handling listed as a risk in its own right."
      },
      {
        owaspId: "A8",
        rank: 8,
        title: "Insecure Use of Cryptography",
        conceptKey: "insecure-cryptography",
        isNew: true,
        changeNote: "The first cryptography category, focused on using the wrong tools."
      },
      {
        owaspId: "A9",
        rank: 9,
        title: "Remote Administration Flaws",
        conceptKey: "remote-admin",
        isNew: true,
        changeNote: "Unique to this edition - later covered by security misconfiguration."
      },
      {
        owaspId: "A10",
        rank: 10,
        title: "Web and Application Server Misconfiguration",
        conceptKey: "security-misconfiguration",
        isNew: true,
        changeNote: "Server and platform configuration treated separately from application code."
      }
    ]
  },

  /* ============================================================ */
  {
    year: 2004,
    title: "OWASP Top 10 - 2004",
    summary:
      "The second edition widens the net. Denial of service appears, injection is generalised to cover databases as well as the operating system, and the language of the list starts to move from 'the application is badly written' towards 'the application and its platform are badly configured'.",
    changes: [
      "Unvalidated Parameters was renamed Unvalidated Input - the same idea, clearer wording.",
      "Broken Account and Session Management became Broken Authentication and Session Management, making authentication explicit.",
      "A6 changed from Command Injection Flaws to Injection Flaws, so database injection now had a home.",
      "New: Insecure Storage, which moved the cryptography risk from algorithms to where secrets are kept.",
      "New: Denial of Service, which had never been on the list before.",
      "Improper Error Handling and Insecure Configuration Management are renamed versions of the 2003 error handling and server misconfiguration entries.",
      "Remote Administration Flaws disappeared as a separate category; that risk is now treated as a configuration issue."
    ],
    sourceUrl: "https://owasp.org/www-project-top-ten/2004/",
    categories: [
      {
        owaspId: "A1",
        rank: 1,
        title: "Unvalidated Input",
        conceptKey: "unvalidated-input",
        isNew: false,
        changeNote: "Renamed from 2003 A1 Unvalidated Parameters. Same problem, better name."
      },
      {
        owaspId: "A2",
        rank: 2,
        title: "Broken Access Control",
        conceptKey: "broken-access-control",
        isNew: false,
        changeNote: "Unchanged from 2003 A2."
      },
      {
        owaspId: "A3",
        rank: 3,
        title: "Broken Authentication and Session Management",
        conceptKey: "broken-authentication",
        isNew: false,
        changeNote: "Renamed from 2003 A3 to say authentication explicitly."
      },
      {
        owaspId: "A4",
        rank: 4,
        title: "Cross Site Scripting (XSS) Flaws",
        conceptKey: "xss",
        isNew: false,
        changeNote: "Unchanged from 2003 A4."
      },
      {
        owaspId: "A5",
        rank: 5,
        title: "Buffer Overflows",
        conceptKey: "buffer-overflow",
        isNew: false,
        changeNote: "Unchanged from 2003 A5."
      },
      {
        owaspId: "A6",
        rank: 6,
        title: "Injection Flaws",
        conceptKey: "injection",
        isNew: true,
        changeNote:
          "New category. Broadened from the 2003 Command Injection Flaws so that SQL, LDAP and OS command injection are all covered.",
        replacedFrom: ["A6 Command Injection Flaws (2003)"]
      },
      {
        owaspId: "A7",
        rank: 7,
        title: "Improper Error Handling",
        conceptKey: "improper-error-handling",
        isNew: false,
        changeNote: "Renamed from 2003 A7 Error Handling Problems."
      },
      {
        owaspId: "A8",
        rank: 8,
        title: "Insecure Storage",
        conceptKey: "insecure-storage",
        isNew: true,
        changeNote:
          "New category. Moved the cryptography risk away from algorithms and towards where secrets are actually kept.",
        replacedFrom: ["A8 Insecure Use of Cryptography (2003)"]
      },
      {
        owaspId: "A9",
        rank: 9,
        title: "Denial of Service",
        conceptKey: "dos",
        isNew: true,
        changeNote: "New category - application-level resource exhaustion, not just network flooding."
      },
      {
        owaspId: "A10",
        rank: 10,
        title: "Insecure Configuration Management",
        conceptKey: "security-misconfiguration",
        isNew: false,
        changeNote: "Renamed from 2003 A10 Web and Application Server Misconfiguration, and now covers the whole configuration lifecycle."
      }
    ]
  },

  /* ============================================================ */
  {
    year: 2007,
    title: "OWASP Top 10 - 2007",
    summary:
      "A big reshuffle. XSS moves to number one, the list starts describing attacks the attacker invents rather than mistakes the developer makes - cross-site request forgery, insecure direct object references, malicious file execution - and encryption is split into storage and communication problems.",
    changes: [
      "Cross Site Scripting moved from A4 to A1, reflecting how common and damaging it had become.",
      "Injection Flaws moved to A2, and now explicitly includes SQL and similar database injection.",
      "New: Malicious File Execution - untrusted files being run as code by the server.",
      "New: Insecure Direct Object Reference, which is the clearest statement yet that object-level authorisation is its own problem.",
      "New: Cross Site Request Forgery, finally given a category of its own.",
      "New: Information Leakage and Improper Error Handling, merging the old error handling entry with information disclosure.",
      "New: Insecure Communications, splitting transport protection away from cryptography at rest.",
      "New: Failure to Restrict URL Access, which focuses on page-level access control.",
      "Unvalidated Input, Buffer Overflows and Denial of Service are no longer separate categories; their risks are now described inside Injection, XSS and the other entries."
    ],
    sourceUrl: "https://owasp.org/www-project-top-ten/2007/",
    categories: [
      {
        owaspId: "A1",
        rank: 1,
        title: "Cross Site Scripting (XSS)",
        conceptKey: "xss",
        isNew: false,
        changeNote: "Promoted to number one - the most exploited web application flaw of that period."
      },
      {
        owaspId: "A2",
        rank: 2,
        title: "Injection Flaws",
        conceptKey: "injection",
        isNew: false,
        changeNote: "Moved up to A2 and worded to include SQL injection explicitly."
      },
      {
        owaspId: "A3",
        rank: 3,
        title: "Malicious File Execution",
        conceptKey: "malicious-file-execution",
        isNew: true,
        changeNote: "New category - untrusted files stored where the server will execute them."
      },
      {
        owaspId: "A4",
        rank: 4,
        title: "Insecure Direct Object Reference",
        conceptKey: "idor",
        isNew: true,
        changeNote: "New category - and the origin of the IDOR name developers now use."
      },
      {
        owaspId: "A5",
        rank: 5,
        title: "Cross Site Request Forgery (CSRF)",
        conceptKey: "csrf",
        isNew: true,
        changeNote: "New category - state-changing requests that the user never intended."
      },
      {
        owaspId: "A6",
        rank: 6,
        title: "Information Leakage and Improper Error Handling",
        conceptKey: "information-leakage",
        isNew: true,
        changeNote:
          "New category, merging the previous Improper Error Handling entry with information disclosure.",
        replacedFrom: ["A7 Improper Error Handling (2004)"]
      },
      {
        owaspId: "A7",
        rank: 7,
        title: "Broken Authentication and Session Management",
        conceptKey: "broken-authentication",
        isNew: false,
        changeNote: "Unchanged name, moved from A3 to A7."
      },
      {
        owaspId: "A8",
        rank: 8,
        title: "Insecure Cryptographic Storage",
        conceptKey: "insecure-cryptography",
        isNew: false,
        changeNote: "Successor to the 2004 Insecure Storage entry, worded around cryptographic storage."
      },
      {
        owaspId: "A9",
        rank: 9,
        title: "Insecure Communications",
        conceptKey: "insecure-transport",
        isNew: true,
        changeNote: "New category - data in transit, split away from data at rest."
      },
      {
        owaspId: "A10",
        rank: 10,
        title: "Failure to Restrict URL Access",
        conceptKey: "broken-access-control",
        isNew: false,
        changeNote: "New wording for access control, focused on restricting which URLs a user may reach."
      }
    ]
  },

  /* ============================================================ */
  {
    year: 2010,
    title: "OWASP Top 10 - 2010",
    summary:
      "Injection returns to number one, transport protection and redirects get their own entries, and the list starts to name concrete weaknesses - insecure direct object references, cross-site request forgery - the way a developer would recognise them in a scanner report.",
    changes: [
      "Injection returned to A1 as a single entry covering SQL and other injection, now described with CWE references for the first time.",
      "Cross-Site Scripting moved to A2, and the name gained hyphens: Cross-Site Scripting.",
      "Insecure Direct Object References and Cross-Site Request Forgery were promoted to named entries with CWE numbers.",
      "New: Security Misconfiguration, returning after being absent in 2007, with an emphasis on incomplete hardening and default settings.",
      "New: Insufficient Transport Layer Protection, for TLS and certificate problems.",
      "New: Unvalidated Redirects and Forwards, added because open redirects were being used in real phishing chains.",
      "Insecure Cryptographic Storage, Information Leakage and Malicious File Execution are no longer separate categories; those risks are now described inside the other entries."
    ],
    sourceUrl: "https://owasp.org/www-project-top-ten/2010/",
    categories: [
      {
        owaspId: "A1",
        rank: 1,
        title: "Injection",
        conceptKey: "injection",
        isNew: false,
        changeNote: "Back to number one, now named simply Injection and linked to CWE-89."
      },
      {
        owaspId: "A2",
        rank: 2,
        title: "Cross-Site Scripting (XSS)",
        conceptKey: "xss",
        isNew: false,
        changeNote: "Moved from A1 to A2."
      },
      {
        owaspId: "A3",
        rank: 3,
        title: "Broken Authentication and Session Management",
        conceptKey: "broken-authentication",
        isNew: false,
        changeNote: "Unchanged name, moved from A7 to A3."
      },
      {
        owaspId: "A4",
        rank: 4,
        title: "Insecure Direct Object References",
        conceptKey: "idor",
        isNew: false,
        changeNote: "Promoted to its own entry with CWE-639 and CWE-862 behind it."
      },
      {
        owaspId: "A5",
        rank: 5,
        title: "Cross-Site Request Forgery (CSRF)",
        conceptKey: "csrf",
        isNew: false,
        changeNote: "Given CWE-352 as a named entry."
      },
      {
        owaspId: "A6",
        rank: 6,
        title: "Security Misconfiguration",
        conceptKey: "security-misconfiguration",
        isNew: true,
        changeNote:
          "New category. Security misconfiguration reappears after 2007, this time including cloud and framework defaults.",
        replacedFrom: ["A10 Insecure Configuration Management (2004)"]
      },
      {
        owaspId: "A7",
        rank: 7,
        title: "Insecure Cryptographic Storage",
        conceptKey: "insecure-cryptography",
        isNew: false,
        changeNote: "Unchanged from 2007 A8, moved to A7."
      },
      {
        owaspId: "A8",
        rank: 8,
        title: "Failure to Restrict URL Access",
        conceptKey: "broken-access-control",
        isNew: false,
        changeNote: "Unchanged from 2007 A10, moved to A8."
      },
      {
        owaspId: "A9",
        rank: 9,
        title: "Insufficient Transport Layer Protection",
        conceptKey: "insecure-transport",
        isNew: true,
        changeNote: "New category - renamed from the 2007 Insecure Communications entry and focused on TLS."
      },
      {
        owaspId: "A10",
        rank: 10,
        title: "Unvalidated Redirects and Forwards",
        conceptKey: "open-redirect",
        isNew: true,
        changeNote: "New category - open redirects used to make phishing links look legitimate."
      }
    ]
  },

  /* ============================================================ */
  {
    year: 2013,
    title: "OWASP Top 10 - 2013",
    summary:
      "Modern applications break into this edition. Data protection becomes a category of its own, missing authorisation gets named separately from broken access control, and for the first time the list says out loud: do not use libraries with known vulnerabilities.",
    changes: [
      "New: Sensitive Data Exposure, covering data that should be protected being handed out or stored carelessly.",
      "New: Missing Function Level Access Control, separating 'who may use this endpoint' from 'which records may they see'.",
      "New: Using Components with Known Vulnerabilities - the first edition to name the dependency problem directly.",
      "Broken Authentication and Session Management moved to A2, and Cross-Site Scripting to A3, reflecting how often the two are found together.",
      "Security Misconfiguration moved to A5 and was expanded, with cross-site request forgery and security-relevant headers added to its scope.",
      "Insecure Direct Object References was kept, while the separate Failure to Restrict URL Access category was folded into access control.",
      "The 2010 transport layer and cryptographic storage entries are no longer standalone categories; those risks are now described within Sensitive Data Exposure."
    ],
    sourceUrl: "https://owasp.org/www-project-top-ten/2013/",
    categories: [
      {
        owaspId: "A1",
        rank: 1,
        title: "Injection",
        conceptKey: "injection",
        isNew: false,
        changeNote: "Unchanged at number one, with injection risk now also covering client-side and expression language injection."
      },
      {
        owaspId: "A2",
        rank: 2,
        title: "Broken Authentication and Session Management",
        conceptKey: "broken-authentication",
        isNew: false,
        changeNote: "Moved from A3 to A2."
      },
      {
        owaspId: "A3",
        rank: 3,
        title: "Cross-Site Scripting (XSS)",
        conceptKey: "xss",
        isNew: false,
        changeNote: "Moved from A2 to A3."
      },
      {
        owaspId: "A4",
        rank: 4,
        title: "Insecure Direct Object References",
        conceptKey: "idor",
        isNew: false,
        changeNote: "Unchanged, but from this edition the guidance stresses object-level checks rather than page-level ones."
      },
      {
        owaspId: "A5",
        rank: 5,
        title: "Security Misconfiguration",
        conceptKey: "security-misconfiguration",
        isNew: false,
        changeNote: "Moved from A6 to A5 and expanded to include missing security headers and framework defaults."
      },
      {
        owaspId: "A6",
        rank: 6,
        title: "Sensitive Data Exposure",
        conceptKey: "sensitive-data-exposure",
        isNew: true,
        changeNote: "New category - absorbing the transport protection and cryptographic storage concerns of 2010."
      },
      {
        owaspId: "A7",
        rank: 7,
        title: "Missing Function Level Access Control",
        conceptKey: "broken-access-control",
        isNew: true,
        changeNote:
          "New category. Access control is now split into two entries: which functions you may call, and which objects you may touch.",
        replacedFrom: ["A8 Failure to Restrict URL Access (2010)"]
      },
      {
        owaspId: "A8",
        rank: 8,
        title: "Cross-Site Request Forgery (CSRF)",
        conceptKey: "csrf",
        isNew: false,
        changeNote: "Moved from A5 to A8, and noted as frequently found together with A5."
      },
      {
        owaspId: "A9",
        rank: 9,
        title: "Using Components with Known Vulnerabilities",
        conceptKey: "vulnerable-components",
        isNew: true,
        changeNote: "New category - the list now names unmaintained and vulnerable libraries as a top-level risk."
      },
      {
        owaspId: "A10",
        rank: 10,
        title: "Unvalidated Redirects and Forwards",
        conceptKey: "open-redirect",
        isNew: false,
        changeNote: "Unchanged from 2010 A10, but given CWE references."
      }
    ]
  },

  /* ============================================================ */
  {
    year: 2017,
    title: "OWASP Top 10 - 2017",
    summary:
      "The most reshuffled edition so far. Broken Access Control becomes the top risk, IDOR and CSRF are folded into it, two new categories appear - XML external entities and insecure deserialisation - and the list admits that if you cannot see an attack, you cannot stop it.",
    changes: [
      "New number one: Broken Access Control, absorbing Insecure Direct Object References and Cross-Site Request Forgery.",
      "New: XML External Entities, and New: Insecure Deserialization - both are cases where the attacker's data is interpreted as structure.",
      "Broken Authentication and Session Management was shortened to Broken Authentication, with session management folded in.",
      "Sensitive Data Exposure stayed, and cryptographically stored data became part of Cryptographic Failures reasoning inside it.",
      "Cross-Site Scripting moved to A7, a change that surprised many teams because the category was still number one in 2007.",
      "Using Components with Known Vulnerabilities stayed, and added the CWE mapping and the point that you should know the versions you run.",
      "Unvalidated Redirects and Forwards was no longer a separate category; A10 Insufficient Logging and Monitoring replaced it."
    ],
    sourceUrl: "https://owasp.org/www-project-top-ten/2017/",
    categories: [
      {
        owaspId: "A1",
        rank: 1,
        title: "Injection",
        conceptKey: "injection",
        isNew: false,
        changeNote: "Unchanged at number one, now with CWE references for the specific injection types."
      },
      {
        owaspId: "A2",
        rank: 2,
        title: "Broken Authentication",
        conceptKey: "broken-authentication",
        isNew: false,
        changeNote: "Shortened from Broken Authentication and Session Management; session management is now part of this entry."
      },
      {
        owaspId: "A3",
        rank: 3,
        title: "Sensitive Data Exposure",
        conceptKey: "sensitive-data-exposure",
        isNew: false,
        changeNote: "Unchanged name, moved from A6 to A3, and extended to password hashing practices."
      },
      {
        owaspId: "A4",
        rank: 4,
        title: "XML External Entities (XXE)",
        conceptKey: "xxe",
        isNew: true,
        changeNote: "New category - XML parsers resolving external entities on untrusted input."
      },
      {
        owaspId: "A5",
        rank: 5,
        title: "Broken Access Control",
        conceptKey: "broken-access-control",
        isNew: true,
        changeNote:
          "New number one. Absorbed Insecure Direct Object References and Cross Site Request Forgery, and moved to the top of the list.",
        replacedFrom: [
          "A4 Insecure Direct Object References (2013)",
          "A8 Cross-Site Request Forgery (2013)",
          "A7 Missing Function Level Access Control (2013)"
        ]
      },
      {
        owaspId: "A6",
        rank: 6,
        title: "Security Misconfiguration",
        conceptKey: "security-misconfiguration",
        isNew: false,
        changeNote: "Unchanged name, moved from A5 to A6, and framed around cloud services and modern frameworks."
      },
      {
        owaspId: "A7",
        rank: 7,
        title: "Cross-Site Scripting (XSS)",
        conceptKey: "xss",
        isNew: false,
        changeNote: "Moved from A3 to A7."
      },
      {
        owaspId: "A8",
        rank: 8,
        title: "Insecure Deserialization",
        conceptKey: "insecure-deserialization",
        isNew: true,
        changeNote: "New category - untrusted data that rebuilds objects, and therefore can run code."
      },
      {
        owaspId: "A9",
        rank: 9,
        title: "Using Components with Known Vulnerabilities",
        conceptKey: "vulnerable-components",
        isNew: false,
        changeNote: "Unchanged name, moved from A9 to A9, now with CWE mapping and guidance on client-side components."
      },
      {
        owaspId: "A10",
        rank: 10,
        title: "Insufficient Logging & Monitoring",
        conceptKey: "logging-monitoring",
        isNew: true,
        changeNote:
          "New category, replacing Unvalidated Redirects and Forwards. If you cannot detect the attack, you cannot respond to it.",
        replacedFrom: ["A10 Unvalidated Redirects and Forwards (2013)"]
      }
    ]
  },

  /* ============================================================ */
  {
    year: 2021,
    title: "OWASP Top 10 - 2021",
    summary:
      "A structural rewrite. The categories are reordered around a threat model rather than around payloads, identifiers change to A01-A10, and three brand new ideas appear: Insecure Design, Software and Data Integrity Failures, and Server-Side Request Forgery.",
    changes: [
      "The identifiers changed from A1 to A01, so categories sort correctly in a list.",
      "New: Insecure Design, which says a flaw is possible even when the code is written correctly.",
      "New: Software and Data Integrity Failures, covering updates, plugins, CI/CD pipelines and deserialisation.",
      "New: Server-Side Request Forgery (SSRF), promoted to its own category after years of being described inside other entries.",
      "Identification and Authentication Failures replaced Broken Authentication and Session Management, with a broader scope including identification and credential failures.",
      "Cryptographic Failures replaced Insecure Cryptographic Storage, covering both missing cryptography and weak cryptography.",
      "Vulnerable and Outdated Components replaced Using Components with Known Vulnerabilities, adding unmaintained software and a stronger lifecycle message.",
      "Security Logging and Monitoring Failures replaced Insufficient Logging & Monitoring, worded as a failure rather than a shortage.",
      "Insecure Direct Object References, Cross-Site Request Forgery and Missing Function Level Access Control remain inside Broken Access Control.",
      "XML External Entities, Insecure Deserialization and Unvalidated Redirects are no longer standalone categories; they are now described within the other entries."
    ],
    sourceUrl: "https://owasp.org/www-project-top-ten/2021/",
    categories: [
      {
        owaspId: "A01",
        rank: 1,
        title: "Broken Access Control",
        conceptKey: "broken-access-control",
        isNew: false,
        changeNote: "Kept the number one position from 2017 and was reworded to point at CWE mapping and average control severity data."
      },
      {
        owaspId: "A02",
        rank: 2,
        title: "Cryptographic Failures",
        conceptKey: "insecure-cryptography",
        isNew: false,
        changeNote: "Replaced Insecure Cryptographic Storage; now covers both missing and weak cryptography, and moved up to A02."
      },
      {
        owaspId: "A03",
        rank: 3,
        title: "Injection",
        conceptKey: "injection",
        isNew: false,
        changeNote: "Unchanged in meaning, moved from A1 to A03."
      },
      {
        owaspId: "A04",
        rank: 4,
        title: "Insecure Design",
        conceptKey: "insecure-design",
        isNew: true,
        changeNote:
          "New category. Introduced because a design with no security requirement produces vulnerable code even when the code is correct."
      },
      {
        owaspId: "A05",
        rank: 5,
        title: "Security Misconfiguration",
        conceptKey: "security-misconfiguration",
        isNew: false,
        changeNote: "Unchanged in meaning, moved from A6 to A05."
      },
      {
        owaspId: "A06",
        rank: 6,
        title: "Vulnerable and Outdated Components",
        conceptKey: "vulnerable-components",
        isNew: false,
        changeNote: "Renamed from Using Components with Known Vulnerabilities and extended to software that is unmaintained as well as vulnerable."
      },
      {
        owaspId: "A07",
        rank: 7,
        title: "Identification and Authentication Failures",
        conceptKey: "broken-authentication",
        isNew: false,
        changeNote:
          "Replaced Broken Authentication. The wider name makes clear that proving who you are and managing sessions are one problem."
      },
      {
        owaspId: "A08",
        rank: 8,
        title: "Software and Data Integrity Failures",
        conceptKey: "integrity-failures",
        isNew: true,
        changeNote:
          "New category, absorbing the 2017 XML External Entities and Insecure Deserialization entries under the wider idea of trusting unverified data and code.",
        replacedFrom: [
          "A4 XML External Entities (XXE) (2017)",
          "A8 Insecure Deserialization (2017)"
        ]
      },
      {
        owaspId: "A09",
        rank: 9,
        title: "Security Logging and Monitoring Failures",
        conceptKey: "logging-monitoring",
        isNew: false,
        changeNote: "Renamed from Insufficient Logging & Monitoring to state it as a failure to be owned."
      },
      {
        owaspId: "A10",
        rank: 10,
        title: "Server-Side Request Forgery (SSRF)",
        conceptKey: "ssrf",
        isNew: true,
        changeNote: "New category. Requests that the server makes on a user's behalf can reach internal systems the user could not."
      }
    ]
  },

  /* ============================================================ */
  {
    year: 2025,
    title: "OWASP Top 10 - 2025",
    summary:
      "The most recent official release, and the one with the biggest shift in emphasis. The list is now organised around assets and supply chains rather than individual bug types: software supply chain gets its own category, exceptional condition handling is added, and SSRF moves inside Broken Access Control.",
    changes: [
      "New: Software Supply Chain Failures (A03). Trust in dependencies, build systems, images and CI pipelines is now a top-level category.",
      "New: Mishandling of Exceptional Conditions (A10), because most security controls live on the error path, which is the least tested part of a system.",
      "Security Logging & Alerting Failures (A09) - renamed again, and the word Alerting was added to stress that a log nobody reads is not a control.",
      "Software or Data Integrity Failures (A08) is a small renaming of A08 Software and Data Integrity Failures from 2021.",
      "Authentication Failures (A07) shortens Identification and Authentication Failures.",
      "Broken Access Control (A01) absorbed Server-Side Request Forgery, so SSRF is no longer a category of its own; it is described as an access control failure because the server reaches resources the user should not be able to.",
      "A06 Vulnerable and Outdated Components is no longer a standalone entry; its content was reworked into A03 Software Supply Chain Failures.",
      "Ordering changed: Security Misconfiguration moved to A02, Cryptographic Failures to A04, Injection to A05 and Insecure Design to A06.",
      "As in 2021, the identifiers use two digits: A01 through A10."
    ],
    sourceUrl: "https://owasp.org/www-project-top-ten/2025/",
    categories: [
      {
        owaspId: "A01",
        rank: 1,
        title: "Broken Access Control",
        conceptKey: "broken-access-control",
        isNew: false,
        changeNote:
          "Stayed number one and expanded: it now also covers server-side request forgery, because the server reaching something it should not is an access control failure.",
        replacedFrom: ["A10 Server-Side Request Forgery (SSRF) (2021)"]
      },
      {
        owaspId: "A02",
        rank: 2,
        title: "Security Misconfiguration",
        conceptKey: "security-misconfiguration",
        isNew: false,
        changeNote: "Promoted from A05 to A02, keeping its position as a catch-all for everything left to configuration."
      },
      {
        owaspId: "A03",
        rank: 3,
        title: "Software Supply Chain Failures",
        conceptKey: "supply-chain",
        isNew: true,
        changeNote:
          "New category, absorbing A06 Vulnerable and Outdated Components from 2021. The focus is no longer only known CVEs but how untrusted code enters the build in the first place.",
        replacedFrom: ["A06 Vulnerable and Outdated Components (2021)"]
      },
      {
        owaspId: "A04",
        rank: 4,
        title: "Cryptographic Failures",
        conceptKey: "insecure-cryptography",
        isNew: false,
        changeNote: "Moved from A02 to A04, unchanged in meaning."
      },
      {
        owaspId: "A05",
        rank: 5,
        title: "Injection",
        conceptKey: "injection",
        isNew: false,
        changeNote: "Moved from A03 to A05, unchanged in meaning. It has been in the list since 2003 under several names."
      },
      {
        owaspId: "A06",
        rank: 6,
        title: "Insecure Design",
        conceptKey: "insecure-design",
        isNew: false,
        changeNote: "Moved from A04 to A06, unchanged in meaning."
      },
      {
        owaspId: "A07",
        rank: 7,
        title: "Authentication Failures",
        conceptKey: "broken-authentication",
        isNew: false,
        changeNote: "Shortened from Identification and Authentication Failures."
      },
      {
        owaspId: "A08",
        rank: 8,
        title: "Software or Data Integrity Failures",
        conceptKey: "integrity-failures",
        isNew: false,
        changeNote: "Minor renaming of A08 Software and Data Integrity Failures; the meaning is unchanged."
      },
      {
        owaspId: "A09",
        rank: 9,
        title: "Security Logging & Alerting Failures",
        conceptKey: "logging-monitoring",
        isNew: false,
        changeNote: "Renamed from Security Logging and Monitoring Failures, adding Alerting to stress that detection must reach a human."
      },
      {
        owaspId: "A10",
        rank: 10,
        title: "Mishandling of Exceptional Conditions",
        conceptKey: "exceptional-conditions",
        isNew: true,
        changeNote:
          "New category, and a direct descendant of the 2003 Error Handling Problems entry. Failure paths are where security controls quietly switch themselves off."
      }
    ]
  }
];

/** Sorted years - the timeline order used everywhere in the app. */
const YEARS = RELEASES.map((r) => r.year);

/** The newest official release year we ship. There is no 2026 edition. */
const LATEST_YEAR = Math.max(...YEARS);

/** Quick lookup: find one release object by year. */
const getRelease = (year) => RELEASES.find((r) => r.year === Number(year));

/**
 * Finds the edition that came before a given year.
 * Returns null for 2003, because it is the first release.
 */
const getPreviousYear = (year) => {
  const earlier = YEARS.filter((y) => y < Number(year));
  return earlier.length ? earlier[earlier.length - 1] : null;
};

module.exports = { RELEASES, YEARS, LATEST_YEAR, getRelease, getPreviousYear };
