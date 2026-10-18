import test from 'node:test';
import assert from 'node:assert/strict';
import { handleStudio } from '../worker/studio.ts';
const payload={mode:'generate',word:'الغياب',text:'',count:5,language:'fusha',tone:'دافئة',length:'قصيرة'};
const req=(body:unknown)=>new Request('https://example.com/api/admin/studio',{method:'POST',body:JSON.stringify(body)});
test('unconfigured AI is explicit and does not fabricate suggestions', async()=>{
  const response=await handleStudio(req(payload),{});
  assert.equal(response.status,503);
});
test('validates requests before invoking provider', async()=>{
  let called=false;
  const env={AI:{run:async()=>{called=true;}}} as any;
  assert.equal((await handleStudio(req({...payload,count:100}),env)).status,400);
  assert.equal((await handleStudio(req({...payload,mode:'refine'}),env)).status,400);
  assert.equal(called,false);
});
test('parses provider output, deduplicates and never publishes', async()=>{
  let prompt='';
  const env={AI:{run:async(_m:string,input:any)=>{prompt=input.messages[0].content;return {response:'```json\n{"suggestions":["نص أول","نص ثان","نص أول"]}\n```'};}}} as any;
  const response=await handleStudio(req(payload),env);
  assert.equal(response.status,200);
  assert.deepEqual((await response.json() as any).suggestions,['نص أول','نص ثان']);
  assert.match(prompt,/لا تخترع مصادر/);
});
test('provider failure returns actionable error without pretending success',async()=>{
  const env={AI:{run:async()=>({response:'bad json'})}} as any;
  assert.equal((await handleStudio(req(payload),env)).status,502);
});
