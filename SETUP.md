# WordCanvas3D – Technical Setup and Deployment

This document covers local development, production builds, deployment options, and the backend data preprocessing pipeline (Python notebooks/scripts) used to create the embedding datasets consumed by the frontend.

---

## 1) Requirements

- Node.js 18.18+ (Node 20+ recommended)
- npm 9+
- Python 3.9–3.12 (for preprocessing)

Optional (recommended):
- Git
- Vercel CLI (for one‑command deploys)

---

## 2) Project Layout Overview

```
repo/
  Backend/
    Preprocessing_script.ipynb
  Frontend/
    app/                      # Next.js (pages/routes)
    components/               # UI + canvas components
    public/                   # Static assets (images, data files)
      data/                   # Place exported embedding assets here
  README.md                   # Showcase readme
  SETUP.md                    # This file
  LICENSE
```

Key runtime assets are served from `Frontend/public/`. Any files you drop here are available at `/` paths in the app.

---

## 3) Local Development

```bash
# from repo root
cd Frontend
npm install
npm run dev
# open http://localhost:3000
```

Notes:
- Dev server uses webpack (per project scripts). If you change environment or missing deps, re‑install.
---

## 4) Production Build & Start

```bash
cd Frontend
npm run build
npm run start
```

---

## 5) Deployment

### A. Vercel (recommended)

1. Push to GitHub/GitLab/Bitbucket
2. Import the repo on Vercel
3. Framework: Next.js, root directory: `Frontend`
4. Build Command: `npm run build`  (in `Frontend`)
5. Output: `.next`

Environment:
- No special env vars required by default
- Analytics: works out of the box once the project is on Vercel

### B. Self‑host (Node)

1. Build locally on a CI or your machine:
   ```bash
   cd Frontend && npm ci && npm run build
   ```
2. Copy the `Frontend/.next` and `Frontend/public` to your server
3. Run with `node`:
   ```bash
   npm run start --prefix Frontend
   ```
4. Put a reverse proxy (nginx/caddy) in front for TLS and caching

---

## 6) Data Preprocessing Pipeline (Python)

The app visualizes high‑dimensional word embeddings. To keep startup fast and minimize payload size, we preprocess embeddings offline and ship compact, compressed artifacts to the frontend.

### 6.1 Run `Backend/Preprocessing_script.ipynb`

This notebook downloads embeddings (GloVe 2024, FastText wiki‑news, GoogleNews word2vec), converts them to plain text, reduces to 3D (PCA/UMAP), clusters (KMeans/DBSCAN), builds intra‑cluster k‑NN edges, and exports compressed JSON for the frontend.

Warning: downloads are large (0.6–1.6 GB each). Ensure disk space and bandwidth.

Option A — run locally with Jupyter:
```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

pip install jupyter numpy pandas scikit-learn umap-learn tqdm gensim
jupyter notebook Backend/Preprocessing_script.ipynb
```
Then Run All cells.

Option B — run on Google Colab:
- Open `Backend/Preprocessing_script.ipynb` in Colab (upload or open from GitHub)
- (Optional) set runtime to GPU; CPU is fine
- Run All

Outputs (written under `outputs/<ModelName>/`):
- `<model>_full.json.gz` — dictionary of word → original vector
- `<model>_<N>_{pca|umap}_3d.json.gz` — visualization payloads for N ∈ {1000, 5000, 10000}

To use in the app, copy selected `.json.gz` files into `Frontend/public/` and reference their paths in the frontend (or via a registry file as shown below).

---


## 7) Production Tips

- Use gzip (already shown) to keep payloads small
- Consider splitting datasets by domain or frequency bands (e.g., top 5k, 10k)
- Cache static assets via CDN (Vercel does this automatically)
- Prefer stable filenames to maximize cache hits

---


