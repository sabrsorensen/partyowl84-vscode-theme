#!/usr/bin/env bash
set -euo pipefail

# Party Owl '84 Theme Injection Script
# This script patches VS Code to include the Party Owl '84 theme as a built-in feature

echo "=== PARTY OWL 84 THEME INJECTION START ==="

# Create a writable copy of the extension files for patching
EXTENSION_DIR="/tmp/party-owl-extension-patched"
rm -rf "$EXTENSION_DIR"
cp -r "@PARTY_OWL_EXTENSION@/share/vscode/extensions/@EXTENSION_NAME@" "$EXTENSION_DIR"
chmod -R u+w "$EXTENSION_DIR"
cd "$EXTENSION_DIR"

# Apply theme_template.js patch if it exists
if [[ -f "@PATCHES_DIR@/theme_template.js.patch" ]]; then
  echo "Applying theme_template.js patch..."
  @PATCH_BIN@ -p1 < "@PATCHES_DIR@/theme_template.js.patch"
fi

# Apply extension.js patch if it exists
if [[ -f "@PATCHES_DIR@/extension.js.patch" ]]; then
  echo "Applying extension.js patch..."
  @PATCH_BIN@ -p1 < "@PATCHES_DIR@/extension.js.patch"
fi
cd /build

echo "=== PATCHES APPLIED, EXTENSION FILES READY ==="

# Debug: Show current directory and VS Code structure
VSCODE_APP="$out/lib/vscode/resources/app"
VSCODE_OUT="$VSCODE_APP/out/vs/code"

echo "Looking for VS Code files in: $VSCODE_APP"

# Check if the expected directories exist
if [[ ! -d "$VSCODE_APP" ]]; then
  echo "ERROR: VS Code app directory not found at $VSCODE_APP"
  exit 1
fi

ELECTRON_BASES=("electron-browser" "electron-sandbox")
WORKBENCH_FILES=("workbench.esm.html" "workbench.html")

THEME_APPLIED=false
NOT_FOUND_FILES=()

for ELECTRON_BASE in "${ELECTRON_BASES[@]}"; do
  for WORKBENCH_FILE in "${WORKBENCH_FILES[@]}"; do
    WORKBENCH_PATH="$VSCODE_OUT/$ELECTRON_BASE/workbench"
    HTML_FILE="$WORKBENCH_PATH/$WORKBENCH_FILE"

    if [[ -f "$HTML_FILE" ]]; then
      echo "✓ Found workbench file: $HTML_FILE"

      # Make workbench directory writable
      chmod -R u+w "$WORKBENCH_PATH"

      # Create theme JavaScript
      TMP_THEME_JS="$TMPDIR/partylights_temp.js"
      cp "$EXTENSION_DIR/src/js/theme_template.js" "$TMP_THEME_JS"
      chmod u+w "$TMP_THEME_JS"

      # Set default brightness (45% = 0.45 * 255 = 115 hex = 73)
      sed -i 's/\[DISABLE_GLOW\]/false/g' "$TMP_THEME_JS"
      sed -i 's/\[NEON_BRIGHTNESS\]/73/g' "$TMP_THEME_JS"

      # Inject CSS directly if needed
      CSS_FILE="$EXTENSION_DIR/src/css/editor_chrome.css"
      # If theme_template.js expects [CHROME_STYLES], replace it with the contents of editor_chrome.css
      if grep -q '\[CHROME_STYLES\]' "$TMP_THEME_JS"; then
        CHROME_STYLES=$(cat "$CSS_FILE" | tr -d '\n' | sed 's/[&/]/\\&/g')
        sed -i "s|\[CHROME_STYLES\]|$CHROME_STYLES|g" "$TMP_THEME_JS"
      fi

      # Copy the completed file to the final location
      cp "$TMP_THEME_JS" "$WORKBENCH_PATH/partylights.js"
      echo "✓ Installed theme JavaScript: $WORKBENCH_PATH/partylights.js"

      # Clean up temporary file
      rm -f "$TMP_THEME_JS"

      # Inject script tag into HTML
      if grep -q "partylights.js" "$HTML_FILE"; then
        echo "⚠ Script already exists in $HTML_FILE"
      else
        sed -i 's|</html>|\t<!-- PARTY OWL 84 --><script src="partylights.js"></script><!-- PARTY OWL 84 -->\n</html>|g' "$HTML_FILE"
        echo "✓ Injected script tag into $HTML_FILE"
      fi

      THEME_APPLIED=true
    else
      NOT_FOUND_FILES+=("$HTML_FILE")
    fi
  done
done

if [[ "$THEME_APPLIED" != "true" ]]; then
  echo "✗ No suitable workbench files found. Tried:"
  for file in "${NOT_FOUND_FILES[@]}"; do
    echo "  - $file"
  done
  echo "ERROR: No workbench files found! Theme JavaScript not installed."
  echo "Searching entire VS Code directory for workbench files:"
  find $VSCODE_APP -name "*workbench*" -type f 2>/dev/null | head -10
fi

# Install the theme JSON file
echo
echo "=== INSTALLING THEME FILES ==="
THEMES_DIR="$VSCODE_APP/extensions/theme-defaults/themes"
mkdir -p "$THEMES_DIR"
cp "$EXTENSION_DIR/themes/Night Owl-color-theme.json" "$THEMES_DIR/party-owl-84-theme.json"
echo "✓ Installed theme file: $THEMES_DIR/party-owl-84-theme.json"

# Update the default themes manifest
THEMES_MANIFEST="$VSCODE_APP/extensions/theme-defaults/package.json"
if [[ -f "$THEMES_MANIFEST" ]]; then
  echo "✓ Processing themes manifest: $THEMES_MANIFEST"

  # Backup original
  cp "$THEMES_MANIFEST" "$THEMES_MANIFEST.backup"

  # Check if our theme is already registered
  if grep -q "Party Owl 84" "$THEMES_MANIFEST" 2>/dev/null; then
    echo "⚠ Theme already registered in manifest"
  else
    @JQ_BIN@ --indent 2 '.contributes.themes += [{
      "id": "Party Owl 84",
      "label": "Party Owl 84",
      "uiTheme": "vs-dark",
      "path": "./themes/party-owl-84-theme.json"
    }]' "$THEMES_MANIFEST" > "$THEMES_MANIFEST.tmp" && {
      mv "$THEMES_MANIFEST.tmp" "$THEMES_MANIFEST"
      echo "✓ Theme registered in manifest"
    } || {
      echo "ERROR: Failed to update themes manifest"
      mv "$THEMES_MANIFEST.backup" "$THEMES_MANIFEST"
    }
  fi
fi

echo
echo "=== PARTY OWL 84 THEME INJECTION COMPLETE ==="
echo "Party Owl '84 theme has been baked into VS Code"