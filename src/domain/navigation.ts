/** Collected companions stay together; undiscovered entries retain dex navigation. */
export function companionNeighbors(id: number, collected: number[]) {
  const ids = [...new Set(collected)].filter(n => n >= 1 && n <= 151).sort((a, b) => a - b);
  if (!ids.includes(id)) return { previous: id > 1 ? id - 1 : null, next: id < 151 ? id + 1 : null };
  const index = ids.indexOf(id);
  return { previous: ids[index - 1] ?? null, next: ids[index + 1] ?? null };
}
export function reorderTeam(team: number[], id: number, to: number) {
  const from = team.indexOf(id);
  if (from < 0 || to < 0 || to >= team.length) return [...team];
  const next = [...team]; next.splice(from, 1); next.splice(to, 0, id); return next;
}
export function swipeDirection(dx: number, dy: number) {
  return Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5 ? dx < 0 ? 'next' : 'previous' : null;
}
