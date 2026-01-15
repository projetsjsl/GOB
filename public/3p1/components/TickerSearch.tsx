import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchResult {
    symbol: string;
    name: string;
    currency?: string;
    stockExchange?: string;
    exchangeShortName?: string;
}

interface TickerSearchProps {
    onSelect: (symbol: string) => void;
    onClose: () => void;
}

export const TickerSearch: React.FC<TickerSearchProps> = ({ onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const searchTickers = async () => {
            if (query.length < 1) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                // Use backend API proxy instead of direct FMP call
                const response = await fetch(
                    `/api/fmp-search?query=${encodeURIComponent(query)}&limit=10`
                );

                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`);
                }

                const data = await response.json();

                // Handle both array format and object with results property
                if (Array.isArray(data)) {
                    setResults(data);
                } else if (data && Array.isArray(data.results)) {
                    // API returns {query: string, results: [], count: number}
                    setResults(data.results);
                } else {
                    console.warn('Search API returned unexpected format:', data);
                    setResults([]);
                }
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(searchTickers, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleSelect = (symbol: string) => {
        onSelect(symbol);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            handleSelect(results[selectedIndex].symbol);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Rechercher un ticker ou nom de compagnie..."
                        className="flex-1 outline-none text-lg"
                    />
                    {isLoading && (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {results.length === 0 && query.length > 0 && !isLoading && (
                        <div className="p-8 text-center text-gray-500">
                            Aucun resultat trouve pour "{query}"
                        </div>
                    )}

                    {results.length === 0 && query.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Tapez pour rechercher des tickers</p>
                            <p className="text-xs mt-1">Ex: AAPL, Microsoft, Tesla...</p>
                        </div>
                    )}

                    {results.map((result, index) => (
                        <button
                            key={result.symbol + index}
                            onClick={() => handleSelect(result.symbol)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${index === selectedIndex ? 'bg-blue-50' : ''
                                }`}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900">{result.symbol}</span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                            {result.exchangeShortName}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-0.5">{result.name}</div>
                                </div>
                                {result.currency && (
                                    <div className="text-xs text-gray-400 ml-4">{result.currency}</div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer Hint */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span><kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">^v</kbd> Naviguer</span>
                        <span><kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Enter</kbd> Selectionner</span>
                        <span><kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Esc</kbd> Fermer</span>
                    </div>
                    <div>{results.length} resultat{results.length !== 1 ? 's' : ''}</div>
                </div>
            </div>
        </div>
    );
};
