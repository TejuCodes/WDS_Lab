/**
 * ============================================================
 * DIAGRAM LAYOUT
 * ------------------------------------------------------------
 * The pure geometry behind <AttackDiagram>. No React, no DOM: it
 * takes a module and returns box positions, so it can be reasoned
 * about - and tested - on its own.
 *
 * A module's `diagram` is a small directed graph:
 *
 *   nodes: [{ text, tone }]
 *   edges: [{ from, to, label }]   // indexes into nodes
 *
 * The layout has three steps.
 *
 * 1. ROW. Each node is measured by the length of the longest path
 *    from it down to a leaf, and the row is that distance counted
 *    back up from the deepest node. The direction matters: measuring
 *    "distance to a leaf" and using it directly as the row draws the
 *    whole chain upside down, because the first node is the one
 *    furthest from any leaf. Measuring back up from the maximum
 *    guarantees every edge points downwards, which is the only
 *    property a flow chart absolutely needs.
 *
 *    The defence node is then pulled up to sit one row below the
 *    point it branches from, so the control appears next to the
 *    mistake it prevents rather than at the bottom of the chart.
 *
 * 2. COLUMN. Within a row, a node is pulled towards the column of
 *    its first predecessor, then the row is re-packed to remove the
 *    gaps. This is what keeps the two arms of a branch parallel: in
 *    the SQL injection diagram, the danger chain and the fix both
 *    leave the "no escaping" node and sit side by side rather than
 *    one hiding behind the other.
 *
 * 3. GEOMETRY. Rows are centred inside the widest row so the chart
 *    reads as a shape rather than as a ragged left edge.
 * ============================================================ */

export const BOX_W = 208;
export const BOX_MIN_H = 54;
export const GAP_X = 54;
export const GAP_Y = 64;
export const FONT = 13;
export const CHARS_PER_LINE = 24;
const PAD = 16;

/**
 * Greedy word wrap. A token longer than the line - a URL, an
 * identifier, a code fragment - is hard-broken rather than allowed
 * to run past the edge of its box.
 */
export function wrap(text, max = CHARS_PER_LINE) {
  const out = [];
  for (const raw of String(text).split(/\s+/).filter(Boolean)) {
    let word = raw;
    if (word.length > max) {
      while (word.length > max) {
        out.push(word.slice(0, max));
        word = word.slice(max);
      }
      if (word) out.push(word);
      continue;
    }
    const last = out.length - 1;
    if (last >= 0 && out[last].length + 1 + word.length <= max) out[last] += ` ${word}`;
    else out.push(word);
  }
  return out.length ? out : [""];
}

/**
 * Longest path from each node down to a leaf. Cycle-safe, memoised.
 */
function computeDown(count, edges) {
  const out = new Map(Array.from({ length: count }, (_, i) => [i, []]));
  for (const e of edges) {
    if (out.has(e.from) && out.has(e.to)) out.get(e.from).push(e.to);
  }

  const down = new Map();
  const resolving = new Set();

  const walk = (i) => {
    if (down.has(i)) return down.get(i);
    if (resolving.has(i)) return 0;
    resolving.add(i);
    const kids = out.get(i);
    const d = kids.length ? 1 + Math.max(...kids.map(walk)) : 0;
    resolving.delete(i);
    down.set(i, d);
    return d;
  };

  for (let i = 0; i < count; i++) walk(i);
  return { out, down };
}


/**
 * @returns {{
 *   pos: Map<number, {x:number,y:number,w:number,h:number}>,
 *   width: number, height: number,
 *   wrapped: string[][], stepOf: Map<number, number>,
 *   routes: ({d:string,label?:string,mid:number,from:number,to:number})[]
 * }}
 */
