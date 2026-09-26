import { ogLearn, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "WordCanvas3D Learn: how language models read text";

export default function Image() {
  return ogLearn();
}
