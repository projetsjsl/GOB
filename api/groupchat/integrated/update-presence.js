/**
 * API endpoint pour mettre a jour la presence d'un utilisateur
 * POST /api/groupchat/integrated/update-presence
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
            isOnline = true
        } = req.body;

        if (!roomId || !userId || !userDisplayName) {
            return res.status(400).json({
                success: false,
                error: 'roomId, userId et userDisplayName sont requis'
            });
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Mettre a jour ou creer la presence
        const { data: participant, error: presenceError } = await supabase
            .from('group_chat_participants')
            .upsert([{
                room_id: roomId,
                user_id: userId,
                user_display_name: userDisplayName,
                user_icon: userIcon,
                is_online: isOnline,
                last_seen: new Date().toISOString()
            }], {
                onConflict: 'room_id,user_id'
            })
            .select()
            .single();

        if (presenceError) {
            console.error('Erreur mise a jour presence:', presenceError);
            return res.status(500).json({
                success: false,
                error: 'Erreur mise a jour presence',
                details: presenceError.message
            });
        }

        return res.status(200).json({
            success: true,
            participant: participant
        });

    } catch (error) {
        console.error('Erreur API update-presence:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

