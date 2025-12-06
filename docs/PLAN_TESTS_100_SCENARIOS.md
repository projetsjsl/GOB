# Plan de Tests - 100 Cas de Navigation et Situations Utilisateur

## 📋 Vue d'Ensemble

Ce document décrit les 100 tests de navigation et situations utilisateur pour valider l'application 3p1 et identifier les ajustements nécessaires.

---

## 🎯 Catégories de Tests

### **CATÉGORIE 1: Navigation et Vues (20 tests)**
Tests de navigation entre les différentes vues et fonctionnalités de l'application.

1. ✅ Charger la page principale 3p1
2. ✅ Accéder à la vue Analyse
3. ✅ Accéder à la vue KPI Dashboard
4. ✅ Basculer entre Analyse et KPI
5. ✅ Filtrer par catégorie (watchlist)
6. ✅ Filtrer par catégorie (team)
7. ✅ Filtrer par catégorie (manual)
8. ✅ Rechercher un ticker spécifique (NVDA)
9. ✅ Trier les tickers par nom (A-Z)
10. ✅ Pagination des résultats (page 1)
11. ✅ Pagination des résultats (page 2)
12. ✅ Afficher les détails d'un ticker
13. ✅ Vérifier l'exclusion mutuelle team/watchlist
14. ✅ Compter les tickers par catégorie
15. ✅ Filtrer les tickers inactifs
16. ✅ Recherche avec casse insensible
17. ✅ Filtrer par secteur
18. ✅ Filtrer par exchange
19. ✅ Trier par priorité (team tickers)
20. ✅ Vérifier la cohérence category/categories

### **CATÉGORIE 2: Gestion des Tickers (20 tests)**
Tests de gestion et manipulation des tickers dans la base de données.

21. ✅ Récupérer tous les tickers actifs
22. ✅ Vérifier les 3 watchlist tickers (NVDA, SNY, J)
23. ✅ Vérifier les 25 team tickers (portefeuille)
24. ✅ Vérifier qu'aucun ticker n'est à la fois team ET watchlist
25. ✅ Vérifier la structure des données ticker
26. ✅ Rechercher un ticker inexistant
27. ✅ Filtrer par multiple critères
28. ✅ Compter les tickers par catégorie
29. ✅ Vérifier l'unicité des tickers
30. ✅ Vérifier les tickers avec company_name
31. ✅ Vérifier les tickers avec secteur
32. ✅ Vérifier les tickers avec exchange
33. ✅ Vérifier les tickers avec market_cap
34. ✅ Vérifier les team tickers avec priority
35. ✅ Vérifier les watchlist tickers sans team
36. ✅ Vérifier les team tickers sans watchlist
37. ✅ Vérifier la cohérence category pour watchlist
38. ✅ Vérifier la cohérence category pour team
39. ✅ Vérifier les tickers manual sans catégories spéciales
40. ✅ Vérifier le format des tickers (uppercase)

### **CATÉGORIE 3: API Endpoints (20 tests)**
Tests des endpoints API pour valider leur fonctionnement.

41. ✅ Tester GET /api/admin/tickers
42. ✅ Tester GET /api/admin/tickers?category=watchlist
43. ✅ Tester GET /api/admin/tickers?category=team
44. ✅ Tester GET /api/terminal-data
45. ✅ Tester GET /api/market-data-batch?tickers=NVDA,AAPL
46. ✅ Tester GET /api/fmp-batch-sync
47. ✅ Tester GET /api/kpi-engine
48. ✅ Tester GET /api/fmp-company-data?symbol=NVDA
49. ✅ Tester GET /api/fmp-search?query=Apple
50. ✅ Tester GET /api/3p1-sync-na?action=analyze
51. ✅ Tester CORS headers sur API
52. ✅ Tester erreur 404 pour ticker inexistant
53. ✅ Tester limite de batch size (100 tickers)
54. ✅ Tester batch size trop grand (>100)
55. ✅ Tester endpoint avec paramètres invalides
56. ✅ Tester timeout des endpoints (30s max)
57. ✅ Tester format JSON des réponses
58. ✅ Tester endpoint avec méthode non autorisée
59. ✅ Tester endpoint avec authentification
60. ✅ Tester rate limiting

