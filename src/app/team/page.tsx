import { Team } from '@/components/team';
import {moveFromQuery,partnerFromQuery} from '@/domain/partner-link';
export const metadata = { title: '我的小队与精灵中心' };
export default async function Page({searchParams}:{searchParams:Promise<{partner?:string|string[];move?:string|string[]}>}) {
 const {partner,move}=await searchParams;
 return <Team focusPartner={partnerFromQuery(partner)} focusMove={moveFromQuery(move)}/>;
}
