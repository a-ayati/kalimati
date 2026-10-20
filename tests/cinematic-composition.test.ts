import test from 'node:test';
import assert from 'node:assert/strict';
import { PHOTO_WINDOW, HEADER_BAND, FOOTER_BAND, headerLabels, footerLabels, drawScene } from '../public/templates/cinematic/composition.mjs';
function overlaps(a,b) { return a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y; }
test('small copy bands are physically outside the photograph', () => {
 assert.equal(overlaps(PHOTO_WINDOW,HEADER_BAND),false); assert.equal(overlaps(PHOTO_WINDOW,FOOTER_BAND),false);
 for(const [,x,y] of headerLabels(2026)){assert.ok(x>=80&&x<=1000);assert.ok(y-18>=HEADER_BAND.y&&y+4<=HEADER_BAND.height);}
 const notes=footerLabels(['Do your part.','Stay true to your purpose.','20,OCT,2026'],'اسم القائل','المصدر',t=>({width:t.length*8}));
 for(const run of notes){assert.ok(run.y-18>=FOOTER_BAND.y);assert.ok(run.y+5<=1350);}
 assert.throws(()=>footerLabels(['x'.repeat(100),'',''],'','',t=>({width:t.length*8})),/اختصر/);
});
test('photo clipping uses the declared reserved window and preserves its aspect ratio', () => {
 const calls=[];const ctx={fillRect(){},save(){},beginPath(){},rect(...a){calls.push(['rect',...a])},clip(){calls.push(['clip'])},drawImage(...a){calls.push(['draw',...a])},restore(){}};
 for(const [w,h] of [[1080,1350],[1600,900],[700,1600]]){
  calls.length=0;drawScene(ctx,{naturalWidth:w,naturalHeight:h});
  assert.deepEqual(calls[0],['rect',0,112,1080,1096]);assert.equal(calls[1][0],'clip');
  const draw=calls[2];assert.ok(Math.abs(draw[4]/draw[5]-.8)<.0001);assert.equal(draw[7],112);
 }
});
