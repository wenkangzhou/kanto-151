import { Battle } from '@/components/battle';
export const metadata = { title: '友好对战' };
export default async function Page({ searchParams }: { searchParams: Promise<{ recap?: string | string[] }> }) {
  const recap = (await searchParams).recap;
  return <Battle recapToken={typeof recap === 'string' ? recap : undefined} />;
}
