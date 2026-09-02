/* SubjectDetail: trang chi tiết môn học – thông tin chung, tóm tắt tích hợp, thanh công cụ và bảng KHDH */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;
  const Badge = CT.components.IntegrationBadge;

  function breadcrumb(grade, subject) {
    return `<nav class="breadcrumb" aria-label="Đường dẫn">
      <a href="#/">${icon('home')} Trang chủ</a><span class="sep">›</span>
      <a href="${CT.router.build.home(grade)}">Lớp ${grade}</a><span class="sep">›</span>
      <span>${esc(subject.name)}</span></nav>`;
  }

  function statusNotice(cur, cat) {
    const s = CT.store.data.school;
    if (!cur) {
      return `<div class="notice detail-status">${icon('alert')}<div><b>Đang cập nhật.</b> Kế hoạch dạy học của môn này chưa được nhập vào hệ thống. Khi nhà trường bổ sung tệp KHDH, nội dung sẽ hiển thị tại đây.</div></div>`;
    }
    if (cur.status === 'official') return '';
    if (cur.status === 'sample') return `<div class="notice detail-status">${icon('alert')}<div><b>Dữ liệu minh họa.</b> Nội dung dưới đây chỉ để xem trước giao diện, chưa phải kế hoạch chính thức.</div></div>`;
    return `<div class="notice notice-info detail-status">${icon('info')}<div><b>Chờ xác nhận.</b> ${esc(cur.statusLabel || '')}${cur.source?.file ? ` Nguồn: <i>${esc(cur.source.file)}</i>${cur.source.importedAt ? ` (nhập ngày ${esc(cur.source.importedAt.split('-').reverse().join('/'))})` : ''}.` : ''} ${esc(s.dataNote || '')}</div></div>`;
  }

  function integrationSummary(cur) {
    if (!cur) return '';
    const byGroup = new Map();
    for (const l of cur.lessons) for (const i of l.integrations) {
      const info = CT.store.integrationInfo(i.code);
      byGroup.set(info.groupId, (byGroup.get(info.groupId) || 0) + 1);
    }
    if (!byGroup.size) return `<div class="integration-summary"><h3>Nội dung tích hợp, lồng ghép</h3><p class="muted" style="font-size:var(--fs-xs)">Chưa có nội dung tích hợp trong kế hoạch.</p></div>`;
    const groups = CT.store.data.integrations.groups.filter((g) => byGroup.has(g.id));
    const codeOfGroup = (gid) => Object.entries(CT.store.data.integrations.codes).find(([, c]) => c.group === gid)?.[0] || gid;
    return `<div class="integration-summary"><h3>Nội dung tích hợp, lồng ghép</h3>
      <ul>${groups.map((g) => `<li><button type="button" class="badge badge-${esc(g.tone)}" data-integration="${esc(g.id)}" title="Lọc bảng theo: ${esc(g.label)}">${esc(g.label)} <span class="count">· ${byGroup.get(g.id)}</span></button></li>`).join('')}</ul>
      <p class="muted" style="font-size:12px;margin-top:8px">Bấm vào nhãn để lọc bảng bên dưới.</p></div>`;
  }

  function head(grade, subject, cur, cat) {
    const s = CT.store.data.school;
    const sum = cur ? cur.summary : null;
    const w = sum ? `${sum.weeks} tuần${sum.semester1Weeks || sum.semester2Weeks ? `<small>HK I: ${sum.semester1Weeks} · HK II: ${sum.semester2Weeks}</small>` : ''}` : 'Đang cập nhật';
    return `
<div class="detail-head">
  <div>
    <div class="detail-title">
      <span class="subject-icon tone-${esc(subject.tone || 'navy')}" aria-hidden="true">${icon(subject.icon)}</span>
      <div>
        <h1>${esc(subject.name)}${subject.subtitle ? ` <span class="muted" style="font-weight:400;font-size:.7em">(${esc(subject.subtitle)})</span>` : ''}</h1>
        <div class="sub"><span class="pill pill-navy">Lớp ${grade}</span><span class="pill pill-teal">${esc(s.schoolYearLabel)}</span>${CT.components.SubjectCard.statusPill(cat)}</div>
      </div>
    </div>
    <dl class="detail-info">
      <div class="info-item"><dt>Khối lớp</dt><dd>Lớp ${grade}</dd></div>
      <div class="info-item"><dt>Môn học</dt><dd>${esc(subject.name)}</dd></div>
      <div class="info-item"><dt>Năm học</dt><dd>${esc(s.schoolYear.replace('-', '–'))}</dd></div>
      <div class="info-item"><dt>Tổng số tiết</dt><dd>${sum ? `${sum.totalPeriods} tiết<small>${sum.lessons} bài, nội dung</small>` : 'Đang cập nhật'}</dd></div>
      <div class="info-item"><dt>Số tuần thực hiện</dt><dd>${w}</dd></div>
      <div class="info-item"><dt>Tổ chuyên môn phụ trách</dt><dd>${esc(cur?.team || `Tổ chuyên môn khối ${grade}`)}<small>${cur?.teachers ? esc(cur.teachers) : 'Giáo viên: đang cập nhật'}</small></dd></div>
    </dl>
    ${statusNotice(cur, cat)}
  </div>
  <div class="detail-side">${integrationSummary(cur)}</div>
</div>`;
  }

  function toolbar(state, cur) {
    const groups = CT.store.data.integrations.groups.filter((g) => cur.lessons.some((l) => l.integrations.some((i) => CT.store.integrationInfo(i.code).groupId === g.id)));
    const seg = (v, label) => `<button type="button" data-semester="${v}" aria-pressed="${String(state.semester) === String(v) ? 'true' : 'false'}">${label}</button>`;
    return `
<div class="plan-toolbar" role="region" aria-label="Công cụ tra cứu bảng kế hoạch">
  <div class="field">
    <span class="search-icon">${icon('search')}</span>
    <label class="visually-hidden" for="plan-search">Tìm trong kế hoạch</label>
    <input class="input" id="plan-search" type="search" placeholder="Tìm theo tuần (vd: tuần 5), tên bài, nội dung…" value="${esc(state.query)}" autocomplete="off">
  </div>
  <div class="segmented" role="group" aria-label="Lọc học kì">${seg('all', 'Cả năm')}${seg(1, 'Học kì I')}${seg(2, 'Học kì II')}</div>
  <label class="visually-hidden" for="plan-integration">Lọc nội dung tích hợp</label>
  <select class="input" id="plan-integration">
    <option value="">Tất cả nội dung tích hợp</option>
    ${groups.map((g) => `<option value="${esc(g.id)}"${state.integration === g.id ? ' selected' : ''}>${esc(g.label)}</option>`).join('')}
  </select>
  <div class="toolbar-actions">
    <button type="button" class="btn btn-outline btn-sm" data-expand="all">${icon('expand')} Mở rộng</button>
    <button type="button" class="btn btn-outline btn-sm" data-expand="none">${icon('collapse')} Thu gọn</button>
  </div>
</div>`;
  }

  function render({ grade, subject, cur, cat, state, loading = false }) {
    let body = '';
    if (loading) body = `<div class="card empty" aria-busy="true">${icon('clock')}<h3>Đang tải kế hoạch dạy học…</h3></div>`;
    else if (cur) body = toolbar(state, cur) + `<div id="plan-table">${CT.components.CurriculumTable.render(cur, state)}</div>`;
    return `
<section class="section" aria-labelledby="detail-title">
  <div class="container">
    <div class="detail-top">
      ${breadcrumb(grade, subject)}
      <a class="btn btn-outline btn-sm" href="${CT.router.build.home(grade)}#mon-hoc" data-action="back">${icon('arrow-left')} Các môn lớp ${grade}</a>
    </div>
    ${head(grade, subject, cur, cat)}
    ${body}
  </div>
</section>`;
  }

  CT.components.SubjectDetail = { render };
})();
