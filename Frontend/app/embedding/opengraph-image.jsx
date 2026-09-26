import { ogEmbedding, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "WordCanvas3D Embedding explorer";

export default function Image() {
  return ogEmbedding();
}
