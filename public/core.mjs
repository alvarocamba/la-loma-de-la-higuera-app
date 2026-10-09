export function split(cents, families, mode='equal') {
  if (!Number.isSafeInteger(cents) || cents <= 0 || !families.length) throw Error('Importe o participantes no válidos');
  const weights = families.map(f => mode === 'people' ? f.people : 1);
  if (weights.some(w => !Number.isInteger(w) || w < 1)) throw Error('Número de personas no válido');
  const sum = weights.reduce((a,b)=>a+b,0);
  const parts = weights.map(w=>Math.floor(cents*w/sum));
  const order = weights.map((w,i)=>({i,remainder:cents*w%sum})).sort((a,b)=>b.remainder-a.remainder || a.i-b.i);
  for(let i=0,left=cents-parts.reduce((a,b)=>a+b,0);i<left;i++) parts[order[i].i]++;
  return Object.fromEntries(families.map((f,i)=>[f.id,parts[i]]));
}
export function balances(state) {
  const b=Object.fromEntries(state.families.map(f=>[f.id,0]));
  for(const e of state.expenses){ b[e.payer]+=e.cents; for(const [id,c] of Object.entries(e.shares)) b[id]-=c; }
  for(const p of state.payments){b[p.from]+=p.cents;b[p.to]-=p.cents;}
  return b;
}
export function settlements(state) {
  const b=balances(state), debt=Object.entries(b).filter(([,v])=>v<0).map(([id,v])=>({id,n:-v})), credit=Object.entries(b).filter(([,v])=>v>0).map(([id,v])=>({id,n:v}));
  const result=[]; let i=0,j=0;
  while(i<debt.length&&j<credit.length){const cents=Math.min(debt[i].n,credit[j].n); result.push({from:debt[i].id,to:credit[j].id,cents});debt[i].n-=cents;credit[j].n-=cents;if(!debt[i].n)i++;if(!credit[j].n)j++;}
  return result;
}
