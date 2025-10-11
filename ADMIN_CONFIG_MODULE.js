// ==========================================
// MODULE INTERFACE ADMIN CONFIGURATION SCORE JSLAI™
// À intégrer dans AdminJSLATab
// ==========================================

/**
 * ÉTAPE 1: Ajouter cette section dans AdminJSLATab
 * Après les sections existantes (scraping, API keys, etc.)
 */

const ADMIN_CONFIG_SECTION = `
{/* ========== SECTION CONFIGURATION SCORE JSLAI™ ========== */}
<div className={\`border rounded-lg p-4 mb-6 \${
    isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-800' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300'
}\`}>
    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">⚙️</span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
            Configuration Score JSLAI™
        </span>
    </h3>
    
    <p className={\`text-sm mb-4 \${isDarkMode ? 'text-gray-300' : 'text-gray-600'}\`}>
        Ajustez les pondérations des 7 composantes du Score JSLAI™ selon votre stratégie d'investissement. 
        Le total doit être exactement 100%.
    </p>
    
    {/* Indicateur de validation */}
    <div className={\`mb-4 p-3 rounded-lg border-2 \${
        Object.values(jslaiConfig).reduce((a, b) => a + b, 0) === 100
            ? (isDarkMode ? 'bg-green-900/20 border-green-600' : 'bg-green-50 border-green-300')
            : (isDarkMode ? 'bg-red-900/20 border-red-600' : 'bg-red-50 border-red-300')
    }\`}>
        <div className="flex items-center justify-between">
            <span className="font-semibold">
                Total: {Object.values(jslaiConfig).reduce((a, b) => a + b, 0)}%
            </span>
            {Object.values(jslaiConfig).reduce((a, b) => a + b, 0) === 100 ? (
                <span className="text-green-600 font-bold flex items-center gap-1">
                    <span>✅</span> Configuration valide
                </span>
            ) : (
                <span className="text-red-600 font-bold flex items-center gap-1">
                    <span>⚠️</span> Le total doit être 100%
                </span>
            )}
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
                className={\`h-full transition-all duration-300 \${
                    Object.values(jslaiConfig).reduce((a, b) => a + b, 0) === 100
                        ? 'bg-green-600'
                        : Object.values(jslaiConfig).reduce((a, b) => a + b, 0) > 100
                        ? 'bg-red-600'
                        : 'bg-yellow-600'
                }\`}
                style={{ width: \`\${Math.min(Object.values(jslaiConfig).reduce((a, b) => a + b, 0), 100)}%\` }}
            ></div>
        </div>
    </div>
    
    {/* Sliders pour chaque composante */}
    <div className="grid grid-cols-2 gap-4 mb-4">
        {[
            { key: 'valuation', label: '💰 Valuation', desc: 'P/E, Price/FCF vs historique', max: 40 },
            { key: 'profitability', label: '💎 Profitability', desc: 'Marges, ROE, ROA', max: 40 },
            { key: 'growth', label: '🚀 Growth', desc: 'Croissance revenus & EPS', max: 40 },
            { key: 'financialHealth', label: '🏦 Financial Health', desc: 'Bilan, dette, liquidité', max: 40 },
            { key: 'momentum', label: '📈 Momentum', desc: 'RSI, moyennes mobiles', max: 40 },
            { key: 'moat', label: '🏰 Moat', desc: 'Avantage concurrentiel', max: 40 },
            { key: 'sectorPosition', label: '🎯 Sector Position', desc: 'Position dans le secteur', max: 20 }
        ].map(comp => (
            <div key={comp.key} className={\`p-3 rounded-lg border \${
                isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'
            }\`}>
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <div className="font-semibold text-sm">{comp.label}</div>
                        <div className={\`text-xs \${isDarkMode ? 'text-gray-400' : 'text-gray-500'}\`}>
                            {comp.desc}
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                        {jslaiConfig[comp.key]}%
                    </div>
                </div>
                <input
                    type="range"
                    min="0"
                    max={comp.max}
                    step="1"
                    value={jslaiConfig[comp.key]}
                    onChange={(e) => setJslaiConfig({
                        ...jslaiConfig,
                        [comp.key]: parseInt(e.target.value)
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: \`linear-gradient(to right, #3b82f6 0%, #3b82f6 \${jslaiConfig[comp.key] / comp.max * 100}%, #e5e7eb \${jslaiConfig[comp.key] / comp.max * 100}%, #e5e7eb 100%)\`
                    }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>{comp.max}%</span>
                </div>
            </div>
        ))}
    </div>
    
    {/* Presets */}
    <div className="mb-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span>🎯</span>
            Presets de Configuration
        </h4>
        <div className="grid grid-cols-4 gap-2">
            {[
                {
                    name: '📊 Value Investing',
                    desc: 'Focus valuation & solidité',
                    config: { valuation: 35, profitability: 25, growth: 10, financialHealth: 20, momentum: 5, moat: 5, sectorPosition: 0 }
                },
                {
                    name: '🚀 Growth Investing',
                    desc: 'Focus croissance & momentum',
                    config: { valuation: 10, profitability: 15, growth: 35, financialHealth: 15, momentum: 15, moat: 5, sectorPosition: 5 }
                },
                {
                    name: '⚖️ Balanced',
                    desc: 'Équilibré et diversifié',
                    config: { valuation: 20, profitability: 20, growth: 15, financialHealth: 20, momentum: 10, moat: 10, sectorPosition: 5 }
                },
                {
                    name: '💵 Dividend Focus',
                    desc: 'Focus rendement & stabilité',
                    config: { valuation: 15, profitability: 30, growth: 5, financialHealth: 25, momentum: 5, moat: 15, sectorPosition: 5 }
                }
            ].map((preset, i) => (
                <button
                    key={i}
                    onClick={() => setJslaiConfig(preset.config)}
                    className={\`p-3 rounded-lg border-2 text-left transition-all hover:scale-105 \${
                        isDarkMode 
                            ? 'bg-neutral-800 border-neutral-700 hover:border-blue-600' 
                            : 'bg-white border-gray-200 hover:border-blue-400'
                    }\`}
                >
                    <div className="font-semibold text-sm mb-1">{preset.name}</div>
                    <div className={\`text-xs \${isDarkMode ? 'text-gray-400' : 'text-gray-500'}\`}>
                        {preset.desc}
                    </div>
                </button>
            ))}
        </div>
    </div>
    
    {/* Boutons d'action */}
    <div className="flex gap-2">
        <button
            onClick={() => setJslaiConfig({
                valuation: 20,
                profitability: 20,
                growth: 15,
                financialHealth: 20,
                momentum: 10,
                moat: 10,
                sectorPosition: 5
            })}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
            🔄 Réinitialiser
        </button>
        <button
            onClick={() => {
                localStorage.setItem('jslaiConfig', JSON.stringify(jslaiConfig));
                alert('✅ Configuration sauvegardée avec succès !');
            }}
            disabled={Object.values(jslaiConfig).reduce((a, b) => a + b, 0) !== 100}
            className={\`px-4 py-2 rounded-lg transition-colors \${
                Object.values(jslaiConfig).reduce((a, b) => a + b, 0) === 100
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }\`}
        >
            💾 Sauvegarder
        </button>
    </div>
    
    {/* Explication */}
    <div className={\`mt-4 p-3 rounded-lg border \${
        isDarkMode ? 'bg-neutral-800/50 border-neutral-700' : 'bg-blue-50 border-blue-200'
    }\`}>
        <div className="flex items-start gap-2">
            <span className="text-xl">💡</span>
            <div className={\`text-xs \${isDarkMode ? 'text-gray-300' : 'text-gray-700'}\`}>
                <strong>Comment utiliser :</strong>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>Ajustez les sliders selon votre stratégie d'investissement</li>
                    <li>Utilisez les presets pour commencer rapidement</li>
                    <li>Le total doit faire exactement 100% pour sauvegarder</li>
                    <li>Les changements s'appliquent immédiatement au calcul du Score JSLAI™</li>
                    <li>La configuration est sauvegardée localement dans votre navigateur</li>
                </ul>
            </div>
        </div>
    </div>
</div>
`;

console.log('⚙️ Module Configuration Admin créé');
console.log('📊 Inclut: 7 sliders + 4 presets + validation + sauvegarde');
