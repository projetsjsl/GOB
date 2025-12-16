/**
 * Module de gestion des Emails pour Emma Config
 * Permet de tester l'envoi d'emails via Resend
 */

export const emailManager = {
    // État local
    state: {
        lastRecipient: '',
        lastSubject: '',
        status: 'idle', // idle, sending, success, error
        logs: []
    },

    // Initialisation du module
    init() {
        console.log('📧 Email Manager initialized');
        this.render();
    },

    // Rendu de l'interface
    render() {
        const container = document.getElementById('emailTabContent');
        if (!container) return;

        container.innerHTML = `
            <div class="max-w-4xl mx-auto p-6">
                <!-- En-tête -->
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <span class="text-3xl">📧</span> Gestion Email (Resend)
                    </h2>
                    <p class="text-gray-600 mt-2">
                        Testez l'envoi d'emails transactionnels et vérifiez la configuration de l'API Resend.
                    </p>
                </div>

                <!-- Zone principale -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <!-- Colonne Gauche: Formulaire de test -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            🚀 Envoyer un test
                        </h3>
                        
                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Drestinataire (To)</label>
                                <input type="email" id="testEmailTo" 
                                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="ex: votre-email@exemple.com"
                                    value="${this.state.lastRecipient || 'projetsjsl@gmail.com'}">
                                <p class="text-xs text-gray-500 mt-1">L'email sera envoyé via l'API <code>/api/send-email</code></p>
                            </div>

                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Sujet</label>
                                <input type="text" id="testEmailSubject" 
                                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Sujet du test"
                                    value="Test depuis Emma Config">
                            </div>

                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Contenu (HTML)</label>
                                <textarea id="testEmailBody" rows="6"
                                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono text-gray-600"
                                    placeholder="<p>Bonjour...</p>"><div style="font-family: sans-serif; padding: 20px; background: #f3f4f6;">
  <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #4f46e5; margin-top: 0;">Test Emma Config 🚀</h1>
    <p>Ceci est un email de test envoyé depuis le panneau d'administration.</p>
    <p>Heure: <strong>${new Date().toLocaleTimeString()}</strong></p>
    <br>
    <a href="#" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Bouton Test</a>
  </div>
</div></textarea>
                            </div>

                            <div class="pt-2">
                                <button id="btnSendTest" 
                                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg shadow transition-colors flex justify-center items-center gap-2">
                                    <span>Envoyer le test</span>
                                    <span id="sendSpinner" class="hidden animate-spin">⏳</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Colonne Droite: Status & Logs -->
                    <div class="space-y-6">
                        
                        <!-- Status Card -->
                        <div class="bg-gray-50 rounded-xl border border-gray-200 p-5">
                            <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Configuration</h3>
                            <div class="space-y-2">
                                <div class="flex justify-between items-center bg-white p-3 rounded border border-gray-100">
                                    <span class="text-sm text-gray-600">Endpoint API</span>
                                    <code class="text-xs bg-gray-100 px-2 py-1 rounded text-indigo-600">/api/send-email</code>
                                </div>
                                <div class="flex justify-between items-center bg-white p-3 rounded border border-gray-100">
                                    <span class="text-sm text-gray-600">Provider</span>
                                    <div class="flex items-center gap-1">
                                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span class="text-sm font-medium">Resend.com</span>
                                    </div>
                                </div>
                                <div class="text-xs text-gray-400 mt-2 px-1">
                                    <p>Les clés API sont gérées côté serveur (.env)</p>
                                </div>
                            </div>
                        </div>

                        <!-- Console Logs -->
                        <div class="bg-gray-900 rounded-xl shadow-lg border border-gray-700 overflow-hidden flex flex-col h-80">
                            <div class="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                                <span class="text-xs font-mono text-gray-400">Terminal de sortie</span>
                                <button id="btnClearLogs" class="text-xs text-gray-500 hover:text-white transition">Effacer</button>
                            </div>
                            <div id="emailConsoleOutput" class="flex-1 p-4 overflow-y-auto font-mono text-xs text-green-400 space-y-1">
                                <div class="opacity-50">> Prêt. En attente d'action...</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;

        // Bind events
        document.getElementById('btnSendTest').addEventListener('click', () => this.handleSend());
        document.getElementById('btnClearLogs').addEventListener('click', () => {
            document.getElementById('emailConsoleOutput').innerHTML = '<div class="opacity-50">> Logs effacés.</div>';
        });
    },

    // Action d'envoi
    async handleSend() {
        const to = document.getElementById('testEmailTo').value;
        const subject = document.getElementById('testEmailSubject').value;
        const html = document.getElementById('testEmailBody').value; // Pour l'instant on envoie le HTML brut
        const btn = document.getElementById('btnSendTest');
        const spinner = document.getElementById('sendSpinner');
        const consoleOut = document.getElementById('emailConsoleOutput');

        // Validation simple
        if (!to || !subject) {
            alert("Veuillez remplir le destinataire et le sujet.");
            return;
        }

        this.state.lastRecipient = to;

        // UI Loading
        btn.disabled = true;
        btn.classList.add('opacity-75');
        spinner.classList.remove('hidden');
        this.log(`> Envoi en cours vers ${to}...`);

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to,
                    subject,
                    html,
                    briefingType: 'test_config'
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.log(`✅ SUCCÈS: Email envoyé! ID: ${data.emailId || 'N/A'}`, 'success');
                this.log(`> Réponse: ${JSON.stringify(data, null, 2)}`);
            } else {
                this.log(`❌ ERREUR: ${data.message || 'Erreur inconnue'}`, 'error');
                this.log(`> Détails: ${JSON.stringify(data, null, 2)}`);
            }

        } catch (error) {
            this.log(`‼️ EXCEPTION: ${error.message}`, 'error');
        } finally {
            // UI Reset
            btn.disabled = false;
            btn.classList.remove('opacity-75');
            spinner.classList.add('hidden');
        }
    },

    // Helper pour les logs
    log(msg, type = 'info') {
        const consoleOut = document.getElementById('emailConsoleOutput');
        if (!consoleOut) return;

        const div = document.createElement('div');
        div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        
        if (type === 'error') div.classList.add('text-red-400');
        if (type === 'success') div.classList.add('text-green-300', 'font-bold');
        
        consoleOut.appendChild(div);
        consoleOut.scrollTop = consoleOut.scrollHeight;
    }
};
