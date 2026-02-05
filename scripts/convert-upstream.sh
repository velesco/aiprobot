#!/bin/bash
# Script pentru a converti upstream (openclaw) la fork (aipro)
set -e

echo "🔄 Conversia upstream openclaw → aipro"

# ============================================
# PASUL 1: Redenumește DIRECTOARELE
# Procesăm de la TOP la BOTTOM (nu depth-first)
# ============================================
echo "📦 Pas 1: Redenumesc directoarele..."

# Funcție pentru redenumire recursivă (top-down)
rename_dirs_recursive() {
    local base_pattern="$1"
    local replacement="$2"
    
    # Găsește și redenumește de sus în jos
    while IFS= read -r dir; do
        if [ -d "$dir" ]; then
            newdir=$(echo "$dir" | sed "s/${base_pattern}/${replacement}/g")
            if [ "$dir" != "$newdir" ] && [ ! -e "$newdir" ]; then
                mkdir -p "$(dirname "$newdir")"
                mv "$dir" "$newdir"
                echo "  📁 $dir → $newdir"
            fi
        fi
    done < <(find . -type d -name "*${base_pattern}*" \
        -not -path "*/.git/*" -not -path "*/node_modules/*" 2>/dev/null | sort)
}

# 1. Android: ai/openclaw → ai/aipro (top-level first)
if [ -d "./apps/android/app/src/main/java/ai/openclaw" ]; then
    mv "./apps/android/app/src/main/java/ai/openclaw" "./apps/android/app/src/main/java/ai/aipro"
    echo "  📁 apps/android/.../ai/openclaw → ai/aipro (main)"
fi
if [ -d "./apps/android/app/src/test/java/ai/openclaw" ]; then
    mv "./apps/android/app/src/test/java/ai/openclaw" "./apps/android/app/src/test/java/ai/aipro"
    echo "  📁 apps/android/.../ai/openclaw → ai/aipro (test)"
fi

# 2. macOS/iOS: OpenClaw* → AIPro* (top-level first)
for dir in ./apps/macos/Sources/OpenClaw ./apps/macos/Sources/OpenClawDiscovery \
           ./apps/macos/Sources/OpenClawIPC ./apps/macos/Sources/OpenClawMacCLI \
           ./apps/macos/Sources/OpenClawProtocol ./apps/macos/Tests/OpenClawIPCTests \
           ./apps/shared/OpenClawKit; do
    if [ -d "$dir" ]; then
        newdir=$(echo "$dir" | sed 's/OpenClaw/AIPro/g')
        mv "$dir" "$newdir"
        echo "  📁 $dir → $newdir"
    fi
done

# 3. Nested OpenClaw dirs (după ce părinții sunt redenumiti)
find . -type d -name "*OpenClaw*" -not -path "*/.git/*" -not -path "*/node_modules/*" 2>/dev/null | sort | while read -r dir; do
    if [ -d "$dir" ]; then
        newdir=$(echo "$dir" | sed 's/OpenClaw/AIPro/g')
        if [ "$dir" != "$newdir" ] && [ ! -e "$newdir" ]; then
            mv "$dir" "$newdir" 2>/dev/null && echo "  📁 $dir → $newdir" || true
        fi
    fi
done

# 4. packages/clawdbot → packages/aipro
if [ -d "packages/clawdbot" ] && [ ! -d "packages/aipro" ]; then
    mv "packages/clawdbot" "packages/aipro"
    echo "  📁 packages/clawdbot → packages/aipro"
fi

# 5. packages/moltbot → șterge/merge
if [ -d "packages/moltbot" ]; then
    rm -rf packages/moltbot
    echo "  📁 packages/moltbot → removed (redundant)"
fi

# 6. Alte directoare rămase
for pattern in openclaw clawdbot moltbot digiboss; do
    find . -type d -iname "*${pattern}*" \
        -not -path "*/.git/*" -not -path "*/node_modules/*" 2>/dev/null | sort | while read -r dir; do
        if [ -d "$dir" ]; then
            newdir=$(echo "$dir" | sed -e "s/${pattern}/aipro/gi")
            if [ "$dir" != "$newdir" ] && [ ! -e "$newdir" ]; then
                mv "$dir" "$newdir" 2>/dev/null && echo "  📁 $dir → $newdir" || true
            fi
        fi
    done
