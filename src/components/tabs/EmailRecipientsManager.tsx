import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TabProps } from '../../types';

declare const Chart: any;
declare const Recharts: any;
declare const LightweightCharts: any;

export const EmailRecipientsManager: React.FC<TabProps> = (props) => {
    const { isDarkMode = true } = props;

    const [recipients, setRecipients] = useState([]);
    const [previewEmail, setPreviewEmail] = useState('projetsjsl@gmail.com');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState({});
    const [newEmail, setNewEmail] = useState({ email: '', label: '' });

    // Charger les destinataires depuis Supabase
    const loadRecipients = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/email-recipients');
            const result = await response.json();
            if (result.success) {
                setRecipients(result.recipients || []);
                setPreviewEmail(result.preview_email || 'projetsjsl@gmail.com');
            }
        } catch (error) {
            console.error('Erreur chargement destinataires:', error);
            alert('❌ Erreur lors du chargement: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Ajouter un nouveau destinataire
    const addRecipient = async () => {
        if (!newEmail.email || !newEmail.email.includes('@')) {
            alert('❌ Veuillez entrer une adresse email valide');
            return;
        }

        setSaving({ ...saving, add: true });
        try {
            const response = await fetch('/api/email-recipients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newEmail.email,
                    label: newEmail.label || newEmail.email,
                    morning: false,
                    midday: false,
                    evening: false,
                    custom: false,
                    is_preview: false
                })
            });
            const result = await response.json();
            if (result.success) {
                setNewEmail({ email: '', label: '' });
                await loadRecipients();
                alert('✅ Destinataire ajouté avec succès !');
            } else {
                alert('❌ Erreur: ' + result.error);
            }
        } catch (error) {
            console.error('Erreur ajout destinataire:', error);
            alert('❌ Erreur lors de l\'ajout: ' + error.message);
        } finally {
            setSaving({ ...saving, add: false });
        }
    };

    // Mettre à jour un destinataire (toggle case à cocher)
    const updateRecipient = async (id, field, value) => {
        setSaving({ ...saving, [id]: true });
        try {
            const response = await fetch('/api/email-recipients', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    [field]: value
                })
            });
            const result = await response.json();
            if (result.success) {
                // Mettre à jour localement
                setRecipients(recipients.map(r =>
                    r.id === id ? { ...r, [field]: value } : r
                ));
            } else {
                alert('❌ Erreur: ' + result.error);
                await loadRecipients(); // Recharger en cas d'erreur
            }
        } catch (error) {
            console.error('Erreur mise à jour destinataire:', error);
            alert('❌ Erreur lors de la mise à jour: ' + error.message);
            await loadRecipients(); // Recharger en cas d'erreur
        } finally {
            setSaving({ ...saving, [id]: false });
        }
    };

    // Mettre à jour l'email de preview
    const updatePreviewEmail = async (email) => {
        // Trouver le destinataire actuel avec is_preview=true et le désactiver
        const currentPreview = recipients.find(r => r.is_preview && r.active);
        if (currentPreview) {
            await updateRecipient(currentPreview.id, 'is_preview', false);
        }

        // Trouver le nouveau destinataire et l'activer comme preview
        const newPreview = recipients.find(r => r.email === email);
        if (newPreview) {
            await updateRecipient(newPreview.id, 'is_preview', true);
            setPreviewEmail(email);
        }
    };

    // Supprimer un destinataire
    const deleteRecipient = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce destinataire ?')) {
            return;
        }

        setSaving({ ...saving, [id]: true });
        try {
            const response = await fetch(`/api/email-recipients?id=${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                await loadRecipients();
                alert('✅ Destinataire supprimé avec succès !');
            } else {
                alert('❌ Erreur: ' + result.error);
            }
        } catch (error) {
            console.error('Erreur suppression destinataire:', error);
            alert('❌ Erreur lors de la suppression: ' + error.message);
        } finally {
            setSaving({ ...saving, [id]: false });
        }
    };

    // Charger au montage
    React.useEffect(() => {
        loadRecipients();
    }, []);

    // Compter les destinataires actifs par type
    const countActive = (type) => {
        return recipients.filter(r => r.active && r[type]).length;
    };

    return (
        <div className="space-y-4">
            {/* Email de Preview */}
            <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
                <label className={`text-sm font-semibold mb-2 block transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                    📬 Email pour Previews (Tests Manuels)
                </label>
                <select
                    value={previewEmail}
                    onChange={(e) => updatePreviewEmail(e.target.value)}
                    className={`w-full px-3 py-2 rounded border transition-colors duration-300 ${
                        isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                    }`}
                >
                    {recipients.filter(r => r.active).map(r => (
                        <option key={r.id} value={r.email}>
                            {r.email} {r.label && r.label !== r.email ? `(${r.label})` : ''}
                        </option>
                    ))}
                </select>
                <p className={`text-xs mt-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                    Cette adresse recevra les emails de prévisualisation lors des tests manuels
                </p>
            </div>

            {/* Tableau des destinataires avec colonnes de cases à cocher */}
            <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
                <h4 className={`text-sm font-semibold mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                    Liste des Destinataires
                </h4>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement...</p>
                    </div>
                ) : (
                    <>
                        {/* Tableau */}
                        <div className="overflow-x-auto">
                            <table className={`w-full border-collapse ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                <thead>
                                    <tr className={`border-b-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                                        <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Email
                                        </th>
                                        <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Label
                                        </th>
                                        <th className={`text-center py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            🌅 Matin
                                        </th>
                                        <th className={`text-center py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            ☀️ Midi
                                        </th>
                                        <th className={`text-center py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            🌙 Soir
                                        </th>
                                        <th className={`text-center py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            📝 Perso
                                        </th>
                                        <th className={`text-center py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            📬 Preview
                                        </th>
                                        <th className={`text-center py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recipients.length > 0 ? (
                                        recipients.map((recipient) => (
                                            <tr
                                                key={recipient.id}
                                                className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} ${!recipient.active ? 'opacity-50' : ''}`}
                                            >
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                                    {recipient.email}
                                                </td>
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {recipient.label || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={recipient.morning || false}
                                                        onChange={(e) => updateRecipient(recipient.id, 'morning', e.target.checked)}
                                                        disabled={saving[recipient.id] || !recipient.active}
                                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={recipient.midday || false}
                                                        onChange={(e) => updateRecipient(recipient.id, 'midday', e.target.checked)}
                                                        disabled={saving[recipient.id] || !recipient.active}
                                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={recipient.evening || false}
                                                        onChange={(e) => updateRecipient(recipient.id, 'evening', e.target.checked)}
                                                        disabled={saving[recipient.id] || !recipient.active}
                                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={recipient.custom || false}
                                                        onChange={(e) => updateRecipient(recipient.id, 'custom', e.target.checked)}
                                                        disabled={saving[recipient.id] || !recipient.active}
                                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={recipient.is_preview || false}
                                                        onChange={(e) => {
                                                            updateRecipient(recipient.id, 'is_preview', e.target.checked);
                                                            if (e.target.checked) {
                                                                setPreviewEmail(recipient.email);
                                                            }
                                                        }}
                                                        disabled={saving[recipient.id] || !recipient.active}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        onClick={() => updateRecipient(recipient.id, 'active', !recipient.active)}
                                                        className={`px-2 py-1 text-xs rounded transition-colors ${
                                                            recipient.active
                                                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                                                : 'bg-green-500 hover:bg-green-600 text-white'
                                                        }`}
                                                        disabled={saving[recipient.id]}
                                                    >
                                                        {recipient.active ? 'Désactiver' : 'Activer'}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteRecipient(recipient.id)}
                                                        className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                                        disabled={saving[recipient.id]}
                                                    >
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className={`py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Aucun destinataire configuré
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Statistiques */}
                        <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>🌅 Matin:</span>
                                    <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{countActive('morning')}</span>
                                </div>
                                <div>
                                    <span className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>☀️ Midi:</span>
                                    <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{countActive('midday')}</span>
                                </div>
                                <div>
                                    <span className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>🌙 Soir:</span>
                                    <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{countActive('evening')}</span>
                                </div>
                                <div>
                                    <span className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>📝 Perso:</span>
                                    <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{countActive('custom')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Formulaire d'ajout */}
                        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                            <h5 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Ajouter un nouveau destinataire
                            </h5>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={newEmail.email}
                                    onChange={(e) => setNewEmail({ ...newEmail, email: e.target.value })}
                                    placeholder="email@example.com"
                                    className={`flex-1 px-3 py-2 rounded border transition-colors duration-300 ${
                                        isDarkMode
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                                <input
                                    type="text"
                                    value={newEmail.label}
                                    onChange={(e) => setNewEmail({ ...newEmail, label: e.target.value })}
                                    placeholder="Label (optionnel)"
                                    className={`flex-1 px-3 py-2 rounded border transition-colors duration-300 ${
                                        isDarkMode
                                            ? 'bg-gray-800 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                                <button
                                    onClick={addRecipient}
                                    disabled={saving.add}
                                    className={`px-4 py-2 rounded transition-colors ${
                                        saving.add
                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                                    }`}
                                >
                                    {saving.add ? '⏳' : '➕'} Ajouter
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={loadRecipients}
                                className="px-6 py-2 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-300"
                            >
                                🔄 Recharger
                            </button>
                        </div>

                        {/* Note informative */}
                        <div className={`mt-4 p-3 rounded-lg text-sm transition-colors duration-300 ${
                            isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-800'
                        }`}>
                            💡 <strong>Note:</strong> Les modifications sont sauvegardées dans <code className="px-1 py-0.5 rounded bg-gray-800 text-yellow-300">Supabase</code> et utilisées automatiquement par n8n lors de l'envoi des briefings. Cochez les cases pour indiquer quels emails doivent recevoir chaque type de briefing.
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


export default EmailRecipientsManager;
