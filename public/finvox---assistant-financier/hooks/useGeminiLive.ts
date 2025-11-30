import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { ConnectionState, LogMessage, StockChartData, AnalysisResult } from '../types';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

// Constants for audio configuration
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

// --- Dynamic Tool Definitions ---

const getStockPriceTool = (lang: 'fr-CA' | 'en-CA'): FunctionDeclaration => ({
  name: "getStockPrice",
  description: lang === 'fr-CA'
    ? "Outil essentiel pour obtenir le prix actuel, la variation et la performance d'une action. À utiliser dès que l'utilisateur mentionne une entreprise, demande 'comment ça va' pour une action, ou demande des 'résultats' ou chiffres récents."
    : "Essential tool to get current price, change, and performance of a stock. Use immediately when user mentions a company, asks 'how is it doing', or asks for 'results' or recent numbers.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: lang === 'fr-CA' ? "Le symbole du ticker (ex: AAPL, NVDA, CAC40, BTC)." : "The ticker symbol (e.g. AAPL, NVDA, CAC40, BTC).",
      },
    },
    required: ["symbol"],
  },
});

const getMarketNewsTool = (lang: 'fr-CA' | 'en-CA'): FunctionDeclaration => ({
  name: "getMarketNews",
  description: lang === 'fr-CA'
    ? "Obtenir les grands titres de l'actualité financière récente. Utile pour expliquer pourquoi une action monte ou descend."
    : "Get recent financial news headlines. Useful to explain why a stock is moving up or down.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: lang === 'fr-CA' ? "La catégorie (ex: Tech, Marchés, Crypto, Général)." : "The category (e.g. Tech, Markets, Crypto, General).",
      },
    },
    required: ["category"],
  },
});

const getStockHistoryTool = (lang: 'fr-CA' | 'en-CA'): FunctionDeclaration => ({
  name: "getStockHistory",
  description: lang === 'fr-CA'
    ? "Obtenir l'historique des prix pour afficher un graphique. A utiliser quand l'utilisateur demande de voir l'évolution, la courbe ou l'historique sur une période."
    : "Get price history to display a chart. Use when user asks to see the trend, the curve, or history over a period.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: lang === 'fr-CA' ? "Le symbole du ticker (ex: AAPL)." : "The ticker symbol (e.g. AAPL).",
      },
      period: {
        type: Type.STRING,
        description: lang === 'fr-CA' ? "La période (ex: 1M, 6M, 1Y). Par défaut 1M." : "The period (e.g. 1M, 6M, 1Y). Default 1M.",
      },
    },
    required: ["symbol"],
  },
});

const getAnalyzeStockTool = (lang: 'fr-CA' | 'en-CA'): FunctionDeclaration => ({
  name: "analyzeStock",
  description: lang === 'fr-CA'
    ? "Effectuer une analyse approfondie, stratégique et raisonnée (Thinking Mode) d'une action ou d'un marché. À utiliser quand l'utilisateur demande une 'analyse profonde', 'pourquoi ça monte vraiment', 'fais une recherche approfondie', ou des prédictions complexes nécessitant du raisonnement."
    : "Perform a deep, strategic, and reasoned analysis (Thinking Mode) of a stock or market. Use when user asks for 'deep analysis', 'why is it really moving', 'do thorough research', or complex predictions requiring reasoning.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: { type: Type.STRING, description: lang === 'fr-CA' ? "Symbole de l'action ou sujet principal." : "Stock symbol or main subject." },
      question: { type: Type.STRING, description: lang === 'fr-CA' ? "La question spécifique ou le contexte complet de l'analyse." : "The specific question or full context of the analysis." }
    },
    required: ["symbol", "question"]
  }
});

// --- Advanced Caching Strategy ---

class SmartCache<T> {
  private cache = new Map<string, { timestamp: number; data: T }>();
  private readonly ttl: number;
  private pruneInterval: ReturnType<typeof setInterval>;

