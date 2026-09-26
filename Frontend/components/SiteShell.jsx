import { NextIntlClientProvider } from 'next-intl';
import { LayoutProvider } from '@/components/LayoutProvider';
import { Navbar } from '@/components/Navbar';
import DotCanvas from '@/components/DotCanvas';
import { Analytics } from "@vercel/analytics/react";

// The <html> document every page shares: the [locale] layout and the root 404 both render it.
export default function SiteShell({ locale, children }) {
  return (
    <html lang={locale} className="dark">
      <body className="dark:bg-black dark:text-neutral-100 dark:text-white bg-white text-black">
        <NextIntlClientProvider>
          <LayoutProvider>
            <DotCanvas opacity={0.09} dotColor="#ffffff" />
            <Navbar />
            {children}
          </LayoutProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
