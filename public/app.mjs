import {validate} from './validation.mjs';
import {initialState,FAMILIES} from './families.mjs';
import {split,balances,settlements} from './core.mjs';
const $=s=>document.querySelector(s), money=c=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(c/100), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const blank=initialState, id=()=>crypto.randomUUID(), today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
let state=blank(),cloud=null,editing=null,busy=false,remoteRequired=true,ready=false;
const trip=JSON.parse(sessionStorage.getItem('loma-access-v1')).trip;
const storageKey='loma-v1-'+trip;
let selected='';try{selected=localStorage.getItem('loma-selected-family')||'';}catch{}
try{state=validate(JSON.parse(localStorage.getItem(storageKey))) }catch{}
function toast(msg){$('#toast').textContent=msg;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,5000);}
async function change(fn){if(busy)return; if(!navigator.onLine&&remoteRequired){toast('Sin conexión: espera antes de guardar.');return false;}if(!ready||(remoteRequired&&!cloud)){toast('Espera a la conexión para guardar cambios.');return false;}busy=true;try{if(cloud){await cloud.runTransaction(cloud.db,async tx=>{const snap=await tx.get(cloud.ref);const next=snap.exists()?validate(snap.data().data):blank();fn(next);validate(next);tx.set(cloud.ref,{data:next,updatedAt:cloud.serverTimestamp()});});}else{const next=structuredClone(state);fn(next);validate(next);localStorage.setItem(storageKey,JSON.stringify(next));state=next;render();}return true;}catch(e){toast('No se ha guardado: '+e.message);return false;}finally{busy=false;}}
const name=k=>state.families.find(f=>f.id===k)?.name||'Familia';

