import { ogTokenizer, OG_SIZE } from "@/lib/og";
import { routing } from "@/i18n/routing";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "WordCanvas3D Tokenizer";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Image({ params }) {
  const { locale } = await params;
  return ogTokenizer(locale);
}
