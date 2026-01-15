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

const VoiceAssistantTab = ({ isDarkMode, activeTab, setActiveTab }) => {
    // Use prop if passed, otherwise check global or default to true
    const darkMode = isDarkMode !== undefined ? isDarkMode : (typeof window.isDarkMode !== 'undefined' ? window.isDarkMode : true);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Bonjour ! Je suis votre assistant virtuel intelligent. Comment puis-je vous aider aujourd\'hui ?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [tavusStatus, setTavusStatus] = useState('disconnected'); // disconnected, connecting, connected
    const [conversationUrl, setConversationUrl] = useState(null);
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
            setMessages(prev => [...prev, { role: 'assistant', content: 'Desole, une erreur est survenue lors de la communication avec Gemini.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const callGemini = async (prompt) => {
        const apiKey = config.gemini?.apiKey || (window.ENV_CONFIG?.GEMINI_API_KEY);

        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
            // Mock response if no key
            await new Promise(resolve => setTimeout(resolve, 1000));
            return `Je suis en mode demo car la cle API Gemini n'est pas configuree. Vous avez dit : "${prompt}"`;
        }

        try {
            const model = config.gemini?.model || 'gemini-3-flash-preview';
            const response = await fetch('/api/gemini-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    data: {
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    }
                })
            });;

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
        void('Sending text to Tavus:', text);
    };

    /**
     * Connect to Tavus and create a conversation
     * Uses the Tavus API v2 to create a real-time video conversation
     */
    const connectTavus = async () => {
        const tavusConfig = config.tavus || {};
        const apiKey = tavusConfig.apiKey || (window.ENV_CONFIG?.TAVUS_API_KEY);

        if (!apiKey || apiKey === 'YOUR_TAVUS_API_KEY') {
            console.log('Alert suppressed:', 'Veuillez configurer votre cle API Tavus dans emma-config.js');
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
                    replica_id: tavusConfig.replicaId || 'r9c55f9312fb',
                    persona_id: tavusConfig.personaId || 'p68d02f5eb54',
                    conversation_name: `Session ${new Date().toLocaleString('fr-FR')}`,
                    custom_greeting: tavusConfig.customGreeting || 'Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider ?',
                    properties: {} // tavusConfig.options contains client-side flags (enableVideo) that cause 400 API errors
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Tavus API Error Details:', errorData);
                throw new Error(`Tavus API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();

            // Store conversation details
            window.tavusConversation = {
                id: data.conversation_id,
                url: data.conversation_url,
                status: data.status
            };

            void('Tavus conversation created:', data);

            if (tavusVideoRef.current && data.conversation_url) {
                // Use state to trigger re-render with iframe
                setConversationUrl(data.conversation_url);
            }

            setTavusStatus('connected');

        } catch (error) {
            console.error('Error connecting to Tavus:', error);
            setTavusStatus('disconnected');
            console.log('Alert suppressed:', 'Erreur lors de la connexion a Tavus. Verifiez votre configuration.');
        }
    };

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] p-1`}>

            {/* Left Column: Avatar/Video Area */}
            <div className={`lg:col-span-2 flex flex-col rounded-3xl overflow-hidden shadow-2xl relative group ${darkMode ? 'bg-black border border-gray-800' : 'bg-white border border-gray-200'}`}>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 z-10"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-20 blur group-hover:opacity-30 transition duration-1000"></div>
                
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden z-0">
                    {/* Background Grid Pattern (Subtle) */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" 
                        style={{userSelect: 'none', backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
                    </div>

                    {tavusStatus === 'connected' && conversationUrl ? (
                        <div className="w-full h-full relative z-10">
                            <iframe 
                                src={conversationUrl} 
                                allow="camera; microphone; autoplay; display-capture; fullscreen"
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                className="tavus-video-iframe"
                            ></iframe>
                        </div>
                    ) : (
                        <div className="text-center p-10 relative z-10">
                            <div className="relative w-40 h-40 mx-auto mb-8 group-hover:scale-105 transition-transform duration-500">
                                <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
                                <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                                <div className={`w-full h-full rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                    <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>
                                    <img 
                                        src={darkMode ? 'emma-avatar-gob-dark.jpg' : 'emma-avatar-gob-light.jpg'} 
                                        alt="Avatar" 
                                        className="w-full h-full object-cover opacity-90" 
                                        onError={(e) => { e.target.style.display='none'; e.target.parentElement.querySelector('i').style.display='block'; }}
                                    />
                                    <i className="iconoir-user text-6xl text-gray-400 hidden absolute"></i>
                                </div>
                                {/* Online Status Dot on Avatar */}
                                <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-black ${tavusStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
                            </div>
                            
                            <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">Emma Live</h3>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg font-light">
                                <span className="text-emerald-400 font-medium">IA Conversationnelle</span> synchronisee en temps reel.
                            </p>
                            
                            <button 
                                onClick={connectTavus}
                                disabled={tavusStatus === 'connecting'}
                                className="group relative px-8 py-4 bg-white text-black rounded-full font-bold transition-all transform hover:scale-105 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    {tavusStatus === 'connecting' ? (
                                        <>
                                            <i className="iconoir-system-restart animate-spin text-xl"></i>
                                            <span>Initialisation...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="iconoir-play-circle text-xl text-blue-600 group-hover:scale-110 transition-transform"></i>
                                            <span>Demarrer la Session</span>
                                        </>
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                            
                            <div className="mt-8 flex justify-center gap-4 text-xs text-gray-500 font-mono">
                                <span className="flex items-center gap-1"><i className="iconoir-check-circle text-green-500"></i> Video HD</span>
                                <span className="flex items-center gap-1"><i className="iconoir-check-circle text-green-500"></i> Audio Spatial</span>
                                <span className="flex items-center gap-1"><i className="iconoir-check-circle text-green-500"></i> Latence Faible</span>
                            </div>
                        </div>
                    )}

                    {/* Status Overlay */}
                    <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-3 shadow-lg z-20">
                        <div className={`relative w-2.5 h-2.5`}>
                            <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${tavusStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <div className={`relative w-2.5 h-2.5 rounded-full ${tavusStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                            {tavusStatus === 'connected' ? 'LIVE' : 'OFFLINE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Column: Chat Interface */}
            <div className={`flex flex-col rounded-3xl overflow-hidden shadow-2xl border relative z-10 ${darkMode ? 'bg-[#0f141e] border-gray-800' : 'bg-white border-gray-200'}`}>
                {/* Header Glassmorphic */}
                <div className={`px-6 py-4 border-b backdrop-blur-md sticky top-0 z-10 flex justify-between items-center ${
                    darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-100'
                }`}>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur opacity-40"></div>
                            <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white shadow-inner ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <span className="text-xl"></span>
                            </div>
                        </div>
                        <div>
                            <h3 className={`font-bold text-sm leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Transcript Live</h3>
                            <p className={`text-[10px] font-medium tracking-wide uppercase ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                {isRecording ? '- Ecoute en cours' : '- En attente'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2.5 rounded-xl transition-all duration-200 group ${
                            darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                        }`}
                        title="Parametres Audio"
                    >
                        <i className="iconoir-settings text-xl group-hover:rotate-90 transition-transform duration-500"></i>
                    </button>
                </div>

                {/* Settings Panel (Animated Expand) */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out border-b ${
                    showSettings ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 border-none'
                } ${darkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50/50 border-gray-100'}`}>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Langue</span>
                            <div className="flex bg-black/20 rounded-lg p-1">
                                {['fr-CA', 'en-CA'].map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => setLanguage(lang)}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-colors ${
                                            language === lang 
                                                ? (darkMode ? 'bg-gray-700 text-white shadow' : 'bg-white text-black shadow') 
                                                : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                    >
                                        {lang === 'fr-CA' ? 'FR' : 'EN'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {language === 'fr-CA' && (
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Accent Quebecois</span>
                                <button
                                    onClick={() => setUseAccent(!useAccent)}
                                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${useAccent ? 'bg-emerald-500' : 'bg-gray-600'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${useAccent ? 'translate-x-5' : 'translate-x-0'}`}></span>
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reponses Vocales</span>
                            <button
                                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${isTtsEnabled ? 'bg-blue-500' : 'bg-gray-600'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${isTtsEnabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chat Messages Area */}
                <div
                    ref={chatContainerRef}
                    className={`flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth ${
                        darkMode 
                            ? 'bg-[#0B0F17]' // Darker background for contrast
                            : 'bg-[#FAFAFA]'
                    }`}
                >
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar Icon */}
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-md text-xs mt-1 ${
                                msg.role === 'user' 
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                            }`}>
                                {msg.role === 'user' ? 'MOI' : 'IA'}
                            </div>

                            <div className={`max-w-[85%] space-y-1`}>
                                <div className={`px-5 py-3.5 rounded-2xl shadow-sm border text-[0.9rem] leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-indigo-600 text-white border-transparent rounded-tr-none'
                                        : (darkMode 
                                            ? 'bg-[#1a202c] text-gray-100 border-gray-800 rounded-tl-none' 
                                            : 'bg-white text-gray-800 border-gray-100 rounded-tl-none')
                                }`}>
                                    {msg.content}
                                </div>
                                {/* Message Role Label */}
                                <div className={`text-[10px] uppercase font-bold tracking-wider px-1 ${
                                    darkMode ? 'text-gray-600' : 'text-gray-400'
                                } ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.role === 'user' ? 'Vous' : 'Emma'}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs mt-1 animate-pulse">
                                IA
                            </div>
                            <div className={`px-5 py-3.5 rounded-2xl rounded-tl-none flex items-center gap-2 border ${
                                darkMode ? 'bg-[#1a202c] border-gray-800' : 'bg-white border-gray-100'
                            }`}>
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-300"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Floating Input Area */}
                <div className={`p-4 border-t relative z-20 ${darkMode ? 'border-gray-800 bg-[#0B0F17]' : 'border-gray-100 bg-white'}`}>
                    <div className={`relative flex items-center gap-2 p-1.5 rounded-full border shadow-lg transition-all focus-within:ring-2 focus-within:ring-blue-500/50 ${
                        darkMode ? 'bg-[#1a202c] border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                        <button
                            onClick={toggleRecording}
                            className={`p-3 rounded-full transition-all duration-300 shrink-0 ${isRecording
                                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40 scale-110'
                                : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                                }`}
                                title={isRecording ? "Arreter l'enregistrement" : "Demarrer l'enregistrement"}
                        >
                            <i className={isRecording ? "iconoir-mic-speaking" : "iconoir-microphone"}></i>
                        </button>
                        
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isRecording ? "Je vous ecoute..." : "Ecrivez votre message..."}
                            disabled={isRecording}
                            className={`flex-1 bg-transparent px-2 py-2 focus:outline-none text-sm ${darkMode
                                ? 'text-white placeholder-gray-500'
                                : 'text-gray-900 placeholder-gray-400'
                                }`}
                        />
                        
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className={`p-3 rounded-full transition-all duration-300 transform active:scale-95 shrink-0 ${
                                !input.trim() || isLoading 
                                    ? (darkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400')
                                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30'
                            }`}
                        >
                            {isLoading ? (
                                <i className="iconoir-system-restart animate-spin"></i>
                            ) : (
                                <i className="iconoir-send-diagonal"></i>
                            )}
                        </button>
                    </div>
                    {isRecording && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-bounce shadow-lg backdrop-blur-sm">
                            ENREGISTREMENT...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

window.VoiceAssistantTab = VoiceAssistantTab;
