# Instructions pour le logo JStocks™

## Placement de l'image

Pour afficher le logo JStocks™ dans l'animation de première ouverture, veuillez placer l'image fournie dans le dossier `/public` avec le nom suivant:

```
/public/jstocks-logo.png
```

## Format de l'image

- **Format recommandé**: PNG avec fond transparent
- **Dimensions recommandées**: 512x512 px ou supérieur (carré)
- **Taille de fichier**: < 500 KB pour des performances optimales

## Fallback automatique

Si l'image n'est pas trouvée, un logo SVG animé sera automatiquement affiché avec:
- Un graphique en barres ascendantes
- Une flèche de tendance montante
- Le texte "JStocks - STOCK ANALYSIS PLATFORM"
- Adaptation automatique au thème clair/sombre

## Comment tester

1. Placez l'image dans `/public/jstocks-logo.png`
2. Ouvrez l'application dans votre navigateur
3. Naviguez vers l'onglet "📈 JStocks™"
4. L'animation d'introduction s'affichera pendant 3 secondes
5. L'animation ne s'affichera plus après la première ouverture (stocké dans localStorage)

## Pour réinitialiser l'animation

Pour voir à nouveau l'animation de première ouverture, exécutez dans la console du navigateur:

```javascript
localStorage.removeItem('hasSeenJStocksIntro');
```

Puis rechargez la page et ouvrez l'onglet JStocks™.
