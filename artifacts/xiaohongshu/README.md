# 小红书宣传素材

本目录保存可编辑源稿、发布文案和生成所需的输入素材。全部界面截图来自独立 Demo 模拟数据，不含真实家庭记录。

## 保留在 Git

- `cards.html`：六张 1080 × 1440 图文卡片源稿。
- `panorama.html`：151 全景图源稿，按编号排列，直接引用仓库 `public/pokemon/` 图片。
- `发布文案.md`：标题、正文、评论区说明和图片顺序。
- `assets/`、`screenshots/`：图文源稿实际引用的素材。
- `video/index.html`：18 秒、1080 × 1440、30 fps 视频时间线。
- `video/assets/`：视频实际引用的界面截图、皮卡丘插图、完整图鉴长图和本地合成的背景音乐。
- `video/gsap.min.js`：源稿使用的 GSAP 3.14.2，保留文件内许可证声明。
- `video/DESIGN.md`、`SCRIPT.md`、`STORYBOARD.md`：视觉规范、字幕脚本与分镜。
- `video/package.json`、`hyperframes.json`、`meta.json`、`AGENTS.md`：视频工具配置与维护说明；CLI 固定为 0.7.108。

## 本地成品，不加入 Git

`01.png` 至 `06.png`、`07-151全景.png`、`preview.png`、`Kanto151-18s.mp4`、`Kanto151-小红书图文.zip`。这些已交付文件保留在本目录，由 `.gitignore` 排除。视频检查产生的 `video/snapshots/` 也忽略。

## 再次导出

图文：浏览器打开 `cards.html`，等待字体与图片加载后逐个截取 `#card1` 至 `#card6`；`?overview` 为总览。全景图：以 2400 px 视口打开 `panorama.html`，等待图片加载后截取整页。建议使用 macOS 的 PingFang SC 字体，以保持现有排版。

视频：在 `video/` 目录运行：

```sh
npm run check
npm run render -- --output ../Kanto151-18s.mp4 --fps 30 --quality high --workers 2
```

首次执行需要下载指定版本的 HyperFrames，并准备其浏览器渲染环境。PNG 与文案可重新打包为 ZIP。

图鉴滚动素材 `gallery-video.png` 为完整 151 图鉴的缩放截图。重新抓取时使用浏览器 DPR 1；DPR 2 的超高长图曾出现底部重复，需检查 #001 至 #151 是否完整。导出后也应检查视频末段确实停在梦幻。

## 本次整理

删除未被源稿使用的宝可梦插图、旧版视频素材、完整历史页截图、中间 JSON、调试关键帧以及与 AGENTS.md 重复的 CLAUDE.md；保留发布成品在本地。业务代码不涉及变更。
