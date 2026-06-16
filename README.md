# 甲骨文的世界 / The World of Oracle Bones

面向国际学校小学生的甲骨文科普网站。纯静态，无依赖、无构建。

## 运行

双击 `index.html` 即可；或本地起个服务：

```
python -m http.server 8123
```

然后打开 http://localhost:8123/

## 部署

把本文件夹传到任意静态托管（GitHub Pages / Netlify / Vercel），保证 `index.html` 在根目录即可。

## 板块

- **汉字的演变**：8 个字从图画到楷书，逐点形变。
- **猜一猜甲骨文**：看甲骨文字形，三选一识字游戏。
- **什么是甲骨文**：5 段图文（最早的文字 / 龟甲兽骨 / 占卜 / 1899 年发现 / 为何重要）。

待做：描一描（笔顺临摹）、甲骨文图鉴、占卜小剧场。

## 文件

| 文件 | 说明 |
|---|---|
| `index.html` | 结构：首页 / 网格 / 演变详情 / 猜字 / 科普 五个 view |
| `styles.css` | 样式。换肤改顶部 `:root` 变量：`--paper` 底、`--ink` 墨、`--seal` 铜绿、`--gold` 暖金 |
| `script.js` | 数据 + 形变引擎 + 各板块逻辑 |
| `tools/extract_kai.py` | 从 makemeahanzi 提取楷书中线 |

## 双语

界面单语言显示，右上角 `中 / EN` 切换。文案都是 `{ zh, en }` 成对存放（在 `UI`、`SECTIONS`、`ABOUT`、每个字的 `caps` 里）；加第三种语言就给这些对象再加一个键。

## 演变是怎么做的

每个字有 4 个阶段：`illus`(实物) → `oracle`(甲骨文) → `seal`(小篆) → `kai`(楷书)，各自是独立的标准字形，互不迁就。

过渡是逐点形变，不是淡入淡出：每一笔用 `getPointAtLength` 采样成 26 个等距点，相邻阶段按笔画中心就近配对、逐点插值；多出来的笔画从一个点长出，少掉的缩回一个点。所以不要求各阶段骨架一致，每个阶段都能照标准字形画。引擎在 `script.js` 的「逐点形变引擎」一节。

楷书 `kai` 用的是 makemeahanzi 的笔画中线，所以是精准的；甲骨文 / 小篆 / 实物为手绘对照标准字形。

## 加一个新字

在 `script.js` 的 `CHARACTERS` 里照抄一个现成的字：

```js
key: {
  char, pinyin, meaning, tint, fact,
  color: '#4FA3D1',     // 实物阶段颜色，会渐变到墨黑
  decor: 'sun',         // 可选：实物阶段的装饰（如太阳光芒）
  strokeWidth: 6.5,     // 可选
  illus:[…], oracle:[…], seal:[…], kai:[…],   // 4 个阶段，各一组中线笔画
  caps:[ {zh,en}, {zh,en}, {zh,en}, {zh,en} ],
}
```

各阶段笔画数、形状随意，引擎会自动重采样、配对。十字、四条腿这种多段笔画直接写成 `"M..L.. M..L.."`，会自动拆开分别形变。`CHAR_ORDER` 控制顺序。

取楷书中线：下载 makemeahanzi 的 `graphics.txt`，跑 `tools/extract_kai.py`。

## 加一个新板块

加一段 `<section id="view-x">` → 在 `views` 里登记 → 在 `SECTIONS` 里加一张卡片（需要的话写个初始化函数，参考 `startQuiz()`）。

## 字形来源

楷书中线来自 [makemeahanzi](https://github.com/skishore/makemeahanzi)（基于 Arphic 字体，Arphic Public License）；甲骨文 / 小篆 / 实物为本项目手绘。
