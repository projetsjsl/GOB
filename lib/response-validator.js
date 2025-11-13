/**
 * RESPONSE VALIDATOR
 *
 * Système de validation sémantique des réponses d'Emma
 * S'assure que chaque réponse :
 * - Répond bien à la question posée
 * - Est alignée avec les compétences d'Emma
 * - Est cohérente et complète
 * - Contient les informations attendues selon le type de requête
 * - Ne contient pas d'erreurs ou d'incohérences
 *
 * Utilise une approche multi-critères pour évaluer la qualité
 */

export class ResponseValidator {
    constructor() {
        // Critères de validation par type d'intention
        this.validationCriteria = {
            stock_price: {
                required_elements: ['prix', 'price', '$', '€', 'USD', 'CAD'],
                forbidden_elements: ['je ne peux pas', 'pas accès', 'unavailable'],
                min_length: 50,
                expected_structure: ['ticker', 'price', 'change']
            },
            fundamentals: {
                required_elements: ['p/e', 'pe', 'ratio', 'marge', 'margin', 'roe', 'debt', 'dette'],
                forbidden_elements: ['je ne peux pas', 'pas accès'],
                min_length: 150,
                expected_structure: ['metrics', 'explanation']
            },
            technical_analysis: {
                required_elements: ['rsi', 'macd', 'moyennes', 'moving average', 'support', 'résistance'],
                forbidden_elements: ['je ne peux pas'],
                min_length: 100,
                expected_structure: ['indicators', 'interpretation']
            },
            news: {
                required_elements: ['actualité', 'news', 'annonce', 'nouvelles'],
                forbidden_elements: ['je ne peux pas', 'pas d\'actualités'],
                min_length: 80,
                expected_structure: ['headline', 'summary']
            },
            comprehensive_analysis: {
                required_elements: ['valorisation', 'valuation', 'performance', 'risque', 'recommandation'],
                forbidden_elements: [],
                min_length: 500,
                expected_structure: ['valuation', 'performance', 'risks', 'recommendation']
            },
            comparative_analysis: {
                required_elements: ['comparer', 'comparison', 'vs', 'versus', 'différence'],
                forbidden_elements: [],
                min_length: 200,
                expected_structure: ['company1', 'company2', 'comparison']
            },
            earnings: {
                required_elements: ['résultats', 'earnings', 'revenus', 'revenue', 'bénéfices'],
                forbidden_elements: [],
                min_length: 100,
                expected_structure: ['revenue', 'earnings', 'guidance']
            },
            market_overview: {
                required_elements: ['marché', 'market', 'indice', 'index', 'secteur'],
                forbidden_elements: [],
                min_length: 100,
                expected_structure: ['market_status', 'sectors']
            },
            economic_analysis: {
                required_elements: ['économie', 'economy', 'taux', 'rate', 'inflation', 'fed'],
                forbidden_elements: [],
                min_length: 100,
                expected_structure: ['indicators', 'analysis']
            },
            recommendation: {
                required_elements: ['recommandation', 'recommendation', 'avis', 'opinion'],
                forbidden_elements: ['je ne peux pas donner de conseil'],
                min_length: 150,
                expected_structure: ['analysis', 'recommendation', 'disclaimer']
            },
            portfolio: {
                required_elements: ['watchlist', 'portfolio', 'ticker'],
                forbidden_elements: [],
                min_length: 50,
                expected_structure: ['list']
            },
            greeting: {
                required_elements: ['emma', 'bonjour', 'hello'],
                forbidden_elements: [],
                min_length: 30,
                expected_structure: ['greeting', 'capabilities']
            },
            help: {
                required_elements: ['aide', 'help', 'capacité', 'capability', 'compétence'],
                forbidden_elements: [],
                min_length: 100,
                expected_structure: ['explanation', 'examples']
            },
            general_conversation: {
                required_elements: [],
                forbidden_elements: [],
                min_length: 20,
                expected_structure: []
            }
        };

        // Patterns d'erreurs courantes à détecter
        this.errorPatterns = [
            { pattern: /je ne (sais|peux) pas/i, severity: 'high', message: 'Réponse négative' },
            { pattern: /erreur|error/i, severity: 'high', message: 'Mention d\'erreur' },
            { pattern: /indisponible|unavailable/i, severity: 'medium', message: 'Service indisponible' },
            { pattern: /désolé|sorry/i, severity: 'medium', message: 'Excuse' },
            { pattern: /(\d+)\s*\$\s*.*\s*(\d+)\s*\$/i, severity: 'low', message: 'Prix multiples (vérifier cohérence)' },
            { pattern: /données (non|in)disponibles?/i, severity: 'high', message: 'Données non disponibles' }
        ];

        // Patterns de redondance à détecter
        this.redundancyPatterns = [
            { pattern: /(.{20,})\1/i, severity: 'medium', message: 'Répétition détectée' },
            { pattern: /(emma|assistant|ia).{10,}(emma|assistant|ia)/i, severity: 'low', message: 'Mentions multiples d\'Emma' }
        ];
    }

