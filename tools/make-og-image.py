# -*- coding: utf-8 -*-
"""Tạo ảnh xem trước khi chia sẻ (Open Graph, 1200x630) cho bản DÙNG CHUNG.

Chạy trong thư mục website/:   python tools/make-og-image.py
Kết quả: ../web-chung/assets/logo/og-image.png
"""
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
WEBSITE = os.path.dirname(HERE)
OUT = os.path.join(os.path.dirname(WEBSITE), 'web-chung', 'assets', 'logo', 'og-image.png')

W, H = 1200, 630
NAVY = (11, 47, 91)
TEAL = (42, 157, 149)
INK = (90, 105, 122)
FONTS = os.path.join(WEBSITE, 'assets', 'fonts')

# Phông UTM Avo không có dấu chấm giữa và gạch ngang dài -> thay bằng kí tự có sẵn
SAFE = {'·': '-', '–': '-', '—': '-', ' ': ' '}

LINES = [
    ('UTM-Avo-Bold.ttf', 54, NAVY, 'CHƯƠNG TRÌNH GIÁO DỤC MÔN HỌC'),
    ('UTM-Avo-Bold.ttf', 36, TEAL, 'CẤP TIỂU HỌC - NĂM HỌC 2026-2027'),
    ('UTM-Avo-Regular.ttf', 30, INK, 'Tài liệu tham khảo dùng chung cho giáo viên tiểu học'),
]

MAX_W = 1040  # bề rộng tối đa của chữ, chừa lề hai bên


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def sanitize(t):
    for a, b in SAFE.items():
        t = t.replace(a, b)
    return t


def fit(draw, name, size, text):
    """Thu nhỏ cỡ chữ cho tới khi dòng chữ nằm gọn trong MAX_W."""
    while size > 12:
        f = font(name, size)
        if draw.textbbox((0, 0), text, font=f)[2] <= MAX_W:
            return f, size
        size -= 2
    return font(name, size), size


def main():
    img = Image.new('RGB', (W, H), 'white')
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 10], fill=TEAL)
    d.rectangle([0, H - 10, W, H], fill=NAVY)

    mark = Image.open(os.path.join(WEBSITE, 'assets', 'logo', 'logo-mark.png')).convert('RGBA')
    size = 188
    mark = mark.resize((size, size), Image.LANCZOS)
    top = 84
    img.paste(mark, ((W - size) // 2, top), mark)

    y = top + size + 46
    for i, (fn, sz, color, text) in enumerate(LINES):
        text = sanitize(text)
        f, sz = fit(d, fn, sz, text)
        w = d.textbbox((0, 0), text, font=f)[2]
        d.text(((W - w) // 2, y), text, font=f, fill=color)
        y += sz + (26 if i == 0 else 20)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    img.save(OUT, optimize=True)
    print('Đã tạo', OUT)


if __name__ == '__main__':
    main()
