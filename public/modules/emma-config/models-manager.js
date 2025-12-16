/**
 * 🤖 MODELS MANAGER - Gestion centralisée des modèles LLM
 * 
 * Gère l'interface CRUD pour le registre des modèles (Supabase: emma_llm_models)
 * Permet d'ajouter, éditer, tester et configurer les modèles disponibles.
 */

// État local
let availableModels = [];
let currentModelId = null;

// Initialisation
export function initModelsManager() {
    console.log('🤖 Initialisation Models Manager...');
    
    // Attacher les écouteurs d'événements
    bindEvents();
    
    // Charger la liste initiale
    loadModels();
}

// Charger les modèles depuis l'API
export async function loadModels() {
    try {
        const response = await fetch('/api/admin/llm-models');
        if (!response.ok) throw new Error('Erreur chargement modèles');
        
        const data = await response.json();
        availableModels = data.models || [];
        
        renderModelsList();
        updateModelSelectors();
        
        console.log(`✅ ${availableModels.length} modèles chargés`);
    } catch (error) {
        console.error('❌ Erreur chargement modèles:', error);
        showToast('Erreur chargement modèles', 'error');
    }
}

// Rendre la liste des modèles (Model Cards)
function renderModelsList() {
    const listContainer = document.getElementById('modelsListContainer');
    if (!listContainer) return;
    
    if (availableModels.length === 0) {
        listContainer.innerHTML = `
            <div class="col-span-full text-center p-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                <p>Aucun modèle configuré.</p>
                <button onclick="createNewModel()" class="mt-2 text-indigo-600 font-medium hover:underline">
                    ➕ Ajouter un premier modèle
                </button>
            </div>`;
        return;
    }
    
    listContainer.innerHTML = availableModels.map(model => `
        <div class="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative group ${!model.enabled ? 'opacity-60 grayscale' : ''}">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full ${getProviderBadgeColor(model.provider)}">
                        ${model.provider.toUpperCase()}
                    </span>
                    <h4 class="font-bold text-gray-800 mt-2 truncate" title="${model.name}">${model.name}</h4>
                    <code class="text-xs text-gray-500 block">${model.model_id}</code>
                </div>
                <div class="flex gap-1">
                    <button onclick="editModel('${model.id}')" class="p-1 text-gray-400 hover:text-blue-600 rounded">
                        ✏️
                    </button>
                    ${model.enabled ? 
                        `<span class="text-green-500 text-xs font-bold px-1" title="Actif">●</span>` : 
                        `<span class="text-red-300 text-xs font-bold px-1" title="Désactivé">●</span>`
                    }
                </div>
            </div>
            
            <p class="text-xs text-gray-600 mb-3 line-clamp-2 h-8">${model.description || 'Pas de description'}</p>
            
            <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded mb-3">
                <div>
                    <span class="block text-gray-400 font-medium">Context</span>
                    ${(model.context_window/1000).toFixed(0)}k
                </div>
                <div>
                    <span class="block text-gray-400 font-medium">Output</span>
                    ${(model.max_tokens/1000).toFixed(0)}k
                </div>
                <div>
                    <span class="block text-gray-400 font-medium">Cost In</span>
                    $${model.cost_input_1m}/1M
                </div>
                <div>
                    <span class="block text-gray-400 font-medium">Cost Out</span>
                    $${model.cost_output_1m}/1M
                </div>
            </div>
            
            <div class="flex gap-2 mt-auto">
                <button onclick="testModel('${model.id}')" class="flex-1 text-xs bg-indigo-50 text-indigo-700 py-1.5 rounded hover:bg-indigo-100 transition">
                    🧪 Tester
                </button>
            </div>
        </div>
    `).join('');
}

// Mise à jour des sélecteurs (dropdowns) dans l'UI existante
function updateModelSelectors() {
    const selectors = [
        'emmaiaResearcherModel',
        'emmaiaWriterModel',
        'emmaiaCriticModel',
        'emmaiaTechnicalModel'
    ];
    
    selectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (!select) return;
        
        const currentValue = select.value;
        const currentOptions = Array.from(select.options).map(o => o.value);
        
        // Ajouter les modèles de la DB s'ils n'existent pas déjà
        availableModels.filter(m => m.enabled).forEach(model => {
            if (!currentOptions.includes(model.model_id)) {
                const option = document.createElement('option');
                option.value = model.model_id;
                option.textContent = `${model.name} (${model.provider})`;
                select.appendChild(option);
            }
        });
    });
}

// Créer un nouveau modèle
export function createNewModel() {
    currentModelId = null;
    openModelModal({
        name: 'Nouveau Modèle',
        provider: 'openai',
        model_id: '',
        max_tokens: 4096,
        context_window: 128000,
        temperature: 0.7,
        enabled: true,
        cost_input_1m: 0,
        cost_output_1m: 0,
        description: ''
    });
}

// Éditer un modèle existant
export function editModel(id) {
    const model = availableModels.find(m => m.id === id);
    if (!model) return;
    
    currentModelId = id;
    openModelModal(model);
}

