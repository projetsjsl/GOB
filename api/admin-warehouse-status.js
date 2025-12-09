
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Admin: Scanning finance_pro_snapshots for data completeness...');

        // Fetch all current snapshots
        // We select 'info' to check for nested data presence
        const { data: snapshots, error } = await supabase
            .from('finance_pro_snapshots')
            .select('ticker, updated_at, info')
            .eq('is_current', true)
            .order('ticker', { ascending: true });

        if (error) {
            console.error('Supabase Error:', error);
            throw error;
        }

        // Analyze each snapshot for data gaps
        const report = snapshots.map(item => {
            const info = item.info || {};
            const financials = info.financials || {};
            const analysis = info.analysisData || {}; // Where we stored premium data

            // Check specific data points
            const hasIncome = !!(financials.income && (financials.income.annual?.length > 0 || financials.income.quarterly?.length > 0));
            const hasBalance = !!(financials.balance && (financials.balance.annual?.length > 0 || financials.balance.quarterly?.length > 0));
            const hasCash = !!(financials.cash && (financials.cash.annual?.length > 0 || financials.cash.quarterly?.length > 0));
            
            const hasFinancials = hasIncome && hasBalance && hasCash;

            const hasEstimates = !!(analysis.analystEstimates && analysis.analystEstimates.length > 0);
            const hasInsider = !!(analysis.insiderTrading && analysis.insiderTrading.length > 0);
            const hasInstitutional = !!(analysis.institutionalHolders && analysis.institutionalHolders.length > 0);
            const hasSurprises = !!(analysis.earningsSurprises && analysis.earningsSurprises.length > 0);

            // Determine Overall Health Score (0-100)
            let score = 0;
            if (hasFinancials) score += 40;
            if (hasEstimates) score += 20;
            if (hasInsider) score += 10;
            if (hasInstitutional) score += 10;
            if (hasSurprises) score += 20;

            // Extract Years info
            const years = (info.data || []).map(d => d.year).sort((a, b) => b - a);
            const lastYear = years.length > 0 ? years[0] : null;
            const yearsCount = years.length;

            return {
                ticker: item.ticker,
                updatedAt: item.updated_at,
                healthScore: score,
                lastFinancialYear: lastYear,
                yearsCount: yearsCount,
                data: {
                    financials: hasFinancials,
                    estimates: hasEstimates,
                    insider: hasInsider,
                    institutional: hasInstitutional,
                    surprises: hasSurprises
                }
            };
        });

        // Aggregate Stats
        const total = report.length;
        const healthyCount = report.filter(r => r.healthScore === 100).length;
        const partialCount = report.filter(r => r.healthScore > 0 && r.healthScore < 100).length;
        const emptyCount = report.filter(r => r.healthScore === 0).length;

        const stats = {
            totalTickers: total,
            fullySynced: healthyCount,
            partiallySynced: partialCount,
            emptyOrLegacy: emptyCount,
            coverage: total > 0 ? Math.round((healthyCount / total) * 100) : 0
        };

        return res.status(200).json({
            stats,
            details: report
        });

    } catch (e) {
        console.error('Admin API Error:', e);
        return res.status(500).json({ error: e.message, details: e.toString() });
    }
}
