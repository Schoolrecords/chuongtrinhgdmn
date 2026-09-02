// Sinh BẢN DÙNG CHUNG (https://chuongtrinhgiaoduc.quantrisotruonghoc.com/) từ bản nội bộ trong website/.
//
// Mã giao diện của hai bản là một; bản dùng chung chỉ khác phần định danh, nhãn dữ liệu và các
// tệp Word đã lược bỏ tên trường. Sửa giao diện ở website/ rồi chạy lại lệnh này là cả hai bản
// cùng được cập nhật, không sợ lệch nhau.
//
// Chạy trong thư mục website/:   node tools/build-public.mjs
// Kết quả: ../web-chung/  (đẩy lên kho Schoolrecords/chuongtrinhgiaoduc bằng git subtree)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, '..');                    // website/
const OUT = path.resolve(SRC, '..', 'web-chung');        // bản dùng chung
const OVERRIDE = path.join(HERE, 'public');              // tools/public/
const DOMAIN = 'chuongtrinhgiaoduc.quantrisotruonghoc.com';

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, o) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(o, null, 1), 'utf8'); };

/* ---------- Lược bỏ tên trường, tên người kí, địa danh khỏi mọi chuỗi ---------- */
const RULES = [
  // Bản viết hoa (đầu trang) giữ dạng hoa; các dạng còn lại giữ dạng chữ thường trong câu văn
  [/UBND\s+XÃ\s+QUẢNG\s+CHÂU/g, 'UBND ……………………'],
  [/TRƯỜNG\s+TIỂU\s+HỌC\s+QUẢNG\s+CHÂU\s*1/g, 'TRƯỜNG TIỂU HỌC ……………………'],
  [/UBND\s+xã\s+Quảng\s+Châu/gi, 'UBND xã ……………………'],
  [/Trường\s+Tiểu\s+học\s+Quảng\s+Châu\s*1/gi, 'Trường Tiểu học ……………………'],
  [/Quảng\s+Châu,\s*ngày\s*\d*\s*tháng\s*\d*\s*năm\s*\d*/g, '……………, ngày … tháng … năm 20…'],
  [/Quảng\s+Châu/g, '……………'],
  [/Trần\s+Thị\s+Liên/g, ''],
];
const clean = (s) => RULES.reduce((acc, [re, rep]) => acc.replace(re, rep), s);

/** Duyệt sâu mọi chuỗi trong một đối tượng JSON */
function deepClean(v) {
  if (typeof v === 'string') return clean(v);
  if (Array.isArray(v)) return v.map(deepClean);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepClean(x)]));
  return v;
}

/* ---------- Chép tệp / thư mục ---------- */
function copy(rel, { filter } = {}) {
  const from = path.join(SRC, rel);
  const to = path.join(OUT, rel);
  if (!fs.existsSync(from)) return;
  if (fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const fn of fs.readdirSync(from)) {
      const child = path.join(rel, fn);
      if (filter && !filter(child.replace(/\\/g, '/'))) continue;
      copy(child, { filter });
    }
  } else {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}

/* ---------- Bắt đầu ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

copy('css');
copy('js', { filter: (p) => !p.endsWith('data.bundle.js') && !/\.bundle\.js$/.test(p) });
copy('assets/fonts');
// Chỉ chép ảnh thẻ đang dùng; không đưa bìa SGK gốc lên bản dùng chung
copy('assets/covers', { filter: (p) => !/\/tieng-viet-/.test(p) });
// Chỉ lấy các tệp logo không có tên trường; og-image sinh riêng bằng tools/make-og-image.py
for (const fn of ['logo-mark.png', 'favicon.png', 'apple-touch-icon.png']) copy(`assets/logo/${fn}`);
copy('tools/build-data.mjs');
copy('tools/serve.mjs');
fs.writeFileSync(path.join(OUT, '.nojekyll'), '', 'utf8');
fs.writeFileSync(path.join(OUT, 'CNAME'), DOMAIN + '\n', 'utf8');

/* ---------- Dữ liệu ---------- */
const school = readJson(path.join(OVERRIDE, 'school.json'));
writeJson(path.join(OUT, 'data', 'school.json'), school);
for (const fn of ['grades.json', 'subjects.json', 'integrations.json']) {
  writeJson(path.join(OUT, 'data', fn), deepClean(readJson(path.join(SRC, 'data', fn))));
}

const STATUS_LABEL = 'Bản tham khảo lập theo Phụ lục 2 Công văn 2345/BGDĐT-GDTH. Nhà trường tự rà soát, '
  + 'điều chỉnh cho phù hợp điều kiện thực tế và trình Hiệu trưởng phê duyệt trước khi thực hiện.';

