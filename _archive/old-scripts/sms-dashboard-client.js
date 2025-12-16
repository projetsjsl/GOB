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