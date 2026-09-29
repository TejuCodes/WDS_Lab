/**
 * ============================================================
 * FAMILY METADATA
 * ------------------------------------------------------------
 * The only hand-written part of the catalogue's shape: five family
 * ids, their display names, and one paragraph each. There is
 * deliberately no module list here - the module order and the counts
 * are generated into manifest.js, so a module cannot be added to a
 * family by editing this file and quietly missing from the sidebar.
 * ============================================================ */

export const FAMILIES = [
  {
    id: "injection",
    label: "Injection",
    blurb:
      "Untrusted text handed to an interpreter that cannot tell data from instructions. The shell, the database and the template engine all fall for the same mistake.",
  },
  {
    id: "identity",
    label: "Identity & Access",
    blurb:
      "Who you are, what you may touch, and how long that proof stays valid. Most of the findings here are a missing check rather than a broken one.",
  },
  {
    id: "data-secrets",
    label: "Data & Secrets",
    blurb:
      "Reading what you should not have been able to read: files outside the root, hosts inside the network, documents that reach out on their own, and formats that rebuild objects.",
  },
  {
    id: "browser",
    label: "Browser & Client",
    blurb:
      "The controls that live between the server and the browser, and the places the browser keeps things. A lot of the attack surface is on the client you did not build.",
  },
  {
    id: "platform",
    label: "Platform & Supply Chain",
    blurb:
      "The category OWASP created to hold everything that is not a bug in your code: configuration, dependencies, artifact trust, cryptography, and the proxy in front of you.",
  },
];
