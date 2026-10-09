// Run with LOMA_ACCESS_PASSWORD in the environment. Never commit the password.
// By default preserves the existing trip; rotating the trip requires migrating its data.
import {readFile,writeFile} from 'node:fs/promises';
import {unlockInvitation,normalizePassword} from '../public/access-crypto.mjs';
const password=normalizePassword(process.env.LOMA_ACCESS_PASSWORD);
if(!password||password.length<8)throw Error('Define LOMA_ACCESS_PASSWORD con al menos 8 caracteres');
let trip;
try{const existing=JSON.parse(await readFile('public/access-config.json','utf8'));trip=await unlockInvitation(process.env.LOMA_OLD_PASSWORD||password,existing);}catch(e){if(e.code!=='ENOENT')throw Error('No se pudo abrir la invitación existente. Define LOMA_OLD_PASSWORD para conservar el viaje.');}
trip??=Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString('hex');
const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:600000},material,{name:'AES-GCM',length:256},false,['encrypt']);
const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(trip));const b64=x=>Buffer.from(x).toString('base64');
await writeFile('public/access-config.json',JSON.stringify({version:1,iterations:600000,salt:b64(salt),iv:b64(iv),ciphertext:b64(ciphertext)},null,2)+'\n');console.log('Invitación cifrada guardada; no se ha mostrado la palabra ni el identificador del viaje.');
