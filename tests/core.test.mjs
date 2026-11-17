import test from 'node:test';
import assert from 'node:assert/strict';
import {split,balances,settlements} from '../public/core.mjs';
const families=[{id:'a',people:2},{id:'b',people:3},{id:'c',people:1}];
test('reparto por personas y conservación de céntimos',()=>{assert.deepEqual(split(600,families,'people'),{a:200,b:300,c:100});for(let c=1;c<1000;c++)assert.equal(Object.values(split(c,families,'people')).reduce((a,b)=>a+b,0),c);});
test('reparto igual y participantes seleccionados',()=>{assert.deepEqual(split(100,families),{a:34,b:33,c:33});assert.deepEqual(split(101,[families[1],families[2]]),{b:51,c:50});});
test('saldos y devoluciones',()=>{const s={families,expenses:[{payer:'a',cents:600,shares:split(600,families,'people')}],payments:[]};assert.deepEqual(balances(s),{a:400,b:-300,c:-100});s.payments=settlements(s);assert.deepEqual(balances(s),{a:0,b:0,c:0});assert.deepEqual(settlements(s),[]);});
test('rechaza importes y grupos inválidos',()=>{assert.throws(()=>split(0,families));assert.throws(()=>split(1,[]));assert.throws(()=>split(1,[{id:'a',people:0}],'people'));});

test('niños a mitad conservan céntimos y liquidan los gastos reales',()=>{
 const fs=[{id:'j',people:5,adults:2},{id:'c',people:4,adults:2},{id:'s',people:4,adults:2},{id:'p',people:2,adults:2},{id:'l',people:4,adults:2},{id:'f',people:4,adults:2},{id:'r',people:3,adults:2}];
 const entries=[[2,27800],[0,16400],[6,8683],[3,7335],[3,7163],[5,54500],[3,3000],[1,12263],[1,3029],[1,4240],[4,20830]];
 const s={families:fs,expenses:entries.map(([i,cents])=>({payer:fs[i].id,cents,shares:split(cents,fs,'children-half')})),payments:[]};
 assert.deepEqual(Object.values(balances(s)),[-12519,-5257,3012,974,-3954,29716,-11972]);
 const bs=Object.values(balances(s));
 // No proper subset sums to zero, so seven nonzero balances need at least six payments.
 for(let mask=1;mask<(1<<7)-1;mask++)assert.notEqual(bs.reduce((sum,b,i)=>sum+((mask>>i)&1?b:0),0),0);
 s.payments=settlements(s);assert.equal(s.payments.length,6);assert.ok(Object.values(balances(s)).every(b=>b===0));
});
