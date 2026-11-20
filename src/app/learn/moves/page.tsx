import {MoveShop} from '@/components/move-shop';
import {moveFromQuery,partnerFromQuery} from '@/domain/partner-link';
export const metadata={title:'招式兑换'};
export default async function Page({searchParams}:{searchParams:Promise<{partner?:string|string[];move?:string|string[]}>}){
 const {partner,move}=await searchParams;
 const selected=partnerFromQuery(partner);
 const selectedMove=moveFromQuery(move);
 return <MoveShop key={`${selected??'all'}-${selectedMove??''}`} initialPartner={selected} initialMove={selectedMove}/>;
}
