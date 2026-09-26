import { AUTHOR, SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

const TITLE = "Tokenizer: see how text becomes tokens";
const DESCRIPTION = "Paste any text and see exactly how GPT, LLaMA and other tokenizers split it into tokens and IDs. Count tokens, compare models, and see why emoji and other languages cost more.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tokenizer" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/tokenizer" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: `${SITE_NAME} ${TITLE.split(":")[0]}`,
  url: `${SITE_URL}/tokenizer`,
  description: DESCRIPTION,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any (runs in the browser)",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", ...AUTHOR },
};

export default function Layout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
      {children}
    </>
  );
}
