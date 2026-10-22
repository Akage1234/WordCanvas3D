# Translating Learn articles

A brief for translating the Learn articles of WordCanvas3D into Chinese (`zh`), Japanese (`ja`) and Spanish (`es`).
Paths below are relative to `WordCanvas3D/Frontend/`.

## The job

The site's interface is already translated (`messages/<locale>.json`). The Learn articles are not: in `/zh`, `/ja` and `/es`
they show the English text with a note saying so. Your job is to translate all 14 articles into one language per branch.

An untranslated article keeps working in English, so each article switches over on its own once it is done.
You can stop after any article and the site is still correct.

The 14 articles, in reading order (slugs from `components/learn/catalog.js`):

| Track | Slug | Source |
|---|---|---|
| Start here | `how-llms-work` | `articles/how-llms-work.jsx` |
| Foundations | `why-tokens` | `articles/why-tokens.jsx` |
| | `tokenization-algorithms` | `articles/tokenization-algorithms.jsx` |
| | `tokens-beyond-text` | `articles/tokens-beyond-text.jsx` |
| | `what-are-embeddings` | `articles/what-are-embeddings.jsx` |
| | `latent-space` | `articles/latent-space.jsx` |
| | `dimensionality-reduction` | `articles/dimensionality-reduction.jsx` |
| | `attention-and-transformers` | `articles/attention-and-transformers.jsx` |
| | `next-token-prediction` | `articles/next-token-prediction.jsx` |
| Site guides | `what-is-a-token` | `guides.jsx` (`WhatIsAToken`, FAQ in `GUIDE_FAQ`) |
| | `why-emoji-cost-more-tokens` | `guides.jsx` (`EmojiAndLanguages`) |
| | `how-a-word-becomes-300-numbers` | `guides.jsx` (`WordToNumbers`) |
| | `pca-vs-umap` | `guides.jsx` (`PcaVsUmap`) |
| | `king-man-woman` | `guides.jsx` (`KingManWoman`) |

Article sources are under `components/learn/`. Each article also has `<slug>.figures.jsx` (interactive figures) and `<slug>.module.css`.

## Branches and files

- One branch per language, created from `dev`: `translate/zh`, `translate/ja`, `translate/es`.
- Commit locally on that branch. **Do not push, merge or rebase onto other branches**; the branches are reviewed and merged for you.
- Commit per article (or a few at a time), e.g. `Translate why-tokens (ja)`.
- **Only create or edit files inside `components/learn/translations/<locale>/`.** Everything a translation needs is in that folder:
  - `meta.js`: titles, summaries and CTAs
  - `index.js`: registers the translated bodies
  - `<slug>.jsx`: one file per translated article
  - `<slug>.figures.jsx`: only when a figure has text to translate

  This keeps the three branches from ever conflicting. If you think a shared file needs a change (an English article, `kit.jsx`,
  `guides.jsx`, `registry.js`, `GLOSSARY.md`, a CSS file, `messages/*.json`), don't make it. List it in your hand-off report instead.

## Terms and style

Follow `messages/GLOSSARY.md` exactly: the style table (script, register, punctuation), the "Never translate" list, and the numbered term table.
The same term must use the same translation in every article.

When you need a technical term that is not in the glossary:
1. Pick one translation.
2. Use it consistently.
3. Add it to the "New terms" list in your hand-off report.

Writing:
- Translate meaning, not word order. The articles are written for beginners in plain, friendly language, so keep that tone.
- Keep the structure: the same `<h2>` sections, paragraphs, lists, figures and callouts, in the same order. Don't add or remove content.
- Keep inline markup (`<strong>`, `<em>`, `<code>`) around the equivalent words.
- Leave everything in `<code>` as it is (tokens, IDs, tokenizer names, code).
- Example words and sentences fed to the tools (“The cat sat on the mat.”, king/queen, the chips under figures) stay in English.
  Those examples are real tokenizer or embedding output; translating them would make the numbers wrong.
  Translate the sentence that explains them, and add a translated gloss in brackets where it helps, e.g. “The cat sat on the mat.”（猫がマットの上に座った。）.

## Translating one article (example: `why-tokens` into `ja`)

### 1. Title, summary, CTA: `translations/ja/meta.js`

```js
export default {
  "why-tokens": {
    title: "…",
    summary: "…",
  },
  // site guides also have a CTA. Translate label and text; href stays in catalog.js.
  "what-is-a-token": { title: "…", summary: "…", cta: { label: "…", text: "…" } },
};
```

These feed the Learn index, the home page, link-preview images, the page `<title>` and description, and the previous/next links.

### 2. Body, FAQ, further reading: `translations/ja/why-tokens.jsx`

