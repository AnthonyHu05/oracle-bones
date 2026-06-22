/* =====================================================================
   看汉字怎么长大 · Watch Chinese Characters Grow Up
   主逻辑 / Main logic

   设计思路 / How the evolution is shown
   ---------------------------------------------------------------------
   每个字有 4 个阶段：实物简笔画 → 甲骨文 → 小篆 → 楷书。
   每个阶段都画成各自**标准、独立**的字形（楷书来自开源字形数据 makemeahanzi 的
   笔画中线）。所有过渡都用**逐点形变**：把每一笔重新采样成等距的点，相邻阶段按
   「笔画最近」配对后逐点插值——所以每一段都是笔画在真正“移动/变形”，不是淡入淡出。
   引擎见下方「3. 逐点形变引擎」。

   Stages: picture → oracle bone → seal script → modern (kai), each its own
   standard glyph (modern = makemeahanzi medians). ALL transitions are true
   point-based morphs (resample → nearest-pair → interpolate), not cross-fades.

   目录 / Contents: 1.界面文字 2.汉字数据 3.形变引擎 4.音效 5.路由
                    6.网格 7.详情页 8.语言 9.启动
   ===================================================================== */

/* =====================================================================
   1. 界面文字（双语） / UI strings
   ===================================================================== */
let LANG = 'zh';

/* 界面文案：每个键只存一种语言，靠 LANG 取一种显示（单语言）。
   UI strings: one language per key, shown by LANG (single-language UI). */
const UI = {
  home_title: { zh: '甲骨文的世界', en: 'The World of Oracle Bones' },
  home_sub: {
    zh: '三千多年前，中国最早的文字刻在龟甲和兽骨上。它们像一幅幅小图画——一起来认识它。',
    en: "China's oldest writing was carved on shells and bones over 3,000 years ago — like tiny pictures. Come and explore."
  },
  start_btn: { zh: '开始探索', en: 'Begin' },
  back_home: { zh: '回首页', en: 'Home' },
  back_grid: { zh: '返回', en: 'Back' },
  grid_title: { zh: '选择一个汉字', en: 'Choose a character' },
  tap_hint: { zh: '点击或拖动，查看演变', en: 'Tap or drag to explore' },
  next_char: { zh: '下一个字', en: 'Next character' },
  quiz_prompt: { zh: '这是哪个字？', en: 'Which character is this?' },
  quiz_next: { zh: '下一题', en: 'Next' },
  about_title: { zh: '什么是甲骨文', en: 'What Are Oracle Bones?' },
  about_cta: { zh: '去玩「猜一猜」', en: 'Try the guessing game' },
  puzzle_prompt: { zh: '点两块交换，把甲骨文拼好', en: 'Tap two pieces to swap and rebuild the glyph' },
  puzzle_new: { zh: '换一个字', en: 'New character' },
  dict_title: { zh: '查甲骨文', en: 'Look It Up in Oracle Bone' },
  dict_ph: { zh: '输入汉字（一个字、词，或你的名字）', en: 'Type Chinese characters (a word or your name)' },
  dict_none: { zh: '暂无甲骨文', en: 'no oracle form' },
};

/* =====================================================================
   板块 / sections —— 首页导航卡片
   view 为 null 的板块显示“敬请期待”/ sections with view:null show "coming soon"
   ===================================================================== */
const SECTIONS = [
  { id:'evolve', view:'grid', glyph:'字',
    title:{ zh:'汉字的演变', en:'Character Evolution' },
    desc:{ zh:'看八个字从远古的图画，一步步变成今天的样子。',
           en:'Watch eight characters grow from ancient pictures into modern form.' } },
  { id:'guess', view:'quiz', glyph:'？',
    title:{ zh:'猜一猜甲骨文', en:'Guess the Oracle' },
    desc:{ zh:'看一个古老的字形，猜猜它是今天的哪个字。',
           en:'See an ancient glyph — can you tell which character it is?' } },
  { id:'puzzle', view:'puzzle', glyph:'拼',
    title:{ zh:'甲骨文拼图', en:'Oracle Jigsaw' },
    desc:{ zh:'甲骨文被打乱成小块，把它拼回原来的样子。',
           en:'An oracle glyph is scrambled into tiles — put it back together.' } },
  { id:'dict', view:'dict', glyph:'查',
    title:{ zh:'查甲骨文字典', en:'Oracle Dictionary' },
    desc:{ zh:'输入一个字或你的名字，看看它的甲骨文；也能翻看整个字库。',
           en:'Type a character or your name to see it in oracle bone — or browse the whole library.' } },
  { id:'about', view:'about', glyph:'龟',
    title:{ zh:'什么是甲骨文', en:'What Are Oracle Bones?' },
    desc:{ zh:'三千多年前，人们为什么把字刻在龟甲和兽骨上？',
           en:'Why did people carve writing on shells and bones 3,000 years ago?' } },
];

/* =====================================================================
   「什么是甲骨文」板块的图文 / panels for the "What Are Oracle Bones?" section
   每个 panel：一幅简单的水墨线条插画 + 标题 + 正文（双语，单语言显示）
   Each panel: a simple line illustration + heading + body (shown in one language)
   ===================================================================== */
const ABOUT = [
  { svg:`<svg viewBox="0 0 120 100">
      <path d="M22 34 Q17 18 37 21 L84 25 Q104 27 99 47 L96 69 Q94 86 73 82 L31 78 Q13 76 18 56 Z" fill="#DEE2DA" stroke="#20251F" stroke-width="2"/>
      <g stroke="#20251F" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="44" cy="50" rx="9" ry="12"/><line x1="37" y1="50" x2="51" y2="50"/>
        <path d="M74 36 q-11 6 -11 18 q0 12 11 18 q-6 -8 -6 -18 q0 -10 6 -18"/>
      </g></svg>`,
    title:{ zh:'最古老的文字', en:'The oldest writing' },
    body:{ zh:'甲骨文是中国已知最早的成熟文字，出现在约三千多年前的商朝。',
           en:'Oracle-bone script is the oldest known mature writing in China, from the Shang dynasty over 3,000 years ago.' } },

  { svg:`<svg viewBox="0 0 120 100">
      <ellipse cx="40" cy="50" rx="25" ry="33" fill="#DEE2DA" stroke="#20251F" stroke-width="2"/>
      <line x1="40" y1="19" x2="40" y2="81" stroke="#20251F" stroke-width="1.4"/>
      <line x1="21" y1="40" x2="59" y2="40" stroke="#20251F" stroke-width="1.4"/>
      <line x1="19" y1="60" x2="61" y2="60" stroke="#20251F" stroke-width="1.4"/>
      <path d="M86 26 Q108 25 104 53 Q101 77 85 78 Q92 60 89 46 Q87 35 86 26 Z" fill="#DEE2DA" stroke="#20251F" stroke-width="2"/>
      <path d="M85 78 q-3 10 -8 14" stroke="#20251F" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    title:{ zh:'刻在龟甲和兽骨上', en:'Carved on shells and bones' },
    body:{ zh:'那时还没有纸。人们把字刻在乌龟的腹甲和牛的肩胛骨上，所以叫“甲骨文”。',
           en:'There was no paper yet, so people carved characters onto turtle shells and ox shoulder-bones — hence the name “shell-and-bone script”.' } },

  { svg:`<svg viewBox="0 0 120 100">
      <ellipse cx="47" cy="52" rx="29" ry="33" fill="#DEE2DA" stroke="#20251F" stroke-width="2"/>
      <path d="M47 28 L47 76 M47 50 L65 60" stroke="#20251F" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M37 40 L47 50 M39 66 L47 57" stroke="#20251F" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M95 80 q-9 -10 -3 -22 q3 8 9 6 q-3 9 4 13 q-3 8 -10 3 Z" fill="#B7892F"/></svg>`,
    title:{ zh:'古人用它来占卜', en:'Used to ask questions' },
    body:{ zh:'遇到大事，商朝人会先问祖先和神灵：在甲骨上钻孔、用火烧，看裂开的纹路判断吉凶，再把问题和结果刻下来。',
           en:'Before big decisions, the Shang asked their ancestors and gods — they heated the bones until they cracked, read the cracks for an answer, then carved the question and outcome.' } },

  { svg:`<svg viewBox="0 0 120 100">
      <path d="M20 38 Q16 24 34 26 L70 30 Q88 32 84 50 L82 67 Q80 82 63 78 L33 74 Q17 72 19 56 Z" fill="#DEE2DA" stroke="#20251F" stroke-width="2"/>
      <g stroke="#20251F" stroke-width="2" fill="none" stroke-linecap="round"><ellipse cx="43" cy="51" rx="7" ry="9"/><line x1="38" y1="51" x2="48" y2="51"/></g>
      <circle cx="82" cy="60" r="17" fill="rgba(47,110,99,0.10)" stroke="#20251F" stroke-width="2.6"/>
      <line x1="94" y1="72" x2="105" y2="84" stroke="#20251F" stroke-width="4" stroke-linecap="round"/></svg>`,
    title:{ zh:'它怎样重见天日', en:'How it was found again' },
    body:{ zh:'甲骨在地下埋了三千年。1899 年，学者王懿荣在中药“龙骨”上认出了古老的刻字，甲骨文才被重新发现。',
           en:'The bones lay buried for 3,000 years. In 1899 the scholar Wang Yirong recognised ancient carvings on “dragon bones” sold as medicine — and oracle-bone script was rediscovered.' } },

  { svg:`<svg viewBox="0 0 120 100">
      <g stroke="#20251F" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="28" cy="50" rx="14" ry="17"/><line x1="20" y1="50" x2="36" y2="50"/></g>
      <path d="M50 50 L72 50 M66 44 L72 50 L66 56" stroke="#2F6E63" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="96" y="51" font-family="Noto Serif SC, Songti SC, serif" font-size="40" fill="#20251F" text-anchor="middle" dominant-baseline="central">日</text></svg>`,
    title:{ zh:'为什么重要', en:'Why it matters' },
    body:{ zh:'甲骨文让我们知道古人怎样生活、怎样思考，它也是今天汉字的祖先——你写的每个字，都从这里走来。',
           en:'Oracle bones tell us how ancient people lived and thought. They are also the ancestor of today’s characters — every character you write began here.' } },
];

