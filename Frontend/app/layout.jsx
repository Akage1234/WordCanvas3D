import '../styles/globals.css';
import { LayoutProvider } from '@/components/LayoutProvider';
import { Navbar } from '@/components/Navbar';
import DotCanvas from '@/components/DotCanvas';
import AuthorHoverCard from '@/components/AuthorHoverCard';
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: 'WordCanvas3D',
  description: 'Visualize, analyze, and interactively explore text tokenization and embeddings in 3D.',
  icons: [
    { rel: 'icon', url: '/logo.png', type: 'image/png' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="dark:bg-black dark:text-neutral-100 dark:text-white bg-white text-black">
        <LayoutProvider>
          <DotCanvas opacity={0.09} dotColor="#ffffff" />
          <Navbar />
          {children}
          <AuthorHoverCard />
        </LayoutProvider>
        <Analytics />
      </body>
    </html>
  );
}