  constructor(ttlMs: number) {
    this.ttl = ttlMs;
    // Periodically prune expired entries (every 60s or TTL, whichever is larger) to manage memory
    this.pruneInterval = setInterval(() => this.prune(), Math.max(ttlMs, 60000));
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Lazy eviction on access
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { timestamp: Date.now(), data });
  }

  private prune() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

const stockCache = new SmartCache<any>(60 * 1000); // 60 seconds TTL for prices
const newsCache = new SmartCache<any>(5 * 60 * 1000); // 5 minutes TTL for news

// --- Mock Data Implementation ---
const MOCK_STOCKS: Record<string, { price: number; currency: string; change: number }> = {
  'AAPL': { price: 178.35, currency: 'USD', change: 1.25 },
  'GOOGL': { price: 145.20, currency: 'USD', change: -0.45 },
  'MSFT': { price: 402.10, currency: 'USD', change: 2.10 },
  'AMZN': { price: 160.40, currency: 'USD', change: 0.85 },
  'TSLA': { price: 215.60, currency: 'USD', change: -3.20 },
  'NVDA': { price: 780.00, currency: 'USD', change: 4.50 },
  'CAC40': { price: 7950.00, currency: 'EUR', change: 0.30 },
  'BTC': { price: 64500.00, currency: 'USD', change: 1.50 },
  'ETH': { price: 3500.00, currency: 'USD', change: 0.90 },
  'EURUSD': { price: 1.085, currency: 'USD', change: 0.001 },
};

const fetchStockPrice = (symbol: string) => {
  const key = symbol.toUpperCase();

  const cached = stockCache.get(key);
  if (cached) {
    return cached;
  }

  let result;
  if (MOCK_STOCKS[key]) {
    const stock = MOCK_STOCKS[key];
    const jitter = (Math.random() - 0.5) * 0.5;
    const currentPrice = stock.price + jitter;
    const changeAmount = currentPrice * (stock.change / 100);

    result = {
      symbol: key,
      price: currentPrice.toFixed(2),
      currency: stock.currency,
      change_percent: stock.change.toFixed(2) + "%",
      change_amount: changeAmount.toFixed(2),
      status: "Market Open"
    };
  } else {
    const randomPrice = 100 + Math.random() * 500;
    const randomChangePercent = (Math.random() * 4) - 2;
    const changeAmount = randomPrice * (randomChangePercent / 100);

    result = {
      symbol: key,
      price: randomPrice.toFixed(2),
      currency: "USD",
      change_percent: randomChangePercent.toFixed(2) + "%",
      change_amount: changeAmount.toFixed(2),
      status: "Simulated Live Data"
    };
  }

  stockCache.set(key, result);
  return result;
};

const fetchMarketNews = (category: string, lang: 'fr-CA' | 'en-CA') => {
  const key = category.toLowerCase() + '_' + lang;

  const cached = newsCache.get(key);
  if (cached) {
    return cached;
  }

  const newsItemsFr = [
    { title: "La Fed signale une possible baisse des taux le mois prochain.", source: "Bloomberg" },
    { title: "Le secteur technologique bondit après des résultats trimestriels records.", source: "Reuters" },
    { title: "Le Bitcoin atteint un nouveau seuil de résistance.", source: "CoinDesk" },
    { title: "L'inflation en zone euro ralentit plus vite que prévu.", source: "Les Echos" },
    { title: "Nouvelles régulations annoncées pour les marchés des dérivés.", source: "Financial Times" }
  ];

  const newsItemsEn = [
    { title: "Fed signals potential rate cut next month.", source: "Bloomberg" },
    { title: "Tech sector jumps after record quarterly results.", source: "Reuters" },
    { title: "Bitcoin hits a new resistance level.", source: "CoinDesk" },
    { title: "Eurozone inflation slows faster than expected.", source: "The Economist" },
    { title: "New regulations announced for derivatives markets.", source: "Financial Times" }
  ];

  const items = lang === 'fr-CA' ? newsItemsFr : newsItemsEn;
  const selected = items.sort(() => 0.5 - Math.random()).slice(0, 3);
  const baseTime = new Date();

  const result = {
    category,
    headlines: selected.map((item, index) => ({
      title: item.title,
      source: item.source,
      published_at: new Date(baseTime.getTime() - (index * 30 + 5) * 60000).toISOString()
    }))
  };

  newsCache.set(key, result);
  return result;
};

