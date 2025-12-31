// @ts-nocheck
import React, { useState, useEffect } from 'react';

            const EmmaSmsPanel = () => {
                const [loading, setLoading] = useState(true);
                const [envValues, setEnvValues] = useState({});
                const [serverState, setServerState] = useState({ running: false, info: null, logs: [] });
                const [webhookStatus, setWebhookStatus] = useState(null);
                const [saving, setSaving] = useState(false);
                const [actionMessage, setActionMessage] = useState(null);
                const [scenarioOutput, setScenarioOutput] = useState('');
                const [scenarioLoading, setScenarioLoading] = useState(false);
                const [serverLoading, setServerLoading] = useState(false);
                const publicUrl = (envValues.PUBLIC_URL || '').trim();

                const fetchStatus = useCallback(async () => {
                    try {
                        setLoading(true);
                        const res = await fetch('/api/admin/sms-control');
                        if (!res.ok) throw new Error('Impossible de charger la configuration SMS');
                        const data = await res.json();
                        const env = data.env || {};
                        if (!env.MODE) env.MODE = 'test';
                        if (!env.TEST_MODE) env.TEST_MODE = 'true';
                        if (!env.N8N_WEBHOOK_BASE_URL) env.N8N_WEBHOOK_BASE_URL = 'https://projetsjsl.app.n8n.cloud';
                        if (!env.EMMA_WEBHOOK_URL) env.EMMA_WEBHOOK_URL = 'https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test';
                        if (!env.PUBLIC_URL) env.PUBLIC_URL = 'https://gob-kmay.onrender.com';
                        setEnvValues(env);
                        setServerState(data.server || { running: false, info: null, logs: [] });
                        setWebhookStatus(data.webhookStatus);
                    } catch (error) {
                        console.error('[Emma SMS] fetchStatus error:', error);
                        setActionMessage({ type: 'error', text: error.message });
                    } finally {
                        setLoading(false);
                    }
                }, []);

                useEffect(() => {
                    fetchStatus();
                }, [fetchStatus]);

                const handleEnvChange = (key, value) => {
                    setEnvValues((prev) => ({ ...prev, [key]: value }));
                };

                const applyPreset = (modeKey) => {
                    const preset = modePresets[modeKey];
                    if (!preset) return;
                    setEnvValues((prev) => ({
                        ...prev,
                        ...preset.defaults,
                        MODE: modeKey
                    }));
                };

                const saveEnv = async () => {
                    try {
                        setSaving(true);
                        const res = await fetch('/api/admin/sms-control', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'saveEnv', payload: envValues })
                        });
                        if (!res.ok) throw new Error('Erreur lors de la sauvegarde');
                        setActionMessage({ type: 'success', text: 'Configuration enregistrée ✅' });
                    } catch (error) {
                        setActionMessage({ type: 'error', text: error.message });
                    } finally {
                        setSaving(false);
                        fetchStatus();
                    }
                };

                const handleServerAction = async (action) => {
                    try {
                        setServerLoading(true);
                        const res = await fetch('/api/admin/sms-control', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action, payload: action === 'startServer' ? envValues : undefined })
                        });
                        if (!res.ok) {
                            const { error } = await res.json();
                            throw new Error(error || 'Erreur action serveur');
                        }
                        setActionMessage({ type: 'success', text: action === 'startServer' ? 'Serveur démarré' : 'Serveur arrêté' });
                    } catch (error) {
                        setActionMessage({ type: 'error', text: error.message });
                    } finally {
                        setServerLoading(false);
                        fetchStatus();
                    }
                };

                const launchScenarios = async () => {
                    try {
                        setScenarioLoading(true);
                        const res = await fetch('/api/admin/sms-control', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'runScenarios' })
                        });
                        const data = await res.json();
                        if (!res.ok || !data.success) throw new Error(data.error || 'Erreur scénarios');
                        setScenarioOutput(data.output || 'Scénarios terminés.');
                    } catch (error) {
                        setScenarioOutput(`❌ ${error.message}`);
                    } finally {
                        setScenarioLoading(false);
                    }
                };

                const statusBadge = (label, status = 'info') => (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        status === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'error'
                                ? 'bg-red-100 text-red-800'
                                : status === 'warning'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                    }`}>{label}</span>
                );

                return (
                    <div className={`rounded-lg p-4 border shadow-lg transition-colors duration-300 ${
                        isDarkMode ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-semibold flex items-center gap-2"><Icon emoji="📱" size={20}/> Emma SMS</h3>
                                <p className="text-sm opacity-75">Gérez les webhooks n8n, le serveur de test et les variables SMS.</p>
                            </div>
                            <button
                                onClick={fetchStatus}
                                className={`px-3 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                Rafraîchir
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-6 text-center text-sm opacity-75">Chargement de la configuration SMS...</div>
                        ) : (
                            <div className="space-y-6">
                                {actionMessage && (
                                    <div className={`p-3 rounded-md text-sm border ${
                                        actionMessage.type === 'error'
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                        {actionMessage.text}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className={`text-sm font-semibold flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Mode (presets)
                                            {statusBadge(serverState.running ? 'Serveur actif' : 'Serveur arrêté', serverState.running ? 'success' : 'warning')}
                                        </label>
                                        <div className="space-y-2">
                                            {Object.entries(modePresets).map(([key, preset]) => {
                                                const active = (envValues.MODE || 'test') === key;
                                                return (
                                                    <label
                                                        key={key}
                                                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                                                            active
                                                                ? isDarkMode
                                                                    ? 'border-emerald-400 bg-emerald-900/30 text-emerald-100'
                                                                    : 'border-blue-500 bg-blue-50 text-blue-900'
                                                                : isDarkMode
                                                                    ? 'border-gray-700 bg-gray-800 text-gray-100 hover:border-gray-500'
                                                                    : 'border-gray-200 bg-white text-gray-800'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="sms-mode"
                                                            checked={active}
                                                            onChange={() => applyPreset(key)}
                                                            className="mt-1"
                                                        />
                                                        <div>
                                                            <div className="font-semibold">{preset.label}</div>
                                                            <div className="text-xs opacity-70">{preset.description}</div>
                                                            <div className="text-xs opacity-80">
                                                                {key === 'test' && '💲 Gratuit (aucun SMS Twilio).'}
                                                                {key === 'prod_local' && '💲 SMS facturés par Twilio (ton tunnel local).'}
                                                                {key === 'prod_cloud' && '💲 SMS Twilio + hébergeur (Render/Railway).'}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                            <p className="text-xs opacity-70">Cliquer sur un preset remplit automatiquement les champs critiques.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold">Mode Twilio (TEST_MODE)</label>
                                        <div className="flex items-center gap-4">
                                            {['true', 'false'].map((value) => (
                                                <label key={value} className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="radio"
                                                        name="sms-test-mode"
                                                        checked={(envValues.TEST_MODE || 'true') === value}
                                                        onChange={() => handleEnvChange('TEST_MODE', value)}
                                                    />
                                                    {value === 'true' ? 'true (aucun SMS réel)' : 'false (Twilio réel)'}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {smsEnvFieldMeta.map((field) => (
                                        fieldVisibility[(envValues.MODE || 'test')]?.includes(field.key) && (
                                        <div key={field.key} className="space-y-1">
                                            <label className="text-sm font-semibold">{field.label}</label>
                                            <div>
                                                <input
                                                    type={field.key.toLowerCase().includes('token') ? 'password' : 'text'}
                                                    list={field.key === 'EMMA_WEBHOOK_URL' ? 'emma-webhook-options' : undefined}
                                                    value={envValues[field.key] || ''}
                                                    onChange={(e) => handleEnvChange(field.key, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                                                        isDarkMode
                                                            ? 'bg-gray-900/70 border-gray-700 text-gray-100 placeholder-gray-500'
                                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                    }`}
                                                />
                                                {field.key === 'EMMA_WEBHOOK_URL' && (
                                                    <datalist id="emma-webhook-options">
                                                        <option value="https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test" />
                                                        <option value="https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook" />
                                                        <option value="https://gobapps.com/api/adapters/sms" />
                                                    </datalist>
                                                )}
                                                {field.key === 'PUBLIC_URL' && (
                                                    <datalist id="public-url-options">
                                                        <option value="http://localhost:3000" />
                                                        <option value="https://<ngrok-id>.ngrok.io" />
                                                        <option value="https://gob-kmay.onrender.com" />
                                                    </datalist>
                                                )}
                                            </div>
                                            {field.helper && <p className="text-xs opacity-70">{field.helper}</p>}
                                        </div>
                                    )))}
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={saveEnv}
                                        disabled={saving}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                        💾 Sauvegarder la configuration
                                    </button>
                                    <button
                                        onClick={() => handleServerAction('startServer')}
                                        disabled={serverLoading}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
                                        🚀 Démarrer serveur
                                    </button>
                                    <button
                                        onClick={() => handleServerAction('stopServer')}
                                        disabled={serverLoading}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                                        🛑 Arrêter serveur
                                    </button>
                                    <button
                                        onClick={launchScenarios}
                                        disabled={scenarioLoading}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}>
                                        🧪 Lancer scénarios
                                    </button>
                                </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className={`rounded-lg border p-3 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><Icon emoji="📡" size={16}/> Webhook n8n</h4>
                                <p className="text-xs break-all mb-2">{envValues.EMMA_WEBHOOK_URL || 'Non défini'}</p>
                                {webhookStatus && statusBadge(webhookStatus.status === 'ok' ? 'n8n OK' : webhookStatus.status.toUpperCase(), webhookStatus.status === 'ok' ? 'success' : 'error')}
                                <p className="text-xs opacity-70 mt-1">{webhookStatus?.message}</p>
                                    </div>
                                    <div className={`rounded-lg border p-3 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Icon emoji="🔌" size={16}/> Serveur local</h4>
                                        <p className="text-sm">Port: {serverState.info?.port || envValues.PORT || '3000'}</p>
                                        <p className="text-xs opacity-70">Mode: {serverState.info?.mode || envValues.MODE || 'test'}</p>
                                        <p className="text-xs opacity-70">PID: {serverState.info?.pid || '—'}</p>
                                    </div>
                                    <div className={`rounded-lg border p-3 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Icon emoji="📝" size={16}/> Checklist Twilio</h4>
                                        <ul className="text-xs space-y-1">
                                            <li>{envValues.TWILIO_ACCOUNT_SID ? '✔️ SID configuré' : '⚠️ SID manquant'}</li>
                                            <li>{envValues.TWILIO_AUTH_TOKEN ? '✔️ Token configuré' : '⚠️ Token manquant'}</li>
                                            <li>{envValues.TWILIO_PHONE_NUMBER ? `📞 ${envValues.TWILIO_PHONE_NUMBER}` : '⚠️ Numéro Twilio manquant'}</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className={`rounded-lg border p-3 ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Icon emoji="📘" size={16}/> Instructions rapides</h4>
                                    <ol className="text-sm list-decimal list-inside space-y-1 opacity-80">
                                        <li>Mode TEST : `EMMA_WEBHOOK_URL` → `.../gob-sms-webhook-test`, `TEST_MODE=true`, aucun coût Twilio.</li>
                                        <li>Mode PROD LOCAL : définir `PUBLIC_URL` (ngrok), `MODE=prod_local`, `TEST_MODE=false`, configurer le webhook Twilio vers `PUBLIC_URL/webhook/sms`.</li>
                                        <li>Mode PROD CLOUD : `MODE=prod_cloud`, `PUBLIC_URL=https://gobapps.com`, garantir que Twilio pointe vers `https://gobapps.com/webhook/sms`.</li>
                                    </ol>
                                </div>

                                <div className={`rounded-lg border p-4 ${isDarkMode ? 'border-gray-800 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="text-lg font-semibold flex items-center gap-2">
                                                <Icon emoji="🖥️" size={16}/> Dashboard Remote
                                            </h4>
                                            <p className="text-xs opacity-70 break-all">{publicUrl || '(PUBLIC_URL non défini)'}</p>
                                        </div>
                                        <button
                                            onClick={fetchStatus}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                            🔄 Recharger
                                        </button>
                                    </div>
                                    {publicUrl && publicUrl.startsWith('http') ? (
                                        <iframe
                                            src={publicUrl}
                                            title="Emma SMS Dashboard"
                                            className="w-full rounded-lg border"
                                            style={{ minHeight: '600px', border: '1px solid rgba(0,0,0,0.1)' }}
                                        />
                                    ) : (
                                        <p className="text-sm opacity-75">
                                            Définissez `PUBLIC_URL` pour afficher le dashboard Render/Railway ici.
                                        </p>
                                    )}
                                </div>

                                {scenarioOutput && (
                                    <div className={`rounded-lg border p-3 text-xs whitespace-pre-wrap ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                                        {scenarioOutput}
                                    </div>
                                )}
                    </div>
                )}
            </div>
        );
    };

            // ============================================================================
            // COMPOSANT ADMIN-JSLAI
            // ============================================================================

export default EmmaSmsPanel;