/* 四个阶段的名字 / the four stage names */
const STAGE_NAMES = [
  { zh: '原物', en: 'Origin' },
  { zh: '甲骨文', en: 'Oracle Bone' },
  { zh: '小篆', en: 'Seal Script' },
  { zh: '楷书', en: 'Regular Script' },
];

const INK = '#20251F'; // 墨 / ink

/* =====================================================================
   2. 汉字数据 / Character data
   ---------------------------------------------------------------------
   每个字提供 4 套笔画（都用 viewBox 0 0 100 100 的描边中线）：
     illus  实物简笔画 —— 可爱的简笔画（颜色见 color）
     oracle 甲骨文     —— 标准字形（手绘对照）
     seal   小篆       —— 标准字形（手绘对照）
     kai    楷书       —— 来自 makemeahanzi 开源数据的笔画中线（精准）
   再加 caps（4 句双语说明）、color（实物的颜色，会在形变中渐变成墨黑）、
   可选 tint / fact / decor('sun') / strokeWidth。

   各阶段的笔画数量、形状都可以随便不一样——形变引擎会自动采样、配对、补间。
   含「十字/四条腿」这种由几段组成的一笔，直接写成多段路径 "M..L.. M..L.." 即可，
   引擎会自动拆开分别形变。
   Stages may have any stroke count/shape; the engine resamples & pairs them.

   想加新字：抓 makemeahanzi 的中线当 kai，再照着手绘另外三套即可（见 README）。
   ===================================================================== */

/* 实物阶段的颜色：偏沉、偏土的博物馆色，会在形变里渐变成墨 */
/* picture-stage colours: muted, earthy museum tones that fade to ink */
const PAL = { sun:'#BE8A3C', moon:'#6E7E93', mount:'#6E8A63', water:'#5A87A0',
              fire:'#BC5A3C', wood:'#7E8C52', fish:'#5E8C86', horse:'#9A7A4E' };

