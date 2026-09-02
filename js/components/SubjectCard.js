/* SubjectCard: ô môn học trên bản đồ môn – biểu tượng, tên, thời lượng, nút xem trang A4 và nút tải Word */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  /** Nhãn trạng thái dữ liệu của một KHDH */
  function statusPill(cat) {
    if (!cat) return `<span class="pill pill-warn">Đang cập nhật</span>`;
    if (cat.status === 'official') return `<span class="pill pill-ok">Chính thức</span>`;
    if (cat.status === 'reviewed') return `<span class="pill pill-ok" title="${esc(cat.statusLabel || '')}">Đã rà soát</span>`;
    if (cat.status === 'reference') return `<span class="pill pill-info" title="${esc(cat.statusLabel || '')}">Tham khảo</span>`;
    if (cat.status === 'sample') return `<span class="pill pill-warn">Dữ liệu minh họa</span>`;
    return `<span class="pill pill-info" title="${esc(cat.statusLabel || '')}">Chờ xác nhận</span>`;
  }

  function render(s, grade) {
    const cat = s.catalog;
    const href = CT.router.build.subject(grade, s.id);
    const meta = cat
      ? `<b>${cat.summary.totalPeriods}</b> tiết · ${cat.summary.weeks} tuần`
      : `<span class="muted">Chưa có kế hoạch</span>`;
    const dl = cat && cat.attachment
      ? `<a class="btn btn-outline btn-sm" href="${encodeURI(cat.attachment.file)}" download="${esc(cat.attachment.name)}" title="Tải ${esc(cat.attachment.name)} (${CT.store.fileSize(cat.attachment.size)})" aria-label="Tải bản Word KHDH ${esc(s.name)} lớp ${grade}">${icon('download')} Word</a>`
      : '';
    return `
<article class="subject-card${cat ? '' : ' is-empty'}" data-subject="${esc(s.id)}">
  <a class="subject-main" href="${href}" aria-label="${esc(s.name)} lớp ${grade} – xem kế hoạch dạy học">
    <span class="subject-icon tone-${esc(s.tone || 'navy')}" aria-hidden="true">${icon(s.icon)}</span>
    <span class="subject-body">
      <span class="subject-name">${esc(s.name)}${s.subtitle ? `<small>(${esc(s.subtitle)})</small>` : ''}</span>
      <span class="subject-meta">${meta}</span>
    </span>
  </a>
  <span class="subject-actions">
    ${cat ? `<a class="btn btn-view btn-sm" href="${href}">${icon('file')} Xem kế hoạch</a>` : statusPill(cat)}
    ${dl}
  </span>
</article>`;
  }

  CT.components.SubjectCard = { render, statusPill };
})();
