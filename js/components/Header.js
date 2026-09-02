/* Header: biểu tượng/logo, tên trường, tên website, năm học, ô tìm kiếm nhanh (máy tính) */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  function render() {
    const s = CT.store.data.school;
    const logo = s.logo ? `<img src="${esc(s.logo)}" alt="Logo ${esc(s.name)}">` : icon('book-open');
    return `
<header class="site-header" role="banner">
  <div class="container">
    <a class="brand" href="#/" data-action="home" aria-label="Về trang chủ">
      <span class="brand-logo" aria-hidden="true">${logo}</span>
      <span class="brand-text">
        <span class="brand-school">${esc(s.nameUpper || s.name)}</span>
        <span class="brand-title">${esc(s.siteTitle)}</span>
      </span>
    </a>
    <div class="header-right">
      <div class="header-search">${CT.components.SearchBox.render({ id: 'header-search', compact: true, placeholder: 'Tìm nhanh bài học, môn, tuần…' })}</div>
      <span class="year-pill">${esc(s.schoolYearLabel)}</span>
      <a class="icon-btn" href="#/tim" data-action="open-search" aria-label="Tìm kiếm" title="Tìm kiếm">${icon('search')}</a>
    </div>
  </div>
</header>`;
  }

  CT.components.Header = { render };
})();
