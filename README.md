# Kế hoạch dạy học các môn học, hoạt động giáo dục – Trường Tiểu học Quảng Châu 1

Cổng tra cứu kế hoạch dạy học (KHDH) và nội dung tích hợp theo từng lớp, từng môn học.
Tên gọi lấy đúng theo Phụ lục 2 Công văn 2345/BGDĐT-GDTH.
Năm học 2026–2027. Website tĩnh, không cần bước build, chạy được khi mở trực tiếp `index.html`
hoặc đưa lên GitHub Pages: <https://ctgd.quantrisotruonghoc.com/>.

## Cấu trúc

```
website/
├── index.html                 Trang duy nhất (ứng dụng một trang, định tuyến theo #hash)
├── css/
│   ├── tokens.css             @font-face UTM Avo + biến màu, chữ, khoảng cách
│   ├── base.css               reset, chữ, nút, nhãn, ô nhập
│   ├── components.css         kiểu của từng component
│   └── responsive.css         breakpoint <480, 480–768, 768–1024, >1024, in ấn
├── js/
│   ├── lib/                   dom, text (bỏ dấu, tô sáng), icons, store, router, loader, search
│   ├── components/            Header, HeroSection, SchoolTag, SearchBox, GradeBookshelf, GradeCard,
│   │                          SubjectGrid, SubjectCard, SubjectDetail, CurriculumTable,
│   │                          IntegrationBadge, SearchResults, Footer
│   ├── app.js                 khởi tạo, định tuyến, sự kiện
│   └── data.bundle.js         (sinh tự động) danh mục + tóm tắt KHDH
├── data/
│   ├── school.json            tên trường, năm học, câu giới thiệu, căn cứ pháp lí
│   ├── grades.json            5 khối lớp, bìa sách, danh sách môn của từng khối
│   ├── subjects.json          13 môn học/hoạt động giáo dục (tên, mô tả, biểu tượng, màu)
│   ├── integrations.json      nhóm và mã nội dung tích hợp, lồng ghép
│   ├── gddp-bo-sung.json      luật gắn thêm mã GDĐP cho bài mà tệp Word chưa ghi (tổ CM duyệt)
│   ├── curriculum/lopN/*.json KHDH từng môn (nguồn sự thật, sinh từ tệp Word)
│   ├── curriculum/lopN/*.js   (sinh tự động) bản đóng gói tải theo nhu cầu
│   └── search-index.js        (sinh tự động) chỉ mục tìm kiếm toàn trường
├── assets/fonts/              UTM Avo thường, đậm, nghiêng, đậm nghiêng (woff2 + ttf)
├── assets/covers/             bìa SGK Tiếng Việt tập một lớp 1–5 (jpg + webp, 480px)
└── tools/
    ├── docx-to-json.py        nhập KHDH từ tệp Word (Phụ lục 2 CV 2345) → data/curriculum/*.json
    ├── build-data.mjs         đóng gói JSON → js/data.bundle.js, data/**/*.js, search-index.js
    ├── make-covers.py         dựng ảnh thẻ khối lớp từ tranh bìa SGK (assets/covers/khdh-lop-N.*)
    └── serve.mjs              máy chủ xem thử: http://localhost:8790/
```

## Chạy thử

```bash
cd website
node tools/serve.mjs          # mở http://localhost:8790/
```
Hoặc mở trực tiếp `index.html` bằng trình duyệt (dữ liệu được nạp bằng thẻ script nên vẫn chạy).

## Cập nhật dữ liệu

1. **Từ tệp Word KHDH** (thư mục `../Lớp 1` … `../Lớp 5`, mỗi môn một tệp; nếu có tệp cùng tên kèm
   "(đã rà soát)" thì bản đó được ưu tiên và gắn nhãn *Đã rà soát*):
   ```bash
   python tools/docx-to-json.py      # cần: pip install python-docx
   node tools/build-data.mjs
   ```
2. **Sửa tay / nhập từ Excel**: sửa các tệp `data/curriculum/lopN/<mã-môn>.json` (mỗi bài học một bản ghi:
   tuần, học kì, chủ đề, tên bài, nội dung, tiết, điều chỉnh, tích hợp, ghi chú) rồi chạy `node tools/build-data.mjs`.
3. **Trạng thái dữ liệu** trong mỗi tệp KHDH: `"status": "draft"` (chờ xác nhận – mặc định), `"reviewed"` (đã rà soát), `"official"` (chính thức),
   `"sample"` (dữ liệu minh họa). Website hiển thị nhãn tương ứng.