Copy `articles/why-tokens.jsx` and translate it. The file must export the same three things the English one does:

- `default`: the body component. Translate prose, `<h2>` headings, figure captions (`<Fig caption="…">`), `Callout` titles
  (“In one sentence” and the like) and image `aria-label`s.
- `faq`: `[{ q, a }]`, plain strings. Write the questions the way people actually search in that language, not word for word.
  Each answer should stand on its own in 2–4 sentences. Search engines show these as answers.
- `reading`: further-reading links. Translate `note`, and `source` where it's descriptive. Keep the links. If an excellent
  source exists in that language, you may add it, but don't remove the English ones.

Imports in the copy: switch relative imports to the `@/` alias, which works from any folder:

| English file has | Translated file uses |
|---|---|
| `from "../kit"` | `from "@/components/learn/kit"` |
| `from "../learn.module.css"` | `from "@/components/learn/learn.module.css"` |
| `from "./why-tokens.module.css"` | `from "@/components/learn/articles/why-tokens.module.css"` |
| `from "./why-tokens.figures"` | `from "@/components/learn/articles/why-tokens.figures"`, or `"./why-tokens.figures"` if you made a translated copy |

**Figures.** Open `articles/<slug>.figures.jsx` and look for visible English: SVG `<text>`, labels, buttons, `aria-label`, captions.
- If there is none, import the English figures as above.
- If there is some, copy the file to `translations/ja/<slug>.figures.jsx`, translate only those strings, and point its imports at
  `@/components/learn/articles/...` the same way.

Never change numbers, coordinates, token IDs or data in a figure.

**Links.** `<ArticleLink slug="latent-space">…</ArticleLink>` keeps the slug; translate only the link text, using that article's
translated title (or the English one if it isn't translated yet). `<Link href="/tokenizer">` stays as it is; the locale is added automatically.

### 3. Register it: `translations/ja/index.js`

```js
import * as WhyTokens from "./why-tokens";

export default {
  "why-tokens": WhyTokens,
};
```

Do steps 1 and 3 in the same commit as step 2. A body without a title, or a title without a body, shows a half-translated article.

## Site guides

The five guides live together in `guides.jsx`, with their FAQs in `GUIDE_FAQ`. For each guide, create `translations/ja/<slug>.jsx`:

- Copy the guide's function body from `guides.jsx` as the `default` export.
- Copy its entry from `GUIDE_FAQ` as `export const faq = [...]`.
- Guides have no `reading`.

The helpers they use are exported, so import them instead of copying:

```js
import { Chips, Fig, Scatter, PCA_POINTS, UMAP_POINTS, Parallelogram } from "@/components/learn/guides";
import { ArticleLink } from "@/components/learn/kit";
import { Link } from "@/i18n/navigation";
import s from "@/components/learn/learn.module.css";
```

`Scatter` takes a translated `label` (its aria-label). `Parallelogram` takes `label`, `royalty` and `gender`.
Register guides in `index.js` and `meta.js` exactly like articles; guides also need `cta` in `meta.js`.

## Before each commit: check it

Run from `WordCanvas3D/Frontend/`:

1. `npm run build` must pass, with no new warnings.
2. `npm run dev`, then open `http://localhost:3000/ja/learn/why-tokens` and check:
   - the title, summary and body are translated, and the “only in English” note under the summary is gone;
   - the “On this page” timeline on the left (on a window wider than 1240px) lists the translated headings, and clicking one jumps there;
   - every figure renders and works (sliders, play buttons, hovers) and shows no English you could have translated;
   - the FAQ opens and closes, and “Further reading” is below it;
   - the previous/next links at the bottom show translated titles for translated articles;
   - the browser console shows no errors.
3. In the page source (or DevTools → Elements, `script[type="application/ld+json"]`), check that `"inLanguage"` is `"ja"` and
   that the `FAQPage` block contains your translated questions.
4. Open `http://localhost:3000/ja/learn` and the home page `http://localhost:3000/ja`: the article's card shows the translated title and summary.
5. Check that the English page `http://localhost:3000/learn/why-tokens` is unchanged. The site remembers the last language you
   picked and redirects unprefixed URLs to it, so switch to English in the language menu first, or use a private window or
   `curl -s http://localhost:3000/learn/why-tokens`.

## Hand-off report

When the branch is ready, reply with:
- the branch name and the list of commits;
- which articles are translated (all 14, or which are left);
- **New terms**: any term not in `GLOSSARY.md` and the translation you used;
- **Shared-file changes needed**: anything outside your folder you think should change, and why;
- anything you were unsure about (a phrase, a figure, an example that doesn't work in the language).
