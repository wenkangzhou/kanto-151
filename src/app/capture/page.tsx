import Link from 'next/link';
import { ArrowRight, Ticket, Heart, BookOpen } from 'lucide-react';
export const metadata = { title: '兑换新相遇' };
export default function Page() {
  return <div className="page"><div className="page-heading"><div><div className="eyebrow"><span /> A REWARD FOR YOUR REAL ADVENTURE</div><h1>一份努力，一次相遇<span className="title-dot">.</span></h1><p>每一位新伙伴，都有一个值得记住的理由。</p></div></div><section className="feature-preview"><span className="feature-icon"><Ticket size={36} /></span><span className="eyebrow">下一站 · 奖励与相遇</span><h2>奖励兑换，即将开启</h2><p>家长会把你在生活中的努力，变成一个六位奖励码。<br />输入它，就能收获一次永久的成长。</p><div className="reward-steps"><span><Heart size={21} />完成一件值得骄傲的事</span><ArrowRight size={18} /><span><Ticket size={21} />收到家长的奖励码</span><ArrowRight size={18} /><span><BookOpen size={21} />认识一位全新的伙伴</span></div><div className="feature-callout">这一版先开放完整图鉴。兑换功能尚未开放，不需要输入奖励码。</div><Link href="/pokedex" className="button">先去翻翻图鉴 <ArrowRight size={17} /></Link></section></div>;
}
