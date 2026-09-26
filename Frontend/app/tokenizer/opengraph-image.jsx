import { ogTokenizer, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "WordCanvas3D Tokenizer";

export default function Image() {
  return ogTokenizer();
}
