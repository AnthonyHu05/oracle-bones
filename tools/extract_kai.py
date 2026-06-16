#!/usr/bin/env python3
"""
提取「楷书」笔画中线 / Extract modern (kai) stroke medians.

用法 / Usage:
  1. 下载 makemeahanzi 的字形数据 / download makemeahanzi graphics:
     curl -O https://raw.githubusercontent.com/skishore/makemeahanzi/master/graphics.txt
  2. python extract_kai.py
  3. 把打印出来的 JSON 里对应字的数组，粘到 script.js 中那个字的 `kai:[...]`。
     Paste each character's array into its `kai:[...]` field in script.js.

原理 / How: makemeahanzi 的 medians 是每一笔的中心线（一串 [x,y] 点，y 轴朝上、
范围 ~0..1024）。这里翻转 y、按整字外接框等比缩放并居中到 0..100 画框，
输出成 "M x y L x y ..." 的描边路径，风格和甲骨文/小篆的中线笔画统一。
"""
import json

# 想要的字 -> script.js 里的 key / character -> key in script.js
WANT = {'日':'ri','月':'yue','山':'shan','水':'shui','火':'huo','木':'mu','鱼':'yu','马':'ma'}

# 内容区大小（0..100 画框里字实际占多大）/ content size inside the 0..100 box
TARGET = 72.0


def normalize(medians):
    pts = [p for stroke in medians for p in stroke]
    xs = [p[0] for p in pts]
    ys = [-p[1] for p in pts]            # 翻转 y / flip y (data is y-up)
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    w = (maxx - minx) or 1
    h = (maxy - miny) or 1
    s = TARGET / max(w, h)               # 等比缩放 / uniform scale
    ox = 50 - (minx + w / 2) * s         # 居中 / centre
    oy = 50 - (miny + h / 2) * s
    paths = []
    for stroke in medians:
        d = []
        for i, (x, y) in enumerate(stroke):
            X = x * s + ox
            Y = (-y) * s + oy
            d.append(('M' if i == 0 else 'L') + f' {X:.1f} {Y:.1f}')
        paths.append(' '.join(d))
    return paths


def main():
    out = {}
    with open('graphics.txt', encoding='utf-8') as f:
        for line in f:
            try:
                o = json.loads(line)
            except Exception:
                continue
            ch = o.get('character')
            if ch in WANT:
                out[WANT[ch]] = normalize(o['medians'])
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
