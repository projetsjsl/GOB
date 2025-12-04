// admin-logic.js - Logique pour admin.html

document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!user.username || user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    loadDashboard();
    loadUsers();
    loadFields();
    loadClients();
});

// Navigation
function switchSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
    });

    // Afficher la section sélectionnée
    document.getElementById(sectionId).classList.add('active');

    // Mettre à jour menu
    document.querySelectorAll('.menu-item').forEach(el => {
        el.classList.remove('active');
    });
    event.target.classList.add('active');

    // Charger les données si nécessaire
    if (sectionId === 'users') loadUsers();
    if (sectionId === 'clients') loadClients();
    if (sectionId === 'fields') loadFields();
}

// === DASHBOARD ===
function loadDashboard() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const config = JSON.parse(localStorage.getItem('config') || '{}');

    document.getElementById('userCount').textContent = users.length;
    document.getElementById('clientCount').textContent = clients.length;

    let fieldCount = 0;
    if (config.fields) {
        Object.values(config.fields).forEach(section => {
            fieldCount += section.length;
        });
    }
    document.getElementById('fieldCount').textContent = fieldCount;

    document.getElementById('browserInfo').textContent = navigator.userAgent.substring(0, 50) + '...';
    document.getElementById('lastUpdate').textContent = new Date().toLocaleDateString('fr-CA');

    // Storage info
    let usage = 0;
    for (let key in localStorage) {
        usage += localStorage[key].length;
    }
    document.getElementById('storageInfo').textContent = `${(usage / 1024).toFixed(2)} KB / 5 MB`;
}

// === GESTION UTILISATEURS ===
function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let html = '';

    users.forEach((user, index) => {
        const createdDate = new Date(user.created).toLocaleDateString('fr-CA');
        html += `
            <tr>
                <td>${user.name || user.username}</td>
                <td>${user.username}</td>
                <td><span style="background: ${user.role === 'admin' ? 'rgba(230, 127, 97, 0.2)' : 'rgba(21, 128, 77, 0.2)'}; padding: 4px 8px; border-radius: 4px;">${user.role}</span></td>
                <td>${createdDate}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="editUser(${index})">Modifier</button>
                    <button class="action-btn btn-delete" onclick="deleteUser(${index})">Supprimer</button>
                </td>
            </tr>
        `;
    });

    document.getElementById('usersList').innerHTML = html;
}

