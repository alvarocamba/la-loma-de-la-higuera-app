const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export function normalizePassword(value){return String(value??'').trim().toLocaleLowerCase('es');}
export async function unlockInvitation(password,config){
 if(config.version!==1||config.iterations!==600000)throw Error('Configuración de acceso no válida');
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(normalizePassword(password)),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:bytes(config.salt),iterations:config.iterations},material,{name:'AES-GCM',length:256},false,['decrypt']);
 const decrypted=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(config.iv)},key,bytes(config.ciphertext));
 const trip=new TextDecoder().decode(decrypted);if(!/^[a-f0-9]{48}$/.test(trip))throw Error('Invitación no válida');return trip;
}
