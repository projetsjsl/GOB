/**
 * Component: VoiceAssistantTab
 * Integration with Google Gemini and Tavus
 * 
 * IMPORTANT - React Hooks in Standalone Components:
 * ================================================
 * This component is loaded via <script type="text/babel"> tag (not bundled).
 * When using React hooks in standalone components like this, you MUST destructure
 * them from the global React object at the top of the file:
 * 
 *   const { useState, useEffect, useRef } = React;
 * 
 * Without this line, hooks like useState, useEffect, etc. will be undefined,
 * causing the component to fail silently and render a blank page.
 * 
 * This is different from bundled React apps where hooks are imported via:
 *   import { useState } from 'react';
 * 
 * TAVUS API INTEGRATION NOTES:
 * ============================
 * Tavus API requires:
 * 1. Authentication: Use 'x-api-key' header with your API key
 * 2. Create Conversation endpoint: POST https://tavusapi.com/v2/conversations
 * 3. Required parameters:
 *    - replica_id: Your trained replica ID (from Tavus dashboard)
 *    - persona_id: Defines behavior/capabilities of the replica
 *    - conversation_name: Optional name for the conversation
 * 4. Response includes:
 *    - conversation_url: Direct link to join or embed the video call
 *    - conversation_id: Unique identifier for tracking
 * 5. Optional features:
 *    - custom_greeting: Initial message from replica
 *    - callback_url: Webhook for conversation status updates
 *    - memory_stores: For conversation context persistence
 *    - document_ids: Knowledge base access during conversation
 * 
 * API Documentation: https://docs.tavus.io/api-reference/authentication
 */

const { useState, useEffect, useRef } = React;

