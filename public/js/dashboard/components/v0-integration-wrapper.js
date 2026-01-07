/**
 * V0 Integration Wrapper - v8 (ESM to CJS + require polyfill)
 * 
 * Permet d'intégrer directement les composants créés dans v0.app
 */

(function() {
    'use strict';

    const V0_DEPENDENCIES = {
        react: { url: 'https://unpkg.com/react@18/umd/react.production.min.js', global: 'React' },
        'react-dom': { url: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', global: 'ReactDOM' },
        'prop-types': { url: 'https://unpkg.com/prop-types@15.8.1/prop-types.js', global: 'PropTypes' },
        recharts: { url: 'https://unpkg.com/recharts@2.10.3/umd/Recharts.js', global: 'Recharts' }
    };

    // require polyfill
    if (typeof window.require === 'undefined') {
        window.require = function(moduleName) {
            if (moduleName === 'react') return window.React;
            if (moduleName === 'react-dom') return window.ReactDOM;
            if (moduleName === 'prop-types') return window.PropTypes || {};
            if (moduleName === 'recharts') {
                const r = window.Recharts || (window.exports ? window.exports.Recharts : null);
                if (!r) console.warn('⚠️ Recharts non disponible sur window');
                return r || {};
            }
            
            // Check if it's an internal component already loaded on window
            const parts = moduleName.split('/');
            const lastPart = parts[parts.length - 1];
            // Convert kebab-case or path to PascalCase
            const componentNameBase = lastPart.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('').replace('.tsx', '').replace('.ts', '');
            
            const MockComponent = (name) => (props) => {
                const { className = '', children, asChild, ...rest } = props;
                if (asChild && React.isValidElement(children)) {
                    return React.cloneElement(children, rest);
                }
                let tag = 'div';
                let styles = className;
                if (name === 'Button') { tag = 'button'; styles = 'px-4 py-2 bg-blue-600 text-white rounded ' + className; }
                if (name === 'Badge') { tag = 'span'; styles = 'px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] ' + className; }
                if (name === 'Input') { tag = 'input'; styles = 'bg-neutral-800 border rounded px-2 py-1 ' + className; }
                return React.createElement(tag, { className: styles, ...rest, 'data-mock': name }, children);
            };

            if (window[componentNameBase]) return { default: window[componentNameBase], [componentNameBase]: window[componentNameBase] };
            
            // Proxy logic for UI components and others
            return new Proxy({}, {
                get: (target, prop) => {
                    if (prop === 'default' || prop === componentNameBase) {
                        return window[componentNameBase] || MockComponent(componentNameBase);
                    }
                    if (window[prop]) return window[prop];
                    
                    // Specific logic for Shadcn-like sub-components (DialogContent, etc.)
                    if (prop.startsWith(componentNameBase) || ['Dialog', 'Card', 'Tabs', 'Select', 'Table', 'Accordion', 'AlertDialog', 'Sheet', 'Command', 'ContextMenu', 'DropdownMenu', 'Popover', 'NavigationMenu'].some(base => prop.startsWith(base))) {
                        return MockComponent(prop);
                    }

                    // Fallback
                    console.log(`🛠️ require: Mocking unknown export '${prop}' from ${moduleName}`);
                    return MockComponent(prop);
                }
            });
        };
    }

    const loadingState = { dependencies: {}, components: {} };

    function loadDependency(name) {
        return new Promise((resolve, reject) => {
            const dep = V0_DEPENDENCIES[name];
            if (!dep) return reject(new Error(`Dépendance inconnue: ${name}`));
            if (window[dep.global]) return resolve(window[dep.global]);
            if (loadingState.dependencies[name] === 'loading') {
                const check = setInterval(() => { if (window[dep.global]) { clearInterval(check); resolve(window[dep.global]); } }, 100);
                return;
            }
            loadingState.dependencies[name] = 'loading';
            const script = document.createElement('script');
            script.src = dep.url;
            script.onload = () => {
                if (window[dep.global] && window[dep.global].default) window[dep.global] = window[dep.global].default;
                resolve(window[dep.global]);
            };
            script.onerror = () => reject(new Error(`Échec chargement ${name}`));
            document.head.appendChild(script);
        });
    }

    async function loadDependencies() {
        await Promise.all(Object.keys(V0_DEPENDENCIES).map(loadDependency));
    }

    function adaptV0Component(code, componentName) {
        console.log(`🛠️ v8 Adapting ${componentName} via Babel ESM->CJS...`);
        
        // Nettoyage minimal pour éviter les erreurs de chemin relatif
        let adapted = code
            .replace(/import\s+.*?\s+from\s+['"]@\/.*?['"];?/g, (m) => `// ${m} (removed)`);

        try {
            if (!window.Babel) throw new Error("Babel Standalone non chargé");
            
            // Transform ESM to CJS using Babel
            const result = window.Babel.transform(adapted, {
                presets: [
                    ['env', { modules: 'cjs' }],
                    'react',
                    'typescript'
                ],
                filename: componentName + '.tsx'
            });
            
            // Wrap in IIFE to expose component
            return `
                (function() {
                    var exports = {};
                    var module = { exports: exports };
                    ${result.code}
                    var finalComponent = module.exports.default || module.exports.${componentName} || (typeof module.exports === 'function' ? module.exports : null);
                    
                    // Fallback: look for ANY function in exports if still null
                    if (!finalComponent && typeof module.exports === 'object') {
                        for (var key in module.exports) {
                            if (typeof module.exports[key] === 'function' || (module.exports[key] && module.exports[key].$$typeof)) {
                                finalComponent = module.exports[key];
                                break;
                            }
                        }
                    }

                    if (finalComponent) {
                        window.${componentName} = finalComponent;
                        console.log('✅ ${componentName} exposed via CJS bridge');
                    } else {
                        console.error('❌ Could not find export for ${componentName}', module.exports);
                    }
                })();
            `;
        } catch (err) {
            console.error(`❌ Babel Transform Error for ${componentName}:`, err);
            return `console.error("Babel error: " + ${JSON.stringify(err.message)})`;
        }
    }

    async function loadV0Component(componentPath, componentName) {
        if (window[componentName]) return window[componentName];
        try {
            await loadDependencies();
            const res = await fetch(componentPath);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            let code = await res.text();
            const transformedCode = adaptV0Component(code, componentName);
            const script = document.createElement('script');
            script.textContent = transformedCode;
            script.setAttribute('data-name', componentName);
            document.head.appendChild(script);
            for (let i = 0; i < 50; i++) {
                if (window[componentName]) return window[componentName];
                await new Promise(r => setTimeout(r, 100));
            }
            throw new Error(`Le composant ${componentName} n'a pas été exposé.`);
        } catch (err) {
            console.error(`❌ V0 Integration:`, err);
            throw err;
        }
    }

    window.V0Integration = { loadDependency, loadDependencies, loadV0Component, adaptV0Component };
    console.log('✅ V0 Integration v8 Ready');
})();
