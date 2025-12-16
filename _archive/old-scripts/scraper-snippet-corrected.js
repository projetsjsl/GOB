// Version corrigée qui gère le BOM et pointe vers le bon repo
const CONFIG = {
    GITHUB_TOKEN: 'YOUR_GITHUB_TOKEN_HERE',
    GITHUB_REPO: 'projetsjsl/gob',
    BRANCH: 'main'
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromGitHub(path) {
    const url = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/${path}`;
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

async function pushToGitHub(path, content, message) {
    const url = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/${path}`;
    
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
    
    const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
    
    const body = {
        message: message,
        content: encodedContent,
        branch: CONFIG.BRANCH
    };
    
    if (sha) body.sha = sha;
    
    const putResponse = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    
    return putResponse.ok;
}

async function scrapeTicker(ticker) {
    console.log(`Scraping ${ticker}...`);
    
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
        
        iframe.src = `https://seekingalpha.com/symbol/${ticker}/virtual_analyst_report`;
    });
}

async function main() {
    console.log('=== SEEKING ALPHA SCRAPER ===');
    
    console.log('Lecture des tickers...');
    const tickersConfig = await fetchFromGitHub('public/tickers.json');
    const tickers = tickersConfig.tickers;
    console.log(`Tickers: ${tickers.join(', ')}`);
    
    const results = [];
    for (const ticker of tickers) {
        try {
            const data = await scrapeTicker(ticker);
            results.push(data);
            console.log(`${ticker} OK - ${data.raw_text.length} caracteres`);
        } catch (e) {
            console.error(`${ticker} ERREUR:`, e);
            results.push({ticker, error: e.message, timestamp: new Date().toISOString()});
        }
        await wait(2000);
    }
    
    const output = {
        last_update: new Date().toISOString(),
        stocks: results
    };
    
    console.log('Push vers GitHub...');
    const success = await pushToGitHub('public/stock_analysis.json', output, `Update - ${new Date().toISOString()}`);
    
    if (success) {
        console.log('TERMINE - Donnees sur GitHub');
        console.log('Dashboard: https://projetsjsl.github.io/gob/');
    } else {
        console.error('Echec du push');
    }
    
    return output;
}

main().then(data => console.log('Resultats:', data));