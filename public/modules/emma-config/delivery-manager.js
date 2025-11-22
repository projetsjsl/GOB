// ═══════════════════════════════════════════════════════════════
// DELIVERY MANAGER - Gestion des destinataires et planification
// ═══════════════════════════════════════════════════════════════

import { loadDeliveryConfig as apiLoadDelivery, saveDeliveryConfig as apiSaveDelivery, sendBriefingNow as apiSendBriefing } from './api-client.js';
import { showStatus } from './ui-helpers.js';

let currentRecipients = [];

/**
 * Charge la configuration de delivery
 */
export async function loadDeliveryConfig(section, key) {
    try {
        const promptId = key;
        document.getElementById('deliveryPromptId').textContent = promptId;
        document.getElementById('deliveryPromptIdInfo').textContent = promptId;

        const config = await apiLoadDelivery(section, key);

        if (config) {
            // Charger les destinataires
            currentRecipients = config.email_recipients || [];
            renderRecipientsList();

            // Charger les settings
            document.getElementById('deliveryEnabled').checked = config.delivery_enabled || false;
            document.getElementById('deliveryPromptNumber').textContent = config.prompt_number || '-';

            // Charger la planification
            const schedule = config.delivery_schedule || {};
            document.getElementById('deliveryFrequency').value = schedule.frequency || 'manual';
            document.getElementById('deliveryTime').value = schedule.time || '09:00';
            document.getElementById('deliveryTimezone').value = schedule.timezone || 'America/Montreal';

            // Jours de la semaine
            const days = schedule.days || [];
            document.querySelectorAll('input[name="deliveryDay"]').forEach(checkbox => {
                checkbox.checked = days.includes(checkbox.value);
            });

            // Afficher section jours si nécessaire
            const freq = schedule.frequency || 'manual';
            const showDays = freq === 'daily' || freq === 'weekly';
            document.getElementById('deliveryDaysSection').classList.toggle('hidden', !showDays);
        } else {
            // Pas de config existante, utiliser valeurs par défaut
            resetDeliveryConfig(promptId);
        }
    } catch (error) {
        console.error('Erreur chargement delivery config:', error);
        showStatus('⚠️ Impossible de charger la config de delivery', 'warning');
    }
}

/**
 * Reset delivery config avec valeurs par défaut
 */
function resetDeliveryConfig(promptId) {
    currentRecipients = [];
    renderRecipientsList();
    document.getElementById('deliveryEnabled').checked = false;
    document.getElementById('deliveryPromptNumber').textContent = '-';
    document.getElementById('deliveryFrequency').value = 'manual';
    document.getElementById('deliveryTime').value = '09:00';
    document.getElementById('deliveryTimezone').value = 'America/Montreal';
    document.querySelectorAll('input[name="deliveryDay"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('deliveryDaysSection').classList.add('hidden');
}

/**
 * Afficher le formulaire d'ajout de destinataire
 */
export function showAddRecipientForm() {
    document.getElementById('addRecipientForm').classList.remove('hidden');
    document.getElementById('newRecipientEmail').focus();
}

/**
 * Masquer le formulaire d'ajout de destinataire
 */
export function hideAddRecipientForm() {
    document.getElementById('addRecipientForm').classList.add('hidden');
    document.getElementById('newRecipientEmail').value = '';
    document.getElementById('newRecipientName').value = '';
}

/**
 * Ajouter un destinataire
 */
export function addRecipient() {
    const email = document.getElementById('newRecipientEmail').value.trim();
    const name = document.getElementById('newRecipientName').value.trim();

    if (!email) {
        showStatus('⚠️ Email requis', 'warning');
        return;
    }

    // Vérifier format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showStatus('⚠️ Format email invalide', 'warning');
        return;
    }

    // Vérifier si email déjà présent
    if (currentRecipients.some(r => r.email === email)) {
        showStatus('⚠️ Email déjà dans la liste', 'warning');
        return;
    }

    // Ajouter
    currentRecipients.push({
        email,
        name: name || email.split('@')[0],
        active: true,
        priority: currentRecipients.length + 1
    });

    renderRecipientsList();
    hideAddRecipientForm();
    showStatus('✅ Destinataire ajouté', 'success');
}

/**
 * Retirer un destinataire
 */
export function removeRecipient(email) {
    if (!confirm(`Retirer ${email} de la liste ?`)) return;

    currentRecipients = currentRecipients.filter(r => r.email !== email);
    renderRecipientsList();
    showStatus('✅ Destinataire retiré', 'success');
}

/**
 * Toggle actif/inactif
 */
export function toggleRecipientActive(email) {
    const recipient = currentRecipients.find(r => r.email === email);
    if (recipient) {
        recipient.active = !recipient.active;
        renderRecipientsList();
    }
}

