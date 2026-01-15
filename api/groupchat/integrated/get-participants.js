/**
 * API endpoint pour recuperer les participants actifs d'un salon
 * GET /api/groupchat/integrated/get-participants?roomId=xxx
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
        const { roomId } = req.query;

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

        // Recuperer les participants en ligne (derniere activite < 30 secondes)
        const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();

        const { data: participants, error: participantsError } = await supabase
            .from('group_chat_participants')
            .select('*')
            .eq('room_id', roomId)
            .gte('last_seen', thirtySecondsAgo)
            .order('last_seen', { ascending: false });

        if (participantsError) {
            console.error('Erreur recuperation participants:', participantsError);
            return res.status(500).json({
                success: false,
                error: 'Erreur recuperation participants',
                details: participantsError.message
            });
        }

        return res.status(200).json({
            success: true,
            participants: participants || [],
            count: participants?.length || 0
        });

    } catch (error) {
        console.error('Erreur API get-participants:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

