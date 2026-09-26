// One place for the public URL and the copy search engines and link previews see.
export const SITE_URL = "https://wordcanvas3d.vercel.app";
export const SITE_NAME = "WordCanvas3D";
export const AUTHOR = { name: "Akage", url: "https://github.com/Akage1234" };
export const REPO_URL = "https://github.com/Akage1234/WordCanvas3D";

// Only the real production site should be indexed; previews and the v2 staging project stay out of search.
export const INDEXABLE =
  process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL === new URL(SITE_URL).host;

// JSON-LD needs `<` escaped so article text can never close the script tag.
export function jsonLd(data) {
  return { __html: JSON.stringify(data).replace(/</g, "\u003c") };
}
