/**
 * VISUAL BUILDER MANAGER
 * Gère le Drag & Drop et l'édition visuelle des emails
 */

import { showStatus } from './ui-helpers.js';

// État local
let blocks = [];
let selectedBlockId = null;

// Types de blocs et configurations par défaut
const BLOCK_DEFAULTS = {
    header: {
        type: 'header',
        title: 'Titre Principal',
        subtitle: 'Sous-titre optionnel',
        showLogo: true
    },
    text: {
        type: 'text',
        content: 'Ceci est un paragraphe de texte. Vous pouvez utiliser du **Markdown** ici.'
    },
    image: {
        type: 'image',
        url: 'https://placehold.co/600x300',
        alt: 'Description image',
        width: 600
    },
    button: {
        type: 'button',
        label: 'Cliquer ici',
        url: 'https://example.com',
        color: '#6366f1'
    },
    divider: {
        type: 'divider',
        margin: 20
    },
    spacer: {
        type: 'spacer',
        height: 32
    }
};

/**
 * Initialisation du Builder
 */
export function initBuilder() {
    console.log('🏗️ Init Visual Builder...');
    
    setupDragAndDrop();
    setupCanvasInteractions();
    
    // Charger un état initial vide ou démo
    // blocks = [];
    // renderCanvas(); 
    // (Laisse vide pour l'instant avec le placeholder)
}

/**
 * Configuration du Drag & Drop (Sidebar -> Canvas)
 */
function setupDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-item');
    const canvas = document.getElementById('drop-zone');

    draggables.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('type', item.dataset.type);
            e.dataTransfer.effectAllowed = 'copy';
        });
    });

    // Zone de drop
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault(); // Nécessaire pour permettre le drop
        e.dataTransfer.dropEffect = 'copy';
        canvas.classList.add('bg-indigo-50', 'border-indigo-300');
    });

    canvas.addEventListener('dragleave', () => {
        canvas.classList.remove('bg-indigo-50', 'border-indigo-300');
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        canvas.classList.remove('bg-indigo-50', 'border-indigo-300');
        
        const type = e.dataTransfer.getData('type');
        if (type && BLOCK_DEFAULTS[type]) {
            addBlock(type);
        }
    });
}

/**
 * Ajoute un bloc au canvas
 */
function addBlock(type) {
    const newBlock = {
        id: 'block_' + Date.now(),
        ...JSON.parse(JSON.stringify(BLOCK_DEFAULTS[type])) // Deep copy default config
    };
    
    blocks.push(newBlock);
    renderCanvas();
    selectBlock(newBlock.id);
    showStatus('Bloc ajouté', 'success');
}

/**
 * Supprime un bloc
 */
function deleteBlock(id) {
    blocks = blocks.filter(b => b.id !== id);
    if (selectedBlockId === id) {
        selectedBlockId = null;
        renderPropertiesPanel();
    }
    renderCanvas();
}

/**
 * Sélectionne un bloc
 */
function selectBlock(id) {
    selectedBlockId = id;
    renderCanvas(); // Pour mettre à jour la classe .selected
    renderPropertiesPanel();
}

/**
 * Met à jour une propriété d'un bloc
 */
function updateBlockProperty(id, key, value) {
    const block = blocks.find(b => b.id === id);
    if (block) {
        block[key] = value;
        renderCanvas();
    }
}

/**
 * Rendu du Canvas
 */
function renderCanvas() {
    const container = document.getElementById('drop-zone');
    
    if (blocks.length === 0) {
        container.innerHTML = `
            <div class="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 bg-gray-50/50">
                <p>Glissez et déposez des blocs ici</p>
            </div>`;
        return;
    }

    container.innerHTML = '';

    blocks.forEach((block, index) => {
        const el = document.createElement('div');
        el.className = `relative group border-2 rounded transition-all cursor-pointer mb-2 bg-white ${selectedBlockId === block.id ? 'border-indigo-500 ring-2 ring-indigo-200 z-10' : 'border-transparent hover:border-gray-300'}`;
        el.onclick = (e) => {
            e.stopPropagation();
            selectBlock(block.id);
        };

        // Bouton supprimer (visible au survol ou sélection)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = `absolute -right-3 -top-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm text-xs opacity-0 group-hover:opacity-100 transition-opacity ${selectedBlockId === block.id ? 'opacity-100' : ''}`;
        deleteBtn.innerHTML = '✕';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteBlock(block.id);
        };
        el.appendChild(deleteBtn);

        // Contenu du bloc (Prévisualisation simplifiée)
        const content = document.createElement('div');
        content.className = 'p-4 pointer-events-none'; // Click-through pour sélectionner le wrapper
        content.innerHTML = renderBlockPreview(block);
        
        el.appendChild(content);
        container.appendChild(el);
    });
}

/**
 * Rendu HTML simplifié pour le Canvas (Preview)
 */
