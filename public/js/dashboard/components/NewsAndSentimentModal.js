// NewsAndSentimentModal.js
// Real-time news feed with AI-powered sentiment analysis

const { useState, useEffect } = React;

const NewsAndSentimentModal = ({ symbol, stockData, onClose }) => {
    const [newsData, setNewsData] = useState([]);
    const [sentimentData, setSentimentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState('24h'); // 24h, 7d, 30d

    useEffect(() => {
        if (symbol) {
            fetchNewsAndSentiment();
        }
    }, [symbol, timeFilter]);

    const fetchNewsAndSentiment = async () => {
        setLoading(true);
        setError(null);

        try {
            const API_BASE_URL = window.location.origin || '';

            // Fetch news from FMP
            const newsResponse = await fetch(`${API_BASE_URL}/api/news?symbol=${symbol}&limit=50`);

            if (!newsResponse.ok) {
                throw new Error(`News API error: ${newsResponse.status}`);
            }

            const newsJson = await newsResponse.json();
            const articles = newsJson.articles || [];

            // Filter by time
            const now = new Date();
            const timeThresholds = {
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000
            };

            const filteredArticles = articles.filter(article => {
                const publishedDate = new Date(article.published_at || article.publishedDate || article.date);
                return (now - publishedDate) < timeThresholds[timeFilter];
            });

            setNewsData(filteredArticles.slice(0, 20)); // Limit to 20 for display

            // Run AI sentiment analysis on headlines
            if (filteredArticles.length > 0) {
                await analyzeSentiment(filteredArticles.slice(0, 10)); // Analyze top 10
            } else {
                setSentimentData({
                    overall: 'neutral',
                    score: 0,
                    summary: 'No recent news to analyze'
                });
            }

        } catch (err) {
            console.error('News fetch error:', err);
            setError(err.message || 'Failed to fetch news');
            setNewsData([]);
            setSentimentData(null);
        } finally {
            setLoading(false);
        }
    };

    const analyzeSentiment = async (articles) => {
        try {
            const API_BASE_URL = window.location.origin || '';

            // Build sentiment analysis prompt
            const headlines = articles.map((a, i) => `${i + 1}. ${a.title || a.headline || a.text}`).join('\n');

            const sentimentPrompt = `Analyze the sentiment of these recent news headlines for ${symbol} stock:

${headlines}

Provide a JSON response with:
{
  "overall": "bullish" | "neutral" | "bearish",
  "score": -100 to +100 (negative = bearish, positive = bullish),
  "key_themes": ["theme1", "theme2", "theme3"],
  "impact_level": "high" | "medium" | "low",
  "summary": "2-3 sentence summary of the overall news sentiment and potential price impact"
}`;

            const response = await fetch(`${API_BASE_URL}/api/ai-services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service: 'perplexity',
                    prompt: sentimentPrompt,
                    section: 'news',
                    model: 'sonar-pro',
                    max_tokens: 500,
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json();
                const aiText = data.data?.choices?.[0]?.message?.content || '';

                // Try to parse JSON from AI response
                try {
                    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const sentiment = JSON.parse(jsonMatch[0]);
                        setSentimentData(sentiment);
                        return;
                    }
                } catch (e) {
                    console.warn('Failed to parse AI sentiment JSON:', e);
                }
            }

            // Fallback: basic sentiment
            setSentimentData({
                overall: 'neutral',
                score: 0,
                key_themes: ['Market Activity'],
                impact_level: 'medium',
                summary: `Recent news coverage for ${symbol} shows mixed sentiment.`
            });

        } catch (err) {
            console.error('Sentiment analysis error:', err);
            setSentimentData({
                overall: 'neutral',
                score: 0,
                summary: 'Unable to analyze sentiment'
            });
        }
    };

    const getSentimentColor = (overall) => {
        switch (overall) {
            case 'bullish': return 'text-green-400 bg-green-900/30 border-green-500/30';
            case 'bearish': return 'text-red-400 bg-red-900/30 border-red-500/30';
            default: return 'text-gray-400 bg-gray-900/30 border-gray-500/30';
        }
    };

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-amber-500/30"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border-b border-amber-500/30 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <i className="iconoir-newspaper text-amber-400 text-3xl"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">News & Sentiment Analysis</h2>
                            <p className="text-gray-400 text-sm">{symbol} • Real-time news with AI sentiment</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                    >
                        <i className="iconoir-cancel text-gray-400 text-xl"></i>
                    </button>
                </div>

                {/* Time Filter */}
                <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700 flex gap-3">
                    <button
                        onClick={() => setTimeFilter('24h')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            timeFilter === '24h' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                    >
                        Last 24 Hours
                    </button>
                    <button
                        onClick={() => setTimeFilter('7d')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            timeFilter === '7d' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                    >
                        Last 7 Days
                    </button>
                    <button
                        onClick={() => setTimeFilter('30d')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            timeFilter === '30d' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                    >
                        Last 30 Days
                    </button>
                    <button
                        onClick={fetchNewsAndSentiment}
                        disabled={loading}
                        className="ml-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 text-lg">Loading news and analyzing sentiment...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                            <h3 className="text-red-400 font-bold mb-2">Error Loading News</h3>
                            <p className="text-gray-400">{error}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Sentiment Summary */}
                            <div className="lg:col-span-1">
                                {sentimentData && (
                                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 sticky top-0">
                                        <h3 className="text-lg font-bold text-white mb-4">Sentiment Overview</h3>

                                        {/* Sentiment Badge */}
                                        <div className={`inline-block px-4 py-2 rounded-lg border mb-4 ${getSentimentColor(sentimentData.overall)}`}>
                                            <span className="font-bold uppercase">{sentimentData.overall}</span>
                                        </div>

                                        {/* Score */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-400">Sentiment Score</span>
                                                <span className="text-white font-bold">{sentimentData.score || 0}</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-3">
                                                <div
                                                    className={`h-3 rounded-full ${
                                                        sentimentData.score > 0 ? 'bg-green-500' : sentimentData.score < 0 ? 'bg-red-500' : 'bg-gray-500'
                                                    }`}
                                                    style={{ width: `${Math.abs(sentimentData.score) || 50}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Key Themes */}
                                        {sentimentData.key_themes && (
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Themes</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {sentimentData.key_themes.map((theme, i) => (
                                                        <span key={i} className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs font-semibold">
                                                            {theme}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Impact Level */}
                                        {sentimentData.impact_level && (
                                            <div className="mb-4">
                                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Impact Level</h4>
                                                <span className={`px-3 py-1 rounded-lg font-semibold ${
                                                    sentimentData.impact_level === 'high' ? 'bg-red-900/30 text-red-400' :
                                                    sentimentData.impact_level === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                                                    'bg-green-900/30 text-green-400'
                                                }`}>
                                                    {sentimentData.impact_level.toUpperCase()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Summary */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-400 mb-2">AI Summary</h4>
                                            <p className="text-gray-300 text-sm leading-relaxed">{sentimentData.summary}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: News Feed */}
                            <div className="lg:col-span-2">
                                <h3 className="text-lg font-bold text-white mb-4">{newsData.length} Recent Articles</h3>

                                {newsData.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        No news found for the selected time period
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {newsData.map((article, index) => (
                                            <div
                                                key={index}
                                                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-amber-500/50 transition-all cursor-pointer"
                                                onClick={() => window.open(article.url || article.link, '_blank')}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-white font-semibold flex-1 mr-4">
                                                        {article.title || article.headline || article.text}
                                                    </h4>
                                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                                        {getTimeAgo(article.published_at || article.publishedDate || article.date)}
                                                    </span>
                                                </div>
                                                {article.summary && (
                                                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{article.summary}</p>
                                                )}
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="text-gray-500">{article.site || article.source || 'Unknown Source'}</span>
                                                    {article.symbol && (
                                                        <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                                                            {article.symbol}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-800/50 border-t border-gray-700 p-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        <i className="iconoir-info-circle mr-1"></i>
                        Sentiment powered by AI • News from FMP
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

window.NewsAndSentimentModal = NewsAndSentimentModal;
