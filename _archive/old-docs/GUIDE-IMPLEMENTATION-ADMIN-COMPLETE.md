# 📋 Guide d'Implémentation - Interface Admin Complète

**Statut** : 75% complété
**Fichiers créés** : 3/4
**Reste à faire** : Étendre admin-jslai.html

---

## ✅ FICHIERS CRÉÉS

### 1. `supabase-emma-admin-complete.sql` ✅
- Table `emma_system_config` étendue
- Support complet: prompts CFA, intentions, briefings, variables, directives, routing
- Fonctions helper: `get_emma_config()`, `upsert_emma_config()`
- Vue `emma_active_configs`
- Versioning automatique
- **Action** : Exécuter dans Supabase SQL Editor

### 2. `migrate-emma-to-supabase.js` ✅
- Script de migration automatique
- Copie TOUS les prompts depuis fichiers → Supabase
- 6 sections migrées :
  - Prompts CFA (7 items)
  - Prompts Intentions (5 items)
  - Briefing Prompts (3 items)
  - Variables (5 items)
  - Directives (5 items)
  - Routing (3 items)
- **Action** : `node migrate-emma-to-supabase.js`

### 3. `lib/emma-config-loader.js` ✅
- Système de chargement avec override
- Architecture :
  1. Charge fichiers (source par défaut)
  2. Charge Supabase (overrides)
  3. Merge (overrides prioritaires)
  4. Cache (5 minutes)
- **Action** : Utilisé par emma-agent.js

---

## ⏸️ FICHIER À COMPLÉTER

### 4. `public/admin-jslai.html` (À ÉTENDRE)

**Tabs actuels** :
- 📝 Prompts Système (3 prompts basiques)
- ⚙️ Variables (4 variables)
- 🎯 Directives (2 directives)
- 🧭 Routage (2 configs)

**Tabs à ajouter/étendre** :

#### A. Étendre "📝 Prompts CFA"
Ajouter 4 nouveaux prompts :
```html
<!-- CFA Product Guidance -->
<div class="section-card bg-white rounded-lg shadow p-6">
    <h3 class="text-xl font-bold mb-4">Product Guidance</h3>
    <p class="text-sm text-gray-600 mb-4">Guidance par type de produit (ETF, Bonds, REIT, etc.)</p>
    <textarea
        id="prompt-cfa_product_guidance"
        class="w-full h-64 p-3 border rounded-lg code-editor resize-y"
    ></textarea>
    <button onclick="saveConfig('prompts', 'cfa_product_guidance', 'prompt-cfa_product_guidance')"
            class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
        💾 Sauvegarder
    </button>
</div>

<!-- CFA Perplexity Priority -->
<div class="section-card bg-white rounded-lg shadow p-6">
    <h3 class="text-xl font-bold mb-4">Perplexity Priority</h3>
    <p class="text-sm text-gray-600 mb-4">Priorité d'utilisation de Perplexity</p>
    <textarea
        id="prompt-cfa_perplexity_priority"
        class="w-full h-48 p-3 border rounded-lg code-editor resize-y"
    ></textarea>
    <button onclick="saveConfig('prompts', 'cfa_perplexity_priority', 'prompt-cfa_perplexity_priority')"
            class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
        💾 Sauvegarder
    </button>
</div>

<!-- CFA SMS Format -->
<div class="section-card bg-white rounded-lg shadow p-6">
    <h3 class="text-xl font-bold mb-4">SMS Format</h3>
    <p class="text-sm text-gray-600 mb-4">Format SMS optimisé pour analyses multi-parties</p>
    <textarea
        id="prompt-cfa_sms_format"
        class="w-full h-48 p-3 border rounded-lg code-editor resize-y"
    ></textarea>
    <button onclick="saveConfig('prompts', 'cfa_sms_format', 'prompt-cfa_sms_format')"
            class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
        💾 Sauvegarder
    </button>
</div>

<!-- CFA Quality Checklist -->
<div class="section-card bg-white rounded-lg shadow p-6">
    <h3 class="text-xl font-bold mb-4">Quality Checklist</h3>
    <p class="text-sm text-gray-600 mb-4">Checklist qualité avant envoi réponse</p>
    <textarea
        id="prompt-cfa_quality_checklist"
        class="w-full h-48 p-3 border rounded-lg code-editor resize-y"
    ></textarea>
    <button onclick="saveConfig('prompts', 'cfa_quality_checklist', 'prompt-cfa_quality_checklist')"
            class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
        💾 Sauvegarder
    </button>
</div>
```

