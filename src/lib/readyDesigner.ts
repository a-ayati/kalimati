import type { ReadyDesign } from '../../shared/readyDesign';
export interface ReadyItem { id: string; style: 'cinematic' | 'art'; text: string; title: string; caption: string; lines?: [string, string]; keyword?: string; color?: string; translation?: string; background?: string; }
export interface ReadyCatalog { READY_POSTS: ReadyItem[]; readyImage(item: ReadyItem): Promise<{ blob: Blob; url: string }>; }
let catalog: Promise<ReadyCatalog> | undefined;
export function readyCatalog(): Promise<ReadyCatalog> {
  const moduleUrl = '/templates/designer/catalog.mjs';
  if (!catalog) catalog = import(/* @vite-ignore */ moduleUrl).catch(error => { catalog = undefined; throw error; });
  return catalog!;
}
export function designFor(item: ReadyItem): ReadyDesign {
  const base: ReadyDesign = { templateId: item.id, style: item.style, caption: item.caption };
  return item.style === 'cinematic' ? { ...base, lines: item.lines, keyword: item.keyword, color: item.color, translation: item.translation || '', background: item.background } : base;
}
export async function renderReadyDesign(design: ReadyDesign): Promise<{ blob: Blob; url: string }> {
  const c = await readyCatalog(), item = c.READY_POSTS.find(p => p.id === design.templateId && p.style === design.style);
  if (!item) throw new Error('لم يعد التصميم متاحًا.');
  return c.readyImage({ ...item, ...design, id: item.id });
}
