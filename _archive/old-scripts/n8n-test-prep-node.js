// ═══════════════════════════════════════════════════════════
// 🔄 TEST EMAIL PREP NODE
// ═══════════════════════════════════════════════════════════
// Ce nœud adapte la sortie du LLM Chain pour qu'elle soit
// compatible avec le node "Generate HTML Newsletter" existant.
// Pas de duplication de code - réutilisation du pipeline!
// ═══════════════════════════════════════════════════════════

const items = $input.all();
const data = items[0].json;

console.log('🔄 Test Email Prep - Formatting LLM output for email pipeline');

// ═══════════════════════════════════════════════════════════
// RÉCUPÉRATION DU CONTENU LLM
// ═══════════════════════════════════════════════════════════
let content = '';

if (data.output) {
  // LangChain LLM Chain output
  content = data.output;
} else if (data.text) {
  // Alternative text field
  content = data.text;
} else if (data.response) {
  content = data.response;
} else if (data.message) {
  content = data.message;
} else {
  content = 'Aucun contenu trouvé dans la réponse LLM';
}

console.log('📝 Content extracted, length:', content.length);

// ═══════════════════════════════════════════════════════════
// FORMATAGE POUR "Generate HTML Newsletter"
// ═══════════════════════════════════════════════════════════
// Ce node attend ces champs:
// - newsletter_content: le contenu markdown
// - trigger_type: type de déclencheur
// - emma_model: modèle IA utilisé
// - emma_tools: array d'outils (optionnel)
// - emma_execution_time: temps d'exécution (optionnel)
// - prompt_type: type de prompt
// - tickers: liste de tickers (optionnel)
// - preview_mode: false pour envoyer
// - approved: true pour envoyer

return [{
  json: {
    // Contenu principal
    newsletter_content: content,

    // Métadonnées pour l'email
    trigger_type: '🧪 Test Chat',
    emma_model: 'gemini-langchain',
    emma_tools: ['langchain', 'chat'],
    emma_execution_time: 0,
    prompt_type: 'test',

    // Pas de tickers pour test
    tickers: '',

    // Configuration d'envoi
    preview_mode: false,  // ⚠️ false = envoi activé
    approved: true,       // ⚠️ true = approuvé pour envoi
    test_mode: true,

    // Destinataire pour test
    recipients: ['projetsjsl@gmail.com'],

    // Timestamp
    generated_at: new Date().toISOString(),

    // Debug
    _debug_source: 'test-prep-node',
    _debug_original_data: data
  }
}];
