import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TabProps } from '../../types';

declare const Chart: any;
declare const Recharts: any;
declare const LightweightCharts: any;

export const EmailPreviewManager: React.FC<TabProps> = (props) => {
    const { isDarkMode = true } = props;

                const [previewType, setPreviewType] = useState('morning');
                const [loading, setLoading] = useState(false);
                const [previewData, setPreviewData] = useState(null);
                const [showPreview, setShowPreview] = useState(false);
                const [customPrompt, setCustomPrompt] = useState('');

                // Generer un preview de briefing
                const generatePreview = async () => {
                    setLoading(true);
                    setShowPreview(false);
                    try {
                        let url = `/api/briefing?type=${previewType}`;
                        let method = 'GET';
                        let body = null;

                        if (previewType === 'custom' && customPrompt) {
                            // Pour custom, utiliser POST avec le prompt personnalise
                            method = 'POST';
                            body = JSON.stringify({
                                type: 'custom',
                                custom_prompt: customPrompt
                            });
                        }

                        const response = await fetch(url, {
                            method: method,
                            headers: { 'Content-Type': 'application/json' },
                            body: body
                        });

                        const result = await response.json();
                        if (result.success) {
                            setPreviewData({
                                type: result.type || previewType,
                                subject: result.subject,
                                content: result.content,
                                html_content: result.html_content,
                                metadata: result.metadata || {
                                    trigger_type: 'Test Web',
                                    emma_model: 'perplexity',
                                    emma_tools: [],
                                    emma_execution_time: 0,
                                    generated_at: new Date().toISOString()
                                }
                            });
                            setShowPreview(true);
                        } else {
                            alert(' Erreur: ' + (result.error || 'Impossible de generer le briefing'));
                        }
                    } catch (error) {
                        console.error('Erreur generation preview:', error);
                        alert(' Erreur lors de la generation: ' + error.message);
                    } finally {
                        setLoading(false);
                    }
                };

                // Envoyer un email de test
                const sendTestEmail = async () => {
                    if (!previewData) {
                        alert(' Aucun preview genere. Generez d\'abord un preview.');
                        return;
                    }

                    try {
                        // Recuperer l'email de preview
                        const recipientsResponse = await fetch('/api/email-recipients');
                        const recipientsResult = await recipientsResponse.json();
                        const previewEmail = recipientsResult.preview_email || 'projetsjsl@gmail.com';

                        // Envoyer via Resend
                        const response = await fetch('/api/adapters/email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: previewEmail,
                                subject: previewData.subject,
                                html: previewData.html_content,
                                text: previewData.content
                            })
                        });

                        const result = await response.json();
                        if (result.success) {
                            alert(` Email de test envoye a ${previewEmail} !`);
                        } else {
                            alert(' Erreur: ' + (result.error || 'Impossible d\'envoyer l\'email'));
                        }
                    } catch (error) {
                        console.error('Erreur envoi test:', error);
                        alert(' Erreur lors de l\'envoi: ' + error.message);
                    }
                };

                const briefingTypes = [
                    { id: 'morning', label: ' Matin', icon: '' },
                    { id: 'midday', label: ' Midi', icon: '' },
                    { id: 'evening', label: ' Soir', icon: '' },
                    { id: 'custom', label: ' Personnalise', icon: '' }
                ];

                return (
                    <div className="space-y-4">
                        {/* Selection du type */}
                        <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                            <label className={`text-sm font-semibold mb-3 block transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Type de Briefing
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {briefingTypes.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => {
                                            setPreviewType(type.id);
                                            setShowPreview(false);
                                            setPreviewData(null);
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${
                                            previewType === type.id
                                                ? 'bg-purple-600 text-white'
                                                : isDarkMode
                                                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {type.icon} {type.label}
                                    </button>
                                ))}
                            </div>

                            {/* Prompt personnalise */}
                            {previewType === 'custom' && (
                                <div className="mt-4">
                                    <label className={`text-sm font-semibold mb-2 block transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Prompt Personnalise
                                    </label>
                                    <textarea
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        rows={4}
                                        className={`w-full px-4 py-3 rounded-lg border font-mono text-sm transition-colors duration-300 ${
                                            isDarkMode
                                                ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                        } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                        placeholder="Entrez votre prompt personnalise ici..."
                                    />
                                </div>
                            )}

                            {/* Bouton Generer */}
                            <div className="mt-4">
                                <button
                                    onClick={generatePreview}
                                    disabled={loading || (previewType === 'custom' && !customPrompt)}
                                    className={`w-full px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                                        loading || (previewType === 'custom' && !customPrompt)
                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                                    }`}
                                >
                                    {loading ? ' Generation en cours...' : ' Generer le Preview'}
                                </button>
                            </div>
                        </div>

                        {/* Preview */}
                        {showPreview && previewData && (
                            <div className={`p-4 rounded-lg border-2 transition-colors duration-300 ${
                                isDarkMode ? 'bg-gray-900 border-purple-500' : 'bg-white border-purple-300'
                            }`}>
                                {/* Metadonnees */}
                                <div className={`mb-4 p-3 rounded-lg transition-colors duration-300 ${
                                    isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                                }`}>
                                    <h4 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                         Metadonnees
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className={`font-medium transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>Type:</span>
                                            <span className={`ml-2 transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-900'
                                            }`}>{previewData.type}</span>
                                        </div>
                                        <div>
                                            <span className={`font-medium transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>Sujet:</span>
                                            <span className={`ml-2 transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-900'
                                            }`}>{previewData.subject}</span>
                                        </div>
                                        <div>
                                            <span className={`font-medium transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>Modele:</span>
                                            <span className={`ml-2 transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-900'
                                            }`}>{previewData.metadata?.emma_model || 'perplexity'}</span>
                                        </div>
                                        <div>
                                            <span className={`font-medium transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>Temps:</span>
                                            <span className={`ml-2 transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-900'
                                            }`}>
                                                {previewData.metadata?.emma_execution_time 
                                                    ? `${(previewData.metadata.emma_execution_time / 1000).toFixed(1)}s`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview HTML dans iframe */}
                                <div className="mb-4">
                                    <h4 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                         Apercu de l'Email
                                    </h4>
                                    <div className={`rounded-lg border-2 overflow-hidden transition-colors duration-300 ${
                                        isDarkMode ? 'border-gray-700' : 'border-gray-300'
                                    }`}>
                                        <iframe
                                            srcDoc={previewData.html_content}
                                            style={{
                                                width: '100%',
                                                height: '800px',
                                                border: 'none',
                                                backgroundColor: '#ffffff'
                                            }}
                                            title="Email Preview"
                                            sandbox="allow-same-origin"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={sendTestEmail}
                                        className="flex-1 px-6 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors duration-300"
                                    >
                                         Envoyer un Email de Test
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Ouvrir dans un nouvel onglet
                                            const blob = new Blob([previewData.html_content], { type: 'text/html' });
                                            const url = URL.createObjectURL(blob);
                                            window.open(url, '_blank');
                                        }}
                                        className="px-6 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
                                    >
                                         Ouvrir dans un Nouvel Onglet
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Copier le HTML dans le presse-papier
                                            navigator.clipboard.writeText(previewData.html_content);
                                            alert(' HTML copie dans le presse-papier !');
                                        }}
                                        className="px-6 py-2 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-300"
                                    >
                                         Copier le HTML
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            };


export default EmailPreviewManager;
