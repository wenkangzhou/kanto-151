import {test} from 'node:test';
import assert from 'node:assert/strict';
import {translate} from '../src/lib/i18n/translate';
import english from '../src/lib/i18n/en.json';
import pokemon from '../src/data/pokemon.json';
test('Chinese remains unchanged and non-text values retain their identity',()=>{
 assert.equal(translate('我的背包','zh'),'我的背包');
 const object={name:'皮卡丘'};assert.equal(translate(object,'en'),object);
 assert.equal(translate(3,'en'),3);
});
test('all 151 partners use their existing English names',()=>{
 for(const partner of pokemon)assert.equal(translate(partner.name,'en'),partner.englishName);
});
test('dynamic messages translate partner names and keep quantities',()=>{
 assert.equal(translate('皮卡丘学会十万伏特啦！','en'),'Pikachu learned Thunderbolt!');
 assert.equal(translate('3 个精灵球待打开','en'),'3 Poké Balls ready to open');
 assert.equal(translate('13减8等于几？','en'),'What is 13 minus 8?');
 assert.equal(translate('我今天自己收拾了书包','en'),'我今天自己收拾了书包');
});
test('English templates preserve all source placeholders',()=>{
 const slots=(s:string)=>[...s.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort();
 for(const [source,target]of Object.entries(english))assert.deepEqual(slots(target),slots(source),source);
});

import sourceCatalog from '../src/lib/i18n/zh-catalog.json';
import officialNames from '../src/lib/i18n/official-names.json';
import {formatTranslation} from '../src/lib/i18n/translate';
import {encyclopediaBalls,ballNarration} from '../src/domain/encyclopedia';
import {evolutionStones,stoneNarration} from '../src/domain/evolution-stones';
import {kantoGyms,gymNarration} from '../src/domain/gyms';

test('the complete extracted source catalog has an authored English entry',()=>{
 const dictionary:Record<string,string>={...english,...officialNames};
 for(const source of sourceCatalog)assert.ok(dictionary[source],`Missing translation: ${source}`);
});
test('long encyclopedia and partner narration stays fully English',()=>{
 const narrations=[...encyclopediaBalls.map(ballNarration),...evolutionStones.map(stoneNarration),...kantoGyms.flatMap(g=>[gymNarration(g,'anime'),gymNarration(g,'game')]),...pokemon.map(p=>`${p.name}。${p.description}`)];
 for(const text of narrations){const result=translate(text,'en');assert.ok(!/[\u3400-\u9fff]/.test(result),result);assert.equal(translate(text,'zh'),text);}
});
test('specific templates win over broad templates and never rewrite user-provided arguments',()=>{
 assert.equal(translate('听听水属性','en'),'Listen to the Water type');
 assert.equal(translate('#025 皮卡丘，可进化','en'),'#025 Pikachu, Can Evolve');
 assert.equal(formatTranslation('{0}已与{1}位伙伴相遇。','en',['皮卡丘',3]),'皮卡丘 has met 3 partners.');
 assert.equal(formatTranslation('{0}已与{1}位伙伴相遇。','zh',['皮卡丘',3]),'皮卡丘已与3位伙伴相遇。');
});
