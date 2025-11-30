import { Command } from '../types';

export const DEFAULT_COMMANDS: Command[] = [
  // --- Analyse Boursière & Entreprises ---
  { id: 'c1', category: 'Bourse', label: '🧠 Analyse Tesla', text: "Fais une analyse stratégique approfondie (Deep Think) sur Tesla, ses risques et opportunités à court et long terme." },
  { id: 'c2', category: 'Bourse', label: '📊 Résultats Nvidia', text: "Quels sont les derniers résultats financiers de Nvidia et quelle a été la réaction du marché ?" },
  { id: 'c3', category: 'Bourse', label: '🍎 Valuation Apple', text: "Est-ce que l'action Apple est actuellement surévaluée par rapport à ses fondamentaux historiques ?" },
  { id: 'c4', category: 'Bourse', label: '💰 Dividende Total', text: "Quel est le rendement du dividende de TotalEnergies est-il considéré comme durable ?" },

  // --- Économie & Politique ---
  { id: 'e1', category: 'Économie', label: '🏦 Taux FED', text: "Quel est l'impact des derniers taux directeurs de la FED sur les valeurs technologiques de croissance ?" },
  { id: 'e2', category: 'Économie', label: '📉 Inflation Euro', text: "Analyse les derniers chiffres de l'inflation en zone Euro et l'impact potentiel sur le CAC40." },
  { id: 'e3', category: 'Politique', label: '🇺🇸 Élections US', text: "Comment les prochaines élections américaines pourraient-elles influencer le secteur de l'énergie et de la défense ?" },
  { id: 'e4', category: 'Politique', label: '🇨🇳 Impact Chine', text: "Analyse l'impact des nouvelles régulations chinoises sur le marché du luxe européen (LVMH, Kering)." },

  // --- Gestion de Portefeuille ---
  { id: 'p1', category: 'Portefeuille', label: '⚖️ Diversification', text: "Propose une stratégie de diversification pour un portefeuille actuellement trop exposé au secteur Tech américain." },
  { id: 'p2', category: 'Portefeuille', label: '🛡️ Valeurs Refuges', text: "Quelles sont les meilleures valeurs refuges (Or, Obligations, etc.) dans le contexte d'incertitude économique actuel ?" },
  { id: 'p3', category: 'Portefeuille', label: '🌊 Hydrogène', text: "Faut-il investir dans le secteur de l'hydrogène maintenant ? Analyse les risques et le potentiel de croissance." },
  { id: 'p4', category: 'Portefeuille', label: '🔄 Rotation Sectorielle', text: "Explique la rotation sectorielle actuelle : quels secteurs faut-il privilégier en ce moment ?" },

  // --- Actualités & Marchés ---
  { id: 'n1', category: 'Actu', label: '📰 Gros Titres', text: "Quels sont les 3 faits marquants qui font bouger les marchés boursiers aujourd'hui ?" },
  { id: 'n2', category: 'Actu', label: '₿ Crypto Trend', text: "Quelle est la tendance actuelle sur le Bitcoin et l'Ethereum (Bullish ou Bearish) ?" },
  { id: 'n3', category: 'Actu', label: '🛢️ Pétrole & Or', text: "Donne-moi un point précis sur l'évolution des matières premières (Pétrole Brent et Or)." },
];
