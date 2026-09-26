import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest() {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#05070b",
    theme_color: "#05070b",
    icons: [{ src: "/logo.png", sizes: "any", type: "image/png" }],
  };
}
