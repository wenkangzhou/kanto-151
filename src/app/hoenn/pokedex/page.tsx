import type { Metadata } from 'next';
import { HoennPokedex } from '@/components/hoenn-pokedex';

export const metadata: Metadata = {
  title: '丰缘地区图鉴 · 独立预览',
  description: '按原始丰缘地区图鉴顺序认识 202 位宝可梦，其中包括第三世代新增的 135 位。',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HoennPokedex />;
}
