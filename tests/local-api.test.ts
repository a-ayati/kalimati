import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.LOCAL_TEST_URL;
test('local Worker: owner protection, quote sources, scheduling conflicts, hidden drafts', {skip:!base}, async()=>{
  const call=(path:string,method='GET',body?:unknown,cookie?:string,origin=base!)=>fetch(`${base}${path}`,{method,headers:{'content-type':'application/json',origin,...(cookie?{cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  assert.equal((await call('/api/admin/studio')).status,401);
  const login=await call('/api/admin/login','POST',{password:'local-test-only'});
  assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie')!.split(';')[0];
  assert.equal((await call('/api/admin/studio','GET',undefined,cookie)).status,200);
  assert.equal((await call('/api/admin/studio','POST',{},cookie,'https://other.example')).status,403);
  assert.equal((await call('/api/admin/studio','POST',{},cookie)).status,503);
  const quote={slug:`local-test-${Date.now()}`,text:'Local integration test quote.',plainText:'Local integration test quote.',author:'Test Author',language:'en',topics:['الأمل'],status:'draft',publishedAt:new Date().toISOString(),sourceNote:'Local test fixture'};
  const invalid=await call('/api/admin/quotes','POST',{...quote,sourceNote:''},cookie); assert.equal(invalid.status,400);
  const made=await call('/api/admin/quotes','POST',quote,cookie); assert.equal(made.status,201);
  const q=(await made.json() as any).quote;
  assert.equal(q.author,'Test Author');
  const pub=await call('/api/quotes');
  assert.ok(!(await pub.json() as any).quotes.some((a:any)=>a.id===q.id));
  const featured={...quote,status:'scheduled',featuredDate:'2099-01-01',publishedAt:'2099-01-01T10:00:00.000Z'};
  assert.equal((await call(`/api/admin/quotes/${q.id}`,'PUT',featured,cookie)).status,200);
  assert.equal((await call('/api/admin/quotes','POST',featured,cookie)).status,409);
  assert.equal((await call('/api/admin/quotes','POST',{...quote,featuredDate:'2099-13-99'},cookie)).status,400);
  const list=await call('/api/admin/quotes','GET',undefined,cookie);
  assert.equal((await list.json() as any).quotes.find((a:any)=>a.id===q.id).author,'Test Author');
  assert.equal((await call(`/api/admin/quotes/${q.id}`,'DELETE',undefined,cookie)).status,200);
});


test('local Worker: designer recipe, future schedule and retry deduplication', {skip:!base}, async()=>{
  const call=(path:string,method='GET',body?:unknown,cookie?:string)=>fetch(`${base}${path}`,{method,headers:{'content-type':'application/json',origin:base!,...(cookie?{cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const login=await call('/api/admin/login','POST',{password:'local-test-only'});
  const cookie=login.headers.get('set-cookie')!.split(';')[0];
  const text='لم يتأخر عُمرك، ما زال أمامك وقت.';
  const design={templateId:'hope-01',style:'cinematic',caption:'كابشن اختبار محلي',lines:['لم يتأخر عُمرك،','ما زال أمامك وقت.'],keyword:'وقت',color:'#FFB52E',translation:'THERE IS STILL TIME AHEAD.',background:'hope-01-hidden-v5'};
  const body={clientRequestId:crypto.randomUUID(),text,plainText:text,author:'شعيب المطوع',language:'fusha',topics:['الإلهام'],status:'scheduled',publishedAt:'2099-02-02T10:00:00Z',design,aiAssisted:true,sourceNote:'اختبار محلي'};
  assert.equal((await call('/api/admin/quotes','POST',body)).status,401);
  assert.equal((await call('/api/admin/quotes','POST',{...body,publishedAt:'2000-01-01'},cookie)).status,400);
  assert.equal((await call('/api/admin/quotes','POST',{...body,design:{...design,background:'https://external.test/x.jpg'}},cookie)).status,400);
  const made=await call('/api/admin/quotes','POST',body,cookie);assert.equal(made.status,201);
  const q=(await made.json() as any).quote;
  try {
    assert.deepEqual(q.design,design);assert.equal(q.status,'scheduled');
    const retry=await call('/api/admin/quotes','POST',body,cookie);assert.equal(retry.status,200);assert.equal((await retry.json() as any).quote.id,q.id);
    const list=(await (await call('/api/admin/quotes','GET',undefined,cookie)).json() as any).quotes;
    assert.equal(list.filter((x:any)=>x.id===q.id).length,1);assert.deepEqual(list.find((x:any)=>x.id===q.id).design,design);
    assert.ok(!(await (await call('/api/quotes')).json() as any).quotes.some((x:any)=>x.id===q.id));
  } finally { await call(`/api/admin/quotes/${q.id}`,'DELETE',undefined,cookie); }
});
