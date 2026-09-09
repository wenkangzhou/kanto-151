import { House, Trees, Mountain, Waves, Building2, Flame, Compass } from 'lucide-react';
const icons = [House, Trees, Mountain, Waves, Building2, Flame, Compass];
export function RegionPicture({ chapterId }: { chapterId: number }) {
  const Icon = icons[chapterId - 1] ?? Compass;
  return <span className={`region-picture region-picture-${chapterId}`} aria-hidden="true"><span className="region-sun" /><span className="region-hill" /><Icon size={46} strokeWidth={1.65} /><span className="region-trail" /></span>;
}
