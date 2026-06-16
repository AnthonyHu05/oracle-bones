# 甲骨文的世界 · The World of Oracle Bones

面向国际学校 6–12 岁学生的中国传统文化科普网站，主题：**甲骨文**。
风格为克制的编辑 / 博物馆风：宋体标题、素牙白底色、铜绿（青铜器）点缀、水墨主视觉。
配色集中在 `styles.css` 顶部的 `:root` 变量里（`--paper` 牙白 / `--ink` 墨 /
`--seal` 铜绿 / `--gold` 暖金），改这几个变量即可整体换肤。
A culture site for international-school students (ages 6–12) about **oracle-bone
script**. Restrained editorial / gallery style.

首页是**板块导航**，目前包含两个可用板块 + 一个占位：
The home page is a **section hub**; two sections are live, one is a placeholder:

| 板块 / Section | 状态 | 说明 |
|---|---|---|
| 汉字的演变 Character Evolution | ✅ | 八个字从图画到楷书的逐点形变 |
| 猜一猜甲骨文 Guess the Oracle | ✅ | 看甲骨文字形，三选一猜出现代字（识字游戏）|
| 什么是甲骨文 What Are Oracle Bones? | ✅ | 五段图文科普：最早的文字 / 龟甲兽骨 / 占卜 / 1899 年发现 / 为什么重要 |

> 后续可加的板块 / ideas for more sections：**描一描 Trace**（用 makemeahanzi 中线做
> 笔顺临摹）、**甲骨文图鉴 Gallery**（按自然 / 动物 / 身体分类浏览）、**占卜小剧场**
> （互动讲解甲骨占卜的过程）。

**语言 / Language**：界面是**单语言**的——`中 / EN` 按钮切换，一次只显示一种语言。
所有文案在 `UI`、`SECTIONS`、`ABOUT` 和每个字的 `caps` 里都按 `{ zh, en }` 成对存放，
靠 `LANG` 取其一显示；想加第三种语言，给这些对象再加一个键即可。
The UI is **single-language**; the `中 / EN` button switches it. All copy is stored as
`{ zh, en }` pairs and shown by `LANG`.

## 运行 / Run

纯静态网页，没有任何依赖。Pure static site, zero dependencies.

- 直接双击 `index.html` 打开即可。Just open `index.html` in a browser.
- 或起一个本地服务器（中文路径更稳）/ or run a tiny server:
  ```bash
  python -m http.server 8123
  ```
  然后访问 / then visit `http://localhost:8123/`

部署：把这个文件夹整个传到任何静态托管（GitHub Pages / Netlify / Vercel）即可。
Deploy: upload this folder to any static host.

## 文件 / Files

| 文件 | 作用 |
|------|------|
| `index.html` | 页面结构：首页(板块导航) / 汉字网格 / 演变详情 / 猜字游戏 四个视图 |
| `styles.css` | 全部样式（博物馆风配色、宋体、卡片、游戏） |
| `script.js`  | 数据 + SVG 形变引擎 + 板块导航 + 猜字游戏 + 双语 |
| `tools/extract_kai.py` | 从 makemeahanzi 数据提取楷书中线的脚本 |

## 板块怎么加 / How sections work
首页卡片由 `script.js` 顶部的 `SECTIONS` 数组生成：每个板块有 `view`（对应一个
`<section id="view-…">`）、`glyph`、双语 `title` / `desc`；`view: null` 的板块自动显示
“敬请期待”。视图用 `showView('名字')` 切换，`views` 对象登记所有视图。
**新增板块** = 加一段 `<section id="view-x">` + 在 `views` 里登记 + 在 `SECTIONS` 里加卡片
（必要时写该板块自己的初始化函数，像 `startQuiz()` 那样）。

> The home cards come from the `SECTIONS` array; each maps to a `<section id="view-…">`.
> Add a section = new `<section>` + register in `views` + add to `SECTIONS`.

「猜一猜甲骨文」复用了演变板块的字形数据：直接取每个字的 `oracle` 笔画画在画框里，
三选一（一个正解 + 两个随机干扰项），第一次答对得 1 分，可重玩。
The quiz reuses the evolution data — it draws each character's `oracle` strokes and
asks you to pick the modern form from three choices.

## 字形数据来源 / Credits
楷书笔画中线来自开源项目 **makemeahanzi**（https://github.com/skishore/makemeahanzi ，
字形数据基于 Arphic 字体，遵循 Arphic Public License）。甲骨文 / 小篆 / 实物为本项目手绘。

## 🧠 演变是怎么做到「又准又有渐变感」的 / How the evolution stays accurate *and* smooth

