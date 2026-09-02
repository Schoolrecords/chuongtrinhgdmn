# -*- coding: utf-8 -*-
"""
Dựng ảnh thẻ khối lớp cho trang chủ: giữ phần tranh minh hoạ của bìa SGK Tiếng Việt,
bỏ dòng chữ "TIẾNG VIỆT n" (thẻ đại diện cả khối chứ không riêng môn Tiếng Việt),
thay bằng "KHDH MÔN HỌC, HĐGD - LỚP n".

Cách chạy (từ thư mục website/):
    python tools/make-covers.py

Đọc  : assets/covers/tieng-viet-N.jpg   (bìa gốc, giữ lại để đối chiếu)
Ghi  : assets/covers/khdh-lop-N.jpg + .webp
Yêu cầu: pip install pillow
"""
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
WEBSITE = os.path.dirname(HERE)
COVERS = os.path.join(WEBSITE, 'assets', 'covers')
FONTS = os.path.join(WEBSITE, 'assets', 'fonts')

W, H = 480, 620          # khổ thẻ
PANEL = 262              # chiều cao phần chữ phía trên
NAVY = (11, 47, 91)
NAVY_2 = (18, 63, 117)
TEAL = (17, 145, 138)
WHITE = (255, 255, 255)

# Vùng tranh của từng bìa (y đầu, y cuối) — cắt dưới dòng tên sách và nhãn "TẬP MỘT",
# dừng trên dải tên nhà xuất bản.
CROP = {1: (228, 542), 2: (248, 552), 3: (238, 546), 4: (288, 606), 5: (272, 580)}


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def text_w(d, t, f):
    return d.textbbox((0, 0), t, font=f)[2]


def build(grade):
    src = Image.open(os.path.join(COVERS, f'tieng-viet-{grade}.jpg')).convert('RGB')
    y0, y1 = CROP[grade]
    art = src.crop((0, y0, src.width, min(y1, src.height)))

    # Phủ kín vùng tranh của thẻ, cắt bớt phần thừa ở hai bên hoặc trên dưới
    box_h = H - PANEL
    scale = max(W / art.width, box_h / art.height)
    art = art.resize((round(art.width * scale), round(art.height * scale)), Image.LANCZOS)
    left = (art.width - W) // 2
    top = (art.height - box_h) // 2
    art = art.crop((left, top, left + W, top + box_h))

    card = Image.new('RGB', (W, H), NAVY)
    d = ImageDraw.Draw(card)
    for y in range(PANEL):                      # nền chữ: chuyển màu navy nhẹ
        k = y / max(PANEL - 1, 1)
        d.line([(0, y), (W, y)], fill=(
            round(NAVY[0] + (NAVY_2[0] - NAVY[0]) * k),
            round(NAVY[1] + (NAVY_2[1] - NAVY[1]) * k),
            round(NAVY[2] + (NAVY_2[2] - NAVY[2]) * k)))
    card.paste(art, (0, PANEL))
    d.rectangle([0, PANEL - 4, W, PANEL - 1], fill=TEAL)   # gạch ngăn màu xanh ngọc

    # Chừa 126px phía trên cho huy hiệu số lớp và dấu tích của giao diện đè lên ảnh
    f_top = font('UTM-Avo-Bold.ttf', 27)
    f_big = font('UTM-Avo-Bold.ttf', 74)

    t = 'KHDH MÔN HỌC, HĐGD'
    y = 128
    d.text(((W - text_w(d, t, f_top)) // 2, y), t, font=f_top, fill=WHITE)
    y += 46
    t = f'LỚP {grade}'
    d.text(((W - text_w(d, t, f_big)) // 2, y), t, font=f_big, fill=(126, 231, 214))

    jpg = os.path.join(COVERS, f'khdh-lop-{grade}.jpg')
    card.save(jpg, quality=88, optimize=True)
    card.save(os.path.join(COVERS, f'khdh-lop-{grade}.webp'), quality=86, method=6)
    print(f'  lớp {grade}: {os.path.basename(jpg)} ({os.path.getsize(jpg) // 1024} KB)')


def main():
    print('Dựng ảnh thẻ khối lớp:')
    for g in range(1, 6):
        build(g)


if __name__ == '__main__':
    main()
