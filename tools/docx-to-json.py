# -*- coding: utf-8 -*-
"""
Nhập Kế hoạch dạy học (KHDH) từ các tệp Word (Phụ lục 2 CV 2345) sang JSON.

Cách chạy (từ thư mục website/):
    python tools/docx-to-json.py              # đọc ../Lớp 1 … ../Lớp 5, ghi vào data/curriculum/
    python tools/docx-to-json.py --src "đường/dẫn/thư mục chứa Lớp 1..5"

Sau khi chạy, chạy tiếp:  node tools/build-data.mjs  để đóng gói JSON thành js/data.bundle.js.

Yêu cầu: pip install python-docx
"""
import argparse
import datetime
import glob
import json
import os
import re
import sys

try:
    import docx  # python-docx
except ImportError:
    sys.exit("Thiếu thư viện python-docx. Cài bằng: pip install python-docx")

HERE = os.path.dirname(os.path.abspath(__file__))
WEBSITE = os.path.dirname(HERE)
DEFAULT_SRC = os.path.dirname(WEBSITE)          # thư mục "Chương trình GD Môn học"
OUT_DIR = os.path.join(WEBSITE, "data", "curriculum")
SCHOOL_YEAR = "2026-2027"

# Tên môn trong tên tệp -> mã môn dùng trong website (khớp data/subjects.json)
SUBJECT_MAP = [
    ("Tiếng Việt", "tieng-viet"),
    ("Toán", "toan"),
    ("Đạo đức", "dao-duc"),
    ("Tự nhiên và Xã hội", "tu-nhien-va-xa-hoi"),
    ("Khoa học", "khoa-hoc"),
    ("Lịch sử & Địa lí", "lich-su-va-dia-li"),
    ("Lịch sử và Địa lí", "lich-su-va-dia-li"),
    ("Tiếng Anh", "ngoai-ngu-1"),
    ("Ngoại ngữ 1", "ngoai-ngu-1"),
    ("Tin học", "tin-hoc"),
    ("Công nghệ", "cong-nghe"),
    ("Âm nhạc", "am-nhac"),
    ("Mĩ thuật", "mi-thuat"),
    ("GDTC", "giao-duc-the-chat"),
    ("Giáo dục thể chất", "giao-duc-the-chat"),
    ("HĐTN", "hoat-dong-trai-nghiem"),
    ("Hoạt động trải nghiệm", "hoat-dong-trai-nghiem"),
]

# Mã nội dung tích hợp, lồng ghép xuất hiện trong cột "Nội dung điều chỉnh, bổ sung"
INTEGRATION_CODES = [
    "NLS-KT", "NLS-GT", "NLS-ST", "NLS-AT", "NLS-GQVĐ", "NLS-NB", "NLS",
    "AI-NB", "AI",
    "GDQPAN", "QPAN",
    "KNS", "STEM",
    "GDĐP", "ATGT", "GDMT", "QTE", "ĐĐLS", "GDHN",
]
# "ĐÍNH CHÍNH" là điều chỉnh SGK, không phải tích hợp
ADJUST_CODES = ["ĐÍNH CHÍNH", "ĐÍNH CHÍNH SGK", "ĐIỀU CHỈNH"]

CODE_RE = re.compile(
    r"(?:^|(?<=[\.\;\)\s]))(?:Lồng ghép\s+)?(" +
    "|".join(re.escape(c) for c in sorted(INTEGRATION_CODES + ADJUST_CODES, key=len, reverse=True)) +
    r")\s*(\([^)]*\))?\s*:",
    re.UNICODE,
)
PERIOD_RE = re.compile(r"Tiết\s*(\d+)\s*(?:[–\-+]\s*(\d+))?\s*(?:\((\d+)\s*tiết\))?", re.UNICODE)


def subject_id_from_filename(name):
    for key, sid in SUBJECT_MAP:
        if key.lower() in name.lower():
            return sid
    return None


def split_integrations(text):
    """Tách cột 'Nội dung điều chỉnh, bổ sung' thành (điều chỉnh tự do, [tích hợp])."""
    text = (text or "").strip()
    if not text:
        return "", []
    matches = list(CODE_RE.finditer(text))
    if not matches:
        return text, []
    free = text[: matches[0].start()].strip(" ;.\n")
    items = []
    adjust_parts = [free] if free else []
    for i, m in enumerate(matches):
        code = m.group(1)
        level = (m.group(2) or "").strip("() ")
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[m.end():end].strip(" ;\n")
        if code in ADJUST_CODES:
            adjust_parts.append(body)
            continue
        norm = {"GDQPAN": "QPAN", "AI": "AI-NB"}.get(code, code)
        items.append({"code": norm, "level": level, "text": body})
    return "; ".join(p for p in adjust_parts if p), items


