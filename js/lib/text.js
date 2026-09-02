/* Xử lý chuỗi tiếng Việt: bỏ dấu để tìm kiếm, tô sáng kết quả */
(function () {
  const CT = (window.CT = window.CT || { lib: {}, components: {} });
  const { esc } = CT.lib.dom;

  /** "Tiếng Việt" -> "tieng viet" (bỏ dấu, chữ thường, gọn khoảng trắng) */
  function normalize(s) {
    return String(s ?? '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /** Tách câu tìm kiếm thành các từ đã bỏ dấu */
  const tokens = (q) => normalize(q).split(' ').filter(Boolean);

  /**
   * Tô sáng các từ khoá trong văn bản (so khớp không dấu nhưng giữ nguyên chữ gốc).
   * Trả về HTML đã escape.
   */
  function highlight(text, query) {
    const src = String(text ?? '');
    const toks = tokens(query).filter((t) => t.length >= 2); // bỏ từ 1 ký tự (vd: số lớp) để không tô sáng lung tung
    if (!src || !toks.length) return esc(src);
    // Ánh xạ vị trí ký tự sau khi bỏ dấu về vị trí gốc (mỗi ký tự gốc -> đúng 1 ký tự chuẩn hoá)
    const chars = Array.from(src);
    const normChars = chars.map((c) => normalize(c) || ' ');
    const norm = normChars.join('');
    if (normChars.some((c) => c.length !== 1)) return esc(src); // an toàn: bỏ tô sáng nếu ánh xạ lệch
    const ranges = [];
    const isWordChar = (c) => /[a-z0-9]/.test(c || '');
    for (const t of toks) {
      let i = 0;
      while ((i = norm.indexOf(t, i)) !== -1) {
        // Chỉ tô sáng khi từ khoá bắt đầu một từ (tránh "an" trong "bản")
        if (i === 0 || !isWordChar(norm[i - 1])) ranges.push([i, i + t.length]);
        i += t.length;
      }
    }
    if (!ranges.length) return esc(src);
    ranges.sort((a, b) => a[0] - b[0]);
    let out = ''; let pos = 0;
    for (const [a, b] of ranges) {
      if (b <= pos) continue;
      const start = Math.max(a, pos);
      out += esc(chars.slice(pos, start).join('')) + '<mark>' + esc(chars.slice(start, b).join('')) + '</mark>';
      pos = b;
    }
    out += esc(chars.slice(pos).join(''));
    return out;
  }

  const plural = (n, unit) => `${Number(n || 0).toLocaleString('vi-VN')} ${unit}`;

  CT.lib.text = { normalize, tokens, highlight, plural };
})();
