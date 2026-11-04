import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { JohtoPokedex } from '@/components/johto-pokedex';
import { johtoRegional } from '@/domain/johto';

export const metadata: Metadata = {
  title: '城都地区图鉴 · 独立预览',
  description: '按原始城都地区图鉴顺序认识 251 位宝可梦，其中包括第二世代新增的 100 位。',
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ pokemon?: string }> }) {
  const legacyId = (await searchParams).pokemon;
  if (legacyId && /^[1-9]\d{0,2}$/.test(legacyId) && johtoRegional.some(pokemon => pokemon.id === Number(legacyId))) {
    redirect(`/johto/pokedex/${legacyId}`);
  }
  return <JohtoPokedex />;
}