const fetchStockHistory = (symbol: string, period: string = '1M', lang: 'fr-CA' | 'en-CA'): StockChartData => {
  const key = symbol.toUpperCase();
  const days = period === '1M' ? 30 : period === '1W' ? 7 : 30;

  const basePrice = MOCK_STOCKS[key]?.price || 150;
  const dataPoints = [];
  let currentPrice = basePrice * 0.9;

  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const change = (Math.random() - 0.48) * (basePrice * 0.05);
    currentPrice += change;
    dataPoints.push({
      date: date.toLocaleDateString(lang === 'fr-CA' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' }),
      price: currentPrice
    });
  }

  const startPrice = dataPoints[0].price;
  const endPrice = dataPoints[dataPoints.length - 1].price;
  const trend = endPrice >= startPrice ? 'up' : 'down';
  const changePercent = ((endPrice - startPrice) / startPrice) * 100;

  return {
    symbol: key,
    currency: MOCK_STOCKS[key]?.currency || "USD",
    period,
    data: dataPoints,
    trend,
    changePercent: parseFloat(changePercent.toFixed(2))
  };
};

// --- Deep Analysis Implementation with Fallback ---
const performDeepAnalysis = async (symbol: string, question: string, lang: 'fr-CA' | 'en-CA'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const promptFr = `You are a senior financial analyst. Provide a comprehensive, reasoned financial analysis for: ${symbol}. 
  Context/Question: ${question}.
  
  Structure your response with clear Markdown headers.
  1. Market Context
  2. Key Drivers
  3. Risks & Opportunities
  4. Strategic Verdict
  
  Be insightful, professional, and respond in French.`;

  const promptEn = `You are a senior financial analyst. Provide a comprehensive, reasoned financial analysis for: ${symbol}. 
  Context/Question: ${question}.
  
  Structure your response with clear Markdown headers.
  1. Market Context
  2. Key Drivers
  3. Risks & Opportunities
  4. Strategic Verdict
  
  Be insightful, professional, and respond in English.`;

  const prompt = lang === 'fr-CA' ? promptFr : promptEn;

  try {
    // Attempt 1: Gemini 3 Pro (Thinking Mode)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget
      }
    });
    return response.text || (lang === 'fr-CA' ? "Analyse terminée." : "Analysis complete.");
  } catch (error) {
    console.warn("Deep analysis (Pro) failed, falling back to Flash...", error);
    try {
      // Attempt 2: Gemini 2.5 Flash (Fallback - Standard)
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        // No thinking config for Flash standard
      });
      const note = lang === 'fr-CA'
        ? "\n\n*(Note: Généré avec le modèle de secours Gemini 2.5 Flash)*"
        : "\n\n*(Note: Generated with fallback model Gemini 2.5 Flash)*";
      return (response.text || (lang === 'fr-CA' ? "Analyse terminée." : "Analysis complete.")) + note;
    } catch (fallbackError) {
      console.error("Deep analysis fallback failed", fallbackError);
      return lang === 'fr-CA'
        ? "Désolé, l'analyse approfondie a échoué. Veuillez réessayer plus tard."
        : "Sorry, deep analysis failed. Please try again later.";
    }
  }
};

