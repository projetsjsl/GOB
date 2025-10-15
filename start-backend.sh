#!/bin/bash

# Script pour démarrer le backend API du Calendrier Économique

echo "🚀 Démarrage du Backend API Finviz Calendar..."

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Créer un environnement virtuel s'il n'existe pas
if [ ! -d "backend/venv" ]; then
    echo "📦 Création de l'environnement virtuel..."
    cd backend
    python3 -m venv venv
    cd ..
fi

# Activer l'environnement virtuel
echo "🔧 Activation de l'environnement virtuel..."
source backend/venv/bin/activate

# Installer les dépendances
echo "📚 Installation des dépendances..."
cd backend
pip install -r requirements.txt

# Démarrer l'API
echo "🌐 Démarrage de l'API sur http://localhost:5000..."
echo "📡 Endpoints disponibles:"
echo "   - GET /api/calendar/economic"
echo "   - GET /api/calendar/earnings"
echo "   - GET /api/calendar/dividends"
echo "   - GET /api/health"
echo ""
echo "🛑 Pour arrêter le serveur, appuyez sur Ctrl+C"
echo ""

python app.py

