/**
 * API endpoint pour gerer les destinataires email depuis Supabase
 * 
 * GET : Recupere la liste des destinataires
 * POST : Ajoute un nouveau destinataire
 * PUT : Met a jour un destinataire existant
 * DELETE : Supprime un destinataire
 */

async function getSupabaseClient() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase non configure');
    }

    return createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  } catch (error) {
    console.error(' Erreur creation client Supabase:', error);
    throw error;
  }
}

/**
 * Recupere les adresses email actives pour un type de briefing
 */
export async function getActiveRecipients(briefingType = 'custom') {
  try {
    const supabase = await getSupabaseClient();
    
    // Mapper le type
    const typeMap = {
      'morning': 'morning',
      'midday': 'midday',
      'noon': 'midday',
      'evening': 'evening',
      'custom': 'custom'
    };
    
    const column = typeMap[briefingType] || 'custom';
    
    const { data, error } = await supabase
      .from('email_recipients')
      .select('email')
      .eq('active', true)
      .eq(column, true);
    
    if (error) {
      console.error(' Erreur recuperation destinataires:', error);
      return ['projetsjsl@gmail.com']; // Fallback
    }
    
    return data?.map(r => r.email) || ['projetsjsl@gmail.com'];
  } catch (error) {
    console.error(' Erreur getActiveRecipients:', error);
    return ['projetsjsl@gmail.com'];
  }
}

/**
 * Recupere l'adresse email pour les previews
 */
export async function getPreviewEmail() {
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('email_recipients')
      .select('email')
      .eq('is_preview', true)
      .eq('active', true)
      .limit(1)
      .single();
    
    if (error || !data) {
      console.error(' Erreur recuperation email preview:', error);
      // Fallback: essayer de recuperer depuis config si Supabase echoue
      try {
        const { readFileSync } = await import('fs');
        const { join, dirname } = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const configPath = join(__dirname, '..', 'config', 'email-recipients.json');
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        return config.preview_email?.address || 'projetsjsl@gmail.com';
      } catch (fallbackError) {
        return 'projetsjsl@gmail.com';
      }
    }
    
    return data.email;
  } catch (error) {
    console.error(' Erreur getPreviewEmail:', error);
    return 'projetsjsl@gmail.com';
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = await getSupabaseClient();

    if (req.method === 'GET') {
      // Recuperer tous les destinataires
      const { data, error } = await supabase
        .from('email_recipients')
        .select('*')
        .order('email', { ascending: true });

      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      // Recuperer l'email de preview
      const { data: previewData } = await supabase
        .from('email_recipients')
        .select('email')
        .eq('is_preview', true)
        .eq('active', true)
        .limit(1)
        .single();

      return res.status(200).json({
        success: true,
        recipients: data || [],
        preview_email: previewData?.email || 'projetsjsl@gmail.com'
      });

    } else if (req.method === 'POST') {
      // Ajouter un nouveau destinataire
      const { email, label, morning, midday, evening, custom, is_preview } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          error: 'Email invalide'
        });
      }

      const { data, error } = await supabase
        .from('email_recipients')
        .insert({
          email,
          label: label || email,
          morning: morning || false,
          midday: midday || false,
          evening: evening || false,
          custom: custom || false,
          is_preview: is_preview || false,
          active: true
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          return res.status(409).json({
            success: false,
            error: 'Cet email existe deja'
          });
        }
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      return res.status(201).json({
        success: true,
        message: 'Destinataire ajoute avec succes',
        recipient: data
      });

    } else if (req.method === 'PUT') {
      // Mettre a jour un destinataire
      const { id, email, label, morning, midday, evening, custom, is_preview, active } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID requis pour la mise a jour'
        });
      }

      const updateData = {};
      if (email !== undefined) updateData.email = email;
      if (label !== undefined) updateData.label = label;
      if (morning !== undefined) updateData.morning = morning;
      if (midday !== undefined) updateData.midday = midday;
      if (evening !== undefined) updateData.evening = evening;
      if (custom !== undefined) updateData.custom = custom;
      if (is_preview !== undefined) updateData.is_preview = is_preview;
      if (active !== undefined) updateData.active = active;

      const { data, error } = await supabase
        .from('email_recipients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Destinataire mis a jour avec succes',
        recipient: data
      });

    } else if (req.method === 'DELETE') {
      // Supprimer un destinataire
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID requis pour la suppression'
        });
      }

      const { error } = await supabase
        .from('email_recipients')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Destinataire supprime avec succes'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error(' Erreur API email-recipients:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
