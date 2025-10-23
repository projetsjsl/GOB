/**
 * API Endpoint: Send Birthday Email via Resend
 *
 * Envoie des emails de bonne fête personnalisés avec un template HTML joli
 *
 * @route POST /api/send-birthday-email
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Méthode POST uniquement
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { recipientName, recipientEmail, customMessage, senderName } = req.body;

        // Validation des paramètres
        if (!recipientName || !recipientEmail) {
            return res.status(400).json({
                error: 'Missing required fields: recipientName and recipientEmail are required'
            });
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            return res.status(400).json({
                error: 'Invalid email address'
            });
        }

        // Configuration Resend
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        if (!RESEND_API_KEY) {
            return res.status(500).json({
                error: 'RESEND_API_KEY not configured in environment variables'
            });
        }

        // Créer le message personnalisé
        const defaultMessage = `Nous te souhaitons une merveilleuse journée remplie de joie, de bonheur et de moments inoubliables. Que cette nouvelle année t'apporte tout ce que tu désires !`;
        const message = customMessage || defaultMessage;
        const sender = senderName || 'L\'équipe GOB';

        // Template HTML pour l'email de bonne fête
        const htmlTemplate = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Joyeux anniversaire ${recipientName} !</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', 'Helvetica', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: white;
            margin: 0;
            font-size: 32px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .balloon {
            font-size: 60px;
            animation: float 3s ease-in-out infinite;
            display: inline-block;
            margin: 20px 10px;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .recipient-name {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            line-height: 1.8;
            color: #333;
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #f5576c;
        }
        .cake {
            font-size: 80px;
            margin: 30px 0;
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        .footer {
            padding: 30px;
            text-align: center;
            background: #f8f9fa;
            color: #666;
            font-size: 14px;
        }
        .signature {
            margin-top: 30px;
            font-style: italic;
            color: #667eea;
            font-size: 18px;
        }
        .confetti {
            position: relative;
            display: inline-block;
            margin: 0 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <span class="balloon">🎈</span>
                <span class="balloon">🎈</span>
                <span class="balloon">🎈</span>
            </div>
            <h1>🎉 Joyeux Anniversaire ! 🎉</h1>
        </div>

        <div class="content">
            <div class="recipient-name">Cher(e) ${recipientName},</div>

            <div class="cake">🎂</div>

            <div class="message">
                ${message}
            </div>

            <div style="margin: 30px 0; font-size: 40px;">
                <span class="confetti">🎊</span>
                <span class="confetti">✨</span>
                <span class="confetti">🎁</span>
                <span class="confetti">🌟</span>
                <span class="confetti">🎊</span>
            </div>

            <div class="signature">
                ${sender}
            </div>
        </div>

        <div class="footer">
            <p>Cet email a été envoyé via le Dashboard GOB</p>
            <p style="margin-top: 10px; color: #999; font-size: 12px;">
                Propulsé par JSL AI • GOB Financial Dashboard
            </p>
        </div>
    </div>
</body>
</html>
        `;

        // Appel API Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: recipientEmail,
                subject: `🎉 Joyeux anniversaire ${recipientName} ! 🎂`,
                html: htmlTemplate,
                tags: [
                    { name: 'category', value: 'birthday' },
                    { name: 'type', value: 'greeting' }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend API Error:', data);
            return res.status(response.status).json({
                error: 'Failed to send birthday email via Resend',
                details: data
            });
        }

        // Succès
        return res.status(200).json({
            success: true,
            message: `Birthday email sent successfully to ${recipientName}`,
            emailId: data.id,
            data: data
        });

    } catch (error) {
        console.error('Send Birthday Email Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
