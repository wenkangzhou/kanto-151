import { Battle } from '@/components/battle';
import {moveFromQuery,partnerFromQuery} from '@/domain/partner-link';
export const metadata = { title: '友好对战' };
export default async function Page({ searchParams }: { searchParams: Promise<{ recap?: string | string[]; partner?: string | string[]; move?:string|string[] }> }) {
  const {recap,partner,move}=await searchParams;
  return <Battle recapToken={typeof recap === 'string' ? recap : undefined} preferredPartner={partnerFromQuery(partner)} practiceMove={moveFromQuery(move)} />;
}
