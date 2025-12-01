
import { createClient } from '@supabase/supabase-js';
import { SectionConfig, ModeConfigMap, IntegrationConfig } from '../types';
import { 
    DEFAULT_SYSTEM_INSTRUCTION, 
    CEO_SYSTEM_INSTRUCTION_TEMPLATE, 
    CRITIC_SYSTEM_INSTRUCTION, 
    TECHNICAL_SYSTEM_INSTRUCTION, 
    RESEARCHER_SYSTEM_INSTRUCTION,
    WRITER_SYSTEM_INSTRUCTION,
    HEYGEN_AVATAR_ID,
    VOICE_NAME,
    DEFAULT_TAVUS_CONTEXT
} from '../constants';

// Default Hardcoded Configs (Fallbacks)
const DEFAULT_CONFIGS: ModeConfigMap = {
    'finance': {
        id: 'finance',
        name: 'Emma IA • BOURSE',
        systemPrompt: DEFAULT_SYSTEM_INSTRUCTION,
        avatarId: HEYGEN_AVATAR_ID,
        voiceName: VOICE_NAME,
        temperature: 0.6
    },
    'ceo': {
        id: 'ceo',
        name: 'CEO Simulator',
        systemPrompt: CEO_SYSTEM_INSTRUCTION_TEMPLATE,
        avatarId: 'Tyler-incasualsuit-20220721',
        voiceName: 'Charon',
        temperature: 0.7
    },
    'critic': {
        id: 'critic',
        name: 'Avocat du Diable',
        systemPrompt: CRITIC_SYSTEM_INSTRUCTION,
        avatarId: 'Kristy-inpublic-20220810',
        voiceName: 'Kore',
        temperature: 0.8
    },
    'geek': {
        id: 'geek',
        name: 'Emma • GEEK',
        systemPrompt: TECHNICAL_SYSTEM_INSTRUCTION,
        avatarId: HEYGEN_AVATAR_ID,
        voiceName: 'Zephyr',
        temperature: 0.5
    },
    'researcher': {
        id: 'researcher',
        name: 'Morgane Recherchiste',
        systemPrompt: RESEARCHER_SYSTEM_INSTRUCTION,
        avatarId: 'Angela-inT-20220820',
        voiceName: 'Puck',
        temperature: 0.4
    },
    'writer': {
        id: 'writer',
        name: 'Emma • RÉDACTION',
        systemPrompt: WRITER_SYSTEM_INSTRUCTION,
        avatarId: 'Angela-inT-20220820',
        voiceName: 'Fenrir',
        temperature: 0.7
    },
    'tavus': {
        id: 'tavus',
        name: 'Emma • NATURELLE',
        systemPrompt: DEFAULT_TAVUS_CONTEXT,
        avatarId: 'tavus-replica-id-default',
        voiceName: 'natural',
        temperature: 0.7
    }
};

export class ConfigService {
    private supabase: any = null;
    private memoryCache: ModeConfigMap = { ...DEFAULT_CONFIGS };

    constructor(config: IntegrationConfig) {
        if (config.supabaseUrl && config.supabaseKey) {
            this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
        }
    }

    // Load configs from DB, falling back to defaults
    async loadAllConfigs(): Promise<ModeConfigMap> {
        if (!this.supabase) {
            console.log("ConfigService: No DB, using defaults.");
            return this.memoryCache;
        }

        try {
            const { data, error } = await this.supabase
                .from('section_configs')
                .select('*');

            if (error) throw error;

            if (data) {
                data.forEach((row: any) => {
                    this.memoryCache[row.id] = {
                        id: row.id,
                        name: row.name,
                        systemPrompt: row.system_prompt,
                        avatarId: row.avatar_id,
                        voiceName: row.voice_name,
                        temperature: row.temperature,
                        customField1: row.custom_field_1,
                        customField2: row.custom_field_2
                    };
                });
            }
        } catch (e) {
            console.error("Failed to load configs from Supabase:", e);
        }

        return this.memoryCache;
    }

    async saveConfig(config: SectionConfig): Promise<boolean> {
        // Update cache
        this.memoryCache[config.id] = config;

        if (!this.supabase) {
            console.warn("ConfigService: Saving to memory only (No DB).");
            return true;
        }

        try {
            const { error } = await this.supabase
                .from('section_configs')
                .upsert({
                    id: config.id,
                    name: config.name,
                    system_prompt: config.systemPrompt,
                    avatar_id: config.avatarId,
                    voice_name: config.voiceName,
                    temperature: config.temperature,
                    custom_field_1: config.customField1,
                    custom_field_2: config.customField2,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Failed to save config to Supabase:", e);
            return false;
        }
    }

    getConfig(sectionId: string): SectionConfig {
        return this.memoryCache[sectionId] || DEFAULT_CONFIGS[sectionId] || DEFAULT_CONFIGS['finance'];
    }
}
