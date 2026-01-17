#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/public/js/dashboard/app-inline.js"
MOCK="$ROOT/public/js/dashboard/mock-api.js"

python3 - <<'PY'
from __future__ import annotations
import re
from pathlib import Path

app = Path("/Users/projetsjsl/Documents/GitHub/GOB/public/js/dashboard/app-inline.js")
mock = Path("/Users/projetsjsl/Documents/GitHub/GOB/public/js/dashboard/mock-api.js")


def apply_regex(text: str, pattern: str, repl: str, flags=0) -> tuple[str, bool]:
    new_text, count = re.subn(pattern, repl, text, flags=flags)
    return new_text, count > 0


def ensure_after(text: str, anchor: str, insert: str) -> tuple[str, bool]:
    if insert in text:
        return text, False
    idx = text.find(anchor)
    if idx == -1:
        return text, False
    insert_at = idx + len(anchor)
    return text[:insert_at] + insert + text[insert_at:], True


# ---- mock-api.js tweak ----
if mock.exists():
    m = mock.read_text(encoding="utf-8")
    if "/api/marketdata" not in m or "endpoint=" not in m:
        pattern = r"// Rate limit logging\n\s*const endpoint = urlStr.split\('\?'\)\[0\]; // Remove query params for counting"
        repl = (
            "// Rate limit logging - use full URL for marketdata (different endpoints are legitimate)\n"
            "        // For other APIs, strip query params to detect true duplicates\n"
            "        let endpoint = urlStr.split('?')[0];\n"
            "        if (urlStr.includes('/api/marketdata')) {\n"
            "            // Include the endpoint param to distinguish quote vs fundamentals vs intraday\n"
            "            const match = urlStr.match(/endpoint=([^&]+)/);\n"
            "            if (match) endpoint = `/api/marketdata?endpoint=${match[1]}`;\n"
            "        }"
        )
        m2, changed = apply_regex(m, pattern, repl, flags=re.MULTILINE)
        if changed:
            mock.write_text(m2, encoding="utf-8")


