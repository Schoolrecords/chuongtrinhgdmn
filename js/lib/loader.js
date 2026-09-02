/* Tải dữ liệu KHDH và chỉ mục tìm kiếm theo nhu cầu (chèn thẻ <script>, chạy được cả khi mở file:// ) */
(function () {
  const CT = (window.CT = window.CT || { lib: {}, components: {} });
  const cache = new Map();

  function loadScript(src) {
    if (cache.has(src)) return cache.get(src);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => resolve(src);
      s.onerror = () => { cache.delete(src); reject(new Error('Không tải được ' + src)); };
      document.head.appendChild(s);
    });
    cache.set(src, p);
    return p;
  }

  /** Trả về Promise<KHDH> của một môn, hoặc null nếu chưa có dữ liệu */
  async function loadCurriculum(grade, subjectId) {
    const key = `${grade}/${subjectId}`;
    const D = window.CT_DATA;
    if (D.curriculum && D.curriculum[key]) return D.curriculum[key];
    const entry = CT.store.data.catalog[key];
    if (!entry) return null;
    await loadScript(entry.file);
    return (D.curriculum && D.curriculum[key]) || null;
  }

  async function loadSearchIndex() {
    const D = window.CT_DATA;
    if (D.searchIndex) return D.searchIndex;
    await loadScript('data/search-index.js');
    return D.searchIndex || [];
  }

  CT.loader = { loadScript, loadCurriculum, loadSearchIndex };
})();
