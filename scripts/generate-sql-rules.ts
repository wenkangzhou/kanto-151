import { readFileSync, writeFileSync } from 'node:fs';
import animeRoute from '../src/data/anime-route.json';
import { pokemon, chapters } from '../src/domain/pokemon';
const rules = {
  chapters: chapters.map(chapter => chapter.pokemonIds),
  evolutions: pokemon.filter(p => p.evolvesFrom !== null).map(p => [p.evolvesFrom, p.id]),
  exploration: animeRoute.encounters.filter(entry => pokemon.some(p => p.id === entry.pokemonId && p.category === 'exploration')).map(entry => [entry.pokemonId, 1]),
};
const file = 'supabase/migrations/202609090003_anime_route.sql';
const sql = readFileSync(file, 'utf8');
const generated = `-- BEGIN GENERATED RULES\n-- Gameplay IDs only, generated from repository JSON. No Pokémon metadata table.\ncreate or replace function public.kanto_rules() returns jsonb language sql immutable set search_path = '' as $rules$\n select '${JSON.stringify(rules)}'::jsonb;\n$rules$;\n-- END GENERATED RULES`;
const expected = sql.replace(/-- BEGIN GENERATED RULES[\s\S]*?-- END GENERATED RULES/, generated);
if (process.argv.includes('--check')) {
  if (expected !== sql) throw new Error('SQL rules are out of sync. Run npm run sql:rules.');
  console.log('SQL rules match repository JSON.');
} else { writeFileSync(file, expected); console.log('Updated SQL gameplay rules.'); }
