import test from 'node:test';
import assert from 'node:assert/strict';
import { PHOTO_WINDOW, headerLabels, footerLabels, drawScene } from '../public/templates/cinematic/composition.mjs';
import { BASELINES, FONT_SIZE } from '../public/templates/cinematic/layout.mjs';
test('all original copy anchors remain fixed', () => {
 assert.deepEqual(headerLabels(2026),[['PERSONAL',285,220],['VISUAL',285,238],['STRIVE',440,220],['TRUST',546,220],['ALL RIGHTS',795,220,15,'right'],['RESERVED ©2026',795,238,15,'right'],['PURPOSE',285,292],['HOPE',795,292,15,'right']]);
 const runs=footerLabels(['one','two','date'],'author','source',t=>({width:t.length*8}));
 assert.deepEqual(runs.map(r=>[r.x,r.y,r.align]),[[297,687,'left'],[297,707,'left'],[297,730,'left'],[540,1260,'center'],[540,1287,'center']]);
 assert.deepEqual(BASELINES,[918,1045]);assert.equal(FONT_SIZE,78);
 assert.throws(()=>footerLabels(['x'.repeat(100),'',''],'','',t=>({width:t.length*8})),/اختصر/);
});
test('photograph stays complete without cropping or distortion', () => {
 assert.deepEqual(PHOTO_WINDOW,{x:0,y:0,width:1080,height:1350});
 const calls=[];const ctx={fillRect(){},drawImage(...a){calls.push(a)}};
 for(const [w,h] of [[1080,1350],[1600,900],[700,1600]]){
  calls.length=0;drawScene(ctx,{naturalWidth:w,naturalHeight:h});const d=calls[0];
  assert.deepEqual(d.slice(1,5),[0,0,w,h]); assert.ok(Math.abs(d[7]/d[8]-w/h)<.0001); assert.ok(d[5]>=0 && d[6]>=0 && d[5]+d[7]<=1080.001 && d[6]+d[8]<=1350.001);
 }
});
