import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { HoennPokedex } from '@/components/hoenn-pokedex';
import { hoennRegional } from '@/domain/hoenn';

export const metadata: Metadata = {
  title: '丰缘地区图鉴 · 独立预览',
  description: '按原始丰缘地区图鉴顺序认识 202 位宝可梦，其中包括第三世代新增的 135 位。',
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ pokemon?: string }> }) {
  const legacyId = (await searchParams).pokemon;
  if (legacyId && /^[1-9]\d{0,2}$/.test(legacyId) && hoennRegional.some(pokemon => pokemon.id === Number(legacyId))) {
    redirect(`/hoenn/pokedex/${legacyId}`);
  }
  return <HoennPokedex />;
}
