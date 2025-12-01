
import { createClient } from '@supabase/supabase-js';
import { IntegrationConfig, SessionLog, ChatMessage } from '../types';

export class IntegrationService {
    private supabase: any = null;
    private config: IntegrationConfig;

    constructor(config: IntegrationConfig) {
        this.config = config;
        if (config.supabaseUrl && config.supabaseKey) {
            this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
        }
    }

    async logSession(messages: ChatMessage[], durationSeconds: number): Promise<void> {
        if (!this.supabase) {
            console.warn("Supabase not configured. Skipping log.");
            return;
        }

        const userMessages = messages.filter(m => m.role === 'user');
        const aiMessages = messages.filter(m => m.role === 'assistant');

        // Simple mock sentiment analysis
        const sentiment = userMessages.length > 5 ? 'Positive' : 'Neutral';
        
        const summary = `Session de ${Math.floor(durationSeconds / 60)} min avec ${messages.length} échanges.`;

        const { error } = await this.supabase
            .from('chat_logs')
            .insert({
                date: new Date().toISOString(),
                duration: `${durationSeconds}s`,
                summary: summary,
                sentiment: sentiment,
                message_count: messages.length,
                transcript: JSON.stringify(messages)
            });

        if (error) console.error("Error logging to Supabase:", error);
    }

    async getHistory(): Promise<SessionLog[]> {
        if (!this.supabase) {
            // Return mock history for demo purposes if no DB connected
            return [
                { id: '1', date: new Date(Date.now() - 86400000).toISOString(), duration: '12m', summary: 'Discussion sur le NASDAQ', sentiment: 'Positive', messageCount: 24 },
                { id: '2', date: new Date(Date.now() - 172800000).toISOString(), duration: '5m', summary: 'Question rapide sur l\'inflation', sentiment: 'Neutral', messageCount: 8 },
                { id: '3', date: new Date(Date.now() - 259200000).toISOString(), duration: '22m', summary: 'Plainte client service', sentiment: 'Critical', messageCount: 45 },
            ];
        }

        const { data, error } = await this.supabase
            .from('chat_logs')
            .select('*')
            .order('date', { ascending: false })
            .limit(10);

        if (error) {
            console.error("Error fetching history:", error);
            return [];
        }

        return data as SessionLog[];
    }

    async sendSMS(body: string): Promise<boolean> {
        if (!this.config.twilioAccountSid || !this.config.twilioAuthToken) {
            console.log("Mock SMS Sent:", body);
            return true; // Simulate success
        }

        // In a real production app, you CANNOT call Twilio directly from browser due to CORS and Security.
        // You must call a backend function (Supabase Edge Function / Next.js API).
        // This is a placeholder for that call.
        console.log(`Calling Backend to Send SMS to ${this.config.userPhoneNumber}: ${body}`);
        return true;
    }

    async sendEmail(subject: string, body: string): Promise<boolean> {
        if (!this.config.resendApiKey) {
            console.log("Mock Email Sent:", subject);
            return true;
        }

        // Similar to Twilio, this must go through a backend proxy.
        console.log(`Calling Backend to Send Email to ${this.config.userEmail}: ${subject}`);
        return true;
    }
}
