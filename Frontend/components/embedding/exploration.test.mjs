import test from 'node:test';
import assert from 'node:assert/strict';
import { connections, exploreNetwork, clusterSummaries, placeLabels } from './exploration.mjs';

const words = ['The', 'the', 'shared', 'other', 'isolated'];
const edges = [[0, 2, 2], [2, 3], [], [0], []];
test('focus includes every outgoing link, including lower indices, without inventing reverse links', () => {
  assert.deepEqual(connections(edges, 0), [2]);
  const network = exploreNetwork(words, edges, 'other', [], true);
  assert.deepEqual([...network.active], [3, 0]);
  assert.deepEqual(network.segments, [{ source: 3, target: 0, group: 0 }]);
  assert.deepEqual([...exploreNetwork(words, edges, 'shared', [], true).active], [2]);
});
test('comparison preserves exact case and identifies shared outgoing targets', () => {
  const network = exploreNetwork(words, edges, '', ['The', 'the'], false);
  assert.deepEqual([...network.shared], [2]);
  assert.equal(network.segments.length, 3);
  assert.equal(exploreNetwork(words, edges, 'missing', ['missing'], true).roots.length, 0);
});
test('cluster examples are actual members closest to the projected centroid', () => {
  const result = clusterSummaries({ words: ['far', 'middle', 'near', 'noise'], clusters: [2, 2, 2, -1], positions: [10, 0, 0, 4, 0, 0, 3, 0, 0, 0, 0, 0] });
  assert.equal(result[0].id, -1);
  assert.deepEqual(result[1].examples, ['middle', 'near', 'far']);
  assert.deepEqual(result[1].words, ['far', 'middle', 'near']);
});
test('labels avoid collisions, offscreen positions and the tray', () => {
  const candidates = [{ label: 'one', x: 20, y: 80 }, { label: 'two', x: 21, y: 81 }, { label: 'low', x: 20, y: 300 }, { label: 'right', x: 290, y: 80 }];
  assert.deepEqual(placeLabels(candidates, 320, 400, 8).map((p) => p.label), ['one']);
});