#### B. Nouveau Tab "🎯 Prompts Intentions"
```html
<!-- Ajouter dans les tabs buttons (ligne 137) -->
<button class="tab-btn px-4 py-2 font-semibold text-gray-600 hover:text-blue-600" data-tab="intentions">
    🎯 Intentions
</button>

<!-- Ajouter le contenu du tab -->
<div id="intentions-tab" class="tab-content hidden">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Comprehensive Analysis -->
        <div class="section-card bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold mb-4">Comprehensive Analysis</h3>
            <p class="text-sm text-gray-600 mb-4">Prompt pour analyses complètes approfondies</p>
            <textarea
                id="prompt-intent_comprehensive_analysis"
                class="w-full h-64 p-3 border rounded-lg code-editor resize-y"
            ></textarea>
            <button onclick="saveConfig('prompts', 'intent_comprehensive_analysis', 'prompt-intent_comprehensive_analysis')"
                    class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
                💾 Sauvegarder
            </button>
        </div>

        <!-- Stock Price -->
        <div class="section-card bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold mb-4">Stock Price</h3>
            <p class="text-sm text-gray-600 mb-4">Prompt pour demandes de prix</p>
            <textarea
                id="prompt-intent_stock_price"
                class="w-full h-48 p-3 border rounded-lg code-editor resize-y"
            ></textarea>
            <button onclick="saveConfig('prompts', 'intent_stock_price', 'prompt-intent_stock_price')"
                    class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
                💾 Sauvegarder
            </button>
        </div>

        <!-- Fundamentals -->
        <div class="section-card bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold mb-4">Fundamentals</h3>
            <p class="text-sm text-gray-600 mb-4">Prompt pour ratios et fondamentaux</p>
            <textarea
                id="prompt-intent_fundamentals"
                class="w-full h-48 p-3 border rounded-lg code-editor resize-y"
            ></textarea>
            <button onclick="saveConfig('prompts', 'intent_fundamentals', 'prompt-intent_fundamentals')"
                    class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
                💾 Sauvegarder
            </button>
        </div>

        <!-- News -->
        <div class="section-card bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold mb-4">News</h3>
            <p class="text-sm text-gray-600 mb-4">Prompt pour actualités financières</p>
            <textarea
                id="prompt-intent_news"
                class="w-full h-48 p-3 border rounded-lg code-editor resize-y"
            ></textarea>
            <button onclick="saveConfig('prompts', 'intent_news', 'prompt-intent_news')"
                    class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
                💾 Sauvegarder
            </button>
        </div>

        <!-- Comparative Analysis -->
        <div class="section-card bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h3 class="text-xl font-bold mb-4">Comparative Analysis</h3>
            <p class="text-sm text-gray-600 mb-4">Prompt pour comparaisons entre tickers</p>
            <textarea
                id="prompt-intent_comparative_analysis"
                class="w-full h-64 p-3 border rounded-lg code-editor resize-y"
            ></textarea>
            <button onclick="saveConfig('prompts', 'intent_comparative_analysis', 'prompt-intent_comparative_analysis')"
                    class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
                💾 Sauvegarder
            </button>
        </div>
    </div>
</div>
```

#### C. Nouveau Tab "📧 Briefings"
```html
<!-- Ajouter dans les tabs buttons -->
<button class="tab-btn px-4 py-2 font-semibold text-gray-600 hover:text-blue-600" data-tab="briefings">
    📧 Briefings
</button>

<!-- Ajouter le contenu du tab -->
<div id="briefings-tab" class="tab-content hidden">
    <div class="grid grid-cols-1 gap-6">
        <!-- Morning Briefing -->
        <div class="section-card bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold mb-4">☀️ Briefing Matinal (7h20)</h3>
            <p class="text-sm text-gray-600 mb-4">Configuration du briefing matinal</p>
            <textarea
                id="prompt-briefing_morning"
                class="w-full h-96 p-3 border rounded-lg code-editor resize-y font-mono text-sm"
                placeholder='{"prompt": "...", "schedule": "...", ...}'
            ></textarea>
            <button onclick="saveConfig('prompts', 'briefing_morning', 'prompt-briefing_morning', 'json')"
                    class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
                💾 Sauvegarder
            </button>
        </div>

        <!-- Midday Briefing -->
        <div class="section-card bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold mb-4">🌤️ Briefing Midi (11h50)</h3>
            <p class="text-sm text-gray-600 mb-4">Configuration du briefing de midi</p>
            <textarea
                id="prompt-briefing_midday"
                class="w-full h-96 p-3 border rounded-lg code-editor resize-y font-mono text-sm"
                placeholder='{"prompt": "...", "schedule": "...", ...}'
            ></textarea>
            <button onclick="saveConfig('prompts', 'briefing_midday', 'prompt-briefing_midday', 'json')"
                    class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
                💾 Sauvegarder
            </button>
        </div>

        <!-- Evening Briefing -->
        <div class="section-card bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold mb-4">🌙 Briefing Soir (16h20)</h3>
            <p class="text-sm text-gray-600 mb-4">Configuration du briefing du soir</p>
            <textarea
                id="prompt-briefing_evening"
                class="w-full h-96 p-3 border rounded-lg code-editor resize-y font-mono text-sm"
                placeholder='{"prompt": "...", "schedule": "...", ...}'
            ></textarea>
            <button onclick="saveConfig('prompts', 'briefing_evening', 'prompt-briefing_evening', 'json')"
                    class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
                💾 Sauvegarder
            </button>
        </div>
    </div>
</div>
```

