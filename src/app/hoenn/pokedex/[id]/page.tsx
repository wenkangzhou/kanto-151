import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RegionalPokemonDetail } from '@/components/regional-pokemon-detail';
import { hoennRegional } from '@/domain/hoenn';
import { regionalDetailRelations } from '@/domain/regional-relations';

type Props = { params: Promise<{ id: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return hoennRegional.map(pokemon => ({ id: String(pokemon.id) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pokemon = hoennRegional.find(entry => String(entry.id) === id);
  return { title: pokemon ? `${pokemon.name} · 丰缘地区图鉴预览` : '丰缘地区图鉴预览', robots: { index: false, follow: false } };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!/^[1-9]\d{0,2}$/.test(id)) notFound();
  const index = hoennRegional.findIndex(entry => entry.id === Number(id));
  if (index < 0) notFound();
  return <RegionalPokemonDetail region="hoenn" pokemon={hoennRegional[index]} previous={hoennRegional[index - 1]} next={hoennRegional[index + 1]} relations={regionalDetailRelations(Number(id), 'hoenn')} />;
}
