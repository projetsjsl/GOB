// api/llm-models.js

/**
 * API endpoint for managing LLM model registry entries.
 * Supports GET (list or single), POST (create), PUT (update), DELETE (remove).
 * Uses the lib/llm-registry.js helper functions which interact with Supabase.
 */

import { getAllModels, getModelById, addModel, updateModel, deleteModel } from '../lib/llm-registry.js';

export default async function handler(req, res) {
  // Enable CORS for simplicity
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      if (id) {
        const model = await getModelById(id);
        if (!model) return res.status(404).json({ error: 'Model not found' });
        return res.status(200).json(model);
      }
      const models = await getAllModels();
      return res.status(200).json(models);
    }

    if (req.method === 'POST') {
      const model = await addModel(req.body);
      return res.status(201).json(model);
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id for update' });
      const updated = await updateModel(id, updates);
      if (!updated) return res.status(404).json({ error: 'Model not found' });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id for delete' });
      const success = await deleteModel(id);
      if (!success) return res.status(404).json({ error: 'Model not found' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ LLM models API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