export const useGeminiLive = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [volume, setVolume] = useState<number>(0);
  const [chartData, setChartData] = useState<StockChartData | null>(null);
  const [voiceName, setVoiceName] = useState<string>('Aoede');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Configuration States
  const [language, setLanguage] = useState<'fr-CA' | 'en-CA'>('fr-CA');
  const [useAccent, setUseAccent] = useState<boolean>(true);
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(true);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  const getSystemInstruction = () => {
    let instruction = `You are "FinVox", a friendly and knowledgeable financial assistant. `;

    if (language === 'fr-CA') {
      instruction += `You speak French. `;
      if (useAccent) {
        instruction += `You MUST speak with a natural French Canadian (Québécois) accent. Use local expressions when appropriate but remain professional. `;
      } else {
        instruction += `You speak standard international French. `;
      }
    } else {
      instruction += `You speak English (Canadian). `;
    }

    instruction += `
  IMPORTANT: You HAVE access to real-time market data using your tools. NEVER state that you cannot access stock prices, news, or results.
  
  Usage of Tools:
  1. 'getStockPrice': Call this IMMEDIATELY if the user mentions a company, ticker, or asks about "results", "performance", or "how it's doing".
  2. 'getMarketNews': Use this to provide context or recent headlines.
  3. 'getStockHistory': Use this if the user wants to see a chart or visual trend.
  4. 'analyzeStock': Use this ONLY if the user explicitly requests a "deep analysis", "detailed report", "thinking mode", or "thorough investigation".
  5. 'googleSearch': Use this for factual questions not covered by the other tools (e.g. CEO names, specific dates).
  
  Behavior Guidelines:
  - If a user asks for "results" (e.g., "résultats de Nvidia"), assume they want the current stock price and recent movement.
  - Be natural and conversational.
  `;
    return instruction;
  };

  const addLog = (role: 'user' | 'assistant' | 'system', text: string, citations?: string[]) => {
    setLogs(prev => [...prev, { role, text, timestamp: new Date(), citations }]);
  };

  const connect = useCallback(async () => {
    try {
      setConnectionState(ConnectionState.CONNECTING);

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

      nextStartTimeRef.current = 0;

      analyserRef.current = inputAudioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      audioStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      const responseModalities = isTtsEnabled ? [Modality.AUDIO] : [Modality.TEXT];

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: responseModalities,
          speechConfig: isTtsEnabled ? {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          } : undefined,
          systemInstruction: getSystemInstruction(),
          tools: [
            {
              functionDeclarations: [
                getStockPriceTool(language),
                getMarketNewsTool(language),
                getStockHistoryTool(language),
                getAnalyzeStockTool(language)
              ]
            },
            { googleSearch: {} }
          ],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setConnectionState(ConnectionState.CONNECTED);
            addLog('system', 'Session connected. Listening...');
            setupAudioInput(stream, sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            handleServerMessage(message, sessionPromise);
          },
          onclose: (e) => {
            console.log('Session closed', e);
            setConnectionState(ConnectionState.DISCONNECTED);
            addLog('system', 'Session disconnected.');
            cleanup();
          },
          onerror: (e) => {
            console.error('Session error', e);
            setConnectionState(ConnectionState.ERROR);
            addLog('system', 'Connection error occurred.');
            cleanup();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error('Failed to connect:', err);
      setConnectionState(ConnectionState.ERROR);
      addLog('system', `Failed to initiate connection: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [voiceName, language, useAccent, isTtsEnabled]);

  const setupAudioInput = (stream: MediaStream, sessionPromise: Promise<any>) => {
    if (!inputAudioContextRef.current || !analyserRef.current) return;

    const ctx = inputAudioContextRef.current;
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);

    source.connect(analyserRef.current);
    analyserRef.current.connect(processor);
    processor.connect(ctx.destination);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);

      const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
      analyserRef.current!.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const vol = avg / 255;

      const isAiSpeaking = outputAudioContextRef.current &&
        outputAudioContextRef.current.currentTime < nextStartTimeRef.current;

      if (isAiSpeaking) {
        setVolume(0);
        return;
      }

      setVolume(vol);

      const pcmBlob = createBlob(inputData);
      sessionPromise.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    inputSourceRef.current = source;
    processorRef.current = processor;
  };

  const handleServerMessage = async (message: LiveServerMessage, sessionPromise: Promise<any>) => {
    const serverContent = message.serverContent;

    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        addLog('system', `Using tool: ${fc.name}`);

        let result;
        let responseResult;

        if (fc.name === 'getStockPrice') {
          const args = fc.args as any;
          result = fetchStockPrice(args.symbol);
          responseResult = result;
        } else if (fc.name === 'getMarketNews') {
          const args = fc.args as any;
          result = fetchMarketNews(args.category, language);
          responseResult = result;
        } else if (fc.name === 'getStockHistory') {
          const args = fc.args as any;
          const history = fetchStockHistory(args.symbol, args.period, language);
          setChartData(history);
          setAnalysisResult(null); // Clear analysis if showing chart
          responseResult = {
            symbol: history.symbol,
            status: "Chart displayed"
          };
        } else if (fc.name === 'analyzeStock') {
          const args = fc.args as any;
          // Trigger background deep analysis
          setAnalysisResult({
            symbol: args.symbol,
            content: '',
            isLoading: true,
            timestamp: new Date()
          });
          setChartData(null); // Clear chart if showing analysis

          // Non-blocking async call
          performDeepAnalysis(args.symbol, args.question, language).then(content => {
            setAnalysisResult({
              symbol: args.symbol,
              content: content,
              isLoading: false,
              timestamp: new Date()
            });
          });

          responseResult = { status: "Analysis started. Inform the user to check their screen." };
        } else {
          result = { error: `Function ${fc.name} not found` };
          responseResult = result;
        }

        sessionPromise.then((session) => {
          session.sendToolResponse({
            functionResponses: [
              {
                id: fc.id,
                name: fc.name,
                response: { result: responseResult },
              }
            ]
          });
        });
      }
    }

    if (serverContent?.outputTranscription) {
      currentOutputTranscription.current += serverContent.outputTranscription.text;
    }
    if (serverContent?.inputTranscription) {
      currentInputTranscription.current += serverContent.inputTranscription.text;
    }

    let citations: string[] | undefined;
    if (serverContent?.groundingMetadata?.groundingChunks) {
      citations = serverContent.groundingMetadata.groundingChunks
        .map((chunk: any) => chunk.web?.uri)
        .filter((uri: string) => !!uri);
    }

    if (serverContent?.turnComplete) {
      if (currentInputTranscription.current.trim()) {
        addLog('user', currentInputTranscription.current);
        currentInputTranscription.current = '';
      }
      if (currentOutputTranscription.current.trim()) {
        addLog('assistant', currentOutputTranscription.current, citations);
        currentOutputTranscription.current = '';
      }
    }

    const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && outputAudioContextRef.current && isTtsEnabled) {
      const ctx = outputAudioContextRef.current;
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        ctx,
        OUTPUT_SAMPLE_RATE,
        1
      );

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.addEventListener('ended', () => {
        activeSourcesRef.current.delete(source);
      });

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      activeSourcesRef.current.add(source);
    }

    if (serverContent?.interrupted) {
      activeSourcesRef.current.forEach(src => {
        try { src.stop(); } catch (e) { }
      });
      activeSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
      addLog('system', '[Interrupted]');
    }
  };

  const sendTextMessage = useCallback((text: string) => {
    if (connectionState === ConnectionState.CONNECTED && sessionPromiseRef.current) {
      addLog('user', text);
      sessionPromiseRef.current.then(session => {
        session.send({ parts: [{ text }], turnComplete: true });
      });
    }
  }, [connectionState]);

  const cleanup = () => {
    audioStreamRef.current?.getTracks().forEach(track => track.stop());

    inputSourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    analyserRef.current?.disconnect();

    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();

    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    processorRef.current = null;
    analyserRef.current = null;
    sessionPromiseRef.current = null;
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const disconnect = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        if (session && typeof session.close === 'function') {
          session.close();
        }
      }).catch(e => console.warn("Error closing session", e));
    }
    cleanup();
    setConnectionState(ConnectionState.DISCONNECTED);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState,
    connect,
    disconnect,
    logs,
    volume,
    chartData,
    setChartData,
    voiceName,
    setVoiceName,
    sendTextMessage,
    analysisResult,
    setAnalysisResult,
    // Configuration
    language,
    setLanguage,
    useAccent,
    setUseAccent,
    isTtsEnabled,
    setIsTtsEnabled
  };
};
