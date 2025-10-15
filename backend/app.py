#!/usr/bin/env python3
"""
Backend API Flask pour le Calendrier Économique Finviz
Scrape les données de https://finviz.com/calendar.ashx
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta
import re
import time

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://localhost:5173",
            "http://localhost:8080",
            "https://gob-apps.vercel.app",
            "https://*.vercel.app"
        ]
    }
})

class FinvizCalendarScraper:
    def __init__(self):
        self.base_url = "https://finviz.com/calendar.ashx"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
    
    def get_impact_level(self, impact_text):
        """Convertit le texte d'impact en niveau numérique (1-3)"""
        if not impact_text:
            return 1
        
        impact_lower = impact_text.lower().strip()
        if 'high' in impact_lower or 'haute' in impact_lower:
            return 3
        elif 'medium' in impact_lower or 'moyenne' in impact_lower:
            return 2
        else:
            return 1
    
    def parse_economic_calendar(self, html_content):
        """Parse le calendrier économique depuis le HTML de Finviz"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Trouver la table du calendrier
        calendar_table = soup.find('table', {'class': 'calendar'})
        if not calendar_table:
            return []
        
        events_by_date = {}
        current_date = None
        
        # Parcourir les lignes de la table
        for row in calendar_table.find_all('tr'):
            cells = row.find_all(['td', 'th'])
            if len(cells) < 6:
                continue
            
            # Vérifier si c'est une ligne de date
            first_cell = cells[0].get_text(strip=True)
            if re.match(r'[A-Za-z]{3}\s+\d{1,2}', first_cell):
                current_date = first_cell
                if current_date not in events_by_date:
                    events_by_date[current_date] = []
                continue
            
            # Vérifier si c'est une ligne d'événement
            if current_date and len(cells) >= 7:
                try:
                    time_text = cells[0].get_text(strip=True)
                    currency = cells[1].get_text(strip=True)
                    impact_text = cells[2].get_text(strip=True)
                    event_name = cells[3].get_text(strip=True)
                    actual = cells[4].get_text(strip=True)
                    forecast = cells[5].get_text(strip=True)
                    previous = cells[6].get_text(strip=True)
                    
                    # Nettoyer les données
                    if not time_text or time_text == '-':
                        time_text = 'TBD'
                    
                    if not event_name or event_name == '-':
                        continue
                    
                    event = {
                        'time': time_text,
                        'currency': currency if currency != '-' else 'USD',
                        'impact': self.get_impact_level(impact_text),
                        'event': event_name,
                        'actual': actual if actual != '-' else 'N/A',
                        'forecast': forecast if forecast != '-' else 'N/A',
                        'previous': previous if previous != '-' else 'N/A'
                    }
                    
                    events_by_date[current_date].append(event)
                    
                except Exception as e:
                    print(f"Erreur parsing ligne: {e}")
                    continue
        
        # Convertir en format attendu par le frontend
        result = []
        for date, events in events_by_date.items():
            if events:  # Seulement ajouter les dates avec des événements
                result.append({
                    'date': date,
                    'events': events
                })
        
        return result
    
    def fetch_economic_calendar(self):
        """Récupère le calendrier économique depuis Finviz"""
        try:
            print("🔄 Récupération du calendrier économique depuis Finviz...")
            
            # Ajouter un petit délai pour éviter d'être bloqué
            time.sleep(1)
            
            response = requests.get(self.base_url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            print(f"✅ Réponse reçue: {response.status_code}")
            
            # Parser le contenu
            events = self.parse_economic_calendar(response.text)
            
            print(f"📊 {len(events)} jours d'événements trouvés")
            
            return {
                'success': True,
                'data': events,
                'source': 'finviz.com',
                'timestamp': datetime.now().isoformat()
            }
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Erreur de requête: {e}")
            return {
                'success': False,
                'error': f'Erreur de connexion: {str(e)}',
                'data': self.get_fallback_data()
            }
        except Exception as e:
            print(f"❌ Erreur générale: {e}")
            return {
                'success': False,
                'error': f'Erreur de parsing: {str(e)}',
                'data': self.get_fallback_data()
            }
    
    def get_fallback_data(self):
        """Données de fallback en cas d'erreur"""
        return [
            {
                'date': 'Mon Oct 13',
                'events': [
                    {
                        'time': '08:30 AM',
                        'currency': 'USD',
                        'impact': 3,
                        'event': 'NY Empire State Manufacturing Index',
                        'actual': '10.70',
                        'forecast': '-1.00',
                        'previous': '-8.70'
                    },
                    {
                        'time': '08:30 AM',
                        'currency': 'USD',
                        'impact': 3,
                        'event': 'Inflation Rate MoM',
                        'actual': 'N/A',
                        'forecast': '0.3%',
                        'previous': '0.4%'
                    },
                    {
                        'time': '12:55 PM',
                        'currency': 'USD',
                        'impact': 1,
                        'event': 'Fed Paulson Speech',
                        'actual': 'N/A',
                        'forecast': 'N/A',
                        'previous': 'N/A'
                    }
                ]
            }
        ]

