import { Command } from '../types';

export const DEFAULT_COMMANDS: Command[] = [
  // --- Analyse Boursiere & Entreprises ---
  { id: 'c1', category: 'Bourse', label: ' Analyse Tesla', text: "Fais une analyse strategique approfondie (Deep Think) sur Tesla, ses risques et opportunites a court et long terme." },
  { id: 'c2', category: 'Bourse', label: ' Resultats Nvidia', text: "Quels sont les derniers resultats financiers de Nvidia et quelle a ete la reaction du marche ?" },
  { id: 'c3', category: 'Bourse', label: ' Valuation Apple', text: "Est-ce que l'action Apple est actuellement surevaluee par rapport a ses fondamentaux historiques ?" },
  { id: 'c4', category: 'Bourse', label: ' Dividende Total', text: "Quel est le rendement du dividende de TotalEnergies est-il considere comme durable ?" },

  // --- Economie & Politique ---
  { id: 'e1', category: 'Economie', label: ' Taux FED', text: "Quel est l'impact des derniers taux directeurs de la FED sur les valeurs technologiques de croissance ?" },
  { id: 'e2', category: 'Economie', label: ' Inflation Euro', text: "Analyse les derniers chiffres de l'inflation en zone Euro et l'impact potentiel sur le CAC40." },
  { id: 'e3', category: 'Politique', label: ' Elections US', text: "Comment les prochaines elections americaines pourraient-elles influencer le secteur de l'energie et de la defense ?" },
  { id: 'e4', category: 'Politique', label: ' Impact Chine', text: "Analyse l'impact des nouvelles regulations chinoises sur le marche du luxe europeen (LVMH, Kering)." },

  // --- Gestion de Portefeuille ---
  { id: 'p1', category: 'Portefeuille', label: ' Diversification', text: "Propose une strategie de diversification pour un portefeuille actuellement trop expose au secteur Tech americain." },
  { id: 'p2', category: 'Portefeuille', label: ' Valeurs Refuges', text: "Quelles sont les meilleures valeurs refuges (Or, Obligations, etc.) dans le contexte d'incertitude economique actuel ?" },
  { id: 'p3', category: 'Portefeuille', label: ' Hydrogene', text: "Faut-il investir dans le secteur de l'hydrogene maintenant ? Analyse les risques et le potentiel de croissance." },
  { id: 'p4', category: 'Portefeuille', label: ' Rotation Sectorielle', text: "Explique la rotation sectorielle actuelle : quels secteurs faut-il privilegier en ce moment ?" },

  // --- Actualites & Marches ---
  { id: 'n1', category: 'Actu', label: ' Gros Titres', text: "Quels sont les 3 faits marquants qui font bouger les marches boursiers aujourd'hui ?" },
  { id: 'n2', category: 'Actu', label: ' Crypto Trend', text: "Quelle est la tendance actuelle sur le Bitcoin et l'Ethereum (Bullish ou Bearish) ?" },
  { id: 'n3', category: 'Actu', label: ' Petrole & Or', text: "Donne-moi un point precis sur l'evolution des matieres premieres (Petrole Brent et Or)." },
];
