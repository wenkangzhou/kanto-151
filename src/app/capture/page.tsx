import { Suspense } from 'react';
import { CaptureExperience } from '@/components/capture-experience';
import { PokeballLoader } from '@/components/pokeball-loader';
export const metadata = { title: '兑换新相遇' };
export default function Page() { return <Suspense fallback={<PokeballLoader />}><CaptureExperience /></Suspense>; }
