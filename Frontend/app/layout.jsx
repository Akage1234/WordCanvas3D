import '../styles/globals.css';

// The real <html> lives in [locale]/layout (via SiteShell). This pass-through root layout exists so
// app/not-found.jsx can catch unmatched URLs with a true 404 status.
export default function RootLayout({ children }) {
  return children;
}