def parse_period(label):
    """Trả về (tiết đầu, tiết cuối, số tiết của dòng, tổng số tiết của bài nếu ghi trong ngoặc).

    Trong tệp KHDH, một bài nhiều tiết có thể được tách thành nhiều dòng: dòng đầu ghi
    "Tiết 2 (3 tiết)" (3 tiết là tổng của cả bài), các dòng sau chỉ ghi "Tiết 3", "Tiết 4".
    Số tiết của từng dòng luôn tính theo khoảng tiết, không lấy số trong ngoặc.
    """
    m = PERIOD_RE.search(label or "")
    if not m:
        n = re.search(r"(\d+)\s*tiết", label or "")
        n = int(n.group(1)) if n else None
        return None, None, n, n
    a = int(m.group(1))
    b = int(m.group(2)) if m.group(2) else a
    lesson_total = int(m.group(3)) if m.group(3) else None
    return a, b, b - a + 1, lesson_total


def parse_docx(path, grade, subject_id):
    d = docx.Document(path)
    if not d.tables:
        raise ValueError("Không có bảng trong tệp")
    table = d.tables[0]
    lessons = []
    semester = 1
    cur_week = None
    cur_theme = ""
    idx = 0
    for ri, row in enumerate(table.rows):
        cells = [c.text.strip() for c in row.cells]
        if len(cells) < 6:
            continue
        joined = " ".join(set(cells)).upper()
        if ri < 2 and "TUẦN" in joined:
            continue  # dòng tiêu đề
        # Dòng "HỌC KÌ I/II" gộp toàn bộ cột
        if len(set(cells)) == 1 and "HỌC KÌ" in joined:
            semester = 2 if ("II" in joined.replace("HỌC KÌ", "").strip()) else 1
            continue
        week_txt, theme, title, period_label, adjust_txt, note = cells[:6]
        if week_txt:
            wk = re.search(r"\d+", week_txt)
            if wk:
                cur_week = int(wk.group(0))
        if theme:
            cur_theme = theme
        if not title and not period_label:
            continue
        adjustments, integrations = split_integrations(adjust_txt)
        p_from, p_to, p_n, p_lesson = parse_period(period_label)
        idx += 1
        lessons.append({
            "id": f"l{grade}-{subject_id}-{idx:03d}",
            "semester": semester if cur_week is None else (semester if semester == 2 or cur_week <= 18 else 2),
            "week": cur_week,
            "theme": cur_theme,
            "title": title,
            "content": "",
            "periodLabel": period_label,
            "periodFrom": p_from,
            "periodTo": p_to,
            "periods": p_n,
            "lessonPeriods": p_lesson,
            "adjustments": adjustments,
            "integrations": integrations,
            "note": note,
        })
    total = sum(l["periods"] or 0 for l in lessons)
    weeks = sorted({l["week"] for l in lessons if l["week"]})
    return {
        "schoolYear": SCHOOL_YEAR,
        "grade": grade,
        "subjectId": subject_id,
        "status": "draft",
        "statusLabel": "Bản nháp từ tệp KHDH, chờ tổ chuyên môn xác nhận",
        "source": {
            "file": os.path.relpath(path, DEFAULT_SRC).replace("\\", "/"),
            "importedAt": datetime.date.today().isoformat(),
        },
        "summary": {
            "totalPeriods": total,
            "weeks": len(weeks),
            "semester1Weeks": len([w for w in weeks if w <= 18]),
            "semester2Weeks": len([w for w in weeks if w > 18]),
            "lessons": len(lessons),
            "integrations": len([1 for l in lessons for _ in l["integrations"]]),
        },
        "lessons": lessons,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=DEFAULT_SRC)
    args = ap.parse_args()
    os.makedirs(OUT_DIR, exist_ok=True)
    index = []
    files = sorted(glob.glob(os.path.join(args.src, "Lớp *", "KHDH *lớp * (*).docx")))
    files = [f for f in files if "cả khối" not in os.path.basename(f)]
    if not files:
        sys.exit(f"Không tìm thấy tệp KHDH trong {args.src}")
    for f in files:
        base = os.path.basename(f)
        g = re.search(r"lớp\s*(\d)", base, re.I)
        sid = subject_id_from_filename(base.split("lớp")[0])
        if not g or not sid:
            print("BỎ QUA (không nhận diện được):", base)
            continue
        grade = int(g.group(1))
        try:
            data = parse_docx(f, grade, sid)
        except Exception as e:  # noqa
            print("LỖI", base, e)
            continue
        out_dir = os.path.join(OUT_DIR, f"lop{grade}")
        os.makedirs(out_dir, exist_ok=True)
        out = os.path.join(out_dir, f"{sid}.json")
        with open(out, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=1)
        index.append({
            "grade": grade, "subjectId": sid, "file": f"curriculum/lop{grade}/{sid}.json",
            "status": data["status"], "summary": data["summary"], "source": data["source"],
        })
        s = data["summary"]
        print(f"OK lớp {grade} {sid:24s} bài={s['lessons']:3d} tiết={s['totalPeriods']:3d} tuần={s['weeks']:2d} tích hợp={s['integrations']}")
    index.sort(key=lambda x: (x["grade"], x["subjectId"]))
    with open(os.path.join(OUT_DIR, "index.json"), "w", encoding="utf-8") as fh:
        json.dump({"schoolYear": SCHOOL_YEAR, "generatedAt": datetime.date.today().isoformat(), "items": index},
                  fh, ensure_ascii=False, indent=1)
    print(f"Đã ghi {len(index)} tệp JSON vào {OUT_DIR}")


if __name__ == "__main__":
    main()
