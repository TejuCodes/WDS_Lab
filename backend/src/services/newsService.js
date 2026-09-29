/**
 * ============================================================
 * FILE: src/services/newsService.js
 * PURPOSE: Fetch, parse, sanitise and cache the security news feeds.
 *
 * This is where the interesting security work lives. Everything a
 * publisher sends us is UNTRUSTED INPUT, exactly like a web form.
 * Four things protect us:
 *
 *   1. THE ALLOWLIST. Only URLs in data/newsSources.js are ever
 *      fetched. No URL from a request or a parameter is used.
 *   2. THE SANITISER. Feed bodies are HTML written by strangers.
 *      We strip every tag and every entity before the text ever
 *      reaches the frontend, so a feed cannot inject markup into
 *      our page. (This is the same class of bug as XSS.)
 *   3. THE LIMITS. Timeout, body size cap and item cap, so a slow
 *      or hostile source cannot hang or exhaust the server.
 *   4. REDIRECT CHECKING. A feed may redirect, so we re-check
 *      every hop for plaintext http and for internal addresses.
 *
 * CACHING: without it, every page view would mean 10 outbound
 * requests. That is slow for the user, rude to the publishers, and
 * easy to abuse. Cache is PER SOURCE, because sources have very
 * different shapes (see the ttlMinutes note on Project Zero below).
 * A single in-flight request is shared per source, so ten visitors
 * at once still cause only one round of fetches.
 * ============================================================
 */

const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const { NEWS_SOURCES, getSourceById } = require("../data/newsSources");

/* ---------- defaults, overridable per source ---------- */
const REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MB per feed
const MAX_ITEMS_PER_SOURCE = 12;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SUMMARY_MAX_CHARS = 220;
const TITLE_MAX_CHARS = 180;

/* ============================================================
   1) SANITISING
   ------------------------------------------------------------
   Feed content is HTML authored by someone we do not control. We
   reduce it to plain text and nothing else. Order matters: decode
   entities LAST so that "&lt;script&gt;" in the raw feed becomes
   the visible text "<script>" rather than a real tag.
   ============================================================ */

/** Tags whose entire contents should be dropped, not just untagged. */
const DROP_WITH_CONTENT = /<(script|style)[\s\S]*?<\/\1>/gi;
/** HTML comments can hide conditional-comment payloads. */
const COMMENTS = /<!--[\s\S]*?-->/g;
/** Any remaining tag. */
const TAGS = /<\/?[a-z][^>]*>/gi;
/** Tags that imply a line break, so we do not glue words together. */
const BLOCK_BREAKS = /<\s*(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi;

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "...",
  mdash: "-",
  ndash: "-",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
  laquo: "<<",
  raquo: ">>",
  middot: "-",
  bull: "-",
  deg: " deg",
  eacute: "e",
  copy: "(c)",
  reg: "(r)",
  trade: "(tm)",
};

