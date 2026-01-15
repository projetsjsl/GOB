/**
 * Utilitaires pour la gestion des logos d'entreprises
 * Gere les fallbacks et evite les erreurs 404
 * 
 * Date: 6 decembre 2025
 */

export interface LogoFallbackOptions {
  logoSymbol?: string;
  actualSymbol?: string;
  preferredSymbol?: string;
  symbol?: string;
}

/**
 * Genere toutes les variantes possibles d'URL de logo a essayer
 */
export function generateLogoUrls(options: LogoFallbackOptions): string[] {
  const { logoSymbol, actualSymbol, preferredSymbol, symbol } = options;
  
  const variants: string[] = [];
  
  // Nettoyer les symboles pour generer des variantes
  const cleanSymbols = [
    logoSymbol,
    actualSymbol,
    preferredSymbol,
    symbol
  ].filter(Boolean) as string[];
  
  // Dedupliquer
  const uniqueSymbols = [...new Set(cleanSymbols)];
  
  // Generer les URLs pour chaque symbole avec toutes les variantes
  uniqueSymbols.forEach(sym => {
    // 1. Essayer le symbole tel quel (ex: EXE.TO -> EXE.TO.png)
    const rawSym = sym.toUpperCase();
    variants.push(`https://financialmodelingprep.com/image-stock/${rawSym}.png`);
    variants.push(`https://images.financialmodelingprep.com/symbol/${rawSym}.png`);

    // 2. Nettoyer le symbole de base (ex: EXE.TO -> EXE)
    const baseSym = rawSym.replace(/\.TO$/i, '').replace(/\.TRT$/i, ''); // Supporter d'autres suffixes si besoin
    
    if (baseSym !== rawSym) {
         variants.push(`https://financialmodelingprep.com/image-stock/${baseSym}.png`);
         variants.push(`https://images.financialmodelingprep.com/symbol/${baseSym}.png`);
    }
    
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
  });
  
  // Dedupliquer les URLs
  return [...new Set(variants)];
}

// Cache pour stocker les URLs qui ont echoue (evite de reessayer)
const failedLogoUrls = new Set<string>();

/**
 * Gere l'erreur de chargement d'un logo avec fallback automatique
 * Version optimisee : masque immediatement apres 1-2 tentatives pour eviter les 404 repetes
 */
export function handleLogoError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  options: LogoFallbackOptions,
  onFinalError?: () => void
) {
  const img = e.currentTarget;
  const currentSrc = img.src;
  
  // Si cette URL a deja echoue, masquer immediatement
  if (failedLogoUrls.has(currentSrc)) {
    img.style.display = 'none';
    img.onerror = null;
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    return;
  }
  
  // Marquer cette URL comme ayant echoue
  failedLogoUrls.add(currentSrc);
  
  // Generer toutes les variantes possibles
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
  
  // Essayer maximum 2 URLs avant d'abandonner (pour eviter trop de 404)
  const maxAttempts = 2;
  const nextIndex = currentIndex + 1;
  
  if (nextIndex < urlsToTry.length && (nextIndex - currentIndex) <= maxAttempts) {
    const nextUrl = urlsToTry[nextIndex];
    const nextFileName = nextUrl.split('/').pop() || '';
    
    // Verifier qu'on n'a pas deja essaye cette URL et qu'elle n'a pas deja echoue
    if (nextFileName !== currentFileName && 
        !currentSrc.includes(nextFileName) && 
        !failedLogoUrls.has(nextUrl)) {
      // Empecher l'erreur 404 en definissant onerror avant de changer src
      img.onerror = null;
      img.src = nextUrl;
      // Reinstaller le handler apres le prochain frame (optimise)
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
  
  // Si toutes les URLs ont ete essayees ou si on a atteint la limite, masquer immediatement
  // et empecher les erreurs repetees
  img.style.display = 'none';
  img.onerror = null;
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 transparent pixel
  
  if (onFinalError) {
    onFinalError();
  }
}

/**
 * Cree un handler onError optimise pour les logos
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
 * Cree un handler onLoad pour reinitialiser les erreurs
 */
export function createLogoLoadHandler() {
  return (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Si le logo charge avec succes, reinitialiser onError
    e.currentTarget.onerror = null;
  };
}

