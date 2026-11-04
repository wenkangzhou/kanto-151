import johtoOrder from '@/data/johto-regional-order.json';
import hoennOrder from '@/data/hoenn-regional-order.json';
import { pokemon as kantoPokemon } from './pokemon';
import { johtoPokemon, johtoRegional } from './johto';
import { hoennPokemon, hoennRegional } from './hoenn';
import { effectiveness } from './effectiveness';

export type RegionName = 'kanto' | 'johto' | 'hoenn';
export type RegionAppearance = { region: RegionName; number: number };
export type RelatedSpecies = { id: number; name: string; englishName: string; artwork: string };

const allSpecies = new Map([...kantoPokemon, ...johtoPokemon, ...hoennPokemon].map(pokemon => [pokemon.id, pokemon]));
const johtoNumbers = new Map(johtoOrder.map((id, index) => [id, index + 1]));
const hoennNumbers = new Map(hoennOrder.map((id, index) => [id, index + 1]));

// These children were introduced after their Kanto or Johto parents, so the older records
// cannot encode the relationship through their own evolvesFrom value.
const laterBabyEdges: [number, number][] = [
  [172, 25], [173, 35], [174, 39],
  [236, 106], [236, 107],
  [238, 124], [239, 125], [240, 126],
  [298, 183], [360, 202],
];
const parents = new Map<number, Set<number>>();
const children = new Map<number, Set<number>>();

function addEdge(parent: number, child: number) {
  if (!allSpecies.has(parent) || !allSpecies.has(child)) return;
  if (!parents.has(child)) parents.set(child, new Set());
  if (!children.has(parent)) children.set(parent, new Set());
  parents.get(child)!.add(parent);
  children.get(parent)!.add(child);
}

for (const pokemon of allSpecies.values()) {
  if (pokemon.evolvesFrom !== null) addEdge(pokemon.evolvesFrom, pokemon.id);
}
for (const [parent, child] of laterBabyEdges) addEdge(parent, child);

export function regionAppearances(id: number): RegionAppearance[] {
  const result: RegionAppearance[] = [];
  if (id <= 151 && allSpecies.has(id)) result.push({ region: 'kanto', number: id });
  const johtoNumber = johtoNumbers.get(id);
  const hoennNumber = hoennNumbers.get(id);
  if (johtoNumber) result.push({ region: 'johto', number: johtoNumber });
  if (hoennNumber) result.push({ region: 'hoenn', number: hoennNumber });
  return result;
}

export function regionHref(id: number, region: RegionName) {
  if (region === 'kanto') return `/pokemon/${id}`;
  return `/${region}/pokedex/${id}`;
}

export function relatedSpeciesHref(id: number, currentRegion: 'johto' | 'hoenn') {
  if (currentRegion === 'johto' && johtoNumbers.has(id)) return regionHref(id, 'johto');
  if (currentRegion === 'hoenn' && hoennNumbers.has(id)) return regionHref(id, 'hoenn');
  if (id <= 151) return regionHref(id, 'kanto');
  if (johtoNumbers.has(id)) return regionHref(id, 'johto');
  if (hoennNumbers.has(id)) return regionHref(id, 'hoenn');
  return null;
}

export function evolutionNeighbors(id: number) {
  const related = (ids: Set<number> | undefined): RelatedSpecies[] => [...(ids ?? [])]
    .sort((a, b) => a - b)
    .map(number => allSpecies.get(number)!)
    .map(pokemon => ({ id: pokemon.id, name: pokemon.name, englishName: pokemon.englishName, artwork: pokemon.artwork }));
  return { before: related(parents.get(id)), after: related(children.get(id)) };
}

export function regionalDetailRelations(id: number, currentRegion: 'johto' | 'hoenn') {
  const evolution = evolutionNeighbors(id);
  const withHref = (relative: RelatedSpecies) => ({ ...relative, href: relatedSpeciesHref(relative.id, currentRegion) });
  const familyIds = new Set<number>();
  const visit = (member: number) => {
    if (familyIds.has(member)) return;
    familyIds.add(member);
    for (const neighbor of parents.get(member) ?? []) visit(neighbor);
    for (const neighbor of children.get(member) ?? []) visit(neighbor);
  };
  visit(id);
  const family: number[] = [];
  const append = (member: number) => {
    if (family.includes(member)) return;
    family.push(member);
    for (const child of [...(children.get(member) ?? [])].sort((a, b) => a - b)) {
      if (familyIds.has(child)) append(child);
    }
  };
  for (const member of [...familyIds].sort((a, b) => a - b)) {
    if (![...(parents.get(member) ?? [])].some(parent => familyIds.has(parent))) append(member);
  }
  const regional = currentRegion === 'johto' ? johtoRegional : hoennRegional;
  const current = allSpecies.get(id)!;
  const examplePool = current.types.flatMap(attack => regional
    .filter(candidate => candidate.id !== id && effectiveness(attack, candidate.types) > 1)
    .slice(0, 3)
    .map(candidate => ({ id: candidate.id, name: candidate.name, artwork: candidate.artwork, types: candidate.types })));
  return {
    appearances: regionAppearances(id).map(appearance => ({ ...appearance, href: regionHref(id, appearance.region) })),
    evolution: { before: evolution.before.map(withHref), after: evolution.after.map(withHref) },
    family: family.map(member => {
      const species = allSpecies.get(member)!;
      return { id: member, name: species.name, englishName: species.englishName, artwork: species.artwork, href: relatedSpeciesHref(member, currentRegion) };
    }),
    examplePool: [...new Map(examplePool.map(species => [species.id, species])).values()],
  };
}

export type RegionalDetailRelations = ReturnType<typeof regionalDetailRelations>;
