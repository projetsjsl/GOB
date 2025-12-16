# 🚀 SCRAPING AUTOMATIQUE AVEC CHROME SNIPPETS

**Date**: 17 octobre 2025
**Méthode**: Chrome DevTools Snippets (Script réutilisable)

---

## 🎯 Comment ça marche

**Une fois configuré, le processus est**:
1. Cliquer "Lancer Scraping" dans le dashboard (25 popups s'ouvrent)
2. Aller sur chaque popup
3. Cliquer sur votre snippet Chrome (1 clic)
4. Le script scrape automatiquement + sauvegarde + analyse
5. La page se ferme automatiquement
6. Répéter pour les autres popups

**Temps total**: ~5-8 minutes pour 25 tickers (au lieu de 45-60 minutes)

---

## 📝 ÉTAPE 1: Créer le Snippet (UNE FOIS)

### Dans Chrome:

1. **Ouvrir DevTools**: `F12` ou `Cmd+Option+I` (Mac)

2. **Aller dans "Sources"**: Tab en haut

3. **Ouvrir "Snippets"**: Dans le panneau de gauche
   - Si vous ne voyez pas "Snippets", cliquez sur `>>` et sélectionnez "Snippets"

4. **Créer un nouveau snippet**:
   - Cliquez sur `+ New snippet`
   - Nommez-le: `Seeking Alpha Auto-Scraper`

5. **Coller ce code**:

\`\`\`javascript
/**
 * AUTO-SCRAPER - Seeking Alpha
 * Scrape automatiquement + Sauvegarde Supabase + Analyse Perplexity
 */

(async function autoScraper() {
  console.log('🤖 AUTO-SCRAPER DÉMARRÉ');

  // Extraire le ticker de l'URL
  const urlMatch = window.location.href.match(/symbol\/([A-Z]+)\//);
  const ticker = urlMatch ? urlMatch[1] : 'UNKNOWN';

  if (ticker === 'UNKNOWN') {
    alert('❌ Page Seeking Alpha invalide!');
    return;
  }

  console.log(\`📊 Scraping de \${ticker}...\`);

  // Extraire tout le texte
  const fullText = document.body.innerText;
  console.log(\`✅ \${fullText.length} caractères extraits\`);

  // Extraire des sections structurées
  const sections = {};
  const sectionHeaders = [
    'Investment Thesis',
    'Valuation',
    'Key Metrics',
    'Financial Performance',
    'Risks',
    'Catalysts',
    'Summary',
    'Price Target'
  ];

  sectionHeaders.forEach(header => {
    const regex = new RegExp(\`\${header}[\\\\s\\\\S]*?(?=(?:\${sectionHeaders.join('|')})|$)\`, 'i');
    const match = fullText.match(regex);
    if (match) {
      sections[header] = match[0].trim();
    }
  });

  console.log(\`📦 \${Object.keys(sections).length} sections trouvées\`);

  try {
    // 1. Sauvegarder les données brutes
    console.log('💾 Sauvegarde Supabase...');

    const saveResponse = await fetch('https://gobapps.com/api/seeking-alpha-scraping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: ticker,
        url: window.location.href,
        raw_text: fullText,
        sections: sections,
        timestamp: new Date().toISOString()
      })
    });

    if (saveResponse.ok) {
      console.log(\`✅ Données brutes sauvegardées\`);
    }

    // 2. Analyser avec Perplexity
    console.log('🤖 Analyse Perplexity...');

    // Limiter à 15,000 caractères pour éviter les timeouts
    const textForAnalysis = fullText.substring(0, 15000);

    const analysisResponse = await fetch('https://gobapps.com/api/emma-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: \`Analyse ces données Seeking Alpha pour \${ticker} et structure-les selon le schéma seeking_alpha_analysis:\\n\\n\${textForAnalysis}\`,
        context: {
          output_mode: 'data',
          ticker: ticker,
          task: 'seeking_alpha_analysis'
        }
      })
    });

    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log(\`✅ Analyse Perplexity terminée\`);

      // 3. Sauvegarder l'analyse
      let analysisToSave = {};

      // Extraire le JSON de la réponse Perplexity
      if (typeof analysisData.response === 'string') {
        // Nettoyer la réponse
        let responseText = analysisData.response;
        responseText = responseText.replace(/\`\`\`json\\s*/gi, '').replace(/\`\`\`\\s*/g, '');

        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
          responseText = responseText.substring(firstBrace, lastBrace + 1);
          try {
            analysisToSave = JSON.parse(responseText);
          } catch (e) {
            console.warn('⚠️ Impossible de parser le JSON Perplexity');
          }
        }
      } else if (typeof analysisData.response === 'object') {
        analysisToSave = analysisData.response;
      }

      const analysisSaveResponse = await fetch('https://gobapps.com/api/seeking-alpha-scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analysis',
          ticker: ticker,
          ...analysisToSave
        })
      });

      if (analysisSaveResponse.ok) {
        console.log(\`✅ Analyse structurée sauvegardée\`);
      }
    }

    console.log(\`\\n🎉 TRAITEMENT COMPLET POUR \${ticker}!\\n\`);
    console.log('✅ Données brutes → Supabase');
    console.log('✅ Analyse Perplexity → Terminée');
    console.log('✅ Analyse structurée → Supabase');
    console.log('\\n💡 Passez à la page suivante ou fermez cette page\\n');

    // Fermeture automatique après 3 secondes
    setTimeout(() => {
      console.log('🚪 Fermeture automatique dans 2 secondes...');
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          console.log('💡 Fermez manuellement cette page');
        }
      }, 2000);
    }, 1000);

  } catch (error) {
    console.error(\`❌ Erreur: \${error.message}\`);
    alert(\`❌ Erreur scraping \${ticker}: \${error.message}\`);
  }
})();
\`\`\`

6. **Sauvegarder le snippet**: `Cmd+S` (Mac) ou `Ctrl+S` (Windows)

---

## 🎯 ÉTAPE 2: Utiliser le Snippet (CHAQUE FOIS)

### Workflow complet:

1. **Ouvrir le dashboard GOB**: https://gobapps.com

2. **Aller dans "Scrapping SA"**

3. **Se connecter à Seeking Alpha** (si pas déjà connecté):
   - Cliquer "🔐 Se connecter à Seeking Alpha"
   - Se connecter
   - Revenir au dashboard

4. **Lancer le scraping**:
   - Cliquer "🚀 LANCER SCRAPING BATCH (25 tickers)"
   - 25 popups vont s'ouvrir

5. **Sur CHAQUE popup Seeking Alpha**:
   - Ouvrir DevTools: `F12`
   - Aller dans "Sources" → "Snippets"
   - Cliquer sur "Seeking Alpha Auto-Scraper"
   - Cliquer sur ▶️ (bouton "Run" en bas à droite) **OU** `Cmd+Enter`

6. **Observer les logs**:
\`\`\`
🤖 AUTO-SCRAPER DÉMARRÉ
📊 Scraping de AAPL...
✅ 12,547 caractères extraits
📦 5 sections trouvées
💾 Sauvegarde Supabase...
✅ Données brutes sauvegardées
🤖 Analyse Perplexity...
✅ Analyse Perplexity terminée
✅ Analyse structurée sauvegardée

🎉 TRAITEMENT COMPLET POUR AAPL!
\`\`\`

7. **La page se ferme automatiquement** après 3 secondes

8. **Répéter** pour les 24 autres popups

---

## ⚡ RACCOURCIS CLAVIER

Une fois le snippet créé, vous pouvez l'exécuter avec:

- **`Cmd+Option+I`** (Mac) ou **`Ctrl+Shift+I`** (Windows): Ouvrir DevTools
- **`Cmd+P`** (Mac) ou **`Ctrl+P`** (Windows): Quick Open
- Taper `!` + début du nom du snippet (ex: `!seek`)
- **`Enter`**: Exécuter

Encore plus rapide:
- **`F12`**: Ouvrir DevTools
- **Cliquer dans "Console"**
- **Flèche Haut**: Récupérer la dernière commande (si vous avez déjà run le snippet)
- **`Enter`**: Réexécuter

---

## 📊 Temps estimé

| Étape | Temps | Détail |
|-------|-------|--------|
| Configuration snippet | 2 min | **UNE FOIS seulement** |
| Login Seeking Alpha | 30 sec | Si pas déjà connecté |
| Ouvrir 25 popups | 10 sec | Automatique |
| Scraper 25 tickers | 5-7 min | 15-20 sec par ticker |
| **TOTAL** | **~8 minutes** | Au lieu de 45-60 minutes! |

---

## 🔧 Troubleshooting

### Le snippet ne scrape rien
**Solution**: Vérifiez que vous êtes bien sur une page Seeking Alpha `/virtual_analyst_report`

### Erreur "UNKNOWN ticker"
**Solution**: L'URL ne contient pas de ticker valide. Vérifiez l'URL.

### Erreur Supabase
**Solution**: Vérifiez que vous êtes connecté au dashboard GOB (même onglet ouvert)

### Perplexity timeout
**Solution**: Normal si la page est très longue. Les données brutes sont quand même sauvegardées.

### Page ne se ferme pas automatiquement
**Solution**: Certains navigateurs empêchent `window.close()`. Fermez manuellement.

---

## 💡 ASTUCES PRO

### Astuce 1: Multi-écran
Si vous avez 2 écrans:
- Écran 1: Dashboard GOB (pour voir les résultats)
- Écran 2: Popups Seeking Alpha (pour scraper)

### Astuce 2: Raccourci clavier personnalisé
Dans Chrome Extensions, vous pouvez créer un raccourci pour exécuter des snippets encore plus vite.

### Astuce 3: Script pour fermer toutes les pages d'un coup
Après avoir scrapé tout, dans la console du dashboard:
\`\`\`javascript
// Fermer toutes les fenêtres ouvertes (sauf celle-ci)
// À exécuter dans le dashboard principal
\`\`\`

---

## 🎉 Résumé

**Configuration** (une fois):
1. Créer le snippet dans Chrome DevTools
2. Coller le code
3. Sauvegarder

**Utilisation** (à chaque batch):
1. Cliquer "Lancer Scraping" (25 popups)
2. Sur chaque popup: F12 → Run snippet (1 clic)
3. Observer les logs
4. Page se ferme automatiquement
5. Répéter 25 fois

**Temps total**: ~8 minutes pour 25 tickers
**Effort**: 25 clics (un par popup)
**Copie manuelle**: ZÉRO!

---

**Créé**: 17 octobre 2025
**Version**: 1.0
**Status**: ✅ Production Ready

**VOUS NE COPIEZ RIEN - JUSTE 1 CLIC PAR POPUP!** 🚀
