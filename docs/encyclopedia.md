# 宝可梦百科

入口：图鉴与百科 → 小百科（`/pokedex/encyclopedia`）。第一期为精灵球专题 `/pokedex/encyclopedia/poke-balls`。

产品约定：百科始终为自由浏览的知识频道，现在及未来都不加入答题、奖励、学习星或解锁要求。应用的设备使用时长限制仍正常适用。

首页以可辨认的大图作为专题入口，文字为辅助。第一期使用本地 SVG 精灵球示意图；点球切换大图并播放预制 MiniMax 中文语音介绍，提供重复播放入口。首页不设语音入口；详情旁的宝可梦始终显示匿名剪影，不提供图鉴跳转。五段介绍已完成 MiniMax 制作，文本共260字符，接口返回用量488字符；标题不设语音入口。每种球配三只匿名剪影。客户端不调用付费接口。快速切换时停止前一段语音，离开页面停止播放。

内容范围：先介绍第一世代引入的精灵球、超级球、高级球、大师球、狩猎球，不声称整个系列只有五种。后续扩展以关都、动画无印篇的关都部分，以及《红／绿／蓝》《火红／叶绿》为边界；分别标记作品范围，不混合游戏机制和动画设定。关联宝可梦只是图示，不表示专用捕捉关系。

来源：
- https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9_Ball
- https://www.pokemon.com/uk/pokemon-news/celebrate-25-years-of-pokemon-with-memorable-moments-from-the-kanto-region

数据位于 `src/domain/encyclopedia.ts`；资料说明在页面底部折叠展示。无需数据库迁移。
