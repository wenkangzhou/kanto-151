import { rewardType } from '@/domain/reward-history';
import { ParentArea } from '@/components/parent-area';
export const metadata = { title: '生成奖励' };
export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string | string[] }> }) { const type=rewardType((await searchParams).type); return <ParentArea view="reward" initialRewardType={type} />; }
