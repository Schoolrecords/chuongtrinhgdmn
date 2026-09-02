# Chương trình giáo dục môn học – Cấp Tiểu học

Tài liệu tham khảo **dùng chung** cho giáo viên tiểu học: kế hoạch dạy học theo tuần và nội dung
tích hợp của 13 môn học, hoạt động giáo dục từ lớp 1 đến lớp 5, lập theo Phụ lục 2 Công văn
2345/BGDĐT-GDTH. Xem trực tuyến tại <https://chuongtrinhgiaoduc.quantrisotruonghoc.com/>.

> Đây là **bản tham khảo**, không phải kế hoạch của riêng trường nào. Tên trường, tên người kí và
> địa danh đã được lược bỏ. Mỗi nhà trường tải bản Word về, điền thông tin của đơn vị mình, rà soát
> và điều chỉnh nội dung cho phù hợp điều kiện thực tế trước khi trình Hiệu trưởng phê duyệt.

## Dùng như thế nào

1. Chọn khối lớp trên trang chủ, chọn môn học để xem kế hoạch dạy học dạng trang A4 đúng khuôn Word.
2. Bấm **Tải Word** để lấy tệp của môn đó (hoặc **Cả khối** để lấy trọn khối lớp).
3. Ô tìm kiếm tra được theo tên bài, chủ đề, tuần (`tuần 5`) và mã nội dung tích hợp.

## Kho mã

Website tĩnh thuần HTML/CSS/JS, không cần bước build, mở trực tiếp `index.html` cũng chạy.
Thư mục này được **sinh tự động** từ kho nguồn bằng `node tools/build-public.mjs`; đừng sửa tay
ở đây vì lần sinh sau sẽ ghi đè.

```
index.html            trang duy nhất (ứng dụng một trang, định tuyến theo #hash)
css/                  tokens, base, components, responsive
js/                   lib/, components/, app.js, data.bundle.js (sinh tự động)
data/                 school.json, grades.json, subjects.json, integrations.json, curriculum/
assets/fonts          UTM Avo · assets/covers bìa SGK · assets/logo logo, favicon, ảnh chia sẻ
assets/docs/lopN/     bản Word từng môn (đã lược bỏ tên trường)
tools/build-data.mjs  đóng gói JSON -> JS · tools/serve.mjs máy chủ xem thử
```

Xem thử tại máy:

```bash
node tools/serve.mjs      # http://localhost:8790/
```

Thiết kế: ChungTran – 0913031073.
