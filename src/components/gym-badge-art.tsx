import Image from 'next/image';
import type {KantoGym} from '@/domain/gyms';

export function GymBadgeArt({gym}:{gym:KantoGym}){
 return <Image src={`/encyclopedia/badges/${gym.id}.png`} width={1280} height={1280} sizes="124px" className="gym-badge-art" alt={gym.badge}/>;
}
