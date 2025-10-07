// ======
// Version SÉCURISÉE pour projetsjsl/GOB/seeking-alpha
const CONFIG = {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE',
    GITHUB_REPO: 'projetsjsl/GOB',
    BRANCH: 'main',
    FOLDER: 'public/seeking-alpha'
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromGitHub(filename) {
    const path = `${CONFIG.FOLDER}/${filename}`;
    const url = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/${path}`;
    
    console.log(`📥 Lecture: ${path}`);
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Erreur GitHub: ${response.status} - ${path}`);
    }
    
    const data = await response.json();
    let content = atob(data.content);
    
    // Nettoyer le BOM
    content = content.replace(/^\uFEFF/, '');
    
    return JSON.parse(content);
}

async function pushToGitHub(filename, content, message) {
    const path = `${CONFIG.FOLDER}/${filename}`;
    const url = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/${path}`;
    
    console.log(`📤 Push: ${path}`);
    
    // Récupérer le SHA actuel
    const getResponse = await fetch(url, {
        headers: {
            'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    let sha = null;
    if (getResponse.ok) {
        const current = await getResponse.json();
        sha = current.sha;
    }
    
    // Encoder le contenu
    const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
    
    const body = {
        message: message,
        content: encodedContent,
        branch: CONFIG.BRANCH
    };
    
    if (sha) body.sha = sha;
    
    // Push vers GitHub
    const putResponse = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    
    if (!putResponse.ok) {
        const error = await putResponse.json();
        console.error('Erreur push:', error);
        return false;
    }
    
    return true;
}

async function scrapeTicker(ticker) {
    console.log(`🔍 Scraping ${ticker}...`);
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    return new Promise((resolve) => {
        iframe.onload = async () => {
            await wait(4000);
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            const text = doc.body ? doc.body.innerText : '';
            
            document.body.removeChild(iframe);
            
            resolve({
                ticker: ticker,
                timestamp: new Date().toISOString(),
                raw_text: text,
                url: `https://seekingalpha.com/symbol/${ticker}/virtual_analyst_report`
            });
        };
        
        iframe.onerror = () => {
            document.body.removeChild(iframe);
            resolve({
                ticker: ticker,
                error: 'Failed to load iframe',
                timestamp: new Date().toISOString()
            });
        };
        
        iframe.src = `https://seekingalpha.com/symbol/${ticker}/virtual_analyst_report`;
    });
}

async function main() {
    console.clear();
    console.log('╔════════════════════════════════════════╗');
    console.log('║   SEEKING ALPHA SCRAPER - GOB v2.0    ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log(`📁 Repo: ${CONFIG.GITHUB_REPO}`);
    console.log(`📂 Dossier: ${CONFIG.FOLDER}`);
    console.log('');
    
    // Vérifier le token
    if (!CONFIG.GITHUB_TOKEN || CONFIG.GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
        console.error('❌ ERREUR: Token GitHub non configuré');
        console.log('💡 Configurez GITHUB_TOKEN dans les variables d\'environnement');
        return;
    }
    
    try {
        console.log('📖 Lecture des tickers...');
        const tickersConfig = await fetchFromGitHub('tickers.json');
        const tickers = tickersConfig.tickers;
        console.log(`✅ ${tickers.length} tickers: ${tickers.join(', ')}`);
        console.log('');
        
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < tickers.length; i++) {
            const ticker = tickers[i];
            console.log(`[${i + 1}/${tickers.length}] ${ticker}...`);
            
            try {
                const data = await scrapeTicker(ticker);
                
                if (data.error) {
                    console.error(`  ❌ ${ticker}: ${data.error}`);
                    errorCount++;
                } else {
                    console.log(`  ✅ ${ticker}: ${data.raw_text.length} caractères`);
                    successCount++;
                }
                
                results.push(data);
            } catch (e) {
                console.error(`  ❌ ${ticker}: ${e.message}`);
                results.push({
                    ticker,
                    error: e.message,
                    timestamp: new Date().toISOString()
                });
                errorCount++;
            }
            
            // Attendre entre chaque requête
            if (i < tickers.length - 1) {
                await wait(2000);
            }
        }
        
        console.log('');
        console.log('═══════════════════════════════════════');
        console.log(`📊 Résultats: ${successCount} succès, ${errorCount} erreurs`);
        console.log('═══════════════════════════════════════');
        console.log('');
        
        const output = {
            last_update: new Date().toISOString(),
            total_stocks: results.length,
            successful: successCount,
            failed: errorCount,
            stocks: results
        };
        
        console.log('💾 Push vers GitHub...');
        const success = await pushToGitHub('stock_analysis.json', output, `Update stocks - ${new Date().toISOString()}`);
        
        if (success) {
            console.log('✅ TERMINÉ - Données sur GitHub');
            console.log('');
            console.log('🌐 URLs:');
            console.log(`   Dashboard: https://mygob.vercel.app/seeking-alpha/`);
            console.log(`   GitHub: https://github.com/${CONFIG.GITHUB_REPO}/tree/main/${CONFIG.FOLDER}`);
            console.log(`   JSON: https://github.com/${CONFIG.GITHUB_REPO}/blob/main/${CONFIG.FOLDER}/stock_analysis.json`);
        } else {
            console.error('❌ Échec du push vers GitHub');
        }
        
        return output;
        
    } catch (error) {
        console.error('❌ ERREUR:', error);
        throw error;
    }
}

// Lancer le scraper
console.log('🚀 Démarrage du scraper...');
main()
    .then(data => {
        console.log('');
        console.log('✨ Scraping terminé avec succès!');
    })
    .catch(error => {
        console.error('');
        console.error('💥 Erreur fatale:', error);
    });
