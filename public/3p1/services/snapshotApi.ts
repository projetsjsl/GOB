import { AnnualData, AnalysisProfile, Assumptions, CompanyInfo } from '../types';
import { sanitizeAssumptionsSync } from '../utils/validation';

const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

/**
 * Save current analysis as a snapshot
 * IMPORTANT: Les assumptions sont sanitisées avant sauvegarde pour éviter les valeurs aberrantes
 */
export async function saveSnapshot(
    ticker: string,
    data: AnnualData[],
    assumptions: Assumptions,
    info: CompanyInfo,
    notes?: string,
    isCurrent = true,
    autoFetched = false,
    retryCount = 0,
    maxRetries = 2,
    syncMetadata?: any // Métadonnées de synchronisation (détails de la sync)
): Promise<{ success: boolean; snapshot?: any; error?: string }> {
    try {
        // ✅ VALIDATION: Vérifier que les données requises sont présentes
        if (!ticker || !ticker.trim()) {
            return { success: false, error: 'Ticker is required' };
        }
        
        if (!data || !Array.isArray(data)) {
            return { success: false, error: 'Annual data must be an array' };
        }
        
        if (!assumptions || typeof assumptions !== 'object') {
            return { success: false, error: 'Assumptions must be an object' };
        }
        
        if (!info || typeof info !== 'object') {
            return { success: false, error: 'Company info must be an object' };
        }
        
        // ✅ SANITIZE: Corriger les valeurs aberrantes AVANT sauvegarde
        const sanitizedAssumptions = sanitizeAssumptionsSync(assumptions);
        
        const response = await fetch(`${API_BASE}/api/finance-snapshots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticker,
                profile_id: `profile_${ticker}`,
                annual_data: data,
                assumptions: sanitizedAssumptions,
                company_info: info,
                notes,
                is_current: isCurrent,
                auto_fetched: autoFetched,
                sync_metadata: syncMetadata || null // Ajouter les métadonnées de synchronisation
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;

            const shouldRetry = [429, 500, 502, 503, 504].includes(response.status);
            if (shouldRetry && retryCount < maxRetries) {
                const baseDelay = 1000 * Math.pow(2, retryCount);
                const jitter = Math.floor(Math.random() * 200);
                const delay = baseDelay + jitter;
                console.warn(`⚠️ Snapshot error ${response.status} for ${ticker}, retry ${retryCount + 1}/${maxRetries} après ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return saveSnapshot(ticker, data, assumptions, info, notes, isCurrent, autoFetched, retryCount + 1, maxRetries);
            }
            
            // Ne pas logger comme erreur critique si c'est une erreur 400 (validation)
            if (response.status === 400) {
                console.warn(`⚠️ Snapshot validation failed for ${ticker}: ${errorMessage}`);
            } else {
                console.error(`❌ Failed to save snapshot for ${ticker}: ${errorMessage}`);
            }
            return { success: false, error: errorMessage };
        }

        const snapshot = await response.json();
        if (retryCount > 0) {
            console.log(`✅ Snapshot saved: ${ticker} v${snapshot.version} (après ${retryCount} retry)`);
        } else {
            console.log(`✅ Snapshot saved: ${ticker} v${snapshot.version}`);
        }

        return { success: true, snapshot };
    } catch (error: any) {
        // ✅ RETRY: Pour erreurs réseau/timeout, réessayer automatiquement
        if (retryCount < maxRetries && (error.message?.includes('fetch') || error.message?.includes('timeout'))) {
            const baseDelay = 1000 * Math.pow(2, retryCount);
            const jitter = Math.floor(Math.random() * 200);
            const delay = baseDelay + jitter;
            console.warn(`⚠️ Snapshot network error for ${ticker}, retry ${retryCount + 1}/${maxRetries} après ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return saveSnapshot(ticker, data, assumptions, info, notes, isCurrent, autoFetched, retryCount + 1, maxRetries);
        }
        
        console.error(`❌ Failed to save snapshot for ${ticker}:`, error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

/**
 * List snapshots for a ticker
 */
export async function listSnapshots(
    ticker: string,
    limit = 20
): Promise<{ success: boolean; snapshots?: any[]; error?: string }> {
    try {
        const response = await fetch(`${API_BASE}/api/finance-snapshots?ticker=${ticker}&limit=${limit}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return { success: true, snapshots: data.snapshots || [] };
    } catch (error: any) {
        console.error('Failed to list snapshots:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all approved ticker IDs in a single bulk query
 * PERFORMANCE: Uses a single API call instead of N individual calls
 */
export async function getAllApprovedTickers(): Promise<{ success: boolean; approvedTickers?: string[]; error?: string }> {
    try {
        console.log('📊 KPI: Fetching all approved tickers (bulk query)...');
        const startTime = Date.now();

        const response = await fetch(`${API_BASE}/api/finance-snapshots?approved_only=true&distinct_tickers=true`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const approvedTickers = data.tickers || [];

        console.log(`✅ KPI: ${approvedTickers.length} approved tickers loaded in ${Date.now() - startTime}ms`);
        return { success: true, approvedTickers };
    } catch (error: any) {
        console.error('❌ KPI: Failed to get approved tickers:', error);
        return { success: false, error: error.message, approvedTickers: [] };
    }
}

/**
 * Load a specific snapshot
 */
export async function loadSnapshot(
    snapshotId: string
): Promise<{ success: boolean; snapshot?: any; error?: string }> {
    try {
        const response = await fetch(`${API_BASE}/api/finance-snapshots?id=${snapshotId}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const snapshot = await response.json();
        return { success: true, snapshot };
    } catch (error: any) {
        console.error('Failed to load snapshot:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a snapshot
 */
export async function deleteSnapshot(
    snapshotId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${API_BASE}/api/finance-snapshots?id=${snapshotId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log(`✅ Snapshot deleted: ${snapshotId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete snapshot:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update snapshot metadata (notes, is_current)
 */
export async function updateSnapshot(
    snapshotId: string,
    updates: { notes?: string; is_current?: boolean }
): Promise<{ success: boolean; snapshot?: any; error?: string }> {
    try {
        const response = await fetch(`${API_BASE}/api/finance-snapshots`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: snapshotId, ...updates })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const snapshot = await response.json();
        return { success: true, snapshot };
    } catch (error: any) {
        console.error('Failed to update snapshot:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Detect if data has been manually edited
 * (checks if any row has autoFetched flag set to false)
 */
export function hasManualEdits(data: AnnualData[]): boolean {
    return data.some(row => row.autoFetched === false || row.autoFetched === undefined);
}
