import { getLocale } from "next-intl/server";
import SiteShell from "@/components/SiteShell";
import NotFound from "@/components/NotFound";

// Unmatched URLs land here, outside [locale], so this renders the whole document itself.
// The proxy has already worked out the visitor's language (e.g. from /zh/...), so use it for <html lang>.
export default async function RootNotFound() {
  const locale = await getLocale();
  return (
    <SiteShell locale={locale}>
      <link rel="icon" href="/logo.png" type="image/png" />
      <NotFound />
    </SiteShell>
  );
}