    /**
     * Valide une réponse avant envoi
     *
     * @param {string} response - La réponse à valider
     * @param {object} context - Contexte de la requête (intent, tickers, etc.)
     * @returns {object} - Résultat de validation avec score et suggestions
     */
    validate(response, context = {}) {
        const intent = context.intent || 'general_conversation';
        const userMessage = context.userMessage || '';
        const tickers = context.tickers || [];

        console.log(`🔍 [Response Validator] Validating response for intent: ${intent}`);

        // Scores de validation (0-1)
        const scores = {
            relevance: 0,           // Pertinence par rapport à la question
            completeness: 0,        // Complétude de la réponse
            coherence: 0,           // Cohérence et absence de contradictions
            alignment: 0,           // Alignement avec les compétences d'Emma
            quality: 0              // Qualité globale
        };

        const issues = [];
        const suggestions = [];

        // 1. VALIDATION DE LA PERTINENCE
        const relevanceResult = this._validateRelevance(response, userMessage, intent);
        scores.relevance = relevanceResult.score;
        issues.push(...relevanceResult.issues);
        suggestions.push(...relevanceResult.suggestions);

        // 2. VALIDATION DE LA COMPLÉTUDE
        const completenessResult = this._validateCompleteness(response, intent, tickers);
        scores.completeness = completenessResult.score;
        issues.push(...completenessResult.issues);
        suggestions.push(...completenessResult.suggestions);

        // 3. VALIDATION DE LA COHÉRENCE
        const coherenceResult = this._validateCoherence(response);
        scores.coherence = coherenceResult.score;
        issues.push(...coherenceResult.issues);
        suggestions.push(...coherenceResult.suggestions);

        // 4. VALIDATION DE L'ALIGNEMENT AVEC LES COMPÉTENCES
        const alignmentResult = this._validateAlignment(response, intent, context);
        scores.alignment = alignmentResult.score;
        issues.push(...alignmentResult.issues);
        suggestions.push(...alignmentResult.suggestions);

        // 5. DÉTECTION D'ERREURS
        const errorResult = this._detectErrors(response);
        issues.push(...errorResult.issues);
        suggestions.push(...errorResult.suggestions);

        // 6. CALCUL DU SCORE GLOBAL
        const weights = {
            relevance: 0.3,
            completeness: 0.25,
            coherence: 0.2,
            alignment: 0.15,
            quality: 0.1
        };

        // Qualité = moyenne des autres scores
        scores.quality = (scores.relevance + scores.completeness + scores.coherence + scores.alignment) / 4;

        const globalScore =
            scores.relevance * weights.relevance +
            scores.completeness * weights.completeness +
            scores.coherence * weights.coherence +
            scores.alignment * weights.alignment +
            scores.quality * weights.quality;

        // 7. DÉTERMINER SI LA RÉPONSE EST ACCEPTABLE
        const isValid = globalScore >= 0.7 && !issues.some(i => i.severity === 'critical');

        // 8. CONSTRUIRE LE RÉSULTAT
        const validationResult = {
            valid: isValid,
            score: globalScore,
            scores: scores,
            issues: issues,
            suggestions: suggestions,
            confidence: this._calculateConfidence(scores, issues),
            needs_improvement: globalScore < 0.8,
            critical_issues: issues.filter(i => i.severity === 'critical').length
        };

        // Logger les résultats
        console.log(`✅ [Response Validator] Valid: ${isValid}, Score: ${globalScore.toFixed(2)}, Issues: ${issues.length}`);
        if (issues.length > 0) {
            console.log(`⚠️ [Response Validator] Issues:`, issues.map(i => i.message).join(', '));
        }

        return validationResult;
    }

