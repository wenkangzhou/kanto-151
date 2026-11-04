import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RegionalPokemonDetail } from '@/components/regional-pokemon-detail';
import { johtoRegional } from '@/domain/johto';
import { regionalDetailRelations } from '@/domain/regional-relations';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pokemon = johtoRegional.find(entry => String(entry.id) === id);
  return { title: pokemon ? `${pokemon.name} · 城都地区图鉴预览` : '城都地区图鉴预览', robots: { index: false, follow: false } };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!/^[1-9]\d{0,2}$/.test(id)) notFound();
  const index = johtoRegional.findIndex(entry => entry.id === Number(id));
  if (index < 0) notFound();
  return <RegionalPokemonDetail region="johto" pokemon={johtoRegional[index]} previous={johtoRegional[index - 1]} next={johtoRegional[index + 1]} relations={regionalDetailRelations(Number(id), 'johto')} />;
}
