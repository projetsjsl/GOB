// app-logic.js - Logique complète pour app.html

let currentStep = 1;
let totalSteps = 4;
let formData = {};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!user.username) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userName').textContent = `${user.name || user.username}`;
    
    // Charger données sauvegardées si existantes
    const savedData = localStorage.getItem('currentFormData');
    if (savedData) {
        formData = JSON.parse(savedData);
        populateForm();
    }

    updateProgressBar();
    attachFormListeners();
});

// Sauvegarde automatique
function autoSaveForm() {
    collectFormData();
    localStorage.setItem('currentFormData', JSON.stringify(formData));
    
    // Afficher l'indicateur de sauvegarde
    const indicator = document.getElementById('autosaveIndicator');
    indicator.classList.add('show');
    setTimeout(() => indicator.classList.remove('show'), 2000);
}

// Collecter les données du formulaire
function collectFormData() {
    const form = document.getElementById('collectionForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.id) {
            formData[input.id] = input.value;
        }
    });
}

// Remplir le formulaire avec données sauvegardées
function populateForm() {
    Object.keys(formData).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = formData[key];
        }
    });
}

// Attacher les listeners d'auto-save
function attachFormListeners() {
    const form = document.getElementById('collectionForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('change', autoSaveForm);
        input.addEventListener('blur', autoSaveForm);
    });
}

// Navigation entre étapes
function nextStep() {
    if (validateStep(currentStep)) {
        if (currentStep === 3) {
            // Dernière étape, afficher récapitulatif
            showSummary();
            currentStep++;
        } else if (currentStep < totalSteps) {
            currentStep++;
        }
        updateDisplay();
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateDisplay();
    }
}

// Validation des champs
function validateStep(step) {
    const requiredFields = {
        1: ['firstName', 'lastName', 'email', 'phone', 'address'],
        2: ['civilStatus', 'birthdate', 'employer', 'jobTitle'],
        3: ['annualIncome', 'investmentHorizon', 'riskTolerance']
    };

    const fields = requiredFields[step] || [];
    let isValid = true;

    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.style.borderColor = 'var(--danger)';
            isValid = false;
        } else {
            field.style.borderColor = '';
        }
    });

    return isValid;
}

