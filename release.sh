#!/bin/bash
set -e

CURRENT=$(grep '"version"' manifest.json | sed 's/.*"\([0-9.]*\)".*/\1/')
echo "Current version: $CURRENT"
read -p "New version: " VERSION

if [ -z "$VERSION" ]; then
  echo "No version provided, aborting."
  exit 1
fi

# Update manifest.json
sed -i '' "s/\"version\": \"$CURRENT\"/\"version\": \"$VERSION\"/" manifest.json
echo "Updated manifest.json to v${VERSION}"

# Build zip
ZIP_NAME="skill-scraper-v${VERSION}.zip"
rm -f "$ZIP_NAME"

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

# Commit and push
git add manifest.json
git commit -m "Release v${VERSION}"
git push

echo ""
echo "✓ Pushed v${VERSION} to GitHub"
echo ""
echo "Next steps:"
echo "  1. Go to https://chrome.google.com/webstore/devconsole"
echo "  2. Select Skill Scraper → Package → Upload new package"
echo "  3. Upload $ZIP_NAME"
