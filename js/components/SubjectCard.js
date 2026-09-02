/* SubjectCard: thẻ môn học – biểu tượng, tên, mô tả, thời lượng (nếu có dữ liệu), trạng thái, mũi tên */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  /** Nhãn trạng thái dữ liệu của một KHDH */
  function statusPill(cat) {
    if (!cat) return `<span class="pill pill-warn">Đang cập nhật</span>`;
    if (cat.status === 'official') return `<span class="pill pill-ok">Chính thức</span>`;
    if (cat.status === 'sample') return `<span class="pill pill-warn">Dữ liệu minh họa</span>`;
    return `<span class="pill pill-info" title="${esc(cat.statusLabel || '')}">Chờ xác nhận</span>`;
  }

  function render(s, grade) {
    const cat = s.catalog;
    const meta = cat
      ? `<b>${cat.summary.totalPeriods} tiết</b> / năm học · ${cat.summary.weeks} tuần`
      : `<span class="muted">Chưa có kế hoạch dạy học</span>`;
    return `
<a class="subject-card" href="${CT.router.build.subject(grade, s.id)}" data-subject="${esc(s.id)}" aria-label="${esc(s.name)} lớp ${grade} – xem chi tiết">
  <span class="subject-icon tone-${esc(s.tone || 'navy')}" aria-hidden="true">${icon(s.icon)}</span>
  <span class="subject-body">
    <span class="subject-name">${esc(s.name)}${s.subtitle ? `<small>(${esc(s.subtitle)})</small>` : ''}</span>
    <span class="subject-desc">${esc(s.description || '')}</span>
    <span class="subject-meta">${meta} ${statusPill(cat)}</span>
  </span>
  <span class="subject-arrow" aria-hidden="true">${icon('arrow-right')}</span>
</a>`;
  }

  CT.components.SubjectCard = { render, statusPill };
})();
