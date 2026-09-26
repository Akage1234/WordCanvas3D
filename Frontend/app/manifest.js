import { SITE_NAME } from "@/lib/site";
import en from "@/messages/en.json";

export default function manifest() {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: en.Metadata.description,
    start_url: "/",
    display: "standalone",
    background_color: "#05070b",
    theme_color: "#05070b",
    icons: [{ src: "/logo.png", sizes: "any", type: "image/png" }],
  };
}
