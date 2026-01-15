/**
 * Utilitaire pour fetch avec timeout et gestion d'erreur complete
 * Corrige les bugs de timeout et de chargement infini
 */

/**
 * Fetch avec timeout, retry et gestion d'erreur complete
 * @param {string} url - URL a appeler
 * @param {Object} options - Options fetch standard
 * @param {number} timeoutMs - Timeout en millisecondes (defaut: 8000ms)
 * @param {number} maxRetries - Nombre de tentatives (defaut: 1)
 * @returns {Promise<Response>}
 */
export function fetchWithTimeout(url, options = {}, timeoutMs = 8000, maxRetries = 1) {
    return new Promise(async (resolve, reject) => {
        let lastError = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, timeoutMs);
            
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                // Retry sur erreurs serveur (5xx)
                if (!response.ok && response.status >= 500 && attempt < maxRetries) {
                    console.warn(`[fetchWithTimeout] Erreur serveur ${response.status}, retry ${attempt + 1}/${maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                    continue;
                }
                
                resolve(response);
                return;
            } catch (error) {
                clearTimeout(timeoutId);
                lastError = error;
                
                // Retry sur timeout ou erreurs reseau
                if ((error.name === 'AbortError' || error.message?.includes('network')) && attempt < maxRetries) {
                    console.warn(`[fetchWithTimeout] Timeout/reseau, retry ${attempt + 1}/${maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                    continue;
                }
                
                // Ne pas retry sur erreurs client (4xx)
                if (error.name !== 'AbortError') {
                    reject(error);
                    return;
                }
            }
        }
        
        // Toutes les tentatives ont echoue
        reject(new Error(`Timeout apres ${timeoutMs}ms pour ${url} (${maxRetries + 1} tentatives)`));
    });
}

/**
 * Fetch JSON avec timeout et gestion d'erreur
 * @param {string} url - URL a appeler
 * @param {Object} options - Options fetch standard
 * @param {number} timeoutMs - Timeout en millisecondes (defaut: 8000ms)
 * @returns {Promise<Object>} - Donnees JSON parsees
 */
export async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 8000) {
    const response = await fetchWithTimeout(url, options, timeoutMs);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Reponse non-JSON de ${url}: ${text.slice(0, 200)}`);
    }
    
    return await response.json();
}

/**
 * Wrapper pour useState avec timeout automatique
 * Nettoie automatiquement l'etat de loading apres un timeout
 * @param {boolean} initialValue - Valeur initiale
 * @param {number} timeoutMs - Timeout en millisecondes (defaut: 10000ms)
 * @returns {[boolean, Function, Function]} - [loading, setLoading, clearTimeout]
 */
export function useLoadingWithTimeout(initialValue = false, timeoutMs = 10000) {
    const [loading, setLoading] = React.useState(initialValue);
    const timeoutRef = React.useRef(null);
    
    React.useEffect(() => {
        if (loading) {
            // Nettoyer le timeout precedent
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            
            // Definir un nouveau timeout
            timeoutRef.current = setTimeout(() => {
                console.warn(`[useLoadingWithTimeout] Timeout: loading state nettoye apres ${timeoutMs}ms`);
                setLoading(false);
            }, timeoutMs);
        } else {
            // Nettoyer le timeout si loading devient false
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }
        
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [loading, timeoutMs]);
    
    const clearTimeout = React.useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);
    
    return [loading, setLoading, clearTimeout];
}

// Exposer globalement pour compatibilite
if (typeof window !== 'undefined') {
    window.fetchWithTimeout = fetchWithTimeout;
    window.fetchJsonWithTimeout = fetchJsonWithTimeout;
}
