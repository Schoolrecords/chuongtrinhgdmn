/* HeroSection: tiêu đề chính, năm học, dòng giới thiệu, ô tìm kiếm và thẻ tên trường */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;

  /** Khối "dùng nhanh trong N bước" – chỉ hiện khi school.json có mục "heroSteps" */
  function steps(s) {
    const h = s.heroSteps;
    if (!h || !(h.items || []).length) return '';
    return `<div class="hero-steps">
      <h2>${esc(h.title || '')}</h2>
      <ol>${h.items.map((x) => `<li><b>${esc(x.name)}</b>${x.desc ? `<span>${esc(x.desc)}</span>` : ''}</li>`).join('')}</ol>
    </div>`;
  }

  function render() {
    const s = CT.store.data.school;
    return `
<section class="hero" aria-labelledby="hero-title">
  <div class="container">
    <div class="hero-grid">
      <div>
        <h1 class="hero-title" id="hero-title">${esc(s.siteTitleUpper)}<span class="year">${esc(s.schoolYearLabelUpper)}</span></h1>
        <p class="hero-intro">${esc(s.intro)}</p>
        ${s.disclaimer ? `<p class="hero-note">${esc(s.disclaimer)}</p>` : ''}
        <div class="hero-search">${CT.components.SearchBox.render({ id: 'hero-search', placeholder: 'Tìm theo tên môn, tên bài học, chủ đề, tuần, nội dung tích hợp…', hints: true })}</div>
      </div>
      <div class="hero-aside">${s.heroTag === false ? '' : CT.components.SchoolTag.render({ subtitle: s.authority || '' })}${steps(s)}${s.internalNotice ? `<div class="internal-stamp${s.internalNoticeTone ? ' tone-' + esc(s.internalNoticeTone) : ''}" role="note">${esc(s.internalNotice)}</div>` : ''}</div>
    </div>
  </div>
</section>`;
  }

  CT.components.HeroSection = { render };
})();
