import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import handler from './api/chat.js';

// Mock Express Request/Response
const createMockReqRes = (body) => {
    const req = {
        method: 'POST',
        body: body,
        headers: {
            'x-forwarded-for': '127.0.0.1'
        }
    };

    const res = {
        setHeader: () => {},
        status: (code) => {
            console.log(`[Response Status] ${code}`);
            return res;
        },
        json: (data) => {
            console.log('[Response JSON]', JSON.stringify(data, null, 2));
            return res;
        },
        end: () => console.log('[Response End]')
    };

    return { req, res };
};

async function runTest() {
    console.log('🧪 Starting TOP NEWS Simulation with ConfigManager check...');
    
    // Simulate SMS "TOP NEWS"
    const { req, res } = createMockReqRes({
        message: 'TOP NEWS',
        sender: '+15551234567',
        userId: '+15551234567',
        channel: 'sms'
    });

    try {
        await handler(req, res);
    } catch (error) {
        console.error('❌ Error during handler execution:', error);
    }
}

runTest();
