import Link from 'next/link';
import { Compass } from 'lucide-react';
export default function NotFound() { return <div className="page"><div className="empty-state"><Compass size={36} /><h1>好像走到了地图外面</h1><p>我们的冒险范围是关都 #001–#151。</p><Link href="/pokedex" className="button">回到宝可梦图鉴</Link></div></div>; }
