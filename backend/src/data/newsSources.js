/**
 * ============================================================
 * FILE: src/data/newsSources.js
 * PURPOSE: The list of security feeds this project is allowed to read.
 *
 * WHY A HARDCODED LIST?
 *   This file is the security boundary for the news feature. The
 *   /api/news endpoint fetches whatever URLs live here and NOTHING
 *   else. It never accepts a URL from the client.
 *
 *   That single decision prevents a whole category of bug: if the
 *   endpoint took a ?url= parameter, any visitor could ask our server
 *   to fetch http://169.254.169.254/ (cloud metadata) or an internal
 *   admin panel and read the response. That is SSRF - Server Side
 *   Request Forgery - and it is one of the most common ways a real
 *   web app gets owned. Search the OWASP data in this project for
 *   SSRF; this comment is the practical version of that lesson.
 *
 * EVERY FEED HERE WAS VERIFIED TO RETURN PARSEABLE ITEMS before it
 * was added. A feed that silently returns an empty list is worse
 * than no feed, because it looks like "no news today" instead of
 * "we could not reach the source".
 * ============================================================
 */

/**
 * @typedef {object} NewsSource
 * @property {string}  id        stable key used by the frontend
 * @property {string}  name      display name
 * @property {string}  url       the feed URL - must be in this file
 * @property {string}  site      human page for the publication
 * @property {string}  kind      "advisory" | "news" | "research"
 * @property {string}  blurb     one line explaining why it is worth reading
 */

/** @type {NewsSource[]} */
const NEWS_SOURCES = [
  {
    id: "cisa",
    name: "CISA Advisories",
    url: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    site: "https://www.cisa.gov/cybersecurity-advisories",
    kind: "advisory",
    blurb:
      "The US cybersecurity agency. Its alerts are the ones to read first: they say which flaws are actually being exploited, not just which ones exist.",
  },
  {
    id: "sans",
    name: "SANS Internet Storm Center",
    url: "https://isc.sans.edu/rssfeed_full.xml",
    site: "https://isc.sans.edu/",
    kind: "news",
    blurb:
      "Daily handler digests of what is being scanned and exploited right now. Short posts, written by practitioners, usually within hours of an attack starting.",
  },
  {
    id: "krebs",
    name: "Krebs on Security",
    url: "https://krebsonsecurity.com/feed/",
    site: "https://krebsonsecurity.com/",
    kind: "news",
    blurb:
      "Investigative reporting on cybercrime and data breaches. Fewer posts, much deeper reporting than anywhere else in this list.",
  },
  {
    id: "hackernews",
    name: "The Hacker News",
    url: "https://feeds.feedburner.com/TheHackersNews",
    site: "https://thehackernews.com/",
    kind: "news",
    blurb:
      "High volume, fast turnaround. Good for breaking vulnerability and ransomware coverage; treat unverified claims in any story with care.",
  },
  {
    id: "bleepingcomputer",
    name: "BleepingComputer",
    url: "https://www.bleepingcomputer.com/feed/",
    site: "https://www.bleepingcomputer.com/",
    kind: "news",
    blurb:
      "Broad coverage of breaches, ransomware and enterprise patching. A good middle ground between a firehose and a single-topic feed.",
  },
  {
    id: "securityaffairs",
    name: "Security Affairs",
    url: "https://securityaffairs.com/feed",
    site: "https://securityaffairs.com/",
    kind: "news",
    blurb:
      "Heavy on tooling releases and technical malware analysis. Useful if you want to know what attackers are actually running.",
  },
  {
    id: "register",
    name: "The Register Security",
    url: "https://www.theregister.com/headlines.atom",
    site: "https://www.theregister.com/headlines/security/",
    kind: "news",
    blurb:
      "Security and enterprise IT news with a sharper edge than most trade press. Regular exposure of vendor handling failures.",
  },
  {
    id: "darkreading",
    name: "Dark Reading",
    url: "https://www.darkreading.com/rss.xml",
    site: "https://www.darkreading.com/",
    kind: "news",
    blurb:
      "Enterprise security coverage aimed at defenders and security teams. Less breaking, more analysis of what an incident means for defenders.",
  },
  {
    id: "schneier",
    name: "Schneier on Security",
    url: "https://www.schneier.com/feed/atom/",
    site: "https://www.schneier.com/blog/",
    kind: "research",
    blurb:
      "Long-running commentary on security philosophy, surveillance and the economics of defence. The thinking-out-loud feed of the field.",
  },
  {
    id: "projectzero",
    name: "Google Project Zero",
    // NOTE: this feed is ~12 MB. The reason is real and worth
    // knowing: their long write-ups embed screenshots as base64
    // data: URIs, and a single post carries a 10 MB image. The
    // server ignores Range requests and max-results, so the whole
    // document always arrives. We therefore give this one source a
    // larger byte cap and a 6 hour TTL, because Project Zero posts
    // a few times a month at most. Fetching 12 MB every 5 minutes
    // would be wasteful and rude to Google; every 6 hours is
    // plenty fresh for a source this slow-moving.
    url: "https://googleprojectzero.blogspot.com/feeds/posts/default",
    maxBytes: 16 * 1024 * 1024,
    ttlMinutes: 360,
    site: "https://projectzero.google/",
    kind: "research",
    blurb:
      "The best public exploit research. Deep technical write-ups of real bugs in widely deployed software, with working proof-of-concept code.",
  },
];

/** Look a source up by its id. Used to resolve ?source= filters. */
const getSourceById = (id) => NEWS_SOURCES.find((s) => s.id === id) || null;

module.exports = { NEWS_SOURCES, getSourceById };