/**
 * Rendre la liste des destinataires
 */
function renderRecipientsList() {
    const container = document.getElementById('recipientsList');
    document.getElementById('recipientsCount').textContent = currentRecipients.length;

    if (currentRecipients.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm italic">Aucun destinataire configuré</p>';
        return;
    }

    container.innerHTML = currentRecipients.map(recipient => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded border ${recipient.active ? 'border-green-300' : 'border-gray-300'}">
            <div class="flex items-center gap-3 flex-1">
                <input
                    type="checkbox"
                    ${recipient.active ? 'checked' : ''}
                    onchange="window.toggleRecipientActive('${recipient.email}')"
                    class="w-4 h-4 text-green-600 rounded"
                >
                <div>
                    <p class="text-sm font-semibold ${recipient.active ? 'text-gray-900' : 'text-gray-400'}">${recipient.name}</p>
                    <p class="text-xs text-gray-500">${recipient.email}</p>
                </div>
            </div>
            <button
                onclick="window.removeRecipient('${recipient.email}')"
                class="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
            >
                🗑️ Retirer
            </button>
        </div>
    `).join('');
}

/**
 * Sauvegarde la config de delivery
 */
export async function saveDeliveryConfig(currentConfig) {
    if (!currentConfig) {
        showStatus('⚠️ Aucun prompt sélectionné', 'warning');
        return;
    }

    try {
        // Collecter les jours sélectionnés
        const selectedDays = Array.from(document.querySelectorAll('input[name="deliveryDay"]:checked'))
            .map(checkbox => checkbox.value);

        const deliveryConfig = {
            key: currentConfig.key,
            email_recipients: currentRecipients,
            delivery_enabled: document.getElementById('deliveryEnabled').checked,
            delivery_schedule: {
                frequency: document.getElementById('deliveryFrequency').value,
                time: document.getElementById('deliveryTime').value,
                timezone: document.getElementById('deliveryTimezone').value,
                days: selectedDays
            }
        };

        await apiSaveDelivery(deliveryConfig);
        showStatus('✅ Configuration d\'envoi sauvegardée', 'success');
    } catch (error) {
        console.error('Erreur sauvegarde delivery config:', error);
        showStatus('❌ ' + error.message, 'error');
    }
}

/**
 * Envoyer le briefing immédiatement
 */
export async function sendBriefingNow(currentConfig) {
    if (!currentConfig) {
        showStatus('⚠️ Aucun prompt sélectionné', 'warning');
        return;
    }

    const activeRecipients = currentRecipients.filter(r => r.active);
    if (activeRecipients.length === 0) {
        showStatus('⚠️ Aucun destinataire actif configuré', 'warning');
        return;
    }

    // Confirmation avant envoi LIVE
    const recipientsList = activeRecipients.map(r => `  • ${r.name} (${r.email})`).join('\n');
    const confirmed = confirm(
        `📧 ENVOI IMMÉDIAT EN PRODUCTION\n\n` +
        `Le briefing sera généré et envoyé MAINTENANT à ${activeRecipients.length} destinataire(s):\n\n` +
        `${recipientsList}\n\n` +
        `Voulez-vous continuer?`
    );

    if (!confirmed) {
        showStatus('❌ Envoi annulé', 'info');
        return;
    }

    try {
        showStatus('📧 Génération et envoi en cours...', 'info');

        // Récupérer le contenu du prompt actuel
        const promptContent = document.getElementById('editValue').value;

        const data = await apiSendBriefing(currentConfig.key, currentRecipients, promptContent);

        if (data.success) {
            showStatus(
                `✅ ${data.message}\n` +
                `📊 Envoyés: ${data.sent_count}/${data.total_recipients}\n` +
                `📧 Sujet: ${data.briefing.subject}`,
                'success'
            );
            console.log('Envoi réussi:', data);

            // Afficher les détails des erreurs s'il y en a
            if (data.failed_count > 0 && data.errors) {
                console.warn('Échecs d\'envoi:', data.errors);
                const errorList = data.errors.map(e => `  • ${e.email}: ${e.error}`).join('\n');
                alert(`⚠️ Certains envois ont échoué:\n\n${errorList}`);
            }
        } else {
            showStatus('❌ Échec: ' + (data.error || data.message), 'error');
            console.error('Erreur envoi:', data);
        }
    } catch (error) {
        console.error('Erreur send-briefing:', error);
        showStatus('❌ Erreur: ' + error.message, 'error');
    }
}

/**
 * Retourne les destinataires actuels (pour export)
 */
export function getCurrentRecipients() {
    return currentRecipients;
}