/** KHDH: ẩn danh, chuyển trạng thái sang "tham khảo", bỏ dấu vết tệp nguồn nội bộ */
function toPublic(cur) {
  const out = deepClean(cur);
  out.status = 'reference';
  out.statusLabel = STATUS_LABEL;
  delete out.source;
  return out;
}

let n = 0;
const grades = readJson(path.join(SRC, 'data', 'grades.json'));
for (const g of grades) {
  const dir = path.join(SRC, 'data', 'curriculum', `lop${g.grade}`);
  if (!fs.existsSync(dir)) continue;
  for (const fn of fs.readdirSync(dir)) {
    if (!fn.endsWith('.json')) continue;
    writeJson(path.join(OUT, 'data', 'curriculum', `lop${g.grade}`, fn), toPublic(readJson(path.join(dir, fn))));
    n++;
  }
}

const idxPath = path.join(SRC, 'data', 'curriculum', 'index.json');
if (fs.existsSync(idxPath)) {
  const idx = deepClean(readJson(idxPath));
  for (const it of idx.items || []) { it.status = 'reference'; delete it.source; }
  writeJson(path.join(OUT, 'data', 'curriculum', 'index.json'), idx);
}

/* ---------- index.html ---------- */
let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
const desc = 'Tra cứu kế hoạch dạy học theo tuần và nội dung tích hợp của 13 môn học, hoạt động giáo dục '
  + 'từ lớp 1 đến lớp 5 theo Chương trình giáo dục phổ thông 2018. Tài liệu tham khảo dùng chung, tải bản Word về dùng được ngay.';
const meta = (prop, val) => { html = html.replace(new RegExp(`(<meta (?:property|name)="${prop}" content=")[^"]*(")`), `$1${val}$2`); };
html = html.replace(/<title>[^<]*<\/title>/, `<title>${school.siteTitle} | ${school.name}</title>`);
meta('description', desc);
meta('og:title', `${school.siteTitle} – ${school.name}`);
meta('og:description', desc);
meta('og:url', `https://${DOMAIN}/`);
meta('og:image', `https://${DOMAIN}/assets/logo/og-image.png`);
meta('og:site_name', school.siteTitle);
meta('twitter:image', `https://${DOMAIN}/assets/logo/og-image.png`);
html = html.replace('<noscript><div class="container section"><p>Website cần bật JavaScript',
  '<noscript><div class="container section"><p>Trang cần bật JavaScript');
fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');

/* ---------- README của kho công khai ---------- */
fs.copyFileSync(path.join(OVERRIDE, 'README.md'), path.join(OUT, 'README.md'));

/* ---------- Word: ẩn danh + mẫu trống, ảnh Open Graph ---------- */
const py = (script) => {
  for (const exe of ['python', 'py', 'python3']) {
    try {
      execFileSync(exe, [path.join('tools', script)], { cwd: SRC, stdio: 'inherit', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
      return true;
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  console.warn(`! Không chạy được tools/${script} (chưa có Python). Bỏ qua bước này.`);
  return false;
};
py('make-public-docs.py');
py('make-og-image.py');

/* ---------- Cập nhật dung lượng tệp Word sau khi ẩn danh ---------- */
const sizeOf = (rel) => { const p = path.join(OUT, rel); return fs.existsSync(p) ? fs.statSync(p).size : null; };
const fixSize = (att) => { if (att && att.file) { const s = sizeOf(att.file); if (s) att.size = s; } };
for (const g of grades) {
  const dir = path.join(OUT, 'data', 'curriculum', `lop${g.grade}`);
  if (!fs.existsSync(dir)) continue;
  for (const fn of fs.readdirSync(dir)) {
    if (!fn.endsWith('.json')) continue;
    const p = path.join(dir, fn); const cur = readJson(p); fixSize(cur.attachment); writeJson(p, cur);
  }
}
const idxOut = path.join(OUT, 'data', 'curriculum', 'index.json');
if (fs.existsSync(idxOut)) {
  const idx = readJson(idxOut);
  for (const it of idx.items || []) fixSize(it.attachment);
  for (const k of Object.keys(idx.gradeAttachments || {})) fixSize(idx.gradeAttachments[k]);
  writeJson(idxOut, idx);
}
const schoolOut = path.join(OUT, 'data', 'school.json');
const sc = readJson(schoolOut);
for (const t of (sc.templates?.items || [])) { const s2 = sizeOf(t.file); if (s2) t.size = s2; }
writeJson(schoolOut, sc);

/* ---------- Đóng gói dữ liệu cho bản dùng chung ---------- */
execFileSync(process.execPath, [path.join('tools', 'build-data.mjs')], { cwd: OUT, stdio: 'inherit' });

console.log(`\nXong: ${n} KHDH -> ${OUT}`);
console.log(`Xem thử:  cd ../web-chung && node tools/serve.mjs`);
