# 🏃 RAPPORT MARATHON AUDIT EXHAUSTIF

**Date:** 2026-01-11
**Durée:** undefined
**URL testée:** https://gob-4knmhj42s-projetsjsls-projects.vercel.app

---

## 📊 RÉSUMÉ EXÉCUTIF

| Métrique | Valeur |
|----------|--------|
| **Total Bugs** | 4 |
| - Critiques | 0 |
| - Haute priorité | 2 |
| - Moyenne priorité | 2 |
| - Basse priorité | 0 |
| **Erreurs console** | 4 |
| **Warnings** | 9 |
| **Erreurs réseau** | 12 |
| **Screenshots** | 7 |

---

## 🐛 BUGS DÉTAILLÉS

### HIGH PRIORITY (2)

#### BUG-1: Error detected on Login Page

**Sévérité:** high
**Localisation:** /login.html
**Description:** Page content suggests an error state. Body text length: 7182

**Étapes pour reproduire:**
1. Navigate to https://gob-4knmhj42s-projetsjsls-projects.vercel.app/login.html
1. Check page content

**Screenshot:** `/Users/projetsjsl/Documents/GitHub/GOB/bug-screenshots/1768144884960-error-detected-login-page.png`

---

#### BUG-4: Tab test failed: Nouvelles

**Sévérité:** high
**Localisation:** beta-combined-dashboard.html#nouvelles
**Description:** Error testing tab Nouvelles: locator.count: Target page, context or browser has been closed

**Étapes pour reproduire:**
1. Click tab Nouvelles
1. Error: locator.count: Target page, context or browser has been closed

**Screenshot:** `/Users/projetsjsl/Documents/GitHub/GOB/bug-screenshots/1768221712471-tab-error-nouvelles.png`

---

### MEDIUM PRIORITY (2)

#### BUG-2: Tab not found: Stocks & News

**Sévérité:** medium
**Localisation:** beta-combined-dashboard.html#stocks-news
**Description:** Could not find navigation element for tab: Stocks & News (stocks-news)

**Étapes pour reproduire:**
1. Navigate to dashboard
1. Look for tab: Stocks & News

**Screenshot:** `/Users/projetsjsl/Documents/GitHub/GOB/bug-screenshots/1768144902616-tab-missing-stocks-news.png`

---

#### BUG-3: Tab not found: Finance Pro

**Sévérité:** medium
**Localisation:** beta-combined-dashboard.html#finance-pro
**Description:** Could not find navigation element for tab: Finance Pro (finance-pro)

**Étapes pour reproduire:**
1. Navigate to dashboard
1. Look for tab: Finance Pro

**Screenshot:** `/Users/projetsjsl/Documents/GitHub/GOB/bug-screenshots/1768144903859-tab-missing-finance-pro.png`

---

## ❌ ERREURS CONSOLE

1. **[Login Page]** [BABEL] Note: The code generator has deoptimised the styling of /https:/gob-4knmhj42s-projetsjsls-projects.vercel.app/js/dashboard/app-inline.js?v=3.2 as it exceeds the max of 500KB.
2. **[Beta Dashboard]** [BABEL] Note: The code generator has deoptimised the styling of /https:/gob-4knmhj42s-projetsjsls-projects.vercel.app/js/dashboard/app-inline.js?v=3.2 as it exceeds the max of 500KB.
3. **[Login Page]** Failed to read the 'localStorage' property from 'Window': The document is sandboxed and lacks the 'allow-same-origin' flag.
4. **[Beta Dashboard]** Failed to read the 'localStorage' property from 'Window': The document is sandboxed and lacks the 'allow-same-origin' flag.

## 🌐 ERREURS RÉSEAU

1. **[Login Page]** https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900 - net::ERR_BLOCKED_BY_ORB
2. **[Beta Dashboard]** https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900 - net::ERR_BLOCKED_BY_ORB
3. **[Login Page]** https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900& - net::ERR_BLOCKED_BY_ORB
4. **[Beta Dashboard]** https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900& - net::ERR_BLOCKED_BY_ORB
5. **[Login Page]** https://widget-sheriff.tradingview-widget.com/sheriff/api/v1/rules/search?origin - net::ERR_ABORTED
6. **[Beta Dashboard]** https://widget-sheriff.tradingview-widget.com/sheriff/api/v1/rules/search?origin - net::ERR_ABORTED
7. **[Login Page]** https://widget-sheriff.tradingview-widget.com/sheriff/api/v1/rules/search?origin - net::ERR_ABORTED
8. **[Beta Dashboard]** https://widget-sheriff.tradingview-widget.com/sheriff/api/v1/rules/search?origin - net::ERR_ABORTED
9. **[Login Page]** https://gob-4knmhj42s-projetsjsls-projects.vercel.app/finvox-build/index.html - net::ERR_ABORTED
10. **[Beta Dashboard]** https://gob-4knmhj42s-projetsjsls-projects.vercel.app/finvox-build/index.html - net::ERR_ABORTED
11. **[Login Page]** https://gob-4knmhj42s-projetsjsls-projects.vercel.app/emmaia-build/index.html - net::ERR_ABORTED
12. **[Beta Dashboard]** https://gob-4knmhj42s-projetsjsls-projects.vercel.app/emmaia-build/index.html - net::ERR_ABORTED

## 📸 SCREENSHOTS

Total: 7 screenshots capturés

Dossier: `bug-screenshots/`

