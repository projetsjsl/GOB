
const https = require('https');

const keys = [
    { name: 'GEMINI_API_KEY', value: 'AIzaSyCQxlKZCgsjAytjEYz2EyKYhacPSJdGaVY' },
    { name: 'GEMINI_API_KEY1', value: 'AIzaSyBIDpAFnMqLFI4ZkzJ9E--KljB_0JJLra8' }
];

const testKey = (keyObj) => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models?key=${keyObj.value}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ ${keyObj.name} is VALID.`);
                    resolve({ name: keyObj.name, valid: true, key: keyObj.value });
                } else {
                    console.log(`❌ ${keyObj.name} is INVALID. Status: ${res.statusCode}`);
                    // console.log(`Response: ${responseBody}`);
                    resolve({ name: keyObj.name, valid: false });
                }
            });
        });

        req.on('error', (error) => {
            console.error(`Error testing ${keyObj.name}:`, error);
            resolve({ name: keyObj.name, valid: false });
        });

        req.end();
    });
};

const runTests = async () => {
    console.log('Testing Gemini API Keys (List Models)...');
    for (const key of keys) {
        await testKey(key);
    }
};

runTests();
