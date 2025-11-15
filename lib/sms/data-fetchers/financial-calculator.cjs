/**
 * Financial Calculator
 *
 * Module de calculs financiers PURS (pas de LLM).
 * Ce module est une SOURCE DE VÉRITÉ pour les calculs.
 *
 * Calculs supportés:
 * - Prêt hypothécaire/immobilier
 * - Variation de prix (%)
 * - Ratios financiers (P/E, etc.)
 */

/**
 * Calcule le paiement mensuel d'un prêt
 * @param {number} principal - Montant du prêt
 * @param {number} annualRate - Taux annuel (ex: 4.9 pour 4.9%)
 * @param {number} years - Durée en années
 * @returns {Object} { monthlyPayment, totalPayment, totalInterest, breakdown }
 */
function calculateLoan(principal, annualRate, years) {
  // Validation
  if (!principal || principal <= 0) {
    throw new Error('Montant du prêt invalide');
  }
  if (!annualRate || annualRate < 0) {
    throw new Error('Taux d\'intérêt invalide');
  }
  if (!years || years <= 0) {
    throw new Error('Durée invalide');
  }

  // Calcul
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;

  let monthlyPayment;
  if (monthlyRate === 0) {
    // Cas spécial: taux 0%
    monthlyPayment = principal / numPayments;
  } else {
    // Formule standard du paiement hypothécaire
    monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - principal;

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    principal,
    annualRate,
    years,
    breakdown: {
      numPayments,
      monthlyRate: Math.round(monthlyRate * 100000) / 100000,
    },
  };
}

/**
 * Calcule la variation en pourcentage
 * @param {number} from - Valeur initiale
 * @param {number} to - Valeur finale
 * @returns {Object} { change, changePercent, direction }
 */
function calculateVariation(from, to) {
  // Validation
  if (typeof from !== 'number' || typeof to !== 'number') {
    throw new Error('Valeurs invalides pour le calcul de variation');
  }
  if (from === 0) {
    throw new Error('La valeur initiale ne peut pas être 0');
  }

  const change = to - from;
  const changePercent = (change / from) * 100;
  const direction = change > 0 ? 'hausse' : change < 0 ? 'baisse' : 'stable';

  return {
    from,
    to,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    direction,
  };
}

/**
 * Calcule le ratio P/E (Price-to-Earnings)
 * @param {number} price - Prix de l'action
 * @param {number} earnings - Bénéfice par action (EPS)
 * @returns {Object} { pe, interpretation }
 */
function calculatePE(price, earnings) {
  // Validation
  if (!price || price <= 0) {
    throw new Error('Prix invalide');
  }
  if (!earnings || earnings === 0) {
    throw new Error('Bénéfice invalide ou nul');
  }

  const pe = price / earnings;
  let interpretation;

  if (pe < 0) {
    interpretation = 'négatif (entreprise non profitable)';
  } else if (pe < 15) {
    interpretation = 'faible (possiblement sous-évalué)';
  } else if (pe < 25) {
    interpretation = 'modéré (valorisation raisonnable)';
  } else if (pe < 40) {
    interpretation = 'élevé (croissance attendue)';
  } else {
    interpretation = 'très élevé (surévalué ou forte croissance)';
  }

  return {
    pe: Math.round(pe * 100) / 100,
    price,
    earnings,
    interpretation,
  };
}

/**
 * Calcule le ROI (Return on Investment)
 * @param {number} gain - Gain (ou perte si négatif)
 * @param {number} cost - Coût initial
 * @returns {Object} { roi, roiPercent, interpretation }
 */
function calculateROI(gain, cost) {
  // Validation
  if (typeof gain !== 'number' || typeof cost !== 'number') {
    throw new Error('Valeurs invalides pour le calcul de ROI');
  }
  if (cost === 0) {
    throw new Error('Le coût initial ne peut pas être 0');
  }

  const roi = (gain / cost) * 100;
  let interpretation;

  if (roi < 0) {
    interpretation = 'perte';
  } else if (roi < 10) {
    interpretation = 'rendement faible';
  } else if (roi < 30) {
    interpretation = 'rendement modéré';
  } else {
    interpretation = 'rendement élevé';
  }

  return {
    roi: Math.round(roi * 100) / 100,
    roiPercent: `${Math.round(roi * 100) / 100}%`,
    gain,
    cost,
    interpretation,
  };
}

/**
 * Calcule le yield (rendement en dividendes)
 * @param {number} annualDividend - Dividende annuel
 * @param {number} price - Prix de l'action
 * @returns {Object} { yieldPercent, interpretation }
 */
function calculateDividendYield(annualDividend, price) {
  // Validation
  if (!price || price <= 0) {
    throw new Error('Prix invalide');
  }
  if (typeof annualDividend !== 'number' || annualDividend < 0) {
    throw new Error('Dividende invalide');
  }

  const yieldPercent = (annualDividend / price) * 100;
  let interpretation;

  if (yieldPercent === 0) {
    interpretation = 'aucun dividende';
  } else if (yieldPercent < 2) {
    interpretation = 'rendement faible';
  } else if (yieldPercent < 5) {
    interpretation = 'rendement modéré';
  } else {
    interpretation = 'rendement élevé';
  }

  return {
    yieldPercent: Math.round(yieldPercent * 100) / 100,
    annualDividend,
    price,
    interpretation,
  };
}

module.exports = {
  calculateLoan,
  calculateVariation,
  calculatePE,
  calculateROI,
  calculateDividendYield,
};

// ========== EXTENSIONS POUR 28 INTENTS ==========

/**
 * Calcule métriques de risque
 */
function calculateRiskMetrics(returns, benchmarkReturns) {
  if (!Array.isArray(returns) || returns.length < 2) {
    throw new Error('Returns array invalide');
  }

  const mean = returns.reduce((a, b) => a + b) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpe = mean / stdDev; // Simplifié (sans risk-free rate)

  return {
    volatility: Math.round(stdDev * 100) / 100,
    sharpeRatio: Math.round(sharpe * 100) / 100,
    mean: Math.round(mean * 100) / 100,
  };
}

/**
 * Calcule valorisation simplifiée (P/E vs historique)
 */
function calculateValuation(currentPE, historicalAvgPE) {
  if (!currentPE || !historicalAvgPE) {
    throw new Error('P/E invalides');
  }

  const deviation = ((currentPE - historicalAvgPE) / historicalAvgPE) * 100;
  let assessment;

  if (deviation < -20) assessment = 'Fortement sous-évalué';
  else if (deviation < -10) assessment = 'Sous-évalué';
  else if (deviation < 10) assessment = 'Valorisation raisonnable';
  else if (deviation < 20) assessment = 'Surévalué';
  else assessment = 'Fortement surévalué';

  return {
    currentPE,
    historicalAvgPE,
    deviation: Math.round(deviation * 10) / 10,
    assessment,
  };
}

module.exports.calculateRiskMetrics = calculateRiskMetrics;
module.exports.calculateValuation = calculateValuation;
