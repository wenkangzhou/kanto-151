import { readFileSync, writeFileSync } from 'node:fs';
import { pokemon, chapters } from '../src/domain/pokemon';
const rules = {
  chapters: chapters.map(chapter => chapter.pokemonIds),
  evolutions: pokemon.filter(p => p.evolvesFrom !== null).map(p => [p.evolvesFrom, p.id]),
  exploration: pokemon.filter(p => p.category === 'exploration').map(p => [p.id, { common: 10, rare: 3, veryRare: 1 }[p.rarity]]),
};
const file = 'supabase/migrations/202609080001_family_rewards.sql';
const sql = readFileSync(file, 'utf8');
const generated = `-- BEGIN GENERATED RULES\n-- Gameplay IDs only, generated from repository JSON. No Pokémon metadata table.\ncreate function public.kanto_rules() returns jsonb language sql immutable set search_path = '' as $rules$\n select '${JSON.stringify(rules)}'::jsonb;\n$rules$;\n-- END GENERATED RULES`;
const expected = sql.replace(/-- BEGIN GENERATED RULES[\s\S]*?-- END GENERATED RULES/, generated);
if (process.argv.includes('--check')) {
  if (expected !== sql) throw new Error('SQL rules are out of sync. Run npm run sql:rules.');
  console.log('SQL rules match repository JSON.');
} else { writeFileSync(file, expected); console.log('Updated SQL gameplay rules.'); }