# ---- app-inline.js fixes ----
if app.exists():
    s = app.read_text(encoding="utf-8")

    # Remove URL sync blocks if present
    s, _ = apply_regex(
        s,
        r"\n\s*//\s*FIX BUG-021: Synchroniser activeTab.*?\n\s*\}, \[\]\);\n",
        "\n",
        flags=re.DOTALL,
    )
    s, _ = apply_regex(
        s,
        r"\n\s*//\s*FIX BUG-021: Ecouter les changements d'URL.*?\n\s*\}, \[activeTab\]\);\n",
        "\n",
        flags=re.DOTALL,
    )

    # Force default tab to marches-global (no URL/state/localStorage)
    if "DEFAULT_ACTIVE_TAB" not in s:
        s, _ = apply_regex(
            s,
            r"(// PERF #16 FIX: State persistence pour eviter rechargement complet\n)",
            r"\1        const DEFAULT_ACTIVE_TAB = 'marches-global';\n",
        )
    s, _ = apply_regex(
        s,
        r"const\s+\[activeTab,\s*setActiveTab\]\s*=\s*useState\(\(\)\s*=>\s*\{.*?\}\);\s*// Onglet par defaut: Marches Globaux",
        "const [activeTab, setActiveTab] = useState(DEFAULT_ACTIVE_TAB); // Onglet par defaut: Marches Globaux",
        flags=re.DOTALL,
    )

    # Ensure DATA_HEAVY_TABS exists
    if "DATA_HEAVY_TABS" not in s:
        s, _ = apply_regex(
            s,
            r"const DEFAULT_ACTIVE_TAB = 'marches-global';\n",
            "const DEFAULT_ACTIVE_TAB = 'marches-global';\n"
            "        const DATA_HEAVY_TABS = new Set([\n"
            "            'nouvelles',\n"
            "            'nouvelles-main',\n"
            "            'stocks-news',\n"
            "            'jlab-terminal',\n"
            "            'jlab-advanced',\n"
            "            'advanced-analysis',\n"
            "            'emma-terminal',\n"
            "            'terminal-emmaia'\n"
            "        ]);\n",
        )

    # Ensure dataPreloadStartedRef exists
    if "dataPreloadStartedRef" not in s:
        s, _ = apply_regex(
            s,
            r"const \[activeTab, setActiveTab\] = useState\(DEFAULT_ACTIVE_TAB\);\n",
            "const [activeTab, setActiveTab] = useState(DEFAULT_ACTIVE_TAB);\n"
            "        const dataPreloadStartedRef = useRef(false);\n",
        )

    # Remove persistence save effect
    s, _ = apply_regex(
        s,
        r"\n\s*// PERF #16 FIX: Sauvegarder activeTab quand il change\n\s*useEffect\(\(\) => \{.*?\}\, \[activeTab\]\);\n",
        "\n        // PERF #16 FIX: Sauvegarder activeTab quand il change\n        // Desactive pour forcer l'ouverture sur Marches et eviter les tabs lourds au chargement.\n",
        flags=re.DOTALL,
    )

    # Ensure cleanup of persisted tab state
    if "localStorage.removeItem('gob-active-tab')" not in s:
        cleanup_block = (
            "\n        // Nettoyer l'ancien etat persiste pour eviter de reutiliser des tabs lourds\n"
            "        useEffect(() => {\n"
            "            if (typeof window !== 'undefined') {\n"
            "                if (window.clearTabState) {\n"
            "                    window.clearTabState('activeTab');\n"
            "                }\n"
            "                try {\n"
            "                    localStorage.removeItem('gob-active-tab');\n"
            "                } catch (e) {\n"
            "                    console.warn('[StatePersistence] Error clearing activeTab from localStorage:', e);\n"
            "                }\n"
            "            }\n"
            "        }, []);\n"
        )
        s, _ = apply_regex(
            s,
            r"const \[activeTab, setActiveTab\] = useState\(DEFAULT_ACTIVE_TAB\);\n(?:\s*const dataPreloadStartedRef = useRef\(false\);\n)?",
            lambda m: m.group(0) + cleanup_block,
        )

    # Remove initial heavy preload from initial load effect if present
    s, _ = apply_regex(
        s,
        r"\n\s*// Charger les tickers et nouvelles pour l'onglet d'accueil .*?\n\s*\}\);\n\s*\}\)\.catch\(error => \{\n\s*console\.error\(' Erreur lors du chargement initial:', error\);\n\s*\}\);\n",
        "\n",
        flags=re.DOTALL,
    )

    # Ensure data preload effect for heavy tabs
    if "dataPreloadStartedRef.current" not in s:
        s, _ = apply_regex(
            s,
            r"// Dependance vide = une seule fois au montage\n",
            "// Dependance vide = une seule fois au montage\n\n"
            "        // Charger les tickers/news uniquement quand l'utilisateur ouvre un tab lourd\n"
            "        useEffect(() => {\n"
            "            if (dataPreloadStartedRef.current) return;\n"
            "            if (!DATA_HEAVY_TABS.has(activeTab)) return;\n\n"
            "            dataPreloadStartedRef.current = true;\n"
            "            console.log(' Chargement initial des donnees pour tab lourd...');\n"
            "            loadTickersFromSupabase().then(() => {\n"
            "                // Une fois les tickers charges, charger les nouvelles\n"
            "                fetchNews();\n"
            "                // Le chargement des stocks sera declenche automatiquement par le useEffect qui surveille tickers.length\n"
            "                // Les news par ticker seront chargees automatiquement par le useEffect qui surveille tickers.length\n"
            "            }).catch(error => {\n"
            "                console.error(' Erreur lors du chargement initial:', error);\n"
            "            });\n"
            "        }, [activeTab]);\n",
        )

    def guard_effect(marker: str):
        pattern = re.escape(marker) + r"\n\s*useEffect\(\(\) => \{"
        def repl(m):
            block = m.group(0)
            return block + "\n            if (!DATA_HEAVY_TABS.has(activeTab)) return;"
        return apply_regex(s, pattern, repl, flags=re.MULTILINE)

    # Guard heavy background effects
    for marker in [
        "// Charger les news par ticker quand les tickers changent ET que les news generales sont disponibles",
        "// Charger automatiquement les donnees de stocks des que les tickers sont disponibles",
        "// Chargement automatique des tickers et nouvelles (en arriere-plan, meme si l'onglet n'est pas actif)",
        "// Rafraichir les donnees tickers lors de la navigation si elles sont anciennes",
        "// Charger les donnees de stocks une fois que les tickers sont disponibles (methode batch optimisee)",
    ]:
        if f"if (!DATA_HEAVY_TABS.has(activeTab)) return;" not in s:
            s, _ = guard_effect(marker)

    # Add log throttle to avoid console spam freezes
    if "window.__GOB_LOG_THROTTLE__" not in s:
        throttle_block = (
            "\n// Throttle console.log to prevent UI freezes from log storms (enable with window.DEBUG_DASHBOARD = true)\n"
            "if (typeof window !== 'undefined' && !window.DEBUG_DASHBOARD && !window.__GOB_LOG_THROTTLE__) {\n"
            "    window.__GOB_LOG_THROTTLE__ = true;\n"
            "    const LOG_WINDOW_MS = 5000;\n"
            "    const LOG_MAX = 200;\n"
            "    let logCount = 0;\n"
            "    const originalLog = console.log.bind(console);\n"
            "    setInterval(() => {\n"
            "        logCount = 0;\n"
            "    }, LOG_WINDOW_MS);\n"
            "    console.log = (...args) => {\n"
            "        if (logCount < LOG_MAX) {\n"
            "            logCount += 1;\n"
            "            originalLog(...args);\n"
            "        }\n"
            "    };\n"
            "}\n"
        )
        s, _ = apply_regex(
            s,
            r"(\\* Keeping this block at the top as a reminder to reduce future syntax regressions\\.\\n\\*/)\\n",
            r\"\\1\\n\" + throttle_block,
            flags=re.MULTILINE,
        )

    app.write_text(s, encoding="utf-8")

PY

printf "Done.\n"
