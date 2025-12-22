/**
 * LLM Models API Endpoint
 * Returns available LLM models configuration
 */

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Default LLM models configuration
    const defaultModels = [
        {
            id: 'claude-sonnet-4',
            name: 'Claude Sonnet 4',
            provider: 'anthropic',
            enabled: true,
            maxTokens: 8192,
            temperature: 0.7,
            priority: 1
        },
        {
            id: 'gpt-4o',
            name: 'GPT-4o',
            provider: 'openai',
            enabled: true,
            maxTokens: 4096,
            temperature: 0.7,
            priority: 2
        },
        {
            id: 'gemini-2.0-flash',
            name: 'Gemini 2.0 Flash',
            provider: 'google',
            enabled: true,
            maxTokens: 8192,
            temperature: 0.7,
            priority: 3
        }
    ];

    if (req.method === 'GET') {
        return res.status(200).json({
            success: true,
            models: defaultModels
        });
    }

    if (req.method === 'POST') {
        // For now, just acknowledge the update
        return res.status(200).json({
            success: true,
            message: 'Models configuration saved (mock)'
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
