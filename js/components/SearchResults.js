/* SearchResults: trang kết quả tìm kiếm toàn trường */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const { highlight } = CT.lib.text;
  const icon = CT.lib.icon;

  function resultCard(r, q) {
    const s = CT.store.subjectById[r.subjectId];
    const href = CT.router.build.subject(r.grade, r.subjectId, { bai: r.id });
    return `<a class="result-card" href="${href}">
      <div class="crumbs"><span class="pill pill-navy">Lớp ${r.grade}</span><span class="pill pill-teal">${esc(s ? s.name : r.subjectId)}</span><span class="pill pill-gold">Tuần ${r.week ?? '—'}</span><span class="pill pill-info">Học kì ${r.semester === 2 ? 'II' : 'I'}</span>${r.integ.map((c) => CT.components.IntegrationBadge.render(c)).join('')}</div>
      <div class="title">${highlight(r.title, q)}</div>
      ${r.theme ? `<div class="theme">${highlight(r.theme, q)}</div>` : ''}
      <span class="go">Xem chi tiết trong kế hoạch ${icon('arrow-right')}</span>
    </a>`;
  }

  function render({ q, grade, results, loading = false, shown = 60 }) {
    const gradeChips = [null, 1, 2, 3, 4, 5].map((g) => `<a class="chip" role="button" aria-pressed="${grade === g ? 'true' : 'false'}" href="${CT.router.build.search(q, g)}">${g ? 'Lớp ' + g : 'Tất cả các lớp'}</a>`).join('');
    let body;
    if (loading) body = `<div class="card empty" aria-busy="true">${icon('clock')}<h3>Đang tải chỉ mục tìm kiếm…</h3></div>`;
    else if (!q) body = `<div class="card empty">${icon('search')}<h3>Nhập từ khoá để tìm kiếm</h3><p>Tìm theo tên môn học, tên bài học, chủ đề, tuần học hoặc nội dung tích hợp.</p></div>`;
    else if (!results.length) body = `<div class="card empty">${icon('search')}<h3>Không tìm thấy kết quả cho “${esc(q)}”</h3><p>Thử từ khoá ngắn hơn, hoặc gõ không dấu cũng được (ví dụ: “tuan 3 tieng viet”).</p></div>`;
    else body = `<div class="results-list">${results.slice(0, shown).map((r) => resultCard(r, q)).join('')}</div>
      ${results.length > shown ? `<p style="text-align:center;margin-top:16px"><button type="button" class="btn btn-outline" data-more="${shown + 60}">Xem thêm (${results.length - shown} kết quả)</button></p>` : ''}`;
    return `
<section class="section" aria-labelledby="results-title">
  <div class="container">
    <div class="results-head">
      <nav class="breadcrumb" aria-label="Đường dẫn" style="margin-bottom:8px"><a href="#/">${icon('home')} Trang chủ</a><span class="sep">›</span><span>Tìm kiếm</span></nav>
      <h1 id="results-title">Kết quả tìm kiếm${q ? ` cho “${esc(q)}”` : ''}</h1>
      ${!loading && q ? `<p class="muted">${results.length.toLocaleString('vi-VN')} kết quả${grade ? ` trong lớp ${grade}` : ' trên toàn trường'}.</p>` : ''}
    </div>
    <div style="max-width:720px;margin-bottom:16px">${CT.components.SearchBox.render({ id: 'results-search', value: q, placeholder: 'Tìm theo tên môn, bài học, chủ đề, tuần, nội dung tích hợp…' })}</div>
    <div class="result-filters" aria-label="Lọc theo lớp">${gradeChips}</div>
    ${body}
  </div>
</section>`;
  }

  CT.components.SearchResults = { render };
})();
