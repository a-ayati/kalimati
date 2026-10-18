import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePushTime,validatePushSubscription} from '../worker/pushValidation.ts';
const body={subscription:{endpoint:'https://web.push.apple.com/token',keys:{p256dh:'test-public-key',auth:'test-auth'}},time:'18:40',tz:'Asia/Qatar'};
test('time input supports optional seconds, Arabic digits and single-digit hours',()=>{
  for(const time of ['18:40','18:40:00','١٨:٤٠','۱۸:۴۰',' 18:40 ']) assert.equal(normalizePushTime(time),'18:40');
  assert.equal(normalizePushTime('1:05'),'01:05');
  for(const value of ['24:00','18:99','18:40:99','18:40junk',null]) assert.equal(normalizePushTime(value),null);
});
test('accepts standard push services and long valid provider URLs',()=>{
  for(const host of ['web.push.apple.com','fcm.googleapis.com','updates.push.services.mozilla.com','wns2.notify.windows.com']) {
    assert.equal(validatePushSubscription({...body,subscription:{...body.subscription,endpoint:`https://${host}/${'x'.repeat(1500)}`}}).ok,true);
  }
});
test('rejects arbitrary hosts, misleading suffixes, credentials and insecure URLs',()=>{
  for(const endpoint of ['https://example.com/token','https://fcm.googleapis.com.evil.com/token','http://web.push.apple.com/token','https://user:password@web.push.apple.com/token','https://web.push.apple.com:444/token']) {
    assert.equal(validatePushSubscription({...body,subscription:{...body.subscription,endpoint}}).ok,false);
  }
});
test('errors identify the rejected field without exposing endpoints or keys',()=>{
  for(const [value,code] of [[{...body,time:'bad'},'invalid_time'],[{...body,tz:'No/Zone'},'invalid_timezone'],[{...body,subscription:{...body.subscription,keys:{}}},'missing_keys']] as const) {
    const r=validatePushSubscription(value); assert.equal(r.ok,false); if(!r.ok){assert.equal(r.code,code);assert.ok(!r.error.includes('token'));}
  }
});