function addUser(e) {
    e.preventDefault();

    const name = document.getElementById('newUserName').value;
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;

    if (!name || !username || !password) {
        showAlert('alertUsers', 'Tous les champs sont requis', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Vérifier si l'utilisateur existe
    if (users.some(u => u.username === username)) {
        showAlert('alertUsers', 'Cet utilisateur existe déjà', 'error');
        return;
    }

    const newUser = {
        id: 'user-' + Date.now(),
        username,
        password,
        role,
        name,
        created: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    document.getElementById('userForm').reset();
    loadUsers();
    loadDashboard();
    showAlert('alertUsers', 'Utilisateur créé avec succès', 'success');
}

function deleteUser(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        loadUsers();
        loadDashboard();
    }
}

// === PARAMÉTRER CHAMPS ===
function loadFields() {
    const config = JSON.parse(localStorage.getItem('config') || '{}');
    
    if (!config.fields) {
        config.fields = {
            section1: [],
            section2: [],
            section3: []
        };
    }

    let html = '';
    const sectionNames = {
        section1: '📋 Section 1: Identité',
        section2: '👨‍👩‍👧 Section 2: Situation',
        section3: '💰 Section 3: Finances'
    };

    for (const [sectionKey, sectionName] of Object.entries(sectionNames)) {
        const fields = config.fields[sectionKey] || [];
        
        html += `
            <div style="margin-bottom: 25px; padding: 15px; background: rgba(32, 140, 142, 0.05); border-radius: 6px;">
                <h4 style="color: var(--primary); margin-bottom: 12px;">${sectionName}</h4>
                <div id="fields-${sectionKey}">
        `;

        fields.forEach((field, idx) => {
            html += `
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 80px; gap: 10px; margin-bottom: 10px; align-items: center; background: white; padding: 10px; border-radius: 4px;">
                    <input type="text" value="${field.label}" placeholder="Libellé" data-section="${sectionKey}" data-idx="${idx}" class="field-label" onchange="updateField('${sectionKey}', ${idx}, 'label', this.value)">
                    <select data-section="${sectionKey}" data-idx="${idx}" class="field-type" onchange="updateField('${sectionKey}', ${idx}, 'type', this.value)">
                        <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                        <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number</option>
                        <option value="email" ${field.type === 'email' ? 'selected' : ''}>Email</option>
                        <option value="date" ${field.type === 'date' ? 'selected' : ''}>Date</option>
                        <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select</option>
                        <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Textarea</option>
                    </select>
                    <label style="display: flex; gap: 5px; align-items: center;">
                        <input type="checkbox" ${field.required ? 'checked' : ''} onchange="updateField('${sectionKey}', ${idx}, 'required', this.checked)">
                        Requis
                    </label>
                    <button class="action-btn btn-delete" onclick="deleteField('${sectionKey}', ${idx})">Supprimer</button>
                </div>
            `;
        });

        html += `
                </div>
                <button class="btn btn-secondary" style="margin-top: 10px; width: 100%;" onclick="addField('${sectionKey}')">+ Ajouter Champ</button>
            </div>
        `;
    }

    document.getElementById('fieldsList').innerHTML = html;
}

function addField(sectionKey) {
    const config = JSON.parse(localStorage.getItem('config') || '{}');
    if (!config.fields) config.fields = {};
    if (!config.fields[sectionKey]) config.fields[sectionKey] = [];

    config.fields[sectionKey].push({
        id: 'field-' + Date.now(),
        label: 'Nouveau Champ',
        type: 'text',
        required: false,
        visible: true
    });

    localStorage.setItem('config', JSON.stringify(config));
    loadFields();
}

function updateField(sectionKey, idx, property, value) {
    const config = JSON.parse(localStorage.getItem('config') || '{}');
    if (config.fields && config.fields[sectionKey] && config.fields[sectionKey][idx]) {
        config.fields[sectionKey][idx][property] = value;
        localStorage.setItem('config', JSON.stringify(config));
    }
}

function deleteField(sectionKey, idx) {
    if (confirm('Supprimer ce champ?')) {
        const config = JSON.parse(localStorage.getItem('config') || '{}');
        config.fields[sectionKey].splice(idx, 1);
        localStorage.setItem('config', JSON.stringify(config));
        loadFields();
    }
}

// === TEMPLATES ===
function saveTemplates() {
    const config = JSON.parse(localStorage.getItem('config') || '{}');

    config.excelTemplate = document.getElementById('excelTemplate').value;
    config.excelColumns = document.getElementById('excelColumns').value.split(',').map(c => c.trim());
    config.pdfTitle = document.getElementById('pdfTitle').value;
    config.pdfSignature = document.getElementById('pdfSignature').value === 'true';
    config.pdfSections = document.getElementById('pdfSections').value.split('\n').map(s => s.trim());

    localStorage.setItem('config', JSON.stringify(config));
    showAlert('alertFields', 'Templates sauvegardés avec succès', 'success');
}

// === CLIENTS ===
function loadClients() {
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    let html = '';

    clients.forEach((client, index) => {
        const createdDate = new Date(client.created).toLocaleDateString('fr-CA');
        html += `
            <tr>
                <td>${client.firstName} ${client.lastName}</td>
                <td>${client.email}</td>
                <td>$ ${parseInt(client.annualIncome || 0).toLocaleString('fr-CA')}</td>
                <td>${createdDate}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="viewClient(${index})">Voir</button>
                    <button class="action-btn btn-delete" onclick="deleteClient(${index})">Supprimer</button>
                </td>
            </tr>
        `;
    });

    if (clients.length === 0) {
        html = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 30px;">Aucun dossier client</td></tr>';
    }

    document.getElementById('clientsList').innerHTML = html;
}

function deleteClient(index) {
    if (confirm('Supprimer ce dossier?')) {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        clients.splice(index, 1);
        localStorage.setItem('clients', JSON.stringify(clients));
        loadClients();
        loadDashboard();
    }
}

// === IMPORT/EXPORT ===
function exportAll() {
    const data = {
        users: localStorage.getItem('users'),
        config: localStorage.getItem('config'),
        clients: localStorage.getItem('clients'),
        exportedAt: new Date().toISOString()
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `collecteur_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importConfig() {
    const file = document.getElementById('importFile').files[0];
    if (!file) {
        alert('Sélectionnez un fichier');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.config) {
                localStorage.setItem('config', data.config);
                loadFields();
                showAlert('alertFields', 'Configuration importée', 'success');
            }
        } catch(err) {
            showAlert('alertFields', 'Erreur: fichier invalide', 'error');
        }
    };
    reader.readAsText(file);
}

function testAutoSave() {
    const newClient = {
        created: new Date().toISOString(),
        firstName: 'Test',
        lastName: 'Client',
        email: 'test@example.com'
    };

    // Créer Excel
    const csv = `Prénom\tNom\tEmail\nTest\tClient\ttest@example.com`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auto_save_test_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('✅ Fichier Excel généré automatiquement');
}

// === UTILITAIRES ===
function showAlert(elementId, message, type) {
    const alert = document.getElementById(elementId);
    alert.textContent = message;
    alert.className = `alert alert-${type} show`;
    setTimeout(() => alert.classList.remove('show'), 3000);
}

function logoutAdmin() {
    if (confirm('Déconnexion?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}