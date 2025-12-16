// Email Template Generator pour Plan d'Intégration RH
// Compatible avec tous les clients email (Outlook, Gmail, Apple Mail, etc.)

window.generateEmailHTML = function(employee, phases, tasks, resources) {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    
    const getResourceNames = (ids) => {
        return resources.filter(r => ids.includes(r.id)).map(r => r.name).join(', ') || 'Non assigné';
    };

    const getStatusLabel = (status) => {
        return status === 'completed' ? '✅ Complété' : status === 'inProgress' ? '🔄 En cours' : '⏳ En attente';
    };

    const getStatusColor = (status) => {
        return status === 'completed' ? '#10B981' : status === 'inProgress' ? '#3B82F6' : '#6B7280';
    };

    let tasksHTML = '';
    phases.forEach(phase => {
        const phaseTasks = tasks.filter(t => t.phaseId === phase.id);
        const phaseCompleted = phaseTasks.filter(t => t.status === 'completed').length;
        
        tasksHTML += `
        <tr>
            <td colspan="4" style="background-color: ${phase.color}15; padding: 12px; border-left: 4px solid ${phase.color};">
                <strong style="color: ${phase.color}; font-size: 16px;">${phase.name}</strong>
                <span style="float: right; color: ${phase.color};">${phaseCompleted}/${phaseTasks.length} complétées</span>
                <br><span style="color: #666; font-size: 12px;">${phase.description} | ${phase.startDate} → ${phase.endDate}</span>
            </td>
        </tr>`;
        
        phaseTasks.forEach(task => {
            tasksHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; width: 40%;">
                    <strong>${task.title}</strong><br>
                    <span style="color: #666; font-size: 12px;">${task.description}</span>
                </td>
                <td style="padding: 10px; text-align: center;">
                    <span style="color: ${getStatusColor(task.status)}; font-weight: bold;">${getStatusLabel(task.status)}</span>
                </td>
                <td style="padding: 10px; text-align: center; font-size: 12px;">${task.dueDate}</td>
                <td style="padding: 10px; font-size: 12px;">${getResourceNames(task.assignedTo)}</td>
            </tr>`;
        });
    });

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plan d'Intégration - ${employee.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="700" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%); padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Plan d'Intégration RH</h1>
                            <p style="color: #93c5fd; margin: 10px 0 0 0;">Bienvenue ${employee.name} !</p>
                        </td>
                    </tr>
                    
                    <!-- Employee Info -->
                    <tr>
                        <td style="padding: 20px;">
                            <table width="100%" cellpadding="10" style="background-color: #f8fafc; border-radius: 8px;">
                                <tr>
                                    <td width="25%"><strong style="color: #64748b;">Employé:</strong><br>${employee.name}</td>
                                    <td width="25%"><strong style="color: #64748b;">Poste:</strong><br>${employee.role}</td>
                                    <td width="25%"><strong style="color: #64748b;">Début:</strong><br>${employee.startDate}</td>
                                    <td width="25%"><strong style="color: #64748b;">Progression:</strong><br><span style="color: #3B82F6; font-size: 20px; font-weight: bold;">${progress}%</span></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Progress Bar -->
                    <tr>
                        <td style="padding: 0 20px 20px 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background-color: #e5e7eb; border-radius: 10px; height: 20px;">
                                        <table width="${progress}%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="background: linear-gradient(90deg, #3B82F6, #10B981); border-radius: 10px; height: 20px;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <p style="text-align: center; color: #666; margin: 5px 0 0 0; font-size: 12px;">${completedTasks} sur ${tasks.length} tâches complétées</p>
                        </td>
                    </tr>
                    
                    <!-- Tasks Table -->
                    <tr>
                        <td style="padding: 0 20px 20px 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                                <tr style="background-color: #1e3a8a;">
                                    <th style="padding: 12px; color: white; text-align: left;">Tâche</th>
                                    <th style="padding: 12px; color: white; text-align: center;">Statut</th>
                                    <th style="padding: 12px; color: white; text-align: center;">Date</th>
                                    <th style="padding: 12px; color: white; text-align: left;">Responsable</th>
                                </tr>
                                ${tasksHTML}
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Responsables Section -->
                    <tr>
                        <td style="padding: 0 20px 20px 20px;">
                            <h3 style="color: #1e3a8a; margin: 0 0 10px 0;">📞 Vos contacts clés</h3>
                            <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px;">
                                ${resources.map(r => `<tr><td><span style="display: inline-block; width: 12px; height: 12px; background-color: ${r.color}; border-radius: 50%; margin-right: 8px;"></span><strong>${r.name}</strong> - ${r.role}</td></tr>`).join('')}
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1f2937; padding: 20px; text-align: center;">
                            <p style="color: #fbbf24; margin: 0 0 10px 0; font-size: 12px;">⚠️ Ce document est confidentiel</p>
                            <p style="color: #9ca3af; margin: 0; font-size: 12px;">Plateforme d'Intégration RH | Généré le ${new Date().toLocaleDateString('fr-CA')}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

window.sendEmailPlan = async function(employee, phases, tasks, resources) {
    const html = window.generateEmailHTML(employee, phases, tasks, resources);
    const subject = `Plan d'Intégration - ${employee.name}`;
    
    // Use a promise-based approach for email input
    // This will be handled by the React component in index.html
    // For now, use a simple fallback if called directly
    return new Promise((resolve) => {
        // Try to use the React modal if available
        if (window.showEmailPromptModal) {
            window.showEmailPromptModal((email) => {
                if (email) {
                    sendEmailToAddress(email, subject, html);
                }
                resolve();
            });
        } else {
            // Fallback: use a simple input (not ideal but works)
            const to = window.prompt ? window.prompt("Entrez l'adresse email du destinataire:", "projetsjsl@gmail.com") : null;
            if (!to) {
                resolve();
                return;
            }
            sendEmailToAddress(to, subject, html);
            resolve();
        }
    });
    
    function sendEmailToAddress(to, subject, html) {

    // Feedback visuel (simple alert pour l'instant, idéalement un toast dans l'UI)
    const originalText = document.activeElement ? document.activeElement.innerText : '';
    if (document.activeElement) document.activeElement.innerText = 'Envoi... ⏳';

    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: to,
                subject: subject,
                html: html,
                briefingType: 'onboarding_plan'
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('✅ Email envoyé avec succès !');
        } else {
            console.error('Erreur envoi email:', data);
            alert(`❌ Erreur lors de l'envoi : ${data.message || 'Erreur inconnue'}`);
        }
    } catch (error) {
        console.error('Erreur réseau:', error);
        alert('❌ Erreur réseau lors de l\'envoi de l\'email.');
    } finally {
        if (document.activeElement) document.activeElement.innerText = originalText;
    }
};

window.copyEmailHTML = function(employee, phases, tasks, resources) {
    const html = window.generateEmailHTML(employee, phases, tasks, resources);
    navigator.clipboard.writeText(html).then(() => {
        alert('HTML copié ! Collez-le dans votre client email (mode HTML).');
    });
};
