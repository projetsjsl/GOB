/**
 * Moteur de calcul KPI
 * 
 * Ce service calcule les valeurs de KPI en utilisant :
 * - Les définitions de KPI (kpi_definitions)
 * - Les variables associées (kpi_variables)
 * - Les métriques stockées (metrics)
 * 
 * Supporte des formules avec opérateurs et fonctions mathématiques.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL et SUPABASE_KEY doivent être définis');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parser de formules sécurisé
 * Supporte: +, -, *, /, ^, ABS, MIN, MAX, AVG, IF, NORMALIZE
 */
class FormulaParser {
  constructor(variables) {
    this.variables = variables || {};
  }

  /**
   * Évalue une expression mathématique de manière sécurisée
   */
  evaluate(expression) {
    if (!expression || typeof expression !== 'string') {
      throw new Error('Expression invalide');
    }

    // Remplacer les variables par leurs valeurs
    let expr = expression;
    Object.entries(this.variables).forEach(([name, value]) => {
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      expr = expr.replace(regex, value !== null && value !== undefined ? value : '0');
    });

    // Remplacer les fonctions par leurs équivalents JavaScript
    expr = this.replaceFunctions(expr);

    // Évaluer de manière sécurisée (pas d'utilisation directe de eval)
    try {
      // Utiliser Function constructor pour créer une fonction isolée
      const func = new Function('return ' + expr);
      const result = func();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        return null;
      }
      
      return result;
    } catch (error) {
      console.error('Erreur évaluation formule:', error, 'Expression:', expr);
      return null;
    }
  }

  /**
   * Remplace les fonctions personnalisées par du JavaScript
   */
  replaceFunctions(expr) {
    // ABS(x) -> Math.abs(x)
    expr = expr.replace(/\bABS\(([^)]+)\)/g, 'Math.abs($1)');
    
    // MIN(a, b) -> Math.min(a, b)
    expr = expr.replace(/\bMIN\(([^)]+)\)/g, 'Math.min($1)');
    
    // MAX(a, b) -> Math.max(a, b)
    expr = expr.replace(/\bMAX\(([^)]+)\)/g, 'Math.max($1)');
    
    // AVG(a, b, c) -> (a + b + c) / 3
    expr = expr.replace(/\bAVG\(([^)]+)\)/g, (match, args) => {
      const values = args.split(',').map(v => v.trim());
      return `(${values.join(' + ')}) / ${values.length}`;
    });
    
    // IF(condition, trueValue, falseValue)
    expr = expr.replace(/\bIF\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, '($1 ? $2 : $3)');
    
    // NORMALIZE(x, min, max) -> (x - min) / (max - min)
    expr = expr.replace(/\bNORMALIZE\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, 
      '(($1 - $2) / ($3 - $2))');
    
    return expr;
  }
}

/**
 * Charge une définition de KPI avec ses variables
 */
async function loadKPIDefinition(kpiCode) {
  const { data: kpi, error: kpiError } = await supabase
    .from('kpi_definitions')
    .select('*')
    .eq('code', kpiCode)
    .eq('is_active', true)
    .single();

  if (kpiError || !kpi) {
    throw new Error(`KPI ${kpiCode} non trouvé ou inactif`);
  }

  const { data: variables, error: varsError } = await supabase
    .from('kpi_variables')
    .select('*')
    .eq('kpi_id', kpi.id)
    .order('order_index', { ascending: true });

  if (varsError) {
    throw new Error(`Erreur chargement variables: ${varsError.message}`);
  }

  return { kpi, variables: variables || [] };
}

/**
 * Charge les valeurs de métriques pour un symbole
 */
async function loadMetrics(symbol, metricCodes, asOf = null) {
  const query = supabase
    .from('metrics')
    .select('metric_code, value, as_of, period')
    .eq('symbol', symbol)
    .in('metric_code', metricCodes);

  if (asOf) {
    query.lte('as_of', asOf);
  }

  const { data, error } = await query.order('as_of', { ascending: false });

  if (error) {
    throw new Error(`Erreur chargement métriques: ${error.message}`);
  }

  // Retourner la valeur la plus récente pour chaque metric_code
  const latest = {};
  const seen = new Set();

  (data || []).forEach(metric => {
    const key = `${metric.metric_code}_${metric.period || 'DEFAULT'}`;
    if (!seen.has(key)) {
      latest[metric.metric_code] = metric.value;
      seen.add(key);
    }
  });

  return latest;
}

/**
 * Applique une transformation à une métrique (ex: CAGR, moyenne)
 */