    /**
     * Valide la pertinence de la réponse par rapport à la question
     */
    _validateRelevance(response, userMessage, intent) {
        const responseLower = response.toLowerCase();
        const messageLower = userMessage.toLowerCase();
        let score = 0.5; // Score de base
        const issues = [];
        const suggestions = [];

        // Extraire les mots-clés de la question
        const questionKeywords = this._extractKeywords(messageLower);

        // Vérifier si les mots-clés de la question sont présents dans la réponse
        const keywordsInResponse = questionKeywords.filter(kw =>
            responseLower.includes(kw)
        );

        // Score basé sur la présence des mots-clés
        if (questionKeywords.length > 0) {
            score = keywordsInResponse.length / questionKeywords.length;
        }

        // Pénalité si la réponse semble hors-sujet
        if (score < 0.3) {
            issues.push({
                type: 'relevance',
                severity: 'high',
                message: 'La réponse semble hors-sujet',
                details: `Seulement ${keywordsInResponse.length}/${questionKeywords.length} mots-clés présents`
            });
            suggestions.push('Assurez-vous que la réponse aborde directement la question posée');
        }

        // Bonus si la réponse mentionne le sujet principal
        const criteria = this.validationCriteria[intent];
        if (criteria && criteria.required_elements.some(el => responseLower.includes(el.toLowerCase()))) {
            score = Math.min(1.0, score + 0.2);
        }

        return { score, issues, suggestions };
    }

    /**
     * Valide la complétude de la réponse
     */
    _validateCompleteness(response, intent, tickers = []) {
        let score = 0.5;
        const issues = [];
        const suggestions = [];

        const criteria = this.validationCriteria[intent] || this.validationCriteria['general_conversation'];

        // 1. Vérifier la longueur minimale
        if (response.length < criteria.min_length) {
            issues.push({
                type: 'completeness',
                severity: 'medium',
                message: 'Réponse trop courte',
                details: `${response.length} caractères (minimum: ${criteria.min_length})`
            });
            score -= 0.3;
        } else {
            score += 0.2;
        }

        // 2. Vérifier la présence des éléments requis
        const responseLower = response.toLowerCase();
        const requiredPresent = criteria.required_elements.filter(el =>
            responseLower.includes(el.toLowerCase())
        );

        if (criteria.required_elements.length > 0) {
            const requiredScore = requiredPresent.length / criteria.required_elements.length;
            score = (score + requiredScore) / 2;

            if (requiredScore < 0.5) {
                issues.push({
                    type: 'completeness',
                    severity: 'high',
                    message: 'Éléments requis manquants',
                    details: `${requiredPresent.length}/${criteria.required_elements.length} éléments présents`
                });
                suggestions.push(`Assurez-vous d'inclure: ${criteria.required_elements.slice(0, 3).join(', ')}`);
            }
        }

        // 3. Vérifier la présence de tickers mentionnés
        if (tickers.length > 0) {
            const tickersInResponse = tickers.filter(ticker =>
                response.toUpperCase().includes(ticker.toUpperCase())
            );

            if (tickersInResponse.length === 0) {
                issues.push({
                    type: 'completeness',
                    severity: 'medium',
                    message: 'Tickers non mentionnés dans la réponse',
                    details: `Tickers attendus: ${tickers.join(', ')}`
                });
                score -= 0.2;
            }
        }

        // 4. Vérifier l'absence d'éléments interdits
        const forbiddenPresent = criteria.forbidden_elements.filter(el =>
            responseLower.includes(el.toLowerCase())
        );

        if (forbiddenPresent.length > 0) {
            issues.push({
                type: 'completeness',
                severity: 'critical',
                message: 'Réponse contient des éléments interdits',
                details: `Trouvé: ${forbiddenPresent.join(', ')}`
            });
            score -= 0.5;
        }

        return { score: Math.max(0, Math.min(1, score)), issues, suggestions };
    }

