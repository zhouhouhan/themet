# cut-scroll-slices.py — 千里江山图特展贴图切片 (zcode 2026-09-20)
# 源: Wikimedia Commons 完整合成扫描 (PD-Art)
#   https://commons.wikimedia.org/wiki/File:Wang_Ximeng._A_Thousand_Li_of_Rivers_and_Mountains._(Complete,_51,3x1191,5_cm)._1113._Palace_museum,_Beijing.jpg
# 该合成版在卷首天空叠印了溥光大字跋（物理卷子上在独立接纸上，非画心）。
# 本脚本用同画面干净天空块 (x 33500-36150, y 0-540) 覆盖叠字区 (x 36150-38800, y 0-540)，
# 还原画心物理原貌；其余原样保留。
# 输出: assets/models/scroll/slices/ (10 画心 + 2 题跋 + 2 局部 + 2 铭牌 + manifest.json)
import json, os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

Image.MAX_IMAGE_PIXELS = None
SRC = r'C:/Users/zeroz/AppData/Local/Temp/scroll-scan/scan.jpg'
OUT = r'Z:/BaiduNetdiskWorkspace/myagent-work/zcode/vgallery/assets/models/scroll/slices'
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGB')
W, H = im.size  # 39974 x 1600

# ── 1. 修补卷首叠字（天空渐变块粘贴，见文件头说明）──
patch = im.crop((33500, 0, 36150, 540))   # 2650x540 干净天空
im.paste(patch, (36150, 0))

# ── 2. 画心 10 段（卷首在扫描右端 → slice_01 取最右段，阅读顺序=行走顺序）──
BAND_X0, BAND_X1 = 1890, 39180           # 画心 silk 本体（右界=黄色隔水前）
SLICE_W = (BAND_X1 - BAND_X0) // 10      # 3729
for i in range(1, 11):
    x1 = BAND_X1 - (i - 1) * SLICE_W
    x0 = x1 - SLICE_W
    s = im.crop((x0, 0, x1, 1600)).resize((2048, 885), Image.LANCZOS)
    s.save(f'{OUT}/scroll_slice_{i:02d}.jpg', quality=88)
    print(f'slice {i:02d}: scan x {x0}->{x1}')

# ── 3. 题跋 2 段（蔡京真跋 x 0-1880，按真实比例居中于素绢底）──
panel = im.crop((0, 0, 1880, 1600))
silk_rgb = im.crop((1900, 700, 2100, 900)).resize((1, 1), Image.BOX).getpixel((0, 0))
for name in ('scroll_colophon_01', 'scroll_colophon_02'):
    canvas = Image.new('RGB', (2048, 880), silk_rgb)
    noise = Image.effect_noise((2048, 880), 6).convert('L')
    canvas = Image.composite(canvas.point(lambda v: min(255, v + 6)), canvas, noise.point(lambda v: 255 if v > 200 else 0))
    if name.endswith('01'):
        p = panel.resize((1034, 880), Image.LANCZOS)
        canvas.paste(p, ((2048 - 1034) // 2, 0))
    canvas.save(f'{OUT}/{name}.jpg', quality=88)
    print(name, 'saved')

# ── 4. 局部放大 2 幅（原分辨率裁剪，1650x1125 ≈ 框比例 1.1:0.75）──
d1 = im.crop((21400, 90, 23050, 1215))    # 主峰
d2 = im.crop((24400, 300, 26050, 1425))   # 群山/水岸（目检后可调）
d1.save(f'{OUT}/detail_print_01.jpg', quality=88)
d2.save(f'{OUT}/detail_print_02.jpg', quality=88)

# ── 5. 铭牌底图（Georgia 排版，配色 = 炭黑底/旧金红字）──
CHARCOAL, GOLD, GOLD_DIM = (35, 35, 35), (201, 180, 126), (154, 141, 114)
def font(name, sz): return ImageFont.truetype(rf'C:/Windows/Fonts/{name}', sz)
def plate(w, h, path):
    p = Image.new('RGB', (w, h), CHARCOAL)
    d = ImageDraw.Draw(p)
    for i in range(h):  # 轻微上下渐晕
        v = 4 * (1 - abs(i - h / 2) / (h / 2))
        d.line([(0, i), (w, i)], fill=tuple(int(c + v) for c in CHARCOAL))
    return p, d
tp, td = plate(900, 600, 'title')
td.text((450, 150), 'A Thousand Li', font=font('georgiai.ttf', 72), fill=GOLD, anchor='mm')
td.text((450, 240), 'of Rivers and Mountains', font=font('georgiai.ttf', 56), fill=GOLD, anchor='mm')
td.line([(250, 320), (650, 320)], fill=GOLD_DIM, width=2)
td.text((450, 390), 'Wang Ximeng · Northern Song dynasty · Dated 1113', font=font('georgia.ttf', 26), fill=GOLD_DIM, anchor='mm')
td.text((450, 440), 'Ink and color on silk · 51.5 × 1191.5 cm', font=font('georgia.ttf', 26), fill=GOLD_DIM, anchor='mm')
td.text((450, 510), 'Collection of the Palace Museum, Beijing', font=font('georgia.ttf', 28), fill=GOLD, anchor='mm')
tp.save(f'{OUT}/title_plate.jpg', quality=90)
cp, cd = plate(1024, 658, 'credit')
cd.text((512, 200), 'SPECIAL EXHIBITION', font=font('georgia.ttf', 34), fill=GOLD_DIM, anchor='mm')
cd.line([(300, 260), (724, 260)], fill=GOLD_DIM, width=2)
cd.text((512, 340), 'A Thousand Li of Rivers and Mountains', font=font('georgiai.ttf', 44), fill=GOLD, anchor='mm')
cd.text((512, 420), 'On loan from the Palace Museum, Beijing', font=font('georgia.ttf', 28), fill=GOLD_DIM, anchor='mm')
cd.text((512, 500), 'Digital reproduction for education · Unofficial tribute', font=font('georgia.ttf', 22), fill=GOLD_DIM, anchor='mm')
cp.save(f'{OUT}/credit_plate.jpg', quality=90)

# ── 6. 校验用 contact sheet（4x3 网格缩略图）──
names = [f'scroll_slice_{i:02d}.jpg' for i in range(1, 11)] + ['scroll_colophon_01.jpg', 'detail_print_01.jpg']
cell_w, cell_h = 512, 222
sheet = Image.new('RGB', (cell_w * 4, cell_h * 3), (20, 20, 20))
for idx, n in enumerate(names):
    t = Image.open(f'{OUT}/{n}'); t.thumbnail((cell_w - 6, cell_h - 6))
    sheet.paste(t, ((idx % 4) * cell_w + 3, (idx // 4) * cell_h + 3))
sheet.save(r'C:/Users/zeroz/AppData/Local/Temp/scroll-scan/contact-sheet.jpg', quality=85)

total = sum(os.path.getsize(f'{OUT}/{f}') for f in os.listdir(OUT))
print(f'OUT total: {total/1e6:.1f} MB, files: {len(os.listdir(OUT))}')
manifest = {
    'source': 'Wikimedia Commons PD-Art composite scan (see tools/cut-scroll-slices.py header)',
    'note': 'opening-sky overlay of Puguang colophon patched with clean sky from same scan (x36150-38800,y0-540)',
    'date': '2026-09-20', 'slice_px': 2048, 'license': 'public domain (artwork 1113, PD-Art)',
}
with open(f'{OUT}/manifest.json', 'w') as f: json.dump(manifest, f, indent=2)
print('manifest written')
