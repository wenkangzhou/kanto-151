# 精灵球 Logo

使用内置 image_gen 生成。网站资源 `public/logo-pokeball.png`（512×512）；安装图标 `public/icons/pokeball-192.png`、`pokeball-512.png`、`pokeball-apple-touch.png`（180×180）。使用 sips 等比导出尺寸，更新 PWA 静态缓存至 v3。

最终提示词：

Use case: logo-brand. Create one polished square app icon for Kanto 151, a warm private Pokémon adventure app for a five-year-old child on iPad. Main subject: a classic instantly recognizable red-and-white Poké Ball, front view, dark charcoal horizontal band and central white circular button. Simple bold rounded silhouette, friendly clean animation-style illustration with restrained soft shading, warm coral red upper half, ivory white lower half, subtle charcoal outline. A tiny warm golden four-point glint near the upper right suggests the joy of meeting a Pokémon. Solid pale warm cream background fills the entire square edge to edge (no rounded-square frame, the OS will mask it). Ball centered and large but fully within the central 74% of the image for maskable icon safety. Extremely clear when displayed at 46 pixels. No notebook, no compass, no text, no letters, no digits, no extra objects, no watermark, no mockup. 1024x1024.

## 旧版手帐 Logo（保留资源）

使用内置 image_gen 生成，项目文件 `public/logo.png`。安装图标由该图像等比缩小导出。

生成提示词：

Use case: logo-brand. Asset type: square mobile app icon for Kanto 151, a private family creature-collection adventure journal. Create one original, polished app logo: a bold red adventure field notebook / pocket discovery device emblem, with a simple cream compass star inset on its front. It should feel warm, playful, collectible, and dependable. Completely solid warm cream background, edge to edge. Crisp flat vector-like graphic, strong simple silhouette, precise rounded geometric shapes, uniform dark ink outline, minimal shapes, no texture, no gradients, no three-dimensional rendering. Single emblem centered, frontal or very slight notebook perspective, occupying about 60 percent of the square; generous balanced safe margins so the entire emblem survives a circular PWA maskable crop. Legible at 48 pixels. Small notebook binding detail is fine; keep compass star prominent and uncomplicated. Vermilion red #E84C3D, warm cream #FFF8EA, dark ink #292523, optional tiny muted golden accent. Exactly one logo, no text, no letters, no numbers, no watermark. Do not use official Pokemon logos, Pokemon characters, recognizable Pokeballs, or existing brand marks. Original field-journal discovery identity.

修订提示词：

Edit the supplied app icon. Preserve the original red adventure notebook and central compass-star identity, its dark outline and golden accents, with no text. Make this a production square app icon with a completely OPAQUE, SOLID warm cream #FFF8EA background covering every background pixel all the way to the four corners. No black background and no transparency. Simplify the artwork into truly flat solid fills by removing all glossy highlights, gradients and dimensional shading. Scale the entire notebook down so it fits in the central 60 percent of the square with equal generous cream margins on all sides. Keep the bold recognizable silhouette and compass star. No additional objects, no watermark.
