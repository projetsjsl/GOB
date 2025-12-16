// lib/llm-registry.js

/**
 * LLM Registry
 * Provides functions to access LLM model configurations stored in Supabase.
 * Supports fetching all models, getting a model by name, and updating model settings.
 */

import { configManager } from './config-manager.js';
import { createSupabaseClient } from './supabase-config.js';

const DEFAULT_MODELS = [
    // Perplexity Models
    { provider: 'perplexity', model_id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', max_tokens: 2000, temperature: 0.1, enabled: true },
    { provider: 'perplexity', model_id: 'sonar-reasoning', name: 'Sonar Reasoning', max_tokens: 1500, temperature: 0.1, enabled: true },
    { provider: 'perplexity', model_id: 'sonar-pro', name: 'Sonar Pro', max_tokens: 1000, temperature: 0.1, enabled: true },
    { provider: 'perplexity', model_id: 'sonar', name: 'Sonar', max_tokens: 800, temperature: 0.1, enabled: true },
    
    // Gemini Models
    { provider: 'google', model_id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', max_tokens: 4096, temperature: 0.7, enabled: true },
    
    // OpenAI Models
    { provider: 'openai', model_id: 'gpt-4o', name: 'GPT-4o', max_tokens: 4096, temperature: 0.7, enabled: true }
];

let supabase = null;

/** Initialize Supabase client */
async function init() {
  if (!supabase) {
    supabase = createSupabaseClient();
    // Ensure config manager is ready (loads any overrides)
    await configManager.initialize();
  }
}

/** Fetch all LLM model entries */
export async function getAllModels() {
  await init();
  const { data, error } = await supabase
    .from('emma_llm_models')
    .select('*');
  if (error) {
    console.error('❌ Failed to fetch LLM models:', error.message);
    return DEFAULT_MODELS;
  }
  return data && data.length > 0 ? data : DEFAULT_MODELS;
}

/** Get a model by its identifier */
export async function getModelById(id) {
  const models = await getAllModels();
  return models.find(m => m.id === id);
}

/** Update a model's configuration */
export async function updateModel(id, updates) {
  await init();
  const { data, error } = await supabase
    .from('emma_llm_models')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) {
    console.error('❌ Failed to update model:', error.message);
    return null;
  }
  return data[0];
}

/** Add a new model */
export async function addModel(model) {
  await init();
  const { data, error } = await supabase
    .from('emma_llm_models')
    .insert([model])
    .select();
  if (error) {
    console.error('❌ Failed to add model:', error.message);
    return null;
  }
  return data[0];
}

/** Delete a model */
export async function deleteModel(id) {
  await init();
  const { error } = await supabase
    .from('emma_llm_models')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('❌ Failed to delete model:', error.message);
    return false;
  }
  return true;
}
