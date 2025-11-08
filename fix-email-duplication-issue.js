/**
 * Script pour corriger le problème d'envoi multiple d'emails
 * 
 * Problèmes identifiés :
 * 1. Le switch "Preview or Send?" envoie si preview_mode === false même si approved === false
 * 2. Les triggers automatiques n'ont pas preview_mode/approved définis
 * 3. Pas de protection contre les doublons
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workflowPath = join(__dirname, 'n8n-workflow-03lgcA4e9uRTtli1.json');
const workflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));

// 1. Corriger le node "Workflow Configuration" pour définir preview_mode et approved pour les triggers automatiques
const workflowConfigNode = workflow.nodes.find(n => n.name === 'Workflow Configuration');
if (workflowConfigNode) {
  // S'assurer que preview_mode = false et approved = true pour les triggers automatiques
  const assignments = workflowConfigNode.parameters.assignments.assignments;
  
  // Chercher ou ajouter preview_mode
  let previewModeAssignment = assignments.find(a => a.name === 'preview_mode');
  if (!previewModeAssignment) {
    assignments.push({
      id: `id-${Date.now()}-1`,
      name: 'preview_mode',
      value: 'false',
      type: 'boolean'
    });
  } else {
    previewModeAssignment.value = 'false';
  }
  
  // Chercher ou ajouter approved
  let approvedAssignment = assignments.find(a => a.name === 'approved');
  if (!approvedAssignment) {
    assignments.push({
      id: `id-${Date.now()}-2`,
      name: 'approved',
      value: 'true',
      type: 'boolean'
    });
  } else {
    approvedAssignment.value = 'true';
  }
  
  console.log('✅ Workflow Configuration mis à jour : preview_mode=false, approved=true pour triggers automatiques');
}

// 2. Corriger la logique du switch "Preview or Send?"
const previewOrSendNode = workflow.nodes.find(n => n.name === 'Preview or Send?');
if (previewOrSendNode) {
  // CORRECTION : Ne permettre l'envoi QUE si approved === true
  // Condition 1 : Preview (preview_mode === true ET approved !== true)
  previewOrSendNode.parameters.rules.rules[0].conditions.boolean[0].value1 = 
    "={{ $json.preview_mode === true && $json.approved !== true }}";
  
  // Condition 2 : Send (approved === true ET preview_mode !== true)
  // IMPORTANT : On envoie SEULEMENT si approved === true ET preview_mode !== true
  previewOrSendNode.parameters.rules.rules[1].conditions.boolean[0].value1 = 
    "={{ $json.approved === true && $json.preview_mode !== true }}";
  
  console.log('✅ Switch "Preview or Send?" corrigé : envoi SEULEMENT si approved=true ET preview_mode=false');
}

// 3. Ajouter une vérification de sécurité avant l'envoi d'email
const generateHtmlNode = workflow.nodes.find(n => n.name === 'Generate HTML Newsletter');
if (generateHtmlNode) {
  // Ajouter une vérification au début du code pour éviter les envois non autorisés
  const currentCode = generateHtmlNode.parameters.jsCode;
  
  // Vérifier si la vérification existe déjà
  if (!currentCode.includes('// VÉRIFICATION SÉCURITÉ')) {
    const securityCheck = `
// ============================================
// VÉRIFICATION SÉCURITÉ - ÉVITE LES ENVOIS MULTIPLES
// ============================================
const shouldSend = data.approved === true && data.preview_mode !== true;
if (!shouldSend) {
  throw new Error('❌ Email non autorisé : approved doit être true et preview_mode doit être false. Mode actuel : preview_mode=' + data.preview_mode + ', approved=' + data.approved);
}

`;
    
    // Insérer la vérification après la déclaration de data
    const dataDeclaration = 'const data = items[0].json;';
    const newCode = currentCode.replace(
      dataDeclaration,
      dataDeclaration + securityCheck
    );
    
    generateHtmlNode.parameters.jsCode = newCode;
    console.log('✅ Vérification de sécurité ajoutée dans Generate HTML Newsletter');
  }
}

// 4. S'assurer que le node "Custom Prompt Input" a les bonnes valeurs par défaut
const customPromptNode = workflow.nodes.find(n => n.name === 'Custom Prompt Input');
if (customPromptNode) {
  const assignments = customPromptNode.parameters.assignments.assignments;
  
  // Mettre preview_mode à true par défaut pour le trigger manuel
  const previewMode = assignments.find(a => a.name === 'preview_mode');
  if (previewMode) {
    previewMode.value = 'true';
  }
  
  // Mettre approved à false par défaut pour le trigger manuel
  const approved = assignments.find(a => a.name === 'approved');
  if (approved) {
    approved.value = 'false';
  }
  
  console.log('✅ Custom Prompt Input : preview_mode=true, approved=false par défaut (pour trigger manuel)');
}

// 5. Ajouter un node de vérification avant l'envoi d'email
const sendEmailNode = workflow.nodes.find(n => n.name === 'Send Email via Resend');
if (sendEmailNode) {
  // Créer un node de vérification avant l'envoi
  const checkBeforeSendNode = {
    "parameters": {
      "conditions": {
        "boolean": [
          {
            "value1": "={{ $json.approved === true && $json.preview_mode !== true }}",
            "value2": true
          }
        ]
      }
    },
    "id": "check-before-send-email",
    "name": "✅ Vérifier Avant Envoi",
    "type": "n8n-nodes-base.if",
    "typeVersion": 2,
    "position": [
      sendEmailNode.position[0] - 320,
      sendEmailNode.position[1]
    ]
  };
  
  // Vérifier si le node existe déjà
  const existingCheck = workflow.nodes.find(n => n.id === 'check-before-send-email');
  if (!existingCheck) {
    workflow.nodes.push(checkBeforeSendNode);
    
    // Mettre à jour les connexions
    // Generate HTML Newsletter -> ✅ Vérifier Avant Envoi
    if (!workflow.connections['Generate HTML Newsletter']) {
      workflow.connections['Generate HTML Newsletter'] = { main: [[]] };
    }
    
    // Remplacer la connexion directe par la vérification
    const generateHtmlConnections = workflow.connections['Generate HTML Newsletter'].main;
    if (generateHtmlConnections && generateHtmlConnections[0]) {
      // Garder la connexion vers Generate HTML Preview (index 1)
      // Mais changer la connexion vers Send Email (index 0) pour passer par la vérification
      generateHtmlConnections[0] = [{
        "node": "✅ Vérifier Avant Envoi",
        "type": "main",
        "index": 0
      }];
    }
    
    // ✅ Vérifier Avant Envoi -> Send Email via Resend (si approuvé)
    workflow.connections['✅ Vérifier Avant Envoi'] = {
      main: [
        [
          {
            "node": "Send Email via Resend",
            "type": "main",
            "index": 0
          }
        ],
        [] // Si non approuvé, ne rien faire (arrête le workflow)
      ]
    };
    
    console.log('✅ Node de vérification ajouté avant l\'envoi d\'email');
  }
}

// Sauvegarder
writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');
console.log('\n✅ Corrections appliquées :');
console.log('   1. Workflow Configuration : preview_mode=false, approved=true pour triggers automatiques');
console.log('   2. Custom Prompt Input : preview_mode=true, approved=false pour trigger manuel');
console.log('   3. Switch "Preview or Send?" : envoi SEULEMENT si approved=true ET preview_mode=false');
console.log('   4. Vérification de sécurité ajoutée dans Generate HTML Newsletter');
console.log('   5. Node de vérification ajouté avant l\'envoi d\'email');
console.log('\n⚠️  IMPORTANT : Les triggers automatiques (Schedule, Webhook) enverront maintenant des emails.');
console.log('   Pour les tests manuels, utilisez le Manual Trigger avec preview_mode=true.');

