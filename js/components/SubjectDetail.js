/* SubjectDetail: trang A4 kế hoạch dạy học của một môn – đúng khuôn tệp Word (Phụ lục 2 CV 2345),
   kèm thanh công cụ gọn: tìm trong kế hoạch, lọc học kì / tích hợp, in, tải Word. */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  function breadcrumb(grade, subject) {
    return `<nav class="breadcrumb" aria-label="Đường dẫn">
      <a href="#/">${icon('home')} Trang chủ</a><span class="sep">›</span>
      <a href="${CT.router.build.home(grade)}#mon-hoc" data-action="back">Lớp ${grade}</a><span class="sep">›</span>
      <span>${esc(subject.name)}</span></nav>`;
  }

  function actions(grade, subject, cur, cat) {
    const { fileSize } = CT.store;
    const att = (cur && cur.attachment) || (cat && cat.attachment) || null;
    const gAtt = CT.store.data.gradeAttachments[String(grade)] || null;
    return `<div class="doc-actions">
      ${att ? `<a class="btn btn-primary btn-sm" href="${encodeURI(att.file)}" download="${esc(att.name)}" title="${esc(att.name)}">${icon('download')} Tải Word (${fileSize(att.size)})</a>` : ''}
      ${gAtt ? `<a class="btn btn-outline btn-sm" href="${encodeURI(gAtt.file)}" download="${esc(gAtt.name)}" title="${esc(gAtt.name)}">${icon('download')} Cả khối ${grade}</a>` : ''}
      ${cur ? `<button type="button" class="btn btn-outline btn-sm" data-action="print">${icon('file')} In</button>` : ''}
    </div>`;
  }

  function toolbar(state, cur) {
    const groups = CT.store.data.integrations.groups.filter((g) => cur.lessons.some((l) => l.integrations.some((i) => CT.store.integrationInfo(i.code).groupId === g.id)));
    const seg = (v, label) => `<button type="button" data-semester="${v}" aria-pressed="${String(state.semester) === String(v) ? 'true' : 'false'}">${label}</button>`;
    return `
<div class="plan-toolbar" role="region" aria-label="Công cụ tra cứu">
  <div class="field">
    <span class="search-icon">${icon('search')}</span>
    <label class="visually-hidden" for="plan-search">Tìm trong kế hoạch</label>
    <input class="input" id="plan-search" type="search" placeholder="Tìm trong kế hoạch: tuần 5, tên bài, nội dung…" value="${esc(state.query)}" autocomplete="off">
  </div>
  <div class="segmented" role="group" aria-label="Lọc học kì">${seg('all', 'Cả năm')}${seg(1, 'Học kì I')}${seg(2, 'Học kì II')}</div>
  ${groups.length ? `<label class="visually-hidden" for="plan-integration">Lọc nội dung tích hợp</label>
  <select class="input" id="plan-integration">
    <option value="">Tất cả nội dung tích hợp</option>
    ${groups.map((g) => `<option value="${esc(g.id)}"${state.integration === g.id ? ' selected' : ''}>${esc(g.label)}</option>`).join('')}
  </select>` : ''}
</div>`;
  }

  /** Đoạn văn trong tệp Word -> HTML */
  function para(b) {
    const cls = `p-${b.align || 'left'}${b.bold ? ' p-bold' : ''}${b.italic ? ' p-italic' : ''}`;
    return `<p class="${cls}">${esc(b.text)}</p>`;
  }

  function statusLine(cur, cat) {
    if (!cur) return '';
    const c = cur.status;
    const pill = CT.components.SubjectCard.statusPill(cat || cur);
    let text = '';
    if (c === 'reviewed') text = cur.statusLabel || 'Đã rà soát.';
    else if (c === 'draft') text = cur.statusLabel || 'Bản nháp, chờ xác nhận.';
    else if (c === 'sample') text = 'Dữ liệu minh họa, chưa phải kế hoạch chính thức.';
    return `<div class="doc-status">${pill}<span>${esc(text)}</span></div>`;
  }

  /** Trang A4: đầu trang, mục I–III, bảng, quy ước mã, ghi chú, mục IV, chữ kí */
  function sheet(grade, subject, cur, state) {
    const d = cur.document || { before: [], after: [], legend: [], signature: [] };
    const before = (d.before || []).map(para).join('');
    const legend = (d.legend || []).length ? `
      <table class="legend-table"><colgroup><col class="c-code"><col class="c-domain"><col></colgroup><thead><tr><th>Mã</th><th>Miền năng lực / nội dung</th><th>Ý nghĩa khi đưa vào KHDH/KHBD</th></tr></thead>
      <tbody>${d.legend.map((r) => `<tr><td>${CT.components.IntegrationBadge.render(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table>` : '';
    let foot = '';
    let legendDone = false;
    for (const b of (d.after || [])) {
      if (b.table) continue;
      foot += para(b);
      if (!legendDone && /QUY ƯỚC/i.test(b.text)) { foot += legend; legendDone = true; }
    }
    if (!legendDone) foot += legend;
    const sigCls = (i) => (i === 0 ? 'p-italic' : i === 1 ? 'p-bold' : i === 2 ? 'p-italic' : 'p-bold sig-name');
    const sig = (d.signature || []).length === 2 ? `
      <div class="signature">
        <div>${d.signature[0].filter(Boolean).map((l, i) => `<p class="${i === 0 ? 'p-bold' : 'p-italic'}">${esc(l)}</p>`).join('')}</div>
        <div>${d.signature[1].filter(Boolean).map((l, i) => `<p class="${sigCls(i)}">${esc(l)}</p>`).join('')}</div>
      </div>` : '';
    return `
<div class="sheet-wrap"><article class="sheet" id="sheet" aria-label="Kế hoạch dạy học ${esc(subject.name)} lớp ${grade}">
  <div class="sheet-head">${before}</div>
  <div id="plan-table">${CT.components.CurriculumTable.render(cur, state)}</div>
  <div class="sheet-foot">${foot}${sig}</div>
</article></div>`;
  }

  function render({ grade, subject, cur, cat, state, loading = false }) {
    const s = CT.store.data.school;
    let body = '';
    if (loading) body = `<div class="sheet-wrap"><article class="sheet sheet-loading" aria-busy="true"><div class="empty">${icon('clock')}<h3>Đang tải kế hoạch dạy học…</h3></div></article></div>`;
    else if (cur) body = toolbar(state, cur) + sheet(grade, subject, cur, state);
    else body = `<div class="sheet-wrap"><article class="sheet"><div class="empty">${icon('alert')}<h3>Đang cập nhật</h3><p>Kế hoạch dạy học môn ${esc(subject.name)} lớp ${grade} chưa được nhập vào hệ thống.</p></div></article></div>`;
    return `
<section class="section doc-section" aria-labelledby="doc-title">
  <div class="container">
    <div class="doc-top">
      <div>
        ${breadcrumb(grade, subject)}
        <h1 id="doc-title" class="doc-title"><span class="subject-icon tone-${esc(subject.tone || 'navy')}" aria-hidden="true">${icon(subject.icon)}</span><span>Kế hoạch dạy học môn ${esc(subject.name)} lớp ${grade} <span class="muted">· ${esc(s.schoolYearLabel)}</span></span></h1>
        ${statusLine(cur, cat)}
      </div>
      ${actions(grade, subject, cur, cat)}
    </div>
    ${body}
  </div>
</section>`;
  }

  CT.components.SubjectDetail = { render };
})();
