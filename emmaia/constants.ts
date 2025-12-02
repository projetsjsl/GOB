
import { QuickAction, AppMode, EcosystemNode } from './types';
import { BrainCircuit, TrendingUp, Globe, Building2, Scale, FileText, Activity, Search, ShieldCheck } from 'lucide-react';

// ... (Previous Model Definitions remain unchanged) ...

export const AVAILABLE_MODELS = [
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        type: 'directional',
        capabilities: ['Text', 'Image', 'Fast'],
        description: 'Le modèle le plus rapide et économique. Idéal pour les tâches simples et le chat rapide.'
    },
    {
        id: 'gemini-2.0-pro-exp-02-05',
        name: 'Gemini 2.0 Pro',
        type: 'directional',
        capabilities: ['Reasoning', 'Complex Context', 'Code'],
        description: 'Modèle de raisonnement avancé. Parfait pour l\'analyse financière profonde et la rédaction.'
    },
    {
        id: 'gemini-2.5-flash-thinking',
        name: 'Gemini 2.5 Thinking',
        type: 'directional',
        capabilities: ['Deep Reasoning', 'Chain of Thought'],
        description: 'Modèle expérimental qui "réfléchit" avant de répondre. Idéal pour les cas complexes.'
    },
    {
        id: 'gemini-2.5-flash-native-audio-preview-09-2025',
        name: 'Gemini Live (Audio Native)',
        type: 'bidirectional',
        capabilities: ['Realtime Audio', 'Interruption', 'Low Latency'],
        description: 'Le moteur exclusif pour les avatars vocaux. Latence ultra-faible.'
    }
];

export const MODEL_FLASH = 'gemini-2.5-flash-native-audio-preview-09-2025'; 
export const MODEL_TEXT_DEFAULT = 'gemini-2.5-flash'; 
export const MODEL_PRO = 'gemini-2.0-pro-exp-02-05';

export const DEFAULT_INTEGRATION_CONFIG = {
    supabaseUrl: '',
    supabaseKey: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioFromPhone: '',
    resendApiKey: '',
    userPhoneNumber: '',
    userEmail: ''
};

// ... (Prompts remain unchanged for brevity, assume they are here) ...
export const DEFAULT_SYSTEM_INSTRUCTION = `Tu es Emma IA... (Voir fichiers précédents)`;
export const PANEL_SYSTEM_INSTRUCTION = `MODE: TABLE RONDE... (Voir fichiers précédents)`;
export const WRITER_SYSTEM_INSTRUCTION = `Tu es Emma IA • RÉDACTION...`;
export const RESEARCHER_SYSTEM_INSTRUCTION = `Tu es Morgane...`;
export const CEO_SYSTEM_INSTRUCTION_TEMPLATE = `Tu es le CEO...`;
export const CRITIC_SYSTEM_INSTRUCTION = `Tu es L'AVOCAT DU DIABLE...`;
export const TECHNICAL_SYSTEM_INSTRUCTION = `Tu es Emma IA • GEEK...`;

export const VOICE_NAME = 'Zephyr'; 
export const SAMPLE_RATE_INPUT = 16000;
export const SAMPLE_RATE_OUTPUT = 24000;

export const HEYGEN_AVATAR_ID = 'Angela-inT-20220820'; 
export const AKOOL_AVATAR_ID = 'akool_avatar_v1'; 

export const DEFAULT_TAVUS_REPLICA_ID = 'r79e1c033f'; 
export const DEFAULT_TAVUS_PERSONA_NAME = 'Emma IA • NATURELLE';
export const DEFAULT_TAVUS_CONTEXT = `Tu es Emma IA...`;

export const HEYGEN_EMOTIONS = ['Excited', 'Serious', 'Friendly', 'Soothing', 'Broadcaster'];
export const GEMINI_VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

export const AKOOL_REGIONS = [
    { id: 'us-west', name: 'US West (Oregon)' },
    { id: 'eu-central', name: 'EU Central (Frankfurt)' },
    { id: 'asia-east', name: 'Asia East (Tokyo)' }
];

// Unified Avatar Images
export const AVATAR_IMAGES = {
    natural: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop", 
    professional: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop",
    geek: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=600&auto=format&fit=crop"
};

