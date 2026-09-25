import Link from "next/link";
import s from "./learn.module.css";

// Shared building blocks for Learn articles.

export function Fig({ caption, children }) {
  return (
    <figure className={s.fig}>
      {children}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

// Link to another Learn article by slug. Titles live in the registry; pass children to override the text.
export function ArticleLink({ slug, children }) {
  return <Link href={`/learn/${slug}`}>{children}</Link>;
}

// A short aside, e.g. "In one sentence" summaries or "Common misconception" notes.
export function Callout({ title, children }) {
  return (
    <aside className={s.callout}>
      {title && <strong>{title}</strong>}
      <div>{children}</div>
    </aside>
  );
}

// Hand-picked external material. Keep it short: only links worth a reader's time.
// links: [{ href, title, source, note }]
export function FurtherReading({ links }) {
  return (
    <section className={s.further} aria-label="Further reading">
      <h2>Further reading</h2>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} target="_blank" rel="noopener noreferrer">{l.title}</a>
            <span>{l.source}{l.note ? ` · ${l.note}` : ""}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