    /**
     * Valide la cohérence de la réponse
     */
    _validateCoherence(response) {
        let score = 0.8; // Score de base
        const issues = [];
        const suggestions = [];

        // 1. Détecter les répétitions
        for (const { pattern, severity, message } of this.redundancyPatterns) {
            if (pattern.test(response)) {
                issues.push({
                    type: 'coherence',
                    severity: severity,
                    message: message
                });
                score -= 0.1;
            }
        }

        // 2. Vérifier la structure (paragraphes, phrases cohérentes)
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length < 2 && response.length > 200) {
            issues.push({
                type: 'coherence',
                severity: 'low',
                message: 'Manque de structure (peu de phrases)'
            });
            score -= 0.1;
        }

        // 3. Vérifier l'absence de contradictions (prix différents, dates incohérentes)
        const priceMatches = response.match(/\$\s*[\d,]+(\.\d{2})?/g);
        if (priceMatches && priceMatches.length > 1) {
            // Vérifier si les prix sont cohérents (variation < 50%)
            const prices = priceMatches.map(p => parseFloat(p.replace(/[$,]/g, '')));
            const maxPrice = Math.max(...prices);
            const minPrice = Math.min(...prices);
            if (maxPrice / minPrice > 1.5) {
                issues.push({
                    type: 'coherence',
                    severity: 'medium',
                    message: 'Prix incohérents détectés',
                    details: `Variation de ${((maxPrice / minPrice - 1) * 100).toFixed(0)}%`
                });
                score -= 0.2;
            }
        }