const VoiceAssistantTab = ({ isDarkMode }) => {
    // Use prop if passed, otherwise check global or default to true
    const darkMode = isDarkMode !== undefined ? isDarkMode : (typeof window.isDarkMode !== 'undefined' ? window.isDarkMode : true);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Bonjour ! Je suis votre assistant virtuel intelligent. Comment puis-je vous aider aujourd\'hui ?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [tavusStatus, setTavusStatus] = useState('disconnected'); // disconnected, connecting, connected
    const [showSettings, setShowSettings] = useState(false);

    // Voice Configuration
    const [language, setLanguage] = useState('fr-CA'); // 'fr-CA' or 'en-CA'
    const [useAccent, setUseAccent] = useState(true); // Quebecois accent for French
    const [isTtsEnabled, setIsTtsEnabled] = useState(true); // Text-to-Speech enabled/disabled

    // Refs
    const chatContainerRef = useRef(null);
    const recognitionRef = useRef(null);
    const tavusVideoRef = useRef(null);

    // Access global config
    const config = window.emmaConfig || {};
    // const darkMode = typeof isDarkMode !== 'undefined' ? isDarkMode : true; // Removed duplicate

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = language === 'fr-CA' ? 'fr-FR' : 'en-US';

            recognition.onstart = () => {
                setIsRecording(true);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                // Optional: Auto-submit after voice input
                // handleSend(transcript);
            };

            recognitionRef.current = recognition;
        } else {
            console.warn('Speech recognition not supported in this browser.');
        }
    }, [language]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        // Add user message
        const newMessages = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Call Gemini API
            const response = await callGemini(text);

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);

            // If Tavus is connected, speak the response
            if (tavusStatus === 'connected') {
                speakWithTavus(response);
            } else {
                // Fallback to browser TTS
                speakWithBrowser(response);
            }

        } catch (error) {
            console.error('Error calling Gemini:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Désolé, une erreur est survenue lors de la communication avec Gemini.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const callGemini = async (prompt) => {
        const apiKey = config.gemini?.apiKey;

        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
            // Mock response if no key
            await new Promise(resolve => setTimeout(resolve, 1000));
            return `Je suis en mode démo car la clé API Gemini n'est pas configurée. Vous avez dit : "${prompt}"`;
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model || 'gemini-pro'}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    };

    const speakWithBrowser = (text) => {
        if (!isTtsEnabled) return; // Don't speak if TTS is disabled

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'fr-CA' ? 'fr-FR' : 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    const speakWithTavus = (text) => {
        // TODO: Implement Tavus conversation message sending
        // This would require the Tavus conversation API to send messages
        console.log('Sending text to Tavus:', text);
    };

    /**
     * Connect to Tavus and create a conversation
     * Uses the Tavus API v2 to create a real-time video conversation
     */
    const connectTavus = async () => {
        const tavusConfig = config.tavus || {};
        const apiKey = tavusConfig.apiKey;

        if (!apiKey || apiKey === 'YOUR_TAVUS_API_KEY') {
            alert('Veuillez configurer votre clé API Tavus dans emma-config.js');
            return;
        }

        setTavusStatus('connecting');

        try {
            // Create a conversation using Tavus API
            const response = await fetch('https://tavusapi.com/v2/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify({
                    replica_id: tavusConfig.replicaId || 'r9d30b0e55ac',
                    persona_id: tavusConfig.personaId || 'pe13ed370726',
                    conversation_name: `Session ${new Date().toLocaleString('fr-FR')}`,
                    custom_greeting: tavusConfig.customGreeting || 'Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider ?',
                    properties: tavusConfig.options || {}
                })
            });

            if (!response.ok) {
                throw new Error(`Tavus API error: ${response.status}`);
            }

            const data = await response.json();

            // Store conversation details
            window.tavusConversation = {
                id: data.conversation_id,
                url: data.conversation_url,
                status: data.status
            };

            console.log('Tavus conversation created:', data);

            // Embed the conversation in an iframe
            if (tavusVideoRef.current && data.conversation_url) {
                tavusVideoRef.current.innerHTML = `
                    <iframe 
                        src="${data.conversation_url}" 
                        allow="camera; microphone; autoplay; display-capture; fullscreen"
                        style="width: 100%; height: 100%; border: none; border-radius: 0;"
                        class="tavus-video-iframe"
                    ></iframe>
                `;
            }

            setTavusStatus('connected');

        } catch (error) {
            console.error('Error connecting to Tavus:', error);
            setTavusStatus('disconnected');
            alert('Erreur lors de la connexion à Tavus. Vérifiez votre configuration.');
        }
    };

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]`}>
            {/* Left Column: Avatar/Video Area */}
            <div className={`lg:col-span-2 flex flex-col rounded-2xl overflow-hidden shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex-1 relative bg-black flex items-center justify-center">
                    {tavusStatus === 'connected' ? (
                        <div ref={tavusVideoRef} className="w-full h-full">
                            {/* Tavus Video Stream will be embedded here via iframe */}
                        </div>
                    ) : (
                        <div className="text-center p-10">
                            <div className="w-32 h-32 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                                <i className="iconoir-user text-6xl text-gray-400"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Assistant Virtuel</h3>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">Connectez-vous pour interagir avec votre assistant vidéo alimenté par Tavus et Gemini.</p>
                            <button
                                onClick={connectTavus}
                                disabled={tavusStatus === 'connecting'}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-blue-600/30 flex items-center gap-2 mx-auto"
                            >
                                {tavusStatus === 'connecting' ? (
                                    <>
                                        <i className="iconoir-system-restart animate-spin"></i>
                                        Connexion...
                                    </>
                                ) : (
                                    <>
                                        <i className="iconoir-play-circle"></i>
                                        Démarrer la session
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Status Indicator */}
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${tavusStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs font-medium text-white uppercase tracking-wider">
                            {tavusStatus === 'connected' ? 'En ligne' : 'Hors ligne'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Column: Chat Interface */}
            <div className={`flex flex-col rounded-2xl overflow-hidden shadow-xl border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                {/* Header */}
                <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                            <i className="iconoir-sparkles text-xl"></i>
                        </div>
                        <div>
                            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>JSL Assistant</h3>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Propulsé par Gemini 2.0</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
                    >
                        <i className="iconoir-settings text-xl"></i>
                    </button>
                </div>

                {/* Settings Panel (Conditional) */}
                {showSettings && (
                    <div className={`p-4 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <h4 className={`text-sm font-bold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Configuration</h4>
                        <div className="space-y-3">
                            {/* Language Selector */}
                            <div>
                                <label className={`block text-xs mb-1 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Langue</label>
                                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                                    <button
                                        onClick={() => setLanguage('fr-CA')}
                                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${language === 'fr-CA' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                                    >
                                        Français (CA)
                                    </button>
                                    <button
                                        onClick={() => setLanguage('en-CA')}
                                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${language === 'en-CA' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                                    >
                                        English (CA)
                                    </button>
                                </div>
                            </div>

                            {/* Accent Toggle (Only for French) */}
                            {language === 'fr-CA' && (
                                <div>
                                    <label className={`block text-xs mb-1 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Accent</label>
                                    <button
                                        onClick={() => setUseAccent(!useAccent)}
                                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${useAccent ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${useAccent ? 'bg-emerald-500' : 'bg-gray-600'}`}></span>
                                            Accent Québécois
                                        </span>
                                        <span>{useAccent ? 'Activé' : 'Désactivé'}</span>
                                    </button>
                                </div>
                            )}

                            {/* TTS Toggle */}
                            <div>
                                <label className={`block text-xs mb-1 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Synthèse Vocale (TTS)</label>
                                <button
                                    onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${isTtsEnabled ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${isTtsEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`}></span>
                                        Réponses Vocales
                                    </span>
                                    <span>{isTtsEnabled ? 'Activée' : 'Désactivée'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Messages */}
                <div
                    ref={chatContainerRef}
                    className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
                >
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : (darkMode ? 'bg-gray-800 text-gray-200 rounded-bl-none' : 'bg-gray-100 text-gray-800 rounded-bl-none')
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className={`rounded-2xl px-4 py-3 rounded-bl-none ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <div className="relative flex items-center gap-2">
                        <button
                            onClick={toggleRecording}
                            className={`p-3 rounded-full transition-all ${isRecording
                                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                                : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')
                                }`}
                        >
                            <i className={isRecording ? "iconoir-mic-speaking" : "iconoir-microphone"}></i>
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Posez une question..."
                            className={`flex-1 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                                ? 'bg-gray-900 text-white placeholder-gray-500'
                                : 'bg-gray-100 text-gray-900 placeholder-gray-400'
                                }`}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className={`p-3 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20`}
                        >
                            <i className="iconoir-send-diagonal"></i>
                        </button>
                    </div>
                    <p className={`text-center text-[10px] mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        L'IA peut faire des erreurs. Vérifiez les informations importantes.
                    </p>
                </div>
            </div>
        </div>
    );
};

window.VoiceAssistantTab = VoiceAssistantTab;
