# Aetheris World Engine — Academic Research Preprint & LaTeX Source

This directory contains the complete LaTeX source, BibTeX database, and compiled camera-ready PDF for the **Aetheris World Engine** research paper.

## 📄 Document Information
- **Title**: Aetheris World Engine: Physics-Grounded Generative Cinema via 3D Photorealistic Geometries and Multi-Agent Orchestration
- **Authors**: Aryaman Dev (Aetheris AI Corporation), Bilawal Sidhu (God's Eye View Foundation)
- **Target Venues**: CVPR / SIGGRAPH / NeurIPS Track on Generative World Models & Video Synthesis
- **Preprint Categories**: `cs.CV` (Computer Vision), `cs.AI` (Artificial Intelligence), `cs.GR` (Graphics)

## 📁 Files
- `main.tex`: Full two-column conference manuscript in standard LaTeX.
- `references.bib`: BibTeX bibliography with 16 verified, authentic peer-reviewed publications and DOIs.
- `main.pdf`: Compiled 7-page publication-grade PDF.
- `Makefile`: Automated build script (`make`, `make clean`).

## 🛠️ Building from Source
Ensure you have a modern TeX distribution installed (TeX Live 2024 or MacTeX).

```bash
cd paper
pdflatex -interaction=nonstopmode main.tex
bibtex main
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex
```

Or using `latexmk`:
```bash
latexmk -pdf main.tex
```

## 🌐 Submitting to arXiv
1. Archive `main.tex`, `main.bbl`, and `references.bib` into a `.tar.gz` bundle:
   ```bash
   tar -czvf aetheris_arxiv_submission.tar.gz main.tex main.bbl references.bib
   ```
2. Upload directly to [arXiv.org](https://arxiv.org/submit) under primary category `cs.CV` with cross-lists `cs.AI` and `cs.GR`.
