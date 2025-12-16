import { AnnualData, AnalysisProfile, Assumptions, CompanyInfo } from '../types';
import { sanitizeAssumptions } from '../utils/validation';

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
    autoFetched = false
): Promise<{ success: boolean; snapshot?: any; error?: string }> {
    try {
        // ✅ SANITIZE: Corriger les valeurs aberrantes AVANT sauvegarde
        const sanitizedAssumptions = sanitizeAssumptions(assumptions);
        
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
                auto_fetched: autoFetched
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const snapshot = await response.json();
        console.log(`✅ Snapshot saved: ${ticker} v${snapshot.version}`);

        return { success: true, snapshot };
    } catch (error: any) {
        console.error('Failed to save snapshot:', error);
        return { success: false, error: error.message };
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
