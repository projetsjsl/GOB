/**
 * Proxy serveur pour jslai.app
 * Recupere le contenu HTML et le sert depuis gobapps.com
 * Contourne le firewall en gardant l'URL gobapps.com dans la barre d'adresse
 * Reecrit toutes les URLs pour que les ressources se chargent correctement
 */

export default async function handler(req, res) {
  const { path } = req.query;

  if (!path) {
      return res.status(400).json({ 
        error: 'Path parameter required',
        example: 'GET /api/jslai-proxy?path=reee',
        description: 'Le parametre path doit etre le chemin relatif sur jslai.app (ex: "reee", "evaluation")'
      });
    }

  try {
    // Construire l'URL cible
    const targetUrl = `https://jslai.app/${path}`;
    const baseUrl = 'https://jslai.app';
    
    console.log(` JSL AI Proxy: ${targetUrl}`);

    // Recuperer le contenu HTML
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://jslai.app/',
      }
    });

    if (!response.ok) {
      console.error(` JSL AI Proxy Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Erreur</title></head>
        <body>
          <h1>Erreur ${response.status}</h1>
          <p>Impossible de charger le contenu depuis jslai.app</p>
          <p><a href="${targetUrl}" target="_blank">Ouvrir directement</a></p>
        </body>
        </html>
      `);
    }

    let html = await response.text();

    // Fonction pour reecrire une URL relative en URL absolue vers jslai.app
    const rewriteUrl = (url) => {
      if (!url || url.trim() === '') return url;
      
      // Si c'est deja une URL absolue, la garder
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // Si c'est un hash ou un protocole special, le garder
      if (url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('data:')) {
        return url;
      }
      
      // Si c'est un chemin relatif (commence par /), le transformer en URL absolue
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Si c'est un chemin relatif sans slash, le transformer en URL absolue avec le chemin de base
      const pathDir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
      const basePath = pathDir ? `/${pathDir}` : '';
      return `${baseUrl}${basePath}/${url}`.replace(/\/+/g, '/');
    };

    // Fonction pour reecrire les liens internes vers notre proxy
    const rewriteLink = (url) => {
      if (!url || url.trim() === '') return url;
      
      // Si c'est une URL externe, la garder
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // Si c'est jslai.app, le transformer en lien proxy
        if (url.startsWith('https://jslai.app/')) {
          const linkPath = url.replace('https://jslai.app/', '');
          return `/api/jslai-proxy?path=${encodeURIComponent(linkPath)}`;
        }
        return url;
      }
      
      // Si c'est un hash ou un protocole special, le garder
      if (url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('data:')) {
        return url;
      }
      
      // Si c'est un chemin relatif, le transformer en lien proxy
      if (url.startsWith('/')) {
        const linkPath = url.substring(1);
        return `/api/jslai-proxy?path=${encodeURIComponent(linkPath)}`;
      }
      
      // Chemin relatif sans slash - calculer le chemin complet
      const pathDir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
      const fullPath = pathDir ? `${pathDir}/${url}` : url;
      return `/api/jslai-proxy?path=${encodeURIComponent(fullPath)}`;
    };

    // Fonction pour reecrire les ressources vers notre proxy de ressources
    const rewriteResource = (url) => {
      const absoluteUrl = rewriteUrl(url);
      // Si c'est une URL jslai.app, utiliser notre proxy de ressources
      if (absoluteUrl.startsWith('https://jslai.app/')) {
        return `/api/jslai-proxy-resource?url=${encodeURIComponent(absoluteUrl)}`;
      }
      return absoluteUrl;
    };

    // Reecrire les balises <link> (CSS) - utiliser le proxy de ressources
    html = html.replace(/<link([^>]*href=["'])([^"']+)(["'][^>]*)>/gi, (match, before, url, after) => {
      const newUrl = rewriteResource(url);
      return `<link${before}${newUrl}${after}>`;
    });

    // Reecrire les balises <script> avec src (JavaScript externe) - utiliser le proxy de ressources
    // IMPORTANT: Ne pas toucher aux scripts inline (sans src)
    html = html.replace(/<script([^>]*src=["'])([^"']+)(["'][^>]*)>/gi, (match, before, url, after) => {
      const newUrl = rewriteResource(url);
      return `<script${before}${newUrl}${after}>`;
    });
    
    // Les scripts inline (sans src) sont preserves automatiquement car ils ne matchent pas le pattern ci-dessus

    // Reecrire les balises <img> (Images) - utiliser le proxy de ressources
    html = html.replace(/<img([^>]*src=["'])([^"']+)(["'][^>]*)>/gi, (match, before, url, after) => {
      const newUrl = rewriteResource(url);
      return `<img${before}${newUrl}${after}>`;
    });

    // Reecrire les attributs srcset - utiliser le proxy de ressources
    html = html.replace(/srcset=["']([^"']+)["']/gi, (match, srcset) => {
      const newSrcset = srcset.split(',').map(item => {
        const parts = item.trim().split(/\s+/);
        const url = parts[0];
        const descriptor = parts[1] || '';
        return `${rewriteResource(url)} ${descriptor}`.trim();
      }).join(', ');
      return `srcset="${newSrcset}"`;
    });

    // Reecrire les attributs data-src, data-srcset, etc. - utiliser le proxy de ressources pour les images
    html = html.replace(/(data-(?:src|srcset)=["'])([^"']+)(["'])/gi, (match, attr, url, quote) => {
      const newUrl = rewriteResource(url);
      return `${attr}${newUrl}${quote}`;
    });
    
    // Pour data-href, utiliser rewriteLink (pour les liens)
    html = html.replace(/(data-href=["'])([^"']+)(["'])/gi, (match, attr, url, quote) => {
      const newUrl = rewriteLink(url);
      return `${attr}${newUrl}${quote}`;
    });

    // Reecrire les balises <a> (Liens)
    html = html.replace(/<a([^>]*href=["'])([^"']+)(["'][^>]*)>/gi, (match, before, url, after) => {
      const newUrl = rewriteLink(url);
      return `<a${before}${newUrl}${after}>`;
    });

    // Reecrire les URLs dans les styles inline (url(...)) - utiliser le proxy de ressources
    html = html.replace(/url\(["']?([^"')]+)["']?\)/gi, (match, url) => {
      const newUrl = rewriteResource(url);
      return `url(${newUrl})`;
    });

    // Reecrire les URLs dans les attributs style - utiliser le proxy de ressources
    html = html.replace(/style=["']([^"']*url\([^)]+\)[^"']*)["']/gi, (match, styleContent) => {
      const newStyle = styleContent.replace(/url\(["']?([^"')]+)["']?\)/gi, (urlMatch, url) => {
        return `url(${rewriteResource(url)})`;
      });
      return `style="${newStyle}"`;
    });

    // Reecrire les balises <source> (pour les images responsives) - utiliser le proxy de ressources
    html = html.replace(/<source([^>]*srcset=["'])([^"']+)(["'][^>]*)>/gi, (match, before, srcset, after) => {
      const newSrcset = srcset.split(',').map(item => {
        const parts = item.trim().split(/\s+/);
        const url = parts[0];
        const descriptor = parts[1] || '';
        return `${rewriteResource(url)} ${descriptor}`.trim();
      }).join(', ');
      return `<source${before}${newSrcset}${after}>`;
    });

    // Reecrire les balises <source> avec src - utiliser le proxy de ressources
    html = html.replace(/<source([^>]*src=["'])([^"']+)(["'][^>]*)>/gi, (match, before, url, after) => {
      const newUrl = rewriteResource(url);
      return `<source${before}${newUrl}${after}>`;
    });

    // Ajouter une balise <base> pour gerer les chemins relatifs
    if (!html.includes('<base')) {
      html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}/${path.endsWith('/') ? path : path + '/'}">`);
    }

    // Injecter un script pour s'assurer que tous les scripts sont charges avant d'exposer les fonctions
    // Ce script attend que tous les scripts soient charges et expose les fonctions globalement
    const scriptInjection = `
    <script>
      // Attendre que tous les scripts soient charges
      (function() {
        // Fonction pour verifier si tous les scripts sont charges
        function allScriptsLoaded() {
          const scripts = document.querySelectorAll('script[src]');
          let loaded = 0;
          let total = scripts.length;
          
          if (total === 0) return true;
          
          return new Promise((resolve) => {
            scripts.forEach((script) => {
              if (script.complete || script.readyState === 'complete') {
                loaded++;
              } else {
                script.addEventListener('load', () => {
                  loaded++;
                  if (loaded === total) resolve(true);
                });
                script.addEventListener('error', () => {
                  loaded++;
                  if (loaded === total) resolve(true);
                });
              }
            });
            
            if (loaded === total) resolve(true);
            
            //  FIX BUG-017: Timeout reduit a 5 secondes (au lieu de 10s)
            setTimeout(() => resolve(true), 5000);
          });
        }
        
        // Attendre le chargement complet
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            allScriptsLoaded().then(() => {
              console.log(' All scripts loaded');
              // Declencher un evenement personnalise pour indiquer que tout est pret
              window.dispatchEvent(new Event('allScriptsLoaded'));
            });
          });
        } else {
          allScriptsLoaded().then(() => {
            console.log(' All scripts loaded');
            window.dispatchEvent(new Event('allScriptsLoaded'));
          });
        }
        
        // Exposer les fonctions globales si elles existent
        window.addEventListener('load', () => {
          setTimeout(() => {
            // Verifier et exposer startEvaluation si elle existe
            if (typeof window.startEvaluation === 'function') {
              console.log(' startEvaluation is available');
            } else {
              console.warn(' startEvaluation not found, trying to find it...');
              // Chercher dans window
              for (let key in window) {
                if (key.toLowerCase().includes('startevaluation') || key.toLowerCase().includes('evaluation')) {
                  console.log('Found similar function:', key);
                  // Essayer de l'exposer
                  if (typeof window[key] === 'function') {
                    window.startEvaluation = window[key];
                    console.log(' Exposed startEvaluation from:', key);
                  }
                }
              }
              
              // Chercher dans le scope global (pas seulement window)
              try {
                if (typeof startEvaluation === 'function') {
                  window.startEvaluation = startEvaluation;
                  console.log(' Exposed startEvaluation from global scope');
                }
              } catch(e) {
                console.log('startEvaluation not in global scope');
              }
            }
            
            // Verifier et exposer ShowGuide si elle existe
            if (typeof window.ShowGuide === 'function') {
              console.log(' ShowGuide is available');
            } else {
              console.warn(' ShowGuide not found, trying to find it...');
              // Chercher dans window
              for (let key in window) {
                if (key.toLowerCase().includes('showguide') || key.toLowerCase().includes('guide')) {
                  console.log('Found similar function:', key);
                  // Essayer de l'exposer
                  if (typeof window[key] === 'function') {
                    window.ShowGuide = window[key];
                    console.log(' Exposed ShowGuide from:', key);
                  }
                }
              }
              
              // Chercher dans le scope global
              try {
                if (typeof ShowGuide === 'function') {
                  window.ShowGuide = ShowGuide;
                  console.log(' Exposed ShowGuide from global scope');
                }
              } catch(e) {
                console.log('ShowGuide not in global scope');
              }
            }
            
            // Verifier tous les scripts charges
            const scripts = document.querySelectorAll('script[src]');
            console.log(' Total scripts: ' + scripts.length);
            scripts.forEach((script, index) => {
              console.log('  ' + (index + 1) + '. ' + script.src + ' - ' + (script.complete ? ' Loaded' : ' Loading'));
            });
          }, 3000); // Augmenter le delai a 3 secondes
        });
      })();
    </script>
    `;

    // Injecter le script avant la fermeture de </body> ou avant </head>
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${scriptInjection}</body>`);
    } else if (html.includes('</html>')) {
      html = html.replace('</html>', `${scriptInjection}</html>`);
    } else {
      html += scriptInjection;
    }

    // Definir le Content-Type
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache 5 minutes
    res.setHeader('X-Proxy-Source', 'jslai.app');

    return res.status(200).send(html);

  } catch (error) {
    console.error(' JSL AI Proxy Error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Erreur</title></head>
      <body>
        <h1>Erreur de proxy</h1>
        <p>${error.message}</p>
        <p><a href="https://jslai.app/${path}" target="_blank">Ouvrir directement</a></p>
      </body>
      </html>
    `);
  }
}
