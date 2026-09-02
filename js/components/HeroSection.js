/* HeroSection: tiêu đề chính, năm học, dòng giới thiệu, ô tìm kiếm và thẻ tên trường */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;

  function render() {
    const s = CT.store.data.school;
    return `
<section class="hero" aria-labelledby="hero-title">
  <div class="container">
    <div class="hero-grid">
      <div>
        <h1 class="hero-title" id="hero-title">${esc(s.siteTitleUpper)}<span class="year">${esc(s.schoolYearLabelUpper)}</span></h1>
        <p class="hero-intro">${esc(s.intro)}</p>
        <div class="hero-search">${CT.components.SearchBox.render({ id: 'hero-search', placeholder: 'Tìm theo tên môn, tên bài học, chủ đề, tuần, nội dung tích hợp…', hints: true })}</div>
      </div>
      <div class="hero-aside">${CT.components.SchoolTag.render({ subtitle: s.authority || '' })}${s.internalNotice ? `<div class="internal-stamp" role="note">${esc(s.internalNotice)}</div>` : ''}</div>
    </div>
  </div>
</section>`;
  }

  CT.components.HeroSection = { render };
})();
