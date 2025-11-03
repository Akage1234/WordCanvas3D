# Backend – Preprocessing

This folder contains the data preprocessing workflow used to prepare embedding datasets for the frontend visualizers.

## Files

- `Preprocessing_script.ipynb`: End‑to‑end pipeline to download pretrained embeddings (GloVe 2024, FastText 300d, GoogleNews word2vec), convert formats, reduce to 3D (PCA/UMAP), cluster (KMeans/DBSCAN), build k‑NN edges, and export compressed JSON.

## Quick Start

Option A — Local Jupyter:
```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

pip install jupyter numpy pandas scikit-learn umap-learn tqdm gensim
jupyter notebook Preprocessing_script.ipynb
```
Run all cells in order. Downloads are large (0.6–1.6 GB each). Ensure disk space.

Option B — Google Colab:
- Open `Preprocessing_script.ipynb` in Colab
- (Optional) set GPU runtime (CPU is fine)
- Run All

## Outputs

Artifacts are written under `outputs/<ModelName>/`:
- `<model>_full.json.gz` — word → original vector map
- `<model>_<N>_{pca|umap}_3d.json.gz` — 3D visualization payloads for N ∈ {1000, 5000, 10000}

Copy selected `.json.gz` files into `Frontend/public/` (or `Frontend/public/data/` if you prefer a subfolder) and reference those paths in the app.

## Notes

- KMeans is default; DBSCAN available. Edge count per point scales with dataset size.
- You can change `top_ns` or add models by editing the `filenames` list in the notebook.
- Datasets/models may have their own licenses; include notices as required.


