// AIStockAnalysisModal.js
// AI-Powered Stock Analysis using Perplexity & OpenAI

const { useState, useEffect } = React;

const AIStockAnalysisModal = ({ symbol, stockData, onClose }) => {
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedModel, setSelectedModel] = useState('perplexity'); // or 'openai'

    useEffect(() => {
        if (symbol) {
            fetchAIAnalysis();
        }
    }, [symbol, selectedModel]);

    const fetchAIAnalysis = async () => {
        setLoading(true);
        setError(null);

        try {
            const API_BASE_URL = window.location.origin || '';

            // Build comprehensive analysis prompt for Emma Agent
            const fundamentals = stockData?.ratios || stockData?.metrics || {};
            const profile = stockData?.profile || {};
            const price = typeof stockData?.price === 'number' && !Number.isNaN(stockData?.price) ? stockData.price : 0;
            const marketCapText = profile.marketCap
                ? `$${(profile.marketCap / 1_000_000_000).toFixed(2)}B`
                : 'N/A';

            // Use Emma Agent for real-time analysis with Perplexity
            const analysisMessage = `Analyze ${symbol} stock comprehensively as an investment opportunity.

Current Price: $${price}
Company: ${profile.companyName || symbol}
Sector: ${profile.sector || 'N/A'}
Industry: ${profile.industry || 'N/A'}
Market Cap: ${marketCapText}

Provide a detailed analysis in the following structure:

1. **Investment Thesis** (Bullish/Bearish/Neutral with confidence %)
   - Core investment case
   - Why this stock matters now

2. **Key Strengths** (3-5 points)
   - Competitive advantages
   - Financial strengths
   - Growth catalysts

3. **Key Risks** (3-5 points)
   - Business risks
   - Market risks
   - Financial concerns

4. **Valuation Assessment**
   - Is it overvalued, fairly valued, or undervalued?
   - Key metrics comparison to peers
   - Fair value estimate

5. **3-6 Month Outlook**
   - Expected catalysts
   - Price target range
   - Key events to watch

6. **Recommendation**
   - BUY/HOLD/SELL with confidence score (0-100)
   - Ideal entry point
   - Risk-reward ratio

Use the latest market data and news. Be objective and data-driven. Format with markdown.`;

            // Call Emma Agent API for real-time analysis
            const response = await fetch(`${API_BASE_URL}/api/emma-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: analysisMessage,
                    context: {
                        output_mode: 'chat',
                        user_channel: 'web',
                        tickers: [symbol],
                        news_requested: true,
                        stockData: stockData,
                        recency: 'day',
                        model_preference: selectedModel === 'perplexity' ? 'perplexity' : 'openai',
                        temperature: 0.7,
                        max_tokens: 2000
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Emma Agent error: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const data = await response.json();

            // Extract analysis text from Emma Agent response
            let analysisText = '';
            let modelUsed = selectedModel;

            // Handle different response formats from Emma Agent
            if (data.response) {
                analysisText = data.response;
            } else if (data.content) {
                analysisText = data.content;
            } else if (data.message) {
                analysisText = data.message;
            } else if (data.data?.response) {
                analysisText = data.data.response;
            } else if (data.data?.content) {
                analysisText = data.data.content;
            } else if (typeof data === 'string') {
                analysisText = data;
            }

            // Extract model information
            if (data.model) {
                modelUsed = data.model;
            } else if (data.data?.model) {
                modelUsed = data.data.model;
            } else if (data.source) {
                modelUsed = data.source;
            }

            if (!analysisText || analysisText.trim().length === 0) {
                throw new Error('Empty response from Emma Agent');
            }

            // Parse the analysis
            setAnalysisData({
                fullText: analysisText,
                model: modelUsed,
                timestamp: new Date().toISOString(),
                sources: data.sources || [],
                tools_used: data.tools_used || []
            });

        } catch (err) {
            console.error('AI Analysis Error:', err);
            setError(err.message || 'Failed to fetch AI analysis from Emma Agent');
            
            // Try fallback to ai-services if emma-agent fails
            try {
                void('Trying fallback to ai-services...');
                const fallbackResponse = await fetch(`${window.location.origin || ''}/api/ai-services`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service: selectedModel === 'perplexity' ? 'perplexity' : 'openai',
                        prompt: `Analyze ${symbol} stock comprehensively as an investment opportunity. Provide detailed analysis with investment thesis, strengths, risks, valuation, outlook, and recommendation. Use latest market data. Format with markdown.`,
                        section: 'analysis',
                        recency: 'day',
                        model: selectedModel === 'perplexity' ? 'sonar-reasoning-pro' : 'gpt-4o',
                        max_tokens: 2000
                    })
                });

                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    const fallbackText = fallbackData.content || fallbackData.data?.content || '';
                    
                    if (fallbackText) {
                        setAnalysisData({
                            fullText: fallbackText,
                            model: fallbackData.model || selectedModel,
                            timestamp: new Date().toISOString()
                        });
                        setError(null);
                        return;
                    }
                }
            } catch (fallbackErr) {
                console.error('Fallback also failed:', fallbackErr);
            }

            // Set error data
            setAnalysisData({
                fullText: `## AI Analysis Error\n\nUnable to generate analysis for ${symbol}. Please try again later.\n\nError: ${err.message}`,
                model: 'error',
                timestamp: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    const formatMarkdown = (text) => {
        if (!text) return '';

        // Simple markdown to HTML (enhanced version would use a library)
        return text
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-6 mb-3">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="text-gray-300 italic">$1</em>')
            .replace(/^- (.*$)/gim, '<li class="text-gray-300 ml-4 mb-1">$1</li>')
            .replace(/\n\n/g, '</p><p class="text-gray-400 mb-3">')
            .replace(/\n/g, '<br />');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-violet-500/30"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 border-b border-violet-500/30 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <i className="iconoir-brain text-violet-400 text-3xl"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">AI Stock Analysis</h2>
                            <p className="text-gray-400 text-sm">{symbol} - Powered by Emma IA via {selectedModel === 'perplexity' ? 'Perplexity AI (Real-time)' : 'OpenAI GPT-4o'}</p>
                        </div>
                    </div>
                    <button title="Action"
                        onClick={onClose}
                        className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                    >
                        <i className="iconoir-cancel text-gray-400 text-xl"></i>
                    </button>
                </div>

                {/* Model Selector */}
                <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700 flex gap-3">
                    <button
                        onClick={() => setSelectedModel('perplexity')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            selectedModel === 'perplexity'
                                ? 'bg-violet-600 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                    >
                        Perplexity AI (Real-time)
                    </button>
                    <button
                        onClick={() => setSelectedModel('openai')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            selectedModel === 'openai'
                                ? 'bg-violet-600 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                    >
                        OpenAI GPT-4o
                    </button>
                    <button
                        onClick={fetchAIAnalysis}
                        disabled={loading}
                        className="ml-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Analyzing...' : 'Refresh Analysis'}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 text-lg">Generating AI analysis...</p>
                            <p className="text-gray-500 text-sm mt-2">This may take 10-15 seconds</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                            <h3 className="text-red-400 font-bold mb-2">Analysis Error</h3>
                            <p className="text-gray-400">{error}</p>
                            <button
                                onClick={fetchAIAnalysis}
                                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : analysisData ? (
                        <div className="prose prose-invert max-w-none">
                            <div
                                className="analysis-content"
                                dangerouslySetInnerHTML={{
                                    __html: formatMarkdown(analysisData.fullText)
                                }}
                            />
                            <div className="mt-8 pt-4 border-t border-gray-700 text-xs text-gray-500">
                                <div>Generated by Emma IA via {analysisData.model} on {new Date(analysisData.timestamp).toLocaleString()}</div>
                                {analysisData.tools_used && analysisData.tools_used.length > 0 && (
                                    <div className="mt-2 text-gray-600">
                                        Data sources: {analysisData.tools_used.join(', ')}
                                    </div>
                                )}
                                {analysisData.sources && analysisData.sources.length > 0 && (
                                    <div className="mt-2 text-gray-600">
                                        Sources: {analysisData.sources.length} reference(s)
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="bg-gray-800/50 border-t border-gray-700 p-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        <i className="iconoir-info-circle mr-1"></i>
                        AI-generated analysis. Always do your own research.
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

window.AIStockAnalysisModal = AIStockAnalysisModal;