done

# ============================================
# PASUL 2: Redenumește FIȘIERELE
# ============================================
echo "📄 Pas 2: Redenumesc fișierele..."

# openclaw.plugin.json → aipro.plugin.json
find . -type f -name "openclaw.plugin.json" -not -path "*/.git/*" 2>/dev/null | while read -r file; do
    newfile="${file/openclaw.plugin.json/aipro.plugin.json}"
    mv "$file" "$newfile"
    echo "  📄 $file → $newfile"
done

# Alte fișiere
for pattern in openclaw clawdbot moltbot digiboss OpenClaw; do
    find . -type f -name "*${pattern}*" \
        -not -path "*/.git/*" -not -path "*/node_modules/*" 2>/dev/null | while read -r file; do
        newfile=$(echo "$file" | sed -e "s/openclaw/aipro/gi" -e "s/OpenClaw/AIPro/g" \
            -e "s/clawdbot/aipro/gi" -e "s/moltbot/aipro/gi" -e "s/digiboss/aipro/gi")
        if [ "$file" != "$newfile" ] && [ ! -e "$newfile" ]; then
            mv "$file" "$newfile" 2>/dev/null && echo "  📄 $file → $newfile" || true
        fi
    done
done

# ============================================
# PASUL 3: Înlocuiește CONȚINUTUL
# ============================================
echo "📝 Pas 3: Convertesc conținutul fișierelor..."

find . -type f \
    -not -path "*/.git/*" \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.mjs" \
       -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" \
       -o -name "*.md" -o -name "*.mdx" -o -name "*.txt" \
       -o -name "*.sh" -o -name "*.swift" -o -name "*.kt" \
       -o -name "*.java" -o -name "*.gradle*" -o -name "*.xml" \
       -o -name "*.plist" -o -name "*.html" -o -name "*.css" \
       -o -name "Dockerfile*" -o -name "*.env*" -o -name "*.resolved" \
       -o -name "*.xcscheme" -o -name "*.pbxproj" \) \
    -exec sed -i \
        -e 's|docs\.openclaw\.ai|docs.aipro.ro|g' \
        -e 's|openclaw\.ai|aipro.ro|g' \
        -e 's|github\.com/openclaw/openclaw|github.com/aipro/aipro|g' \
        -e 's|discord\.com/invite/openclaw|discord.com/invite/aipro|g' \
        -e 's|ai\.openclaw\.android|ai.aipro.android|g' \
        -e 's|OpenClawKit|AiproKit|g' \
        -e 's|OpenClawProtocol|AiproProtocol|g' \
        -e 's|OpenClawIPC|AiproIPC|g' \
        -e 's|OpenClawDiscovery|AiproDiscovery|g' \
        -e 's|OpenClawMacCLI|AiproMacCLI|g' \
        -e 's|OpenClawChatUI|AiproChatUI|g' \
        -e 's|OpenClawIPCTests|AiproIPCTests|g' \
        -e 's|OpenClawKitTests|AiproKitTests|g' \
        -e 's|openclaw-gateway|aipro-gateway|g' \
        -e 's|openclaw-mac|aipro-mac|g' \
        -e 's|openclaw-cli|aipro-cli|g' \
        -e 's|CLAWDBOT_|AIPRO_|g' \
        -e 's|MOLTBOT_|AIPRO_|g' \
        -e 's|DIGIBOSS_|AIPRO_|g' \
        -e 's|OPENCLAW_|AIPRO_|g' \
        -e 's|OpenClaw|AIPro|g' \
        -e 's|clawdbot|aipro|g' \
        -e 's|Clawdbot|AIPro|g' \
        -e 's|CLAWDBOT|AIPRO|g' \
        -e 's|moltbot|aipro|g' \
        -e 's|Moltbot|AIPro|g' \
        -e 's|MOLTBOT|AIPRO|g' \
        -e 's|digiboss|aipro|g' \
        -e 's|Digiboss|AIPro|g' \
        -e 's|DIGIBOSS|AIPRO|g' \
        -e 's|~/\.openclaw|~/.aipro|g' \
        -e 's|/\.openclaw|/.aipro|g' \
        -e 's|OPENCLAW|AIPRO|g' \
        -e 's|openclaw|aipro|g' \
        {} \; 2>/dev/null

echo ""
echo "✅ Conversie completă!"
