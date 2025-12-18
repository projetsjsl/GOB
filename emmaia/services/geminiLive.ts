
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, ChatMessage, AvatarConfig } from '../types';
import { VOICE_NAME, SAMPLE_RATE_OUTPUT, SAMPLE_RATE_INPUT, MODEL_FLASH, MODEL_PRO } from '../constants';
import { createPcmBlob, base64ToUint8Array, decodeAudioData } from './audioUtils';

export const useGeminiLive = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userVolume, setUserVolume] = useState<number>(0);
  const [assistantVolume, setAssistantVolume] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const [volumeMultiplier, setVolumeMultiplier] = useState<number>(1);
  const volumeMultiplierRef = useRef<number>(1);
  
  useEffect(() => {
     volumeMultiplierRef.current = volumeMultiplier;
  }, [volumeMultiplier]);

  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  const sessionRef = useRef<Promise<any> | null>(null); 
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const currentInputTransRef = useRef<string>('');
  const currentOutputTransRef = useRef<string>('');

  const cleanupAudio = useCallback(() => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();

    if (inputContextRef.current?.state !== 'closed') inputContextRef.current?.close();
    if (outputContextRef.current?.state !== 'closed') outputContextRef.current?.close();

    inputContextRef.current = null;
    outputContextRef.current = null;
    inputSourceRef.current = null;
    processorRef.current = null;
    outputGainRef.current = null;
    analyzerRef.current = null;
    sessionRef.current = null;
    nextStartTimeRef.current = 0;
    
    currentInputTransRef.current = '';
    currentOutputTransRef.current = '';
    
    setUserVolume(0);
    setAssistantVolume(0);
  }, []);

  const disconnect = useCallback(() => {
     cleanupAudio();
     setConnectionState(ConnectionState.DISCONNECTED);
  }, [cleanupAudio]);

  const sendText = useCallback(async (text: string) => {
      if (sessionRef.current) {
          const session = await sessionRef.current;
          session.sendRealtimeInput({
              content: [{ parts: [{ text }] }]
          });
      }
  }, []);

  const connect = useCallback(async (config: AvatarConfig) => {
    if (connectionState === ConnectionState.CONNECTED) {
        disconnect();
    }

    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);

      // Multi-source API Key detection
      const textKey = import.meta.env.VITE_GEMINI_API_KEY || 
                      (window as any).emmaConfig?.gemini?.apiKey || 
                      (window as any).ENV_CONFIG?.GEMINI_API_KEY ||
                      '';
      
      const apiKey = textKey === 'YOUR_GEMINI_API_KEY' ? '' : textKey;

      if (!apiKey) {
          console.error("Gemini API Key missing. Checked import.meta.env, emmaConfig, and ENV_CONFIG.");
          throw new Error("Clé API Gemini manquante. Veuillez la configurer dans .env ou env-config.js.");
      }

      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE_INPUT });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE_OUTPUT });

      analyzerRef.current = outputContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      outputGainRef.current = outputContextRef.current.createGain();
      outputGainRef.current.gain.value = volumeMultiplierRef.current; 

      outputGainRef.current.connect(analyzerRef.current);
      analyzerRef.current.connect(outputContextRef.current.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      inputSourceRef.current = inputContextRef.current.createMediaStreamSource(stream);
      processorRef.current = inputContextRef.current.createScriptProcessor(4096, 1, 1);
      
      inputSourceRef.current.connect(processorRef.current);
      processorRef.current.connect(inputContextRef.current.destination);

      processorRef.current.onaudioprocess = (e) => {
           const inputData = e.inputBuffer.getChannelData(0);
           const pcmBlob = createPcmBlob(inputData);
           
           let sum = 0;
           for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
           const rms = Math.sqrt(sum / inputData.length);
           setUserVolume(Math.min(100, rms * 500)); 

           if (sessionRef.current) {
              sessionRef.current.then(session => {
                  try {
                    session.sendRealtimeInput({ media: pcmBlob });
                  } catch (err) {
                      // Ignore errors from closed sessions
                  }
              });
           }
      };

      const ai = new GoogleGenAI({ apiKey });
      
      const attemptConnection = async (modelId: string, isFallback: boolean = false) => {
          return new Promise<void>((resolve, reject) => {
              let isConnected = false;
              
              const timeoutId = setTimeout(() => {
                  if (!isConnected) {
                      console.warn(`Connection timed out for model: ${modelId}`);
                      reject(new Error("Timeout waiting for model response (5s)"));
                  }
              }, 5000);

              const sessionPromise = ai.live.connect({
                model: modelId,
                callbacks: {
                  onopen: () => {
                    isConnected = true;
                    clearTimeout(timeoutId);
                    setConnectionState(ConnectionState.CONNECTED);
                    
                    const systemMsg = isFallback 
                        ? 'System: Bascule sur Gemini Pro (Fallback activé).'
                        : 'System: Connectée.';
                    
                    setMessages(prev => [...prev, {
                      id: Date.now().toString(),
                      role: 'system',
                      text: systemMsg,
                      timestamp: new Date()
                    }]);
                    resolve();
                  },
                  onmessage: async (message: LiveServerMessage) => {
                     if (message.serverContent?.outputTranscription) {
                       currentOutputTransRef.current += message.serverContent.outputTranscription.text;
                     }
                     if (message.serverContent?.inputTranscription) {
                        currentInputTransRef.current += message.serverContent.inputTranscription.text;
                     }

                     if (message.serverContent?.turnComplete) {
                        if (currentInputTransRef.current.trim()) {
                          setMessages(prev => [...prev, {
                            id: Date.now().toString() + '_user',
                            role: 'user',
                            text: currentInputTransRef.current,
                            timestamp: new Date()
                          }]);
                          currentInputTransRef.current = '';
                        }
                        if (currentOutputTransRef.current.trim()) {
                           setMessages(prev => [...prev, {
                            id: Date.now().toString() + '_ai',
                            role: 'assistant',
                            text: currentOutputTransRef.current.replace(/###VISUAL_JSON_START###[\s\S]*?###VISUAL_JSON_END###/g, ''), // Clean JSON from visible text
                            timestamp: new Date()
                           }]);
                           currentOutputTransRef.current = '';
                        }
                     }

                     const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                     if (base64Audio && outputContextRef.current) {
                        const ctx = outputContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        
                        const audioBuffer = await decodeAudioData(
                          base64ToUint8Array(base64Audio),
                          ctx,
                          SAMPLE_RATE_OUTPUT
                        );

                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        
                        if (outputGainRef.current) {
                            outputGainRef.current.gain.value = volumeMultiplierRef.current;
                            source.connect(outputGainRef.current);
                        }
                        
                        source.addEventListener('ended', () => {
                           sourcesRef.current.delete(source);
                        });
                        
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                     }

                     if (message.serverContent?.interrupted) {
                        sourcesRef.current.forEach(s => s.stop());
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                        currentOutputTransRef.current = '';
                     }
                  },
                  onclose: () => {
                    if (isConnected) {
                        setConnectionState(ConnectionState.DISCONNECTED);
                        cleanupAudio();
                    }
                  },
                  onerror: (err) => {
                    if (!isConnected) {
                        clearTimeout(timeoutId);
                        reject(err);
                    } else {
                        console.error(err);
                        setError("Erreur de connexion");
                        setConnectionState(ConnectionState.ERROR);
                        cleanupAudio();
                    }
                  }
                },
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: config.geminiVoice || VOICE_NAME } }
                  },
                  systemInstruction: config.systemInstruction,
                  generationConfig: {
                    temperature: config.llmTemperature,
                  },
                  inputAudioTranscription: {}, 
                  outputAudioTranscription: {},
                }
              });

              sessionRef.current = sessionPromise;
          });
      };

      try {
          await attemptConnection(config.llmModel, false);
      } catch (err) {
          console.warn("Primary connection failed:", err);
          
          if (config.llmModel === MODEL_FLASH) {
              setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'system',
                  text: "Tentative de bascule vers le modèle Pro...",
                  timestamp: new Date()
              }]);
              
              try {
                  await attemptConnection(MODEL_PRO, true);
              } catch (fallbackErr) {
                   setError("Service indisponible (Fallback échoué)");
                   setConnectionState(ConnectionState.ERROR);
                   cleanupAudio();
              }
          } else {
              setError("Échec de connexion au modèle sélectionné.");
              setConnectionState(ConnectionState.ERROR);
              cleanupAudio();
          }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Échec de la connexion");
      setConnectionState(ConnectionState.ERROR);
      cleanupAudio();
    }
  }, [cleanupAudio, disconnect]);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = 0;
    const updateOutputVolume = (time: number) => {
       if (analyzerRef.current) {
          if (time - lastTime > 50) {
            const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
            analyzerRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setAssistantVolume(avg);
            lastTime = time;
          }
       }
       animationFrame = requestAnimationFrame(updateOutputVolume);
    };
    animationFrame = requestAnimationFrame(updateOutputVolume);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return {
    connectionState,
    connect,
    disconnect,
    messages,
    error,
    volume: userVolume,
    userVolume,
    assistantVolume,
    setVolumeMultiplier,
    sendText
  };
};
