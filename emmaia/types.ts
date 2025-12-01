

export interface AudioBlob {
  data: string;
  mimeType: string;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface VisualizerData {
  volume: number;
}

export type AvatarProvider = 'heygen' | 'akool';

export type HeyGenEmotion = 'Excited' | 'Serious' | 'Friendly' | 'Soothing' | 'Broadcaster';
export type HeyGenQuality = 'low' | 'medium' | 'high';

export interface AvatarConfig {
  // LLM Brain Settings
  systemInstruction: string;
  llmModel: string;
  llmTemperature: number; // 0.0 to 2.0
  geminiVoice: string;
  chatMode?: 'solo' | 'panel';

  // HeyGen Specifics
  heygenToken: string;
  heygenAvatarId: string;
  heygenQuality: HeyGenQuality;
  heygenVoiceId?: string; // Optional specific voice ID
  heygenEmotion: HeyGenEmotion;
  heygenRemoveBackground: boolean; // True = Transparent/GreenScreen style
  
  // Akool Specifics
  akoolToken: string;
  akoolAvatarId: string;
  akoolModelUrl?: string; // For enterprise endpoints
  akoolRegion: 'us-west' | 'eu-central' | 'asia-east';
  akoolFaceEnhance: boolean;

  // Global Settings
  activeProvider: 'both' | 'heygen' | 'akool';
  muteGeminiAudio: boolean; // If true, rely on Avatar's TTS audio instead of Gemini's
  
  // Integrations
  integrationConfig: IntegrationConfig;
}

// Granular Section Configuration
export interface SectionConfig {
    id: string; // e.g., 'ceo', 'critic', 'finance'
    name: string;
    systemPrompt: string;
    avatarId: string;
    voiceName: string;
    temperature: number;
    // Extra specific fields
    customField1?: string; // e.g., Ticker for CEO
    customField2?: string; // e.g., Company Name
}

export type ModeConfigMap = Record<string, SectionConfig>;

export interface IntegrationConfig {
    supabaseUrl: string;
    supabaseKey: string;
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioFromPhone: string;
    resendApiKey: string;
    userPhoneNumber: string; // Target for SMS
    userEmail: string; // Target for Email
}

export interface SessionLog {
    id: string;
    date: string;
    duration: string;
    summary: string;
    sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Critical';
    messageCount: number;
}

export interface AvatarSession {
  sessionId: string;
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
}

// --- Personality & Context Analysis Types ---

export type RiskLevel = 'Conservateur' | 'Modéré' | 'Audacieux' | 'Spéculatif';

export interface PersonalityAnalysis {
  riskProfile: RiskLevel;
  riskScore: number; // 0 to 100
  emotionalState: string; 
  perceivedNeeds: string[];
  keyTraits: string[];
  summary: string;
  lastUpdated: Date;
}

// Visual Context Items for the Side Panel
export type ContextItemType = 'chart' | 'news' | 'citation' | 'image' | 'alert';

export interface ContextItem {
    id: string;
    type: ContextItemType;
    title: string;
    topic?: string; // New: AI determined topic (e.g., "Tech", "Oil", "Forex")
    content: string; // Could be JSON for chart, or text for citation
    url?: string;
    timestamp: Date;
    metadata?: any; // For chart data series
}

export interface Persona {
    id: string;
    name: string;
    role: string;
    description: string;
    avatarId: string;
    voiceName: string;
    systemPrompt: string;
    baseConfig: Partial<AvatarConfig>;
}

export interface SmartSuggestion {
    id: string;
    type: 'question' | 'news';
    text: string;
    category: string;
}

export interface SpeakerStats {
    userTime: number;
    aiTime: Record<string, number>; // "Chloé": 120, "Marc": 45
    lastActive: string | null;
}

export type AppMode = 'text-chat' | 'avatar-hybrid' | 'tavus-video' | 'letter-writer' | 'researcher' | 'ceo-mode' | 'critic-mode' | 'technical-analyst';

export type TextModel = 'gemini-2.5-flash' | 'gemini-2.0-pro-exp-02-05' | 'gemini-2.5-flash-native-audio-preview-09-2025' | 'gemini-2.5-flash-thinking';

export interface QuickAction {
    id: string;
    label: string;
    command: string;
    icon: 'TrendingUp' | 'Newspaper' | 'ShieldAlert' | 'Mail' | 'Zap' | 'Briefcase' | 'Search' | 'Smile';
    isSystem?: boolean; // If true, handled specially (like opening modal)
}

// Letter Writer Types
export interface DocumentSection {
    heading: string;
    content: string;
}

export interface FinancialDocument {
    title: string;
    date: string;
    sections: DocumentSection[];
    footer: string;
}

// Researcher Types
export interface BriefingData {
    marketSentiment: 'Bearish' | 'Neutral' | 'Bullish';
    topMovers: Array<{ ticker: string; change: string; price: string }>;
    breakingNews: Array<{ time: string; headline: string; impact: 'High' | 'Medium' | 'Low' }>;
    portfolioAlerts: string[];
}

export interface Notification {
    id: string;
    type: 'alert' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

// CEO Mode Types
export interface CompanyInfo {
    name: string;
    ticker: string;
    industry: string;
    logoUrl?: string;
}

// Critic Mode Types
export interface RiskItem {
    category: 'Financier' | 'Légal' | 'Opérationnel' | 'Réputation' | 'Marché';
    severity: 'Extrême' | 'Élevé' | 'Moyen';
    description: string;
    redFlag: boolean;
}

export interface RiskReport {
    targetEntity: string;
    overallRiskScore: number; // 0-100 (100 is maximal risk)
    risks: RiskItem[];
    verdict: string;
}

// Technical Analyst Mode Types
export interface TechnicalAnalysisData {
    ticker: string;
    price: string;
    change: string;
    rsi: number; // 0-100
    macd: { value: number; signal: number; histogram: number }; // Histogram positive = bullish
    movingAverages: { sma50: string; sma200: string; status: 'Death Cross' | 'Golden Cross' | 'Neutral' };
    levels: { support: string; resistance: string };
    patterns: string[]; // e.g., ["Head & Shoulders", "Bull Flag"]
    signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
}

export interface EcosystemNode {
    id: string;
    label: string;
    description: string;
    icon: any;
    color: string;
    type: 'core' | 'avatar' | 'tool';
    connectedTo: string[];
}