/**
 * Serveur HTTP simple pour tester les intégrations
 */
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');

const port = 8080;

const server = http.createServer((req, res) => {
    let filePath = join(publicDir, req.url === '/' ? 'test-integrations.html' : req.url);
    
    // Gérer les routes API mockées
    if (req.url.startsWith('/api/')) {
        res.writeHead(200, { 
            'Content-Type': 'application/json', 
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        
        if (req.method === 'OPTIONS') {
            res.end();
            return;
        }
        
        if (req.url.includes('fastgraphs-login')) {
            res.end(JSON.stringify({ 
                success: true, 
                session: { url: 'https://www.fastgraphs.com/' },
                message: 'Mock login successful'
            }));
        } else {
            res.end(JSON.stringify({ success: true }));
        }
        return;
    }

    // Servir les fichiers statiques
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
    }

    const ext = filePath.split('.').pop();
    const contentType = {
        'html': 'text/html',
        'js': 'application/javascript',
        'css': 'text/css',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'svg': 'image/svg+xml'
    }[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
});

server.listen(port, () => {
    console.log(`✅ Serveur de test démarré sur http://localhost:${port}`);
    console.log(`📊 Page de test: http://localhost:${port}/test-integrations.html`);
    console.log(`📱 Dashboard: http://localhost:${port}/beta-combined-dashboard.html`);
    console.log('\n🌐 Ouverture du navigateur...');
    
    // Ouvrir le navigateur
    const url = `http://localhost:${port}/test-integrations.html`;
    const command = process.platform === 'darwin' 
        ? `open "${url}"`
        : process.platform === 'win32'
        ? `start "${url}"`
        : `xdg-open "${url}"`;
    
    exec(command, (error) => {
        if (error) {
            console.log(`⚠️ Impossible d'ouvrir le navigateur automatiquement.`);
            console.log(`   Veuillez ouvrir manuellement: ${url}`);
        }
    });
    
    console.log('\n⏸️ Appuyez sur Ctrl+C pour arrêter le serveur\n');
});
