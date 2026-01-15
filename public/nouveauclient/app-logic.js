// app-logic.js - Logique complete pour app.html

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
    
    // Charger donnees sauvegardees si existantes
    const savedData = localStorage.getItem('currentFormData');
    if (savedData) {
        formData = JSON.parse(savedData);
        populateForm();
    }

    updateProgressBar();
    updateProgressBar();
    attachFormListeners();
    
    // Fix: Attach navigation event listeners
    document.getElementById('btnNext')?.addEventListener('click', nextStep);
    document.getElementById('btnPrev')?.addEventListener('click', previousStep);
    
    // Create toast container if not exists
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
});

// Toast notification helper
function showToast(message, type = 'info', duration = 3000) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '' : type === 'error' ? '' : 'i'}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Sauvegarde automatique
function autoSaveForm() {
    collectFormData();
    localStorage.setItem('currentFormData', JSON.stringify(formData));
    
    // Afficher l'indicateur de sauvegarde
    const indicator = document.getElementById('autosaveIndicator');
    indicator.classList.add('show');
    setTimeout(() => indicator.classList.remove('show'), 2000);
}

// Collecter les donnees du formulaire
function collectFormData() {
    const form = document.getElementById('collectionForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.id) {
            formData[input.id] = input.value;
        }
    });
}

// Remplir le formulaire avec donnees sauvegardees
function populateForm() {
    Object.keys(formData).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = formData[key];
        }
    });
}

// Attacher les listeners d'auto-save et validation
function attachFormListeners() {
    const form = document.getElementById('collectionForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('change', autoSaveForm);
        input.addEventListener('blur', () => {
            autoSaveForm();
            validateField(input);
        });
        
        // Validation temps reel pour Phone/NAS
        if (input.id === 'phone' || input.id === 'nas') {
            input.addEventListener('input', (e) => formatInput(e.target));
        }
    });

    // Navigation via les cercles
    for (let i = 1; i <= 3; i++) {
        const circle = document.getElementById(`circle${i}`);
        if (circle) {
            circle.style.cursor = 'pointer';
            circle.addEventListener('click', () => {
                if (i < currentStep) {
                    currentStep = i;
                    updateDisplay();
                }
            });
        }
    }
}

function formatInput(input) {
    let value = input.value.replace(/\D/g, ''); // Garder chiffres
    if (input.id === 'phone') {
        // Format (555) 555-5555
        if (value.length > 6) value = `(${value.substring(0,3)}) ${value.substring(3,6)}-${value.substring(6,10)}`;
        else if (value.length > 3) value = `(${value.substring(0,3)}) ${value.substring(3)}`;
    } else if (input.id === 'nas') {
        // Format 123 456 789
        if (value.length > 6) value = `${value.substring(0,3)} ${value.substring(3,6)} ${value.substring(6,9)}`;
        else if (value.length > 3) value = `${value.substring(0,3)} ${value.substring(3)}`;
    }
    input.value = value;
}

function validateField(input) {
    // Remove previous states
    input.classList.remove('valid', 'invalid');
    
    if (input.required && !input.value.trim()) {
        input.classList.add('invalid');
        return false;
    } else if (input.value.trim()) {
        input.classList.add('valid');
        return true;
    }
    return true;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Enter or Right Arrow to go next (when not in textarea)
    if ((e.key === 'Enter' || e.key === 'ArrowRight') && e.target.tagName !== 'TEXTAREA') {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
            nextStep();
        }
    }
    // Left Arrow or Backspace (when not in input) to go back
    if (e.key === 'ArrowLeft' && currentStep > 1 && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        previousStep();
    }
    // Escape to close Emma chatbot if open
    if (e.key === 'Escape') {
        const emmaWindow = document.getElementById('emmaWindow');
        if (emmaWindow && emmaWindow.classList.contains('active')) {
            emmaWindow.classList.remove('active');
        }
    }
});

// Navigation entre etapes
function nextStep() {
    const btn = document.getElementById('btnNext');
    if (btn) btn.classList.add('loading');
    
    setTimeout(() => {
        if (validateStep(currentStep)) {
            if (currentStep === 3) {
                showSummary();
                currentStep++;
            } else if (currentStep < totalSteps) {
                currentStep++;
            }
            updateDisplay();
        }
        if (btn) btn.classList.remove('loading');
    }, 300);
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
    let firstInvalid = null;

    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.classList.remove('valid', 'invalid');
        
        if (!field.value.trim()) {
            field.classList.add('invalid');
            isValid = false;
            if (!firstInvalid) firstInvalid = field;
        } else {
            field.classList.add('valid');
        }
    });

    if (!isValid && firstInvalid) {
        showToast('Veuillez remplir tous les champs requis', 'error');
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
}

