import { notFound } from 'next/navigation';
import { TicketFlowPreview } from '@/components/ticket-flow-preview';
import { CapturePreview } from '@/components/capture-experience';

export const metadata = { title: '本地相遇动画预览' };
export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const mode = (await searchParams).mode;
  if (mode === 'ticket') return <TicketFlowPreview />;
  const evolution = mode === 'evolution';
  return <CapturePreview key={evolution ? 'evolution' : 'capture'} evolution={evolution} />;
}