const CHARACTERS = {

  /* ============ 日 / Sun ============ */
  ri: {
    char:'日', pinyin:'rì', meaning:{zh:'太阳',en:'Sun'}, tint:'#FFF1D6',
    color: PAL.sun, decor:'sun',
    fact:{ zh:'<b>含义：</b>“日”既指太阳，也表示一天——从日出到日落正好是一天。',
           en:"<b>Meaning:</b> '日' means both the sun and a day — from sunrise to sunset." },
    // 实物：圆太阳 + 中心点（光芒由 decor 画）/ sun disc + centre dot (rays via decor)
    illus:[ 'M 50 24 C 62 24 70 36 70 50 C 70 64 62 76 50 76 C 38 76 30 64 30 50 C 30 36 38 24 50 24 Z',
            'M 47 50 L 53 50' ],
    // 甲骨文：圆圈 + 中间一短横 / circle + middle dash
    oracle:[ 'M 50 22 C 64 22 72 35 72 50 C 72 65 64 78 50 78 C 36 78 28 65 28 50 C 28 35 36 22 50 22 Z',
             'M 42 50 L 58 50' ],
    // 小篆：竖长圆框 + 中间横 / tall rounded frame + middle bar
    seal:[ 'M 38 18 C 33 18 32 21 32 26 L 32 74 C 32 79 33 82 38 82 L 62 82 C 67 82 68 79 68 74 L 68 26 C 68 21 67 18 62 18 Z',
           'M 32 50 L 68 50' ],
    kai:["M 27.6 16.1 L 31.6 20.2 L 32.3 23.3 L 32.8 34.2 L 31.8 61.8 L 29.5 75.3 L 29.5 82.4","M 35.7 18.6 L 37.3 19.9 L 38.8 19.7 L 65.5 14.0 L 69.1 15.7 L 71.5 18.1 L 72.4 41.4 L 72.4 72.8 L 70.9 78.6 L 71.2 86.0","M 35.5 45.4 L 36.8 46.3 L 39.9 46.3 L 54.6 43.3 L 59.7 43.4","M 33.6 78.5 L 35.2 77.1 L 43.6 75.9 L 60.1 74.1 L 65.2 74.5"],
    caps:[
      { zh:'古人抬头看见太阳，照着它的样子画了下来。', en:'People looked up at the sun and drew its round shape.' },
      { zh:'在甲骨上，太阳被刻成一个圆圈，中间一点。', en:'On oracle bones, the sun became a circle with a dot inside.' },
      { zh:'到了小篆，外形变得方正、规整。', en:'By the seal script, the shape grew square and even.' },
      { zh:'这就是今天通行的“日”。', en:"This is the '日' we write today." } ]
  },

  /* ============ 月 / Moon ============ */
  yue: {
    char:'月', pinyin:'yuè', meaning:{zh:'月亮',en:'Moon'}, tint:'#E7F0FA',
    color: PAL.moon,
    fact:{ zh:'<b>含义：</b>“月”指月亮，也表示月份——月亮圆缺一轮大约是一个月。',
           en:"<b>Meaning:</b> '月' is the moon, and also a month — about one full cycle of its phases." },
    // 实物：弯月牙 + 一点 / crescent + a dot
    illus:[ 'M 60 18 C 47 18 34 29 32 50 C 34 71 47 82 60 82 C 51 73 47 62 48 50 C 47 38 51 27 60 18 Z',
            'M 49.5 50 L 50.5 50' ],
    // 甲骨文：月牙 + 中间一短竖 / crescent + a short inner mark
    oracle:[ 'M 58 20 C 46 20 34 30 32 50 C 34 70 46 80 58 80 C 50 72 46 62 47 50 C 46 38 50 28 58 20 Z',
             'M 50 44 L 50 56' ],
    // 小篆：竖长的月框 + 两短横（左撇 + 横折钩 + 两横）/ tall 月 frame + two bars
    seal:[ 'M 44 18 C 38 30 34 45 33 64 C 32 74 34 80 37 84',
           'M 44 18 L 63 18 C 67 18 68 21 68 25 L 68 70 C 68 78 64 83 58 84',
           'M 46 40 L 64 40', 'M 45 56 L 63 56' ],
    kai:["M 42.9 16.1 L 46.6 19.0 L 47.3 24.3 L 47.1 41.0 L 45.4 56.0 L 43.1 63.6 L 38.9 72.0 L 33.4 79.0 L 28.6 83.6 L 25.0 86.0","M 49.9 17.0 L 51.2 18.1 L 58.0 17.1 L 70.1 14.0 L 73.1 15.5 L 74.5 17.5 L 75.0 60.7 L 74.7 79.0 L 72.9 82.4 L 70.0 81.7 L 61.3 78.0","M 50.1 37.5 L 51.3 36.7 L 61.0 35.3 L 65.9 35.4","M 48.4 53.6 L 49.7 52.9 L 61.0 51.2 L 65.9 51.3"],
    caps:[
      { zh:'夜空中弯弯的月亮，被人照着画了下来。', en:'The curved moon in the night sky was drawn just as it looked.' },
      { zh:'甲骨文的“月”，保留了月牙的形状。', en:"The oracle-bone '月' keeps the shape of a crescent." },
      { zh:'小篆把它写得修长而对称。', en:'Seal script made it tall and balanced.' },
      { zh:'这就是今天的“月”，里面有两横。', en:"This is today's '月', with two strokes inside." } ]
  },

  /* ============ 山 / Mountain ============ */
  shan: {
    char:'山', pinyin:'shān', meaning:{zh:'山',en:'Mountain'}, tint:'#E7F3E8',
    color: PAL.mount,
    fact:{ zh:'<b>观察：</b>“山”中间一笔最高，正像山峰中间高、两边低。',
           en:"<b>Notice:</b> the middle stroke of '山' is the tallest — just like a mountain ridge." },
    // 实物：三座山（一笔折线）/ three mountains (one polyline)
    illus:[ 'M 20 74 L 32 46 L 42 64 L 50 34 L 58 64 L 68 46 L 80 74' ],
    // 甲骨文：三个尖峰 / three peaks
    oracle:[ 'M 22 72 L 32 44 L 41 64 L 50 32 L 59 64 L 68 44 L 78 72' ],
    // 小篆：底线 + 三竖（中间最高）/ base line + three uprights
    seal:[ 'M 20 72 L 80 72', 'M 30 72 C 30 60 30 52 30 46',
           'M 50 72 L 50 28', 'M 70 72 C 70 60 70 52 70 46' ],
    kai:["M 44.7 14.0 L 50.3 19.0 L 49.1 67.5 L 46.9 70.3","M 16.0 50.5 L 18.2 52.4 L 20.5 56.5 L 20.9 64.5 L 19.8 78.8 L 24.9 78.7 L 35.2 75.8 L 55.5 71.4 L 69.5 69.2 L 76.0 68.9 L 77.7 67.2","M 80.0 40.9 L 81.6 42.2 L 84.0 46.8 L 78.7 86.0"],
    caps:[
      { zh:'连绵的群山，有高低起伏的三座山峰。', en:'A range of mountains, with three rising peaks.' },
      { zh:'甲骨文用三个尖峰表示“山”。', en:"The oracle bones drew '山' as three peaks." },
      { zh:'小篆把山峰立成竖笔，立在一条底线上。', en:'Seal script turned the peaks into uprights on a base line.' },
      { zh:'这就是今天的“山”。', en:"This is today's '山'." } ]
  },

  /* ============ 水 / Water ============ */
  shui: {
    char:'水', pinyin:'shuǐ', meaning:{zh:'水',en:'Water'}, tint:'#E1F0F6',
    color: PAL.water,
    fact:{ zh:'<b>观察：</b>“水”中间一竖带钩，两旁分开，正像水流分向两侧。',
           en:"<b>Notice:</b> '水' has a hooked line in the middle with splashes to the sides — like water parting." },
    // 实物：水流 + 两边水花 / stream + two splashes
    illus:[ 'M 50 16 C 44 30 56 44 50 58 C 46 68 50 76 53 84',
            'M 36 34 C 30 42 30 52 35 60', 'M 64 34 C 70 42 70 52 65 60' ],
    // 甲骨文：弯弯的水线 + 两侧水滴 / wavy water line + side droplets
    oracle:[ 'M 50 18 C 45 30 55 42 50 54 C 47 64 50 74 52 82',
             'M 38 36 C 33 42 32 50 36 58', 'M 62 36 C 67 42 68 50 64 58' ],
    // 小篆：中间水流 + 两侧各两道水纹（左右对称，像流动的水）/ symmetric flowing water
    seal:[ 'M 50 16 C 47 32 53 46 50 60 C 49 70 50 78 50 84',
           'M 49 32 C 41 36 36 46 38 58', 'M 51 32 C 59 36 64 46 62 58',
           'M 48 54 C 43 60 40 66 37 76', 'M 52 54 C 57 60 60 66 63 76' ],
    kai:["M 43.6 18.3 L 45.8 19.9 L 47.5 21.9 L 46.4 47.8 L 46.3 77.7 L 44.5 81.7 L 41.0 80.5 L 35.2 77.7 L 35.0 77.1 L 34.1 77.1","M 16.8 44.8 L 21.9 45.6 L 33.8 43.1 L 36.0 43.7 L 36.9 44.5 L 36.2 47.5 L 33.7 53.4 L 27.7 63.7 L 20.1 72.0 L 14.0 76.1","M 65.2 29.1 L 66.3 30.1 L 67.6 32.8 L 63.9 37.3 L 53.2 47.3 L 53.2 48.0","M 49.0 44.1 L 49.9 47.0 L 55.5 53.4 L 64.6 62.9 L 68.9 66.3 L 72.0 68.1 L 86.0 69.9"],
    caps:[
      { zh:'河里流动的水，被画成几道水流。', en:'Flowing river water, drawn as a few moving lines.' },
      { zh:'甲骨文用弯曲的线条表示流水。', en:'The oracle bones used curved lines for flowing water.' },
      { zh:'小篆中间是水流，两旁是水花。', en:'In seal script a stream runs down the middle, with splashes on each side.' },
      { zh:'这就是今天的“水”。', en:"This is today's '水'." } ]
  },

  /* ============ 火 / Fire ============ */
  huo: {
    char:'火', pinyin:'huǒ', meaning:{zh:'火',en:'Fire'}, tint:'#FFE6DC',
    color: PAL.fire,
    fact:{ zh:'<b>观察：</b>“火”上方两点像迸出的火星，下方像柴堆燃起的火焰。',
           en:"<b>Notice:</b> the two dots on top of '火' are like sparks, with flames rising below." },
    // 实物：火苗（左中右三道，两边向内卷）/ flames (sides curl inward)
    illus:[ 'M 38 58 C 35 46 38 34 45 26', 'M 50 60 L 50 22', 'M 62 58 C 65 46 62 34 55 26' ],
    // 甲骨文：跳动的火苗 / dancing flames
    oracle:[ 'M 40 56 C 37 46 39 36 45 28', 'M 50 58 L 50 26', 'M 60 56 C 63 46 61 36 55 28' ],
    // 小篆：中间火苗（人形）+ 两边火星 / central flame body + two sparks
    seal:[ 'M 50 24 L 50 46',
           'M 49 34 C 45 48 41 58 35 74', 'M 51 34 C 55 48 59 58 65 74',
           'M 40 40 C 37 35 37 30 40 26', 'M 60 40 C 63 35 63 30 60 26' ],
    kai:["M 18.0 37.2 L 25.8 46.1 L 27.5 50.8","M 65.2 29.3 L 67.2 31.6 L 68.0 33.7 L 63.5 38.3 L 53.1 46.8","M 38.8 14.6 L 42.5 16.5 L 44.6 18.4 L 45.2 20.3 L 43.7 45.8 L 42.0 57.4 L 40.7 61.7 L 37.1 69.3 L 32.4 74.7 L 23.9 80.4 L 14.0 84.4","M 46.1 52.3 L 46.9 55.5 L 54.9 66.7 L 62.8 75.8 L 68.1 80.6 L 70.3 82.1 L 86.0 85.4"],
    caps:[
      { zh:'向上跳动的火苗，还带着溅起的火星。', en:'Flames leaping upward, with sparks flying off.' },
      { zh:'甲骨文的“火”，像几道升腾的火焰。', en:"The oracle-bone '火' looks like rising flames." },
      { zh:'小篆中间像人形，两旁是火苗。', en:'In seal script, a figure stands in the middle with flames at its sides.' },
      { zh:'这就是今天的“火”。', en:"This is today's '火'." } ]
  },

  /* ============ 木 / Tree·Wood ============ */
  mu: {
    char:'木', pinyin:'mù', meaning:{zh:'木',en:'Tree'}, tint:'#EAF2DD',
    color: PAL.wood,
    fact:{ zh:'<b>含义：</b>“木”是树的样子——上面的横是枝，下面两笔是根。',
           en:"<b>Meaning:</b> '木' pictures a tree — the top stroke is its branches, the lower two its roots." },
    // 实物：树（干 + 上枝 + 下根）/ tree: trunk + branches + roots
    illus:[ 'M 50 16 L 50 84', 'M 32 34 L 50 18 L 68 34', 'M 30 80 L 50 60 L 70 80' ],
    // 甲骨文：树形 / tree shape
    oracle:[ 'M 50 18 L 50 82', 'M 34 32 L 50 20 L 66 32', 'M 30 78 L 50 60 L 70 78' ],
    // 小篆：横 + 竖 + 撇 + 捺（弯弯的）/ 一丨丿乀 (curvy)
    seal:[ 'M 26 40 C 40 37 60 37 74 40', 'M 50 18 L 50 84',
           'M 50 50 C 42 60 36 68 28 80', 'M 50 50 C 58 60 64 68 72 80' ],
    kai:["M 23.7 38.5 L 28.0 39.5 L 63.0 34.3 L 65.8 34.3 L 69.0 35.2","M 42.6 14.0 L 47.1 18.6 L 46.4 65.2 L 45.4 86.0","M 44.4 39.8 L 43.1 41.1 L 42.1 44.8 L 38.5 50.8 L 32.4 58.5 L 25.0 66.2 L 19.5 70.6 L 15.4 73.1","M 48.9 40.3 L 50.7 43.9 L 58.5 54.6 L 67.6 65.0 L 71.0 66.7 L 84.6 70.1"],
    caps:[
      { zh:'一棵树：上有枝条，下有根须。', en:'A tree, with branches above and roots below.' },
      { zh:'甲骨文的“木”，上面是枝，下面是根。', en:"In the oracle-bone '木', branches reach up and roots reach down." },
      { zh:'小篆把它写成一横一竖，再加撇捺。', en:'Seal script wrote it as a cross with a sweep on each side.' },
      { zh:'这就是今天的“木”，意思是树木。', en:"This is today's '木', meaning tree or wood." } ]
  },

  /* ============ 鱼 / Fish ============ */
  yu: {
    char:'鱼', pinyin:'yú', meaning:{zh:'鱼',en:'Fish'}, tint:'#E1F1F0', strokeWidth:5,
    color: PAL.fish,
    fact:{ zh:'<b>观察：</b>“鱼”中间的“田”，原本是鱼的身体。',
           en:"<b>Notice:</b> the '田' in the middle of '鱼' was once the fish's body." },
    // 实物：鱼（头 + 身 + 身上十字 + 尾）/ fish: head + body + cross + tail
    illus:[ 'M 40 26 L 50 14 L 60 26',
            'M 50 26 C 64 26 68 39 68 52 C 68 65 61 74 50 74 C 39 74 32 65 32 52 C 32 39 36 26 50 26 Z',
            'M 50 26 L 50 74 M 34 50 L 66 50',
            'M 38 80 L 50 73 L 62 80' ],
    // 甲骨文：竖起来的鱼 / upright fish
    oracle:[ 'M 42 26 L 50 14 L 58 26',
             'M 50 28 C 62 28 66 40 66 52 C 66 64 60 72 50 72 C 40 72 34 64 34 52 C 34 40 38 28 50 28 Z',
             'M 50 28 L 50 72 M 36 50 L 64 50',
             'M 40 78 L 50 72 L 60 78' ],
    // 小篆：头 + 田形身体 + 十字 + 尾 / head + 田 body + cross + tail
    seal:[ 'M 42 24 L 50 14 L 58 24', 'M 38 30 L 62 30 L 62 58 L 38 58 Z',
           'M 50 30 L 50 58 M 38 44 L 62 44', 'M 40 74 L 50 66 L 60 74' ],
    kai:["M 44.5 14.7 L 45.9 16.9 L 46.3 19.2 L 42.3 24.5 L 34.5 32.6 L 29.2 36.9 L 25.9 38.9","M 43.1 28.0 L 46.4 27.7 L 56.0 25.5 L 58.4 25.6 L 61.0 26.9 L 56.3 34.6 L 50.2 42.1","M 26.7 45.1 L 29.6 47.3 L 30.5 49.5 L 36.4 73.5","M 32.4 45.5 L 34.4 46.5 L 43.2 44.7 L 62.4 41.8 L 67.8 42.0 L 68.9 42.9 L 71.2 46.0 L 69.3 52.0 L 67.0 63.3 L 64.8 69.2 L 65.3 72.0","M 39.2 58.1 L 42.9 58.0 L 54.9 55.7 L 58.5 55.4 L 60.5 56.0","M 47.2 45.8 L 49.6 47.8 L 49.9 49.6 L 49.7 65.0 L 48.4 66.9","M 38.3 71.2 L 39.8 70.3 L 60.0 67.8 L 61.7 66.8","M 14.0 83.4 L 20.1 85.3 L 45.8 82.2 L 76.6 80.1 L 81.0 80.8 L 86.0 82.9"],
    caps:[
      { zh:'一条鱼，有头、身体和尾巴。', en:'A fish, with a head, a body and a tail.' },
      { zh:'甲骨文把鱼竖了起来，头朝上。', en:'The oracle bones stood the fish upright, head at the top.' },
      { zh:'小篆中，鱼的身体变成了“田”的形状。', en:"In seal script, the fish's body became the shape '田'." },
      { zh:'这就是今天的“鱼”。', en:"This is today's '鱼'." } ]
  },

  /* ============ 马 / Horse ============ */
  ma: {
    char:'马', pinyin:'mǎ', meaning:{zh:'马',en:'Horse'}, tint:'#F3EAD8',
    color: PAL.horse,
    fact:{ zh:'<b>趣味：</b>“马”最早就是一匹马的简笔画，后来才慢慢变成现在的样子。',
           en:"<b>Did you know:</b> '马' began as a simple drawing of a horse, then gradually became today's form." },
    // 实物：侧面的马（马头在左上 + 脖子 + 马背 + 四条腿 + 尾巴）/ side-view horse facing left
    illus:[ 'M 18 52 C 18 46 20 42 24 42 C 27 42 29 45 30 48 C 32 40 36 36 42 37 C 50 35 58 35 66 39 C 71 41 72 46 70 51',
            'M 30 49 L 29 73 M 42 48 L 42 75 M 58 47 L 58 73 M 68 50 L 69 73',
            'M 70 50 C 77 56 77 69 71 79' ],
    // 甲骨文：还看得出马头、鬃毛和四条腿 / still shows head, mane and legs
    oracle:[ 'M 20 54 C 20 48 22 44 26 44 C 29 44 31 47 32 50 C 34 42 38 38 44 39 C 52 37 60 37 67 41 C 72 43 73 48 71 53',
             'M 32 51 L 31 73 M 44 50 L 44 75 M 58 49 L 58 73 M 67 52 L 68 73',
             'M 71 52 C 78 58 78 71 72 81' ],
    // 小篆：鬃毛 + 身体 + 腿 + 尾（线条化）/ mane + body + legs + tail
    seal:[ 'M 40 18 C 50 16 60 18 62 24 C 63 30 60 34 56 36',
           'M 44 24 C 42 38 42 48 46 56 C 56 56 66 54 72 56',
           'M 46 56 L 44 76 M 58 56 L 58 74', 'M 72 56 C 74 64 72 72 66 80' ],
    kai:["M 32.4 17.8 L 37.3 18.5 L 47.0 16.1 L 59.8 14.0 L 63.6 14.4 L 65.7 16.0 L 67.1 17.7 L 65.0 25.7 L 63.2 38.2 L 61.7 44.5","M 36.5 24.9 L 38.4 26.6 L 40.5 29.6 L 38.7 47.5 L 39.3 52.6 L 43.5 53.0 L 58.8 49.9 L 74.4 48.1 L 80.5 48.7 L 83.5 51.6 L 78.6 74.7 L 77.0 79.8 L 74.8 84.0 L 72.3 86.0 L 69.5 85.0 L 59.7 79.4","M 16.5 69.7 L 22.5 71.1 L 41.7 67.5 L 64.0 64.9 L 71.3 67.0"],
    caps:[
      { zh:'一匹马，有头、鬃毛、四条腿和尾巴。', en:'A horse, with a head, mane, four legs and a tail.' },
      { zh:'甲骨文的“马”，仍能看出鬃毛和马腿。', en:"In the oracle-bone '马', you can still see its mane and legs." },
      { zh:'小篆把马的轮廓简化成流畅的线条。', en:'Seal script simplified the horse into flowing lines.' },
      { zh:'这就是今天的“马”。', en:"This is today's '马'." } ]
  },
};

