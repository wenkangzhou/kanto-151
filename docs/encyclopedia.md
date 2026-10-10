# 宝可梦百科

入口：图鉴与百科 → 小百科（`/pokedex/encyclopedia`）。第一期为精灵球专题 `/pokedex/encyclopedia/poke-balls`。

产品约定：百科始终为自由浏览的知识频道，现在及未来都不加入答题、奖励、学习星或解锁要求。应用的设备使用时长限制仍正常适用。

首页以可辨认的大图作为专题入口，文字为辅助。第一期使用本地 SVG 精灵球示意图；点球切换大图并播放预制 MiniMax 中文语音介绍，提供重复播放入口。首页不设语音入口；详情旁的宝可梦始终显示匿名剪影，不提供图鉴跳转。五段介绍已完成 MiniMax 制作，文本共260字符，接口返回用量488字符；标题不设语音入口。每种球配三只匿名剪影。客户端不调用付费接口。快速切换时停止前一段语音，离开页面停止播放。

内容范围：先介绍第一世代引入的精灵球、超级球、高级球、大师球、狩猎球，不声称整个系列只有五种。后续扩展以关都、动画无印篇的关都部分，以及《红／绿／蓝》《火红／叶绿》为边界；分别标记作品范围，不混合游戏机制和动画设定。关联宝可梦只是图示，不表示专用捕捉关系。

来源：
- https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9_Ball
- https://www.pokemon.com/uk/pokemon-news/celebrate-25-years-of-pokemon-with-memorable-moments-from-the-kanto-region

数据位于 `src/domain/encyclopedia.ts`；资料说明在页面底部折叠展示。无需数据库迁移。

## 道馆和徽章

路由：`/pokedex/encyclopedia/gyms`。首页以八枚徽章大图进入，自由点选或上一站／下一站浏览。

- 默认动画模式：小智拿徽章的顺序为深灰、华蓝、枯叶、金黄、玉虹、浅红、红莲、常青。
- 游戏模式：按徽章常用排列深灰、华蓝、枯叶、玉虹、浅红、金黄、红莲、常青；不是强制挑战顺序。
- 游戏馆主及徽章沿用《红／绿／蓝》，出战队伍明确采用《火红／叶绿》首次道馆战。保留阿桔的两只瓦斯弹与坂木的两只独角犀牛，不混入初代坂木的钻角犀兽或《皮卡丘》版队伍。
- 动画以无印关都道馆故事为范围，不将馆主所有时期的持有宝可梦混在一起。毛球→摩鲁蛾、凯西→勇基拉注明为进化过程，常青注明火箭队代管及借用队伍。
- Pokémon 以剪影展示，名称仅展示，不跳图鉴、不解锁收藏。馆主使用本地《火红／叶绿》像素图，页面资料说明明确不是动画造型。徽章采用用户提供的八张高清透明 PNG，原图存于 public/encyclopedia/badges，通过 Next Image 按展示尺寸加载，保持完整比例，不再裁切截图。
- 道馆语音已沿用 MiniMax speech-2.8-hd / hunyin_6 预生成：16 段道馆讲解（两种模式各8段），另8段仅朗读徽章四字名称；宝可梦卡片没有语音按钮。24 段文本共 1,821 字符，接口返回实际用量 3,434 计费字符，按 ¥3.50/万字符约 ¥1.20。音频已通过解码和校验和检查并接入语音索引，重复播放不调用生成 API；未来未录制的新文案仍可回退系统语音。
- 保持百科纯浏览，不提供徽章收集奖励、答题或兑换，不新增 SQL。

数据：`src/domain/gyms.ts`；每条数据保存对应道馆的来源 slug。来源（2026-10-09 核对）：
- https://pokemondb.net/firered-leafgreen/gymleaders-elitefour
- https://www.serebii.net/fireredleafgreen/gyms.shtml （八位馆主图片位于该页链接的 `/pokearth/trainers/frlg/30.png` 至 `37.png`，为游戏素材，权利归原权利人）
- https://wiki.52poke.com/wiki/徽章 （中文名称）
- https://bulbapedia.bulbagarden.net/wiki/Pewter_Gym
- https://bulbapedia.bulbagarden.net/wiki/Cerulean_Gym
- https://bulbapedia.bulbagarden.net/wiki/Vermilion_Gym
- https://bulbapedia.bulbagarden.net/wiki/Celadon_Gym
- https://bulbapedia.bulbagarden.net/wiki/Fuchsia_Gym
- https://bulbapedia.bulbagarden.net/wiki/Saffron_Gym
- https://bulbapedia.bulbagarden.net/wiki/Cinnabar_Gym
- https://bulbapedia.bulbagarden.net/wiki/Viridian_Gym
- https://www.pokemon.com/us/animation/seasons/1/episode-14-electric-shock-showdown （官方动画梗概）

## 进化石

路由：`/pokedex/encyclopedia/evolution-stones`，数据：`src/domain/evolution-stones.ts`。

范围为《火红／叶绿》的关都 001—151：五种进化石，共16组关系。
- 火之石：六尾→九尾、卡蒂狗→风速狗、伊布→火伊布。
- 水之石：蚊香君→蚊香泳士、大舌贝→刺甲贝、海星星→宝石海星、伊布→水伊布。
- 雷之石：皮卡丘→雷丘、伊布→雷伊布。
- 叶之石：臭臭花→霸王花、口呆花→大食花、蛋蛋→椰蛋树。
- 月之石：尼多娜→尼多后、尼多力诺→尼多王、皮皮→皮可西、胖丁→胖可丁。

不把“关都151的五种”说成整个游戏或系列只有五种；不含太阳之石的非关都进化、后世代进化或地区形态。动画参考无印篇 EP006、EP040、EP043，故事和游戏规则分别展示。进化石使用本地矢量示意，进化前后伙伴均为剪影，展示名称但不跳转图鉴、不设单独伙伴语音。点石头播放该石头说明与全部对应关系，可重复播放；已沿用 MiniMax speech-2.8-hd / hunyin_6 制作5段语音：文本474字符，接口实际用量890计费字符，按 ¥3.50/万字符计算为 ¥0.3115，总时长100.476秒。已通过解码、校验和检查并接入语音索引，重复播放不调用生成接口；新文案仍可回退系统朗读。无奖励或数据库变更。

核对来源：
- https://pokemondb.net/evolution/stone
- https://www.serebii.net/fireredleafgreen/items.shtml
- https://bulbapedia.bulbagarden.net/wiki/EP006
- https://bulbapedia.bulbagarden.net/wiki/EP040
- https://bulbapedia.bulbagarden.net/wiki/EP043