4. Thêm `"team"` và `"teachers"` vào tệp KHDH để hiển thị tổ chuyên môn, giáo viên phụ trách.
5. Đổi năm học: sửa `data/school.json` và `SCHOOL_YEAR` trong `tools/docx-to-json.py`.
6. **Ngày nhập** ghi vào JSON lấy từ `IMPORT_DATE` trong `tools/docx-to-json.py` (không phải ngày hôm nay),
   để chạy lại bộ nhập liệu khi sửa lỗi phân tích không làm đổi ngày nhà trường bàn giao tệp Word.
   Nhập đợt dữ liệu mới thì đổi hằng số đó, hoặc chạy `python tools/docx-to-json.py --date 2026-09-15`.
7. **Gắn thêm mã GDĐP**: nhiều bài có nội dung địa phương nhưng tệp Word ghi trong phần Quốc phòng –
   an ninh, Kĩ năng sống hoặc Năng lực số, không ghi mã GDĐP. Thay vì sửa tệp Word của nhà trường,
   các bài tổ chuyên môn đã duyệt được liệt kê trong `data/gddp-bo-sung.json` (khớp theo lớp + môn +
   đúng nguyên văn câu tích hợp); bộ nhập liệu chèn thêm mã GDĐP ngay sau mục cùng nội dung nên bảng
   hiện hai nhãn trên một dòng, chữ không lặp. Câu nào trong tệp Word đổi đi thì lệnh nhập in cảnh
   báo `! luật không khớp bài nào` để rà lại. Bài được gắn có cờ `"gddpBoSung": true`.

## Bản dùng chung (không thuộc trường nào)

Ngoài bản nội bộ của trường, kho này còn sinh ra **bản tham khảo dùng chung** tại
<https://chuongtrinhgiaoduc.quantrisotruonghoc.com/> – cùng một mã giao diện, chỉ khác phần định danh,
nhãn dữ liệu và các tệp Word đã lược bỏ tên trường, tên người kí, địa danh.

```bash
node tools/build-public.mjs      # sinh ../web-chung/ (cần Python + python-docx, Pillow)
```

Bộ sinh gồm:

| Tệp | Việc |
| --- | --- |
| `tools/build-public.mjs` | chép mã, thay `data/school.json`, ẩn danh KHDH, chuyển trạng thái sang *tham khảo*, sửa thẻ meta, CNAME, README |
| `tools/public/school.json` | phần định danh riêng của bản dùng chung (tên trang, khối "3 bước", mục *Mẫu biểu trống*) |
| `tools/public/README.md` | README của kho công khai |
| `tools/make-public-docs.py` | ẩn danh 56 tệp Word và dựng *Mẫu Phụ lục 2 – KHDH môn học (trống)* |
| `tools/make-og-image.py` | ảnh xem trước khi chia sẻ (1200×630) |

Thư mục `web-chung/` là **kết quả sinh tự động**, đừng sửa tay. Sửa giao diện ở `website/` rồi chạy lại
lệnh trên là cả hai bản cùng được cập nhật.

Đưa lên GitHub Pages (kho `Schoolrecords/chuongtrinhgiaoduc`):

```bash
cd ..
git subtree split --prefix=web-chung -b gh-chung-src
git push -f chung gh-chung-src:main       # remote "chung" trỏ tới kho công khai
```

## Ba nơi phải đồng bộ

Nội dung kế hoạch dạy học các môn học, hoạt động giáo dục hiện ở **ba nơi**. Sửa một nơi là phải rà cả ba, nếu không
giáo viên sẽ thấy ba bản khác nhau của cùng một kế hoạch:

| Nơi | Đường dẫn | Cách cập nhật |
| --- | --- | --- |
| Bản nội bộ của trường | `website/` | sửa trực tiếp, rồi `python tools/docx-to-json.py` + `node tools/build-data.mjs` |
| Bản dùng chung | `web-chung/` | **không sửa tay**, chạy `node tools/build-public.mjs` sau khi sửa `website/` |
| Ứng dụng Bút Xanh | `../../web/index.html` | sửa tay; phần KHDH ở `buildKHGDPhuLuc2` (bảng QUY ƯỚC MÃ, mục I căn cứ) và dữ liệu ở `../../web/khgd-lop*.js` |

Bút Xanh giữ dữ liệu KHDH riêng (`window.BX_KHGD_RAW` trong `khgd-lop1.js`…`khgd-lop5.js`) và tự sinh
tệp Word Phụ lục 2, nên bảng quy ước mã, danh mục căn cứ và các nội dung tích hợp bật/tắt phải khớp
với hai bản website. Trước khi sửa, sao lưu theo lệ của kho đó: `index.html.backup-pre-<việc>-<YYYYMMDD>.bak`.

## Đưa lên GitHub Pages

Đẩy toàn bộ thư mục `website/` lên nhánh `main` của kho `schoolrecords/chuongtrinhgdmn`
(thư mục gốc), bật Pages: *Settings → Pages → Deploy from a branch → main / (root)*.
Mọi đường dẫn trong mã đều tương đối nên chạy tốt dưới đường dẫn con `/chuongtrinhgdmn/`.
