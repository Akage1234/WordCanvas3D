import { ARTICLES, TRACKS } from "@/components/learn/registry";
import { ogArticle, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "WordCanvas3D Learn article";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  const track = TRACKS.find((t) => t.id === a.track)?.title;
  return ogArticle(a, track);
}
