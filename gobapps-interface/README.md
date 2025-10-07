# GOBApps Interface

Interface de gestion d'accès aux applications GOBApps propulsée par JSL AI.

## 🚀 Fonctionnalités

- **Gestion d'applications** : Ajouter, modifier et supprimer des applications
- **Thèmes personnalisables** : 6 thèmes prédéfinis (Finance, Tech, Créatif, Santé, Juridique, Écologie)
- **Icônes flexibles** : Support des emojis et des URLs d'images
- **Drag & Drop** : Réorganiser les applications par glisser-déposer
- **Import/Export** : Sauvegarder et restaurer vos configurations
- **Interface responsive** : Optimisée pour tous les écrans
- **Design moderne** : Interface élégante avec effets de glassmorphism

## 🛠️ Technologies

- **React 18** avec TypeScript
- **Tailwind CSS** pour le styling
- **Vite** pour le build et le développement
- **Lucide React** pour les icônes

## 📦 Installation

```bash
# Cloner le repository
git clone <repository-url>
cd gobapps-interface

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## 🚀 Déploiement

### Vercel (Recommandé)

1. Connectez votre repository GitHub à Vercel
2. Vercel détectera automatiquement la configuration Vite
3. Le déploiement se fera automatiquement à chaque push

### Build manuel

```bash
# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

## 🎨 Thèmes disponibles

- **Finance Pro** : Palette bleu/gris professionnelle
- **Tech Modern** : Palette violet/indigo moderne
- **Créatif** : Palette rose/orange créative
- **Santé** : Palette teal/cyan apaisante
- **Juridique** : Palette gris sobre
- **Écologie** : Palette vert/émeraude naturelle

## 📱 Utilisation

1. **Ajouter une application** : Cliquez sur le bouton d'édition puis sur "+"
2. **Modifier une application** : Mode édition → clic sur l'app → modification
3. **Réorganiser** : Mode édition → glisser-déposer
4. **Changer de thème** : Bouton palette dans le header
5. **Gérer les apps** : Menu administration → "Gérer les apps"
6. **Import/Export** : Menu administration → Import/Export

## 🔧 Configuration

Les données sont stockées localement dans le navigateur via `localStorage`. Pour partager vos configurations, utilisez la fonction d'export/import.

## 📄 Licence

MIT License - Propulsé par JSL AI


