/**
 *  API CACHE MANAGER - Systeme de cache intelligent
 * Reduit drastiquement le nombre de requetes API
 * 
 * Limites APIs gratuites :
 * - FMP : 250 requetes/jour
 * - Marketaux : 100 requetes/jour
 * - Gemini : 60 requetes/minute
 */

class ApiCacheManager {
    constructor() {
        this.prefix = 'gob_cache_';
        this.requestCounter = this.loadRequestCounter();
        this.limits = {
            fmp: { daily: 250, used: 0 },
            marketaux: { daily: 100, used: 0 },
            gemini: { perMinute: 60, used: 0 }
        };
        
        // Durees de cache (en millisecondes)
        this.cacheDurations = {
            quote: 2 * 60 * 1000,        // 2 minutes (donnees en temps reel)
            profile: 24 * 60 * 60 * 1000, // 24 heures (donnees statiques)
            ratios: 6 * 60 * 60 * 1000,   // 6 heures (donnees fondamentales)
            news: 15 * 60 * 1000,         // 15 minutes (actualites)
            intraday: 5 * 60 * 1000,      // 5 minutes (donnees intraday)
            default: 10 * 60 * 1000       // 10 minutes (par defaut)
        };
    }

    /**
     * Generer une cle de cache unique
     */
    getCacheKey(endpoint, params) {
        const paramString = JSON.stringify(params || {});
        return `${this.prefix}${endpoint}_${paramString}`;
    }

    /**
     * Verifier si une donnee en cache est valide
     */
    isValid(cacheKey, duration) {
        try {
            const cached = localStorage.getItem(cacheKey);
            if (!cached) return false;

            const data = JSON.parse(cached);
            const age = Date.now() - data.timestamp;
            
            return age < duration;
        } catch (error) {
            console.error('Cache validation error:', error);
            return false;
        }
    }

    /**
     * Recuperer des donnees du cache
     */
    get(endpoint, params, type = 'default') {
        const cacheKey = this.getCacheKey(endpoint, params);
        const duration = this.cacheDurations[type] || this.cacheDurations.default;

        if (this.isValid(cacheKey, duration)) {
            const cached = JSON.parse(localStorage.getItem(cacheKey));
            console.log(` Cache HIT: ${endpoint}`, {
                age: Math.round((Date.now() - cached.timestamp) / 1000) + 's',
                expiresIn: Math.round((duration - (Date.now() - cached.timestamp)) / 1000) + 's'
            });
            return cached.data;
        }

        console.log(` Cache MISS: ${endpoint}`);
        return null;
    }

    /**
     * Sauvegarder des donnees dans le cache
     */
    set(endpoint, params, data, type = 'default') {
        try {
            const cacheKey = this.getCacheKey(endpoint, params);
            const cacheData = {
                data: data,
                timestamp: Date.now(),
                type: type
            };

            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log(` Cache SAVED: ${endpoint}`, {
                expiresIn: Math.round(this.cacheDurations[type] / 1000) + 's'
            });
        } catch (error) {
            console.error('Cache save error:', error);
            // Si localStorage est plein, nettoyer
            if (error.name === 'QuotaExceededError') {
                this.clearOldCache();
            }
        }
    }

    /**
     * Fetch avec cache automatique
     */
    async fetchWithCache(url, options = {}, cacheType = 'default') {
        const endpoint = url.split('?')[0];
        const params = url.split('?')[1] || '';

        // Verifier le cache d'abord
        const cached = this.get(endpoint, params, cacheType);
        if (cached) {
            return cached;
        }

        // Incrementer le compteur AVANT la requete
        this.incrementRequestCounter();

        // Faire la requete
        console.log(` API Request: ${endpoint}`);
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Sauvegarder dans le cache
        this.set(endpoint, params, data, cacheType);

        return data;
    }

    /**
     * Nettoyer le cache expire
     */
    clearOldCache() {
        console.log(' Nettoyage du cache expire...');
        const keys = Object.keys(localStorage);
        let cleaned = 0;

        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    const age = Date.now() - data.timestamp;
                    const maxAge = this.cacheDurations[data.type] || this.cacheDurations.default;

                    if (age > maxAge) {
                        localStorage.removeItem(key);
                        cleaned++;
                    }
                } catch (error) {
                    // Supprimer les entrees corrompues
                    localStorage.removeItem(key);
                    cleaned++;
                }
            }
        });

        console.log(` ${cleaned} entrees nettoyees`);
    }

    /**
     * Vider tout le cache
     */
    clearAll() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
        console.log(' Cache completement vide');
    }

    /**
     * Compteur de requetes
     */
    loadRequestCounter() {
        try {
            const saved = localStorage.getItem('gob_request_counter');
            if (!saved) return { date: new Date().toDateString(), count: 0 };
            
            const counter = JSON.parse(saved);
            // Reset si nouveau jour
            if (counter.date !== new Date().toDateString()) {
                return { date: new Date().toDateString(), count: 0 };
            }
            return counter;
        } catch {
            return { date: new Date().toDateString(), count: 0 };
        }
    }

    incrementRequestCounter() {
        this.requestCounter.count++;
        localStorage.setItem('gob_request_counter', JSON.stringify(this.requestCounter));
        
        // Avertissement si limite proche
        if (this.requestCounter.count > 200) {
            console.warn(` ATTENTION: ${this.requestCounter.count} requetes aujourd'hui (limite FMP: 250)`);
        }
    }

    getRequestCount() {
        return this.requestCounter.count;
    }

    /**
     * Statistiques du cache
     */
    getStats() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
        const sizes = keys.map(k => {
            try {
                return localStorage.getItem(k).length;
            } catch {
                return 0;
            }
        });
        
        const totalSize = sizes.reduce((a, b) => a + b, 0);

        return {
            entries: keys.length,
            totalSize: (totalSize / 1024).toFixed(2) + ' KB',
            requestsToday: this.requestCounter.count,
            fmpRemaining: 250 - this.requestCounter.count,
            date: this.requestCounter.date
        };
    }
}

// Creer une instance globale
window.apiCache = new ApiCacheManager();

// Nettoyer le cache au chargement si necessaire
window.addEventListener('load', () => {
    window.apiCache.clearOldCache();
    console.log(' Cache Stats:', window.apiCache.getStats());
});

console.log(' API Cache Manager initialise');