        return { score: Math.max(0, Math.min(1, score)), issues, suggestions };
    }

    /**
     * Valide l'alignement avec les compétences d'Emma
     */
    _validateAlignment(response, intent, context) {
        let score = 0.8;
        const issues = [];
        const suggestions = [];

        const responseLower = response.toLowerCase();

        // 1. Vérifier que Emma ne dépasse pas ses compétences
        const overreachPatterns = [
            { pattern: /je recommande fortement/i, message: 'Emma ne devrait pas donner de recommandations fermes' },
            { pattern: /vous devriez (acheter|vendre)/i, message: 'Emma ne devrait pas donner de conseils d\'investissement directs' },
            { pattern: /investissez dans/i, message: 'Emma ne devrait pas dire "investissez"' },
            { pattern: /c'est une excellente opportunité/i, message: 'Emma ne devrait pas être trop directive' }
        ];

        for (const { pattern, message } of overreachPatterns) {
            if (pattern.test(response)) {
                issues.push({
                    type: 'alignment',
                    severity: 'high',
                    message: message
                });
                score -= 0.3;
                suggestions.push('Utilisez un langage plus nuancé et ajoutez des disclaimers');
            }
        }

        // 2. Vérifier la présence de disclaimers pour les recommandations
        if (intent === 'recommendation') {
            const hasDisclaimer = [
                'ceci n\'est pas un conseil',
                'consultez un conseiller',
                'this is not financial advice',
                'faites vos propres recherches',
                'dyor'
            ].some(disclaimer => responseLower.includes(disclaimer));

            if (!hasDisclaimer) {
                issues.push({
                    type: 'alignment',
                    severity: 'medium',
                    message: 'Recommandation sans disclaimer'
                });
                score -= 0.2;
                suggestions.push('Ajoutez un disclaimer pour les recommandations');
            }
        }

        // 3. Vérifier que Emma mentionne ses sources pour les analyses factuelles
        const factualIntents = ['stock_price', 'fundamentals', 'news', 'comprehensive_analysis', 'earnings'];
        if (factualIntents.includes(intent)) {
            const hasSources = [
                'source', 'selon', 'based on', 'd\'après', 'fmp', 'polygon', 'finnhub'
            ].some(sourceWord => responseLower.includes(sourceWord));

            if (!hasSources && response.length > 200) {
                issues.push({
                    type: 'alignment',
                    severity: 'low',
                    message: 'Manque de mention de sources pour une analyse factuelle'
                });
                score -= 0.1;
                suggestions.push('Mentionnez les sources de données utilisées');
            }
        }

        return { score: Math.max(0, Math.min(1, score)), issues, suggestions };
    }

    /**
     * Détecte les erreurs dans la réponse
     */
    _detectErrors(response) {
        const issues = [];
        const suggestions = [];

        // Appliquer les patterns d'erreurs
        for (const { pattern, severity, message } of this.errorPatterns) {
            if (pattern.test(response)) {
                issues.push({
                    type: 'error',
                    severity: severity,
                    message: message
                });

                if (severity === 'high') {
                    suggestions.push(`Problème détecté: ${message}. Vérifiez que les outils ont bien retourné des données.`);
                }
            }
        }

        return { issues, suggestions };
    }

    /**
     * Calcule un score de confiance global
     */
    _calculateConfidence(scores, issues) {
        // Score de base = moyenne des scores individuels
        const avgScore = (scores.relevance + scores.completeness + scores.coherence + scores.alignment) / 4;

        // Pénalité selon la gravité des issues
        const criticalCount = issues.filter(i => i.severity === 'critical').length;
        const highCount = issues.filter(i => i.severity === 'high').length;
        const mediumCount = issues.filter(i => i.severity === 'medium').length;

        let penalty = criticalCount * 0.3 + highCount * 0.15 + mediumCount * 0.05;

        return Math.max(0, Math.min(1, avgScore - penalty));
    }

    /**
     * Extrait les mots-clés d'un texte
     */
    _extractKeywords(text) {
        // Mots à ignorer (stop words)
        const stopWords = [
            'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'à', 'au', 'et', 'ou', 'mais',
            'donc', 'or', 'ni', 'car', 'ce', 'qui', 'que', 'quoi', 'dont', 'où', 'comment',
            'pourquoi', 'quand', 'est', 'sont', 'être', 'avoir', 'faire', 'the', 'a', 'an',
            'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
        ];

        // Tokeniser et filtrer
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.includes(word));

        // Retourner les mots uniques
        return [...new Set(words)];
    }

    /**
     * Suggère des améliorations pour une réponse invalide
     *
     * @param {object} validationResult - Résultat de la validation
     * @returns {string} - Texte d'amélioration suggérée
     */
    suggestImprovements(validationResult) {
        if (validationResult.valid && validationResult.score >= 0.8) {
            return 'Réponse validée - aucune amélioration nécessaire';
        }

        let improvements = '📝 Suggestions d\'amélioration :\n\n';

        // Issues critiques
        const criticalIssues = validationResult.issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
            improvements += '🚨 Issues critiques à corriger :\n';
            criticalIssues.forEach((issue, idx) => {
                improvements += `${idx + 1}. ${issue.message}\n`;
                if (issue.details) improvements += `   → ${issue.details}\n`;
            });
            improvements += '\n';
        }

        // Suggestions
        if (validationResult.suggestions.length > 0) {
            improvements += '💡 Suggestions :\n';
            validationResult.suggestions.forEach((suggestion, idx) => {
                improvements += `${idx + 1}. ${suggestion}\n`;
            });
        }

        return improvements;
    }
}

export default ResponseValidator;