#### D. Mettre à jour `populateForm()` (ligne 388)
Ajouter chargement des nouveaux prompts :
```javascript
function populateForm(config) {
    // Prompts CFA existants
    if (config.prompts) {
        if (config.prompts.cfa_identity?.value) {
            document.getElementById('prompt-cfa_identity').value = config.prompts.cfa_identity.value;
        }
        if (config.prompts.cfa_standards?.value) {
            document.getElementById('prompt-cfa_standards').value = config.prompts.cfa_standards.value;
        }
        if (config.prompts.cfa_output_format?.value) {
            document.getElementById('prompt-cfa_output_format').value = config.prompts.cfa_output_format.value;
        }
        // NOUVEAUX PROMPTS CFA
        if (config.prompts.cfa_product_guidance?.value) {
            document.getElementById('prompt-cfa_product_guidance').value = config.prompts.cfa_product_guidance.value;
        }
        if (config.prompts.cfa_perplexity_priority?.value) {
            document.getElementById('prompt-cfa_perplexity_priority').value = config.prompts.cfa_perplexity_priority.value;
        }
        if (config.prompts.cfa_sms_format?.value) {
            document.getElementById('prompt-cfa_sms_format').value = config.prompts.cfa_sms_format.value;
        }
        if (config.prompts.cfa_quality_checklist?.value) {
            document.getElementById('prompt-cfa_quality_checklist').value = config.prompts.cfa_quality_checklist.value;
        }

        // PROMPTS INTENTIONS
        if (config.prompts.intent_comprehensive_analysis?.value) {
            document.getElementById('prompt-intent_comprehensive_analysis').value = config.prompts.intent_comprehensive_analysis.value;
        }
        if (config.prompts.intent_stock_price?.value) {
            document.getElementById('prompt-intent_stock_price').value = config.prompts.intent_stock_price.value;
        }
        if (config.prompts.intent_fundamentals?.value) {
            document.getElementById('prompt-intent_fundamentals').value = config.prompts.intent_fundamentals.value;
        }
        if (config.prompts.intent_news?.value) {
            document.getElementById('prompt-intent_news').value = config.prompts.intent_news.value;
        }
        if (config.prompts.intent_comparative_analysis?.value) {
            document.getElementById('prompt-intent_comparative_analysis').value = config.prompts.intent_comparative_analysis.value;
        }

        // BRIEFINGS
        if (config.prompts.briefing_morning?.value) {
            document.getElementById('prompt-briefing_morning').value =
                typeof config.prompts.briefing_morning.value === 'object'
                    ? JSON.stringify(config.prompts.briefing_morning.value, null, 2)
                    : config.prompts.briefing_morning.value;
        }
        if (config.prompts.briefing_midday?.value) {
            document.getElementById('prompt-briefing_midday').value =
                typeof config.prompts.briefing_midday.value === 'object'
                    ? JSON.stringify(config.prompts.briefing_midday.value, null, 2)
                    : config.prompts.briefing_midday.value;
        }
        if (config.prompts.briefing_evening?.value) {
            document.getElementById('prompt-briefing_evening').value =
                typeof config.prompts.briefing_evening.value === 'object'
                    ? JSON.stringify(config.prompts.briefing_evening.value, null, 2)
                    : config.prompts.briefing_evening.value;
        }
    }

    // Variables, Directives, Routing (inchangés)
    // ...
}
```

---

## 📝 ORDRE D'EXÉCUTION

### 1. Supabase Setup (5 min)
```bash
# Dans Supabase SQL Editor
# Copier-coller supabase-emma-admin-complete.sql
# Cliquer "Run"
```

### 2. Migration Données (2 min)
```bash
node migrate-emma-to-supabase.js
```

### 3. Étendre Interface Admin (30 min)
- Ouvrir `public/admin-jslai.html`
- Ajouter les nouveaux prompts CFA (section A)
- Ajouter tab "Intentions" (section B)
- Ajouter tab "Briefings" (section C)
- Mettre à jour `populateForm()` (section D)

### 4. Modifier emma-agent.js (voir fichier séparé)
Utiliser `EmmaConfigLoader` au lieu des imports directs.

---

## 🎯 RÉSULTAT FINAL

Interface admin avec **7 onglets** :
1. 📝 Prompts CFA (7 prompts)
2. 🎯 Prompts Intentions (5 prompts)
3. 📧 Briefings (3 configs JSON)
4. ⚙️ Variables (5 vars)
5. 🎯 Directives (5 directives)
6. 🧭 Routage (3 configs)

**Total** : 28 configurations modifiables via interface

---

## ✅ CHECKLIST

- [x] SQL Supabase créé
- [x] Script migration créé
- [x] Config loader créé
- [ ] Interface admin étendue
- [ ] emma-agent.js modifié
- [ ] Tests complets
- [ ] Documentation utilisateur

---

**Temps estimé pour finir** : ~1-2 heures
**Difficulté** : ⭐⭐ Moyenne (principalement HTML/JS)
