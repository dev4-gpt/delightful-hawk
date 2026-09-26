#!/bin/bash
# ==============================================================================
# Aetheris World Engine — Automated arXiv & Preprint Publication Script
# ==============================================================================
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PAPER_DIR="$REPO_ROOT/paper"
OUTPUT_TAR="$PAPER_DIR/aetheris_arxiv_submission.tar.gz"

echo "======================================================================"
echo "  AETHERIS WORLD ENGINE — AUTOMATED ARXIV PREPRINT PACKAGER"
echo "======================================================================"
echo "Working Directory: $PAPER_DIR"

cd "$PAPER_DIR"

echo "Step 1: Compiling LaTeX Manuscript (pdflatex)..."
pdflatex -interaction=nonstopmode main.tex > /dev/null

echo "Step 2: Processing BibTeX Citations (bibtex)..."
bibtex main > /dev/null

echo "Step 3: Resolving Cross-References (pdflatex pass 2 & 3)..."
pdflatex -interaction=nonstopmode main.tex > /dev/null
pdflatex -interaction=nonstopmode main.tex > /dev/null

echo "Step 4: Verifying Compiled PDF..."
if [ -f "main.pdf" ]; then
    cp main.pdf aetheris_world_engine_whitepaper.pdf
    PDF_SIZE=$(du -h aetheris_world_engine_whitepaper.pdf | cut -f1)
    echo "  [OK] Camera-Ready PDF Generated: $PDF_SIZE (paper/aetheris_world_engine_whitepaper.pdf)"
else
    echo "  [ERROR] main.pdf was not generated!"
    exit 1
fi

echo "Step 5: Packaging arXiv Ingest Bundle (.tar.gz)..."
tar -czvf "$OUTPUT_TAR" main.tex main.bbl references.bib > /dev/null

echo "Step 6: Cleaning Auxiliary Build Artifacts..."
rm -f main.aux main.blg main.log main.out main.brf main.toc

echo "======================================================================"
echo "  [SUCCESS] arXiv SUBMISSION BUNDLE READY"
echo "======================================================================"
echo "Bundle File: $OUTPUT_TAR"
echo "Bundle Size: $(du -h "$OUTPUT_TAR" | cut -f1)"
echo ""
echo "TO SUBMIT TO ARXIV:"
echo "1. Go to: https://arxiv.org/submit"
echo "2. Select Primary Category: Computer Vision and Pattern Recognition (cs.CV)"
echo "3. Add Cross-Lists: Artificial Intelligence (cs.AI), Graphics (cs.GR)"
echo "4. Upload File: $OUTPUT_TAR"
echo "5. Enter Title: Aetheris World Engine: Physics-Grounded Generative Cinema via 3D Photorealistic Geometries and Multi-Agent Orchestration"
echo "6. Submit! You will receive your official arXiv ID and DOI within 24-48 hours."
echo "======================================================================"
