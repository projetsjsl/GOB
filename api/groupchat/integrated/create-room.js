/**
 * API endpoint pour créer un nouveau salon de chat intégré
 * POST /api/groupchat/integrated/create-room
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
            roomName,
            adminUserId,
            adminDisplayName,
            systemPrompt,
            welcomeMessage,
            temperature = 0.7,
            maxMessages = 500,
            allowGuests = true
        } = req.body;

        // Validation
        if (!roomName || !adminUserId || !adminDisplayName) {
            return res.status(400).json({
                success: false,
                error: 'roomName, adminUserId et adminDisplayName sont requis'
            });
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Générer un code de salon unique
        // Note: La fonction RPC generate_room_code() doit être créée dans Supabase
        // Fallback: génération côté serveur si la fonction n'existe pas
        let roomCode;
        try {
            const { data: codeData, error: codeError } = await supabase.rpc('generate_room_code');
            if (!codeError && codeData) {
                roomCode = codeData;
            } else {
                throw new Error('RPC function not available');
            }
        } catch (error) {
            // Fallback: génération côté serveur
            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            const timePart = Date.now().toString().slice(-4);
            roomCode = `GOB-${randomPart}-${timePart}`;
            
            // Vérifier que le code n'existe pas déjà (peu probable mais sécurité)
            const { data: existing } = await supabase
                .from('group_chat_rooms')
                .select('id')
                .eq('room_code', roomCode)
                .single();
            
            if (existing) {
                // Si le code existe, en générer un nouveau
                roomCode = `GOB-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
            }
        }

        // Créer le salon
        const { data: room, error: createError } = await supabase
            .from('group_chat_rooms')
            .insert([{
                room_name: roomName,
                room_code: roomCode,
                admin_user_id: adminUserId,
                admin_display_name: adminDisplayName,
                system_prompt: systemPrompt || null,
                welcome_message: welcomeMessage || null,
                temperature: temperature,
                max_messages: maxMessages,
                allow_guests: allowGuests,
                is_active: true
            }])
            .select()
            .single();

        if (createError) {
            console.error('Erreur création salon:', createError);
            return res.status(500).json({
                success: false,
                error: 'Erreur création salon',
                details: createError.message
            });
        }

        // Ajouter l'admin comme participant
        await supabase
            .from('group_chat_participants')
            .insert([{
                room_id: room.id,
                user_id: adminUserId,
                user_display_name: adminDisplayName,
                is_online: true
            }])
            .onConflict('room_id,user_id')
            .merge();

        // Ajouter le message de bienvenue si fourni
        if (welcomeMessage) {
            await supabase
                .from('group_chat_messages')
                .insert([{
                    room_id: room.id,
                    user_id: 'system',
                    user_display_name: 'Système',
                    role: 'system',
                    content: welcomeMessage
                }]);
        }

        return res.status(200).json({
            success: true,
            room: {
                id: room.id,
                roomName: room.room_name,
                roomCode: room.room_code,
                adminDisplayName: room.admin_display_name,
                createdAt: room.created_at
            }
        });

    } catch (error) {
        console.error('Erreur API create-room:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