function initials(n){return n.split(/[ -]/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
function renderDashboard(b){
 const n=state.families.reduce((a,f)=>a+f.people,0), summary=`${state.families.length} familias · ${n} personas`;
 $('#peopleCount').textContent=`${n} personas compartiendo el plan`;$('#travelersSummary').textContent=summary+' · Un mismo viaje';$('#groupSummary').textContent=summary;
 $('#expenseCount').textContent=`${state.expenses.length} gastos registrados`;
 const options=state.families.map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('');
 const filter=$('#payerFilter').value;$('#payerFilter').innerHTML='<option value="">Todas las familias</option>'+options;$('#payerFilter').value=filter;
 const access=$('#accessFamily').value;$('#accessFamily').innerHTML='<option value="">Selecciona tu familia</option>'+options;$('#accessFamily').value=access||selected;
 const f=state.families.find(f=>f.id===selected);$('#access').hidden=!!f;$('#app').hidden=!f;
 if(f){$('#profileName').textContent=f.name;$('#profileInitials').textContent=initials(f.name);}
 $('#recentExpenses').innerHTML=[...state.expenses].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4).map(e=>`<div class="row"><span class="icon">€</span><div class="grow"><strong>${esc(e.title)}</strong><small>${esc(name(e.payer))} · ${esc(e.date.split('-').reverse().join('/'))}</small></div><strong class="amount">${money(e.cents)}</strong><button data-edit="${esc(e.id)}">Editar</button></div>`).join('')||'<p class="empty">El primer recuerdo ya está. Falta el primer gasto.</p>';
 $('#overviewBalances').innerHTML=state.families.map(f=>`<div class="row"><span class="avatar">${esc(initials(f.name))}</span><div class="grow"><strong>${esc(f.name)}</strong><small>${b[f.id]>0?'Recibe':b[f.id]<0?'Paga':'Al día'}</small></div><strong class="${b[f.id]<0?'negative':'positive'}">${money(Math.abs(b[f.id]))}</strong></div>`).join('');
 $('#categorySummary').innerHTML=['Comida','Alojamiento','Transporte','Actividades','Otros'].map(c=>`<div class="category-item"><span>${c}</span><strong>${money(state.expenses.filter(e=>e.category===c).reduce((a,e)=>a+e.cents,0))}</strong></div>`).join('');
}
$('#accessForm').onsubmit=e=>{e.preventDefault();selected=$('#accessFamily').value;try{localStorage.setItem('loma-selected-family',selected);}catch{}render();$('#addExpense').focus();};
function exit(){selected='';try{localStorage.removeItem('loma-selected-family');}catch{}render();$('#accessFamily').focus();}
$('#exit').onclick=exit;$('#profile').onclick=exit;
document.querySelectorAll('.brand').forEach(a=>a.onclick=e=>{e.preventDefault();document.querySelector('[data-tab="overview"]').click();});

function render(){
 $('#total').textContent=money(state.expenses.reduce((a,e)=>a+e.cents,0));$('#familyCount').textContent=state.families.length;const b=balances(state);$('#pending').textContent=money(Object.values(b).filter(n=>n>0).reduce((a,n)=>a+n,0));
 renderDashboard(b);
 const q=$('#search').value.toLowerCase();const expenses=state.expenses.filter(e=>(e.title+' '+name(e.payer)+' '+e.category).toLowerCase().includes(q)&&(!$('#categoryFilter').value||e.category===$('#categoryFilter').value)&&(!$('#payerFilter').value||e.payer===$('#payerFilter').value)).sort((a,b)=>b.date.localeCompare(a.date));
 $('#expenseList').innerHTML=expenses.map(e=>`<article class="row"><span class="icon">${({Comida:'🍋',Alojamiento:'⌂',Transporte:'↗',Actividades:'☀'})[e.category]||'◒'}</span><div class="grow"><strong>${esc(e.title)}</strong><small>${esc(e.date.split('-').reverse().join('/'))} · ${esc(e.category)} · Pagó ${esc(name(e.payer))}</small><small>${esc(e.mode==='people'?'Por personas':'Por familias')} · ${Object.keys(e.shares).length} familias${e.note?' · '+esc(e.note):''}</small></div><strong class="amount">${money(e.cents)}</strong><button data-edit="${esc(e.id)}">Editar</button><button data-delete="${esc(e.id)}" aria-label="Eliminar ${esc(e.title)}">✕</button></article>`).join('')||'<div class="empty">Todavía no hay gastos. Añade las familias y registra el primero.</div>';
 $('#filteredTotal').textContent=`${expenses.length} gastos · ${money(expenses.reduce((a,e)=>a+e.cents,0))}`;
 $('#familyList').innerHTML=state.families.map(f=>`<article class="family-card"><span class="avatar">${esc(initials(f.name))}</span><h3>${esc(f.name)}</h3><p>${esc(f.members||'Familia invitada')}</p><span>${f.people} personas</span>${FAMILIES.some(x=>x.id===f.id)?'':`<div class="family-actions"><button data-family-edit="${esc(f.id)}">Editar</button><button data-family-delete="${esc(f.id)}">Eliminar</button></div>`}</article>`).join('');
 $('#balanceList').innerHTML=state.families.map(f=>`<div class="row"><div class="grow"><strong>${esc(f.name)}</strong><small>${b[f.id]>0?'Tiene que recibir':b[f.id]<0?'Tiene que pagar':'Está al día'}</small></div><strong class="amount ${b[f.id]<0?'negative':'positive'}">${money(Math.abs(b[f.id]))}</strong></div>`).join('');
 $('#settlementList').innerHTML=settlements(state).map(p=>`<div class="row"><div class="grow"><strong>${esc(name(p.from))} → ${esc(name(p.to))}</strong><small>Transferencia o efectivo</small></div><strong>${money(p.cents)}</strong><button data-settle="${esc(p.from)}" data-to="${esc(p.to)}" data-cents="${p.cents}" class="primary">Registrar pago</button></div>`).join('')||'<div class="empty">Todo está saldado.</div>';
 $('#paymentList').innerHTML=state.payments.map(p=>`<div class="row"><div class="grow"><strong>${esc(name(p.from))} → ${esc(name(p.to))}</strong><small>${esc(p.date)}</small></div><strong>${money(p.cents)}</strong><button data-payment-delete="${esc(p.id)}">Deshacer</button></div>`).join('')||'<p class="muted">Aún no se han registrado devoluciones.</p>';
 $('#sharingInfo').textContent=cloud?'Los cambios se sincronizan entre los móviles. Quien conozca la palabra del grupo puede ver y editar todas las cuentas: compártela solo con las familias.':'Modo local: los datos se guardan únicamente en este navegador. Compartir entre móviles estará disponible cuando se conecte Firebase.';$('#share').disabled=!cloud||!ready;if(remoteRequired&&!cloud)$('#sharingInfo').textContent='Conectando con el viaje compartido. Los cambios estarán disponibles cuando se restablezca la conexión.';
}
document.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{ $('#pageLabel').textContent=({overview:'Resumen',expenses:'Gastos',balances:'Saldos y pagos',families:'Familias',settings:'Compartir y copias'})[btn.dataset.tab];document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===btn.dataset.tab));document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==btn.dataset.tab);});
$('#search').oninput=render;$('#categoryFilter').onchange=render;$('#payerFilter').onchange=render;
$('#familyForm').onsubmit=async ev=>{ev.preventDefault();const f=ev.target;const n=f.elements.name.value.trim();if(!n)return;if(await change(s=>s.families.push({id:id(),name:n,people:Number(f.elements.people.value)})))f.reset();};
function amount(text){if(!/^\d+([.,]\d{1,2})?$/.test(text))throw Error('Introduce un importe con hasta dos decimales');const [a,b='']=text.replace(',','.').split('.');const cents=Number(a)*100+Number(b.padEnd(2,'0'));if(!Number.isSafeInteger(cents)||cents<1||cents>100000000)throw Error('Importe fuera de rango');return cents;}
function openExpense(key){if(!state.families.length){toast('Añade primero las familias del viaje');$('[data-tab="families"]').click();return;}editing=key||null;const e=state.expenses.find(e=>e.id===key);const f=$('#expenseForm');f.reset();$('#dialogTitle').textContent=e?'Editar gasto':'Nuevo gasto';f.elements.payer.innerHTML=state.families.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');f.elements.date.value=e?.date||today();f.elements.mode.value=e?.mode||'equal';if(!e&&selected)f.elements.payer.value=selected;if(e){for(const k of ['title','payer','category','note'])f.elements[k].value=e[k];f.elements.amount.value=(e.cents/100).toFixed(2);}
 $('#participants').innerHTML=state.families.map(x=>`<label><input type="checkbox" value="${esc(x.id)}" ${!e||x.id in e.shares?'checked':''}>${esc(x.name)} · ${x.people} personas</label>`).join('');$('#formError').textContent='';preview();$('#expenseDialog').showModal();}
