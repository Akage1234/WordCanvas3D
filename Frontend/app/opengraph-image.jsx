import { ogHome, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "WordCanvas3D: see how AI reads text";

export default function Image() {
  return ogHome();
}
