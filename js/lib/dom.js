/* Tiện ích DOM nhỏ gọn dùng chung cho các component */
(function () {
  const CT = (window.CT = window.CT || { lib: {}, components: {} });

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** Uỷ quyền sự kiện: on(root, 'click', '.btn', (ev, el) => {}) */
  function on(root, type, selector, handler) {
    root.addEventListener(type, (ev) => {
      const el = ev.target.closest(selector);
      if (el && root.contains(el)) handler(ev, el);
    });
  }

  /** Ghép mảng HTML, bỏ giá trị rỗng */
  const join = (arr, sep = '') => arr.filter((x) => x !== null && x !== undefined && x !== false).join(sep);

  const debounce = (fn, ms = 150) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  function scrollToEl(el, offset = 84) {
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }

  CT.lib.dom = { esc, $, $$, on, join, debounce, scrollToEl };
})();