/* 字的固定顺序 / fixed order */
const CHAR_ORDER = ['ri','yue','shan','shui','huo','mu','yu','ma'];

/* =====================================================================
   3. 逐点形变引擎 / point-based morph engine
   ---------------------------------------------------------------------
   思路：把每个阶段的每一笔都重新采样成 K 个等距的点；相邻两个阶段之间，
   按「笔画中心点最近」配对，再逐点直线插值。多出来的笔画从一个点长出来、
   少掉的笔画缩成一个点。这样任意两个标准字形之间都能真正“变形”，而不是淡入淡出。

   Each stroke of each stage is resampled to K evenly-spaced points. Between two
   neighbouring stages, strokes are matched by nearest centroid and interpolated
   point-by-point; unmatched strokes grow from / shrink to a point. Any two
   glyphs can therefore truly morph, not cross-fade.
   ===================================================================== */
const K = 26;  // 每一笔采样多少个点 / sample points per stroke

let measurePath = null; // 用来量长度/取点的隐藏 path / hidden path for measuring

function hexToRgb(h){ h = h.replace('#',''); if(h.length===3) h = h.split('').map(x=>x+x).join(''); const n = parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function lerpColor(a, b, t){ const A = hexToRgb(a), B = hexToRgb(b); return `rgb(${Math.round(A[0]+(B[0]-A[0])*t)},${Math.round(A[1]+(B[1]-A[1])*t)},${Math.round(A[2]+(B[2]-A[2])*t)})`; }
function easeInOutCubic(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t){ return a + (b - a) * t; }

// 把含多段(M..M..)的路径拆成单段 / split a path with several sub-paths (M..M..) into single sub-paths
function splitSubpaths(d){ return d.trim().split(/(?=M)/i).map(s => s.trim()).filter(Boolean); }

// 把一段路径采样成 K 个等距的点 / resample one sub-path to K evenly-spaced points
function resample(d){
  measurePath.setAttribute('d', d);
  const L = measurePath.getTotalLength() || 0.0001;
  const pts = [];
  for(let i=0;i<K;i++){
    const p = measurePath.getPointAtLength(L * i / (K - 1));
    pts.push([p.x, p.y]);
  }
  return pts;
}
function centroid(pts){ let x=0,y=0; for(const p of pts){ x+=p[0]; y+=p[1]; } return [x/pts.length, y/pts.length]; }
function collapse(c){ const a=[]; for(let i=0;i<K;i++) a.push([c[0],c[1]]); return a; } // 收缩成一个点 / all points at one spot
function dist2(a,b){ const dx=a[0]-b[0], dy=a[1]-b[1]; return dx*dx+dy*dy; }
// 让两笔的点顺序对齐（必要时反向），减少“扭麻花” / flip stroke direction if that lines points up better
function orient(src, dst){
  let same=0, rev=0;
  for(let i=0;i<K;i++){ same += dist2(src[i], dst[i]); rev += dist2(src[i], dst[K-1-i]); }
  if(rev < same){ return dst.slice().reverse(); }
  return dst;
}

// 把一个阶段的所有笔画采样好 / resample every stroke of one stage
function buildStage(dList, color){
  const strokes = [];
  dList.forEach(d => splitSubpaths(d).forEach(sd => {
    const pts = resample(sd);
    strokes.push({ pts, c: centroid(pts) });
  }));
  return { strokes, color };
}

// 给相邻两个阶段建立「笔画配对」 / pair up the strokes of two neighbouring stages
function buildMatch(A, B){
  const remB = B.strokes.map((_, i) => i);
  const pairs = [];
  // 每一笔 A 找最近的、还没用过的 B / each A stroke takes its nearest free B stroke
  for(let a=0; a<A.strokes.length; a++){
    if(remB.length){
      let best=0, bd=Infinity;
      remB.forEach((b, idx) => { const d = dist2(A.strokes[a].c, B.strokes[b].c); if(d<bd){ bd=d; best=idx; } });
      const b = remB.splice(best,1)[0];
      pairs.push({ src:A.strokes[a].pts, dst:orient(A.strokes[a].pts, B.strokes[b].pts),
                   ca:A.color, cb:B.color, oa:1, ob:1 });
    } else {
      // B 没得配了 → 这笔缩成自己的中心点 / no B left → shrink to its own centre
      pairs.push({ src:A.strokes[a].pts, dst:collapse(A.strokes[a].c), ca:A.color, cb:A.color, oa:1, ob:0 });
    }
  }
  // 剩下的 B 笔画 → 从自己的中心点长出来 / leftover B strokes grow from their own centre
  remB.forEach(b => pairs.push({ src:collapse(B.strokes[b].c), dst:B.strokes[b].pts, ca:B.color, cb:B.color, oa:0, ob:1 }));
  return pairs;
}

/* =====================================================================
   4. 音效 / Sound (Web Audio, 无外部文件)
   ===================================================================== */
let audioCtx = null;
function ensureAudio(){ if(!audioCtx){ try{ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ audioCtx = null; } } }
function playTone(freq, dur, type){
  if(!audioCtx) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.type = type||'sine'; osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + dur);
}
function popSound(){ playTone(520, 0.12, 'triangle'); }
function morphSound(){ playTone(380, 0.18, 'sine'); setTimeout(()=>playTone(620,0.16,'sine'),90); }
function dingSound(){ playTone(880, 0.25, 'sine'); }

