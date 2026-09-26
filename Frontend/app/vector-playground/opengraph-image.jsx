import { ogVectors, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "WordCanvas3D Vector Playground";

export default function Image() {
  return ogVectors();
}
