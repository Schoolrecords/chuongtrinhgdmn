/* Định tuyến theo hash để không tải lại trang và dùng được trên GitHub Pages (thư mục con).
   #/                      trang chủ
   #/lop/3                 trang chủ, đã chọn lớp 3
   #/lop/3/mon/tieng-viet  chi tiết môn (?hk=1&bai=<mã bài>&q=<tìm trong bảng>)
   #/tim?q=...&lop=3       kết quả tìm kiếm                                          */
(function () {
  const CT = (window.CT = window.CT || { lib: {}, components: {} });

  function parse(hash) {
    const h = (hash || location.hash || '').replace(/^#/, '') || '/';
    const [pathPart, queryPart = ''] = h.split('?');
    const params = new URLSearchParams(queryPart);
    const seg = pathPart.split('/').filter(Boolean);
    const r = { view: 'home', grade: null, subjectId: null, params };
    if (seg[0] === 'tim') { r.view = 'search'; return r; }
    if (seg[0] === 'lop' && seg[1]) {
      const g = parseInt(seg[1], 10);
      if (g >= 1 && g <= 5) r.grade = g;
      if (seg[2] === 'mon' && seg[3]) { r.view = 'subject'; r.subjectId = decodeURIComponent(seg[3]); }
    }
    return r;
  }

  const build = {
    home: (grade) => (grade ? `#/lop/${grade}` : '#/'),
    subject: (grade, subjectId, params) => {
      const qs = params ? new URLSearchParams(params).toString() : '';
      return `#/lop/${grade}/mon/${encodeURIComponent(subjectId)}${qs ? '?' + qs : ''}`;
    },
    search: (q, grade) => {
      const p = new URLSearchParams({ q: q || '' });
      if (grade) p.set('lop', String(grade));
      return `#/tim?${p.toString()}`;
    },
  };

  function go(hash, { replace = false } = {}) {
    if (replace) history.replaceState(null, '', hash); else location.hash = hash;
    if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  CT.router = { parse, build, go };
})();