// Afficher le recapitulatif
function showSummary() {
    collectFormData();
    
    const summaryHtml = `
        <div class="summary-section">
            <h3> Identite</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-item-label">Prenom</div>
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
                    <div class="summary-item-label">Telephone</div>
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
            <h3> Situation Personnelle</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-item-label">Etat Civil</div>
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
            <h3> Situation Financiere</h3>
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
                    <div class="summary-item-label">Tolerance au Risque</div>
                    <div class="summary-item-value">${formData.riskTolerance || '-'}</div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('summaryContent').innerHTML = summaryHtml;
}

// Mettre a jour l'affichage
function updateDisplay() {
    // Masquer toutes les etapes
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
    });

    // Afficher l'etape actuelle
    if (currentStep <= 3) {
        document.getElementById(`step${currentStep}`).classList.add('active');
    } else {
        document.getElementById('summary').classList.add('active');
        showToast('Recapitulatif pret - Verifiez vos informations', 'success');
    }

    updateProgressBar();
    updateNavigation();
    
    // Smooth scroll to top on step change
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mise a jour de la barre de progression
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

// Mise a jour de la navigation
function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'block';
    }

    if (currentStep >= totalSteps) {
        nextBtn.textContent = 'Termine ';
        nextBtn.disabled = true;
    } else {
        nextBtn.textContent = 'Suivant ->';
        nextBtn.disabled = false;
    }
}

// Export Excel
function exportToExcel() {
    collectFormData();

    // En-tetes
    const headers = [
        'Prenom', 'Nom', 'Email', 'Telephone', 'Adresse',
        'Etat Civil', 'Date de Naissance', 'NAS', 'Employeur', 'Poste',
        'Revenu Annuel', 'Actifs Immobiliers', 'Actifs Liquides',
        'Horizon de Placement', 'Tolerance au Risque'
    ];

    // Donnees
    const row = [
        formData.firstName, formData.lastName, formData.email, formData.phone, formData.address,
        formData.civilStatus, formData.birthdate, formData.nas, formData.employer, formData.jobTitle,
        formData.annualIncome, formData.realEstateValue, formData.liquidAssets,
        formData.investmentHorizon, formData.riskTolerance
    ];

    // Creer CSV
    let csv = headers.join('\t') + '\n' + row.join('\t');

    // Telecharger
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
    
            FORMULAIRE DE COLLECTE - ONBOARDING CLIENT      
    

    IDENTITE DU CLIENT
    
    Prenom:                    ${formData.firstName || '_'.repeat(30)}
    Nom:                       ${formData.lastName || '_'.repeat(30)}
    Email:                     ${formData.email || '_'.repeat(30)}
    Telephone:                 ${formData.phone || '_'.repeat(30)}
    Adresse:                   ${formData.address || '_'.repeat(30)}
    Ville:                     ${formData.city || '_'.repeat(30)}
    Province:                  ${formData.province || '_'.repeat(30)}
    Code Postal:               ${formData.postalCode || '_'.repeat(30)}

    SITUATION PERSONNELLE
    
    Etat Civil:                ${formData.civilStatus || '_'.repeat(30)}
    Date de Naissance:         ${formData.birthdate || '_'.repeat(30)}
    NAS:                       ${formData.nas || '_'.repeat(30)}
    Nombre d'Enfants:          ${formData.childrenCount || '_'.repeat(30)}
    Employeur:                 ${formData.employer || '_'.repeat(30)}
    Titre de Poste:            ${formData.jobTitle || '_'.repeat(30)}

    SITUATION FINANCIERE
    
    Revenu Annuel:             $ ${parseInt(formData.annualIncome || 0).toLocaleString('fr-CA')}
    Revenu Conjoint:           $ ${parseInt(formData.spouseIncome || 0).toLocaleString('fr-CA')}
    Valeur Immobiliere:        $ ${parseInt(formData.realEstateValue || 0).toLocaleString('fr-CA')}
    Actifs Liquides:           $ ${parseInt(formData.liquidAssets || 0).toLocaleString('fr-CA')}
    Horizon de Placement:      ${formData.investmentHorizon || '_'.repeat(30)}
    Tolerance au Risque:       ${formData.riskTolerance || '_'.repeat(30)}

    INFORMATIONS COMPTABLES
    
    Comptable (Nom):           ${formData.accountantName || '_'.repeat(30)}
    Comptable (Telephone):     ${formData.accountantPhone || '_'.repeat(30)}

    SIGNATURE DU CLIENT
    
    Signature: ___________________________     Date: ${new Date().toLocaleDateString('fr-CA')}

    Genere le: ${new Date().toLocaleString('fr-CA')}
    
    `;

    // Telecharger
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
    alert(' Formulaire exporte en texte.\n\nPour PDF avec mise en page, consultez l\'admin.');
}

// Nouveau client
function newClient() {
    if (confirm('Etes-vous sur? Cela effacera le formulaire actuel.')) {
        localStorage.removeItem('currentFormData');
        formData = {};
        document.getElementById('collectionForm').reset();
        currentStep = 1;
        updateDisplay();
    }
}

// Deconnexion
function logout() {
    if (confirm('Deconnexion?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentFormData');
        window.location.href = 'index.html';
    }
}