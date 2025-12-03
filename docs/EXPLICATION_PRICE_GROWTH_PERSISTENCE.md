# Explication : Price Growth Persistence

**Date** : 3 décembre 2025

---

## 🔍 Le Problème

Vous avez remarqué que :
- ✅ `persistence` est rempli (1009 tickers)
- ❌ `price_growth` est NULL (0 tickers)

**Question** : Pourquoi `price_growth` est NULL alors que l'Excel contient "Price Growth Persistence" ?

---

## ✅ La Réponse

### Dans ValueLine, "Price Growth Persistence" est **UNE SEULE métrique**

**Définition ValueLine** :
- **Price Growth Persistence** = Note numérique (5-100) qui mesure la **croissance persistante du prix** sur 10 ans
- **Ce n'est PAS** une combinaison de "Price Growth" + "Persistence"
- C'est **une métrique unique** qui s'appelle "Price Growth Persistence"

### Dans votre Excel `valueline.xlsx`

| Colonne | Valeur Exemple | Type |
|---------|----------------|------|
| `Price Growth Persistence` | "85" | Nombre (5-100) |

**Conclusion** : Cette colonne contient uniquement des **nombres**, pas de lettres (A++, A+, etc.).

---

## 📊 Mapping Correct

| Colonne Excel | Champ Supabase | Valeur | Statut |
|---------------|----------------|--------|--------|
| `Price Growth Persistence` | `persistence` | "85" | ✅ **Correct** |
| `Price Growth Persistence` | `price_growth` | NULL | ✅ **Normal** (pas de colonne séparée) |

---

## ⚠️ Pourquoi `price_growth` existe dans Supabase ?

Le champ `price_growth` existe dans Supabase car :
1. ValueLine peut fournir "Price Growth" comme métrique séparée (format lettre : A++, A+, etc.)
2. Mais cette métrique **n'est PAS dans votre fichier `valueline.xlsx`**
3. Si vous avez une autre source pour "Price Growth", vous pouvez la remplir manuellement

---

## ✅ Solution Actuelle

**Le script corrigé fait maintenant** :
- ✅ Met "Price Growth Persistence" dans `persistence` (correct)
- ✅ Laisse `price_growth` NULL (normal, pas de données disponibles)

**Résultat** :
- ✅ 1009 tickers avec `persistence` rempli
- ✅ 0 tickers avec `price_growth` (normal)

---

## 📝 Si vous voulez remplir `price_growth`

**Option 1** : Si vous avez une autre source Excel avec "Price Growth" séparée
- Créer un script pour mettre à jour `price_growth` depuis cette source

**Option 2** : Si "Price Growth" n'existe pas dans vos données
- Laisser `price_growth` NULL (c'est normal)
- Utiliser uniquement `persistence` qui contient "Price Growth Persistence"

---

## ✅ Conclusion

**`price_growth` NULL est NORMAL et CORRECT** car :
- ✅ "Price Growth Persistence" est une métrique unique (pas deux)
- ✅ Elle va dans `persistence` (correct)
- ✅ Il n'y a pas de colonne "Price Growth" séparée dans votre Excel

**Aucune action requise** - le comportement est correct ! ✅

---

**Document créé le** : 3 décembre 2025  
**Version** : 1.0