// Afficher le récapitulatif
function showSummary() {
    collectFormData();
    
    const summaryHtml = `
        <div class="summary-section">
            <h3>👤 Identité</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-item-label">Prénom</div>
                    <div class="summary-item-value">${formData.firstName || '-'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Nom</div>
                    <div class="summary-item-value">${formData.lastName || '-'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Email</div>
                    <div class="summary-item-value">${formData.email || '-'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Téléphone</div>
                    <div class="summary-item-value">${formData.phone || '-'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Adresse</div>
                    <div class="summary-item-value">${formData.address || '-'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Code Postal</div>
                    <div class="summary-item-value">${formData.postalCode || '-'}</div>
                </div>
            </div>
        </div>

        <div class="summary-section">
            <h3>👨‍👩‍👧 Situation Personnelle</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-item-label">État Civil</div>
                    <div class="summary-item-value">${formData.civilStatus || '-'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Date de Naissance</div>
                    <div class="summary-item-value">${formData.birthdate || '-'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Employeur</div>
                    <div class="summary-item-value">${formData.employer || '-'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Poste</div>
                    <div class="summary-item-value">${formData.jobTitle || '-'}</div>
                </div>
            </div>
        </div>

        <div class="summary-section">
            <h3>💰 Situation Financière</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-item-label">Revenu Annuel</div>
                    <div class="summary-item-value">$ ${parseInt(formData.annualIncome || 0).toLocaleString('fr-CA')}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Actifs Immobiliers</div>
                    <div class="summary-item-value">$ ${parseInt(formData.realEstateValue || 0).toLocaleString('fr-CA')}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Actifs Liquides</div>
                    <div class="summary-item-value">$ ${parseInt(formData.liquidAssets || 0).toLocaleString('fr-CA')}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Horizon de Placement</div>
                    <div class="summary-item-value">${formData.investmentHorizon || '-'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Tolérance au Risque</div>
                    <div class="summary-item-value">${formData.riskTolerance || '-'}</div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('summaryContent').innerHTML = summaryHtml;
}

// Mettre à jour l'affichage
function updateDisplay() {
    // Masquer toutes les étapes
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
    });

    // Afficher l'étape actuelle
    if (currentStep <= 3) {
        document.getElementById(`step${currentStep}`).classList.add('active');
    } else {
        document.getElementById('summary').classList.add('active');
    }

    updateProgressBar();
    updateNavigation();
}

// Mise à jour de la barre de progression
function updateProgressBar() {
    for (let i = 1; i <= 3; i++) {
        const circle = document.getElementById(`circle${i}`);
        const label = circle.nextElementSibling;
        
        circle.classList.remove('active', 'completed');
        label.classList.remove('active');
        
        if (i === currentStep) {
            circle.classList.add('active');
            label.classList.add('active');
        } else if (i < currentStep) {
            circle.classList.add('completed');
        }
    }

    // Ligne de progression
    const progressLine = document.querySelector('.progress-line.active');
    if (currentStep === 1) {
        progressLine.style.width = '0%';
    } else if (currentStep === 2) {
        progressLine.style.width = '50%';
    } else {
        progressLine.style.width = '100%';
    }
}

// Mise à jour de la navigation
function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'block';
    }

    if (currentStep >= totalSteps) {
        nextBtn.textContent = 'Terminé ✓';
        nextBtn.disabled = true;
    } else {
        nextBtn.textContent = 'Suivant →';
        nextBtn.disabled = false;
    }
}

// Export Excel
function exportToExcel() {
    collectFormData();

    // En-têtes
    const headers = [
        'Prénom', 'Nom', 'Email', 'Téléphone', 'Adresse',
        'État Civil', 'Date de Naissance', 'NAS', 'Employeur', 'Poste',
        'Revenu Annuel', 'Actifs Immobiliers', 'Actifs Liquides',
        'Horizon de Placement', 'Tolérance au Risque'
    ];

    // Données
    const row = [
        formData.firstName, formData.lastName, formData.email, formData.phone, formData.address,
        formData.civilStatus, formData.birthdate, formData.nas, formData.employer, formData.jobTitle,
        formData.annualIncome, formData.realEstateValue, formData.liquidAssets,
        formData.investmentHorizon, formData.riskTolerance
    ];

    // Créer CSV
    let csv = headers.join('\t') + '\n' + row.join('\t');

    // Télécharger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `client_${formData.lastName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export PDF
function exportToPDF() {
    collectFormData();

    const pdfContent = `
    ╔════════════════════════════════════════════════════════╗
    ║        FORMULAIRE DE COLLECTE - ONBOARDING CLIENT      ║
    ╚════════════════════════════════════════════════════════╝

    IDENTITÉ DU CLIENT
    ════════════════════════════════════════════════════════
    Prénom:                    ${formData.firstName || '_'.repeat(30)}
    Nom:                       ${formData.lastName || '_'.repeat(30)}
    Email:                     ${formData.email || '_'.repeat(30)}
    Téléphone:                 ${formData.phone || '_'.repeat(30)}
    Adresse:                   ${formData.address || '_'.repeat(30)}
    Ville:                     ${formData.city || '_'.repeat(30)}
    Province:                  ${formData.province || '_'.repeat(30)}
    Code Postal:               ${formData.postalCode || '_'.repeat(30)}

    SITUATION PERSONNELLE
    ════════════════════════════════════════════════════════
    État Civil:                ${formData.civilStatus || '_'.repeat(30)}
    Date de Naissance:         ${formData.birthdate || '_'.repeat(30)}
    NAS:                       ${formData.nas || '_'.repeat(30)}
    Nombre d'Enfants:          ${formData.childrenCount || '_'.repeat(30)}
    Employeur:                 ${formData.employer || '_'.repeat(30)}
    Titre de Poste:            ${formData.jobTitle || '_'.repeat(30)}

    SITUATION FINANCIÈRE
    ════════════════════════════════════════════════════════
    Revenu Annuel:             $ ${parseInt(formData.annualIncome || 0).toLocaleString('fr-CA')}
    Revenu Conjoint:           $ ${parseInt(formData.spouseIncome || 0).toLocaleString('fr-CA')}
    Valeur Immobilière:        $ ${parseInt(formData.realEstateValue || 0).toLocaleString('fr-CA')}
    Actifs Liquides:           $ ${parseInt(formData.liquidAssets || 0).toLocaleString('fr-CA')}
    Horizon de Placement:      ${formData.investmentHorizon || '_'.repeat(30)}
    Tolérance au Risque:       ${formData.riskTolerance || '_'.repeat(30)}

    INFORMATIONS COMPTABLES
    ════════════════════════════════════════════════════════
    Comptable (Nom):           ${formData.accountantName || '_'.repeat(30)}
    Comptable (Téléphone):     ${formData.accountantPhone || '_'.repeat(30)}

    SIGNATURE DU CLIENT
    ════════════════════════════════════════════════════════
    Signature: ___________________________     Date: ${new Date().toLocaleDateString('fr-CA')}

    Généré le: ${new Date().toLocaleString('fr-CA')}
    ════════════════════════════════════════════════════════
    `;

    // Télécharger
    const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `formulaire_${formData.lastName}_${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Note: Pour vrai PDF, utilisez une librairie comme jsPDF
    alert('✅ Formulaire exporté en texte.\n\nPour PDF avec mise en page, consultez l\'admin.');
}

// Nouveau client
function newClient() {
    if (confirm('Êtes-vous sûr? Cela effacera le formulaire actuel.')) {
        localStorage.removeItem('currentFormData');
        formData = {};
        document.getElementById('collectionForm').reset();
        currentStep = 1;
        updateDisplay();
    }
}

// Déconnexion
function logout() {
    if (confirm('Déconnexion?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentFormData');
        window.location.href = 'index.html';
    }
}