/* =====================================================================
   5. 视图路由 / View routing
   ===================================================================== */
const views = {
  home: document.getElementById('view-home'),
  grid: document.getElementById('view-grid'),
  detail: document.getElementById('view-detail'),
  quiz: document.getElementById('view-quiz'),
  about: document.getElementById('view-about'),
  puzzle: document.getElementById('view-puzzle'),
  dict: document.getElementById('view-dict'),
};
function showView(name){ Object.values(views).forEach(v => v.classList.remove('active')); views[name].classList.add('active'); window.scrollTo(0,0); }

/* =====================================================================
   6. 网格页 / Grid page
   ===================================================================== */
function buildGrid(){
  const grid = document.getElementById('char-grid');
  grid.innerHTML = '';
  CHAR_ORDER.forEach(key => {
    const c = CHARACTERS[key];
    const card = document.createElement('button');
    card.className = 'char-card tint';
    card.style.setProperty('--card-tint', c.tint || '#fff');
    card.innerHTML = `<span class="cc-glyph">${c.char}</span><span class="cc-label">${c.pinyin} · ${c.meaning[LANG]}</span>`;
    card.addEventListener('click', () => {
      ensureAudio(); popSound();
      card.classList.add('bounce'); setTimeout(()=>card.classList.remove('bounce'),400);
      openDetail(key);
    });
    grid.appendChild(card);
  });
}

// 首页板块导航卡片 / home section-navigation cards
function buildSectionBoard(){
  const board = document.getElementById('section-board');
  if(!board) return;
  board.innerHTML = '';
  SECTIONS.forEach(s => {
    const card = document.createElement(s.view ? 'button' : 'div');
    card.className = 'section-card' + (s.view ? '' : ' soon');
    const soonTag = s.view ? '' :
      `<span class="sc-soon-tag">${LANG==='zh' ? '敬请期待' : 'Coming soon'}</span>`;
    card.innerHTML = `
      <span class="sc-glyph">${s.glyph}</span>
      <span class="sc-text">
        <span class="sc-title">${s.title[LANG]}</span>
        <span class="sc-desc">${s.desc[LANG]}</span>
      </span>${soonTag}`;
    if(s.view){
      card.addEventListener('click', () => {
        ensureAudio(); popSound();
        if(s.view === 'quiz') startQuiz();
        else if(s.view === 'puzzle') startPuzzle();
        else if(s.view === 'dict') startDict();
        else if(s.view === 'about'){ buildAbout(); showView('about'); }
        else showView(s.view);
      });
    }
    board.appendChild(card);
  });
}

// 「什么是甲骨文」板块：渲染图文面板 / build the "What Are Oracle Bones?" panels
function buildAbout(){
  document.getElementById('about-title').textContent = UI.about_title[LANG];
  const wrap = document.getElementById('about-panels');
  wrap.innerHTML = '';
  ABOUT.forEach((p, i) => {
    const panel = document.createElement('div');
    panel.className = 'about-panel';
    panel.innerHTML = `
      <div class="ap-fig">${p.svg}</div>
      <div class="ap-text">
        <h3 class="ap-title"><span class="ap-num">${i+1}</span>${p.title[LANG]}</h3>
        <p class="ap-body">${p.body[LANG]}</p>
      </div>`;
    wrap.appendChild(panel);
  });
  // 结尾引导去玩猜字游戏 / closing link to the quiz
  const cta = document.getElementById('about-cta');
  cta.textContent = UI.about_cta[LANG];
}

/* =====================================================================
   7. 详情页 + 动画交互 / Detail page + animation
   ===================================================================== */
const els = {
  pinyin: document.getElementById('d-pinyin'),
  meaning: document.getElementById('d-meaning'),
  decor: document.getElementById('glyph-decor'),
  strokes: document.getElementById('glyph-strokes'),
  stageWrap: document.getElementById('stage-wrap'),
  tapHint: document.getElementById('tap-hint'),
  timeline: document.getElementById('timeline'),
  slider: document.getElementById('stage-slider'),
  caption: document.getElementById('d-caption'),
  prev: document.getElementById('prev-stage'),
  next: document.getElementById('next-stage'),
  fact: document.getElementById('d-fact'),
  placeholder: document.getElementById('detail-placeholder'),
  nextChar: document.getElementById('next-char'),
};

let current = null;   // 当前字 / current char key
let progress = 0;     // 0..3
let rafId = null;