function decodeEntities(input) {
  return input
    // Numeric: &#8217; and &#x2019; are the same character.
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

/** Keeps us from emitting control chars or lone surrogates. */
function safeCodePoint(code) {
  if (!Number.isFinite(code) || code < 32 || code > 0x10ffff) return "";
  if (code >= 0xd800 && code <= 0xdfff) return "";
  return String.fromCodePoint(code);
}

/**
 * Reduce arbitrary feed HTML to a single line of plain text.
 * This is the only path by which feed text reaches the client.
 */
function toPlainText(input, maxChars) {
  if (typeof input !== "string") return "";
  const text = input
    .replace(DROP_WITH_CONTENT, " ")
    .replace(COMMENTS, " ")
    .replace(BLOCK_BREAKS, " ")
    .replace(TAGS, " ")
    .replace(/\s+/g, " ")
    .trim();
  const decoded = decodeEntities(text);
  if (decoded.length <= maxChars) return decoded;
  // Cut on a word boundary so we never end mid-word.
  const cut = decoded.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}...`;
}

/* ============================================================
   2) PARSING
   ------------------------------------------------------------
   RSS 2.0 uses <item>, Atom uses <entry>, and both have the same
   idea of "one story". fast-xml-parser gives us plain objects; we
   normalise the two shapes into one.
   ============================================================ */

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  processEntities: true,
  // Prevents a deeply nested document from exhausting the stack.
  maxNestedDepth: 200,
});

/** XML gives us an array when a tag repeats and an object when it does not. */
const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);

/**
 * Pull the text out of a parsed element.
 *
 * This exists because of a real bug found while testing: when Atom
 * adds an attribute to a tag, for example <title type="html">, the
 * parser returns an OBJECT { "#text": "...", "@_type": "html" }
 * instead of a string. Feeds that do this are extremely common, so
 * treating the value as a string silently produced zero items from
 * otherwise perfectly good feeds. Every text field goes through here.
 */
function textOf(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    if (typeof value["#text"] === "string") return value["#text"];
    // Some feeds wrap twice, e.g. <description><content>..</content></description>
    for (const nested of Object.values(value)) {
      if (typeof nested === "string" && nested.trim()) return nested;
    }
  }
  return "";
}

/** Atom puts the URL in an attribute; RSS puts it in the text. */
function extractLink(entry) {
  const candidates = asArray(entry.link);
  // Prefer an explicit "alternate" link: that is the story itself.
  // Atom feeds also carry rel="self" (the XML) and rel="replies"
  // (a comment thread). We do NOT want either of those.
  for (const candidate of candidates) {
    const href = candidate?.["@_href"];
    const rel = candidate?.["@_rel"];
    if (href && rel === "alternate") return String(href).trim();
  }
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    const href = candidate?.["@_href"];
    if (href && !candidate["@_rel"]) return String(href).trim();
  }
  // Last resort: Atom's <id> is usually the same URL.
  for (const key of ["id", "guid"]) {
    const value = textOf(entry[key]).trim();
    if (/^https?:\/\//i.test(value)) return value;
  }
  return "";
}

/**
 * True when a hostname is not a public internet address.
 *
 * A feed is written by a stranger, so a story "link" could be
 * http://169.254.169.254/ (the cloud metadata service) or an
 * internal admin host. We do not fetch these links, but a user
 * clicking one would be sent somewhere dangerous, so we drop them
 * rather than pass them through. The same test guards redirects.
 */
function isNonPublicHost(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  // IPv4 private, loopback, link-local (incl. 169.254.169.254),
  // CGNAT, and the "this host" 0.0.0.0/8 range.
  if (
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^127\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host) ||
    /^0\./.test(host)
  ) {
    return true;
  }
  // IPv6 loopback, unique-local, link-local and unspecified.
  if (host === "::1" || host === "::" || /^f[cd][0-9a-f]{2}:/.test(host) || /^fe[89ab][0-9a-f]:/.test(host)) {
    return true;
  }
  return false;
}

/** Only ever emit a link we can be sure points at a public web page. */
function sanitiseUrl(raw) {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    // Reject credentials in the URL (https://user:pass@host) which
    // are a classic phishing trick and a log-poisoning nuisance.
    if (parsed.username || parsed.password) return "";
    if (isNonPublicHost(parsed.hostname)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function parseDate(...candidates) {
  for (const candidate of candidates) {
    const value = textOf(candidate).trim();
    if (!value) continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function normaliseEntry(entry, source) {
  const title = toPlainText(textOf(entry.title), TITLE_MAX_CHARS);
  const url = sanitiseUrl(extractLink(entry));
  // A story with no title or no link is not usable; drop it rather
  // than render an empty row.
  if (!title || !url) return null;

  const published = parseDate(entry.pubDate, entry.published, entry.updated, entry["dc:date"]);
  const summary =
    toPlainText(textOf(entry.description), SUMMARY_MAX_CHARS) ||
    toPlainText(textOf(entry.summary), SUMMARY_MAX_CHARS);

  return {
    id: `${source.id}:${url}`,
    title,
    url,
    // A missing date is normal in the wild. null means "unknown",
    // and the frontend must not pretend otherwise.
    publishedAt: published ? published.toISOString() : null,
    summary,
    sourceId: source.id,
    sourceName: source.name,
    sourceKind: source.kind,
  };
}

function parseFeed(xml, source) {
  let doc;
  try {
    doc = parser.parse(xml);
  } catch {
    return [];
  }
  const rss = doc?.rss?.channel;
  const rdf = doc?.["rdf:RDF"];
  const atom = doc?.feed;

  const rawItems = rss
    ? asArray(rss.item)
    : rdf
      ? asArray(rdf.item)
      : atom
        ? asArray(atom.entry)
        : [];

  const seen = new Set();
  const items = [];
  for (const raw of rawItems) {
    if (!raw || typeof raw !== "object") continue;
    const item = normaliseEntry(raw, source);
    if (!item) continue;
    // Publishers often repeat a story across categories.
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    items.push(item);
    if (items.length >= MAX_ITEMS_PER_SOURCE) break;
  }
  return items;
}

/* ============================================================
   3) FETCHING
   ============================================================ */

/**
 * Refuse a redirect that leaves https, or that points at an
 * address that is not public.
 *
 * The allowlist already stops a visitor choosing the URL, but a
 * publisher's server could still answer with a redirect to an
 * internal address. Blocking the private ranges here means a
 * compromised or misconfigured feed cannot use us to probe the
 * network our server sits in.
 */
function assertSafeRedirect(options) {
  if (options.protocol && options.protocol !== "https:") {
    throw new Error("Refusing a redirect that leaves https.");
  }
  if (isNonPublicHost(options.hostname)) {
    throw new Error("Refusing a redirect to a non-public host.");
  }
}

/**
 * Fetch one feed. Never throws: a failing source must not take the
 * whole page down, so problems are returned as a status string.
 */
async function fetchSource(source) {
  const maxBytes = source.maxBytes || DEFAULT_MAX_BYTES;
  const startedAt = Date.now();
  try {
    const response = await axios.get(source.url, {
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: 3,
      responseType: "text",
      // Enforce the size cap while streaming, not after, so a huge
      // feed cannot be buffered into memory before we reject it.
      maxContentLength: maxBytes,
      maxBodyLength: maxBytes,
      headers: {
        "User-Agent":
          "WebVulnerabilityLab/1.0 (educational project; security news reader)",
        Accept:
          "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
      },
      beforeRedirect: assertSafeRedirect,
    });

    const xml = response.data;
    if (typeof xml !== "string" || !xml.trim()) {
      return { id: source.id, ok: false, error: "empty response", items: [] };
    }
    const items = parseFeed(xml, source);
    if (!items.length) {
      return { id: source.id, ok: false, error: "no parseable items", items: [] };
    }
    return { id: source.id, ok: true, items, fetchedAt: new Date().toISOString(), ms: Date.now() - startedAt };
  } catch (error) {
    // Keep the message short and non-specific in what we return to
    // the client; the full error is logged server-side.
    const code = error.code || error.response?.status || "request_failed";
    return { id: source.id, ok: false, error: String(code), items: [], fetchedAt: new Date().toISOString() };
  }
}

/* ============================================================
   4) PER-SOURCE CACHE
   ============================================================ */

const nowMs = () => Date.now();

/** @type {Map<string, {at:number, result:object}>} */
const cache = new Map();
/** @type {Map<string, Promise<object>>} */
const inFlight = new Map();

function ttlFor(source) {
  return source.ttlMinutes ? source.ttlMinutes * 60 * 1000 : DEFAULT_TTL_MS;
}

/**
 * Return this source's result, refreshing only if its own TTL has
 * expired. On a fetch failure we keep serving the last good data
 * and mark it stale, which is far better than making the whole page
 * blink out because one publisher is down.
 */
async function getSource(source, { force = false } = {}) {
  const hit = cache.get(source.id);
  if (!force && hit && nowMs() - hit.at < ttlFor(source)) {
    return { ...hit.result, stale: false };
  }

  if (!inFlight.has(source.id)) {
    inFlight.set(
      source.id,
      fetchSource(source).finally(() => inFlight.delete(source.id))
    );
  }

  try {
    const result = await inFlight.get(source.id);
    // Only overwrite good data. A failed refresh must not discard
    // stories we already had.
    if (result.ok) {
      cache.set(source.id, { at: nowMs(), result });
      return { ...result, stale: false };
    }
    if (hit) {
      return { ...hit.result, ok: true, stale: true, lastError: result.error };
    }
    return result;
  } catch (error) {
    if (hit) return { ...hit.result, ok: true, stale: true, lastError: "refresh_failed" };
    throw error;
  }
}

/**
 * Merge every source into one newest-first list.
 * A source that failed is reported in `failures` rather than being
 * silently dropped, so the UI can say which publishers are
 * unreachable instead of quietly showing a short list.
 */
async function getNews({ force = false } = {}) {
  const results = await Promise.all(NEWS_SOURCES.map((s) => getSource(s, { force })));

  const items = [];
  const failures = [];
  const sources = [];

  for (const result of results) {
    const source = NEWS_SOURCES.find((s) => s.id === result.id);
    const meta = {
      id: source.id,
      name: source.name,
      site: source.site,
      kind: source.kind,
      blurb: source.blurb,
      ok: Boolean(result.ok),
      stale: Boolean(result.stale),
      itemCount: result.items.length,
      lastError: result.lastError || null,
      // When THIS source was actually downloaded. A cache hit keeps
      // the original timestamp, so this is never refreshed by serving
      // a stale copy.
      fetchedAt: result.fetchedAt || null,
    };
    sources.push(meta);
    if (result.ok) {
      items.push(...result.items);
    } else {
      failures.push({ id: source.id, name: source.name, reason: result.error });
    }
  }

  // Newest first. Stories with no date sort last rather than being
  // treated as brand new, because a missing date is not evidence
  // of recency.
  const undated = Number.MAX_SAFE_INTEGER;
  items.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : undated;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : undated;
    return tb - ta;
  });

  // The timestamp shown to the user must be the moment the data was
  // downloaded, not the moment this function ran.
  //
  // It used to be `new Date()`, which meant a request served entirely
  // from cache cheerfully reported the stories as just fetched. The
  // UI prints "updated N minutes ago" from this value, so on a warm
  // cache it was telling users that 40-minute-old news was seconds
  // old. The oldest contributing fetch is the honest number: that is
  // the stalest story in the list.
  const fetchTimes = sources
    .filter((s) => s.ok && s.fetchedAt)
    .map((s) => Date.parse(s.fetchedAt))
    .filter((t) => Number.isFinite(t));

  return {
    items,
    sources,
    failures,
    fetchedAt: fetchTimes.length ? new Date(Math.min(...fetchTimes)).toISOString() : null,
    counts: {
      total: items.length,
      sourcesOk: sources.filter((s) => s.ok).length,
      sourcesTotal: NEWS_SOURCES.length,
      // True when at least one feed is serving data past its TTL.
      partial: sources.some((s) => s.stale) || failures.length > 0,
    },
  };
}

/** Filter the merged list down to one source, or one kind. */
function filterNews(payload, { source, kind, limit } = {}) {
  let items = payload.items;
  if (source) {
    const known = getSourceById(source);
    if (!known) return null; // caller turns this into a 400
    items = items.filter((i) => i.sourceId === source);
  }
  if (kind) {
    const valid = ["advisory", "news", "research"];
    if (!valid.includes(kind)) return null;
    items = items.filter((i) => i.sourceKind === kind);
  }
  const max = Number(limit);
  if (Number.isFinite(max) && max > 0) items = items.slice(0, Math.min(Math.floor(max), 100));
  return items;
}

/** Test hook: drop the cache so a test starts from a known state. */
function clearCache() {
  cache.clear();
  inFlight.clear();
}

module.exports = {
  getNews,
  filterNews,
  toPlainText,
  sanitiseUrl,
  isNonPublicHost,
  textOf,
  parseFeed,
  clearCache,
  DEFAULT_TTL_MS,
};