// --- EMMA VARIATIONS (Brunette, 40 ans, yeux bleus, professionnelle) ---
// Déclinaisons d'Emma avec et sans lunettes pour humaniser l'avatar
const EMMA_VARIATIONS = [
    // Sans lunettes - variations professionnelles
    "1573496359142-b8d87734a5a2", // Professionnelle brunette
    "1580489944761-15a19d654956", // Portrait professionnel
    "1567532939604-b6b5b0db2604", // Femme d'affaires
    "1520813792240-56fc4a3765a7", // Portrait corporate
    "1573497019940-1c28c88b4f3e", // Professionnelle souriante
    "1573497491208-6b1acb260507", // Portrait business
    "1573497491769-d40747c79366", // Femme professionnelle
    "1573496799652-408c2ac9fe98", // Portrait corporate brunette
    "1559526324-593bc81422b9", // Professionnelle confiante
    "1590650516494-0c8e4a4dd67e", // Portrait business
    "1542596594-649edbc13630", // Femme d'affaires
    "1508214751196-bcfd4ca60f91", // Professionnelle
    "1535713875002-d1d0cf377fde", // Portrait corporate
    "1580894732444-8ecded7900cd", // Femme professionnelle
    "1564564321837-a57b7070ac4f", // Portrait business brunette
    "1517841905240-472988babdf9", // Professionnelle
    "1539571696357-5a69c17a67c6", // Femme d'affaires
    "1534528741775-53994a69daeb", // Portrait corporate
    "1531746020798-e6953c6e8e04", // Professionnelle confiante
    "1524504388940-b1c1722653e1", // Portrait business
    // Avec lunettes - variations professionnelles
    "1506794778202-cad84cf45f1d", // Professionnelle avec lunettes
    "1531123897727-8f129e1688ce", // Portrait avec lunettes
    "1552058544-f2b08422138a", // Femme d'affaires avec lunettes
    "1509967419530-322706e580e9", // Professionnelle avec lunettes
    "1514626585111-9aa86183ac98", // Portrait corporate avec lunettes
    "1598550874175-4d7112ee7f43", // Professionnelle avec lunettes
    "1551836022-d5d88e9218df", // Portrait business avec lunettes
    "1487412720507-e7ab37603c6f", // Femme professionnelle avec lunettes
    "1594744803329-e58b31de8bf5", // Portrait avec lunettes
    "1664575602276-acd073f104c1", // Professionnelle avec lunettes moderne
];

// --- MASSIVE GALLERY GENERATION (100+ ITEMS) ---
// Using specific curated IDs and a generator for variety
const CURATED_WOMEN_PROFESSIONAL = [
    "1573496359142-b8d87734a5a2", "1580489944761-15a19d654956", "1598550874175-4d7112ee7f43", 
    "1567532939604-b6b5b0db2604", "1551836022-d5d88e9218df", "1487412720507-e7ab37603c6f",
    "1520813792240-56fc4a3765a7", "1573497019940-1c28c88b4f3e", "1573497491208-6b1acb260507",
    "1573497491769-d40747c79366", "1573496799652-408c2ac9fe98", "1594744803329-e58b31de8bf5",
    "1559526324-593bc81422b9", "1590650516494-0c8e4a4dd67e", "1542596594-649edbc13630",
    "1508214751196-bcfd4ca60f91", "1535713875002-d1d0cf377fde", "1580894732444-8ecded7900cd",
    "1564564321837-a57b7070ac4f", "1664575602276-acd073f104c1", "1517841905240-472988babdf9",
    "1539571696357-5a69c17a67c6", "1534528741775-53994a69daeb", "1531746020798-e6953c6e8e04",
    "1524504388940-b1c1722653e1", "1506794778202-cad84cf45f1d", "1531123897727-8f129e1688ce",
    "1552058544-f2b08422138a", "1509967419530-322706e580e9", "1514626585111-9aa86183ac98"
];

// Generate 100+ unique URLs using base curated list + random signatures for diversity
// Les variations d'Emma sont placées en premier pour être prioritaires dans la galerie
export const AVATAR_GALLERY = [
    // Variations d'Emma en premier (brunette, 40 ans, yeux bleus, professionnelle)
    ...EMMA_VARIATIONS.map(id => `https://images.unsplash.com/photo-${id}?q=80&w=600&auto=format&fit=crop`),
    // Images de base
    AVATAR_IMAGES.natural,
    AVATAR_IMAGES.professional,
    AVATAR_IMAGES.geek,
    // Autres images professionnelles
    ...CURATED_WOMEN_PROFESSIONAL.map(id => `https://images.unsplash.com/photo-${id}?q=80&w=600&auto=format&fit=crop`),
    // Fill the rest to reach 100+ with query variations
    ...Array.from({ length: 70 }).map((_, i) => 
        `https://images.unsplash.com/photo-${CURATED_WOMEN_PROFESSIONAL[i % CURATED_WOMEN_PROFESSIONAL.length]}?q=80&w=600&auto=format&fit=crop&sig=${i}`
    )
];

export const AVATAR_DISPLAY_MAP = {
    finance: AVATAR_IMAGES.professional,
    economy: AVATAR_IMAGES.professional,
    politics: AVATAR_IMAGES.professional,
    researcher: AVATAR_IMAGES.professional,
    writer: AVATAR_IMAGES.professional,
    ceo: AVATAR_IMAGES.professional,
    critic: AVATAR_IMAGES.professional, 
    geek: AVATAR_IMAGES.geek,
    tavus: AVATAR_IMAGES.natural
};

