import type { Metadata } from 'next';
import { JohtoPokedex } from '@/components/johto-pokedex';

export const metadata: Metadata = {
  title: '城都地区图鉴 · 独立预览',
  description: '按原始城都地区图鉴顺序认识 251 位宝可梦，其中包括第二世代新增的 100 位。',
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ pokemon?: string }> }) {
  const id = Number((await searchParams).pokemon);
  return <JohtoPokedex initialPokemonId={Number.isInteger(id) && id >= 1 && id <= 251 ? id : undefined} />;
}
