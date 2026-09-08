'use client';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="page"><div className="empty-state"><h2>这一页暂时没有翻开</h2><p>请再试一次。你的冒险还在这里。</p><button className="button" onClick={reset}>重新打开</button></div></div>; }
