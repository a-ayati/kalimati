import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyKind, dailyQuote } from '../shared/daily.ts';
import { nextInCycle, takeZenQuote } from '../src/lib/zenCycle.ts';

test('daily rotation repeats original → world → folk across year boundaries', () => {
  assert.deepEqual([18,19,20,21].map(d=>dailyKind(2026,10,d)), ['original','world','folk','original']);
  const sequence=[dailyKind(2026,12,31),dailyKind(2027,1,1),dailyKind(2027,1,2)];
  assert.equal(new Set(sequence).size,3);
});
test('same selection for push and reading independent of database ordering; explicit date wins', () => {
  const quotes=[{id:'f',slug:'f',language:'fusha',author:'Writer'}, {id:'w',slug:'w',language:'en',author:'Author'}, {id:'p',slug:'p',language:'darja',author:'تراث شعبي'}];
  assert.equal(dailyQuote(quotes,2026,10,19)?.id,'w');
  assert.equal(dailyQuote([...quotes].reverse(),2026,10,19)?.id,'w');
  assert.equal(dailyQuote([{...quotes[0],featuredDate:'2026-10-19'},...quotes.slice(1)],2026,10,19)?.id,'f');
  assert.equal(dailyQuote([],2026,10,19),undefined);
  assert.equal(dailyQuote([quotes[0]],2026,10,19)?.id,'f');
});
test('zen visits every quote once, prevents boundary repeat for 100 cycles', () => {
  let state; let last;
  for(let cycle=0;cycle<100;cycle++) {
    const found=[];
    for(let i=0;i<5;i++) {
      const result=nextInCycle(['a','b','c','d','e'],state);
      if(i===0) assert.notEqual(result.id,last);
      found.push(result.id); last=result.id; state=result.state;
    }
    assert.equal(new Set(found).size,5);
  }
});
test('zen handles newly published, removed, single and corrupt state', () => {
  assert.equal(nextInCycle(['a','b','c'],{seen:['a','b'],last:'b'},()=>0).id,'c');
  assert.equal(nextInCycle(['a'],{seen:['removed'],last:'removed'}).id,'a');
  assert.equal(nextInCycle(['a'],{seen:['a'],last:'a'}).id,'a');
  assert.equal(nextInCycle([],undefined).id,undefined);
  assert.equal(nextInCycle(['a'],{seen:null} as any).id,'a');
});
test('zen progress persists across calls; scopes independent', () => {
  const map=new Map();
  (globalThis as any).localStorage={getItem:(k:string)=>map.get(k),setItem:(k:string,v:string)=>map.set(k,v)};
  const ids=['a','b','c']; const seen=ids.map(()=>takeZenQuote(ids,'test-all'));
  assert.equal(new Set(seen).size,3);
  assert.notEqual(takeZenQuote(ids,'test-all'),seen[2]);
  assert.ok(takeZenQuote(['x'],'test-saved'));
});