function openDetail(key){
  current = key;
  const c = CHARACTERS[key];
  progress = 0;

  els.pinyin.textContent = c.pinyin + ' · ' + c.char;
  els.meaning.textContent = c.meaning[LANG];
  els.placeholder.hidden = true;
  els.fact.innerHTML = c.fact[LANG];

  buildDecor(c);
  buildGlyph(c);
  buildTimeline(c);
  els.tapHint.classList.remove('hide');

  render();
  updateCaption();
  showView('detail');
}

// 太阳光芒（实物阶段）/ sun rays (picture stage)
function buildDecor(c){
  els.decor.innerHTML = '';
  if(c.decor !== 'sun') return;
  const cx=50, cy=50, r1=33, r2=45;
  for(let k=0;k<8;k++){
    const a = (k/8)*Math.PI*2;
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',(cx+Math.cos(a)*r1).toFixed(1)); line.setAttribute('y1',(cy+Math.sin(a)*r1).toFixed(1));
    line.setAttribute('x2',(cx+Math.cos(a)*r2).toFixed(1)); line.setAttribute('y2',(cy+Math.sin(a)*r2).toFixed(1));
    line.setAttribute('stroke', PAL.sun); line.setAttribute('stroke-width','5'); line.setAttribute('stroke-linecap','round');
    els.decor.appendChild(line);
  }
}

// 采样好 4 个阶段、建好配对，并按「最多笔画数」准备好 <path> 池
// resample the 4 stages, build matches, and prepare a pool of <path>s
function buildGlyph(c){
  const stageColors = [c.color, INK, INK, INK];     // 实物彩色，其余墨黑 / picture coloured, rest ink
  const stageDLists = [c.illus, c.oracle, c.seal, c.kai];
  c._stages = stageDLists.map((dl, si) => buildStage(dl, stageColors[si]));
  c._match = [ buildMatch(c._stages[0], c._stages[1]),
               buildMatch(c._stages[1], c._stages[2]),
               buildMatch(c._stages[2], c._stages[3]) ];
  // 需要多少条 <path> = 任意一段配对里最多的笔画数 / pool size = most pairs in any segment
  const pool = Math.max(...c._match.map(m => m.length));
  const w = c.strokeWidth || 6.5;
  els.strokes.innerHTML = '';
  for(let i=0;i<pool;i++){
    const p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('stroke-width', w);
    els.strokes.appendChild(p);
  }
}

// 把一组点连成一条折线路径 / turn K points into a polyline path string
function pointsToPath(pts){
  let d = 'M ' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for(let i=1;i<pts.length;i++) d += ' L ' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
  return d;
}

function buildTimeline(c){
  els.timeline.innerHTML = '';
  for(let s=0;s<4;s++){
    const node = document.createElement('button');
    node.className = 'tl-node';
    node.innerHTML = `<span class="tl-dot"></span><span class="tl-label">${STAGE_NAMES[s][LANG]}</span>`;
    node.addEventListener('click', () => { ensureAudio(); animateTo(s); });
    els.timeline.appendChild(node);
  }
}

// 核心渲染：在当前进度上，逐点插值出每一笔 / core render: interpolate every stroke
function render(){
  const c = CHARACTERS[current];
  const p = progress;
  const seg = clamp(Math.floor(p), 0, 2);   // 在哪一段：0=实物→甲骨, 1=甲骨→小篆, 2=小篆→楷书
  const t = clamp(p - seg, 0, 1);            // 段内进度 / progress within the segment
  const pairs = c._match[seg];
  const pathEls = els.strokes.children;

  for(let k=0;k<pathEls.length;k++){
    const el = pathEls[k];
    if(k >= pairs.length){ el.setAttribute('opacity', 0); el.removeAttribute('d'); continue; }
    const pr = pairs[k];
    const pts = [];
    for(let i=0;i<K;i++){
      pts.push([ lerp(pr.src[i][0], pr.dst[i][0], t), lerp(pr.src[i][1], pr.dst[i][1], t) ]);
    }
    el.setAttribute('d', pointsToPath(pts));
    el.setAttribute('stroke', lerpColor(pr.ca, pr.cb, t));
    el.setAttribute('opacity', lerp(pr.oa, pr.ob, t).toFixed(3));
  }

  // 太阳光芒随进度淡出 / sun rays fade out
  if(c.decor === 'sun') els.decor.setAttribute('opacity', clamp(1-p,0,1).toFixed(2));

  // 时间轴高亮 / timeline highlight
  const nearest = Math.round(p);
  [...els.timeline.children].forEach((n, i) => n.classList.toggle('active', i === nearest));

  els.slider.value = p;
}

function updateCaption(){
  const c = CHARACTERS[current];
  const s = clamp(Math.round(progress), 0, 3);
  const cap = c.caps[s];
  els.caption.innerHTML = `<span class="cap-zh">${cap[LANG]}</span>`;
  els.prev.disabled = progress <= 0.001;
  els.next.disabled = progress >= 2.999;
}

function animateTo(target){
  target = clamp(target, 0, 3);
  if(rafId) cancelAnimationFrame(rafId);
  const from = progress, dist = target - from;
  if(Math.abs(dist) < 0.001) return;
  morphSound();
  els.tapHint.classList.add('hide');
  const dur = 750, start = performance.now();
  function frame(now){
    const k = clamp((now - start)/dur, 0, 1);
    progress = from + dist * easeInOutCubic(k);
    render();
    if(k < 1){ rafId = requestAnimationFrame(frame); }
    else { progress = target; render(); updateCaption(); if(target===3) dingSound(); }
  }
  rafId = requestAnimationFrame(frame);
}
function stepForward(){ ensureAudio(); const n = Math.round(progress) >= 3 ? 0 : Math.round(progress)+1; animateTo(n); }
function stepBack(){ ensureAudio(); animateTo(Math.max(0, Math.round(progress)-1)); }

function bindDetailEvents(){
  els.stageWrap.addEventListener('click', stepForward);
  els.next.addEventListener('click', e => { e.stopPropagation(); stepForward(); });
  els.prev.addEventListener('click', e => { e.stopPropagation(); stepBack(); });

  els.slider.addEventListener('input', () => {
    if(rafId) cancelAnimationFrame(rafId);
    ensureAudio();
    progress = parseFloat(els.slider.value);
    els.tapHint.classList.add('hide');
    render(); updateCaption();
  });

  let touchX = null;
  els.stageWrap.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive:true });
  els.stageWrap.addEventListener('touchend', e => {
    if(touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if(Math.abs(dx) > 40){ dx < 0 ? stepForward() : stepBack(); }
    touchX = null;
  });

  els.nextChar.addEventListener('click', () => {
    ensureAudio(); popSound();
    const idx = CHAR_ORDER.indexOf(current);
    openDetail(CHAR_ORDER[(idx+1) % CHAR_ORDER.length]);
  });
}

/* =====================================================================
   7b. 猜一猜甲骨文（识字游戏）/ Guess the Oracle (recognition game)
   ---------------------------------------------------------------------
   看一个甲骨文字形，从 3 个选项里选出对应的现代汉字。第一次就答对得 1 分。
   Show an oracle-bone glyph; pick the matching modern character from 3 options.
   ===================================================================== */
const quizEls = {
  play: document.getElementById('quiz-play'),
  result: document.getElementById('quiz-result'),
  progress: document.getElementById('quiz-progress'),
  score: document.getElementById('quiz-score'),
  glyph: document.getElementById('quiz-glyph'),
  options: document.getElementById('quiz-options'),
  feedback: document.getElementById('quiz-feedback'),
  next: document.getElementById('quiz-next'),
};

let quizOrder = [], quizIndex = 0, quizScore = 0, quizDone = false, quizWrongThis = false;

// Fisher–Yates 洗牌 / shuffle
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; }
  return a;
}

function startQuiz(){
  quizOrder = shuffle(CHAR_ORDER);
  quizIndex = 0; quizScore = 0;
  quizEls.play.hidden = false; quizEls.result.hidden = true;
  showQuizQuestion();
  showView('quiz');
}

// 把某个字的甲骨文字形画进游戏画框 / draw a character's oracle glyph
function drawOracle(group, c){
  group.innerHTML = '';
  c.oracle.forEach(d => {
    const p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d', d);
    p.setAttribute('stroke-width', c.strokeWidth || 6.5);
    group.appendChild(p);
  });
}

