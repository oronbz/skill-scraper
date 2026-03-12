#!/bin/bash
set -e

# Extract current version from manifest.json
VERSION=$(grep '"version"' manifest.json | sed 's/.*"\([0-9.]*\)".*/\1/')
ZIP_NAME="skill-scraper-v${VERSION}.zip"

echo "Building Skill Scraper v${VERSION}..."

# Clean previous builds
rm -f "$ZIP_NAME"

# Create zip excluding dev files
zip -r "$ZIP_NAME" . \
  -x ".git/*" \
  -x ".claude/*" \
  -x ".playwright-mcp/*" \
  -x ".DS_Store" \
  -x "graphics/*" \
  -x "STORE_LISTING.md" \
  -x ".gitignore" \
  -x "*.html" \
  -x "release.sh" \
  -x "skill-scraper-v*.zip"

echo ""
echo "✓ Built $ZIP_NAME ($(du -h "$ZIP_NAME" | cut -f1))"
echo ""
echo "Next steps:"
echo "  1. Go to https://chrome.google.com/webstore/devconsole"
echo "  2. Select Skill Scraper → Package → Upload new package"
echo "  3. Upload $ZIP_NAME"
