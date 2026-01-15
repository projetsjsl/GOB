/**
 * STREAMING ORCHESTRATOR API - Real-time AI Responses
 * 
 * Server-Sent Events (SSE) endpoint for streaming AI responses.
 * Provides word-by-word or chunk-by-chunk delivery for better UX.
 * 
 * Usage:
 *   const eventSource = new EventSource('/api/orchestrator-stream?message=Analyse AAPL');
 *   eventSource.onmessage = (e) => console.log(e.data);
 */

import { MasterOrchestrator } from '../lib/orchestrator/master-orchestrator.js';
import { PersonaManager } from '../lib/orchestrator/persona-manager.js';
import { ModelSelectorAgent } from '../lib/orchestrator/model-selector-agent.js';

// Singleton instances
let orchestrator = null;
let personaManager = null;
let modelSelector = null;

function ensureInitialized() {
    if (!orchestrator) {
        orchestrator = new MasterOrchestrator();
        personaManager = new PersonaManager();
        modelSelector = new ModelSelectorAgent();
    }
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    ensureInitialized();

    // 
    // SSE STREAMING (GET)
    // 
    if (req.method === 'GET') {
        const { message, persona, tickers } = req.query;

        if (!message) {
            return res.status(400).json({ error: 'message query parameter required' });
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
            // Send start event
            res.write(`event: start\ndata: ${JSON.stringify({ status: 'processing', persona: persona || 'auto' })}\n\n`);

            // Process through orchestrator
            const context = {
                persona: persona || null,
                tickers: tickers ? tickers.split(',') : [],
                channel: 'web-stream'
            };

            const result = await orchestrator.process(message, context);

            if (result.success && result.response) {
                // Stream the response in chunks
                const words = result.response.split(' ');
                const chunkSize = 5; // words per chunk
                
                for (let i = 0; i < words.length; i += chunkSize) {
                    const chunk = words.slice(i, i + chunkSize).join(' ');
                    res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk + ' ' })}\n\n`);
                    
                    // Small delay for streaming effect
                    await new Promise(r => setTimeout(r, 50));
                }

                // Send completion event
                res.write(`event: done\ndata: ${JSON.stringify({
                    success: true,
                    persona: result.persona,
                    model: result.model,
                    duration: result.duration
                })}\n\n`);
            } else {
                res.write(`event: error\ndata: ${JSON.stringify({ error: result.error || 'Unknown error' })}\n\n`);
            }

            res.end();

        } catch (error) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }

        return;
    }

    // 
    // STREAMING POST (for longer messages/contexts)
    // 
    if (req.method === 'POST') {
        const { message, persona, tickers, context: additionalContext } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'message required' });
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
            // Send start event
            res.write(`event: start\ndata: ${JSON.stringify({ 
                status: 'processing', 
                persona: persona || 'auto',
                timestamp: new Date().toISOString()
            })}\n\n`);

            // Build context
            const context = {
                persona: persona || null,
                tickers: tickers || [],
                channel: 'web-stream',
                ...additionalContext
            };

            // Send processing updates
            res.write(`event: status\ndata: ${JSON.stringify({ phase: 'selecting_model' })}\n\n`);

            // Process through orchestrator
            const result = await orchestrator.process(message, context);

            res.write(`event: status\ndata: ${JSON.stringify({ phase: 'generating_response' })}\n\n`);

            if (result.success && result.response) {
                // Stream response
                const lines = result.response.split('\n');
                
                for (const line of lines) {
                    if (line.trim()) {
                        // Stream words within each line
                        const words = line.split(' ');
                        for (let i = 0; i < words.length; i += 3) {
                            const chunk = words.slice(i, i + 3).join(' ');
                            res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk + ' ' })}\n\n`);
                            await new Promise(r => setTimeout(r, 30));
                        }
                    }
                    // Send newline
                    res.write(`event: chunk\ndata: ${JSON.stringify({ text: '\n' })}\n\n`);
                }

                // Send metadata
                res.write(`event: metadata\ndata: ${JSON.stringify({
                    persona: result.persona,
                    model: result.model,
                    agents: result.agents,
                    duration: result.duration
                })}\n\n`);

                // Send completion
                res.write(`event: done\ndata: ${JSON.stringify({ success: true })}\n\n`);
            } else {
                res.write(`event: error\ndata: ${JSON.stringify({ error: result.error })}\n\n`);
            }

            res.end();

        } catch (error) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }

        return;
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * 
 * FRONTEND USAGE
 * 
 * 
 * // Simple GET streaming:
 * const eventSource = new EventSource('/api/orchestrator-stream?message=Analyse AAPL&persona=finance');
 * 
 * let response = '';
 * 
 * eventSource.addEventListener('chunk', (e) => {
 *   const data = JSON.parse(e.data);
 *   response += data.text;
 *   updateUI(response);
 * });
 * 
 * eventSource.addEventListener('done', (e) => {
 *   const data = JSON.parse(e.data);
 *   console.log('Completed:', data);
 *   eventSource.close();
 * });
 * 
 * eventSource.addEventListener('error', (e) => {
 *   console.error('Error:', e);
 *   eventSource.close();
 * });
 * 
 * // POST streaming (for complex requests):
 * async function streamPost(message, persona) {
 *   const response = await fetch('/api/orchestrator-stream', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ message, persona })
 *   });
 *   
 *   const reader = response.body.getReader();
 *   const decoder = new TextDecoder();
 *   
 *   while (true) {
 *     const { done, value } = await reader.read();
 *     if (done) break;
 *     
 *     const text = decoder.decode(value);
 *     // Parse SSE events
 *     for (const line of text.split('\n')) {
 *       if (line.startsWith('data: ')) {
 *         const data = JSON.parse(line.slice(6));
 *         handleData(data);
 *       }
 *     }
 *   }
 * }
 */