每个字有 4 个阶段：**实物 illus → 甲骨文 oracle → 小篆 seal → 楷书 kai**，
每个阶段都是 `viewBox 0 0 100 100` 里的一组**描边中线笔画**，每个阶段都画成
各自**标准、独立**的字形（不用迁就别的阶段）。

过渡用的是**逐点形变**，不是淡入淡出：引擎用浏览器的 `getPointAtLength`，把每一笔
重新采样成 `K=26` 个等距的点；相邻两个阶段之间，按「笔画中心点最近」把笔画两两
配对，再逐点直线插值。**多出来的笔画从一个点长出来、少掉的缩成一个点**。所以
甲骨文→小篆→楷书每一段都是笔画在真正地「移动、弯曲」，而不是两个字虚虚地重叠。
颜色也会从实物的 `color` 渐变到墨黑。

> Every stage is drawn as its own **standard, independent** glyph. Transitions are
> **point-based morphs** (not cross-fades): each stroke is resampled to `K=26`
> evenly-spaced points (via `getPointAtLength`), strokes of neighbouring stages are
> paired by nearest centroid and interpolated point-by-point; extra strokes grow
> from / shrink to a point. So oracle→seal→kai truly *transform*. (Engine lives in
> the “point-based morph engine” section of `script.js`.)

> 好处 / Why it's nice: 不再要求各阶段「骨架一致」，所以每个阶段都能照标准字形画；
> 形变又是连续的，肉眼能看出演化规律。
> No need for stages to share a skeleton — each can be the correct standard form,
> and the morph is still continuous.

### 楷书来自权威开源数据 / Modern forms come from open data
`kai` 笔画是从 **makemeahanzi**（开源汉字字形库）的「笔画中线 medians」提取、
归一化到 0–100 画框得到的，所以楷书是**精准**的。提取脚本见 `tools/`（如保留）。

> The `kai` strokes are the stroke **medians** from **makemeahanzi**, normalised
> into the 0–100 box — so the modern form is pixel-accurate.

### ✏️ 加一个新字 / Add a character
在 `script.js` 的 `CHARACTERS` 里复制一个现成的字，填这几项：

```js
key: {
  char,pinyin,meaning,tint,fact,            // 基本信息
  color:'#4FA3D1',                          // 实物阶段的颜色（会渐变到墨黑）
  decor:'sun',                              // 可选：实物阶段画装饰（如太阳光芒）
  strokeWidth:5,                            // 可选：笔画粗细，默认 6.5
  illus:[ "M...", ... ],                    // 实物简笔画（中线笔画）
  oracle:[ "M...", ... ],                   // 甲骨文（手绘对照标准字形）
  seal:[ "M...", ... ],                     // 小篆（手绘对照标准字形）
  kai:[ "M...", ... ],                      // 楷书（建议用 makemeahanzi 中线）
  caps:[ {zh,en},{zh,en},{zh,en},{zh,en} ]  // 4 句双语说明
}
```

每个阶段的笔画**数量、形状都可以随便不一样**——形变引擎会自动重新采样、配对。
只要把每个阶段画成它正确的标准字形即可。小提示：含「十字」「四条腿」这种由几段
组成的一笔，可以直接写成多段路径 `"M..L.. M..L.."`，引擎会自动拆开分别形变。

> Stages can have **any number of strokes, any shapes** — the engine resamples and
> pairs them automatically. Just draw each stage as its correct standard form.
> A stroke made of several sub-paths (`"M..L.. M..L.."`, e.g. a cross or legs) is
> split automatically and morphed piece-by-piece.

加好后**自动**出现在网格、可点击。`CHAR_ORDER` 控制顺序。

### 取楷书中线的小脚本 / Script to grab a kai median
```python
# 下载 makemeahanzi 的 graphics.txt 后，按字提取 medians，翻转 y、归一化到 0–100：
import json
want = {'日':'ri', ...}
for line in open('graphics.txt',encoding='utf-8'):
    o = json.loads(line)
    if o['character'] in want:
        medians = o['medians']   # 每笔一串 [x,y]，再翻转 y、缩放居中即可
```

## 为什么不直接用网上下载的甲骨文/小篆 SVG？/ Why not just use web SVGs for the ancient forms?

楷书已经用了**真实开源数据**。甲骨文/小篆没有可靠、齐全、授权清晰的开源矢量
数据集，而且它们和实物阶段需要「骨架一致」才能形变——所以这两套是**对照标准
字形精心手绘**的中线笔画：既标准、又能丝滑变形、还零依赖好部署。想进一步逼真，
可以找开源篆书/甲骨文字体，用 `fontTools` 转成轮廓再描线。

> Modern forms already use real open data. Oracle/seal have no reliable open
> vector dataset and must share a skeleton with the picture stage to morph, so
> they are **hand-drawn to standard references**. To push realism further, source
> open seal/oracle fonts and convert outlines with `fontTools`.
