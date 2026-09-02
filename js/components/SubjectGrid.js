/* SubjectGrid: danh sách môn học của khối lớp đã chọn */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  function render({ grade }) {
    const g = CT.store.gradeByNo[grade];
    if (!g) {
      return `<section class="section subject-section" id="mon-hoc"><div class="container"><div class="card empty">${icon('layers')}<h3>Hãy chọn một khối lớp</h3><p>Danh sách môn học sẽ hiển thị tại đây.</p></div></div></section>`;
    }
    const subjects = CT.store.subjectsOfGrade(grade);
    const withData = subjects.filter((s) => s.catalog).length;
    const cards = subjects.map((s) => CT.components.SubjectCard.render(s, grade)).join('');
    return `
<section class="section subject-section" id="mon-hoc" aria-labelledby="subjects-title" aria-live="polite">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow">Bước 2 · ${esc(g.short)}</span>
        <h2 id="subjects-title">Các môn học ${esc(g.short.toLowerCase())}</h2>
      </div>
      <p><b>${subjects.length}</b> môn học và hoạt động giáo dục · <b>${withData}</b> kế hoạch dạy học đã nhập.</p>
    </div>
    <div class="subject-grid">${cards}</div>
  </div>
</section>`;
  }

  CT.components.SubjectGrid = { render };
})();
