# Translating Learn articles

Everything on the site except the article text is already translated through `messages/<locale>.json`.
This folder holds the article translations. Locales: `zh`, `ja`, `es`. Follow `messages/GLOSSARY.md` for terms, register and punctuation.

An untranslated article still works in every locale: its English body is shown, with the "only in English" note
(`Learn.englishOnly`), and its structured data says `inLanguage: "en"`. Translate one article at a time; each one switches over
on its own once both steps below are done.

## Translating one article (example: `why-tokens` into `ja`)

1. **Title, summary, CTA**: add the entry to `translations/ja/meta.js`:

   ```js
   export default {
     "why-tokens": { title: "…", summary: "…" },
     // guides also have a CTA: cta: { label: "…", text: "…" }  (href stays in catalog.js)
   };
   ```

   These feed the Learn index, the home page, link-preview images, `<title>`/description and the pager.

2. **Body, FAQ, further reading**: copy `articles/why-tokens.jsx` to `translations/ja/why-tokens.jsx` and translate it.
   The file must export the same three things:
   - `default`: the body component. Translate prose, headings (`<h2>`), captions and `Callout` titles.
   - `faq`: `[{ q, a }]`, plain strings. Rewrite the questions the way people in that language actually search, not word for word.
   - `reading`: further-reading links. Translate `note` and `source` where useful; keep links (swap in a good native-language source if there is one).

   Fix the relative imports in the copy (`../kit` becomes `../../kit`, `./why-tokens.module.css` becomes `../../articles/why-tokens.module.css`, and so on).
   Figures with English text live in `articles/<slug>.figures.jsx`. If a figure has labels to translate, copy it next to the
   translated body (`translations/ja/why-tokens.figures.jsx`) and import that copy instead. Never edit the English files.

3. **Register it** in `registry.js`:

   ```js
   import * as WhyTokensJa from "./translations/ja/why-tokens";
   const TRANSLATED = { zh: {}, ja: { "why-tokens": WhyTokensJa }, es: {} };
   ```

Guides (`what-is-a-token`, `why-emoji-cost-more-tokens`, `how-a-word-becomes-300-numbers`, `pca-vs-umap`, `king-man-woman`) live together
in `guides.jsx`, with their FAQs in `GUIDE_FAQ`. To translate one, create `translations/ja/<slug>.jsx` exporting `default` (the body)
and `faq`, then register it the same way.

## Rules

- Do not change slugs, URLs, token IDs, numbers in figures, or the code names in `messages/GLOSSARY.md` (never translate).
- `<ArticleLink slug="…">` keeps the slug; translate only the link text (use that article's translated title).
- The section timeline reads the `<h2>`s at runtime, so it follows the translated headings with no extra work.
- Check with `npx next build`, then open `/ja/learn/why-tokens`. The "only in English" note should be gone.
