import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import SiteShell from '@/components/SiteShell';
import { AUTHOR, INDEXABLE, SITE_NAME, SITE_URL } from '@/lib/site';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const title = t("title");
  const description = t("description");
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s · ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    authors: [AUTHOR],
    creator: AUTHOR.name,
    keywords: t.raw("keywords"),
    category: "education",
    verification: { google: "wKtbqfHz7TxL8JT_Y9oGRbWWvEyidp4xv9WTXiJlFXc" },
    robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: t("ogLocale"),
      url: "/",
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
    icons: [{ rel: "icon", url: "/logo.png", type: "image/png" }, { rel: "apple-touch-icon", url: "/logo.png" }],
  };
}

export const viewport = { themeColor: "#05070b", colorScheme: "dark" };

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <SiteShell locale={locale}>{children}</SiteShell>;
}
