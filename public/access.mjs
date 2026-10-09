import {unlockInvitation} from './access-crypto.mjs';
const form=document.querySelector('#wordForm'),error=document.querySelector('#accessError');
const cacheKey='loma-access-v1';
async function enter(trip){
 sessionStorage.setItem(cacheKey,JSON.stringify({trip,expiresAt:Date.now()+12*60*60*1000}));
 // El identificador es una capacidad secreta: nunca se incluye en el enlace compartido.
 if(location.hash)history.replaceState(null,'',location.pathname+location.search);
 await import('./app.mjs');form.hidden=true;document.querySelector('#accessForm').hidden=false;
 document.querySelector('#accessFamily').focus();
}
form.onsubmit=async e=>{e.preventDefault();error.textContent='';const button=form.querySelector('button');button.disabled=true;button.textContent='Entrando…';
 try{const r=await fetch('access-config.json',{cache:'no-store'});if(!r.ok)throw Error('config');const config=await r.json();let trip;
 try{trip=await unlockInvitation(form.elements.password.value,config);}catch{error.textContent='Esa palabra no es correcta. Prueba de nuevo.';form.elements.password.focus();return;}
 form.reset();await enter(trip);
 }catch{error.textContent='No se ha podido abrir el viaje. Revisa la conexión y permite el almacenamiento del navegador.';}
 finally{button.disabled=false;button.textContent='Entrar al viaje ↗';}
};
try{const cached=JSON.parse(sessionStorage.getItem(cacheKey));if(cached?.expiresAt>Date.now()&&/^[a-f0-9]{48}$/.test(cached.trip))await enter(cached.trip);}catch{sessionStorage.removeItem(cacheKey);}
