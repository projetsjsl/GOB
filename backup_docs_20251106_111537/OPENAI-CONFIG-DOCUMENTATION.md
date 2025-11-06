# 🔧 Configuration OpenAI - Documentation Critique

## ⚠️ CONFIGURATION QUI FONCTIONNE (Testée le 15/10/2025)

### ✅ Paramètres Validés

| Paramètre | Valeur | Statut | Notes |
|-----------|--------|--------|-------|
| **Méthode** | `fetch()` direct | ✅ Fonctionne | PAS le SDK OpenAI |
| **Modèle** | `gpt-4o` | ✅ Fonctionne | PAS gpt-5 (inexistant) |
| **Clé API** | `process.env.OPENAI_API_KEY` | ✅ Configurée | Dans Vercel |
| **Max Tokens** | `2000` | ✅ Optimal | Équilibre performance/qualité |
| **Temperature** | `0.7` | ✅ Optimal | Créativité/précision |
| **Timeout** | `25 secondes` | ✅ Fonctionne | Pas de timeout dans body |

### ❌ Configurations à ÉVITER

- ❌ `import { OpenAI } from 'openai'` → Causait des erreurs de déploiement
- ❌ `gpt-5` → Modèle inexistant
- ❌ `AbortSignal.timeout()` dans le body → Causait des erreurs
- ❌ SDK officiel → Problèmes de compatibilité Vercel

### 🔧 Dépannage

| Problème | Solution |
|----------|----------|
| `"model": "demo-mode"` | Vérifier `OPENAI_API_KEY` dans Vercel |
| `"fallback": true` | Clé API non configurée ou invalide |
| Timeout | Réduire `max_tokens` ou augmenter timeout |
| Erreur 401 | Clé API invalide ou expirée |
| Erreur 429 | Quota dépassé, attendre ou upgrader |

### 📋 Checklist de Validation

- [ ] Clé API configurée dans Vercel : `OPENAI_API_KEY`
- [ ] Clé commence par `sk-proj-...`
- [ ] Variable d'environnement dans tous les environnements (Production, Preview, Development)
- [ ] Redéploiement effectué après configuration
- [ ] Test API réussi : `"model": "gpt-4o"` et `"fallback": false`

### 🧪 Test de Validation

```bash
curl -X POST https://gobapps.com/api/ai-services \
  -H "Content-Type: application/json" \
  -d '{"service": "openai", "prompt": "Test", "marketData": {}, "news": "Test"}' \
  | jq '{model, fallback}'
```

**Résultat attendu :**
```json
{
  "model": "gpt-4o",
  "fallback": false
}
```

### 📝 Notes Importantes

1. **NE PAS MODIFIER** la configuration qui fonctionne
2. **TOUJOURS TESTER** après toute modification
3. **GARDER** les logs de debug pour diagnostic
4. **DOCUMENTER** toute nouvelle configuration

---

**Dernière mise à jour :** 15/10/2025  
**Statut :** ✅ FONCTIONNEL  
**Testé par :** Assistant IA + Utilisateur
