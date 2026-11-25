import sys, os
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

body, overlay, out = sys.argv[1], sys.argv[2], sys.argv[3]
MM = 72 / 25.4
W, H, BL = 216 * MM, 303 * MM, 3 * MM
trim = RectangleObject([BL, BL, W - BL, H - BL])
full = RectangleObject([0, 0, W, H])

rb, ro = PdfReader(body), PdfReader(overlay)
assert len(rb.pages) == len(ro.pages), (len(rb.pages), len(ro.pages))

def build(screen):
    w = PdfWriter(clone_from=body)
    for i, pg in enumerate(w.pages):
        pg.merge_page(ro.pages[i])
        if screen:
            pg.mediabox = trim; pg.cropbox = trim; pg.trimbox = trim; pg.bleedbox = trim
        else:
            pg.mediabox = full; pg.cropbox = full; pg.bleedbox = full; pg.trimbox = trim
    w.add_metadata({'/Title': '共鸣（RESONANCE）', '/Author': '浙江省桐乡市高级中学 音乐社×化学社×哲学社×新闻社×数学社',
                    '/Subject': 'RESONANCE student journal', '/Creator': 'Resonance build (Playwright + Chrome)'})
    return w

for screen, name in [(True, 'resonance-screen.pdf'), (False, 'resonance-print-rgb.pdf')]:
    p = os.path.join(out, name)
    with open(p, 'wb') as f:
        build(screen).write(f)
    print('wrote', p, os.path.getsize(p))
