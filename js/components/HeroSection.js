/* HeroSection: tiêu đề chính, dòng giới thiệu, ô tìm kiếm, thẻ tên trường và vài con số tổng quan */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  function stats() {
    const { data } = CT.store;
    const items = Object.values(data.catalog);
    const lessons = items.reduce((n, c) => n + (c.summary?.lessons || 0), 0);
    return { grades: data.grades.length, plans: items.length, lessons };
  }

  function render() {
    const s = CT.store.data.school;
    const st = stats();
    return `
<section class="hero" aria-labelledby="hero-title">
  <div class="container">
    <div class="hero-grid">
      <div>
        <span class="hero-eyebrow">${icon('sparkles')} Cổng tra cứu chương trình giáo dục</span>
        <h1 class="hero-title" id="hero-title">${esc(s.siteTitleUpper)}<span class="year">${esc(s.schoolYearLabelUpper)}</span></h1>
        <p class="hero-intro">${esc(s.intro)}</p>
        <div class="hero-search">${CT.components.SearchBox.render({ id: 'hero-search', placeholder: 'Tìm theo tên môn, tên bài học, chủ đề, tuần, nội dung tích hợp…', hints: true })}</div>
      </div>
      <div class="hero-aside">
        ${CT.components.SchoolTag.render({ subtitle: s.authority ? `${s.authority} · ${s.schoolYearLabel}` : s.schoolYearLabel })}
        <div class="hero-stats" aria-label="Số liệu tổng quan">
          <div class="stat"><b>${st.grades}</b><span>khối lớp</span></div>
          <div class="stat"><b>${st.plans}</b><span>kế hoạch môn học</span></div>
          <div class="stat"><b>${st.lessons.toLocaleString('vi-VN')}</b><span>bài học, tiết dạy</span></div>
        </div>
      </div>
    </div>
  </div>
</section>`;
  }

  CT.components.HeroSection = { render };
})();