### **CATÉGORIE 4: Données et Cache (20 tests)**
Tests de validation des données et du système de cache.

61. ✅ Vérifier la table ticker_price_cache existe
62. ✅ Vérifier les données de prix en cache
63. ✅ Vérifier l'expiration du cache
64. ✅ Vérifier la table metrics existe
65. ✅ Vérifier la table kpi_values existe
66. ✅ Vérifier la table kpi_definitions existe
67. ✅ Vérifier la cohérence des données entre tables
68. ✅ Vérifier les données historiques (price_history)
69. ✅ Vérifier l'intégrité référentielle
70. ✅ Vérifier les index de performance
71. ✅ Vérifier les contraintes UNIQUE
72. ✅ Vérifier les valeurs NULL autorisées
73. ✅ Vérifier les types de données
74. ✅ Vérifier les timestamps (created_at, updated_at)
75. ✅ Vérifier la synchronisation des données
76. ✅ Vérifier les données de marché en temps réel
77. ✅ Vérifier le cache client-side (simulation)
78. ✅ Vérifier la cohérence des arrays categories
79. ✅ Vérifier les données de performance
80. ✅ Vérifier la cohérence globale des données

### **CATÉGORIE 5: Cas Limites et Erreurs (20 tests)**
Tests de cas limites et gestion d'erreurs.

81. ✅ Tester avec ticker vide
82. ✅ Tester avec ticker très long
83. ✅ Tester avec caractères spéciaux
84. ✅ Tester protection SQL injection
85. ✅ Tester avec valeurs NULL
86. ✅ Tester avec catégorie invalide
87. ✅ Tester avec array categories vide
88. ✅ Tester avec is_active = false
89. ✅ Tester avec priority négative
90. ✅ Tester avec market_cap négatif
91. ✅ Tester avec dates invalides
92. ✅ Tester avec requête très large (1000 tickers)
93. ✅ Tester avec filtres multiples complexes
94. ✅ Tester avec timeout
95. ✅ Tester avec connexion perdue (simulation)
96. ✅ Tester avec données corrompues (simulation)
97. ✅ Tester avec race condition (simulation)
98. ✅ Tester avec mémoire insuffisante (simulation)
99. ✅ Tester avec caractères Unicode
100. ✅ Tester la résilience globale

---

## 🚀 Exécution des Tests

### Prérequis
```bash
# Variables d'environnement requises
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
VERCEL_URL=... (optionnel, pour tests API)
```

### Commande d'exécution
```bash
node scripts/test-100-navigation-scenarios.js
```

### Résultats attendus
- ✅ **Tests réussis** : Affichage en vert
- ❌ **Tests échoués** : Affichage en rouge avec détails de l'erreur
- ⚠️ **Avertissements** : Affichage en jaune

### Rapport final
Le script génère un rapport avec :
- Nombre de tests réussis/échoués
- Liste détaillée des erreurs
- Taux de réussite
- Durée totale d'exécution

---

## 🔧 Ajustements Identifiés

Les ajustements nécessaires seront documentés ici après l'exécution des tests.

### Ajustements Critiques
- (À compléter après exécution)

### Ajustements Mineurs
- (À compléter après exécution)

### Améliorations Suggérées
- (À compléter après exécution)

---

## 📊 Métriques de Qualité

### Objectifs
- **Taux de réussite** : ≥ 95%
- **Temps d'exécution** : < 60 secondes
- **Couverture** : 100% des fonctionnalités principales

### Suivi
- Date d'exécution : (À compléter)
- Résultats : (À compléter)
- Actions correctives : (À compléter)

---

## 📝 Notes

- Les tests sont conçus pour être non-destructifs (lecture seule)
- Certains tests peuvent nécessiter des données de test spécifiques
- Les tests d'API nécessitent que l'application soit déployée ou accessible localement

