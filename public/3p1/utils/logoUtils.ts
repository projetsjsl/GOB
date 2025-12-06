/**
 * Utilitaires pour la gestion des logos d'entreprises
 * Gère les fallbacks et évite les erreurs 404
 * 
 * Date: 6 décembre 2025
 */

export interface LogoFallbackOptions {
  logoSymbol?: string;
  actualSymbol?: string;
  preferredSymbol?: string;
  symbol?: string;
}

/**
 * Génère toutes les variantes possibles d'URL de logo à essayer
 */
export function generateLogoUrls(options: LogoFallbackOptions): string[] {
  const { logoSymbol, actualSymbol, preferredSymbol, symbol } = options;
  
  const variants: string[] = [];
  
  // Nettoyer les symboles pour générer des variantes
  const cleanSymbols = [
    logoSymbol,
    actualSymbol,
    preferredSymbol,
    symbol
  ].filter(Boolean) as string[];
  
  // Dédupliquer
  const uniqueSymbols = [...new Set(cleanSymbols)];
  
  // Générer les URLs pour chaque symbole avec toutes les variantes
  uniqueSymbols.forEach(sym => {
    // Nettoyer le symbole de base
    const baseSym = sym.replace(/\.TO$/i, '').toUpperCase();
    
    // Format 1: image-stock (standard FMP) - symbole original
    variants.push(`https://financialmodelingprep.com/image-stock/${baseSym}.png`);
    
    // Format 2: images/symbol (alternatif FMP) - symbole original
    variants.push(`https://images.financialmodelingprep.com/symbol/${baseSym}.png`);
    
    // Variantes avec tirets pour les classes d'actions (BRK.B -> BRK-B)
    if (baseSym.includes('.')) {
      const dashVariant = baseSym.replace(/\./g, '-');
      variants.push(`https://financialmodelingprep.com/image-stock/${dashVariant}.png`);
      variants.push(`https://images.financialmodelingprep.com/symbol/${dashVariant}.png`);
    }
    
    // Variantes avec points pour les classes (BRK-B -> BRK.B)
    if (baseSym.includes('-')) {
      const dotVariant = baseSym.replace(/-/g, '.');
      variants.push(`https://financialmodelingprep.com/image-stock/${dotVariant}.png`);
      variants.push(`https://images.financialmodelingprep.com/symbol/${dotVariant}.png`);
    }
    
    // Pour les symboles canadiens, essayer aussi sans suffixe
    if (sym.toUpperCase().endsWith('.TO')) {
      const withoutTO = baseSym.replace(/\.TO$/i, '');
      variants.push(`https://financialmodelingprep.com/image-stock/${withoutTO}.png`);
      variants.push(`https://images.financialmodelingprep.com/symbol/${withoutTO}.png`);
    }
  });
  
  // Dédupliquer les URLs
  return [...new Set(variants)];
}

/**
 * Gère l'erreur de chargement d'un logo avec fallback automatique
 */
export function handleLogoError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  options: LogoFallbackOptions,
  onFinalError?: () => void
) {
  const img = e.currentTarget;
  const currentSrc = img.src;
  
  // Générer toutes les variantes possibles
  const urlsToTry = generateLogoUrls(options);
  
  // Extraire le nom du fichier de l'URL actuelle pour comparaison
  const currentFileName = currentSrc.split('/').pop() || '';
  
  // Trouver l'index de l'URL actuelle
  let currentIndex = urlsToTry.findIndex(url => {
    const urlFileName = url.split('/').pop() || '';
    return urlFileName === currentFileName || currentSrc.includes(urlFileName);
  });
  
  if (currentIndex === -1) {
    currentIndex = 0;
  }
  
  // Essayer la prochaine URL
  const nextIndex = currentIndex + 1;
  if (nextIndex < urlsToTry.length) {
    const nextUrl = urlsToTry[nextIndex];
    const nextFileName = nextUrl.split('/').pop() || '';
    
    // Vérifier qu'on n'a pas déjà essayé cette URL
    if (nextFileName !== currentFileName && !currentSrc.includes(nextFileName)) {
      // Empêcher l'erreur 404 en définissant onerror avant de changer src
      img.onerror = null;
      img.src = nextUrl;
      // Réinstaller le handler après le prochain frame (optimisé)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (img.onerror === null) {
            img.onerror = (e) => handleLogoError(e as any, options, onFinalError);
          }
        });
      });
      return;
    }
  }
  
  // Si toutes les URLs ont été essayées, masquer l'image silencieusement
  // et empêcher les erreurs répétées
  img.style.display = 'none';
  img.onerror = null;
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 transparent pixel
  
  if (onFinalError) {
    onFinalError();
  }
}

/**
 * Crée un handler onError optimisé pour les logos
 */
export function createLogoErrorHandler(
  options: LogoFallbackOptions,
  onFinalError?: () => void
) {
  return (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    handleLogoError(e, options, onFinalError);
  };
}

/**
 * Crée un handler onLoad pour réinitialiser les erreurs
 */
export function createLogoLoadHandler() {
  return (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Si le logo charge avec succès, réinitialiser onError
    e.currentTarget.onerror = null;
  };
}

