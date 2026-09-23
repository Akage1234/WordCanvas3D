export const DEFAULT_POINT_COLOR = "#00aaff";

export const CLUSTER_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#f9ca24",
  "#6c5ce7",
  "#a55eea",
  "#26de81",
  "#fd79a8",
];

export function clusterColor(clusterId) {
  if (!Number.isInteger(clusterId) || clusterId < 0) return DEFAULT_POINT_COLOR;
  return CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];
}

export function darkenHex(hex, factor = 0.34) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift) => Math.round(((value >> shift) & 0xff) * factor);
  return `rgb(${channel(16)} ${channel(8)} ${channel(0)} / 0.96)`;
}

// Solid fill of `hex`, darkened only as far as white text needs for WCAG AA (4.5:1).
// Keeps the cluster hue recognisable while staying readable on the bright palette entries.
export function badgeColor(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  const rgb = [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
  const channel = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  let factor = 1;
  let scaled = rgb;
  while (factor > 0.2 && 1.05 / (luminance(scaled) + 0.05) < 4.5) {
    factor -= 0.02;
    scaled = rgb.map((c) => c * factor);
  }
  return `rgb(${scaled.map((c) => Math.round(c)).join(" ")})`;
}
