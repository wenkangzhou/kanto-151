import {readFileSync,writeFileSync} from 'node:fs';
import {pokemon} from '../src/domain/pokemon';
import {starterMachines,battleMoves} from '../src/domain/battle-loadout';
const file='supabase/migrations/202609290008_learning.sql';
const value=JSON.stringify(Object.fromEntries(pokemon.map(p=>[p.id,starterMachines(p.id)])));
const generated=`-- BEGIN STARTER MACHINES\ncreate or replace function public.kanto_starter_machines() returns jsonb language sql immutable set search_path='' as $rules$ select '${value}'::jsonb; $rules$;\nrevoke all on function public.kanto_starter_machines() from public,anon,authenticated;\n-- END STARTER MACHINES`;
const sql=readFileSync(file,'utf8');const next=sql.replace(/-- BEGIN STARTER MACHINES[\s\S]*?-- END STARTER MACHINES/,generated);
const moves=JSON.stringify(Object.fromEntries(pokemon.map(p=>[p.id,battleMoves(p.id)])),null,2)+'\n';
if(process.argv.includes('--check')){if(next!==sql||readFileSync('src/data/battle-moves.json','utf8')!==moves)throw Error('Run scripts/generate-learning-rules.ts');}else{writeFileSync(file,next);writeFileSync('src/data/battle-moves.json',moves);}
