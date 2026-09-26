import '../styles/globals.css';
import { LayoutProvider } from '@/components/LayoutProvider';
import { Navbar } from '@/components/Navbar';
import DotCanvas from '@/components/DotCanvas';
import { AUTHOR, INDEXABLE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "WordCanvas3D · See how AI reads text",
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [AUTHOR],
  creator: AUTHOR.name,
  keywords: ["tokenizer", "token counter", "word embeddings", "embedding visualizer", "vector arithmetic", "king - man + woman", "PCA", "UMAP", "GloVe", "Word2Vec", "FastText", "how LLMs work", "transformer", "attention", "learn AI"],
  category: "education",
  verification: { google: "wKtbqfHz7TxL8JT_Y9oGRbWWvEyidp4xv9WTXiJlFXc" },
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: "/",
    title: "WordCanvas3D · See how AI reads text",
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: "WordCanvas3D · See how AI reads text", description: SITE_DESCRIPTION },
  icons: [{ rel: "icon", url: "/logo.png", type: "image/png" }, { rel: "apple-touch-icon", url: "/logo.png" }],
};

export const viewport = { themeColor: "#05070b", colorScheme: "dark" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="dark:bg-black dark:text-neutral-100 dark:text-white bg-white text-black">
        <LayoutProvider>
          <DotCanvas opacity={0.09} dotColor="#ffffff" />
          <Navbar />
          {children}
        </LayoutProvider>
        <Analytics />
      </body>
    </html>
  );
}