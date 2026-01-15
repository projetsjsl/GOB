#  Guide de Deploiement Emma

##  Prerequis

- Serveur web (Apache, Nginx, ou serveur de developpement)
- Navigateur moderne supportant les modules ES6
- Cle API Gemini (optionnelle pour les tests)

##  Structure des Fichiers

```
GOB/public/
 emma-financial-profile.js      # Profil financier d'Emma
 emma-gemini-service.js         # Service d'integration Gemini
 emma-ui-components.js          # Composants d'interface
 emma-styles.css               # Styles CSS
 emma-dashboard-integration.js  # Integration principale
 emma-config.js                # Configuration
 emma-demo.html                # Page de demonstration
 emma-test.html                # Page de test
 README-EMMA.md               # Documentation
 DEPLOYMENT.md                # Ce guide
 beta-combined-dashboard.html  # Dashboard principal (modifie)
```

##  Installation

### 1. Copier les Fichiers

Copiez tous les fichiers Emma dans le repertoire `GOB/public/` :

```bash
# Verifier que tous les fichiers sont presents
ls -la GOB/public/emma-*
```

### 2. Verifier les Permissions

Assurez-vous que les fichiers sont accessibles en lecture :

```bash
chmod 644 GOB/public/emma-*
```

### 3. Tester le Serveur

Demarrez un serveur de developpement local :

```bash
# Avec Python
cd GOB/public
python -m http.server 8000

# Avec Node.js (si http-server est installe)
npx http-server -p 8000

# Avec PHP
php -S localhost:8000
```

##  Deploiement Web

### Serveur Apache

1. Copiez les fichiers dans le repertoire web
2. Configurez les en-tetes CORS si necessaire :

```apache
# .htaccess
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type"
```

### Serveur Nginx

```nginx
# Configuration nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /chemin/vers/GOB/public;
    index beta-combined-dashboard.html;
    
    # Support des modules ES6
    location ~* \.js$ {
        add_header Content-Type application/javascript;
    }
    
    # CORS pour les modules
    location ~* \.js$ {
        add_header Access-Control-Allow-Origin "*";
    }
}
```

##  Tests de Deploiement

### 1. Test de Base

Ouvrez dans votre navigateur :
- `http://localhost:8000/emma-demo.html` - Demonstration
- `http://localhost:8000/emma-test.html` - Tests
- `http://localhost:8000/beta-combined-dashboard.html` - Dashboard complet

### 2. Test des Modules ES6

Verifiez dans la console du navigateur (F12) :
```javascript
// Test d'import
import { emmaConfig } from './emma-config.js';
console.log('Configuration Emma:', emmaConfig);
```

### 3. Test de l'API Gemini

1. Allez dans l'onglet "Ask Emma"
2. Cliquez sur " Configuration Gemini"
3. Entrez votre cle API
4. Testez la connexion

##  Configuration de Securite

### HTTPS (Recommande)

Pour la production, utilisez HTTPS :

```bash
# Generer un certificat auto-signe pour les tests
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### Headers de Securite

```apache
# .htaccess
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

##  Monitoring

### Logs de Performance

Ajoutez dans `emma-dashboard-integration.js` :

```javascript
// Monitoring des performances
const performanceMonitor = {
  startTime: Date.now(),
  logPerformance: (action) => {
    const duration = Date.now() - this.startTime;
    console.log(`[Emma] ${action}: ${duration}ms`);
  }
};
```

### Metriques d'Utilisation

```javascript
// Statistiques d'utilisation
const usageStats = {
  messagesSent: 0,
  apiCalls: 0,
  errors: 0,
  trackMessage: () => this.messagesSent++,
  trackApiCall: () => this.apiCalls++,
  trackError: () => this.errors++
};
```

##  Depannage

### Problemes Courants

#### Erreur CORS
```
Access to script at 'file:///...' from origin 'null' has been blocked by CORS policy
```
**Solution** : Utilisez un serveur web, pas l'ouverture directe de fichier.

#### Modules ES6 non supportes
```
Uncaught SyntaxError: Cannot use import statement outside a module
```
**Solution** : Verifiez que les scripts utilisent `type="module"`.

#### API Gemini bloquee
```
Failed to fetch
```
**Solution** : Verifiez la cle API et les restrictions CORS.

### Logs de Debogage

Activez les logs detailles :

```javascript
// Dans emma-config.js
testing: {
  enabled: true,
  logLevel: 'debug'
}
```

##  Optimisation

### Compression

Activez la compression gzip :

```apache
# .htaccess
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### Cache

```apache
# .htaccess
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
</IfModule>
```

##  Mise a Jour

### Procedure de Mise a Jour

1. Sauvegardez la configuration actuelle :
```bash
cp GOB/public/emma-config.js GOB/public/emma-config.backup.js
```

2. Remplacez les fichiers :
```bash
# Copier les nouveaux fichiers
cp -r nouveau-dossier/emma-* GOB/public/
```

3. Testez la mise a jour :
```bash
# Verifier que tout fonctionne
curl -I http://localhost:8000/emma-demo.html
```

### Rollback

En cas de probleme :

```bash
# Restaurer la configuration
cp GOB/public/emma-config.backup.js GOB/public/emma-config.js

# Redemarrer le serveur
sudo systemctl restart apache2  # ou nginx
```

##  Support

### Verifications Rapides

1. **Fichiers presents** : `ls -la GOB/public/emma-*`
2. **Serveur actif** : `curl -I http://localhost:8000/`
3. **Console propre** : Ouvrir F12, verifier les erreurs
4. **API fonctionnelle** : Tester la connexion Gemini

### Contacts

- Documentation : `README-EMMA.md`
- Tests : `emma-test.html`
- Demonstration : `emma-demo.html`

---

**Emma** - Deployee avec succes ! 
