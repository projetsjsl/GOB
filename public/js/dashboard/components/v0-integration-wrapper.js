/**
 * V0 Integration Wrapper
 * 
 * Permet d'intégrer directement les composants créés dans v0.app
 * sans conversion manuelle. Le wrapper gère :
 * - Le chargement des dépendances (React, Recharts, etc.)
 * - La conversion TypeScript/JSX en temps réel
 * - L'exposition globale des composants
 * - La compatibilité avec Babel Standalone
 * 
 * Usage:
 * 1. Placez votre composant v0 dans public/v0-components/[nom-du-composant]/
 * 2. Le wrapper le charge automatiquement
 */

(function() {
    'use strict';

    // Configuration des dépendances nécessaires pour v0
    const V0_DEPENDENCIES = {
        react: {
            url: 'https://unpkg.com/react@18/umd/react.production.min.js',
            global: 'React',
            loaded: false
        },
        'react-dom': {
            url: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
            global: 'ReactDOM',
            loaded: false
        },
        'prop-types': {
            url: 'https://unpkg.com/prop-types@15.8.1/prop-types.min.js',
            global: 'PropTypes',
            loaded: false
        },
        recharts: {
            url: 'https://cdn.jsdelivr.net/npm/recharts@2.10.3/dist/Recharts.js',
            global: 'Recharts',
            loaded: false
        }
    };

    // État de chargement
    const loadingState = {
        dependencies: {},
        components: {}
    };

    /**
     * Charge une dépendance si elle n'est pas déjà chargée
     */
    function loadDependency(name) {
        return new Promise((resolve, reject) => {
            const dep = V0_DEPENDENCIES[name];
            if (!dep) {
                reject(new Error(`Dépendance inconnue: ${name}`));
                return;
            }

            // Vérifier si déjà chargée
            if (window[dep.global] && loadingState.dependencies[name]) {
                resolve(window[dep.global]);
                return;
            }

            // Vérifier si en cours de chargement
            if (loadingState.dependencies[name] === 'loading') {
                const checkInterval = setInterval(() => {
                    if (loadingState.dependencies[name] === true) {
                        clearInterval(checkInterval);
                        resolve(window[dep.global]);
                    }
                }, 100);
                return;
            }

            // Charger la dépendance
            loadingState.dependencies[name] = 'loading';
            const script = document.createElement('script');
            script.src = dep.url;
            script.async = true;
            script.onload = () => {
                // Gérer le format UMD
                if (window[dep.global] && window[dep.global].default) {
                    window[dep.global] = window[dep.global].default;
                }
                loadingState.dependencies[name] = true;
                console.log(`✅ V0 Wrapper: ${name} chargé`);
                resolve(window[dep.global]);
            };
            script.onerror = () => {
                loadingState.dependencies[name] = false;
                console.error(`❌ V0 Wrapper: Échec du chargement de ${name}`);
                reject(new Error(`Échec du chargement de ${name}`));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Charge toutes les dépendances nécessaires
     */
    async function loadDependencies(deps = Object.keys(V0_DEPENDENCIES)) {
        const promises = deps.map(name => loadDependency(name));
        try {
            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error('❌ V0 Wrapper: Erreur lors du chargement des dépendances', error);
            return false;
        }
    }

    /**
     * Convertit un composant TypeScript/JSX en composant compatible Babel
     * Enlève les types TypeScript et adapte les imports
     */
    function adaptV0Component(code) {
        // Enlever "use client" et autres directives
        let adapted = code
            .replace(/["']use client["'];?\s*/g, '')
            // Enlever les imports TypeScript
            .replace(/import\s+type\s+.*?from\s+['"].*?['"];?\s*/g, '')
            // Convertir les imports ES6 en accès window
            .replace(/import\s+(\{[\s\S]*?\})\s+from\s+['"]react['"];?/g, (match, imports) => {
                // Extraire les noms des imports
                const names = imports.match(/\w+/g) || [];
                return `const { ${names.join(', ')} } = React;`;
            })
            .replace(/import\s+(\w+)\s+from\s+['"]react['"];?/g, 'const { $1 } = React;')
            .replace(/import\s+(\{[\s\S]*?\})\s+from\s+['"]react-dom['"];?/g, (match, imports) => {
                const names = imports.match(/\w+/g) || [];
                return `const { ${names.join(', ')} } = ReactDOM;`;
            })
            .replace(/import\s+(\w+)\s+from\s+['"]react-dom['"];?/g, 'const { $1 } = ReactDOM;')
            .replace(/import\s+(\{[\s\S]*?\})\s+from\s+['"]recharts['"];?/g, (match, imports) => {
                const names = imports.match(/\w+/g) || [];
                return `const { ${names.join(', ')} } = Recharts;`;
            })
            .replace(/import\s+(\w+)\s+from\s+['"]recharts['"];?/g, 'const { $1 } = Recharts;')
            .replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]recharts['"];?/g, 'const $1 = Recharts;')
            // Gérer les imports de lucide-react (icônes)
            .replace(/import\s+(\{[\s\S]*?\})\s+from\s+['"]lucide-react['"];?/g, (match, imports) => {
                const names = imports.match(/\w+/g) || [];
                // Utiliser IconoirIcon ou créer des composants d'icônes
                return `// Icons: ${names.join(', ')} - Utiliser window.LucideIcon ou window.IconoirIcon`;
            })
            // Convertir les imports de composants locaux (commenter)
            .replace(/import\s+(\w+)\s+from\s+['"]\.\/(.*?)['"];?/g, '// Import local: $1 from ./$2 - À adapter manuellement')
            .replace(/import\s+(\w+)\s+from\s+['"]@\/(.*?)['"];?/g, '// Import alias: $1 from @/$2 - À adapter manuellement')
            // Enlever les annotations de type TypeScript (plus sophistiqué)
            .replace(/:\s*[A-Z][a-zA-Z0-9<>\[\]|&,.\s]*(\s*=\s*[^,;\)\}]+)?/g, '')
            .replace(/<[A-Z][a-zA-Z0-9<>\[\]|&,.\s]*>/g, '')
            // Enlever les exports par défaut TypeScript
            .replace(/export\s+default\s+function\s+(\w+)/g, 'const $1 = function')
            .replace(/export\s+default\s+const\s+(\w+)/g, 'const $1')
            .replace(/export\s+const\s+(\w+)/g, 'const $1')
            // Exposer le composant globalement (chercher le dernier const/function exporté)
            .replace(/(const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\});?\s*$/m, (match, p1, componentName) => {
                return p1 + `\nwindow.${componentName} = ${componentName};`;
            })
            .replace(/(const\s+(\w+)\s*=\s*function[^}]*\{[\s\S]*?\});?\s*$/m, (match, p1, componentName) => {
                return p1 + `\nwindow.${componentName} = ${componentName};`;
            });

        return adapted;
    }

    /**
     * Charge un composant v0 depuis un fichier
     */
    async function loadV0Component(componentPath, componentName) {
        if (loadingState.components[componentName]) {
            return window[componentName];
        }

        try {
            // Charger les dépendances d'abord
            await loadDependencies();

            // Charger le fichier du composant
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            let code = await response.text();

            // Adapter le code pour Babel
            code = adaptV0Component(code);

            // Créer un script avec le code adapté
            const script = document.createElement('script');
            script.type = 'text/babel';
            script.textContent = code;
            
            // Attendre que Babel traite le script
            document.head.appendChild(script);
            
            // Attendre que le composant soit exposé
            let attempts = 0;
            while (!window[componentName] && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (window[componentName]) {
                loadingState.components[componentName] = true;
                console.log(`✅ V0 Wrapper: ${componentName} chargé depuis ${componentPath}`);
                return window[componentName];
            } else {
                throw new Error(`Le composant ${componentName} n'a pas été exposé après le chargement`);
            }
        } catch (error) {
            console.error(`❌ V0 Wrapper: Erreur lors du chargement de ${componentName}`, error);
            throw error;
        }
    }

    // Exposer l'API globale
    window.V0Integration = {
        loadDependency,
        loadDependencies,
        loadV0Component,
        adaptV0Component
    };

    console.log('✅ V0 Integration Wrapper initialisé');
})();
