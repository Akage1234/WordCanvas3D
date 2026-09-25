import test from "node:test";
import assert from "node:assert/strict";
import { lookup, analogy, nearest, pca3 } from "./vectorMath.mjs";

const dist = (a, b) => Math.hypot(...a.map((x, i) => x - b[i]));

test("pca3 keeps distances between points that already fit in 3D", () => {
  const points = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [1, 1, 1, 0]];
  const p = pca3(points);
  for (let i = 0; i < points.length; i++)
    for (let j = 0; j < points.length; j++)
      assert.ok(Math.abs(dist(p[i], p[j]) - dist(points[i], points[j])) < 1e-6);
});

test("analogy and nearest find the fourth corner, skipping inputs and their case variants", () => {
  const e = { king: [1, 1], man: [1, 0], woman: [0, 0.1], queen: [0, 1.1], King: [1, 1] };
  const v = analogy(e.king, e.man, e.woman);
  assert.equal(nearest(v, e, ["king", "man", "woman"], 1)[0].word, "queen");
});

test("lookup accepts lowercase and capitalised spellings", () => {
  const e = { Paris: [1], queen: [2] };
  assert.equal(lookup(e, "paris"), "Paris");
  assert.equal(lookup(e, "Queen"), "queen");
  assert.equal(lookup(e, "nope"), null);
});

test("pca3 without centering keeps the real zero at the origin", () => {
  const points = [[0, 0, 0, 0], [2, 1, 0, 0], [0, 1, 3, 0]];
  const p = pca3(points, false);
  assert.ok(Math.hypot(...p[0]) < 1e-9);
  for (let i = 1; i < points.length; i++) assert.ok(Math.abs(Math.hypot(...p[i]) - Math.hypot(...points[i])) < 1e-6);
});
