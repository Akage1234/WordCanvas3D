// Stored links are directed. Do not infer similarity, reverse links, or paths.
export function connections(edges, index) {
  return index < 0 ? [] : [...new Set(edges[index])].filter((target) => target !== index);
}

export function exploreNetwork(words, edges, selected, pins, focus) {
  const roots = [...new Set([...(focus ? [selected] : []), ...pins])]
    .map((word) => words.indexOf(word)).filter((index) => index >= 0);
  const neighbours = roots.map((index) => connections(edges, index));
  const active = new Set(roots);
  const segments = [];
  roots.forEach((root, group) => neighbours[group].forEach((target) => {
    active.add(target);
    segments.push({ source: root, target, group });
  }));
  const pinIndices = pins.map((word) => words.indexOf(word));
  const shared = pinIndices.length === 2 && pinIndices.every((i) => i >= 0)
    ? connections(edges, pinIndices[0]).filter((i) => connections(edges, pinIndices[1]).includes(i)) : [];
  return { roots, active, segments, shared: new Set(shared) };
}

export function clusterSummaries(dataset) {
  if (!dataset) return [];
  const groups = new Map();
  dataset.clusters.forEach((id, index) => {
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(index);
  });
  return [...groups].sort(([a], [b]) => a - b).map(([id, indices]) => {
    const center = [0, 0, 0];
    for (const index of indices) for (let axis = 0; axis < 3; axis++) center[axis] += dataset.positions[index * 3 + axis] / indices.length;
    const distance = (index) => center.reduce((sum, value, axis) => sum + (dataset.positions[index * 3 + axis] - value) ** 2, 0);
    const examples = [...indices].sort((a, b) => distance(a) - distance(b) || a - b).slice(0, 3).map((i) => dataset.words[i]);
    const words = indices.map((i) => dataset.words[i]).sort((a, b) => a.localeCompare(b));
    return { id, count: indices.length, examples, words };
  });
}

// Greedy screen-space placement, prioritised by the caller. Bounds reserve room for UI.
export function placeLabels(candidates, width, height, limit, bottom = 110, top = 64, obstacles = []) {
  const placed = [];
  for (const candidate of candidates) {
    if (placed.length >= limit) break;
    const { x, y, label } = candidate;
    const w = label.length * 8.5 + 8;
    if (x < 8 || y < top || x + w > width - 8 || y + 28 > height - bottom) continue;
    if (obstacles.some((p) => x < p.x + p.width + 12 && x + w + 12 > p.x && y < p.y + p.height + 12 && y + 36 > p.y)) continue;
    if (placed.some((p) => x < p.x + p.width + 12 && x + w + 12 > p.x && y < p.y + 36 && y + 36 > p.y)) continue;
    placed.push({ ...candidate, width: w });
  }
  return placed;
}
