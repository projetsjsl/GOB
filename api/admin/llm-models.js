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
        },
        {
            id: 'qwen-turbo',
            name: 'Qwen Turbo',
            provider: 'alibaba',
            enabled: true,
            maxTokens: 1000000,
            temperature: 0.7,
            priority: 4,
            description: 'Fast and economical model ideal for simple tasks',
            costPerMillionTokens: 0.05
        },
        {
            id: 'qwen-plus',
            name: 'Qwen Plus',
            provider: 'alibaba',
            enabled: true,
            maxTokens: 131000,
            temperature: 0.7,
            priority: 5,
            description: 'Balanced performance for complex reasoning tasks',
            costPerMillionTokens: 0.40
        },
        {
            id: 'qwen-max',
            name: 'Qwen Max',
            provider: 'alibaba',
            enabled: true,
            maxTokens: 33000,
            temperature: 0.7,
            priority: 6,
            description: 'Powerful model for complex, multi-step tasks',
            costPerMillionTokens: 1.60
        },
        {
            id: 'qwen3-coder-flash',
            name: 'Qwen3 Coder Flash',
            provider: 'alibaba',
            enabled: true,
            maxTokens: 1000000,
            temperature: 0.7,
            priority: 7,
            description: 'Optimized for code generation and programming tasks',
            costPerMillionTokens: 0.30
        },
        {
            id: 'qwen3-max',
            name: 'Qwen3 Max',
            provider: 'alibaba',
            enabled: true,
            maxTokens: 262000,
            temperature: 0.7,
            priority: 8,
            description: 'Latest generation with advanced reasoning capabilities',
            costPerMillionTokens: 0.86
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
