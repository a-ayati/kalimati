/** RFC 8291 / RFC 8188 single-record aes128gcm Web Push, RFC 8292 VAPID. */
const encoder = new TextEncoder();
const bytes = (text: string) => new Uint8Array(encoder.encode(text));
function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(parts.reduce((n,p)=>n+p.length,0));
  let offset=0; for(const part of parts){result.set(part,offset);offset+=part.length;} return result;
}
export function base64url(value: Uint8Array): string {
  let raw=''; for(const b of value)raw+=String.fromCharCode(b);
  return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decode(value: string): Uint8Array<ArrayBuffer> {
  const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/'));
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
async function hkdf(ikm: Uint8Array<ArrayBuffer>, salt: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, length: number) {
  const key=await crypto.subtle.importKey('raw',ikm,'HKDF',false,['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},key,length*8) as ArrayBuffer);
}
export async function buildWebPushRequest(privateJWK: JsonWebKey, sub: {endpoint:string;p256dh:string;auth:string}, payload: Record<string,unknown>) {
  const uaPublic=decode(sub.p256dh),auth=decode(sub.auth);
  if(uaPublic.length!==65 || uaPublic[0]!==4 || auth.length!==16) throw new Error('invalid_subscription_keys');
  const plaintext=bytes(JSON.stringify(payload));
  // 86-byte header + content + final delimiter + 16-byte GCM tag must fit 4096.
  if(plaintext.length>3993)throw new Error('push_payload_too_large');
  const pair=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']) as CryptoKeyPair;
  const asPublic=new Uint8Array(await crypto.subtle.exportKey('raw',pair.publicKey) as ArrayBuffer);
  const client=await crypto.subtle.importKey('raw',uaPublic,{name:'ECDH',namedCurve:'P-256'},false,[]);
  const secret=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:client} as unknown as SubtleCryptoDeriveKeyAlgorithm,pair.privateKey,256));
  const ikm=await hkdf(secret,auth,concat(bytes('WebPush: info\0'),uaPublic,asPublic),32);
  const salt=new Uint8Array(16); crypto.getRandomValues(salt);
  const cek=await hkdf(ikm,salt,bytes('Content-Encoding: aes128gcm\0'),16);
  const nonce=await hkdf(ikm,salt,bytes('Content-Encoding: nonce\0'),12);
  const aes=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);
  const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},aes,concat(plaintext,new Uint8Array([2]))));
  const recordSize=new Uint8Array(4); new DataView(recordSize.buffer).setUint32(0,4096,false);
  const body=concat(salt,recordSize,new Uint8Array([asPublic.length]),asPublic,ciphertext);
  const jwtHead=base64url(bytes(JSON.stringify({typ:'JWT',alg:'ES256'})));
  const jwtBody=base64url(bytes(JSON.stringify({aud:new URL(sub.endpoint).origin,exp:Math.floor(Date.now()/1000)+12*3600,sub:'mailto:abdelouahedayati@gmail.com'})));
  const unsigned=`${jwtHead}.${jwtBody}`;
  const signingKey=await crypto.subtle.importKey('jwk',privateJWK,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const signature=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},signingKey,bytes(unsigned)));
  const publicKey=base64url(concat(new Uint8Array([4]),decode(privateJWK.x!),decode(privateJWK.y!)));
  const headers=new Headers({'content-type':'application/octet-stream','content-encoding':'aes128gcm',TTL:'21600',Urgency:'normal',Authorization:`vapid t=${unsigned}.${base64url(signature)}, k=${publicKey}`});
  return {endpoint:sub.endpoint,headers,body};
}
