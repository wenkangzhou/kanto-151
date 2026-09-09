# 大屏背景音乐

选曲为《宝可梦 火红／叶绿》的 **六之岛・七之岛（Sevii Islands: Six & Seven Islands）**，取其舒缓的海岛与探索氛围。

音频文件尚未提供，当前没有原曲播放。将可用于本项目的 MP3 放到 `public/audio/sevii-islands-6-7.mp3`，重新构建部署后启用。未提供时大屏显示禁用的静音图标，悬停提示缺少音乐文件，不会请求不存在的音频。

行为：
- 开关只显示小图标，以扬声器、静音、加载图标表达状态，无可见文字与边框；保留 44px 触控区域和无障碍名称。
- iPad / 桌面等视口宽度至少 768px 的设备显示开关。手机 UA、触屏设备短边不足 600px 均排除，手机横屏也不会播放。iPad 分屏低于 768px 时停止。
- 默认静音，只有点击开关才创建音频并开始请求，不自动播放，不预加载。
- 循环播放，应用请求音量 20%（实际输出仍受设备音量控制）；用户静音时暂停，重新开启从原位置继续。
- 播放器挂在共享布局，站内切换页面不重新开始；刷新后恢复静音。
- 切换后台、离开页面或变成窄屏会暂停，回到页面需主动点开。
- 音频不进入 Service Worker 缓存；加载错误与浏览器拒绝播放会恢复关闭状态并提示重试。

曲目核对：[专辑曲目表](https://bulbapedia.bulbagarden.net/wiki/FRLG_music)。官方收听渠道：[Nintendo Music 火红／叶绿公告](https://www.nintendo.com/us/whatsnew/tracks-from-pokemon-firered-version-and-pokemon-leafgreen-version-added-to-nintendo-music/)。收听渠道不作为网页音频文件的下载接口；本项目没有提取或附带原曲。
