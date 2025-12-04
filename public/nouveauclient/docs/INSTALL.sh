#!/bin/bash
# setup.sh - Script d'installation rapide

echo "🚀 Installation Collecteur Financier"
echo "===================================="

# Structure
mkdir -p public/data
mkdir -p public/assets

# Fichiers JSON d'initialisation
echo "Création des fichiers de données..."

# users.json
cat > public/data/users.json << 'EOF'
[
  {
    "id": "admin-001",
    "username": "admin",
    "password": "admin123",
    "role": "admin",
    "name": "Administrateur",
    "created": "2024-01-01T00:00:00Z"
  },
  {
    "id": "user-001",
    "username": "user",
    "password": "user123",
    "role": "user",
    "name": "Adjointe",
    "created": "2024-01-01T00:00:00Z"
  }
]
EOF

# config.json
cat > public/data/config.json << 'EOF'
{
  "appName": "Collecteur Financier",
  "company": "Votre Entreprise",
  "version": "1.0.0",
  "fields": {
    "section1": [
      { "id": "firstName", "label": "Prénom", "type": "text", "required": true, "visible": true },
      { "id": "lastName", "label": "Nom", "type": "text", "required": true, "visible": true },
      { "id": "email", "label": "Email", "type": "email", "required": true, "visible": true },
      { "id": "phone", "label": "Téléphone", "type": "tel", "required": true, "visible": true },
      { "id": "address", "label": "Adresse", "type": "text", "required": true, "visible": true },
      { "id": "city", "label": "Ville", "type": "text", "required": false, "visible": true },
      { "id": "province", "label": "Province", "type": "text", "required": false, "visible": true },
      { "id": "postalCode", "label": "Code Postal", "type": "text", "required": false, "visible": true }
    ],
    "section2": [
      { "id": "civilStatus", "label": "État Civil", "type": "select", "required": true, "visible": true },
      { "id": "birthdate", "label": "Date de Naissance", "type": "date", "required": true, "visible": true },
      { "id": "nas", "label": "NAS", "type": "text", "required": false, "visible": true },
      { "id": "childrenCount", "label": "Nombre d'Enfants", "type": "number", "required": false, "visible": true },
      { "id": "employer", "label": "Employeur", "type": "text", "required": true, "visible": true },
      { "id": "jobTitle", "label": "Titre de Poste", "type": "text", "required": true, "visible": true },
      { "id": "spouseName", "label": "Nom du Conjoint", "type": "text", "required": false, "visible": true },
      { "id": "spouseEmployer", "label": "Employeur du Conjoint", "type": "text", "required": false, "visible": true }
    ],
    "section3": [
      { "id": "annualIncome", "label": "Revenu Annuel", "type": "number", "required": true, "visible": true },
      { "id": "spouseIncome", "label": "Revenu Conjoint", "type": "number", "required": false, "visible": true },
      { "id": "realEstateValue", "label": "Valeur Immobilière", "type": "number", "required": false, "visible": true },
      { "id": "liquidAssets", "label": "Actifs Liquides", "type": "number", "required": false, "visible": true },
      { "id": "investmentHorizon", "label": "Horizon de Placement", "type": "select", "required": true, "visible": true },
      { "id": "riskTolerance", "label": "Tolérance au Risque", "type": "select", "required": true, "visible": true },
      { "id": "reereNumber", "label": "Numéro REER", "type": "text", "required": false, "visible": true },
      { "id": "accountantName", "label": "Comptable (Nom)", "type": "text", "required": false, "visible": true },
      { "id": "accountantPhone", "label": "Comptable (Téléphone)", "type": "tel", "required": false, "visible": true },
      { "id": "notes", "label": "Notes Additionnelles", "type": "textarea", "required": false, "visible": true }
    ]
  },
  "pdfTemplate": {
    "title": "Formulaire de Collecte de Données",
    "sections": ["section1", "section2", "section3"],
    "includeSignature": true
  },
  "excelTemplate": "client_",
  "excelColumns": ["firstName", "lastName", "email", "phone", "annualIncome", "investmentHorizon", "riskTolerance"]
}
EOF

# clients.json
cat > public/data/clients.json << 'EOF'
[]
EOF

echo "✅ Fichiers créés avec succès!"
echo ""
echo "📁 Structure du projet:"
echo "public/"
echo "  ├── index.html (Page de login)"
echo "  ├── app.html (Formulaire de collecte)"
echo "  ├── admin.html (Panneau admin)"
echo "  ├── app-logic.js (Logique app)"
echo "  ├── admin-logic.js (Logique admin)"
echo "  ├── data/"
echo "  │   ├── users.json"
echo "  │   ├── config.json"
echo "  │   └── clients.json"
echo "  └── assets/"
echo ""
echo "🚀 Démarrer le serveur:"
echo "  - Python: python -m http.server 8000"
echo "  - Node: npx http-server"
echo "  - VS Code: Live Server"
echo ""
echo "🔐 Identifiants de test:"
echo "  Admin: admin / admin123"
echo "  User: user / user123"
echo ""
echo "🌐 Accédez à: http://localhost:8000"