function showQuizQuestion(){
  quizDone = false; quizWrongThis = false;
  const key = quizOrder[quizIndex];
  const c = CHARACTERS[key];

  quizEls.progress.textContent = (LANG==='zh' ? '第 ' : 'No. ') + (quizIndex+1) + ' / ' + quizOrder.length;
  quizEls.score.textContent = (LANG==='zh' ? '得分 ' : 'Score ') + quizScore;
  drawOracle(quizEls.glyph, c);

  // 选项：正确答案 + 2 个干扰项 / correct + two distractors
  const distractors = shuffle(CHAR_ORDER.filter(k => k !== key)).slice(0, 2);
  const opts = shuffle([key, ...distractors]);
  quizEls.options.innerHTML = '';
  opts.forEach(k => {
    const oc = CHARACTERS[k];
    const b = document.createElement('button');
    b.className = 'quiz-option';
    b.innerHTML = `<span class="qo-glyph">${oc.char}</span><span class="qo-label">${oc.pinyin} · ${oc.meaning[LANG]}</span>`;
    b.addEventListener('click', () => chooseAnswer(k, key, b));
    quizEls.options.appendChild(b);
  });

  quizEls.feedback.innerHTML = '';
  quizEls.next.hidden = true;
}

function chooseAnswer(chosen, correct, btn){
  if(quizDone) return;
  ensureAudio();
  if(chosen === correct){
    quizDone = true;
    if(!quizWrongThis) quizScore++;
    dingSound();
    [...quizEls.options.children].forEach(b => b.disabled = true);
    btn.classList.add('correct');
    const c = CHARACTERS[correct];
    const zhMean = c.meaning.zh === c.char ? '' : `，意思是${c.meaning.zh}`;
    const line = LANG==='zh'
      ? `答对了——这是“${c.char}”（${c.pinyin}）${zhMean}。`
      : `Correct — this is “${c.char}” (${c.pinyin}), ${c.meaning.en.toLowerCase()}.`;
    quizEls.feedback.innerHTML = `<span class="qf-zh">${line}</span>`;
    quizEls.score.textContent = (LANG==='zh' ? '得分 ' : 'Score ') + quizScore;
    quizEls.next.hidden = false;
  } else {
    quizWrongThis = true;
    popSound();
    btn.classList.add('wrong'); btn.disabled = true;   // 选错的变灰，可再试 / dim it, let them retry
  }
}

function nextQuizQuestion(){
  ensureAudio(); popSound();
  quizIndex++;
  if(quizIndex >= quizOrder.length) showQuizResult();
  else showQuizQuestion();
}

function showQuizResult(){
  quizEls.play.hidden = true;
  quizEls.result.hidden = false;
  const total = quizOrder.length;
  // 按得分给一句鼓励 / a line of encouragement by score
  let zh, en;
  if(quizScore === total){ zh = '太棒了，全部认出来了！'; en = 'Outstanding — you recognised them all!'; }
  else if(quizScore >= total - 2){ zh = '很厉害，你已经很懂甲骨文了。'; en = 'Great work — you really know your oracle bones.'; }
  else if(quizScore >= total/2){ zh = '不错！再玩一次会记得更牢。'; en = 'Nice! Play again to remember even more.'; }
  else { zh = '好的开始——再试一次，你会越来越熟。'; en = 'A good start — try again and it will click.'; }
  const playAgain = LANG==='zh' ? '再玩一次' : 'Play again';
  const home = LANG==='zh' ? '回首页' : 'Home';
  const recog = LANG==='zh' ? `你认出了 ${quizScore} / ${total} 个甲骨文` : `You recognised ${quizScore} / ${total} oracle glyphs`;
  quizEls.result.innerHTML = `
    <div class="qr-score">${quizScore} <small>/ ${total}</small></div>
    <div class="qr-msg">${recog}</div>
    <div class="qr-msg-en">${LANG==='zh'?zh:en}</div>
    <div class="qr-actions">
      <button class="big-btn" id="qr-again">${playAgain}</button>
      <button class="big-btn" id="qr-home">${home}</button>
    </div>`;
  document.getElementById('qr-again').addEventListener('click', () => { ensureAudio(); popSound(); startQuiz(); });
  document.getElementById('qr-home').addEventListener('click', () => { ensureAudio(); popSound(); showView('home'); });
}

function bindQuizEvents(){
  quizEls.next.addEventListener('click', nextQuizQuestion);
}

/* =====================================================================
   7c. 甲骨文拼图 / Oracle jigsaw
   ---------------------------------------------------------------------
   把一个字的甲骨文字形按 3×3 切成小块、打乱；点两块交换，拼回原样即过关。
   Splits a character's oracle glyph into a 3×3 grid, scrambles it; tap two
   tiles to swap. Complete the picture to win. Reuses the oracle stroke data.
   ===================================================================== */
const PZ_GRID = 3;  // 3×3 = 9 块 / tiles
const pzEls = {
  target: document.getElementById('puzzle-target'),
  board: document.getElementById('puzzle-board'),
  feedback: document.getElementById('puzzle-feedback'),
  newBtn: document.getElementById('puzzle-new'),
};
let pzKey = null, pzArrange = [], pzSel = -1, pzFilled = [], pzViewBoxes = [], pzSolved = false;

// 取一个字甲骨文所有笔画的采样点 / sample points of a character's oracle strokes
function oraclePoints(c){
  const pts = [];
  c.oracle.forEach(d => splitSubpaths(d).forEach(sd => {
    measurePath.setAttribute('d', sd);
    const L = measurePath.getTotalLength() || 0.001;
    const n = Math.max(6, Math.round(L / 3));
    for(let i=0;i<=n;i++){ const p = measurePath.getPointAtLength(L*i/n); pts.push([p.x, p.y]); }
  }));
  return pts;
}

function startPuzzle(nextKey){
  pzKey = nextKey || CHAR_ORDER[Math.floor(Math.random()*CHAR_ORDER.length)];
  const c = CHARACTERS[pzKey];

  // 求字形的正方外接框（留一点边）/ square bounding box of the glyph (with padding)
  const pts = oraclePoints(c);
  let minx=Infinity,miny=Infinity,maxx=-Infinity,maxy=-Infinity;
  pts.forEach(p=>{ minx=Math.min(minx,p[0]); maxx=Math.max(maxx,p[0]); miny=Math.min(miny,p[1]); maxy=Math.max(maxy,p[1]); });
  const cx=(minx+maxx)/2, cy=(miny+maxy)/2;
  let side = Math.max(maxx-minx, maxy-miny) * 1.18; if(side < 10) side = 10;
  const sx=cx-side/2, sy=cy-side/2, cell=side/PZ_GRID;

  // 每块的取景框 + 是否有内容（空块可互换）/ per-tile viewBox + whether it has ink
  pzViewBoxes = []; pzFilled = [];
  for(let r=0;r<PZ_GRID;r++) for(let col=0;col<PZ_GRID;col++){
    const vx=sx+col*cell, vy=sy+r*cell;
    pzViewBoxes.push(`${vx.toFixed(2)} ${vy.toFixed(2)} ${cell.toFixed(2)} ${cell.toFixed(2)}`);
    pzFilled.push(pts.some(p => p[0]>=vx && p[0]<vx+cell && p[1]>=vy && p[1]<vy+cell));
  }

  // 打乱（确保不是一上来就拼好的）/ scramble, but not already solved
  do { pzArrange = shuffle([...Array(PZ_GRID*PZ_GRID).keys()]); } while(isPuzzleSolved(pzArrange));
  pzSel = -1; pzSolved = false;

  pzEls.target.textContent = (LANG==='zh' ? '拼出：' : 'Make: ') + c.char + ' · ' + c.pinyin;
  pzEls.feedback.innerHTML = '';
  pzEls.board.classList.remove('solved');
  pzEls.newBtn.textContent = UI.puzzle_new[LANG];
  renderPuzzle();
  showView('puzzle');
}

// 一块的 SVG：把整字画出来，只用取景框露出该块区域 / one tile cropped to its region
function tileSVG(tileIndex){
  const c = CHARACTERS[pzKey];
  const paths = c.oracle.map(d =>
    `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${c.strokeWidth||6.5}" stroke-linecap="round" stroke-linejoin="round"/>`
  ).join('');
  return `<svg viewBox="${pzViewBoxes[tileIndex]}" preserveAspectRatio="xMidYMid meet">${paths}</svg>`;
}

function renderPuzzle(){
  pzEls.board.innerHTML = '';
  pzArrange.forEach((tileIndex, slot) => {
    const b = document.createElement('button');
    b.className = 'puzzle-tile' + (slot===pzSel ? ' sel' : '');
    b.innerHTML = tileSVG(tileIndex);
    b.addEventListener('click', () => onTileTap(slot));
    pzEls.board.appendChild(b);
  });
}

