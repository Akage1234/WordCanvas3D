import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

// Skip Next internals, Vercel internals, anything with a file extension (images, datasets, sitemap.xml...)
// and OG images: Next links them as /en/.../opengraph-image, which must not be redirected to the unprefixed path.
export const config = { matcher: "/((?!_next|_vercel|.*opengraph-image|.*\\..*).*)" };