# Instance globale du scraper
scraper = FinvizCalendarScraper()

@app.route('/api/calendar/economic', methods=['GET'])
def get_economic_calendar():
    """Endpoint pour récupérer le calendrier économique"""
    try:
        result = scraper.fetch_economic_calendar()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erreur serveur: {str(e)}',
            'data': scraper.get_fallback_data()
        }), 500

@app.route('/api/calendar/earnings', methods=['GET'])
def get_earnings_calendar():
    """Endpoint pour récupérer le calendrier des earnings (placeholder)"""
    # Pour l'instant, retourner des données de démonstration
    return jsonify({
        'success': True,
        'data': [
            {
                'date': 'Mon Oct 13',
                'events': [
                    {
                        'time': 'Before Market',
                        'currency': 'USD',
                        'impact': 3,
                        'event': 'AAPL Earnings Q3 2024',
                        'actual': 'N/A',
                        'forecast': '$1.25 EPS',
                        'previous': '$1.20 EPS'
                    },
                    {
                        'time': 'After Market',
                        'currency': 'USD',
                        'impact': 2,
                        'event': 'MSFT Earnings Q3 2024',
                        'actual': 'N/A',
                        'forecast': '$2.85 EPS',
                        'previous': '$2.69 EPS'
                    }
                ]
            }
        ],
        'source': 'demo',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/calendar/dividends', methods=['GET'])
def get_dividends_calendar():
    """Endpoint pour récupérer le calendrier des dividendes (placeholder)"""
    # Pour l'instant, retourner des données de démonstration
    return jsonify({
        'success': True,
        'data': [
            {
                'date': 'Mon Oct 13',
                'events': [
                    {
                        'time': 'Ex-Date',
                        'currency': 'USD',
                        'impact': 1,
                        'event': 'JNJ Dividend Payment',
                        'actual': 'N/A',
                        'forecast': '$1.13',
                        'previous': '$1.13'
                    },
                    {
                        'time': 'Pay Date',
                        'currency': 'USD',
                        'impact': 1,
                        'event': 'PG Dividend Payment',
                        'actual': 'N/A',
                        'forecast': '$0.94',
                        'previous': '$0.94'
                    }
                ]
            }
        ],
        'source': 'demo',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de santé pour vérifier que l'API fonctionne"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Finviz Calendar API'
    })

@app.route('/', methods=['GET'])
def root():
    """Page d'accueil de l'API"""
    return jsonify({
        'message': 'Finviz Calendar API',
        'version': '1.0.0',
        'endpoints': [
            '/api/calendar/economic',
            '/api/calendar/earnings', 
            '/api/calendar/dividends',
            '/api/health'
        ]
    })

if __name__ == '__main__':
    print("🚀 Démarrage de l'API Finviz Calendar...")
    print("📡 Endpoints disponibles:")
    print("   - GET /api/calendar/economic")
    print("   - GET /api/calendar/earnings")
    print("   - GET /api/calendar/dividends")
    print("   - GET /api/health")
    print("🌐 Serveur démarré sur http://0.0.0.0:5001")
    
    app.run(host='0.0.0.0', port=5001, debug=True)

