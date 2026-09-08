import type { CollectionRepository, CollectionSnapshot } from '@/domain/types';
const entries: [number, string, string, 'capture' | 'evolution'][] = [
  [1, '2026-09-01', '第一次独立整理好书包', 'capture'],
  [4, '2026-09-01', '勇敢尝试了不擅长的跳绳', 'capture'],
  [7, '2026-09-02', '读完一本书，还分享了最喜欢的故事', 'capture'],
  [16, '2026-09-02', '帮助家人一起收拾餐桌', 'capture'],
  [19, '2026-09-03', '遇到难题没有放弃，又试了一次', 'capture'],
  [10, '2026-09-03', '认真照顾了阳台上的小植物', 'capture'],
  [13, '2026-09-04', '完成了一次开心的户外运动', 'capture'],
  [25, '2026-09-04', '主动帮助了需要帮忙的朋友', 'capture'],
  [43, '2026-09-05', '坚持读完了稍有难度的章节', 'capture'],
  [2, '2026-09-05', '连续练习，终于学会了新的本领', 'evolution'],
];
export const demoSnapshot: CollectionSnapshot = {
  source: 'demo', inventory: { evolution: 1, legendary: 0 },
  records: entries.map(([pokemonId, date, reason, method]) => ({ pokemonId, acquiredAt: `${date}T08:00:00+08:00`, reason, method })),
};
export const emptySnapshot: CollectionSnapshot = { source: 'empty', inventory: { evolution: 0, legendary: 0 }, records: [] };
export const demoRepository: CollectionRepository = { async getSnapshot() { return structuredClone(demoSnapshot); } };
