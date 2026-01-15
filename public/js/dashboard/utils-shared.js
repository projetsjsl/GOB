// Shared utility helpers for dashboard (exposed globally for Babel standalone)
(function() {
    const formatNumberCompact = (num, prefix = '', suffix = '') => {
        if (!num && num !== 0) return 'N/A';
        const n = parseFloat(num);
        if (isNaN(n)) return 'N/A';
        if (n >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T${suffix}`;
        if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B${suffix}`;
        if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(2)}M${suffix}`;
        if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(2)}K${suffix}`;
        return `${prefix}${n.toFixed(2)}${suffix}`;
    };

    const formatNumberLocale = (num) => {
        if (!num && num !== 0) return 'N/A';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toLocaleString('fr-FR');
    };

    const getCredibilityTier = (score) => {
        if (score >= 90) return 'premium';
        if (score >= 75) return 'high';
        if (score >= 50) return 'medium';
        return 'low';
    };

    const getSourceCredibility = (sourceName = '') => {
        const source = (sourceName || '').toLowerCase();
        if (!source) return 50;

        const tiers = [
            { score: 100, keywords: ['bloomberg', 'reuters', 'wall street journal', 'wsj', 'financial times', 'ft'] },
            { score: 90, keywords: ['cnbc', 'marketwatch', 'barrons', 'seeking alpha', 'yahoo finance', 'morningstar', 'the economist'] },
            { score: 80, keywords: ['forbes', 'benzinga', 'investorplace', 'zacks', 'motley fool', 'nasdaq', 'business insider'] },
            { score: 70, keywords: ['investing.com', 'fxstreet', 'dailyfx', 'capital.com', 'markets insider'] },
        ];

        for (const tier of tiers) {
            if (tier.keywords.some(keyword => source.includes(keyword))) {
                return tier.score;
            }
        }

        return 50;
    };

    const isFrenchArticle = (article) => {
        if (!article) return false;
        const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
        const sourceName = (article.source?.name || '').toLowerCase();

        const frenchSources = ['la presse', 'les affaires', 'radio-canada', 'ici', 'le devoir', 'le journal', 'reuters fr', 'bloomberg fr'];
        if (frenchSources.some(source => sourceName.includes(source))) {
            return true;
        }

        const frenchKeywords = [
            'a', 'de', 'et', 'pour', 'dans', 'avec', 'sur', 'plus', 'apres', 'annonce',
            'hausse', 'baisse', 'resultats', 'bourse', 'marche', 'economie', 'entreprise',
            'societe', 'actionnaire', 'benefice', 'chiffre', 'trimestre', 'milliards', 'millions'
        ];

        const frenchWordCount = frenchKeywords.filter(keyword => text.includes(keyword)).length;
        return frenchWordCount >= 3;
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
        if (hours < 1) return 'maintenant';
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}j`;
    };

    /**
     * Convertir une date/heure en heure de Montreal (Eastern Time)
     * Format: "Aujourd'hui, HH:MM AM/PM" ou "Il y a X heures"
     */
    const formatTimeMontreal = (dateOrTimeString) => {
        let date;
        
        // Si c'est une string de temps existante, essayer de la parser
        if (typeof dateOrTimeString === 'string') {
            // Si c'est deja formate "Aujourd'hui, HH:MM AM/PM", parser l'heure
            const todayMatch = dateOrTimeString.match(/Aujourd'hui[,\s]+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (todayMatch) {
                const now = new Date();
                let hours = parseInt(todayMatch[1]);
                const minutes = parseInt(todayMatch[2]);
                const ampm = todayMatch[3].toUpperCase();
                
                if (ampm === 'PM' && hours !== 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;
                
                date = new Date(now);
                date.setHours(hours, minutes, 0, 0);
            } else if (dateOrTimeString.match(/Il y a (\d+)\s*heures?/i)) {
                // "Il y a X heures" - calculer depuis maintenant
                const hoursAgoMatch = dateOrTimeString.match(/Il y a (\d+)\s*heures?/i);
                const hoursAgo = parseInt(hoursAgoMatch[1]);
                date = new Date();
                date.setHours(date.getHours() - hoursAgo);
            } else {
                // Sinon, essayer de parser comme date ISO
                date = new Date(dateOrTimeString);
            }
        } else if (dateOrTimeString instanceof Date) {
            date = dateOrTimeString;
        } else {
            date = new Date();
        }
        
        // Verifier si la date est valide
        if (isNaN(date.getTime())) {
            return 'Aujourd\'hui';
        }
        
        // Obtenir l'heure actuelle en heure de Montreal
        const nowMontreal = new Date();
        const nowMontrealStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Montreal',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(nowMontreal);
        
        // Convertir la date en heure de Montreal
        const montrealFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Montreal',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        const montrealParts = montrealFormatter.formatToParts(date);
        const montrealDateStr = `${montrealParts.find(p => p.type === 'year').value}-${montrealParts.find(p => p.type === 'month').value}-${montrealParts.find(p => p.type === 'day').value}`;
        
        // Verifier si c'est aujourd'hui
        const isToday = montrealDateStr === nowMontrealStr.replace(/\//g, '-');
        
        if (isToday) {
            // Formater en "Aujourd'hui, HH:MM AM/PM" en heure de Montreal
            const hours = parseInt(montrealParts.find(p => p.type === 'hour').value);
            const minutes = parseInt(montrealParts.find(p => p.type === 'minute').value);
            const ampm = montrealParts.find(p => p.type === 'dayPeriod').value;
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');
            
            return `Aujourd'hui, ${displayHours}:${displayMinutes} ${ampm.toUpperCase()}`;
        } else {
            // Calculer la difference en heures (en utilisant les timestamps UTC)
            const diffMs = nowMontreal.getTime() - date.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            
            if (diffHours < 1) {
                return 'A l\'instant';
            } else if (diffHours < 24) {
                return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
            } else {
                const diffDays = Math.floor(diffHours / 24);
                return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
            }
        }
    };

    const renderMarketBadge = (type, isDarkMode = true) => {
        const isBull = type === 'bull';
        const classes = isBull
            ? (isDarkMode
                ? 'bg-lime-900/70 border-lime-500/40 text-lime-300'
                : 'bg-lime-100 border-lime-400 text-lime-700')
            : (isDarkMode
                ? 'bg-rose-900/70 border-rose-500/40 text-rose-200'
                : 'bg-rose-100 border-rose-300 text-rose-700');
        if (typeof React !== 'undefined' && React.createElement) {
            return React.createElement(
                'span',
                { className: `w-9 h-9 rounded-full flex items-center justify-center text-xl font-semibold shadow-inner border ${classes}` },
                isBull ? '' : ''
            );
        }
        // Fallback string if React is not available
        return isBull ? '' : '';
    };

    const cleanText = (text) => {
        if (!text) return '';

        const replacements = [
            { pattern: /aEUR"/g, value: '-' },
            { pattern: /aEUR"/g, value: '-' },
            { pattern: /aEUR/g, value: '-' },
            { pattern: /aEURTM/g, value: "'" },
            { pattern: /aEUR /g, value: ''' },
            { pattern: /aEUR/g, value: '"' },
            { pattern: /aEUR/g, value: '"' },
            { pattern: /A/g, value: 'e' },
            { pattern: /A /g, value: 'e' },
            { pattern: /A /g, value: 'a' },
            { pattern: /A/g, value: 'c' },
            { pattern: /A /g, value: 'o' },
            { pattern: /A/g, value: 'a' },
            { pattern: /A/g, value: 'i' },
            { pattern: /A /g, value: 'i' },
            { pattern: /A1/g, value: 'u' },
            { pattern: /A"/g, value: 'u' },
            { pattern: /A"/g, value: 'e' },
            { pattern: /A/g, value: 'a' },
            { pattern: /A/g, value: 'o' },
            { pattern: /A14/g, value: 'u' }
        ];

        return replacements.reduce((result, { pattern, value }) => result.replace(pattern, value), text);
    };

    const getGradeColor = (grade) => {
        if (!grade) return 'bg-gray-100 text-gray-600';
        const gradeStr = String(grade);
        if (!gradeStr) return 'bg-gray-100 text-gray-600';
        const letter = gradeStr.charAt(0).toUpperCase();
        if (letter === 'A') return 'bg-green-100 text-green-700';
        if (letter === 'B') return 'bg-gray-100 text-gray-700';
        if (letter === 'C') return 'bg-yellow-100 text-yellow-700';
        if (letter === 'D') return 'bg-green-100 text-green-700';
        if (letter === 'F') return 'bg-red-100 text-red-700';
        return 'bg-gray-100 text-gray-600';
    };

    const getNewsIcon = (title, description, sentiment) => {
        const text = ((title || '') + ' ' + (description || '')).toLowerCase();
        const categories = {
            earnings: {
                keywords: ['earnings', 'resultats', 'profit', 'benefice', 'trimestre', 'quarterly', 'revenue', 'chiffre d\'affaires'],
                icon: 'DollarSign',
                color: 'text-green-500'
            },
            merger: {
                keywords: ['merger', 'acquisition', 'acquiert', 'fusion', 'rachete'],
                icon: 'GitMerge',
                color: 'text-blue-500'
            },
            rating: {
                keywords: ['upgrade', 'downgrade', 'note', 'rating', 'achat', 'vente'],
                icon: 'Star',
                color: 'text-yellow-500'
            },
            product: {
                keywords: ['launch', 'product', 'nouveau', 'innovation', 'devoile'],
                icon: 'Box',
                color: 'text-purple-500'
            }
        };

        for (const key in categories) {
            if (categories[key].keywords.some(kw => text.includes(kw))) {
                return { icon: categories[key].icon, color: categories[key].color };
            }
        }

        if (sentiment && sentiment.toLowerCase() === 'positive') return { icon: 'TrendingUp', color: 'text-green-500' };
        if (sentiment && sentiment.toLowerCase() === 'negative') return { icon: 'TrendingDown', color: 'text-red-500' };
        return { icon: 'Info', color: 'text-gray-400' };
    };

    window.DASHBOARD_UTILS = window.DASHBOARD_UTILS || {};
    window.DASHBOARD_UTILS.formatNumberCompact = formatNumberCompact;
    window.DASHBOARD_UTILS.formatNumberLocale = formatNumberLocale;
    window.DASHBOARD_UTILS.getCredibilityTier = getCredibilityTier;
    window.DASHBOARD_UTILS.getSourceCredibility = getSourceCredibility;
    window.DASHBOARD_UTILS.formatTimeAgo = formatTimeAgo;
    window.DASHBOARD_UTILS.formatTimeMontreal = formatTimeMontreal;
    window.DASHBOARD_UTILS.renderMarketBadge = renderMarketBadge;
    window.DASHBOARD_UTILS.cleanText = cleanText;
    window.DASHBOARD_UTILS.getNewsIcon = getNewsIcon;
    window.DASHBOARD_UTILS.isFrenchArticle = isFrenchArticle;
    window.DASHBOARD_UTILS.getGradeColor = getGradeColor;
})();
