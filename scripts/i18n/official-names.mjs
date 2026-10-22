import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const names={};
for(const pokemon of read('src/data/pokemon.json')){
 names[pokemon.name]=pokemon.englishName;
 names[pokemon.traditionalName]=pokemon.englishName;
}
const special={'u-turn':'U-turn','x-scissor':'X-Scissor','will-o-wisp':'Will-O-Wisp','double-edge':'Double-Edge','soft-boiled':'Soft-Boiled','self-destruct':'Self-Destruct','mud-slap':'Mud-Slap','power-up-punch':'Power-Up Punch','freeze-dry':'Freeze-Dry','lock-on':'Lock-On'};
for(const moves of Object.values(read('src/data/battle-moves.json')))for(const move of moves){names[move.name]=special[move.id]??move.id.split('-').map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ');}
Object.assign(names,{'一般':'Normal','火':'Fire','水':'Water','电':'Electric','草':'Grass','冰':'Ice','格斗':'Fighting','毒':'Poison','地面':'Ground','飞行':'Flying','超能力':'Psychic','虫':'Bug','岩石':'Rock','幽灵':'Ghost','龙':'Dragon','恶':'Dark','钢':'Steel','妖精':'Fairy','精灵球':'Poké Ball','超级球':'Great Ball','高级球':'Ultra Ball','大师球':'Master Ball','狩猎球':'Safari Ball','火之石':'Fire Stone','水之石':'Water Stone','雷之石':'Thunder Stone','叶之石':'Leaf Stone','月之石':'Moon Stone','小刚':'Brock','小霞':'Misty','马志士':'Lt. Surge','莉佳':'Erika','阿桔':'Koga','娜姿':'Sabrina','夏伯':'Blaine','坂木':'Giovanni','深灰市':'Pewter City','华蓝市':'Cerulean City','枯叶市':'Vermilion City','玉虹市':'Celadon City','浅红市':'Fuchsia City','金黄市':'Saffron City','红莲镇':'Cinnabar Island','常青市':'Viridian City','深灰徽章':'Boulder Badge','蓝色徽章':'Cascade Badge','橙色徽章':'Thunder Badge','彩虹徽章':'Rainbow Badge','粉红徽章':'Soul Badge','金色徽章':'Marsh Badge','深红徽章':'Volcano Badge','绿色徽章':'Earth Badge'});
fs.writeFileSync('src/lib/i18n/official-names.json',JSON.stringify(names,null,2)+'\n');