export function computeLayout(module) {
  const { nodes, edges } = module.diagram;
  const count = nodes.length;
  const { out, down } = computeDown(count, edges);

  // --- rows ---------------------------------------------------------
  // Row = distance counted back up from the deepest node, so every
  // edge points downwards. Using `down` directly would invert the
  // whole chart.
  const maxDown = Math.max(0, ...down.values());
  const rowOf = new Map();
  for (let i = 0; i < count; i++) rowOf.set(i, maxDown - down.get(i));

  // A defence node is a leaf that hangs off a decision point, so pull
  // it up to one row below its branch point. Only safe for a node with
  // no outgoing edges, since moving one up could otherwise invert an
  // edge that leaves it.
  for (let i = 0; i < count; i++) {
    if (nodes[i].tone !== "defence" || out.get(i).length) continue;
    const parents = edges.filter((e) => e.to === i).map((e) => rowOf.get(e.from));
    if (parents.length) rowOf.set(i, Math.min(...parents) + 1);
  }

  const byRow = new Map();
  for (let i = 0; i < count; i++) {
    const d = rowOf.get(i);
    if (!byRow.has(d)) byRow.set(d, []);
    byRow.get(d).push(i);
  }
  const rowKeys = [...byRow.keys()].sort((a, b) => a - b);

  // --- provisional columns, then pull towards the first predecessor --
  const col = new Map();
  for (const row of rowKeys) byRow.get(row).forEach((i, k) => col.set(i, k));

  for (let i = 0; i < count; i++) {
    const parents = edges.filter((e) => e.to === i && col.has(e.from)).map((e) => col.get(e.from));
    if (parents.length) col.set(i, Math.min(...parents));
  }
  for (const row of rowKeys) {
    const sorted = byRow.get(row).slice().sort((a, b) => col.get(a) - col.get(b));
    sorted.forEach((i, k) => col.set(i, k));
    byRow.set(row, sorted);
  }

  // --- sizes ---------------------------------------------------------
  const wrapped = nodes.map((n) => wrap(n.text));
  const heights = wrapped.map((lines) => Math.max(BOX_MIN_H, lines.length * (FONT + 4) + 18));

  const cols = Math.max(...[...col.values()].map((c) => c + 1), 1);
  const width = cols * BOX_W + (cols - 1) * GAP_X + PAD * 2;

  // --- positions, each row centred ------------------------------------
  const pos = new Map();
  let y = PAD;
  for (const row of rowKeys) {
    const members = byRow.get(row);
    const rowW = members.length * BOX_W + (members.length - 1) * GAP_X;
    const rowH = Math.max(...members.map((i) => heights[i]));
    let x = (width - rowW) / 2;
    for (const i of members) {
      pos.set(i, { x, y, w: BOX_W, h: heights[i] });
      x += BOX_W + GAP_X;
    }
    y += rowH + GAP_Y;
  }
  const height = y - GAP_Y + PAD;

  // --- step numbers along the attack line -----------------------------
  const stepOf = new Map(getAttackPath(module).map((i, k) => [i, k + 1]));

  // --- edge routes ----------------------------------------------------
  const routes = [];
  for (const edge of edges) {
    const a = pos.get(edge.from);
    const b = pos.get(edge.to);
    if (!a || !b) continue;
    const x1 = a.x + a.w / 2;
    const y1 = a.y + a.h;
    const x2 = b.x + b.w / 2;
    const y2 = b.y;
    let d;
    let mid;
    if (x1 === x2) {
      d = `M ${x1} ${y1} L ${x2} ${y2}`;
      mid = (y1 + y2) / 2;
    } else {
      const midY = y1 + Math.max(18, (y2 - y1) / 2);
      d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
      mid = midY;
    }
    routes.push({ d, label: edge.label, mid, from: edge.from, to: edge.to });
  }

  return { pos, width, height, wrapped, stepOf, routes, out };
}

/**
 * The attack line: the longest path through the graph once the
 * `defence` branch is removed. This is what the "Order the attack"
 * puzzle is built from, so the puzzle and the flowchart can never
 * disagree. A module can override it with an explicit `orderSteps`.
 */
export function getAttackPath(module) {
  if (Array.isArray(module.orderSteps)) return module.orderSteps;

  const { nodes, edges } = module.diagram;
  const live = nodes.map((n, i) => (n.tone === "defence" ? -1 : i)).filter((i) => i >= 0);
  const out = new Map(live.map((i) => [i, []]));
  for (const e of edges) {
    if (out.has(e.from) && out.has(e.to)) out.get(e.from).push(e.to);
  }

  const memo = new Map();
  const walk = (i, seen) => {
    if (memo.has(i)) return memo.get(i);
    if (seen.has(i)) return [i];
    seen.add(i);
    let best = [];
    for (const j of out.get(i) ?? []) {
      const path = walk(j, new Set(seen));
      if (path.length > best.length) best = path;
    }
    seen.delete(i);
    const result = [i, ...best];
    memo.set(i, result);
    return result;
  };

  const inbound = new Set();
  for (const from of out.keys()) for (const to of out.get(from)) inbound.add(to);
  const seeds = [...out.keys()].filter((i) => !inbound.has(i));
  const candidates = seeds.length ? seeds : [...out.keys()];

  let longest = [];
  for (const seed of candidates) {
    const path = walk(seed, new Set());
    if (path.length > longest.length) longest = path;
  }
  return longest;
}