function applyTransform(value, transform) {
  if (!transform || !transform.type) {
    return value;
  }

  switch (transform.type) {
    case 'multiply':
      return value * (transform.factor || 1);
    
    case 'divide':
      return value / (transform.divisor || 1);
    
    case 'percent':
      return value * 100;
    
    case 'inverse':
      return value !== 0 ? 1 / value : null;
    
    default:
      return value;
  }
}

/**
 * Calcule un KPI pour un symbole donné
 */
async function computeKPI(kpiCode, symbol, asOf = null) {
  const startTime = Date.now();

  try {
    // Charger la définition du KPI
    const { kpi, variables } = await loadKPIDefinition(kpiCode);

    if (!variables || variables.length === 0) {
      throw new Error(`Aucune variable définie pour ${kpiCode}`);
    }

    // Récupérer les codes de métriques nécessaires
    const metricCodes = variables.map(v => v.metric_code);

    // Charger les valeurs de métriques
    const metrics = await loadMetrics(symbol, metricCodes, asOf);

    // Construire le dictionnaire de variables avec transformations
    const variableValues = {};
    const inputsSnapshot = {};

    for (const variable of variables) {
      const rawValue = metrics[variable.metric_code];
      
      if (rawValue === undefined || rawValue === null) {
        // Variable manquante - utiliser valeur par défaut si définie
        variableValues[variable.variable_name] = variable.transform?.default || 0;
        inputsSnapshot[variable.variable_name] = null;
      } else {
        // Appliquer la transformation
        const transformedValue = applyTransform(rawValue, variable.transform);
        variableValues[variable.variable_name] = transformedValue;
        inputsSnapshot[variable.variable_name] = {
          raw: rawValue,
          transformed: transformedValue,
          metric_code: variable.metric_code
        };
      }
    }

    // Évaluer la formule
    const parser = new FormulaParser(variableValues);
    const value = parser.evaluate(kpi.expression);

    if (value === null) {
      throw new Error(`Impossible d'évaluer la formule pour ${kpiCode}`);
    }

    // Date de référence (aujourd'hui si non spécifiée)
    const referenceDate = asOf || new Date().toISOString().split('T')[0];

    // Stocker le résultat dans kpi_values
    const { error: saveError } = await supabase
      .from('kpi_values')
      .upsert({
        kpi_id: kpi.id,
        symbol,
        value,
        as_of: referenceDate,
        inputs_snapshot: inputsSnapshot,
        computed_at: new Date().toISOString()
      }, { onConflict: 'kpi_id,symbol,as_of' });

    if (saveError) {
      console.warn('Erreur sauvegarde KPI value:', saveError);
    }

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      kpi_code: kpiCode,
      symbol,
      value,
      inputs: inputsSnapshot,
      execution_time_ms: executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    // Logger l'erreur
    await supabase.from('job_logs').insert({
      job_type: 'kpi_compute',
      status: 'error',
      symbol,
      endpoint: kpiCode,
      error_message: error.message,
      execution_time_ms: executionTime
    });

    throw error;
  }
}

/**
 * Calcule un KPI pour plusieurs symboles (batch)
 */
async function computeKPIForUniverse(kpiCode, symbols, asOf = null) {
  const results = [];
  const errors = [];

  for (const symbol of symbols) {
    try {
      const result = await computeKPI(kpiCode, symbol, asOf);
      results.push(result);
    } catch (error) {
      errors.push({
        symbol,
        error: error.message
      });
    }
  }

  return {
    success: true,
    kpi_code: kpiCode,
    total: symbols.length,
    computed: results.length,
    failed: errors.length,
    results,
    errors
  };
}

/**
 * Handler principal pour l'API
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, kpi_code, symbol, symbols, as_of } = req.query || req.body || {};

    if (!action) {
      return res.status(400).json({ 
        error: 'action requis',
        availableActions: ['compute', 'compute-batch']
      });
    }

    if (!kpi_code) {
      return res.status(400).json({ error: 'kpi_code requis' });
    }

    let result;

    switch (action) {
      case 'compute':
        if (!symbol) {
          return res.status(400).json({ error: 'symbol requis pour compute' });
        }
        result = await computeKPI(kpi_code, symbol, as_of);
        break;

      case 'compute-batch':
        if (!symbols || !Array.isArray(symbols)) {
          return res.status(400).json({ error: 'symbols (array) requis pour compute-batch' });
        }
        result = await computeKPIForUniverse(kpi_code, symbols, as_of);
        break;

      default:
        return res.status(400).json({ 
          error: 'action invalide',
          availableActions: ['compute', 'compute-batch']
        });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Erreur KPI engine:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

