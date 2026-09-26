import { routing } from "@/i18n/routing";
import SiteShell from "@/components/SiteShell";
import NotFound from "@/components/NotFound";

// Unmatched URLs land here, outside [locale], so this renders the whole document itself.
export default function RootNotFound() {
  return (
    <SiteShell locale={routing.defaultLocale}>
      <link rel="icon" href="/logo.png" type="image/png" />
      <NotFound />
    </SiteShell>
  );
}
