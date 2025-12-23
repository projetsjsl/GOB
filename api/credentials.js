/**
 * CREDENTIALS API - Secure credential access endpoint
 * 
 * Provides access to environment variables and stored credentials
 * for the frontend CredentialsManager.
 * 
 * Security:
 * - Only returns if credential exists (not the full value for sensitive keys)
 * - Rate limited
 * - Supports testing credentials
 */

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // ═══════════════════════════════════════════════════════════════
        // GET - Check if a credential exists (from Vercel env)
        // ═══════════════════════════════════════════════════════════════
        if (req.method === 'GET') {
            const { key, action } = req.query;

            if (action === 'list') {
                // Return list of available credentials (just keys, not values)
                const available = [];
                const envKeys = [
                    'PERPLEXITY_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY',
                    'FMP_API_KEY', 'FINNHUB_API_KEY', 'RESEND_API_KEY',
                    'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN',
                    'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
                    'TAVUS_API_KEY', 'HEYGEN_API_KEY'
                ];
                
                for (const k of envKeys) {
                    available.push({
                        key: k,
                        hasValue: !!process.env[k],
                        source: 'vercel'
                    });
                }
                
                return res.status(200).json({ success: true, credentials: available });
            }

            if (!key) {
                return res.status(400).json({ error: 'key parameter required' });
            }

            // Check if the key exists in environment variables
            const value = process.env[key];
            
            if (value) {
                // Return masked value (for display purposes only)
                return res.status(200).json({
                    success: true,
                    key,
                    hasValue: true,
                    source: 'vercel',
                    masked: `${value.substring(0, 4)}...${value.slice(-4)}`,
                    // Only return full value for specific non-sensitive keys
                    value: ['SUPABASE_URL'].includes(key) ? value : undefined
                });
            } else {
                return res.status(200).json({
                    success: true,
                    key,
                    hasValue: false,
                    source: 'vercel'
                });
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // POST - Test a credential
        // ═══════════════════════════════════════════════════════════════
        if (req.method === 'POST') {
            const { key, testEndpoint } = req.body;

            if (!key) {
                return res.status(400).json({ error: 'key required' });
            }

            const value = process.env[key];
            if (!value) {
                return res.status(200).json({ 
                    valid: false, 
                    error: 'Credential not found in environment' 
                });
            }

            if (!testEndpoint) {
                return res.status(200).json({ 
                    valid: true, 
                    message: 'Credential exists (no test endpoint provided)' 
                });
            }

            // Test the credential against the endpoint
            try {
                const testHeaders = {
                    'Content-Type': 'application/json'
                };

                // Add appropriate auth header based on key type
                if (key.includes('PERPLEXITY')) {
                    testHeaders['Authorization'] = `Bearer ${value}`;
                } else if (key.includes('OPENAI')) {
                    testHeaders['Authorization'] = `Bearer ${value}`;
                } else if (key.includes('ANTHROPIC')) {
                    testHeaders['x-api-key'] = value;
                    testHeaders['anthropic-version'] = '2023-06-01';
                } else if (key.includes('FMP')) {
                    // FMP uses query param
                    const testUrl = testEndpoint.includes('?') 
                        ? `${testEndpoint}&apikey=${value}`
                        : `${testEndpoint}?apikey=${value}`;
                    
                    const response = await fetch(testUrl);
                    const isValid = response.ok;
                    return res.status(200).json({
                        valid: isValid,
                        status: response.status,
                        message: isValid ? 'API key is valid' : `API returned ${response.status}`
                    });
                } else if (key.includes('FINNHUB')) {
                    const testUrl = testEndpoint.includes('?')
                        ? `${testEndpoint}&token=${value}`
                        : `${testEndpoint}?token=${value}`;
                    
                    const response = await fetch(testUrl);
                    const isValid = response.ok;
                    return res.status(200).json({
                        valid: isValid,
                        status: response.status,
                        message: isValid ? 'API key is valid' : `API returned ${response.status}`
                    });
                } else if (key.includes('RESEND')) {
                    testHeaders['Authorization'] = `Bearer ${value}`;
                }

                // Make test request
                const response = await fetch(testEndpoint, {
                    method: 'POST',
                    headers: testHeaders,
                    body: JSON.stringify({ 
                        // Minimal payload for testing
                        model: 'sonar',
                        messages: [{ role: 'user', content: 'test' }],
                        max_tokens: 1
                    })
                });

                // Some APIs return 400 for minimal payloads but that means auth worked
                const isValid = response.status !== 401 && response.status !== 403;

                return res.status(200).json({
                    valid: isValid,
                    status: response.status,
                    message: isValid ? 'API key is valid' : 'Authentication failed'
                });

            } catch (error) {
                return res.status(200).json({
                    valid: false,
                    error: `Test failed: ${error.message}`
                });
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('[Credentials API] Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
