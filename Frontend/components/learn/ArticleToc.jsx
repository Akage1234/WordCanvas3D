"use client";

import { useEffect, useRef, useState } from "react";
import s from "./learn.module.css";

// Section timeline beside an article. Reads the h2s from the rendered body, so articles (and their
// translations) need no section list of their own.
const OFFSET = 120; // a heading counts as "reached" once it scrolls this close to the top, under the header

const slugify = (text) => text.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");

export default function ArticleToc({ label, target }) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    const hs = [...document.querySelectorAll(`${target} h2`)];
    hs.forEach((h, i) => { h.id ||= slugify(h.textContent) || `section-${i + 1}`; });
    setItems(hs.map((h) => ({ id: h.id, text: h.textContent })));
    // ids are added after hydration, so a shared #section link needs one nudge
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();

    let frame = 0;
    const update = () => {
      frame = 0;
      const tops = hs.map((h) => h.getBoundingClientRect().top - OFFSET);
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      const i = atEnd ? hs.length - 1 : tops.findLastIndex((t) => t <= 0); // short last sections never reach the top
      // fill the line from the first dot to the current point between the reached dot and the next one
      const dots = [...(listRef.current?.children ?? [])].map((li) => li.offsetTop);
      let fill = 0;
      if (i >= 0 && dots.length === hs.length) {
        const next = tops[i + 1];
        const f = next === undefined ? 0 : Math.min(1, -tops[i] / (next - tops[i]));
        fill = dots[i] + f * ((dots[i + 1] ?? dots[i]) - dots[i]) - dots[0];
      }
      setActive(Math.max(i, 0));
      listRef.current?.style.setProperty("--fill", `${fill}px`);
    };
    const onScroll = () => { frame ||= requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, [target]);

  // the first measurement ran before the list existed; measure again once it has rendered
  useEffect(() => { if (items.length) dispatchEvent(new Event("scroll")); }, [items]);

  if (items.length < 2) return null;
  return (
    <nav className={s.toc} aria-label={label}>
      <small>{label}</small>
      <ol ref={listRef}>
        {items.map((it, i) => (
          <li key={it.id} className={i < active ? s.tocDone : i === active ? s.tocActive : undefined} style={{ "--i": i }}>
            <a href={`#${it.id}`} aria-current={i === active ? "location" : undefined}>{it.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
