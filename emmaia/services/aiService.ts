// AI Service - unified interface for Gemini, Perplexity, OpenAI, and Anthropic
import { GoogleGenAI } from '@google/genai';

interface GenerateOptions {
    modelId: string;
    prompt: string;
    systemInstruction?: string;
    googleSearch?: boolean;
}

interface GenerateResponse {
    text: string;
    citations?: string[];
}

// API URLs
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Get provider from model ID
function getProvider(modelId: string): string {
    if (modelId.startsWith('gemini')) return 'gemini';
    if (modelId.startsWith('sonar')) return 'perplexity';
    if (modelId.startsWith('gpt') || modelId.startsWith('o1')) return 'openai';
    if (modelId.startsWith('claude')) return 'anthropic';
    return 'gemini'; // default
}

export async function generateContent(options: GenerateOptions): Promise<GenerateResponse> {
    const provider = getProvider(options.modelId);
    
    switch (provider) {
        case 'perplexity':
            return generateWithPerplexity(options);
        case 'openai':
            return generateWithOpenAI(options);
        case 'anthropic':
            return generateWithAnthropic(options);
        default:
            return generateWithGemini(options);
    }
}

async function generateWithGemini(options: GenerateOptions): Promise<GenerateResponse> {
    const { modelId, prompt, systemInstruction, googleSearch } = options;
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        throw new Error('Gemini API key not configured (API_KEY)');
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const fullPrompt = systemInstruction 
        ? `${systemInstruction}\n\nUSER: ${prompt}`
        : prompt;
    
    const generationConfig: any = {
        model: modelId,
        contents: fullPrompt
    };
    
    if (googleSearch) {
        generationConfig.tools = [{ googleSearch: {} }];
    }
    
    const response = await ai.models.generateContent(generationConfig);
    
    return {
        text: response.text || '',
        citations: googleSearch ? extractGeminiCitations(response) : undefined
    };
}

async function generateWithPerplexity(options: GenerateOptions): Promise<GenerateResponse> {
    const { modelId, prompt, systemInstruction } = options;
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
        throw new Error('Perplexity API key not configured (PERPLEXITY_API_KEY)');
    }
    
    const messages: any[] = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    messages.push({ role: 'user', content: prompt });
    
    const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelId, messages, return_citations: true })
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Perplexity: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return { text: data.choices?.[0]?.message?.content || '', citations: data.citations || [] };
}

async function generateWithOpenAI(options: GenerateOptions): Promise<GenerateResponse> {
    const { modelId, prompt, systemInstruction } = options;
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        throw new Error('OpenAI API key not configured (OPENAI_API_KEY)');
    }
    
    const messages: any[] = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    messages.push({ role: 'user', content: prompt });
    
    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelId, messages })
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`OpenAI: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return { text: data.choices?.[0]?.message?.content || '' };
}

async function generateWithAnthropic(options: GenerateOptions): Promise<GenerateResponse> {
    const { modelId, prompt, systemInstruction } = options;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
        throw new Error('Anthropic API key not configured (ANTHROPIC_API_KEY)');
    }
    
    const messages: any[] = [{ role: 'user', content: prompt }];
    
    const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: modelId,
            max_tokens: 4096,
            system: systemInstruction || '',
            messages
        })
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Anthropic: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const textContent = data.content?.find((c: any) => c.type === 'text');
    return { text: textContent?.text || '' };
}

function extractGeminiCitations(response: any): string[] {
    try {
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
            return groundingMetadata.groundingChunks
                .filter((chunk: any) => chunk.web?.uri)
                .map((chunk: any) => chunk.web.uri);
        }
    } catch (e) { console.error('Error extracting citations:', e); }
    return [];
}

export default { generateContent };

