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

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
        if (hours < 1) return 'maintenant';
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}j`;
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
                isBull ? '🐂' : '🐻'
            );
        }
        // Fallback plain object if React is not available
        return { className: classes, content: isBull ? '🐂' : '🐻' };
    };

    const cleanText = (text) => {
        if (!text) return '';
        return text
            .replace(/Ã©/g, 'é')
            .replace(/Ã¨/g, 'è')
            .replace(/Ã /g, 'à')
            .replace(/Ã§/g, 'ç')
            .replace(/Ã´/g, 'ô')
            .replace(/Ã¢/g, 'â')
            .replace(/Ã®/g, 'î')
            .replace(/Ã¯/g, 'ï')
            .replace(/Ã¹/g, 'ù')
            .replace(/Ã»/g, 'û')
            .replace(/Ã«/g, 'ë')
            .replace(/Ã¤/g, 'ä')
            .replace(/Ã¶/g, 'ö')
            .replace(/Ã¼/g, 'ü')
            .replace(/â€™/g, \"'\")
            .replace(/â€œ/g, '“')
            .replace(/â€�/g, '”')
            .replace(/â€“/g, '–')
            .replace(/â€”/g, '—');
    };

    const getNewsIcon = (title, description, sentiment) => {
        const text = ((title || '') + ' ' + (description || '')).toLowerCase();
        const categories = {
            earnings: {
                keywords: ['earnings', 'résultats', 'profit', 'bénéfice', 'trimestre', 'quarterly', 'revenue', \"chiffre d'affaires\"],
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
                keywords: ['launch', 'product', 'nouveau', 'innovation', 'dévoile'],
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
    window.DASHBOARD_UTILS.formatTimeAgo = formatTimeAgo;
    window.DASHBOARD_UTILS.renderMarketBadge = renderMarketBadge;
    window.DASHBOARD_UTILS.cleanText = cleanText;
    window.DASHBOARD_UTILS.getNewsIcon = getNewsIcon;
})();
