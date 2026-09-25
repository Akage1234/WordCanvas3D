"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

export function Reveal({ as: Tag = "div", className = "", inClass = styles.revealIn, children, ...props }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const Comp = Tag === "link" ? Link : Tag;
  return <Comp ref={ref} className={`${className} ${shown ? inClass : ""}`} {...props}>{children}</Comp>;
}

const SITE_URL = "https://wordcanvas3d.vercel.app";
const SHARE_TEXT = "WordCanvas3D: see how AI reads text. Tokenize it, map words in 3D and do math with meaning, free in your browser.";

// Share the site: the native share sheet where there is one, otherwise copy the link; plus a few direct links.
export function ShareBar({ buttonClass }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "WordCanvas3D", text: SHARE_TEXT, url: SITE_URL }); } catch {}
      return;
    }
    await navigator.clipboard.writeText(SITE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const open = (make) => () => window.open(make(encodeURIComponent(SITE_URL), encodeURIComponent(SHARE_TEXT)), "_blank", "noopener,noreferrer");
  const targets = [
    ["X", (u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`],
    ["LinkedIn", (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ["Reddit", (u, t) => `https://www.reddit.com/submit?url=${u}&title=${t}`],
    ["WhatsApp", (u, t) => `https://wa.me/?text=${t}%20${u}`],
  ];
  return (
    <>
      <button type="button" className={buttonClass} onClick={share}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14" /></svg>
        <span aria-live="polite">{copied ? "Link copied" : "Share WordCanvas3D"}</span>
      </button>
      <div className={styles.shareTo}>
        <span>or share on</span>
        {targets.map(([name, make]) => <button key={name} type="button" onClick={open(make)}>{name}</button>)}
      </div>
    </>
  );
}
