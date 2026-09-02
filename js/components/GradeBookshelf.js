/* GradeBookshelf: giá sách 5 khối lớp (lưới trên máy tính, vuốt ngang trên điện thoại) */
(function () {
  const CT = window.CT;

  function render({ selected } = {}) {
    const cards = CT.store.data.grades.map((g) => CT.components.GradeCard.render(g, { selected: g.grade === selected })).join('');
    return `
<section class="section" id="khoi-lop" aria-labelledby="shelf-title">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow">Bước 1</span>
        <h2 id="shelf-title">Chọn khối lớp</h2>
      </div>
      <p>Bấm vào một khối lớp để xem danh sách môn học và kế hoạch dạy học tương ứng.</p>
    </div>
    <div class="shelf" role="group" aria-label="Các khối lớp">${cards}</div>
  </div>
</section>`;
  }

  CT.components.GradeBookshelf = { render };
})();
