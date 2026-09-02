/* Header: logo + tên trường, ô tìm kiếm nhanh (máy tính), nút tìm kiếm (điện thoại) */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  function render() {
    const s = CT.store.data.school;
    const logo = s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.logoAlt || 'Logo ' + s.name)}" width="44" height="44">` : icon('book-open');
    return `
<header class="site-header" role="banner">
  <div class="container">
    <a class="brand" href="#/" data-action="home" aria-label="Về trang chủ">
      <span class="brand-logo${s.logo ? ' has-img' : ''}" aria-hidden="true">${logo}</span>
      <span class="brand-text">
        <span class="brand-school">${esc(s.nameUpper || s.name)}</span>
        <span class="brand-sub">${esc(s.authority || '')}</span>
      </span>
    </a>
    <div class="header-right">
      <div class="header-search">${CT.components.SearchBox.render({ id: 'header-search', compact: true, placeholder: 'Tìm bài học, môn, tuần…' })}</div>
      <a class="icon-btn" href="#/tim" data-action="open-search" aria-label="Tìm kiếm" title="Tìm kiếm">${icon('search')}</a>
    </div>
  </div>
</header>`;
  }

  CT.components.Header = { render };
})();
