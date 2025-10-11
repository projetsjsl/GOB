// ========================================
// /api/gemini/chat - Function Calling (boucle minimale)
// ========================================

import { functionDeclarations, executeFunction } from '../../lib/gemini/functions.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS basique
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Clé API Gemini manquante' });

  try {
    let { messages = [], temperature = 0.3, maxTokens = 4096, systemPrompt, message } = req.body || {};

    // Compatibilité: accepter payload simple { message: "..." }
    if ((!Array.isArray(messages) || messages.length === 0) && typeof message === 'string' && message.trim()) {
      messages = [{ role: 'user', content: message.trim() }];
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages requis (array) ou message (string)' });
    }

    // Convertir messages UI -> contents Gemini
    const contents = [];
    // Instruction système forte (outil d'abord, pas d'exemples)
    const toolSystemPrompt = [
      'Règles d\'analyse financière (prioritaires) :',
      '- Utilise TOUJOURS les fonctions disponibles pour extraire des données réelles (prix, news, etc.).',
      "- N\'utilise PAS de chiffres \"à titre d\'exemple\" ou fictifs.",
      '- Si une donnée est indisponible, explique-le clairement et propose une alternative (ex.: demander le ticker exact).',
      '- Réponds en français, concis, avec chiffres réels quand disponibles.'
    ].join('\n');
    contents.push({ role: 'user', parts: [{ text: toolSystemPrompt }] });
    if (systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
    }
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: String(m.content || '') }] });
    }

    // Utiliser le SDK officiel pour robustesse long terme
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp', tools: { functionDeclarations } });
    const initialResult = await model.generateContent({
      contents,
      generationConfig: {
        temperature,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: maxTokens,
        candidateCount: 1
      }
    });
    const initialData = initialResult.response;

    // Détecter un éventuel function call
    // Le SDK renvoie un objet response; on récupère les parts et potentiels functionCall
    const candidateParts = initialData.candidates?.[0]?.content?.parts || initialData.parts || [];
    const fc = candidateParts.find(p => p?.functionCall && p.functionCall.name);

    if (!fc) {
      // Pas de function call: renvoyer simplement le texte
      const text = candidateParts?.[0]?.text || initialData.text || '';
      return res.status(200).json({ response: text, source: 'gemini', functionCalled: false });
    }

    // Exécuter la fonction demandée
    const fnName = fc.functionCall.name;
    const fnArgs = fc.functionCall.args || {};
    let fnResult;
    try {
      fnResult = await executeFunction(fnName, fnArgs);
    } catch (e) {
      fnResult = { error: String(e?.message || e) };
    }

    // Envoyer le résultat de fonction à Gemini pour finaliser la réponse
    const followUpResult = await model.generateContent({
      contents: [
        ...contents,
        { role: 'model', parts: [fc] },
        { role: 'user', parts: [{ functionResponse: { name: fnName, response: fnResult } }] }
      ],
      generationConfig: {
        temperature,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: maxTokens,
        candidateCount: 1
      }
    });
    const text = followUpResult?.response?.candidates?.[0]?.content?.parts?.[0]?.text || followUpResult?.response?.text || '';

    return res.status(200).json({ response: text, functionCalled: true, functionName: fnName, functionResult: fnResult, source: 'gemini+fc' });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur', details: String(e?.message || e) });
  }
}


