# 🚀 Guide de Déploiement

Ce guide explique comment déployer l'application web intermédiaire en production.

## 📋 Prérequis

- Node.js 18+ installé sur le serveur
- Accès réseau à l'API Alpha Vantage
- Port disponible (par défaut 5000)
- Accès administrateur pour configurer le pare-feu

## 🔧 Déploiement Local

### 1. Installation

```bash
cd webapp_code
npm install
```

### 2. Configuration

```bash
cp .env.example .env
# Modifier .env selon vos besoins
```

### 3. Démarrage

```bash
npm start
```

Le serveur démarre sur `http://localhost:5000`.

## 🌐 Déploiement en Réseau d'Entreprise

### 1. Configuration du Serveur

Modifier `server.js` pour écouter sur toutes les interfaces :

```javascript
// Remplacer cette ligne :
app.listen(PORT, () => {

// Par :
app.listen(PORT, '0.0.0.0', () => {
```

### 2. Configuration du Pare-feu

#### Windows (Pare-feu Windows)

```powershell
# Autoriser le port 5000
New-NetFirewallRule -DisplayName "Sector Index API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

#### Linux (iptables)

```bash
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
sudo iptables-save
```

#### Linux (ufw)

```bash
sudo ufw allow 5000/tcp
```

### 3. Configuration du Service (Optionnel)

#### Windows (NSSM - Non-Sucking Service Manager)

1. Télécharger NSSM depuis https://nssm.cc/
2. Installer le service :
```cmd
nssm install SectorIndexAPI "C:\Program Files\nodejs\node.exe" "C:\path\to\webapp_code\server.js"
nssm set SectorIndexAPI AppDirectory "C:\path\to\webapp_code"
nssm start SectorIndexAPI
```

#### Linux (systemd)

Créer `/etc/systemd/system/sector-index-api.service` :

```ini
[Unit]
Description=Sector Index API Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/webapp_code
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/path/to/webapp_code/.env

[Install]
WantedBy=multi-user.target
```

Activer et démarrer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable sector-index-api
sudo systemctl start sector-index-api
```

### 4. Configuration du Reverse Proxy (Optionnel)

#### Nginx

Créer `/etc/nginx/sites-available/sector-index-api` :

```nginx
server {
    listen 80;
    server_name monserveur.local;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer :

```bash
sudo ln -s /etc/nginx/sites-available/sector-index-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Sécurité

### 1. Variables d'Environnement

Ne jamais commiter le fichier `.env` :

```bash
# Ajouter à .gitignore
echo ".env" >> .gitignore
```

### 2. Limitation d'Accès (Optionnel)

Modifier `server.js` pour limiter l'accès par IP :

```javascript
const ALLOWED_IPS = ['192.168.1.0/24', '10.0.0.0/8'];

app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  // Vérifier si l'IP est autorisée
  // Implémenter la logique de vérification
  next();
});
```

### 3. HTTPS (Recommandé pour Production)

Utiliser un reverse proxy (Nginx, Apache) avec certificat SSL pour activer HTTPS.

## 📊 Monitoring

### 1. Logs

Les logs sont affichés dans la console. Pour la production, rediriger vers un fichier :

```bash
npm start > logs/app.log 2>&1
```

Ou utiliser un gestionnaire de processus comme PM2 :

```bash
npm install -g pm2
pm2 start server.js --name sector-index-api
pm2 logs sector-index-api
```

### 2. Health Check

Créer un script de monitoring qui appelle `/api/health` :

```bash
#!/bin/bash
while true; do
  response=$(curl -s http://localhost:5000/api/health)
  if [ $? -ne 0 ]; then
    echo "Service down at $(date)"
    # Envoyer une alerte
  fi
  sleep 60
done
```

## 🔄 Mise à Jour

### 1. Arrêter le Service

```bash
# Windows (NSSM)
nssm stop SectorIndexAPI

# Linux (systemd)
sudo systemctl stop sector-index-api

# PM2
pm2 stop sector-index-api
```

### 2. Mettre à Jour le Code

```bash
git pull  # Si versionné
# Ou copier les nouveaux fichiers
```

### 3. Redémarrer

```bash
# Windows (NSSM)
nssm start SectorIndexAPI

# Linux (systemd)
sudo systemctl start sector-index-api

# PM2
pm2 restart sector-index-api
```

## 🐛 Dépannage

### Le serveur ne démarre pas

- Vérifier que Node.js est installé : `node --version`
- Vérifier que le port n'est pas utilisé : `netstat -an | grep 5000`
- Vérifier les logs d'erreur

### Les clients ne peuvent pas se connecter

- Vérifier le pare-feu
- Vérifier que le serveur écoute sur `0.0.0.0` et non `127.0.0.1`
- Tester depuis le serveur : `curl http://localhost:5000/api/health`
- Tester depuis un client : `curl http://IP_SERVEUR:5000/api/health`

### Erreurs de quota Alpha Vantage

- Vérifier les logs pour voir le nombre d'appels
- Augmenter le TTL du cache dans `server.js`
- Utiliser plusieurs clés API en rotation (nécessite modification du code)

## 📝 Checklist de Déploiement

- [ ] Node.js installé et à jour
- [ ] Dépendances installées (`npm install`)
- [ ] Fichier `.env` configuré
- [ ] Serveur démarre sans erreur
- [ ] Port configuré dans le pare-feu
- [ ] Service configuré (optionnel)
- [ ] Reverse proxy configuré (optionnel)
- [ ] HTTPS activé (recommandé)
- [ ] Monitoring en place
- [ ] Documentation mise à jour avec l'URL du serveur
- [ ] Tests de connexion depuis les clients Excel




