function renderBlockPreview(block) {
    switch (block.type) {
        case 'header':
            return `
                <div class="text-center">
                    ${block.showLogo ? '<div class="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>' : ''}
                    <h2 class="text-xl font-bold text-gray-800">${block.title}</h2>
                    <p class="text-sm text-gray-500">${block.subtitle}</p>
                </div>`;
        
        case 'text':
            return `<div class="text-gray-700 text-sm whitespace-pre-wrap">${block.content}</div>`;
            
        case 'image':
            return `<img src="${block.url}" alt="${block.alt}" class="w-full h-auto rounded bg-gray-100" style="max-width: ${block.width}px; margin: 0 auto; display: block;">`;
            
        case 'button':
            return `
                <div class="text-center py-2">
                    <span class="inline-block px-6 py-3 rounded text-white font-bold text-sm" style="background-color: ${block.color}">
                        ${block.label}
                    </span>
                </div>`;
                
        case 'divider':
            return `<hr class="border-t border-gray-200 my-2">`;
            
        case 'spacer':
            return `<div style="height: ${block.height}px;" class="w-full bg-gray-50/50 border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-300">Espace ${block.height}px</div>`;
            
        default:
            return `<div class="text-red-500">Type inconnu: ${block.type}</div>`;
    }
}

/**
 * Rendu du Panneau de Propriétés
 */
function renderPropertiesPanel() {
    const panel = document.getElementById('inspector-panel');
    
    if (!selectedBlockId) {
        panel.innerHTML = `
            <div class="text-center text-gray-400 mt-20">
                <div class="text-4xl mb-2">👆</div>
                <p class="text-sm">Sélectionnez un bloc</p>
            </div>`;
        return;
    }

    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block) return;

    let formHtml = `<div class="space-y-4">
        <div class="flex justify-between items-center border-b pb-2 mb-4">
            <h4 class="font-bold text-gray-700 capitalize">${block.type}</h4>
            <span class="text-xs text-gray-400 font-mono">${block.id.split('_')[1]}</span>
        </div>`;

    // Génération champs dynamique selon type
    if (block.type === 'header') {
        formHtml += createInput('Titre', 'title', block.title);
        formHtml += createInput('Sous-titre', 'subtitle', block.subtitle);
        formHtml += createCheckbox('Afficher Logo', 'showLogo', block.showLogo);
    } 
    else if (block.type === 'text') {
        formHtml += createTextarea('Contenu', 'content', block.content);
    }
    else if (block.type === 'button') {
        formHtml += createInput('Libellé', 'label', block.label);
        formHtml += createInput('URL', 'url', block.url);
        formHtml += createColorInput('Couleur', 'color', block.color);
    }
    else if (block.type === 'image') {
        formHtml += createInput('URL Image', 'url', block.url);
        formHtml += createInput('Texte Alt', 'alt', block.alt);
        formHtml += createNumberInput('Largeur (max px)', 'width', block.width);
    }
    else if (block.type === 'spacer') {
        formHtml += createNumberInput('Hauteur (px)', 'height', block.height);
    }

    formHtml += `</div>`;
    panel.innerHTML = formHtml;

    // Attach interaction events
    attachPropertyListeners(block.id);
}

// Helpers pour champs formulaire
function createInput(label, key, value) {
    return `
        <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">${label}</label>
            <input type="text" data-key="${key}" value="${value}" class="prop-input w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
        </div>`;
}

function createTextarea(label, key, value) {
    return `
        <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">${label}</label>
            <textarea data-key="${key}" rows="6" class="prop-input w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs">${value}</textarea>
        </div>`;
}

function createNumberInput(label, key, value) {
    return `
        <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">${label}</label>
            <input type="number" data-key="${key}" value="${value}" class="prop-input w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
        </div>`;
}

function createColorInput(label, key, value) {
    return `
        <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">${label}</label>
            <div class="flex gap-2">
                <input type="color" data-key="${key}" value="${value}" class="prop-input h-9 w-12 rounded cursor-pointer border p-1">
                <input type="text" data-key="${key}" value="${value}" class="prop-input flex-1 px-3 py-2 border rounded-md text-sm font-mono uppercase">
            </div>
        </div>`;
}

function createCheckbox(label, key, value) {
    return `
        <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" data-key="${key}" ${value ? 'checked' : ''} class="prop-input rounded text-indigo-600 focus:ring-indigo-500">
            <span class="text-sm font-medium text-gray-700">${label}</span>
        </label>`;
}

function attachPropertyListeners(blockId) {
    const inputs = document.querySelectorAll('.prop-input');
    inputs.forEach(input => {
        ['input', 'change'].forEach(evt => {
            input.addEventListener(evt, (e) => {
                const key = e.target.dataset.key;
                const value = e.target.type === 'checkbox' ? e.target.checked : 
                              e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
                
                updateBlockProperty(blockId, key, value);
                
                // Sync color inputs
                if (e.target.type === 'color' || (e.target.type === 'text' && key === 'color')) {
                   const partner = Array.from(inputs).find(i => i.dataset.key === key && i !== e.target);
                   if (partner) partner.value = value;
                }
            });
        });
    });
}

/**
 * Setup interactions génériques canvas
 */
function setupCanvasInteractions() {
    // Click outside to deselect
    document.getElementById('builderCanvas')?.addEventListener('click', (e) => {
        if (e.target.id === 'drop-zone' || e.target.id === 'builder-canvas') {
           // selectedBlockId = null;
           // renderCanvas();
           // renderPropertiesPanel();
        }
    });
}