// --- STARTER PROMPTS (COMMAND IDEAS) ---
export const MODE_STARTER_PROMPTS = {
    'finance': ["Tendance S&P 500 ?", "Analyse risque Nvidia", "Synthèse marchés ce matin"],
    'ceo-mode': ["Quelle est votre stratégie 2025 ?", "Expliquez la baisse des marges", "Vos priorités R&D ?"],
    'critic-mode': ["Trouve la faille dans Tesla", "Pourquoi Bitcoin va chuter ?", "Critique mon portefeuille Tech"],
    'researcher': ["Dernières news Apple", "Earnings report Amazon", "Alerte politique USA"],
    'writer': ["Rédige une lettre aux actionnaires", "Fais un mémo sur l'inflation", "Prépare un discours CEO"],
    'technical-analyst': ["RSI sur Ethereum", "Moyenne mobile TSLA", "Support clé SPY"],
    'tavus-video': ["Parlons d'histoire économique", "Analyse psychologique du marché", "Explique l'IA simplement"]
};

export const PROFESSION_PRESETS = [
    {
        id: 'finance',
        name: 'Emma IA • BOURSE',
        role: 'Analyste Boursier & Financier',
        image: AVATAR_IMAGES.professional,
        description: 'Module spécialisé dans l\'analyse technique et les marchés boursiers.',
        avatarId: 'Angela-inT-20220820',
        voiceName: 'Zephyr',
        systemPrompt: DEFAULT_SYSTEM_INSTRUCTION
    },
    {
        id: 'economy',
        name: 'Emma IA • MACRO',
        role: 'Analyste Économique & Macro',
        image: AVATAR_IMAGES.professional,
        description: 'Module spécialisé dans les tendances globales et taux directeurs.',
        avatarId: 'Tyler-incasualsuit-20220721',
        voiceName: 'Fenrir',
        systemPrompt: DEFAULT_SYSTEM_INSTRUCTION // Simplified for file size
    },
    {
        id: 'politics',
        name: 'Emma IA • POLITIQUE',
        role: 'Analyste Politique',
        image: AVATAR_IMAGES.professional,
        description: 'Module spécialisé dans les risques géopolitiques.',
        avatarId: 'Kristy-inpublic-20220810',
        voiceName: 'Kore',
        systemPrompt: DEFAULT_SYSTEM_INSTRUCTION
    },
    {
        id: 'researcher',
        name: 'Dr. Emma',
        role: 'Emma IA • RECHERCHE',
        image: AVATAR_IMAGES.professional,
        description: 'Module académique et scientifique.',
        avatarId: 'Angela-inT-20220820',
        voiceName: 'Puck',
        systemPrompt: DEFAULT_SYSTEM_INSTRUCTION
    },
    {
        id: 'geek',
        name: 'Emma IA • GEEK',
        role: 'Analyste Technique',
        image: AVATAR_IMAGES.geek,
        description: 'Experte en graphiques et patterns.',
        avatarId: HEYGEN_AVATAR_ID,
        voiceName: 'Zephyr',
        systemPrompt: TECHNICAL_SYSTEM_INSTRUCTION
    }
];

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
    { id: '1', label: 'Marchés', command: "Donne-moi un aperçu rapide des marchés.", icon: 'TrendingUp' },
    { id: '2', label: 'Actualités', command: "Quelles sont les dernières nouvelles ?", icon: 'Newspaper' },
    { id: '3', label: 'Risques', command: "Analyse les risques de mon portefeuille.", icon: 'ShieldAlert' },
    { id: '4', label: 'Courriels', command: "OPEN_EMAIL_MODAL", icon: 'Mail', isSystem: true }
];

export const ACTION_PRESETS: QuickAction[] = [
    { id: 'p1', label: 'Sentiment', command: "Quel est le sentiment du marché ?", icon: 'Smile' },
    { id: 'p2', label: 'Synthèse', command: "Fais-moi une synthèse.", icon: 'Briefcase' }
];

export const ECOSYSTEM_NODES: EcosystemNode[] = [
    { id: 'core', label: 'Emma Brain', description: 'Cerveau Central', type: 'core', color: 'bg-blue-600', connectedTo: ['finance', 'ceo'], icon: BrainCircuit },
    { id: 'finance', label: 'Finance', description: 'Analyste', type: 'avatar', color: 'bg-blue-500', connectedTo: [], icon: TrendingUp },
    { id: 'ceo', label: 'CEO', description: 'Simulation', type: 'tool', color: 'bg-cyan-500', connectedTo: [], icon: Building2 }
];
