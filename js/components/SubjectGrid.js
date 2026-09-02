/* SubjectGrid: bản đồ phẳng các môn học của khối lớp đã chọn */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  function gradeDownload(grade) {
    const a = CT.store.data.gradeAttachments[String(grade)];
    if (!a) return '';
    return `<a class="btn btn-outline btn-sm" href="${encodeURI(a.file)}" download="${esc(a.name)}" title="${esc(a.name)}">${icon('download')} Tải KHDH cả khối ${grade} (Word · ${CT.store.fileSize(a.size)})</a>`;
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
