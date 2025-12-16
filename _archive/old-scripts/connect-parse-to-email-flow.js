/**
 * Script pour connecter "Parse API Response" au flux email/preview
 * qui est actuellement isolé
 */

import { readFileSync, writeFileSync } from 'fs';

const workflowPath = 'n8n-workflow-03lgcA4e9uRTtli1.json';
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

console.log('🔧 Connexion du flux principal au flux email/preview...\n');

// Trouver les nodes critiques
const parseApiResponse = workflow.nodes.find(n => n.name === 'Parse API Response');
const debugBeforeSwitch = workflow.nodes.find(n => n.name === 'Debug Before Switch');
const shouldSendEmail = workflow.nodes.find(n => n.name === 'Should Send Email?');
const generateHtmlNewsletter = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');

console.log('📋 Nodes trouvés:');
console.log(`   Parse API Response: ${parseApiResponse ? '✅' : '❌'}`);
console.log(`   Debug Before Switch: ${debugBeforeSwitch ? '✅' : '❌'}`);
console.log(`   Should Send Email?: ${shouldSendEmail ? '✅' : '❌'}`);
console.log(`   Generate HTML Newsletter: ${generateHtmlNewsletter ? '✅' : '❌'}`);

// Vérifier les connexions actuelles
console.log('\n🔍 Connexions actuelles:');

if (parseApiResponse) {
  const parseConnections = workflow.connections?.['Parse API Response'];
  console.log(`   Parse API Response → ${parseConnections?.main?.[0]?.map(c => c.node).join(', ') || 'AUCUNE'}`);
}

if (debugBeforeSwitch) {
  const debugConnections = workflow.connections?.['Debug Before Switch'];
  console.log(`   Debug Before Switch → ${debugConnections?.main?.[0]?.map(c => c.node).join(', ') || 'AUCUNE'}`);
}

if (shouldSendEmail) {
  const shouldSendIncoming = [];
  Object.keys(workflow.connections || {}).forEach(sourceNode => {
    workflow.connections[sourceNode].main?.forEach(outputs => {
      outputs?.forEach(conn => {
        if (conn.node === 'Should Send Email?') {
          shouldSendIncoming.push(sourceNode);
        }
      });
    });
  });
  console.log(`   Should Send Email? reçoit de: ${shouldSendIncoming.length > 0 ? shouldSendIncoming.join(', ') : 'AUCUNE'}`);
}

// Corriger les connexions
// "Parse API Response" → "Debug Before Switch" (pour preview/send)
if (parseApiResponse && debugBeforeSwitch) {
  workflow.connections['Parse API Response'] = {
    main: [
      [
        {
          node: 'Debug Before Switch',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('\n✅ Parse API Response → Debug Before Switch');
}

// "Debug Before Switch" → "Should Send Email?"
if (debugBeforeSwitch && shouldSendEmail) {
  workflow.connections['Debug Before Switch'] = {
    main: [
      [
        {
          node: 'Should Send Email?',
          type: 'main',
          index: 0
        }
      ]
    ]
  };
  console.log('✅ Debug Before Switch → Should Send Email?');
}

// Vérifier que "Should Send Email?" se connecte bien à "Generate HTML Newsletter"
if (shouldSendEmail && generateHtmlNewsletter) {
  const shouldSendConnections = workflow.connections?.['Should Send Email?'];
  if (!shouldSendConnections) {
    workflow.connections['Should Send Email?'] = {
      main: [
        [
          {
            node: 'Generate HTML Newsletter',
            type: 'main',
            index: 0
          }
        ],
        [
          {
            node: 'Preview Display',
            type: 'main',
            index: 0
          }
        ]
      ]
    };
    console.log('✅ Should Send Email? → Generate HTML Newsletter (TRUE) et Preview Display (FALSE)');
  } else {
    console.log('✅ Should Send Email? a déjà des connexions correctes');
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');

console.log('\n✅ Flux principal connecté au flux email/preview !');
console.log('\n📋 Nouveau flux:');
console.log('   Parse API Response');
console.log('   → Debug Before Switch');
console.log('   → Should Send Email?');
console.log('      ├─ TRUE → Generate HTML Newsletter → ...');
console.log('      └─ FALSE → Preview Display → ...');

