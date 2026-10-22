'use client';
import { useT } from '@/lib/i18n/locale';
import Image from 'next/image';
import type {KantoGym} from '@/domain/gyms';

export function GymBadgeArt({gym}:{gym:KantoGym}){
  const localize = useT();
 return <Image src={`/encyclopedia/badges/${gym.id}.png`} width={1280} height={1280} sizes="124px" className="gym-badge-art" alt={localize(gym.badge)}/>;
}
