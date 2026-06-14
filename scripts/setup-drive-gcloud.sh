#!/usr/bin/env bash
# Decoded: create the Google API key the Drive Picker needs, via gcloud.
#
# Prerequisite (run once, interactive, only you can do this):
#   gcloud auth login
#
# Then:
#   ./scripts/setup-drive-gcloud.sh YOUR_GCP_PROJECT_ID
set -euo pipefail

PROJECT="${1:-}"
if [ -z "$PROJECT" ]; then
  echo "Usage: ./scripts/setup-drive-gcloud.sh YOUR_GCP_PROJECT_ID"
  exit 1
fi

gcloud config set project "$PROJECT"

echo "Enabling the Drive and Picker APIs..."
gcloud services enable drive.googleapis.com
gcloud services enable picker.googleapis.com 2>/dev/null ||
  echo "Note: if 'picker.googleapis.com' is rejected, enable 'Google Picker API' once in the Console."

echo "Creating an API key for the Picker..."
KEY=$(gcloud services api-keys create \
  --display-name="Decoded Picker key" \
  --format="value(response.keyString)" 2>/dev/null || true)

echo ""
if [ -n "$KEY" ]; then
  echo "Done. Add this to your .env.local:"
  echo ""
  echo "  VITE_GOOGLE_API_KEY=$KEY"
else
  echo "Key created, but the value could not be auto-read. Find it under"
  echo "APIs and Services, Credentials in the Console and add it as VITE_GOOGLE_API_KEY."
fi
echo ""
echo "With Firebase Auth configured (VITE_FIREBASE_*), you do not need an OAuth client."
