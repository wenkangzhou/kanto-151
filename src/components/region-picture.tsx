import { House, Trees, Mountain, Waves, Building2, Flame, Compass, Zap, Star, Trophy, Ghost } from 'lucide-react';
const oldIcons = [House, Trees, Mountain, Waves, Building2, Flame, Compass];
const icons = [Zap, Mountain, Waves, Ghost, Star, Trophy, Compass];
export function RegionPicture({ chapterId, legacy = false }: { chapterId: number; legacy?: boolean }) {
  const Icon = (legacy ? oldIcons : icons)[chapterId - 1] ?? Compass;
  return <span className={`region-picture region-picture-${chapterId}`} aria-hidden="true"><span className="region-sun" /><span className="region-hill" /><Icon size={46} strokeWidth={1.65} /><span className="region-trail" /></span>;
}
