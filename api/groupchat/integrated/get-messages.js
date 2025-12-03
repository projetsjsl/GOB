/**
 * API endpoint pour récupérer les messages d'un salon de chat intégré
 * GET /api/groupchat/integrated/get-messages?roomId=xxx&limit=50
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { roomId, limit = 100, after } = req.query;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                error: 'roomId est requis'
            });
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Vérifier que le salon existe et est actif
        const { data: room, error: roomError } = await supabase
            .from('group_chat_rooms')
            .select('*')
            .eq('id', roomId)
            .eq('is_active', true)
            .single();

        if (roomError || !room) {
            return res.status(404).json({
                success: false,
                error: 'Salon non trouvé ou inactif'
            });
        }

        // Construire la requête
        let query = supabase
            .from('group_chat_messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });

        // Limiter le nombre de messages
        if (limit) {
            query = query.limit(parseInt(limit));
        }

        // Récupérer les messages après un timestamp si fourni
        if (after) {
            query = query.gt('created_at', after);
        }

        const { data: messages, error: messagesError } = await query;

        if (messagesError) {
            console.error('Erreur récupération messages:', messagesError);
            return res.status(500).json({
                success: false,
                error: 'Erreur récupération messages',
                details: messagesError.message
            });
        }

        return res.status(200).json({
            success: true,
            room: {
                id: room.id,
                roomName: room.room_name,
                roomCode: room.room_code,
                adminDisplayName: room.admin_display_name,
                systemPrompt: room.system_prompt,
                welcomeMessage: room.welcome_message
            },
            messages: messages || [],
            count: messages?.length || 0
        });

    } catch (error) {
        console.error('Erreur API get-messages:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

