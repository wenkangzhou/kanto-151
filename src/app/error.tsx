'use client';
import {LocalizedText} from '@/components/localized-text';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="page"><div className="empty-state"><h2><LocalizedText text="这一页暂时没有翻开"/></h2><p><LocalizedText text="请再试一次。你的冒险还在这里。"/></p><button className="button" onClick={reset}><LocalizedText text="重新打开"/></button></div></div>; }
