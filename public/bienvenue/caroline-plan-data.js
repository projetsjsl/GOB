// Données du plan d'intégration de Caroline
window.carolinePlan = {
    employee: {
        id: 1,
        name: 'Caroline',
        role: 'Conseillère en gestion de patrimoine',
        startDate: '2025-01-06',
        endDate: '2025-01-31',
        context: "Suite aux discussions entre Jean-Sébastien, Jonathan et Annary, ce plan d'intégration détaille l'accueil de Caroline au sein de l'équipe.",
        objective: "Assurer une intégration complète et structurée permettant à Caroline de se familiariser avec tous les outils, processus et membres de l'équipe d'ici la fin du mois de janvier."
    },
    
    resources: [
        { id: 1, name: 'Jean-Sébastien', role: 'Planification financière - Conformité', color: '#EF4444', responsibilities: ['Envoi des documents de conformité et gabarits', 'Sessions de coaching en planification'] },
        { id: 2, name: 'Jonathan', role: 'Coordination générale', color: '#F59E0B', responsibilities: ['Informer les conseillers', 'Coordination générale de l\'intégration'] },
        { id: 3, name: 'Anne-Marie', role: 'Administration', color: '#8B5CF6', responsibilities: ['Formation processus administratifs', 'Coaching Super Lundi', 'Formation Teams et outils'] },
        { id: 4, name: 'Marie-Hélène Lacroix', role: 'Coaching planification', color: '#EC4899', responsibilities: ['Sessions de coaching en planification financière', 'Accompagnement premier dossier'] },
        { id: 5, name: 'Hugo', role: 'Clientèle', color: '#06B6D4', responsibilities: ['Validation de la clientèle assignée', 'Discussion des éléments clés par client'] },
        { id: 6, name: 'Linda', role: 'Support technique', color: '#10B981', responsibilities: ['Formation technique outils essentiels', 'Support synchronisation et accès serveur'] },
        { id: 7, name: 'Conseillers', role: 'Mentorat', color: '#6366F1', responsibilities: ['Observation de rencontres clients', 'Briefings individuels'] }
    ],
    
    phases: [
        { id: 1, name: 'Phase 1 : Arrivée au retour des fêtes', startOffset: 0, duration: 5, description: 'Prise de connaissance des outils et premiers contacts', color: '#3B82F6' },
        { id: 2, name: 'Phase 2 : Première semaine complète', startOffset: 0, duration: 5, description: 'Rencontres intensives en rafale', color: '#8B5CF6' },
        { id: 3, name: 'Phase 3 : Consolidation et pratique', startOffset: 7, duration: 12, description: 'Application des apprentissages', color: '#06B6D4' },
        { id: 4, name: 'Phase 4 : Autonomisation complète', startOffset: 21, duration: 5, description: 'Finalisation de l\'intégration', color: '#10B981' }
    ],
    
    taskTemplates: [
        // Phase 1 - Outils et environnement
        { id: 1, phaseId: 1, title: 'Confirmation adresse courriel', description: 'Valider que l\'adresse courriel reste inchangée', assignedTo: [2], priority: 'high', category: 'administratif', dayOffset: 0 },
        { id: 2, phaseId: 1, title: 'Prévoir accès systèmes et portable', description: 'Coordonner avec IT pour accès et portable', assignedTo: [3], priority: 'high', category: 'technique', dayOffset: 0 },
        { id: 3, phaseId: 1, title: 'Formation Teams et serveur', description: 'Formation sur outils collaboratifs, synchronisation des documents', assignedTo: [3, 6], priority: 'medium', category: 'technique', dayOffset: 1 },
        { id: 4, phaseId: 1, title: 'Rencontre processus administratifs', description: 'Comprendre les processus internes avec Anne-Marie', assignedTo: [3], priority: 'high', category: 'administratif', dayOffset: 1 },
        { id: 5, phaseId: 1, title: 'Super Lundi - Coaching planification', description: 'Session de coaching en planification financière', assignedTo: [3], priority: 'medium', category: 'formation', dayOffset: 0 },
        { id: 6, phaseId: 1, title: 'Formation ouverture de compte', description: 'Processus d\'ouverture de compte et mise à jour', assignedTo: [3], priority: 'medium', category: 'formation', dayOffset: 2 },
        { id: 7, phaseId: 1, title: 'Coaching planification - Session 1', description: 'Première session avec Marie-Hélène Lacroix', assignedTo: [4], priority: 'high', category: 'formation', dayOffset: 1 },
        { id: 8, phaseId: 1, title: 'Réception documents conformité', description: 'Documents de Jean-Sébastien: conformité, processus, gabarits', assignedTo: [1], priority: 'high', category: 'documentation', dayOffset: 0 },
        { id: 9, phaseId: 1, title: 'Lecture documents préparatoires', description: 'Prendre connaissance des documents envoyés', assignedTo: [], priority: 'medium', category: 'auto-formation', dayOffset: 3 },
        { id: 10, phaseId: 1, title: 'Observation rencontre client 1', description: 'Observer une rencontre avec un conseiller', assignedTo: [7], priority: 'medium', category: 'immersion', dayOffset: 2 },
        { id: 11, phaseId: 1, title: 'Rencontre Hugo - Validation clientèle', description: 'Discussion sur la clientèle assignée et éléments clés', assignedTo: [5], priority: 'high', category: 'clientèle', dayOffset: 3 },
        { id: 12, phaseId: 1, title: 'Information aux conseillers', description: 'Jonathan informe les conseillers de la prise de contact', assignedTo: [2], priority: 'high', category: 'coordination', dayOffset: 0 },
        
        // Phase 2
        { id: 13, phaseId: 2, title: 'Rencontres intensives intervenants', description: 'Sessions avec tous les intervenants clés', assignedTo: [1, 2, 3, 4], priority: 'high', category: 'formation', dayOffset: 4 },
        { id: 14, phaseId: 2, title: 'Observations rencontres clients', description: 'Assister à plusieurs rencontres clients', assignedTo: [7], priority: 'medium', category: 'immersion', dayOffset: 4 },
        { id: 15, phaseId: 2, title: 'Appropriation outils de base', description: 'Teams, serveur, documents', assignedTo: [3, 6], priority: 'medium', category: 'technique', dayOffset: 4 },
        { id: 16, phaseId: 2, title: 'Réévaluation fin de semaine', description: 'Point de contrôle et ajustements du plan', assignedTo: [2], priority: 'high', category: 'suivi', dayOffset: 4 },
        
        // Phase 3
        { id: 17, phaseId: 3, title: 'Réalisation entrevues clients', description: 'Commencer à mener des entrevues ou assister', assignedTo: [7], priority: 'high', category: 'pratique', dayOffset: 11 },
        { id: 18, phaseId: 3, title: 'Premier dossier planification', description: 'Préparer premier dossier avec Marie-Hélène', assignedTo: [4], priority: 'high', category: 'pratique', dayOffset: 14 },
        { id: 19, phaseId: 3, title: 'Appropriation outils complète', description: 'Maîtriser tous les outils de travail', assignedTo: [], priority: 'medium', category: 'auto-formation', dayOffset: 18 },
        { id: 20, phaseId: 3, title: 'Pratique processus administratifs', description: 'Pratique supervisée des processus', assignedTo: [3], priority: 'medium', category: 'pratique', dayOffset: 15 },
        { id: 21, phaseId: 3, title: 'Briefing conseillers individuels', description: 'Rencontre avec chaque conseiller assigné', assignedTo: [7], priority: 'high', category: 'clientèle', dayOffset: 16 },
        { id: 22, phaseId: 3, title: 'Validation mi-janvier', description: 'Validation progression et besoins supplémentaires', assignedTo: [2], priority: 'high', category: 'suivi', dayOffset: 12 },
        
        // Phase 4
        { id: 23, phaseId: 4, title: 'Finalisation discussions conseillers', description: 'Compléter toutes les discussions avec conseillers', assignedTo: [7], priority: 'high', category: 'clientèle', dayOffset: 23 },
        { id: 24, phaseId: 4, title: 'Validation maîtrise outils', description: 'Confirmer l\'autonomie sur les outils et processus', assignedTo: [3, 6], priority: 'medium', category: 'validation', dayOffset: 24 },
        { id: 25, phaseId: 4, title: 'Premier dossier complété', description: 'Finalisation du premier dossier de planification', assignedTo: [4], priority: 'high', category: 'pratique', dayOffset: 24 },
        { id: 26, phaseId: 4, title: 'Connaissance clientèle assignée', description: 'Connaissance approfondie de la clientèle', assignedTo: [5], priority: 'high', category: 'clientèle', dayOffset: 24 },
        { id: 27, phaseId: 4, title: 'Bilan intégration complet', description: 'Évaluation finale et planification de la suite', assignedTo: [2], priority: 'high', category: 'suivi', dayOffset: 25 }
    ],
    
    checkpoints: [
        { date: 'Fin semaine 1', description: 'Réévaluation du plan et ajustements si nécessaire' },
        { date: 'Mi-janvier', description: 'Validation de la progression et identification des besoins supplémentaires' },
        { date: 'Fin janvier', description: 'Bilan complet de l\'intégration et planification de la suite' }
    ]
};