// Ouvrir la modale d'édition
function openModelModal(model) {
    const modal = document.getElementById('modelEditModal');
    const form = document.getElementById('modelEditForm');
    
    if (!modal || !form) return;
    
    // Remplir le formulaire
    document.getElementById('modelName').value = model.name;
    document.getElementById('modelProvider').value = model.provider;
    document.getElementById('modelId').value = model.model_id;
    document.getElementById('modelMaxTokens').value = model.max_tokens;
    document.getElementById('modelContextWindow').value = model.context_window || 128000;
    document.getElementById('modelTemperature').value = model.temperature;
    document.getElementById('modelEnabled').checked = model.enabled;
    document.getElementById('modelCostInput').value = model.cost_input_1m || 0;
    document.getElementById('modelCostOutput').value = model.cost_output_1m || 0;
    document.getElementById('modelDescription').value = model.description || '';
    
    document.getElementById('modelModalTitle').textContent = currentModelId ? 'Modifier Modèle' : 'Nouveau Modèle';
    
    modal.classList.remove('hidden');
}

// Sauvegarder le modèle
export async function saveModel() {
    const data = {
        name: document.getElementById('modelName').value,
        provider: document.getElementById('modelProvider').value,
        model_id: document.getElementById('modelId').value,
        max_tokens: parseInt(document.getElementById('modelMaxTokens').value),
        context_window: parseInt(document.getElementById('modelContextWindow').value),
        temperature: parseFloat(document.getElementById('modelTemperature').value),
        enabled: document.getElementById('modelEnabled').checked,
        cost_input_1m: parseFloat(document.getElementById('modelCostInput').value),
        cost_output_1m: parseFloat(document.getElementById('modelCostOutput').value),
        description: document.getElementById('modelDescription').value
    };
    
    try {
        const method = currentModelId ? 'PUT' : 'POST';
        const url = '/api/admin/llm-models';
        const body = currentModelId ? { ...data, id: currentModelId } : data;
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) throw new Error('Erreur sauvegarde');
        
        closeModelModal();
        loadModels(); // Recharger la liste
        showToast('Modèle sauvegardé avec succès', 'success');
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        showToast('Erreur lors de la sauvegarde', 'error');
    }
}

// Supprimer le modèle
export async function deleteModel() {
    if (!currentModelId || !confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) return;
    
    try {
        const response = await fetch(`/api/admin/llm-models?id=${currentModelId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur suppression');
        
        closeModelModal();
        loadModels();
        showToast('Modèle supprimé', 'success');
        
    } catch (error) {
        console.error('❌ Erreur suppression:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// Tester le modèle (appel réel)
export async function testModel(id = null) {
    const modelId = id || currentModelId;
    if (!modelId) return;
    
    // Si on teste depuis la liste, on cherche le modèle
    let model = availableModels.find(m => m.id === modelId);

    // Si on teste depuis la modale d'édition, on prend les valeurs live du formulaire
    const isEditing = currentModelId === modelId && document.getElementById('modelEditModal') && !document.getElementById('modelEditModal').classList.contains('hidden');
    
    let testConfig = model;

    if (isEditing) {
        testConfig = {
            name: document.getElementById('modelName').value,
            provider: document.getElementById('modelProvider').value,
            model_id: document.getElementById('modelId').value,
            max_tokens: parseInt(document.getElementById('modelMaxTokens').value),
            temperature: parseFloat(document.getElementById('modelTemperature').value)
        };
    }
    
    if (!testConfig) return;

    const testPrompt = prompt(`Test ${testConfig.name}:\nEntrez un prompt pour tester la connexion API`, "Explique-moi le concept de ratio P/E en 20 mots");
    if (!testPrompt) return;
    
    showToast('Test en cours... (peut prendre 10s)', 'info');
    
    try {
        const response = await fetch('/api/admin/test-llm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: testConfig.provider,
                model_id: testConfig.model_id,
                prompt: testPrompt,
                max_tokens: testConfig.max_tokens,
                temperature: testConfig.temperature
            })
        });
        
        const data = await response.json();
        
        if (!data.success) throw new Error(data.error);
        
        console.log('✅ Test réussi:', data.response);
        alert(`✅ SUCCÈS - ${testConfig.model_id}\n\n${data.response}`);
        showToast('Test réussi !', 'success');
        
    } catch (error) {
        console.error('Test Error:', error);
        alert(`❌ ERREUR API:\n${error.message}`);
        showToast('Échec du test', 'error');
    }
}

// Helpers UI
function closeModelModal() {
    document.getElementById('modelEditModal').classList.add('hidden');
}

function getProviderBadgeColor(provider) {
    const colors = {
        openai: 'bg-green-100 text-green-800',
        anthropic: 'bg-orange-100 text-orange-800',
        google: 'bg-blue-100 text-blue-800',
        perplexity: 'bg-teal-100 text-teal-800',
        mistral: 'bg-purple-100 text-purple-800'
    };
    return colors[provider] || 'bg-gray-100 text-gray-800';
}

function showToast(message, type = 'info') {
    // Utiliser le système de toast existant ou simple alert pour l'instant
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = message;
        statusText.className = type === 'error' ? 'text-red-600' : 'text-green-600';
        document.getElementById('statusSidebar').classList.remove('hidden');
        setTimeout(() => document.getElementById('statusSidebar').classList.add('hidden'), 3000);
    } else {
        alert(message);
    }
}

// Bind Events
function bindEvents() {
    window.createNewModel = createNewModel;
    window.editModel = editModel;
    window.testModel = testModel;
    window.saveModel = saveModel;
    window.deleteModel = deleteModel;
    window.closeModelModal = closeModelModal;
}
