/* SubjectGrid: bản đồ phẳng các môn học của khối lớp đã chọn */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  function gradeDownload(grade) {
    const a = CT.store.data.gradeAttachments[String(grade)];
    if (!a) return '';
    const x = (CT.store.data.gradeAttachmentsXlsx || {})[String(grade)];   /* 8/9/2026: Excel cả khối, mỗi môn một sheet */
    const nut = (att, nhan, tip) => `<a class="btn btn-outline btn-sm" href="${encodeURI(att.file)}" download="${esc(att.name)}" title="${esc(att.name)}${tip}">${icon('download')} ${nhan} (${CT.store.fileSize(att.size)})</a>`;
    return `<div class="grade-downloads">${nut(a, `Cả khối ${grade} · Word`, '')}${x ? nut(x, `Cả khối ${grade} · Excel`, ' — mỗi môn một sheet, nhập lại được vào app Bút Xanh') : ''}</div>`;
  }

  function render({ grade }) {
    const g = CT.store.gradeByNo[grade];
    if (!g) {
      return `<section class="section subject-section" id="mon-hoc"><div class="container"><div class="card empty">${icon('layers')}<h3>Hãy chọn một khối lớp</h3><p>Danh sách môn học sẽ hiển thị tại đây.</p></div></div></section>`;
    }
    const subjects = CT.store.subjectsOfGrade(grade);
    const withData = subjects.filter((s) => s.catalog).length;
    const reviewed = subjects.filter((s) => s.catalog && (s.catalog.status === 'reviewed' || s.catalog.status === 'official')).length;
    const cards = subjects.map((s) => CT.components.SubjectCard.render(s, grade)).join('');
    return `
<section class="section subject-section" id="mon-hoc" aria-labelledby="subjects-title" aria-live="polite">
  <div class="container">
    <div class="section-head">
      <div>
        <h2 id="subjects-title">Các môn học ${esc(g.short.toLowerCase())}</h2>
        <p>${subjects.length} môn học và hoạt động giáo dục · ${withData} kế hoạch dạy học${reviewed ? ` · ${reviewed} đã rà soát` : ''}</p>
      </div>
      ${gradeDownload(grade)}
    </div>
    <div class="subject-grid">${cards}</div>
  </div>
</section>`;
  }

  CT.components.SubjectGrid = { render };
})();
