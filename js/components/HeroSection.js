/* HeroSection: tiêu đề chính, năm học, dòng giới thiệu, ô tìm kiếm và thẻ tên trường */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;

  /** Dòng giới thiệu; nếu school.json có "introLink" thì gắn liên kết vào cụm chữ tương ứng */
  function intro(s) {
    const html = esc(s.intro || '');
    const L = s.introLink;
    if (!L || !L.url || !L.text) return html;
    const key = esc(L.text);
    if (!html.includes(key)) return html;
    const tail = `<span class="link-url">${L.label ? ` (${esc(L.label)})` : ''}${CT.lib.icon('external')}</span>`;
    const a = `<a class="intro-link" href="${esc(L.url)}" target="_blank" rel="noopener"`
      + ` title="${esc(L.title || 'Mở trang ' + L.text)}">${key}${tail}</a>`;
    return html.replace(key, () => a);
  }

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
        <h1 class="hero-title" id="hero-title">${esc(s.siteTitleUpper).replace(/,\s+/g, ',<br>')}<span class="year">${esc(s.schoolYearLabelUpper)}</span></h1>
        <p class="hero-intro">${intro(s)}</p>
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
