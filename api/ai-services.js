// ============================================================================
// AI SERVICES API - Service unifié pour tous les fournisseurs d'IA
// Supporte Gemini, ChatGPT, et Perplexity avec fallback automatique
// ============================================================================
//
// 🛡️  GUARDRAILS DE PROTECTION - CONFIGURATION CRITIQUE 🛡️
// ============================================================================
// ⚠️  ATTENTION : Ce fichier contient la logique de fallback entre les services IA
// ⚠️  Toute modification peut casser le système de fallback
// ⚠️  Toujours tester en local avant de déployer
//
// ✅ CONFIGURATION VALIDÉE :
// - Support: Gemini, ChatGPT, Perplexity
// - Fallback automatique en cas d'échec
// - Configuration par priorité
// - Gestion des erreurs robuste
//
// 🔒 VARIABLES D'ENVIRONNEMENT REQUISES :
// - GEMINI_API_KEY (AI...) : ✅ Configurée
// - OPENAI_API_KEY (sk-...) : ✅ Configurée
// - PERPLEXITY_API_KEY (pplx-...) : ✅ Configurée
//
// 📚 Référence : Architecture de fallback multi-fournisseurs
// ============================================================================

export default async function handler(req, res) {
  // CORS basique
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const { 
      message, 
      context = {}, 
      preferred_provider = 'auto',
      use_functions = false,
      max_retries = 3
    } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    console.log('🤖 AI Services: Processing request');
    console.log('📝 Message:', message.substring(0, 100) + '...');
    console.log('🎯 Preferred provider:', preferred_provider);
    console.log('🛠️ Use functions:', use_functions);

    // Définir l'ordre de priorité des fournisseurs
    const providers = getProviderPriority(preferred_provider, use_functions);
    console.log('📋 Provider priority:', providers);

    let lastError = null;
    let attempts = 0;

    // Essayer chaque fournisseur dans l'ordre de priorité
    for (const provider of providers) {
      attempts++;
      console.log(`🔄 Tentative ${attempts}/${max_retries} avec ${provider.name}`);

      try {
        const result = await callProvider(provider, message, context, use_functions);
        
        if (result.success) {
          console.log(`✅ Succès avec ${provider.name}`);
          return res.status(200).json({
            ...result,
            provider_used: provider.name,
            attempts: attempts,
            fallback_used: attempts > 1
          });
        } else {
          console.warn(`⚠️ Échec avec ${provider.name}:`, result.error);
          lastError = result.error;
        }
      } catch (error) {
        console.error(`❌ Erreur avec ${provider.name}:`, error.message);
        lastError = error.message;
      }

      // Si on a atteint le maximum de tentatives, arrêter
      if (attempts >= max_retries) {
        break;
      }
    }

    // Si tous les fournisseurs ont échoué
    console.error('❌ Tous les fournisseurs IA ont échoué');
    return res.status(500).json({
      success: false,
      error: 'Tous les services IA sont temporairement indisponibles',
      last_error: lastError,
      providers_tried: providers.slice(0, attempts).map(p => p.name),
      attempts: attempts,
      suggestions: [
        'Réessayez dans quelques instants',
        'Vérifiez votre connexion internet',
        'Si le problème persiste, contactez le support'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur dans AI Services:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      technical: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Détermine l'ordre de priorité des fournisseurs IA
 */
function getProviderPriority(preferredProvider, useFunctions) {
  const baseProviders = [
    {
      name: 'gemini',
      available: !!process.env.GEMINI_API_KEY,
      supports_functions: true,
      priority: 1
    },
    {
      name: 'chatgpt',
      available: !!process.env.OPENAI_API_KEY,
      supports_functions: true,
      priority: 2
    },
    {
      name: 'perplexity',
      available: !!process.env.PERPLEXITY_API_KEY,
      supports_functions: false,
      priority: 3
    }
  ];

  // Filtrer les fournisseurs disponibles
  const availableProviders = baseProviders.filter(p => p.available);

  // Si un fournisseur spécifique est demandé, le mettre en priorité
  if (preferredProvider !== 'auto') {
    const preferred = availableProviders.find(p => p.name === preferredProvider);
    if (preferred) {
      return [preferred, ...availableProviders.filter(p => p.name !== preferredProvider)];
    }
  }

  // Si functions requis, privilégier les fournisseurs qui les supportent
  if (useFunctions) {
    const functionProviders = availableProviders.filter(p => p.supports_functions);
    const nonFunctionProviders = availableProviders.filter(p => !p.supports_functions);
    return [...functionProviders, ...nonFunctionProviders];
  }

  // Ordre par défaut basé sur la priorité
  return availableProviders.sort((a, b) => a.priority - b.priority);
}

/**
 * Appelle un fournisseur IA spécifique
 */
async function callProvider(provider, message, context, useFunctions) {
  const startTime = Date.now();

  try {
    let response;
    let endpoint;

    switch (provider.name) {
      case 'gemini':
        endpoint = useFunctions ? '/api/gemini/chat.js' : '/api/gemini/chat.js';
        response = await callInternalAPI(endpoint, {
          message,
          context,
          temperature: context.temperature || 0.7,
          maxTokens: context.maxTokens || 4096
        });
        break;

      case 'chatgpt':
        endpoint = useFunctions ? '/api/chatgpt/tools.js' : '/api/chatgpt/chat.js';
        response = await callInternalAPI(endpoint, {
          messages: [{ role: 'user', content: message }],
          context,
          temperature: context.temperature || 0.7,
          maxTokens: context.maxTokens || 4096,
          systemPrompt: context.systemPrompt
        });
        break;

      case 'perplexity':
        response = await callPerplexityAPI(message, context);
        break;

      default:
        throw new Error(`Fournisseur non supporté: ${provider.name}`);
    }

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      response: response.response || response,
      source: response.source || provider.name,
      provider: provider.name,
      execution_time_ms: executionTime,
      usage: response.usage || null,
      functions_executed: response.functions_executed || [],
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Erreur avec ${provider.name}:`, error.message);

    return {
      success: false,
      error: error.message,
      provider: provider.name,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Appelle une API interne du projet
 */
async function callInternalAPI(endpoint, payload) {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API ${endpoint} error: ${response.status} - ${errorData.error || response.statusText}`);
  }

  return await response.json();
}

/**
 * Appelle directement l'API Perplexity
 */
async function callPerplexityAPI(message, context) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: context.systemPrompt || 'Tu es Emma, une assistante financière experte. Réponds toujours en français de manière professionnelle et accessible.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: context.maxTokens || 1000,
      temperature: context.temperature || 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Perplexity API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    response: data.choices[0].message.content,
    source: 'perplexity',
    usage: data.usage
  };
}