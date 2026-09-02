/* SearchBox: ô tìm kiếm chung với gợi ý trực tiếp; Enter hoặc nút "Tìm" mở trang kết quả */
(function () {
  const CT = window.CT;
  const { esc, $, $$, on, debounce } = CT.lib.dom;
  const { highlight } = CT.lib.text;
  const icon = CT.lib.icon;

  function render({ id, placeholder = 'Tìm kiếm…', compact = false, hints = false, value = '' } = {}) {
    const hintHtml = hints ? `
<div class="search-hint">
  <span>Ví dụ:</span>
  <button type="button" data-hint="Tiếng Việt tuần 3">Tiếng Việt tuần 3</button>
  <button type="button" data-hint="Toán lớp 2 phép cộng">Toán lớp 2 phép cộng</button>
  <button type="button" data-hint="quốc phòng an ninh">quốc phòng an ninh</button>
  <button type="button" data-hint="năng lực số lớp 4">năng lực số lớp 4</button>
</div>` : '';
    return `
<div class="search-box" data-search-box="${esc(id)}">
  <form role="search" autocomplete="off">
    <div class="field">
      <span class="search-icon">${icon('search')}</span>
      <label class="visually-hidden" for="${esc(id)}">Tìm kiếm</label>
      <input class="input" id="${esc(id)}" name="q" type="search" inputmode="search" enterkeyhint="search"
             placeholder="${esc(placeholder)}" value="${esc(value)}" aria-autocomplete="list" aria-controls="${esc(id)}-suggest" aria-expanded="false">
      <button type="button" class="clear" aria-label="Xoá" hidden>${icon('x')}</button>
    </div>
    ${compact ? '' : `<button type="submit" class="btn btn-primary">${icon('search')} Tìm kiếm</button>`}
  </form>
  ${hintHtml}
  <ul class="suggest" id="${esc(id)}-suggest" role="listbox" hidden></ul>
</div>`;
  }

  function suggestHtml(results, q, total) {
    const { subjectById } = CT.store;
    const items = results.map((r) => {
      const s = subjectById[r.subjectId];
      const href = CT.router.build.subject(r.grade, r.subjectId, { bai: r.id });
      return `<li role="option"><a href="${href}">
        <div class="crumbs"><b>Lớp ${r.grade}</b><span>${esc(s ? s.name : r.subjectId)}</span><span>Tuần ${r.week}</span>${r.theme ? `<span>${esc(r.theme)}</span>` : ''}</div>
        <div class="title">${highlight(r.title, q)}</div></a></li>`;
    }).join('');
    const more = `<li class="more">${total > results.length ? `Xem tất cả ${total.toLocaleString('vi-VN')} kết quả – nhấn Enter` : `${total} kết quả – nhấn Enter để xem trang kết quả`}</li>`;
    return items + more;
  }

  /** Gắn sự kiện cho mọi ô tìm kiếm trong root */
  function bind(root) {
    $$('[data-search-box]', root).forEach((box) => {
      const input = $('input', box);
      const list = $('.suggest', box);
      const clear = $('.clear', box);
      const form = $('form', box);

      const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); };
      const update = debounce(async () => {
        const q = input.value.trim();
        clear.hidden = !q;
        if (q.length < 2) { close(); return; }
        try {
          if (!CT.search.isReady()) CT.search.prepare(await CT.loader.loadSearchIndex());
        } catch (e) { close(); return; }
        if (input.value.trim() !== q) return;
        const res = CT.search.search(q, { limit: 5000 });
        if (!res.length) { list.innerHTML = `<li class="more">Không tìm thấy kết quả cho “${esc(q)}”</li>`; }
        else list.innerHTML = suggestHtml(res.slice(0, 6), q, res.length);
        list.hidden = false; input.setAttribute('aria-expanded', 'true');
      }, 120);

      input.addEventListener('input', update);
      input.addEventListener('focus', () => { if (input.value.trim().length >= 2 && list.innerHTML) { list.hidden = false; } });
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') { close(); input.blur(); }
        if (ev.key === 'ArrowDown') { const a = $('a', list); if (a && !list.hidden) { ev.preventDefault(); a.focus(); } }
      });
      list.addEventListener('keydown', (ev) => {
        const links = $$('a', list); const i = links.indexOf(document.activeElement);
        if (ev.key === 'ArrowDown' && i < links.length - 1) { ev.preventDefault(); links[i + 1].focus(); }
        if (ev.key === 'ArrowUp') { ev.preventDefault(); if (i > 0) links[i - 1].focus(); else input.focus(); }
        if (ev.key === 'Escape') { close(); input.focus(); }
      });
      clear.addEventListener('click', () => { input.value = ''; clear.hidden = true; close(); input.focus(); });
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const q = input.value.trim();
        if (!q) { input.focus(); return; }
        close();
        CT.router.go(CT.router.build.search(q));
      });
      on(box, 'click', '[data-hint]', (ev, el) => { input.value = el.dataset.hint; CT.router.go(CT.router.build.search(el.dataset.hint)); });
      on(list, 'click', 'a', () => close());
      document.addEventListener('click', (ev) => { if (!box.contains(ev.target)) close(); });
    });
  }

  CT.components.SearchBox = { render, bind };
})();
