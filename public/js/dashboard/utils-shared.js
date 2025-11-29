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

    window.DASHBOARD_UTILS = window.DASHBOARD_UTILS || {};
    window.DASHBOARD_UTILS.formatNumberCompact = formatNumberCompact;
    window.DASHBOARD_UTILS.formatNumberLocale = formatNumberLocale;
    window.DASHBOARD_UTILS.getCredibilityTier = getCredibilityTier;
})();
