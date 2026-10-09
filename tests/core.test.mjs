import test from 'node:test';
import assert from 'node:assert/strict';
import {split,balances,settlements} from '../public/core.mjs';
const families=[{id:'a',people:2},{id:'b',people:3},{id:'c',people:1}];
test('reparto por personas y conservación de céntimos',()=>{assert.deepEqual(split(600,families,'people'),{a:200,b:300,c:100});for(let c=1;c<1000;c++)assert.equal(Object.values(split(c,families,'people')).reduce((a,b)=>a+b,0),c);});
test('reparto igual y participantes seleccionados',()=>{assert.deepEqual(split(100,families),{a:34,b:33,c:33});assert.deepEqual(split(101,[families[1],families[2]]),{b:51,c:50});});
test('saldos y devoluciones',()=>{const s={families,expenses:[{payer:'a',cents:600,shares:split(600,families,'people')}],payments:[]};assert.deepEqual(balances(s),{a:400,b:-300,c:-100});s.payments=settlements(s);assert.deepEqual(balances(s),{a:0,b:0,c:0});assert.deepEqual(settlements(s),[]);});
test('rechaza importes y grupos inválidos',()=>{assert.throws(()=>split(0,families));assert.throws(()=>split(1,[]));assert.throws(()=>split(1,[{id:'a',people:0}],'people'));});
