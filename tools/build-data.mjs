// Đóng gói dữ liệu JSON trong data/ thành các tệp JS để website chạy được cả khi mở trực tiếp
// (file://) lẫn khi đưa lên GitHub Pages, không cần máy chủ hay bước build phức tạp.
//
// Chạy:  node tools/build-data.mjs
//
// Sinh ra:
//   js/data.bundle.js                 – danh mục: trường, khối lớp, môn học, nhãn tích hợp, tóm tắt từng KHDH
//   data/curriculum/lopN/<mon>.js     – KHDH từng môn (tải khi người dùng mở môn đó)
//   data/search-index.js              – chỉ mục tìm kiếm toàn trường (tải khi người dùng bắt đầu tìm)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const compact = (o) => JSON.stringify(o);

const school = readJson(path.join(DATA, 'school.json'));
const grades = readJson(path.join(DATA, 'grades.json'));
const subjects = readJson(path.join(DATA, 'subjects.json'));
const integrations = readJson(path.join(DATA, 'integrations.json'));
const subjectById = Object.fromEntries(subjects.map((s) => [s.id, s]));

const catalog = {};
const searchIndex = [];
const subjectIds = subjects.map((s) => s.id);
const themes = []; const themeIndex = new Map();
let files = 0;

for (const g of grades) {
  const dir = path.join(DATA, 'curriculum', `lop${g.grade}`);
  if (!fs.existsSync(dir)) continue;
  for (const fn of fs.readdirSync(dir)) {
    if (!fn.endsWith('.json')) continue;
    const cur = readJson(path.join(dir, fn));
    const key = `${cur.grade}/${cur.subjectId}`;
    if (!subjectById[cur.subjectId]) {
      console.warn(`Bỏ qua ${fn}: mã môn "${cur.subjectId}" chưa có trong data/subjects.json`);
      continue;
    }
    catalog[key] = {
      grade: cur.grade,
      subjectId: cur.subjectId,
      status: cur.status,
      statusLabel: cur.statusLabel,
      source: cur.source,
      summary: cur.summary,
      file: `data/curriculum/lop${cur.grade}/${cur.subjectId}.js`,
    };
    const js = `window.CT_DATA=window.CT_DATA||{};window.CT_DATA.curriculum=window.CT_DATA.curriculum||{};` +
      `window.CT_DATA.curriculum[${JSON.stringify(key)}]=${compact(cur)};` +
      `if(window.CT_DATA.onCurriculumLoaded)window.CT_DATA.onCurriculumLoaded(${JSON.stringify(key)});\n`;
    fs.writeFileSync(path.join(dir, fn.replace(/\.json$/, '.js')), js, 'utf8');
    files++;
    for (const l of cur.lessons) {
      // Chủ đề lặp lại nhiều lần -> lưu từ điển để chỉ mục gọn
      let ti = themeIndex.get(l.theme);
      if (ti === undefined) { ti = themes.length; themes.push(l.theme); themeIndex.set(l.theme, ti); }
      searchIndex.push([cur.grade, subjectIds.indexOf(cur.subjectId), l.semester, l.week, l.id, l.title, ti,
        l.integrations.map((i) => i.code).join(' ')]);
    }
  }
}

fs.mkdirSync(path.join(ROOT, 'js'), { recursive: true });
const bundle = `// Tệp sinh tự động bởi tools/build-data.mjs – KHÔNG sửa tay, hãy sửa các tệp trong data/ rồi chạy lại.\n` +
  `window.CT_DATA=Object.assign(window.CT_DATA||{},{generatedAt:${JSON.stringify(new Date().toISOString())},` +
  `school:${compact(school)},grades:${compact(grades)},subjects:${compact(subjects)},integrations:${compact(integrations)},catalog:${compact(catalog)}});\n`;
fs.writeFileSync(path.join(ROOT, 'js', 'data.bundle.js'), bundle, 'utf8');

const idx = `// Tệp sinh tự động bởi tools/build-data.mjs. rows: [lớp, thứ tự môn trong subjects, học kì, tuần, mã bài, tên bài, thứ tự chủ đề trong themes, mã tích hợp]\n` +
  `window.CT_DATA=window.CT_DATA||{};window.CT_DATA.searchIndex={subjects:${compact(subjectIds)},themes:${compact(themes)},rows:${compact(searchIndex)}};` +
  `if(window.CT_DATA.onSearchIndexLoaded)window.CT_DATA.onSearchIndexLoaded();\n`;
fs.writeFileSync(path.join(DATA, 'search-index.js'), idx, 'utf8');

const kb = (p) => (fs.statSync(p).size / 1024).toFixed(0) + ' KB';
console.log(`Đã đóng gói ${files} KHDH, ${searchIndex.length} bài học.`);
console.log(`  js/data.bundle.js: ${kb(path.join(ROOT, 'js', 'data.bundle.js'))}`);
console.log(`  data/search-index.js: ${kb(path.join(DATA, 'search-index.js'))}`);
