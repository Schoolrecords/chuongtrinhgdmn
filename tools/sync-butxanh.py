# -*- coding: utf-8 -*-
"""Đồng bộ KHDH đã duyệt (data/curriculum/*.json) sang dữ liệu của app Bút Xanh (web/khgd-lopN.js).

Ba nơi cùng một bản kế hoạch: tệp Word trong "Lớp 1".."Lớp 5" -> website/ (và web-chung/)
-> app Bút Xanh. Sửa tệp Word rồi chạy tools/docx-to-json.py; chạy tiếp lệnh này để app
không lệch với website.

    python tools/sync-butxanh.py --lop 3                 # cả khối 3
    python tools/sync-butxanh.py --lop 4 --mon tin-hoc   # một môn
    python tools/sync-butxanh.py --lop 3 --thu           # xem trước, không ghi

Một dòng dữ liệu của app gồm 8 cột:
    [tuần, chủ đề, nhóm bài, phân môn, tên bài, thời lượng, tiết, nội dung tích hợp]

Cột 0-6 lấy thẳng từ JSON. Cột 7 thì app tự sinh thêm nội dung lồng ghép theo luật
(QPAN, KNS, GDĐP, STEM…) khi dựng bảng, nên chỉ giữ PHẦN GỐC đang có trong app, cộng
thêm phần tổ chuyên môn viết riêng ghi ở data/butxanh-bo-sung.json. Riêng môn Tin học
(--nguyen-van) lấy nguyên văn cột điều chỉnh của JSON vì đó là mã Khung năng lực số
theo PPCT của tổ chuyên môn.
"""
import argparse
import io
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WEBSITE = os.path.dirname(HERE)
CURRICULUM = os.path.join(WEBSITE, "data", "curriculum")
BOSUNG = os.path.join(WEBSITE, "data", "butxanh-bo-sung.json")
APP_WEB = os.path.join(os.path.dirname(os.path.dirname(WEBSITE)), "web")

# Tên môn trong app: window.BX_KHGD_L<lớp>["<tên>"]
BX_NAME = {
    "tieng-viet": "Tiếng Việt", "toan": "Toán", "tu-nhien-va-xa-hoi": "Tự nhiên và Xã hội",
    "dao-duc": "Đạo đức", "tin-hoc": "Tin học", "cong-nghe": "Công nghệ",
    "hoat-dong-trai-nghiem": "HĐTN", "am-nhac": "Âm nhạc", "mi-thuat": "Mĩ thuật",
    "giao-duc-the-chat": "GDTC", "ngoai-ngu-1": "Tiếng Anh",
    "khoa-hoc": "Khoa học", "lich-su-va-dia-li": "Lịch sử và Địa lí",
}
# Môn lấy nguyên văn cột "Nội dung điều chỉnh, bổ sung" của JSON làm cột 7
NGUYEN_VAN = {"tin-hoc"}

PERIOD_RE = re.compile(r"Tiết\s*([\d+\s–\-]+?)\s*(?:\(|$)")
norm = lambda s: " ".join((s or "").split())
# Chỉ giữ chữ và số: để so tên bài mà bỏ qua khác biệt dấu câu ("Bài 1." với "Bài 1:")
chu = lambda s: re.sub(r"[^0-9a-zA-ZÀ-ỹ]+", "", (s or "")).lower()


def tiet_of(lesson):
    """Cột 7 của app: '1+2', '35'… — lấy đúng phần số trong 'Tiết 1+2 (2 tiết)'."""
    m = PERIOD_RE.search(lesson["periodLabel"] or "")
    return norm(m.group(1)) if m else str(lesson["periodFrom"] or "")


def intg_lines(lesson):
    """Các dòng của ô 'Nội dung điều chỉnh, bổ sung' + ô 'Ghi chú'."""
    out = []
    if lesson["adjustments"]:
        out.append(norm(lesson["adjustments"]))
    for i in lesson["integrations"]:
        lv = f" ({i['level']})" if i["level"] else ""
        out.append(f"{i['code']}{lv}: {norm(i['text'])}" if i["text"] else i["code"])
    if lesson["note"]:
        out.append(norm(lesson["note"]))
    return out


def rows_of(data, cot7, ten_cu=None):
    """Dựng danh sách dòng cho app. cot7(lesson, tiết) trả về chuỗi cột tích hợp.

    ten_cu {tiết: tên bài đang có trong app}: vài môn (Mĩ thuật, Tiếng Anh) app ghi tên bài
    kèm tiền tố chủ đề — "Chủ đề 2: HOA VĂN…" — còn tệp Word để tiền tố ở cột chủ đề. Tên
    bài là chỗ app dò giáo án đã soạn, nên chỉ đổi khi tổ chuyên môn thực sự đặt tên khác,
    không đổi vì khác cách ghi tiền tố.
    """
    tach = data["subjectId"] == "tieng-viet"     # chỉ Tiếng Việt tách nhóm bài / phân môn
    rows = []
    for l in data["lessons"]:
        lines = [x.strip() for x in (l["title"] or "").split("\n") if x.strip()]
        nhom, phan_mon, ten = "", "", " ".join(lines)
        if tach:
            if lines and re.match(r"^(Bài|Ôn tập|Đánh giá)\b.*\(\d+\s*tiết\)", lines[0]):
                nhom, lines = lines[0], lines[1:]
            rest = " / ".join(lines)
            phan_mon, ten = (s.strip() for s in rest.split(":", 1)) if ":" in rest else ("", rest)
            thoi_luong = str(l["periods"] or "")
        else:
            thoi_luong = f"{l['lessonPeriods']} tiết" if l["lessonPeriods"] else ""
        t = tiet_of(l)
        cu = (ten_cu or {}).get(t, "")
        if cu and ten and cu != ten and (
                norm(cu).lower().endswith(norm(ten).lower()) or chu(cu) == chu(ten)):
            ten = cu
        rows.append([str(l["week"] or ""), l["theme"] or "", nhom, phan_mon, ten,
                     thoi_luong, t, cot7(l, t)])
    return rows


