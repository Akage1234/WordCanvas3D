import { Link } from "@/i18n/navigation";
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
// links: [{ href, title, source, note }]. The article page renders this from each article's `reading` export.
export function FurtherReading({ title, links }) {
  if (!links?.length) return null;
  return (
    <section className={s.further}>
      <h2 id="further-reading">{title}</h2>
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

// Common questions, answered in a few sentences each. items: [{ q, a }], also used for the FAQPage schema.
export function Faq({ title, items }) {
  if (!items?.length) return null;
  return (
    <section className={s.faq}>
      <h2 id="faq">{title}</h2>
      {items.map(({ q, a }) => (
        <details key={q}>
          <summary>{q}<i aria-hidden="true" /></summary>
          <p>{a}</p>
        </details>
      ))}
    </section>
  );
}
