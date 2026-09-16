// Offline inventory only: this script never calls a paid API.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pokemon, chapters } from '../src/domain/pokemon';
import { TYPE_NAMES } from '../src/domain/types';
import { strengths, weaknesses } from '../src/domain/effectiveness';
import { battleMoves, struggle } from '../src/domain/battle';

const settings = {
  model: 'speech-2.8-hd',
  voice_setting: { voice_id: 'hunyin_6', speed: 1, vol: 1, pitch: 0, emotion: 'happy' },
  audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3', channel: 1 },
};
const entries = new Map<string, { id: string; text: string; category: string }>();
function add(category: string, text: string) {
  const id = createHash('sha256').update(JSON.stringify({ ...settings, text })).digest('hex').slice(0, 24);
  if (!entries.has(text)) entries.set(text, { id, text, category });
}
for (const p of pokemon) {
  add('names', p.name);
  add('descriptions', `${p.name}。${p.description}`);
}
for (const name of Object.values(TYPE_NAMES)) add('types', name);
for (const p of pokemon) {
  for (const attack of p.types) {
    const targets = strengths([attack]);
    add('outgoing', targets.length ? `${TYPE_NAMES[attack]}招式！攻击${targets.map(type => TYPE_NAMES[type]).join('、')}属性时，力量会变成两倍。${p.types.length > 1 ? '点另一个属性，可以换招式。' : ''}` : '一般招式也能攻击，只是没有特别擅长的属性对手。');
  }
  const incoming = weaknesses(p.types);
  add('incoming', `${p.name}的属性是${p.types.map(type => TYPE_NAMES[type]).join('和')}。${incoming.length ? `要小心${incoming.map(item => TYPE_NAMES[item.type]).join('、')}属性的招式！这些招式攻击它时，力量会变大。` : '没有效果加倍的来袭属性。'}${p.types.length > 1 ? '两种属性要一起看，换招式不会改变自己的属性。' : ''}`);
}
for (const chapter of chapters) add('chapters', `${chapter.name}。${chapter.description}`);
add('chapters', '继续探索。新的相遇还在路上。');
const bag = readFileSync('src/components/bag.tsx', 'utf8');
for (const match of bag.matchAll(/<ItemVoice[^>]* text="([^"]+)"/g)) add('items', match[1]);
add('items', '这张券已经放进背包啦。');
for (const p of pokemon) {
  add('battle-summon', `就决定是你了，${p.name}！`);
  for (const move of [...battleMoves(p.id), struggle]) add('battle-moves', `${p.name}，${move.name}！`);
  add('battle-rest', `${p.name}休息一下吧，换一位伙伴！`);
  add('battle-loss', `对战结束，${p.name}获胜！我们的伙伴也很努力，一起休息一下吧。`);
}
for (const text of ['选一位伙伴出场吧！', '这招没有效果，体力没有减少。', '这招很有效！', '效果不显著。', '打中了！', '配合得真棒！这场友好对战获胜啦！', '双方都很努力！这次握手言和吧。', '轮到你啦！']) add('battle-fixed', text);
mkdirSync('data/voice', { recursive: true });
const clips = [...entries.values()];
writeFileSync('data/voice/catalog.json', JSON.stringify({ settings, clips }, null, 2) + '\n');
console.log(JSON.stringify({ clips: clips.length, textCharacters: clips.reduce((sum, clip) => sum + [...clip.text].length, 0) }));
