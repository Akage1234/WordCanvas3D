import { getTranslations, setRequestLocale } from "next-intl/server";
import { AUTHOR, SITE_NAME, SITE_URL, jsonLd, localeAlternates, localePath } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Embedding" });
  const title = t("metaTitle");
  const description = t("description");
  return {
    title,
    description,
    alternates: localeAlternates("/embedding", locale),
    openGraph: { title, description, url: localePath("/embedding", locale) },
    twitter: { title, description },
  };
}

const schema = (TITLE, DESCRIPTION) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: `${SITE_NAME} ${TITLE.split(":")[0]}`,
  url: `${SITE_URL}/embedding`,
  description: DESCRIPTION,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any (runs in the browser)",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", ...AUTHOR },
});

export default async function Layout({ children, params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Embedding");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema(t("metaTitle"), t("description")))} />
  <h1 className="sr-only">{t("metaTitle")}</h1>
      {children}
    </>
  );
}
