/**
 * API endpoint pour envoyer un message dans un salon de chat integre
 * POST /api/groupchat/integrated/send-message
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            roomId,
            userId,
            userDisplayName,
            userIcon = '',
            message,
            skipAssistant = false, // Ne pas appeler le LLM automatiquement
            forceAssistant = false // Forcer l'appel du LLM (pour appel manuel)
        } = req.body;

        // Validation
        if (!roomId || !userId || !userDisplayName || !message) {
            return res.status(400).json({
                success: false,
                error: 'roomId, userId, userDisplayName et message sont requis'
            });
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Verifier que le salon existe et est actif
        const { data: room, error: roomError } = await supabase
            .from('group_chat_rooms')
            .select('*')
            .eq('id', roomId)
            .eq('is_active', true)
            .single();

        if (roomError || !room) {
            return res.status(404).json({
                success: false,
                error: 'Salon non trouve ou inactif'
            });
        }

        // Sauvegarder le message utilisateur
        const { data: userMessage, error: messageError } = await supabase
            .from('group_chat_messages')
            .insert([{
                room_id: roomId,
                user_id: userId,
                user_display_name: userDisplayName,
                user_icon: userIcon,
                role: 'user',
                content: message
            }])
            .select()
            .single();

        if (messageError) {
            console.error('Erreur sauvegarde message:', messageError);
            return res.status(500).json({
                success: false,
                error: 'Erreur sauvegarde message',
                details: messageError.message
            });
        }

        // Mettre a jour la presence de l'utilisateur
        await supabase
            .from('group_chat_participants')
            .upsert([{
                room_id: roomId,
                user_id: userId,
                user_display_name: userDisplayName,
                user_icon: userIcon,
                is_online: true,
                last_seen: new Date().toISOString()
            }], {
                onConflict: 'room_id,user_id'
            });

        // Appeler l'API OpenAI pour obtenir la reponse
        //  LOGIQUE: Ne pas appeler si skipAssistant=true, OU forcer si forceAssistant=true
        const openaiApiKey = process.env.OPENAI_API_KEY;
        let assistantMessage = null;
        let assistantMessageId = null;

        const shouldCallAssistant = !skipAssistant || forceAssistant;

        if (openaiApiKey && shouldCallAssistant) {
            try {
                // Recuperer les derniers messages pour le contexte
                const { data: recentMessages, error: historyError } = await supabase
                    .from('group_chat_messages')
                    .select('role, content, user_display_name')
                    .eq('room_id', roomId)
                    .order('created_at', { ascending: false })
                    .limit(room.max_messages || 20);

                // Construire le contexte pour OpenAI
                const messagesForOpenAI = [];
                
                // Ajouter le system prompt si disponible
                if (room.system_prompt) {
                    messagesForOpenAI.push({
                        role: 'system',
                        content: room.system_prompt
                    });
                }

                // Ajouter l'historique (inverse pour avoir l'ordre chronologique)
                if (recentMessages && !historyError) {
                    recentMessages.reverse().forEach(msg => {
                        messagesForOpenAI.push({
                            role: msg.role === 'assistant' ? 'assistant' : 'user',
                            content: msg.role === 'user' 
                                ? `${msg.user_display_name}: ${msg.content}`
                                : msg.content
                        });
                    });
                }

                // Appeler OpenAI
                const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openaiApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o', // ou 'gpt-3.5-turbo' pour economiser
                        messages: messagesForOpenAI,
                        temperature: room.temperature || 0.7,
                        max_tokens: 2000
                    })
                });

                if (openaiResponse.ok) {
                    const openaiData = await openaiResponse.json();
                    
                    if (openaiData.choices && openaiData.choices[0]) {
                        assistantMessage = openaiData.choices[0].message.content;
                        
                        // Sauvegarder la reponse de l'assistant
                        const { data: savedAssistant, error: assistantError } = await supabase
                            .from('group_chat_messages')
                            .insert([{
                                room_id: roomId,
                                user_id: 'assistant',
                                user_display_name: 'ChatGPT',
                                user_icon: '',
                                role: 'assistant',
                                content: assistantMessage,
                                metadata: {
                                    model: openaiData.model,
                                    usage: openaiData.usage,
                                    temperature: room.temperature
                                }
                            }])
                            .select()
                            .single();

                        if (!assistantError && savedAssistant) {
                            assistantMessageId = savedAssistant.id;
                        }
                    }
                } else {
                    const errorText = await openaiResponse.text();
                    console.warn('Erreur API OpenAI:', errorText);
                    // Si c'est un appel force, retourner l'erreur
                    if (forceAssistant) {
                        return res.status(500).json({
                            success: false,
                            error: 'Erreur generation reponse ChatGPT',
                            details: errorText
                        });
                    }
                }
            } catch (openaiError) {
                console.error('Erreur appel OpenAI:', openaiError);
                // Si c'est un appel force, retourner l'erreur
                if (forceAssistant) {
                    return res.status(500).json({
                        success: false,
                        error: 'Erreur appel OpenAI',
                        details: openaiError.message
                    });
                }
                // Sinon, ne pas echouer - on retourne quand meme le message utilisateur
            }
        } else if (forceAssistant && !openaiApiKey) {
            // Si on force l'appel mais qu'il n'y a pas de cle API
            return res.status(503).json({
                success: false,
                error: 'OPENAI_API_KEY non configuree',
                note: 'Configurez OPENAI_API_KEY dans Vercel pour utiliser le chat integre'
            });
        }

        return res.status(200).json({
            success: true,
            userMessage: {
                id: userMessage.id,
                content: userMessage.content,
                createdAt: userMessage.created_at
            },
            assistantMessage: assistantMessage ? {
                id: assistantMessageId,
                content: assistantMessage,
                createdAt: new Date().toISOString()
            } : null,
            note: openaiApiKey ? null : 'OPENAI_API_KEY non configuree - Reponse assistant non generee'
        });

    } catch (error) {
        console.error('Erreur API send-message:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

