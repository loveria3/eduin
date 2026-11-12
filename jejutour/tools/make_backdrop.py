# -*- coding: utf-8 -*-
"""
핑퐁 스크래치 저장용 무대 배경(backdrop.js) 만들기
- 학생 화면을 파일로 바로 열면(file://) 브라우저가 지도 그림 복사를 막아서
  이 파일에 담아 둔 배경을 대신 써요.
- 지도 그림(jeju-map.png)을 바꾸면 한 번 다시 실행하세요:  python tools/make_backdrop.py
"""
import base64, io
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent.parent
src = Image.open(HERE / 'jeju-map.png').convert('RGB')
W, H = 960, 720                                   # 스크래치 무대 480×360 의 2배
bg = Image.new('RGB', (W, H), (214, 238, 248))
w = round(src.width * H / src.height)
bg.paste(src.resize((w, H), Image.LANCZOS), ((W - w) // 2, 0))
buf = io.BytesIO(); bg.save(buf, 'JPEG', quality=86, optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
(HERE / 'backdrop.js').write_text(
    '/* 핑퐁 스크래치 저장용 무대 배경 (tools/make_backdrop.py 로 만듦) */\n'
    f"var BACKDROP_JPG = '{b64}';\n", encoding='utf8')
print('backdrop.js', len(b64) // 1024, 'KB')
