/**
 * Custom React Hook pour récupérer et gérer les tickers d'équipe
 */

import { useState, useEffect, useCallback } from 'react';

export function useTeamTickers() {
    const [tickers, setTickers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchTickers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/config/tickers?list=team');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setTickers(data.team_tickers || []);
                setLastUpdated(new Date().toISOString());
            } else {
                throw new Error(data.error || 'Failed to fetch team tickers');
            }

        } catch (err) {
            console.error('❌ Error fetching team tickers:', err);
            setError(err.message);
            
            // Fallback vers liste hardcodée en cas d'erreur
            const fallbackTickers = [
                'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                'TRP', 'UNH', 'UL', 'VZ', 'WFC'
            ];
            setTickers(fallbackTickers);
        } finally {
            setLoading(false);
        }
    }, []);

    const addTicker = useCallback(async (ticker, priority = 1, notes = '') => {
        try {
            const response = await fetch('/api/team-tickers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticker: ticker.toUpperCase(),
                    priority: priority,
                    notes: notes
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add ticker');
            }

            // Rafraîchir la liste après ajout
            await fetchTickers();
            return true;

        } catch (err) {
            console.error('❌ Error adding ticker:', err);
            setError(err.message);
            return false;
        }
    }, [fetchTickers]);

    const removeTicker = useCallback(async (ticker) => {
        try {
            const response = await fetch(`/api/team-tickers?ticker=${ticker}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove ticker');
            }

            // Rafraîchir la liste après suppression
            await fetchTickers();
            return true;

        } catch (err) {
            console.error('❌ Error removing ticker:', err);
            setError(err.message);
            return false;
        }
    }, [fetchTickers]);

    // Chargement initial
    useEffect(() => {
        fetchTickers();
    }, [fetchTickers]);

    return {
        tickers,
        loading,
        error,
        lastUpdated,
        refresh: fetchTickers,
        addTicker,
        removeTicker
    };
}

export function useWatchlistTickers() {
    const [tickers, setTickers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchTickers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/config/tickers?list=watchlist');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setTickers(data.watchlist_tickers || []);
                setLastUpdated(new Date().toISOString());
            } else {
                throw new Error(data.error || 'Failed to fetch watchlist tickers');
            }

        } catch (err) {
            console.error('❌ Error fetching watchlist tickers:', err);
            setError(err.message);
            
            // Fallback vers liste hardcodée en cas d'erreur
            const fallbackTickers = [
                'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                'TRP', 'UNH', 'UL', 'VZ', 'WFC'
            ];
            setTickers(fallbackTickers);
        } finally {
            setLoading(false);
        }
    }, []);

    // Chargement initial
    useEffect(() => {
        fetchTickers();
    }, [fetchTickers]);

    return {
        tickers,
        loading,
        error,
        lastUpdated,
        refresh: fetchTickers
    };
}

export function useAllTickers() {
    const [allTickers, setAllTickers] = useState({
        team: [],
        watchlist: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchAllTickers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/config/tickers');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setAllTickers({
                    team: data.team_tickers || [],
                    watchlist: data.watchlist_tickers || []
                });
                setLastUpdated(new Date().toISOString());
            } else {
                throw new Error(data.error || 'Failed to fetch tickers');
            }

        } catch (err) {
            console.error('❌ Error fetching all tickers:', err);
            setError(err.message);
            
            // Fallback vers listes hardcodées en cas d'erreur
            const fallbackTickers = [
                'GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT',
                'JNJ', 'JPM', 'LVMHF', 'MG', 'MFC', 'MU', 'NSRGY', 'NKE', 'NTR', 'PFE',
                'TRP', 'UNH', 'UL', 'VZ', 'WFC'
            ];
            setAllTickers({
                team: fallbackTickers,
                watchlist: fallbackTickers
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Chargement initial
    useEffect(() => {
        fetchAllTickers();
    }, [fetchAllTickers]);

    return {
        teamTickers: allTickers.team,
        watchlistTickers: allTickers.watchlist,
        loading,
        error,
        lastUpdated,
        refresh: fetchAllTickers
    };
}
