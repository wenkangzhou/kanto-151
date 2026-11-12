import { Battle } from '@/components/battle';
import {partnerFromQuery} from '@/domain/partner-link';
export const metadata = { title: '友好对战' };
export default async function Page({ searchParams }: { searchParams: Promise<{ recap?: string | string[]; partner?: string | string[] }> }) {
  const {recap,partner}=await searchParams;
  return <Battle recapToken={typeof recap === 'string' ? recap : undefined} preferredPartner={partnerFromQuery(partner)} />;
}
