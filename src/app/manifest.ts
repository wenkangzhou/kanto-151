import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return { id: '/', name: 'Kanto 151 · 我的关都冒险手帐', short_name: 'Kanto 151', description: '把每一份成长，珍藏成与宝可梦的相遇。', lang: 'zh-CN', start_url: '/', scope: '/', display: 'standalone', background_color: '#f7f8fa', theme_color: '#e34b3f', icons: [{ src: '/icons/pokeball-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/icons/pokeball-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/icons/pokeball-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] };
}
