import { Team } from '@/components/team';
import {partnerFromQuery} from '@/domain/partner-link';
export const metadata = { title: '我的小队与精灵中心' };
export default async function Page({searchParams}:{searchParams:Promise<{partner?:string|string[]}>}) {
 const {partner}=await searchParams;
 return <Team focusPartner={partnerFromQuery(partner)}/>;
}
