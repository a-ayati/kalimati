import test from 'node:test';
import assert from 'node:assert/strict';
import {createECDH,randomBytes,hkdfSync,createDecipheriv,createPublicKey,verify} from 'node:crypto';
import {buildWebPushRequest} from '../worker/webPush.ts';
async function fixture(){
  const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  const jwk=await crypto.subtle.exportKey('jwk',pair.privateKey);
  const user=createECDH('prime256v1');user.generateKeys();const auth=randomBytes(16);
  return {jwk,user,auth,sub:{endpoint:'https://web.push.apple.com/test',p256dh:user.getPublicKey().toString('base64url'),auth:auth.toString('base64url')}};
}
test('RFC8291 aes128gcm decrypts independently using Node crypto, including Arabic text',async()=>{
  const {jwk,user,auth,sub}=await fixture();const payload={title:'كلمة اليوم',body:'حِكْمَةٌ لَكَ',url:'https://example.com/q/test'};
  const out=await buildWebPushRequest(jwk,sub,payload);
  assert.equal(out.headers.get('content-encoding'),'aes128gcm');
  assert.equal(out.headers.has('Topic'),false,'Omit optional Topic: Apple rejects nonconforming values with BadWebPushTopic');
  assert.equal(out.headers.has('Encryption'),false);assert.equal(out.headers.has('Crypto-Key'),false);
  const body=Buffer.from(out.body); assert.ok(body.length<=4096);assert.equal(body.readUInt32BE(16),4096);assert.equal(body[20],65);
  const salt=body.subarray(0,16),server=body.subarray(21,86),cipher=body.subarray(86);
  const secret=user.computeSecret(server);
  const ikm=Buffer.from(hkdfSync('sha256',secret,auth,Buffer.concat([Buffer.from('WebPush: info\0'),user.getPublicKey(),server]),32));
  const key=Buffer.from(hkdfSync('sha256',ikm,salt,Buffer.from('Content-Encoding: aes128gcm\0'),16));
  const nonce=Buffer.from(hkdfSync('sha256',ikm,salt,Buffer.from('Content-Encoding: nonce\0'),12));
  const decrypt=createDecipheriv('aes-128-gcm',key,nonce);decrypt.setAuthTag(cipher.subarray(-16));
  const clear=Buffer.concat([decrypt.update(cipher.subarray(0,-16)),decrypt.final()]);assert.equal(clear[clear.length-1],2);
  assert.deepEqual(JSON.parse(clear.subarray(0,-1).toString('utf8')),payload);
});
test('RFC8292 VAPID signature, audience, expiry and public key are valid',async()=>{
  const {jwk,sub}=await fixture();const out=await buildWebPushRequest(jwk,sub,{body:'test'});
  const header=out.headers.get('authorization')!;const match=/^vapid t=([^,]+), k=(.+)$/.exec(header)!;assert.ok(match);
  const [h,p,sig]=match[1].split('.');const claims=JSON.parse(Buffer.from(p,'base64url').toString());
  assert.equal(claims.aud,'https://web.push.apple.com');assert.ok(claims.exp>Date.now()/1000);assert.ok(claims.exp<Date.now()/1000+86400);
  const {d,...publicJwk}=jwk;
  assert.equal(verify('sha256',Buffer.from(`${h}.${p}`),{key:createPublicKey({key:publicJwk,format:'jwk'}),dsaEncoding:'ieee-p1363'},Buffer.from(sig,'base64url')),true);
  assert.equal(Buffer.from(match[2],'base64url').length,65);
});
test('rejects invalid keys and payloads exceeding the single-record service limit',async()=>{
  const {jwk,sub}=await fixture();await assert.rejects(buildWebPushRequest(jwk,{...sub,auth:'AA'},{body:'test'}),/invalid_subscription_keys/);
  await assert.rejects(buildWebPushRequest(jwk,sub,{body:'x'.repeat(4000)}),/push_payload_too_large/);
});
