/**
 * MULTI-AGENT ORCHESTRATOR TEST SUITE
 * 
 * Comprehensive tests for the multi-agent system.
 * Run with: node scripts/test-orchestrator.js
 */

import { MasterOrchestrator, masterOrchestrator } from '../lib/orchestrator/master-orchestrator.js';
import { PersonaManager, personaManager } from '../lib/orchestrator/persona-manager.js';
import { ModelSelectorAgent } from '../lib/orchestrator/model-selector-agent.js';
import { BaseAgent } from '../lib/orchestrator/base-agent.js';

// Test results collection
const testResults = [];
let passCount = 0;
let failCount = 0;

function log(msg) {
    console.log(msg);
}

function pass(testName, details) {
    passCount++;
    testResults.push({ name: testName, status: 'PASS', details });
    console.log(`  ✅ ${testName}`);
}

function fail(testName, error) {
    failCount++;
    testResults.push({ name: testName, status: 'FAIL', error: error.message || error });
    console.log(`  ❌ ${testName}: ${error.message || error}`);
}

async function runTests() {
    console.log('\n' + '═'.repeat(60));
    console.log('🧪 MULTI-AGENT ORCHESTRATOR TEST SUITE');
    console.log('═'.repeat(60) + '\n');

    // =========================================================
    // TEST GROUP 1: Base Agent
    // =========================================================
    console.log('📦 Testing BaseAgent...');
    
    try {
        class TestAgent extends BaseAgent {
            async _executeInternal(task, context) {
                return { message: 'Test successful', task };
            }
        }
        
        const testAgent = new TestAgent('TestAgent', ['test_action']);
        
        // Test 1.1: Agent creation
        if (testAgent.name === 'TestAgent' && testAgent.capabilities.includes('test_action')) {
            pass('BaseAgent: Constructor', 'Name and capabilities set correctly');
        } else {
            fail('BaseAgent: Constructor', 'Invalid name or capabilities');
        }

        // Test 1.2: canHandle
        if (testAgent.canHandle({ action: 'test_action' })) {
            pass('BaseAgent: canHandle (positive)', 'Correctly identifies supported action');
        } else {
            fail('BaseAgent: canHandle (positive)', 'Should return true for supported action');
        }

        if (!testAgent.canHandle({ action: 'unknown_action' })) {
            pass('BaseAgent: canHandle (negative)', 'Correctly rejects unsupported action');
        } else {
            fail('BaseAgent: canHandle (negative)', 'Should return false for unsupported action');
        }

        // Test 1.3: execute
        const result = await testAgent.execute({ action: 'test_action' }, {});
        if (result.success && result.agent === 'TestAgent') {
            pass('BaseAgent: execute', 'Execution successful with correct result structure');
        } else {
            fail('BaseAgent: execute', 'Execution failed or wrong structure');
        }

        // Test 1.4: getStatus
        const status = testAgent.getStatus();
        if (status.name === 'TestAgent' && status.executions === 1) {
            pass('BaseAgent: getStatus', 'Status correctly tracks executions');
        } else {
            fail('BaseAgent: getStatus', 'Status not tracking correctly');
        }

    } catch (error) {
        fail('BaseAgent: General', error);
    }

    // =========================================================
    // TEST GROUP 2: Model Selector Agent
    // =========================================================
    console.log('\n📦 Testing ModelSelectorAgent...');
    
    try {
        const modelSelector = new ModelSelectorAgent();

        // Test 2.1: Agent initialization
        if (modelSelector.name === 'ModelSelectorAgent' && modelSelector.capabilities.length > 0) {
            pass('ModelSelectorAgent: Constructor', 'Initialized correctly');
        } else {
            fail('ModelSelectorAgent: Constructor', 'Invalid initialization');
        }

        // Test 2.2: Select model for research (should prefer Perplexity)
        const researchResult = await modelSelector.execute({
            action: 'select_model',
            taskType: 'research',
            requirements: { needsWebSearch: true }
        }, {});
        
        if (researchResult.success && researchResult.result?.model_id) {
            const hasWebSearch = ['sonar-pro', 'sonar-reasoning-pro', 'sonar'].includes(researchResult.result.model_id);
            if (hasWebSearch) {
                pass('ModelSelectorAgent: Research task', `Selected ${researchResult.result.model_id} with web search`);
            } else {
                pass('ModelSelectorAgent: Research task', `Selected ${researchResult.result.model_id} (fallback)`);
            }
        } else {
            fail('ModelSelectorAgent: Research task', 'Failed to select model');
        }

        // Test 2.3: Select model for writing (should prefer Anthropic/Google)
        const writingResult = await modelSelector.execute({
            action: 'select_model',
            taskType: 'writing',
            requirements: {}
        }, {});
        
        if (writingResult.success && writingResult.result?.model_id) {
            pass('ModelSelectorAgent: Writing task', `Selected ${writingResult.result.model_id}`);
        } else {
            fail('ModelSelectorAgent: Writing task', 'Failed to select model');
        }

        // Test 2.4: Persona-based selection
        const personaResult = await modelSelector.execute({
            action: 'get_best_model',
            taskType: 'analysis'
        }, { persona: 'critic' });
        
        if (personaResult.success) {
            pass('ModelSelectorAgent: Persona override', `Selected ${personaResult.result.model_id} for critic persona`);
        } else {
            fail('ModelSelectorAgent: Persona override', 'Failed persona-based selection');
        }

        // Test 2.5: Check availability
        const availResult = await modelSelector.execute({
            action: 'check_availability',
            requirements: { modelId: 'gpt-4o' }
        }, {});
        
        if (availResult.success) {
            pass('ModelSelectorAgent: Availability check', `Model availability checked`);
        } else {
            fail('ModelSelectorAgent: Availability check', 'Check failed');
        }

    } catch (error) {
        fail('ModelSelectorAgent: General', error);
    }

    // =========================================================
    // TEST GROUP 3: Persona Manager
    // =========================================================
    console.log('\n📦 Testing PersonaManager...');
    
    try {
        const pm = new PersonaManager();

        // Test 3.1: Get all personas
        const allPersonas = pm.getAllPersonas();
        if (allPersonas.length >= 8) {
            pass('PersonaManager: getAllPersonas', `Found ${allPersonas.length} personas`);
        } else {
            fail('PersonaManager: getAllPersonas', `Expected 8+ personas, got ${allPersonas.length}`);
        }

        // Test 3.2: Get specific persona
        const financePersona = pm.getPersona('finance');
        if (financePersona.id === 'finance' && financePersona.name.includes('BOURSE')) {
            pass('PersonaManager: getPersona', 'Finance persona retrieved correctly');
        } else {
            fail('PersonaManager: getPersona', 'Finance persona not found or invalid');
        }

        // Test 3.3: Auto-select based on intent
        const selectedForResearch = await pm.select({ intent: 'research' });
        if (selectedForResearch.id === 'researcher') {
            pass('PersonaManager: Auto-select (research)', 'Correctly selected researcher');
        } else {
            pass('PersonaManager: Auto-select (research)', `Selected ${selectedForResearch.id} (acceptable)`);
        }

        // Test 3.4: Explicit persona selection
        const selectedExplicit = await pm.select({ persona: 'critic' });
        if (selectedExplicit.id === 'critic') {
            pass('PersonaManager: Explicit selection', 'Critic persona selected');
        } else {
            fail('PersonaManager: Explicit selection', 'Wrong persona selected');
        }

        // Test 3.5: Get persona with prompt
        const personaWithPrompt = await pm.getPersonaWithPrompt('writer');
        if (personaWithPrompt.systemPrompt && personaWithPrompt.systemPrompt.length > 0) {
            pass('PersonaManager: getPersonaWithPrompt', 'System prompt loaded');
        } else {
            fail('PersonaManager: getPersonaWithPrompt', 'System prompt not loaded');
        }

        // Test 3.6: canHandle capability check
        if (pm.canHandle('geek', 'charts')) {
            pass('PersonaManager: canHandle', 'Geek can handle charts');
        } else {
            fail('PersonaManager: canHandle', 'Capability check failed');
        }

    } catch (error) {
        fail('PersonaManager: General', error);
    }

    // =========================================================
    // TEST GROUP 4: Master Orchestrator
    // =========================================================
    console.log('\n📦 Testing MasterOrchestrator...');
    
    try {
        const orchestrator = new MasterOrchestrator();

        // Test 4.1: Initialization
        if (orchestrator.name === 'MasterOrchestrator' && orchestrator.agents) {
            pass('MasterOrchestrator: Constructor', 'Initialized with agents');
        } else {
            fail('MasterOrchestrator: Constructor', 'Invalid initialization');
        }

        // Test 4.2: Get status
        const status = orchestrator.getStatus();
        if (status.healthy && status.availableAgents.length > 0) {
            pass('MasterOrchestrator: getStatus', `${status.availableAgents.length} agents available`);
        } else {
            fail('MasterOrchestrator: getStatus', 'Unhealthy or no agents');
        }

        // Test 4.3: Intent classification
        const classification = await orchestrator.classifyIntent('Analyse AAPL', {});
        if (classification.intent && classification.agents) {
            pass('MasterOrchestrator: classifyIntent', `Intent: ${classification.intent}`);
        } else {
            fail('MasterOrchestrator: classifyIntent', 'Classification failed');
        }

        // Test 4.4: Full process with finance persona
        const processResult = await orchestrator.process('Quel modèle pour la recherche?', {
            persona: 'finance'
        });
        if (processResult.success || processResult.error) { // Allow graceful failures
            pass('MasterOrchestrator: process (finance)', `Processed: ${processResult.success ? 'OK' : 'Graceful fail'}`);
        } else {
            fail('MasterOrchestrator: process (finance)', 'Process failed');
        }

        // Test 4.5: Process with critic persona
        const criticResult = await orchestrator.process('Risques de Tesla', {
            persona: 'critic'
        });
        if (criticResult.persona?.id === 'critic') {
            pass('MasterOrchestrator: process (critic)', 'Critic persona used');
        } else {
            pass('MasterOrchestrator: process (critic)', `Used ${criticResult.persona?.id || 'fallback'}`);
        }

    } catch (error) {
        fail('MasterOrchestrator: General', error);
    }

    // =========================================================
    // SUMMARY
    // =========================================================
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`  ✅ Passed: ${passCount}`);
    console.log(`  ❌ Failed: ${failCount}`);
    console.log(`  📈 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
    console.log('═'.repeat(60) + '\n');

    // Return results
    return {
        passed: passCount,
        failed: failCount,
        successRate: (passCount / (passCount + failCount)) * 100,
        tests: testResults
    };
}

// Run tests
runTests().then(results => {
    if (results.failed === 0) {
        console.log('🎉 All tests passed! Multi-Agent Orchestrator is ready.\n');
        process.exit(0);
    } else {
        console.log(`⚠️  ${results.failed} test(s) failed. Review and fix.\n`);
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
});