function onTileTap(slot){
  if(pzSolved) return;
  ensureAudio();
  if(pzSel === -1){ pzSel = slot; popSound(); renderPuzzle(); return; }
  if(pzSel === slot){ pzSel = -1; renderPuzzle(); return; }
  const a = pzArrange[pzSel], b = pzArrange[slot];
  pzArrange[pzSel] = b; pzArrange[slot] = a;   // 交换 / swap
  pzSel = -1; popSound();
  renderPuzzle();
  if(isPuzzleSolved(pzArrange)) onPuzzleSolved();
}

// 拼好判定：每块归位；两块都为空也算（视觉一致）/ solved when every tile is home (blank tiles interchangeable)
function isPuzzleSolved(arr){
  for(let i=0;i<arr.length;i++){
    if(arr[i] === i) continue;
    if(!pzFilled[i] && !pzFilled[arr[i]]) continue;
    return false;
  }
  return true;
}

function onPuzzleSolved(){
  pzSolved = true; pzSel = -1; dingSound();
  renderPuzzle();
  pzEls.board.classList.add('solved');   // 去掉缝隙，显示完整字 / remove gaps to show the whole glyph
  const c = CHARACTERS[pzKey];
  const zh = `拼好啦！这是“${c.char}”的甲骨文。`;
  const en = `Solved! This is the oracle-bone form of “${c.char}”.`;
  pzEls.feedback.innerHTML = `<span class="pz-line">${LANG==='zh'?zh:en}</span>`;
}

function bindPuzzleEvents(){
  document.getElementById('puzzle-shuffle').addEventListener('click', () => {
    ensureAudio(); popSound();
    if(pzKey) startPuzzle(pzKey);   // 同一个字重新打乱 / reshuffle same character
  });
  pzEls.newBtn.addEventListener('click', () => { ensureAudio(); popSound(); startPuzzle(); });
}

/* =====================================================================
   7d. 查甲骨文字典 / Oracle dictionary（查字 + 字库 + 输入名字）
   ---------------------------------------------------------------------
   字形来自 oraclebone.org（Xiaoliang Wang，CC BY-NC 4.0），已下载到
   assets/oracle/u{码点}.svg，索引在 assets/oracle-index.js（ORACLE_INDEX）。
   输入任意汉字/名字 → 逐字显示甲骨文；库里没有的字如实标注「暂无甲骨文」。
   Glyphs from oraclebone.org (CC BY-NC 4.0). Type any characters/name to see
   them in oracle bone; characters not in the library are marked honestly.
   ===================================================================== */
const dictEls = {
  title: document.getElementById('dict-title'),
  input: document.getElementById('dict-input'),
  result: document.getElementById('dict-result'),
  libHead: document.getElementById('dict-lib-head'),
  gallery: document.getElementById('dict-gallery'),
  credit: document.getElementById('dict-credit'),
};
let ORACLE = null;       // { chars: { '日': {py, oracle:[...], sw}, ... } }
let dictGalleryBuilt = false;

// 字库直接复用本项目手绘的甲骨文（和演变/拼图/猜字同一套字）
// the library reuses this project's hand-drawn oracle forms (same set as the other modules)
function oracleData(){
  if(!ORACLE){
    ORACLE = { chars:{} };
    CHAR_ORDER.forEach(k => {
      const c = CHARACTERS[k];
      ORACLE.chars[c.char] = { py:c.pinyin, oracle:c.oracle, sw:c.strokeWidth||6.5 };
    });
  }
  return ORACLE;
}
// 内联画出一个字的甲骨文（描边中线）/ inline oracle glyph (centre-line strokes)
function oracleSvg(e){
  const paths = e.oracle.map(d =>
    `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${e.sw}" stroke-linecap="round" stroke-linejoin="round"/>`
  ).join('');
  return `<svg viewBox="0 0 100 100">${paths}</svg>`;
}
// 一个字的小卡（有则显示字形，无则如实标注）/ one tile (glyph, or honest "no form")
function oracleTile(ch, big){
  const e = oracleData().chars[ch];
  const cls = 'ot' + (big ? ' big' : '') + (e ? '' : ' missing');
  if(e) return `<div class="${cls}">${oracleSvg(e)}<span class="ot-cap">${ch} · ${e.py}</span></div>`;
  return `<div class="${cls}"><span class="ot-x">□</span><span class="ot-cap">${ch} · ${UI.dict_none[LANG]}</span></div>`;
}
function renderDictResult(){
  const s = (dictEls.input.value || '').trim();
  const chars = [...s].filter(c => /[㐀-鿿]/.test(c));   // 只看汉字 / CJK only
  dictEls.result.innerHTML = chars.map(c => oracleTile(c, true)).join('');
}
function buildGallery(){
  if(dictGalleryBuilt) return;
  const chars = oracleData().chars;
  dictEls.gallery.innerHTML = Object.keys(chars).map(ch =>
    `<button class="gal-item" data-ch="${ch}">${oracleSvg(chars[ch])}<span>${ch}</span></button>`
  ).join('');
  dictGalleryBuilt = true;
}
function refreshDictText(){
  const n = Object.keys(oracleData().chars).length;
  dictEls.title.textContent = UI.dict_title[LANG];
  dictEls.input.placeholder = UI.dict_ph[LANG];
  dictEls.libHead.textContent = (LANG==='zh' ? `字库 · 共 ${n} 个字（会随新增汉字一起变多）` : `Library · ${n} characters (grows as more are added)`);
  dictEls.credit.innerHTML = (LANG==='zh' ? '字形为本项目手绘，与其他板块共用同一套字。'
                                          : 'Glyphs hand-drawn for this project, shared across all sections.');
}
function startDict(){
  refreshDictText();
  buildGallery();
  renderDictResult();
  showView('dict');
}
function bindDictEvents(){
  dictEls.input.addEventListener('input', () => { ensureAudio(); renderDictResult(); });
  // 点字库里的字 → 填进输入框看大图 / click a library item -> show it
  dictEls.gallery.addEventListener('click', e => {
    const btn = e.target.closest('.gal-item'); if(!btn) return;
    ensureAudio(); popSound();
    dictEls.input.value = btn.getAttribute('data-ch');
    renderDictResult();
    dictEls.result.scrollIntoView({ block:'nearest', behavior:'smooth' });
  });
}

/* =====================================================================
   8. 语言切换 / Language toggle
   ===================================================================== */
function applyLang(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(UI[key]) el.innerHTML = UI[key][LANG];
  });
  document.documentElement.lang = LANG;
  document.getElementById('lang-label').textContent = LANG === 'zh' ? '中 / EN' : 'EN / 中';
  buildGrid();
  buildSectionBoard();
  if(views.detail.classList.contains('active') && current){
    const c = CHARACTERS[current];
    els.meaning.textContent = c.meaning[LANG];
    buildTimeline(c);
    els.fact.innerHTML = c.fact[LANG];
    render(); updateCaption();
  }
  // 游戏进行中切换语言：重画当前题（保留进度与得分）/ refresh quiz text on language switch
  if(views.quiz.classList.contains('active')){
    if(quizEls.result.hidden) showQuizQuestion(); else showQuizResult();
  }
  if(views.about.classList.contains('active')) buildAbout();
  if(views.dict.classList.contains('active')){ refreshDictText(); renderDictResult(); }
  // 拼图进行中切换语言：只更新文字，不打乱进度 / refresh puzzle labels without reshuffling
  if(views.puzzle.classList.contains('active') && pzKey){
    const c = CHARACTERS[pzKey];
    pzEls.target.textContent = (LANG==='zh' ? '拼出：' : 'Make: ') + c.char + ' · ' + c.pinyin;
    pzEls.newBtn.textContent = UI.puzzle_new[LANG];
    if(pzSolved){
      const zh = `拼好啦！这是“${c.char}”的甲骨文。`;
      const en = `Solved! This is the oracle-bone form of “${c.char}”.`;
      pzEls.feedback.innerHTML = `<span class="pz-line">${LANG==='zh'?zh:en}</span>`;
    }
  }
}
function toggleLang(){ ensureAudio(); popSound(); LANG = LANG === 'zh' ? 'en' : 'zh'; applyLang(); }

/* =====================================================================
   9. 启动 / Init
   ===================================================================== */
function init(){
  measurePath = document.getElementById('measure-path'); // 量长度/取点用 / for resampling
  buildGrid();
  buildSectionBoard();
  bindDetailEvents();
  bindQuizEvents();
  bindPuzzleEvents();
  bindDictEvents();

  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => { ensureAudio(); popSound(); showView(btn.getAttribute('data-go')); });
  });
  // 「什么是甲骨文」末尾的按钮：直接开始猜字游戏 / about-page CTA starts the quiz
  document.getElementById('about-cta').addEventListener('click', () => { ensureAudio(); popSound(); startQuiz(); });
  document.getElementById('lang-toggle').addEventListener('click', toggleLang);

  applyLang();
}
document.addEventListener('DOMContentLoaded', init);
