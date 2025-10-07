# Configuration du Mot de Passe - GOB Apps

## 🔐 Protection par Mot de Passe

GOB Apps inclut un système de protection par mot de passe pour sécuriser l'accès à votre plateforme financière.

## ⚙️ Configuration

### 1. **Variable d'Environnement Vercel**

Ajoutez la variable d'environnement `SITE_PASSWORD` dans votre dashboard Vercel :

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet GOB
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez une nouvelle variable :
   - **Name** : `SITE_PASSWORD`
   - **Value** : `votre_mot_de_passe_secret`
   - **Environment** : Production (et Preview si souhaité)

### 2. **Redéploiement**

Après avoir ajouté la variable d'environnement :

```bash
git push origin main
```

Vercel redéploiera automatiquement votre application avec la protection par mot de passe.

## 🎯 Fonctionnement

### **Avec Mot de Passe Configuré :**
1. L'utilisateur accède au site
2. Un modal de mot de passe s'affiche
3. L'utilisateur entre le mot de passe
4. Si correct → Animation de bienvenue → Accès au site
5. Si incorrect → Message d'erreur

### **Sans Mot de Passe Configuré :**
- Le site s'ouvre directement sans protection
- L'animation de bienvenue se lance immédiatement

## 🎨 Interface

### **Modal de Mot de Passe :**
- **Design élégant** : Adapté au thème sombre/clair
- **Icône de sécurité** : Cadenas avec dégradé
- **Responsive** : Optimisé pour mobile et desktop
- **Focus automatique** : Le champ mot de passe est pré-sélectionné
- **Validation** : Mot de passe requis pour continuer

### **Sécurité :**
- **Chiffrement** : Le mot de passe est comparé côté serveur
- **Pas de stockage** : Aucun mot de passe n'est stocké côté client
- **Variables d'environnement** : Sécurisé via Vercel

## 🔧 Personnalisation

### **Désactiver la Protection :**
Pour désactiver la protection par mot de passe :
1. Supprimez la variable `SITE_PASSWORD` de Vercel
2. Ou laissez la valeur vide : `SITE_PASSWORD=`
3. Redéployez l'application

### **Changer le Mot de Passe :**
1. Modifiez la valeur de `SITE_PASSWORD` dans Vercel
2. Redéployez l'application
3. Le nouveau mot de passe sera actif immédiatement

## 🚀 Avantages

- ✅ **Sécurité** : Protection de votre plateforme financière
- ✅ **Flexibilité** : Activation/désactivation facile
- ✅ **UX** : Interface élégante et intuitive
- ✅ **Performance** : Vérification rapide côté serveur
- ✅ **Responsive** : Fonctionne sur tous les appareils

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez la variable d'environnement** dans Vercel
2. **Redéployez** l'application après modification
3. **Vérifiez les logs** dans la console du navigateur
4. **Testez** avec un mot de passe simple d'abord

---

**Note** : Le mot de passe est requis avant l'animation de bienvenue, garantissant que seuls les utilisateurs autorisés accèdent à votre plateforme financière.
