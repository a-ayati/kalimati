import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { POST_PRESETS, POST_CATEGORIES, postsForCategory } from '../public/templates/cinematic/presets.mjs';
import { normalize, layoutTitle } from '../public/templates/cinematic/layout.mjs';
function measure(text) { const width=[...text.replace(/\p{M}/gu,'')].length*10; return {width,actualBoundingBoxLeft:Math.max(0,width-2),actualBoundingBoxRight:text?2:0}; }
test('30 distinct editable posts cover six categories evenly', () => {
  assert.equal(POST_PRESETS.length,30); assert.equal(POST_CATEGORIES.length,6);
  assert.equal(new Set(POST_PRESETS.map(p=>p.id)).size,30);
  assert.equal(new Set(POST_PRESETS.map(p=>normalize(p.lines.join(' ')))) .size,30);
  assert.equal(new Set(POST_PRESETS.map(p=>p.caption)).size,30);
  for(const category of POST_CATEGORIES) assert.equal(postsForCategory(category).length,5);
  assert.equal(postsForCategory('').length,30); assert.equal(postsForCategory('غير موجود').length,0);
});
test('every preset has two renderable lines and one complete highlight keyword', () => {
 for(const post of POST_PRESETS){
  assert.equal(post.lines.length,2,post.id);
  const words=post.lines.join(' ').split(/\s+/).map(normalize);
  assert.equal(words.filter(w=>w===normalize(post.keyword)).length,1,post.id);
  assert.match(post.color,/^#[0-9A-F]{6}$/i);
  assert.ok(post.caption.length>60 && post.translation.length>8);
  assert.ok(/^[a-z]+$/.test(post.background));
  assert.ok(existsSync(new URL('../public/templates/cinematic/backgrounds/'+post.background+'.jpg',import.meta.url)));
  const layout=layoutTitle(post.lines,measure);assert.equal(layout.length,2);
  assert.equal(layout[0].width,layout[1].width);
 }
});
