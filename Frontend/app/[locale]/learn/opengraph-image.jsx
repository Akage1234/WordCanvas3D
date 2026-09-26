import { ogLearn, OG_SIZE } from "@/lib/og";
import { routing } from "@/i18n/routing";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "WordCanvas3D Learn: how language models read text";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Image({ params }) {
  const { locale } = await params;
  return ogLearn(locale);
}
