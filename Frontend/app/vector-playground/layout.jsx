import { AUTHOR, SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

const TITLE = "Vector Playground: word vector arithmetic";
const DESCRIPTION = "Do math with word meanings: try king − man + woman and other analogies, and see word vectors as arrows in 3D, computed on all 300 dimensions.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/vector-playground" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/vector-playground" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: `${SITE_NAME} ${TITLE.split(":")[0]}`,
  url: `${SITE_URL}/vector-playground`,
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
  <h1 className="sr-only">Vector Playground: word vector arithmetic</h1>
      {children}
    </>
  );
}
