/**
 * API Endpoint: Send Email via Resend
 *
 * Envoie les briefings Emma par email en utilisant la plateforme Resend
 *
 * @route POST /api/send-email
 */

export default async function handler(req, res) {
    // Méthode POST uniquement
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { subject, html, to, briefingType } = req.body;

        // Validation des paramètres
        if (!subject || !html) {
            return res.status(400).json({
                error: 'Missing required fields: subject and html are required'
            });
        }

        // Configuration Resend
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const TO_EMAIL = to || process.env.RESEND_TO_EMAIL || 'projetsjsl@gmail.com';

        if (!RESEND_API_KEY) {
            return res.status(500).json({
                error: 'RESEND_API_KEY not configured in environment variables'
            });
        }

        // Appel API Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: TO_EMAIL,
                subject: subject,
                html: html,
                tags: [
                    { name: 'category', value: 'briefing' },
                    { name: 'type', value: briefingType || 'manual' }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend API Error:', data);
            return res.status(response.status).json({
                error: 'Failed to send email via Resend',
                details: data
            });
        }

        // Succès
        return res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            emailId: data.id,
            data: data
        });

    } catch (error) {
        console.error('Send Email Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
