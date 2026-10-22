"use client";

import { useState } from "react";
import s from "./learn.module.css";

// Native share sheet where there is one (phones, most desktop browsers); otherwise copy the link.
export default function ShareButton({ title, label, copied }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    const url = location.href.split("#")[0];
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {} // closing the sheet rejects; nothing to do
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {}
  };
  return (
    <button type="button" className={s.share} onClick={share} data-done={done || undefined}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {done ? <path d="M5 12.5l4.5 4.5L19 7" /> : <><path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>}
      </svg>
      <span aria-live="polite">{done ? copied : label}</span>
    </button>
  );
}
