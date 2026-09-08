import { notFound } from 'next/navigation';
import { pokemon, pokemonById, dexNumber } from '@/domain/pokemon';
import { PokemonDetail } from '@/components/pokemon-detail';
export const dynamicParams = false;
export function generateStaticParams() { return pokemon.map(p => ({ id: String(p.id) })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${dexNumber(Number(id))} · 伙伴档案` }; // Never leak undiscovered names in a tab title.
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d{0,2}$/.test(id)) notFound();
  const p = pokemonById.get(Number(id));
  if (!p) notFound();
  return <PokemonDetail pokemon={p} />;
}
