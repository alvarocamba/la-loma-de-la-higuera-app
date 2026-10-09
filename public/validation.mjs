import {FAMILIES} from './families.mjs';
export const categories=['Comida','Alojamiento','Transporte','Actividades','Otros'];
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const key=v=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9-]{0,79}$/.test(v)&&!['constructor','prototype','__proto__'].includes(v);
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const amount=v=>Number.isSafeInteger(v)&&v>0&&v<=100000000;
export function validate(s){
 if(!object(s)||!Array.isArray(s.families)||!Array.isArray(s.expenses)||!Array.isArray(s.payments)||s.families.length>50||s.expenses.length>1000||s.payments.length>1000)throw Error('Copia no válida o demasiado grande');
 const ids=new Set();
 const families=s.families.map(f=>{if(!object(f)||!key(f.id)||ids.has(f.id)||!text(f.name,60)||!Number.isInteger(f.people)||f.people<1||f.people>50||(f.members!==undefined&&(typeof f.members!=='string'||f.members.length>300)))throw Error('Familia no válida');ids.add(f.id);return {id:f.id,name:f.name,people:f.people,...(f.members!==undefined?{members:f.members}:{}),...(f.adults!==undefined?{adults:f.adults}:{})};});
 for(const f of FAMILIES){const found=families.find(x=>x.id===f.id);if(!found||found.name!==f.name||found.people!==f.people||found.members!==f.members)throw Error('La copia debe conservar las siete familias iniciales y sus integrantes');}
 const entries=new Set();
 const expenses=s.expenses.map(e=>{if(!object(e)||!key(e.id)||entries.has(e.id)||!ids.has(e.payer)||!text(e.title,100)||typeof e.note!=='string'||e.note.length>300||!categories.includes(e.category)||!date(e.date)||!amount(e.cents)||!object(e.shares)||!['equal','people'].includes(e.mode))throw Error('Gasto no válido');entries.add(e.id);const shares=Object.entries(e.shares);if(!shares.length||shares.some(([k,v])=>!ids.has(k)||!Number.isSafeInteger(v)||v<0)||shares.reduce((a,[,v])=>a+v,0)!==e.cents)throw Error('Reparto no válido');return {id:e.id,payer:e.payer,title:e.title,note:e.note,category:e.category,date:e.date,cents:e.cents,mode:e.mode,shares:Object.fromEntries(shares)};});
 const payments=s.payments.map(p=>{if(!object(p)||!key(p.id)||entries.has(p.id)||!ids.has(p.from)||!ids.has(p.to)||p.from===p.to||!amount(p.cents)||!date(p.date))throw Error('Pago no válido');entries.add(p.id);return {id:p.id,from:p.from,to:p.to,cents:p.cents,date:p.date};});
 const result={families,expenses,payments};if(new TextEncoder().encode(JSON.stringify(result)).length>750000)throw Error('El viaje supera el tamaño máximo de 750 kB');return result;
}
