import { POST_PRESETS } from './cinematic/presets.mjs';
import { FONT_SIZE, layoutTitle, normalize } from './cinematic/layout.mjs';
const root = new URL('./', import.meta.url);
export const ART_POSTS = [
 {id:'art-beginnings',title:'البدايات الجديدة',text:'لا تخشَ البدايات الجديدة، قد تُعيد إليك نفسك',image:'beginnings.jpg',caption:'بعض البدايات تمنحك فرصة لتعود إلى نفسك. لا تحتاج أن تعرف الطريق كله؛ يكفي أن تبدأ بخطوة صادقة. ما البداية التي تؤجلها؟'},
 {id:'art-departure',title:'بعض الرحيل نجاة',text:'ليس كل رحيل خسارة، بعض الرحيل نجاة',image:'departure.jpg',caption:'قد يبدو الرحيل خسارة في البداية، ثم نكتشف ما أعاده إلينا من هدوء واتزان. ما الذي تعلّمته من تجربة تركتها خلفك؟'},
 {id:'art-patience',title:'ما ينمو بصدق',text:'تمهّل، ما ينمو بصدق يحتاج وقتًا',image:'patience.jpg',caption:'امنح الأشياء الصادقة وقتها: التعلّم والعلاقات والتعافي. التقدم الهادئ يظل تقدمًا. ما الشيء الذي تتعلم الصبر عليه؟'}
].map(p=>({...p,style:'art',category:'الخط العربي الفني',url:new URL('assets/'+p.image,root).href}));
export const READY_POSTS = [...POST_PRESETS.map(p=>({...p,style:'cinematic',text:p.lines.join(' ')})),...ART_POSTS];
export function makeReadyDraft(item, slot, id, url) {
 return {id,date:slot.date,time:slot.time,title:item.text,hook:item.text,subtitle:'',slides:[],question:'',pillar:'design',format:'صورة',caption:item.caption,hashtags:[],media:[{url,name:item.id+'.png',kind:'image'}],cover:{url},status:'ready',notes:[],linkedin:false,designTemplate:{id:item.id,style:item.style},createdAt:new Date().toISOString(),platformFit:{summary:'تصميم ثابت 4:5؛ يلائم منشورات الصور. منصات الفيديو تحتاج تحويله إلى فيديو قبل النشر.',platforms:{instagram:{fit:'yes',why:'منشور صورة عمودي 4:5'},facebook:{fit:'yes',why:'منشور صورة؛ النشر حسب المنصات المتاحة في حسابك'},linkedin:{fit:'maybe',why:'يمكن تكييف الكابشن لجمهور مهني'},tiktok:{fit:'maybe',why:'يتطلب منشور صور أو تحويلًا إلى فيديو؛ لا يُنشر تلقائيًا من هذا القالب'},snapchat:{fit:'maybe',why:'يحتاج تجهيزًا عموديًا مناسبًا؛ لا يُنشر تلقائيًا من هذا القالب'}}}};
}
function loadImage(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('تعذّر تحميل التصميم'));img.src=url;});}
let font;
async function ensureFont(){if(!font)font=(async()=>{const f=new FontFace('ReadyThmanyah',`url(${new URL('./cinematic/thmanyah-sans-Black.woff2',root)})`,{weight:'900'});await f.load();document.fonts.add(f);})();return font;}
const images=new Map();
export async function readyImage(item){
 const cacheKey=JSON.stringify([item.id,item.background,item.url,item.lines,item.keyword,item.color,item.translation]);
 if(images.has(cacheKey))return images.get(cacheKey);
 const task=(async()=>{
  if(item.style==='art'){const r=await fetch(item.url);if(!r.ok)throw new Error('تعذّر تحميل التصميم');const blob=await r.blob();return {blob,url:URL.createObjectURL(blob)};}
  await ensureFont();const photo=await loadImage(new URL('./cinematic/backgrounds/'+item.background+'.jpg',root));
  const c=document.createElement('canvas');c.width=1080;c.height=1350;const ctx=c.getContext('2d');
  let sw=photo.naturalWidth,sh=photo.naturalHeight;if(sw/sh>.8)sw=sh*.8;else sh=sw/.8;
  ctx.drawImage(photo,(photo.naturalWidth-sw)/2,(photo.naturalHeight-sh)/2,sw,sh,0,0,1080,1350);
  const burn=ctx.createRadialGradient(540,950,40,540,950,530);burn.addColorStop(0,'rgba(0,0,0,.66)');burn.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=burn;ctx.fillRect(0,550,1080,800);
  const label=(text,x,y,size=15,align='left',family='Arial')=>{ctx.font=`${size}px ${family}`;ctx.direction='ltr';ctx.textAlign=align;ctx.fillStyle='#f3eee5';ctx.fillText(text,x,y);};
  label('PERSONAL',285,220);label('VISUAL',285,238);label('STRIVE',440,220);label('TRUST',546,220);label('ALL RIGHTS',795,220,15,'right');label(`RESERVED ©${new Date().getFullYear()}`,795,238,15,'right');label('PURPOSE',285,292);label('HOPE',795,292,15,'right');
  ctx.font=`900 ${FONT_SIZE}px ReadyThmanyah`;ctx.direction='rtl';ctx.textAlign='right';
  const key=normalize(item.keyword||'');
  if(!key||item.lines.flatMap(l=>l.split(/\s+/)).filter(w=>normalize(w)===key).length!==1)throw new Error('اختر كلمة ملوّنة تظهر مرة واحدة في العبارة.');
  const lines=layoutTitle(item.lines,t=>ctx.measureText(t));
  for(const l of lines)for(const r of l.runs){ctx.fillStyle=normalize(r.word)===normalize(item.keyword)?item.color:'#f3eee5';ctx.fillText(r.word,r.x,r.baseline);}
  const rule=ctx.createLinearGradient(380,0,700,0);rule.addColorStop(0,item.color+'00');rule.addColorStop(.5,item.color);rule.addColorStop(1,item.color+'00');ctx.fillStyle=rule;ctx.fillRect(380,1095.5,320,1.5);
  const words=('“'+item.translation+'”').split(' '),rows=[];let row='';for(const w of words){if(row&&(row+' '+w).length>34){rows.push(row);row=w;}else row+=(row?' ':'')+w;}if(row)rows.push(row);rows.forEach((t,i)=>label(t,540,1150+i*25,22,'center','Georgia'));
  const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw new Error('تعذّر تجهيز التصميم');return {blob,url:URL.createObjectURL(blob)};
 })();images.set(cacheKey,task);try{return await task;}catch(e){images.delete(cacheKey);throw e;}
}


