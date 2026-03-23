#!/bin/bash
# ============================================================
# ios-post-sync.sh
# Run after "npx cap add ios" or any iOS platform reset to
# re-apply app icons and Info.plist keys automatically.
# Usage:  bash scripts/ios-post-sync.sh
# ============================================================

set -e

PLIST="ios/App/App/Info.plist"
ICON_SRC="public/app-icon.png"
ICONSET_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"

# ── 1. Check prerequisites ──────────────────────────────────
if [ ! -d "ios/App" ]; then
  echo "❌  ios/App not found. Run 'npx cap add ios' first."
  exit 1
fi

# ── 2. Re-apply Info.plist keys ──────────────────────────────
echo "🔧  Patching Info.plist..."

add_plist_string() {
  local key="$1"
  local value="$2"
  if /usr/libexec/PlistBuddy -c "Print :${key}" "$PLIST" &>/dev/null; then
    /usr/libexec/PlistBuddy -c "Set :${key} '${value}'" "$PLIST"
  else
    /usr/libexec/PlistBuddy -c "Add :${key} string '${value}'" "$PLIST"
  fi
  echo "   ✅  ${key}"
}

add_plist_string "NSSpeechRecognitionUsageDescription" \
  "Journal Inc uses speech recognition to convert your voice entries into text. All processing stays private."

add_plist_string "NSMicrophoneUsageDescription" \
  "Journal Inc needs microphone access to transcribe your voice journal entries."

add_plist_string "CFBundleExecutable" '$(EXECUTABLE_NAME)'

# Ensure UIRequiredDeviceCapabilities contains only 'armv7'
/usr/libexec/PlistBuddy -c "Delete :UIRequiredDeviceCapabilities" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :UIRequiredDeviceCapabilities array" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :UIRequiredDeviceCapabilities:0 string armv7" "$PLIST"
echo "   ✅  UIRequiredDeviceCapabilities"

# ── 3. Re-apply App Icons ───────────────────────────────────
if [ ! -f "$ICON_SRC" ]; then
  echo "⚠️   $ICON_SRC not found — skipping icon generation."
  echo "    Place your 1024x1024 icon at $ICON_SRC and re-run."
  exit 0
fi

if ! command -v sips &>/dev/null; then
  echo "⚠️   'sips' not found (macOS only) — skipping icon generation."
  exit 0
fi

echo "🎨  Generating app icons from ${ICON_SRC}..."

mkdir -p "$ICONSET_DIR"

SIZES=(
  "AppIcon-20x20@1x.png 20"
  "AppIcon-20x20@2x.png 40"
  "AppIcon-20x20@3x.png 60"
  "AppIcon-29x29@1x.png 29"
  "AppIcon-29x29@2x.png 58"
  "AppIcon-29x29@3x.png 87"
  "AppIcon-40x40@1x.png 40"
  "AppIcon-40x40@2x.png 80"
  "AppIcon-40x40@3x.png 120"
  "AppIcon-60x60@2x.png 120"
  "AppIcon-60x60@3x.png 180"
  "AppIcon-76x76@1x.png 76"
  "AppIcon-76x76@2x.png 152"
  "AppIcon-83.5x83.5@2x.png 167"
  "AppIcon-512@2x.png 1024"
)

for entry in "${SIZES[@]}"; do
  name="${entry%% *}"
  size="${entry##* }"
  sips -z "$size" "$size" "$ICON_SRC" --out "${ICONSET_DIR}/${name}" &>/dev/null
  echo "   ✅  ${name} (${size}x${size})"
done

cat > "${ICONSET_DIR}/Contents.json" << 'EOF'
{
  "images": [
    { "size": "20x20",   "idiom": "iphone", "filename": "AppIcon-20x20@2x.png", "scale": "2x" },
    { "size": "20x20",   "idiom": "iphone", "filename": "AppIcon-20x20@3x.png", "scale": "3x" },
    { "size": "29x29",   "idiom": "iphone", "filename": "AppIcon-29x29@2x.png", "scale": "2x" },
    { "size": "29x29",   "idiom": "iphone", "filename": "AppIcon-29x29@3x.png", "scale": "3x" },
    { "size": "40x40",   "idiom": "iphone", "filename": "AppIcon-40x40@2x.png", "scale": "2x" },
    { "size": "40x40",   "idiom": "iphone", "filename": "AppIcon-40x40@3x.png", "scale": "3x" },
    { "size": "60x60",   "idiom": "iphone", "filename": "AppIcon-60x60@2x.png", "scale": "2x" },
    { "size": "60x60",   "idiom": "iphone", "filename": "AppIcon-60x60@3x.png", "scale": "3x" },
    { "size": "20x20",   "idiom": "ipad",   "filename": "AppIcon-20x20@1x.png", "scale": "1x" },
    { "size": "20x20",   "idiom": "ipad",   "filename": "AppIcon-20x20@2x.png", "scale": "2x" },
    { "size": "29x29",   "idiom": "ipad",   "filename": "AppIcon-29x29@1x.png", "scale": "1x" },
    { "size": "29x29",   "idiom": "ipad",   "filename": "AppIcon-29x29@2x.png", "scale": "2x" },
    { "size": "40x40",   "idiom": "ipad",   "filename": "AppIcon-40x40@1x.png", "scale": "1x" },
    { "size": "40x40",   "idiom": "ipad",   "filename": "AppIcon-40x40@2x.png", "scale": "2x" },
    { "size": "76x76",   "idiom": "ipad",   "filename": "AppIcon-76x76@1x.png", "scale": "1x" },
    { "size": "76x76",   "idiom": "ipad",   "filename": "AppIcon-76x76@2x.png", "scale": "2x" },
    { "size": "83.5x83.5","idiom": "ipad",  "filename": "AppIcon-83.5x83.5@2x.png", "scale": "2x" },
    { "size": "1024x1024","idiom": "ios-marketing", "filename": "AppIcon-512@2x.png", "scale": "1x" }
  ],
  "info": { "version": 1, "author": "xcode" }
}
EOF
echo "   ✅  Contents.json"

echo ""
echo "✅  Done! Icons and Info.plist keys are restored."
echo "   Next: cd ios/App && pod install && open App.xcworkspace"