def _mang(src, i):
    """Vị trí kết thúc của mảng JSON bắt đầu tại src[i] == '['."""
    sau, trong = 0, False
    j = i
    while j < len(src):
        c = src[j]
        if trong:
            if c == "\\":
                j += 1
            elif c == '"':
                trong = False
        elif c == '"':
            trong = True
        elif c == "[":
            sau += 1
        elif c == "]":
            sau -= 1
            if sau == 0:
                return j + 1
        j += 1
    return -1


def load_app(path):
    """Đọc web/khgd-lopN.js -> (nội dung tệp, {tên môn: (vị trí đầu, vị trí cuối, danh sách dòng)}).

    Lớp 1-4 ghi từng môn một (window.BX_KHGD_Lx["Toán"]=[…]); lớp 5 gói cả gói trong
    window.BX_KHGD_RAW={"Toán":[…],…} và Tiếng Việt để riêng ở window.TV5_KHGD.
    """
    src = io.open(path, encoding="utf-8").read()
    out = {}
    for m in re.finditer(r'(?:\[\s*"([^"]+)"\s*\]\s*=|"([^"]{2,40})"\s*:)\s*\[', src):
        name = m.group(1) or m.group(2)
        i = src.index("[", m.end() - 1)
        j = _mang(src, i)
        if j < 0:
            continue
        try:
            rows = json.loads(src[i:j])
        except json.JSONDecodeError:
            continue
        if isinstance(rows, list) and rows and isinstance(rows[0], list) and len(rows[0]) >= 7:
            out[name] = (i, j, rows)
    if "TV5_KHGD" in src:
        m = re.search(r"window\.TV5_KHGD\s*=\s*\[", src)
        if m:
            i = src.index("[", m.end() - 1)
            j = _mang(src, i)
            out["Tiếng Việt"] = (i, j, json.loads(src[i:j]))
    return src, out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lop", required=True, type=int, choices=[1, 2, 3, 4, 5])
    ap.add_argument("--mon", action="append", help="mã môn (lặp lại được); bỏ trống = mọi môn của lớp")
    ap.add_argument("--web", default=APP_WEB, help="thư mục web/ của app Bút Xanh")
    ap.add_argument("--thu", action="store_true", help="chỉ xem trước, không ghi tệp")
    args = ap.parse_args()

    path = os.path.join(args.web, f"khgd-lop{args.lop}.js")
    if not os.path.exists(path):
        sys.exit(f"Không thấy {path}")
    src, app = load_app(path)

    bosung = {}
    if os.path.exists(BOSUNG):
        for r in json.load(io.open(BOSUNG, encoding="utf-8"))["quyTac"]:
            bosung.setdefault((r["grade"], r["subject"], r["tiet"]), []).extend(r["them"])

    sids = args.mon or sorted(
        os.path.basename(p)[:-5]
        for p in os.listdir(os.path.join(CURRICULUM, f"lop{args.lop}")) if p.endswith(".json"))
    edits = []
    for sid in sids:
        jf = os.path.join(CURRICULUM, f"lop{args.lop}", sid + ".json")
        name = BX_NAME.get(sid)
        if not os.path.exists(jf) or name not in app:
            print(f"  bỏ qua {sid} (app chưa có môn này)")
            continue
        data = json.load(io.open(jf, encoding="utf-8"))
        a, b, cu = app[name]
        # Cột 7 cũ của app, tra theo tiết — đó là phần gốc, app còn sinh thêm theo luật
        goc = {norm(r[6]): r[7] for r in cu if len(r) > 7 and r[7]}

        def cot7(lesson, t, sid=sid, goc=goc):
            if sid in NGUYEN_VAN:
                return " — ".join(intg_lines(lesson))
            parts = [goc.get(t, "")] if goc.get(t) else []
            co = norm(" ".join(parts)).lower()
            for them in bosung.get((args.lop, sid, t), []):
                if norm(them)[:40].lower() not in co:
                    parts.append(them)
            return " — ".join(p for p in parts if p)

        ten_cu = {norm(r[6]): r[4] for r in cu if len(r) > 6 and r[4]}
        moi = rows_of(data, cot7, ten_cu)
        khac = sum(1 for i in range(max(len(cu), len(moi)))
                   if (cu[i] if i < len(cu) else None) != (moi[i] if i < len(moi) else None))
        print(f"  {name:22s} {len(cu):3d} -> {len(moi):3d} dòng, {khac} dòng khác")
        edits.append((a, b, json.dumps(moi, ensure_ascii=False)))

    if args.thu:
        print("(--thu: không ghi tệp)")
        return
    for a, b, text in sorted(edits, reverse=True):     # ghi từ cuối lên để giữ vị trí
        src = src[:a] + text + src[b:]
    bak = path + f".backup-pre-gopy-{json.load(io.open(BOSUNG, encoding='utf-8'))['capNhat'].replace('-', '')}.bak"
    if not os.path.exists(bak):
        shutil.copyfile(path, bak)
        print("  lưu bản cũ:", os.path.basename(bak))
    io.open(path, "w", encoding="utf-8", newline="\n").write(src)
    print("Đã ghi", path)


if __name__ == "__main__":
    main()