function preview(){$('#participantCount').textContent=`(${$('#participants').querySelectorAll(':checked').length})`;try{const f=$('#expenseForm'),families=state.families.filter(x=>[...$('#participants').querySelectorAll(':checked')].some(c=>c.value===x.id)),shares=split(amount(f.elements.amount.value),families,f.elements.mode.value);$('#splitPreview').textContent=Object.entries(shares).map(([k,v])=>name(k)+': '+money(v)).join(' · ');}catch{$('#splitPreview').textContent='Elige participantes y un importe para ver el reparto.';}}
$('#selectAll').onclick=()=>{$('#participants').querySelectorAll('input').forEach(x=>x.checked=true);preview();};$('#selectNone').onclick=()=>{$('#participants').querySelectorAll('input').forEach(x=>x.checked=false);preview();};document.querySelectorAll('[data-new-expense]').forEach(x=>x.onclick=()=>openExpense());
$('#expenseForm').oninput=preview;$('#addExpense').onclick=()=>openExpense();$('#close').onclick=()=>$('#expenseDialog').close();
$('#expenseForm').onsubmit=async ev=>{ev.preventDefault();try{const f=ev.target,families=state.families.filter(x=>[...$('#participants').querySelectorAll(':checked')].some(c=>c.value===x.id));const cents=amount(f.elements.amount.value),e={id:editing||id(),title:f.elements.title.value.trim(),cents,date:f.elements.date.value,payer:f.elements.payer.value,category:f.elements.category.value,mode:f.elements.mode.value,note:f.elements.note.value.trim(),shares:split(cents,families,f.elements.mode.value)};if(await change(s=>{if(!s.families.some(x=>x.id===e.payer)||Object.keys(e.shares).some(k=>!s.families.some(x=>x.id===k)))throw Error('Las familias han cambiado; vuelve a abrir el gasto');const i=s.expenses.findIndex(x=>x.id===e.id);if(editing&&i<0)throw Error('El gasto ya se eliminó');if(i>=0)s.expenses[i]=e;else s.expenses.push(e);})){ $('#expenseDialog').close();toast('Gasto guardado');}}catch(e){$('#formError').textContent=e.message;}};
document.body.addEventListener('click',async ev=>{const btn=ev.target.closest('button');if(!btn)return;const d=btn.dataset;
 if(d.edit)openExpense(d.edit);
 if(d.delete&&confirm('¿Eliminar este gasto?'))await change(s=>s.expenses=s.expenses.filter(e=>e.id!==d.delete));
 if(d.familyDelete&&FAMILIES.some(f=>f.id===d.familyDelete))return;
 if(d.familyEdit&&FAMILIES.some(f=>f.id===d.familyEdit))return;
 if(d.familyDelete&&confirm('¿Eliminar esta familia? Solo se puede si no tiene gastos ni pagos.'))await change(s=>{if(s.expenses.some(e=>e.payer===d.familyDelete||d.familyDelete in e.shares)||s.payments.some(p=>p.from===d.familyDelete||p.to===d.familyDelete))throw Error('Esta familia tiene gastos o pagos asociados');s.families=s.families.filter(f=>f.id!==d.familyDelete);});
 if(d.familyEdit){const f=state.families.find(x=>x.id===d.familyEdit),n=prompt('Nombre de la familia',f.name);if(n===null)return;const p=prompt('Número de personas (solo afecta a los nuevos repartos)',f.people);if(p===null)return;await change(s=>{const x=s.families.find(x=>x.id===d.familyEdit);if(!x)throw Error('Familia eliminada');x.name=n.trim();x.people=Number(p);});}
 if(d.settle&&confirm(`¿Confirmas que ${name(d.settle)} ha pagado ${money(Number(d.cents))} a ${name(d.to)}?`))await change(s=>{const b=balances(s),c=Number(d.cents);if(b[d.settle]>-c||b[d.to]<c)throw Error('Los saldos han cambiado; revisa la propuesta actual');s.payments.push({id:id(),from:d.settle,to:d.to,cents:c,date:today()});});
 if(d.paymentDelete&&confirm('¿Deshacer este pago registrado?'))await change(s=>s.payments=s.payments.filter(p=>p.id!==d.paymentDelete));
});
function download(content,type,filename){const u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=u;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('#export').onclick=()=>download(JSON.stringify(state,null,2),'application/json','la-loma-copia.json');
$('#csv').onclick=()=>{const cell=v=>'"'+String(v).replace(/"/g,'""').replace(/^[=+@\-]/,"'$&")+'"';const rows=[['Fecha','Concepto','Categoría','Pagado por','Euros','Reparto','Nota'],...state.expenses.map(e=>[e.date,e.title,e.category,name(e.payer),(e.cents/100).toFixed(2),Object.entries(e.shares).map(([k,v])=>name(k)+': '+money(v)).join(' / '),e.note])];download('\ufeff'+rows.map(r=>r.map(cell).join(';')).join('\r\n'),'text/csv;charset=utf-8','la-loma-gastos.csv');};
$('#import').onchange=async ev=>{try{const file=ev.target.files[0];if(!file)return;if(file.size>1000000)throw Error('Archivo demasiado grande');const data=validate(JSON.parse(await file.text()));if(confirm('¿Sustituir los datos del viaje por esta copia?'))await change(s=>Object.assign(s,data));}catch(e){toast(e.message);}ev.target.value='';};
$('#lock').onclick=()=>{try{localStorage.removeItem('loma-selected-family');}catch{}sessionStorage.removeItem('loma-access-v1');location.reload();};
$('#share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast('Enlace copiado');}catch{prompt('Copia este enlace',location.href);}};
render();
async function connect(){
 try{
 const r=await fetch('firebase-config.json');if(!r.ok)throw Error('No se pudo cargar la configuración');const config=await r.json();
 if(!config.projectId){remoteRequired=false;ready=true;status('Modo local · solo este navegador');render();return;}
 if(!config.apiKey||!config.appId||!config.authDomain)throw Error('Configuración incompleta');
 status('Conectando…');
 const [{initializeApp},{getAuth,signInAnonymously},{getFirestore,doc,onSnapshot,runTransaction,serverTimestamp}]=await Promise.all([import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')]);
 const app=initializeApp(config);await signInAnonymously(getAuth(app));const db=getFirestore(app),ref=doc(db,'trips',trip);
 await runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())tx.set(ref,{data:validate(structuredClone(state)),updatedAt:serverTimestamp()});});
 cloud={db,ref,runTransaction,serverTimestamp};
 onSnapshot(ref,{includeMetadataChanges:true},snap=>{try{
 if(!snap.exists())throw Error('El viaje no está disponible');state=validate(snap.data().data);ready=!snap.metadata.fromCache;
 $('#share').disabled=!ready;status(ready?'Sincronizado · Firebase':'Sin conexión · solo lectura');render();
 }catch(e){ready=false;toast(e.message);}},e=>{ready=false;status('Sin conexión · solo lectura');toast('Firebase: '+e.message);});
 }catch(e){ready=false;status('No se ha podido conectar');toast('No se ha conectado Firebase: '+e.message);}
}
window.addEventListener('offline',()=>{if(remoteRequired){ready=false;status('Sin conexión · solo lectura');}});
function status(text){$('#status').textContent=text;$('#accessStatus').textContent=text;$('#status').classList.toggle('synced',text.startsWith('Sincronizado'));}
connect();
