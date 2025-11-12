#!/usr/bin/env node
/**
 * Emma SMS Server - multi-mode (test, prod_local, prod_cloud)
 *
 * - Mode TEST: aucun SMS réel, simulation complète des webhooks Twilio → Emma (n8n)
 * - Mode PROD_LOCAL: webhook prêt pour Twilio via ngrok, envoi SMS réel optionnel
 * - Mode PROD_CLOUD: déploiement permanent (Railway/Render/etc.)
 */

import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import twilio from 'twilio';
import axios from 'axios';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Charger .env test avant .env général si présent
dotenv.config({ path: '.env.test' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let scenarios = [];
const scenariosPath = path.resolve(__dirname, 'test-scenarios.js');
if (existsSync(scenariosPath)) {
  try {
    const module = await import(pathToFileUrl(scenariosPath));
    scenarios = module.scenarios || [];
  } catch (error) {
    console.warn('⚠️  Impossible de charger test-scenarios.js:', error.message);
  }
}

const app = express();
app.set('trust proxy', true);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const MODE = (process.env.MODE || 'test').toLowerCase();
const PORT = Number(process.env.PORT || process.env.TEST_SMS_PORT || 3000);
const EMMA_WEBHOOK_URL = process.env.EMMA_WEBHOOK_URL || `${process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678'}/webhook/gob-sms-webhook`;
const DEFAULT_TWILIO_TO = process.env.TWILIO_PHONE_NUMBER || process.env.TEST_TWILIO_NUMBER || '+15559876543';
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const TEST_MODE = process.env.TEST_MODE === 'true' || MODE === 'test';
const DEBUG = process.env.DEBUG_EMMA === 'true';
const EMMA_TIMEOUT_MS = Number(process.env.EMMA_TIMEOUT_MS || 45000);
const SIMULATED_LATENCY_MS = Number(process.env.SIMULATED_LATENCY_MS || 0);

const conversations = [];
const conversationsByNumber = new Map();
const conversationsBySid = new Map();

const TWILIO_AVAILABLE = !TEST_MODE && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;
const twilioClient = TWILIO_AVAILABLE ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

const modeLabels = {
  test: '🧪 Mode TEST - Numéros fictifs',
  prod_local: '📡 Mode PROD LOCAL - ngrok + vrais SMS',
  prod_cloud: '☁️ Mode PROD CLOUD - déployé'
};

const channelColor = {
  incoming: '#1d4ed8',
  outgoing: '#059669',
  error: '#dc2626'
};

const defaultSuggestions = [
  'ANALYSE AAPL',
  'MARCHE',
  'NEWS TSLA',
  'RSI NVDA',
  'RESULTATS MSFT',
  'LISTE',
  'AJOUTER NVDA',
  'SKILLS',
  'AIDE',
  'TOP 5 NEWS'
];

function pathToFileUrl(targetPath) {
  const resolved = path.resolve(targetPath).replace(/\\/g, '/');
  return `file://${resolved}`;
}

function recordMessage(entry) {
  conversations.push(entry);
  const key = entry.direction === 'incoming' ? entry.from : entry.to;
  if (!conversationsByNumber.has(key)) {
    conversationsByNumber.set(key, []);
  }
  conversationsByNumber.get(key).push(entry);
  if (entry.messageSid) {
    conversationsBySid.set(entry.messageSid, entry);
  }
}

function toSerializableMap(map) {
  return Object.fromEntries(map.entries());
}

function generateMessageSid() {
  return `SM_TEST_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

function generateTestNumber(country = 'US') {
  const formats = {
    US: () => `+1555${Math.floor(1000000 + Math.random() * 9000000)}`,
    FR: () => `+336${Math.floor(10000000 + Math.random() * 90000000)}`,
    CA: () => `+1514${Math.floor(1000000 + Math.random() * 9000000)}`
  };
  return (formats[country] || formats.US)();
}

function isValidTestNumber(number) {
  return /^\+[1-9]\d{10,14}$/.test(number);
}

function extractMessageFromResponse(data) {
  if (!data) return 'Réponse Emma reçue';
  if (typeof data === 'string') {
    const match = data.match(/<Message[^>]*>([\s\S]*?)<\/Message>/i);
    if (match) {
      return match[1].trim();
    }
    const stripped = data.replace(/<[^>]+>/g, '').trim();
    return stripped || data;
  }
  if (typeof data === 'object') {
    if (data.response) return data.response;
    if (data.message) return data.message;
    if (data.body) return data.body;
  }
  return 'Réponse Emma reçue';
}

async function relayToEmma(payload, { simulate = TEST_MODE } = {}) {
  const startedAt = Date.now();
  const params = new URLSearchParams({
    AccountSid: process.env.TWILIO_ACCOUNT_SID || 'AC_TESTACCOUNT',
    ApiVersion: '2010-04-01',
    Body: payload.Body,
    Channel: 'sms',
    From: payload.From,
    MessageSid: payload.MessageSid,
    SmsSid: payload.MessageSid,
    SmsStatus: payload.SmsStatus || 'received',
    To: payload.To || DEFAULT_TWILIO_TO,
    ToCountry: payload.ToCountry || 'US',
    ToState: payload.ToState || 'QC',
    ToCity: payload.ToCity || 'Montreal',
    NumMedia: payload.NumMedia || '0',
    test_mode: simulate ? 'true' : 'false'
  });

  if (payload.Metadata) {
    Object.entries(payload.Metadata).forEach(([key, value]) => {
      params.append(`Metadata[${key}]`, value);
    });
  }

  if (SIMULATED_LATENCY_MS > 0) {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_LATENCY_MS));
  }

  const response = await axios.post(EMMA_WEBHOOK_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: EMMA_TIMEOUT_MS
  });

  const message = extractMessageFromResponse(response.data);

  return {
    message,
    raw: response.data,
    headers: response.headers,
    status: response.status,
    processingTime: Date.now() - startedAt
  };
}

function buildTwimlResponse(message) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message || 'Réponse Emma reçue');
  return twiml.toString();
}

function wantsJson(req) {
  return req.query.format === 'json' || (req.headers.accept || '').includes('application/json');
}

function getConversationStats() {
  const totalClients = conversationsByNumber.size;
  const totalMessages = conversations.length;
  const lastMessage = conversations[conversations.length - 1];
  return {
    totalClients,
    totalMessages,
    lastMessageAt: lastMessage ? lastMessage.timestamp : null
  };
}

function renderConversationList() {
  if (conversations.length === 0) {
    return `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
        <p>Aucune conversation pour le moment</p>
        <p style="font-size: 14px; margin-top: 10px;">Envoyez un SMS test pour commencer!</p>
      </div>`;
  }

  return conversations
    .slice()
    .reverse()
    .map(conv => {
      const history = conversationsByNumber.get(conv.from) || conversationsByNumber.get(conv.to) || [];
      const isRepeatClient = history.filter(item => item.direction === 'incoming').length > 1;
      const badge = conv.direction === 'incoming' ? '📥 IN' : conv.error ? '⚠️  ERR' : '📤 OUT';
      const badgeColor = conv.direction === 'incoming' ? '#dbeafe' : conv.error ? '#fee2e2' : '#d1fae5';
      const badgeTextColor = conv.direction === 'incoming' ? '#1e3a8a' : conv.error ? '#b91c1c' : '#065f46';

      const meta = [
        conv.processingTime ? `⏱️ ${conv.processingTime}ms` : null,
        conv.messageSid ? `🆔 ${conv.messageSid}` : null,
        conv.responseLength ? `📏 ${conv.responseLength} chars` : null,
        conv.intent ? `🎯 ${conv.intent}` : null,
        conv.test ? '🧪 Test' : null,
        conv.realSMS ? '📞 SMS réel' : null
      ].filter(Boolean).join(' · ');

      return `
        <div class="conversation ${conv.direction} ${conv.error ? 'error' : ''}">
          <div class="conversation-header">
            <div class="conversation-meta">
              <span class="badge" style="background:${badgeColor};color:${badgeTextColor}">${badge}</span>
              <span class="phone">${conv.direction === 'incoming' ? conv.from : conv.to}</span>
              ${isRepeatClient ? '<span class="count">Client récurrent</span>' : ''}
            </div>
            <div class="timestamp">${new Date(conv.timestamp).toLocaleString('fr-FR')}</div>
          </div>
          <div class="conversation-body">
            <div class="label">Message:</div>
            <div class="message">${conv.body}</div>
            ${conv.response ? `
              <div class="response">
                <div class="label">Réponse Emma:</div>
                <div class="message">${conv.response}</div>
              </div>` : ''}
            ${conv.error ? `
              <div class="response" style="border-color:#ef4444;">
                <div class="label" style="color:#ef4444;">Erreur:</div>
                <div class="message" style="color:#ef4444;">${conv.error}</div>
              </div>` : ''}
          </div>
          ${meta ? `<div class="conversation-footer">${meta}</div>` : ''}
        </div>`;
    })
    .join('');
}

function renderSuggestions() {
  const chips = (scenarios.length ? scenarios.map(s => s.body) : defaultSuggestions).slice(0, 10);
  return chips
    .map(chip => `<span class="suggestion-chip" onclick="setMessage('${chip.replace(/'/g, "\\'")}')">${chip}</span>`)
    .join('');
}

app.get('/', (req, res) => {
  const stats = getConversationStats();
  res.send(`
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Emma SMS Dashboard - ${MODE.toUpperCase()}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f3f4f6; margin:0; padding:20px; }
.container { max-width:1220px; margin:0 auto; }
.mode-badge { position:sticky; top:10px; margin-bottom:10px; padding:10px 18px; border-radius:999px; display:inline-flex; align-items:center; gap:10px; font-weight:600; color:white; background:${MODE==='test' ? '#22c55e' : MODE==='prod_local' ? '#f97316' : '#0ea5e9'}; }
.card { background:white; border-radius:16px; padding:24px; box-shadow:0 8px 30px rgba(15,23,42,0.08); margin-bottom:20px; }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; }
.stat { background:#f8fafc; border-radius:12px; padding:16px; }
.stat .label { color:#64748b; font-size:13px; text-transform:uppercase; }
.stat .value { font-size:30px; font-weight:700; color:#0f172a; }
label { font-size:13px; font-weight:600; color:#475569; }
input, textarea { width:100%; padding:12px 14px; border-radius:10px; border:1px solid #cbd5f5; font-size:15px; }
textarea { resize:vertical; min-height:110px; }
button { border:none; border-radius:10px; cursor:pointer; font-weight:600; }
.btn-primary { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; padding:14px 20px; width:100%; }
.btn-secondary { background:#e2e8f0; color:#0f172a; padding:10px 16px; }
.btn-danger { background:#fee2e2; color:#b91c1c; padding:10px 16px; }
.suggestions { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
.suggestion-chip { background:#e2e8f0; padding:8px 12px; border-radius:999px; font-size:13px; }
.conversation { border:2px solid #e2e8f0; border-radius:14px; padding:18px; margin-bottom:16px; background:white; }
.conversation.incoming { border-left:6px solid ${channelColor.incoming}; }
.conversation.outgoing { border-left:6px solid ${channelColor.outgoing}; }
.conversation.error { border-left:6px solid ${channelColor.error}; background:#fef2f2; }
.conversation-meta { display:flex; gap:12px; align-items:center; }
.conversation-meta .badge { padding:4px 12px; border-radius:999px; font-weight:600; font-size:12px; }
.conversation-body .label { font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin:12px 0 6px; }
.conversation-body .message { white-space:pre-wrap; color:#0f172a; }
.response { border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-top:12px; background:#f8fafc; }
.controls { display:flex; gap:10px; flex-wrap:wrap; }
.export-data { margin-top:15px; padding:15px; background:#0f172a; color:#e2e8f0; border-radius:12px; font-family:'Courier New',monospace; font-size:13px; display:none; max-height:360px; overflow:auto; }
.twilio-section { background:#fefce8; border:1px solid #fcd34d; }
.alert { padding:12px 16px; border-radius:10px; background:#ecfccb; border:1px solid #bef264; color:#365314; margin-bottom:12px; font-size:14px; }
.auto-refresh { margin-top:12px; padding-top:12px; border-top:1px dashed #e2e8f0; }
.auto-refresh input[type=range] { width:100%; accent-color:#6366f1; cursor:pointer; }
</style>
</head>
<body>
  <div class="container">
    <div class="mode-badge">${modeLabels[MODE] || MODE.toUpperCase()}</div>
    <div class="card">
      <h1>📱 Emma SMS Dashboard</h1>
      <p style="color:#475569;">Tester Emma sur SMS avec les mêmes webhooks Twilio qu'en production.</p>
      <div class="grid" style="margin-top:20px;">
        <div class="stat"><div class="label">Clients</div><div class="value" id="stat-clients">${stats.totalClients}</div></div>
        <div class="stat"><div class="label">Messages</div><div class="value" id="stat-messages">${stats.totalMessages}</div></div>
        <div class="stat"><div class="label">Dernier message</div><div class="value" id="stat-last-message" style="font-size:18px;">${stats.lastMessageAt ? new Date(stats.lastMessageAt).toLocaleTimeString('fr-FR') : '—'}</div></div>
        <div class="stat"><div class="label">Webhook Emma</div><div class="value" style="font-size:16px;">${EMMA_WEBHOOK_URL}</div></div>
      </div>
    </div>

    <div class="card">
      <h2>🧪 Simuler un SMS (mode ${MODE.toUpperCase()})</h2>
      ${MODE !== 'test' ? '<div class="alert">Les simulations en mode production n\'envoient pas de SMS réels, mais le webhook de test doit rester isolé.</div>' : ''}
      <form id="simulate-form" action="/simulate-incoming" method="POST" novalidate>
        <div style="margin-bottom:16px;">
          <label>De (numéro fictif)</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <input type="text" name="From" id="from" placeholder="+15551234567" required pattern="\\+[1-9]\\d{10,14}" />
            <button type="button" class="btn-secondary" onclick="generateNumber()">🎲</button>
          </div>
          <div class="suggestions" style="margin-top:10px;">
            <span class="suggestion-chip" onclick="setNumber('+15551111111')">Client Alpha</span>
            <span class="suggestion-chip" onclick="setNumber('+15552222222')">Client Beta</span>
            <span class="suggestion-chip" onclick="setNumber('+33612345678')">Client France</span>
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <label>Message</label>
          <textarea name="Body" id="body" placeholder="Ex: ANALYSE AAPL" required></textarea>
          <div class="suggestions">${renderSuggestions()}</div>
        </div>
        <div class="auto-refresh">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
            <label for="auto-refresh-slider" style="margin:0;">Auto-refresh</label>
            <span id="auto-refresh-label" style="font-size:13px; color:#475569;">Désactivé</span>
          </div>
          <input type="range" min="0" max="30" step="1" value="8" id="auto-refresh-slider" />
          <p id="auto-refresh-state" style="font-size:13px; color:#64748b; margin-top:6px;">
            S'active automatiquement après un envoi puis se met en pause dès que vous retapez dans un champ.
          </p>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
          <button type="submit" class="btn-primary" id="simulate-submit">📤 Envoyer à Emma</button>
          <button type="button" class="btn-secondary" onclick="fetch('/api/clear',{method:'POST'}).then(()=>location.reload())">🗑️ Effacer</button>
          <button type="button" class="btn-secondary" onclick="toggleExport()">📊 Export JSON</button>
        </div>
        <div id="simulate-status" style="margin-top:12px; font-size:14px; color:#0f172a;"></div>
      </form>
      <div id="export-data" class="export-data"></div>
    </div>

    ${MODE === 'test' ? '' : `
      <div class="card twilio-section">
        <h2>📞 SMS réel via Twilio</h2>
        <p style="color:#92400e;">Ce formulaire enverra un SMS facturé via Twilio (${process.env.TWILIO_PHONE_NUMBER || 'numéro non configuré'}).</p>
        <form action="/send-real-sms" method="POST">
          <div style="margin-bottom:16px;">
            <label>Destinataire</label>
            <input type="text" name="To" placeholder="+15551234567" required pattern="\\+[1-9]\\d{10,14}" />
          </div>
          <div style="margin-bottom:16px;">
            <label>Message</label>
            <textarea name="Body" placeholder="Message..." required></textarea>
          </div>
          <button type="submit" class="btn-primary">📤 Envoyer SMS réel</button>
        </form>
        <p style="margin-top:10px; font-size:14px; color:#92400e;">
          Webhook Twilio: <strong>${PUBLIC_URL}/webhook/sms</strong><br />
          Configurez-le dans Twilio Console → Phone Numbers → Messaging.
        </p>
      </div>`}

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <h2>💬 Conversations (<span id="conversation-count">${conversations.length}</span>)</h2>
        <div class="controls">
          <button class="btn-secondary" onclick="location.href='/api/conversations'" title="Télécharger JSON">⬇️ Export</button>
          <button class="btn-secondary" onclick="location.href='/api/config'">⚙️ Config</button>
        </div>
      </div>
      <div id="conversation-list">
        ${renderConversationList()}
      </div>
    </div>
  </div>

<script>
function toggleExport(){
  const exportDiv=document.getElementById('export-data');
  if(exportDiv.style.display==='block'){exportDiv.style.display='none';return;}
  fetch('/api/export').then(r=>r.json()).then(data=>{
    exportDiv.textContent=JSON.stringify(data,null,2);
    exportDiv.style.display='block';
  });
}
function setNumber(number){
  document.getElementById('from').value=number;
  if(window.pauseAutoRefresh){window.pauseAutoRefresh('manual-number');}
}
function generateNumber(country='US'){
  const formats={US:()=>'+1555'+Math.floor(1000000+Math.random()*9000000),FR:()=>'+336'+Math.floor(10000000+Math.random()*90000000),CA:()=>'+1514'+Math.floor(1000000+Math.random()*9000000)};
  document.getElementById('from').value=(formats[country]||formats.US)();
  if(window.pauseAutoRefresh){window.pauseAutoRefresh('generator');}
}
function setMessage(message){
  document.getElementById('body').value=message;
  if(window.pauseAutoRefresh){window.pauseAutoRefresh('prefill');}
}

(function(){
  const form=document.getElementById('simulate-form');
  const submitBtn=document.getElementById('simulate-submit');
  const statusBox=document.getElementById('simulate-status');
  const slider=document.getElementById('auto-refresh-slider');
  const sliderLabel=document.getElementById('auto-refresh-label');
  const stateLabel=document.getElementById('auto-refresh-state');
  const fromInput=document.getElementById('from');
  const bodyInput=document.getElementById('body');
  const conversationContainer=document.getElementById('conversation-list');
  const conversationCount=document.getElementById('conversation-count');
  const statClients=document.getElementById('stat-clients');
  const statMessages=document.getElementById('stat-messages');
  const statLast=document.getElementById('stat-last-message');

  const refreshState={
    timer:null,
    armed:false,
    delay:slider?Number(slider.value)||0:0
  };

  const escapeHtml=(value='')=>String(value)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');

  function updateSliderLabel(mode='idle'){
    if(!sliderLabel)return;
    if(refreshState.delay===0){
      sliderLabel.textContent='désactivé';
      return;
    }
    const base=`${refreshState.delay}s`;
    sliderLabel.textContent=mode==='armed'
      ? `${base} · actif`
      : mode==='paused'
        ? `${base} · en pause`
        : `${base} · prêt`;
  }

  function stopAutoRefresh(reason='manual'){
    if(refreshState.timer){
      clearTimeout(refreshState.timer);
      refreshState.timer=null;
    }
    refreshState.armed=false;
    updateSliderLabel('paused');
    if(stateLabel){
      stateLabel.textContent=reason==='typing'
        ? '✍️ Auto-refresh en pause pendant la saisie.'
        : '⏸️ Auto-refresh en pause.';
    }
  }

  function scheduleAutoRefreshTick(){
    if(refreshState.timer){
      clearTimeout(refreshState.timer);
      refreshState.timer=null;
    }
    if(!refreshState.armed||refreshState.delay===0)return;
    refreshState.timer=setTimeout(async ()=>{
      await refreshConversations();
      scheduleAutoRefreshTick();
    },refreshState.delay*1000);
  }

  function buildMeta(conv){
    const meta=[];
    if(conv.processingTime)meta.push(`⏱️ ${conv.processingTime}ms`);
    if(conv.messageSid)meta.push(`🆔 ${conv.messageSid}`);
    if(conv.responseLength)meta.push(`📏 ${conv.responseLength} chars`);
    if(conv.intent)meta.push(`🎯 ${escapeHtml(conv.intent)}`);
    if(conv.test)meta.push('🧪 Test');
    if(conv.realSMS)meta.push('📞 SMS réel');
    return meta.join(' · ');
  }

  function renderConversationCards(list, grouped){
    if(!list||!list.length){
      return `
        <div class="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          <p>Aucune conversation pour le moment</p>
          <p style="font-size:14px;margin-top:10px;">Envoyez un SMS test pour commencer!</p>
        </div>`;
    }

    const entries=[...list].reverse();
    return entries.map(conv=>{
      const history=(grouped?.[conv.from]||grouped?.[conv.to]||[]);
      const repeatCount=history.filter(item=>item.direction==='incoming').length;
      const badge=conv.direction==='incoming'?'📥 IN':conv.error?'⚠️ ERR':'📤 OUT';
      const badgeColor=conv.direction==='incoming'?'#dbeafe':conv.error?'#fee2e2':'#d1fae5';
      const badgeTextColor=conv.direction==='incoming'?'#1e3a8a':conv.error?'#b91c1c':'#065f46';
      const meta=buildMeta(conv);

      return `
        <div class="conversation ${conv.direction} ${conv.error?'error':''}">
          <div class="conversation-header">
            <div class="conversation-meta">
              <span class="badge" style="background:${badgeColor};color:${badgeTextColor}">${badge}</span>
              <span class="phone">${escapeHtml(conv.direction==='incoming'?conv.from:conv.to)}</span>
              ${repeatCount>1?'<span class="count">Client récurrent</span>':''}
            </div>
            <div class="timestamp">${new Date(conv.timestamp).toLocaleString('fr-FR')}</div>
          </div>
          <div class="conversation-body">
            <div class="label">Message:</div>
            <div class="message">${escapeHtml(conv.body||'')}</div>
            ${conv.response?`
              <div class="response">
                <div class="label">Réponse Emma:</div>
                <div class="message">${escapeHtml(conv.response)}</div>
              </div>`:''}
            ${conv.error?`
              <div class="response" style="border-color:#ef4444;">
                <div class="label" style="color:#ef4444;">Erreur:</div>
                <div class="message" style="color:#ef4444;">${escapeHtml(conv.error)}</div>
              </div>`:''}
          </div>
          ${meta?`<div class="conversation-footer">${meta}</div>`:''}
        </div>`;
    }).join('');
  }

  async function refreshConversations(manual=false){
    try{
      const response=await fetch('/api/conversations');
      if(!response.ok)throw new Error('Impossible de recharger les conversations');
      const data=await response.json();
      if(conversationContainer){
        conversationContainer.innerHTML=renderConversationCards(data.conversations,data.conversationsByNumber);
      }
      if(conversationCount)conversationCount.textContent=data.total||0;
      if(statClients)statClients.textContent=Object.keys(data.conversationsByNumber||{}).length;
      if(statMessages)statMessages.textContent=data.conversations?.length||0;
      if(statLast){
        const last=data.conversations?.[data.conversations.length-1];
        statLast.textContent=last?new Date(last.timestamp).toLocaleTimeString('fr-FR'):'—';
      }
      if(manual&&stateLabel){
        stateLabel.textContent='✅ Conversations mises à jour.';
      }
    }catch(error){
      console.error('refreshConversations error',error);
      if(stateLabel){
        stateLabel.textContent='⚠️ Impossible d\'actualiser les conversations.';
      }
      stopAutoRefresh('error');
    }
  }

  function armAutoRefresh(triggerNow=false){
    if(refreshState.delay===0){
      refreshState.armed=false;
      updateSliderLabel('idle');
      if(stateLabel){
        stateLabel.textContent='Auto-refresh désactivé (slider à 0 seconde).';
      }
      if(triggerNow){
        refreshConversations(true);
      }
      return;
    }
    refreshState.armed=true;
    updateSliderLabel('armed');
    if(stateLabel){
      stateLabel.textContent=`Auto-refresh toutes les ${refreshState.delay}s (pause dès que vous tapez).`;
    }
    if(triggerNow){
      refreshConversations(true);
    }
    scheduleAutoRefreshTick();
  }

  if(slider){
    slider.addEventListener('input',event=>{
      refreshState.delay=Number(event.target.value)||0;
      if(refreshState.delay===0){
        stopAutoRefresh('slider');
        if(stateLabel){
          stateLabel.textContent='Auto-refresh désactivé (0 seconde).';
        }
      }else{
        updateSliderLabel(refreshState.armed?'armed':'idle');
        if(stateLabel){
          stateLabel.textContent=refreshState.armed
            ? `Auto-refresh toutes les ${refreshState.delay}s.`
            : `Se déclenchera ${refreshState.delay}s après l\'envoi d\'un SMS.`;
        }
        if(refreshState.armed){
          scheduleAutoRefreshTick();
        }
      }
    });
    updateSliderLabel();
  }

  ['input','focus'].forEach(evt=>{
    if(fromInput)fromInput.addEventListener(evt,()=>stopAutoRefresh('typing'));
    if(bodyInput)bodyInput.addEventListener(evt,()=>stopAutoRefresh('typing'));
  });

  window.pauseAutoRefresh=stopAutoRefresh;

  if(form){
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(!submitBtn)return;
      if(!form.checkValidity()){
        form.reportValidity();
        return;
      }
      stopAutoRefresh('sending');
      const formData=new FormData(form);
      const payload=new URLSearchParams();
      for(const [key,value] of formData.entries()){
        payload.append(key,value.toString());
      }

      submitBtn.disabled=true;
      submitBtn.textContent='⏳ Envoi...';
      if(statusBox){
        statusBox.style.color='#0f172a';
        statusBox.textContent='Envoi en cours...';
      }

      try{
        const response=await fetch('/simulate-incoming?format=json',{
          method:'POST',
          headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body:payload.toString()
        });
        const result=await response.json();
        if(!response.ok||!result.success){
          throw new Error(result.error||'Erreur lors de la simulation');
        }
        if(statusBox){
          statusBox.style.color='#15803d';
          statusBox.textContent=result.response?`✅ ${result.response}`:'✅ Message simulé';
        }
        form.reset();
        if(refreshState.delay>0){
          armAutoRefresh(true);
        }else{
          refreshConversations(true);
        }
      }catch(error){
        console.error('Simulation error',error);
        if(statusBox){
          statusBox.style.color='#b91c1c';
          statusBox.textContent=`❌ ${error.message||'Erreur inconnue'}`;
        }
      }finally{
        submitBtn.disabled=false;
        submitBtn.textContent='📤 Envoyer à Emma';
      }
    });
  }

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&refreshState.armed){
      refreshConversations(true);
    }
  });
})();
</script>
</body>
</html>
  `);
});

async function handleSimulation({ From, Body, To }) {
  const messageSid = generateMessageSid();
  const timestamp = new Date().toISOString();

  const incoming = {
    direction: 'incoming',
    from: From,
    to: To,
    body: Body,
    timestamp,
    messageSid,
    test: true
  };
  recordMessage(incoming);

  try {
    const result = await relayToEmma({ From, To, Body, MessageSid: messageSid }, { simulate: true });
    const outgoing = {
      direction: 'outgoing',
      from: To,
      to: From,
      body: result.message,
      timestamp: new Date().toISOString(),
      response: result.message,
      responseLength: result.message.length,
      processingTime: result.processingTime,
      messageSid,
      test: true
    };
    recordMessage(outgoing);
    return { success: true, message: result.message };
  } catch (error) {
    const outgoing = {
      direction: 'outgoing',
      from: To,
      to: From,
      body: 'Erreur de traitement.',
      timestamp: new Date().toISOString(),
      error: error.message,
      messageSid,
      test: true
    };
    recordMessage(outgoing);
    throw error;
  }
}

app.post('/simulate-incoming', async (req, res) => {
  const { From, Body } = req.body;
  const To = req.body.To?.trim() || DEFAULT_TWILIO_TO;
  const wantsJsonResponse = wantsJson(req);

  if (!From || !Body) {
    return wantsJsonResponse
      ? res.status(400).json({ success: false, error: 'From and Body are required' })
      : res.status(400).send('From and Body are required');
  }

  if (!isValidTestNumber(From)) {
    return wantsJsonResponse
      ? res.status(400).json({ success: false, error: 'Invalid phone number format' })
      : res.status(400).send('Numéro invalide. Format: +15551234567');
  }

  try {
    const result = await handleSimulation({ From, Body, To });
    if (wantsJsonResponse) {
      return res.json({ success: true, response: result.message });
    }
    return res.redirect('/');
  } catch (error) {
    console.error('❌ Simulation error:', error.message);
    if (wantsJsonResponse) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.redirect('/');
  }
});

app.post('/webhook/sms', async (req, res) => {
  const From = req.body.From || req.body.from;
  const Body = req.body.Body || req.body.body;
  const To = req.body.To || DEFAULT_TWILIO_TO;
  const MessageSid = req.body.MessageSid || req.body.SmsSid || generateMessageSid();

  if (!From || !Body) {
    return res.status(400).send('Missing parameters');
  }

  const incoming = {
    direction: 'incoming',
    from: From,
    to: To,
    body: Body,
    timestamp: new Date().toISOString(),
    messageSid: MessageSid,
    realSMS: !TEST_MODE
  };
  recordMessage(incoming);

  try {
    const result = await relayToEmma({ From, To, Body, MessageSid }, { simulate: TEST_MODE });
    const outgoing = {
      direction: 'outgoing',
      from: To,
      to: From,
      body: result.message,
      timestamp: new Date().toISOString(),
      response: result.message,
      responseLength: result.message.length,
      processingTime: result.processingTime,
      messageSid: MessageSid,
      realSMS: !TEST_MODE
    };
    recordMessage(outgoing);

    const twiml = buildTwimlResponse(result.message);
    res.type('text/xml');
    return res.send(twiml);
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    const outgoing = {
      direction: 'outgoing',
      from: To,
      to: From,
      body: 'Erreur de traitement.',
      timestamp: new Date().toISOString(),
      error: error.message,
      messageSid: MessageSid,
      realSMS: !TEST_MODE
    };
    recordMessage(outgoing);
    const fallback = buildTwimlResponse('❌ Erreur technique. Réessayez.');
    res.type('text/xml').status(200).send(fallback);
  }
});

app.post('/send-real-sms', async (req, res) => {
  if (TEST_MODE || !twilioClient) {
    return res.status(403).json({ success: false, error: 'Envoi réel indisponible en mode test' });
  }

  const { To, Body } = req.body;
  if (!To || !Body) {
    return res.status(400).json({ success: false, error: 'Missing To or Body' });
  }

  try {
    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: To,
      body: Body
    });

    recordMessage({
      direction: 'outgoing',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: To,
      body: Body,
      timestamp: new Date().toISOString(),
      messageSid: message.sid,
      realSMS: true
    });

    res.redirect('/');
  } catch (error) {
    console.error('❌ Twilio send error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/conversations', (req, res) => {
  res.json({
    conversations,
    conversationsByNumber: toSerializableMap(conversationsByNumber),
    total: conversations.length
  });
});

app.post('/api/clear', (req, res) => {
  conversations.length = 0;
  conversationsByNumber.clear();
  conversationsBySid.clear();
  res.json({ success: true });
});

app.get('/api/export', (req, res) => {
  res.json({
    exportedAt: new Date().toISOString(),
    stats: getConversationStats(),
    conversations,
    conversationsByNumber: toSerializableMap(conversationsByNumber)
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    mode: MODE,
    testMode: TEST_MODE,
    emmaWebhook: EMMA_WEBHOOK_URL,
    twilioConfigured: TWILIO_AVAILABLE,
    simulatedLatencyMs: SIMULATED_LATENCY_MS,
    timeoutMs: EMMA_TIMEOUT_MS,
    publicUrl: PUBLIC_URL,
    sampleNumbers: {
      US: generateTestNumber('US'),
      FR: generateTestNumber('FR'),
      CA: generateTestNumber('CA')
    }
  });
});

app.get('/api/scenarios', (req, res) => {
  res.json({ scenarios });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: MODE,
    testMode: TEST_MODE,
    conversations: conversations.length,
    webhook: EMMA_WEBHOOK_URL
  });
});

app.listen(PORT, () => {
  console.log('\n🚀 Emma SMS Server démarré');
  console.log(`📊 Dashboard: ${PUBLIC_URL}`);
  console.log(`🔗 Webhook Twilio: ${PUBLIC_URL}/webhook/sms`);
  console.log(`🧪 Mode: ${MODE.toUpperCase()}`);
  console.log(`🤖 Emma webhook: ${EMMA_WEBHOOK_URL}`);
  console.log(TWILIO_AVAILABLE ? '📞 Twilio prêt pour les SMS réels' : 'ℹ️ Twilio non configuré (mode test)');
});
