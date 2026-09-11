import { notFound } from 'next/navigation';
import { CapturePreview } from '@/components/capture-experience';

export const metadata = { title: '本地开球动画预览' };
export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <CapturePreview />;
}
