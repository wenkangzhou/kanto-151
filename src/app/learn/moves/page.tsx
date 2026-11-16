import {MoveShop} from '@/components/move-shop';
import {partnerFromQuery} from '@/domain/partner-link';
export const metadata={title:'招式兑换'};
export default async function Page({searchParams}:{searchParams:Promise<{partner?:string|string[]}>}){
 const {partner}=await searchParams;
 const selected=partnerFromQuery(partner);
 return <MoveShop key={selected??'all'} initialPartner={selected}/>;
}
