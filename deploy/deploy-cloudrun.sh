#!/bin/bash
set -e

# Configuration
PROJECT_ID="aetheris-ai"
REGION="us-central1"
SERVICE_NAME="antigravity-gateway"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "Verifying gcloud authentication..."
gcloud auth print-access-token > /dev/null

echo "Building container image using Google Cloud Build..."
gcloud builds submit --tag "$IMAGE_NAME" .

echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="VOXCPM_API_URL=voxcpm-api-url:latest"

echo "Deployment complete!"
