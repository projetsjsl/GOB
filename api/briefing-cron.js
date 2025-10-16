// ============================================================================
// API Endpoint: Briefing Cron
// Déclenchement automatisé des briefings Emma En Direct 3x/jour
// ============================================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Test de santé simple pour le diagnostic (sans authentification)
    if (req.method === 'GET' && !req.query.type) {
      return res.status(200).json({ 
        status: 'healthy',
        message: 'Briefing Cron API opérationnel',
        timestamp: new Date().toISOString()
      });
    }

    // Vérifier authentification (CRON_SECRET) pour les vraies opérations
    const authHeader = req.headers['authorization'];
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET non configuré');
      return res.status(500).json({ 
        success: false,
        error: 'Configuration serveur incomplète' 
      });
    }
    
    if (authHeader !== expectedAuth) {
      console.error('Tentative d\'accès non autorisée au cron:', authHeader);
      return res.status(401).json({ 
        success: false,
        error: 'Non autorisé' 
      });
    }

    // Récupérer le type de briefing
    const { type } = req.method === 'GET' ? req.query : req.body;
    
    if (!type || !['morning', 'midday', 'evening'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        error: 'Type de briefing requis (morning, midday, ou evening)' 
      });
    }

    console.log(`🤖 Cron déclenchement: ${type} briefing - ${new Date().toISOString()}`);

    // Générer le briefing automatiquement
    const result = await generateAndSendBriefing(type);
    
    return res.status(200).json({
      success: true,
      type,
      timestamp: new Date().toISOString(),
      result
    });
    
  } catch (error) {
    console.error('Erreur cron briefing:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// ============================================================================
// FONCTION DE GÉNÉRATION ET ENVOI AUTOMATIQUE VIA EMMA
// ============================================================================

async function generateAndSendBriefing(type) {
  const startTime = Date.now();
  const logs = [];
  
  try {
    logs.push({ step: 'START', message: `Début génération ${type} via Emma`, timestamp: new Date().toISOString() });
    
    // 1. Générer le briefing via Emma Agent
    logs.push({ step: 'EMMA_GENERATION', message: 'Génération briefing via Emma', timestamp: new Date().toISOString() });
    const emmaResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/emma-briefing?type=${type}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!emmaResponse.ok) {
      throw new Error(`Erreur Emma briefing: ${emmaResponse.statusText}`);
    }
    
    const emmaData = await emmaResponse.json();
    logs.push({ step: 'EMMA_GENERATION', message: 'Briefing généré par Emma', data: { success: emmaData.success, tools_used: emmaData.metadata?.tools_used }, timestamp: new Date().toISOString() });
    
    if (!emmaData.success) {
      throw new Error(`Emma briefing failed: ${emmaData.error}`);
    }
    
    // 2. Envoyer email via Resend
    if (process.env.RESEND_API_KEY && process.env.RESEND_TO_EMAIL) {
      logs.push({ step: 'EMAIL_SEND', message: 'Envoi email via Resend', timestamp: new Date().toISOString() });
      
      const emailResult = await sendEmailViaResend(emmaData.content, type);
      
      if (emailResult.success) {
        logs.push({ step: 'EMAIL_SEND', message: 'Email envoyé avec succès', data: { messageId: emailResult.messageId }, timestamp: new Date().toISOString() });
      } else {
        logs.push({ step: 'EMAIL_SEND', message: 'Erreur envoi email', data: { error: emailResult.error }, timestamp: new Date().toISOString() });
      }
    } else {
      logs.push({ step: 'EMAIL_SEND', message: 'Email non configuré (RESEND_API_KEY ou RESEND_TO_EMAIL manquant)', timestamp: new Date().toISOString() });
    }
    
    const duration = Date.now() - startTime;
    logs.push({ step: 'COMPLETE', message: `Briefing ${type} généré et envoyé avec succès`, duration: `${duration}ms`, timestamp: new Date().toISOString() });
    
    return {
      success: true,
      type,
      duration,
      logs,
      summary: {
        emmaGenerated: emmaData.success,
        toolsUsed: emmaData.metadata?.tools_used || [],
        isReliable: emmaData.metadata?.is_reliable || false,
        emailSent: !!(process.env.RESEND_API_KEY && process.env.RESEND_TO_EMAIL)
      }
    };
    
  } catch (error) {
    console.error(`Erreur génération ${type}:`, error);
    logs.push({ step: 'ERROR', message: error.message, timestamp: new Date().toISOString() });
    
    return {
      success: false,
      type,
      error: error.message,
      logs
    };
  }
}

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

async function sendEmailViaResend(htmlContent, type) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const subject = getSubjectForType(type);
    const recipients = process.env.RESEND_TO_EMAIL.split(',').map(email => email.trim());
    
    const result = await resend.emails.send({
      from: 'Emma En Direct <noreply@emma-en-direct.com>',
      to: recipients,
      subject: subject,
      html: htmlContent
    });
    
    return {
      success: true,
      messageId: result.data?.id,
      recipients: recipients
    };
    
  } catch (error) {
    console.error('❌ Resend email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function getSubjectForType(type) {
  const date = new Date().toLocaleDateString('fr-FR');
  switch (type) {
    case 'morning': return `📊 Emma En Direct · Matin - ${date}`;
    case 'midday': return `⚡ Emma En Direct · Midi - ${date}`;
    case 'evening': return `🌙 Emma En Direct · Soir - ${date}`;
    default: return `Emma En Direct - ${date}`;
  }
}

