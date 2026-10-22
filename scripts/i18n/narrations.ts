import {writeFileSync,readFileSync} from 'node:fs';
import english from '../../src/lib/i18n/en.json';
import names from '../../src/lib/i18n/official-names.json';
import {encyclopediaBalls,ballNarration} from '../../src/domain/encyclopedia';
import {evolutionStones,stoneNarration} from '../../src/domain/evolution-stones';
import {kantoGyms,gymNarration} from '../../src/domain/gyms';
import {pokemon,pokemonById} from '../../src/domain/pokemon';
import {TYPE_NAMES} from '../../src/domain/types';
// Compose long audio from individually authored translations, never split prose by punctuation.
const dictionary:Record<string,string>={...english,...names};
const t=(text:string)=>{if(!dictionary[text])throw new Error(`Missing narration translation: ${text}`);return dictionary[text];};
const output:Record<string,string>={};
for(const p of pokemon)output[`${p.name}。${p.description}`]=`${p.englishName}. ${t(p.description)}`;
for(const b of encyclopediaBalls)output[ballNarration(b)]=`${t(b.name)}. ${t(b.clue)}. ${t(b.description)}`;
for(const stone of evolutionStones){
 const pairs=stone.pairs.map(([from,to])=>`${pokemonById.get(from)!.englishName} evolves into ${pokemonById.get(to)!.englishName} using a ${t(stone.name)}.`).join(' ');
 output[stoneNarration(stone)]=`${t(stone.name)}. ${t(stone.description)} In FireRed and LeafGreen, ${pairs}`;
}
for(const gym of kantoGyms)for(const mode of ['anime','game'] as const){
 const team=(mode==='game'?gym.gameTeam:gym.animeTeam).map(id=>pokemonById.get(id)!.englishName).join(', ');
 output[gymNarration(gym,mode)]=`${t(gym.name)}. The Gym Leader is ${t(gym.leader)}, who specializes in ${t(TYPE_NAMES[gym.type])} types. This Gym awards the ${t(gym.badge)}. ${t(mode==='game'?gym.gameStory:gym.animeStory)} ${gym.id==='giovanni'&&mode==='anime'?'The borrowed Pokémon are':'The Pokémon introduced here are'} ${team}.${mode==='anime'&&gym.animeTeamNote?' '+t(gym.animeTeamNote):''}`;
}
const file='src/lib/i18n/narrations.json';const contents=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(file,'utf8')!==contents)throw new Error('Run node --import tsx scripts/i18n/narrations.ts to update narrations.');}
else writeFileSync(file,contents);
