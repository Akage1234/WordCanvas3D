"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const SUGGESTIONS = ["music", "january", "doctor", "happy", "river"];

export function WordSearch({ buttonClass }) {
  const router = useRouter();
  const [word, setWord] = useState("");
  const inputRef = useRef(null);
  const go = (event) => {
    event.preventDefault();
    const q = word.trim().toLowerCase();
    router.push(q ? `/embedding?word=${encodeURIComponent(q)}` : "/embedding");
  };
  return (
    <>
      <form className={styles.seek} onSubmit={go}>
        <input ref={inputRef} value={word} onChange={(e) => setWord(e.target.value)} placeholder="e.g. ocean" aria-label="Word to find" autoComplete="off" spellCheck={false} />
        <button className={buttonClass} type="submit">Find it</button>
      </form>
      <div className={styles.seekTags}>
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => { setWord(s); inputRef.current?.focus(); }}>{s}</button>
        ))}
      </div>
    </>
  );
}
