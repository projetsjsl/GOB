import { fetch } from 'undici'; // Ou utiliser le fetch global Node 18+

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { provider, model_id, prompt, max_tokens, temperature } = req.body;

    if (!provider || !model_id || !prompt) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        let result = '';

        switch (provider) {
            case 'openai':
                result = await testOpenAI(model_id, prompt, max_tokens, temperature);
                break;
            case 'anthropic':
                result = await testAnthropic(model_id, prompt, max_tokens, temperature);
                break;
            case 'google':
                result = await testGemini(model_id, prompt, max_tokens, temperature);
                break;
            case 'perplexity':
                result = await testPerplexity(model_id, prompt, max_tokens, temperature);
                break;
            case 'mistral':
                result = await testMistral(model_id, prompt, max_tokens, temperature);
                break;
            case 'alibaba':
                result = await testQwen(model_id, prompt, max_tokens, temperature);
                break;
            default:
                throw new Error(`Provider ${provider} not supported`);
        }

        res.status(200).json({ success: true, response: result });

    } catch (error) {
        console.error('Test Model Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function testOpenAI(model, prompt, max_tokens = 4096, temperature = 0.7) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: max_tokens,
            temperature: temperature
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API Error: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No content';
}

async function testAnthropic(model, prompt, max_tokens = 4096, temperature = 0.7) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: max_tokens,
            temperature: temperature
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic API Error: ${err}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || 'No content';
}

async function testGemini(model, prompt, max_tokens = 4096, temperature = 0.7) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: max_tokens,
                temperature: temperature
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content';
}

async function testPerplexity(model, prompt, max_tokens = 4096, temperature = 0.7) {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: max_tokens,
            temperature: temperature
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Perplexity API Error: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No content';
}

async function testMistral(model, prompt, max_tokens = 4096, temperature = 0.7) {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: max_tokens,
            temperature: temperature
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Mistral API Error: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No content';
}

async function testQwen(model, prompt, max_tokens = 4096, temperature = 0.7) {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.ALIBABA_API_KEY || process.env.QWEN_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: max_tokens,
            temperature: temperature
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Qwen API Error: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No content';
}
