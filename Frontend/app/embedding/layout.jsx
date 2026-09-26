import { AUTHOR, SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

const TITLE = "Embedding explorer: word embeddings in 3D";
const DESCRIPTION = "Explore thousands of words from GloVe, Word2Vec and FastText in an interactive 3D map. Search a word, see its nearest neighbours, and compare PCA and UMAP projections.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/embedding" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/embedding" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

const schema = {
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
};

export default function Layout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
  <h1 className="sr-only">Embedding explorer: word embeddings in 3D</h1>
      {children}
    </>
  );
}
