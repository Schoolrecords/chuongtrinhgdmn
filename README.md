# Chương trình giáo dục môn học – Trường Tiểu học Quảng Châu 1

Cổng tra cứu chương trình, kế hoạch dạy học (KHDH) và nội dung tích hợp theo từng lớp, từng môn học.
Năm học 2026–2027. Website tĩnh, không cần bước build, chạy được khi mở trực tiếp `index.html`
hoặc đưa lên GitHub Pages: <https://schoolrecords.github.io/chuongtrinhgdmn/>.

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
│   ├── curriculum/lopN/*.json KHDH từng môn (nguồn sự thật, sinh từ tệp Word)
│   ├── curriculum/lopN/*.js   (sinh tự động) bản đóng gói tải theo nhu cầu
│   └── search-index.js        (sinh tự động) chỉ mục tìm kiếm toàn trường
├── assets/fonts/              UTM Avo thường, đậm, nghiêng, đậm nghiêng (woff2 + ttf)
├── assets/covers/             bìa SGK Tiếng Việt tập một lớp 1–5 (jpg + webp, 480px)
└── tools/
    ├── docx-to-json.py        nhập KHDH từ tệp Word (Phụ lục 2 CV 2345) → data/curriculum/*.json
    ├── build-data.mjs         đóng gói JSON → js/data.bundle.js, data/**/*.js, search-index.js
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

## Đưa lên GitHub Pages

Đẩy toàn bộ thư mục `website/` lên nhánh `main` của kho `schoolrecords/chuongtrinhgdmn`
(thư mục gốc), bật Pages: *Settings → Pages → Deploy from a branch → main / (root)*.
Mọi đường dẫn trong mã đều tương đối nên chạy tốt dưới đường dẫn con `/chuongtrinhgdmn/`.
