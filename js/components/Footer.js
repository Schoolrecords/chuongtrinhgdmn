/* Footer: tên trường, khẩu hiệu, căn cứ pháp lí, ghi chú nguồn dữ liệu */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  /** Liên kết ra trang ngoài ở chân trang – khai báo trong school.json ("footerLink") */
  function link(L) {
    if (!L || !L.url || !L.text) return '';
    return `<p class="footer-link"><a href="${esc(L.url)}" target="_blank" rel="noopener"`
      + ` title="${esc(L.title || 'Mở trang ' + L.text)}">${esc(L.text)}`
      + `${L.label ? `<span class="link-url">${esc(L.label)}</span>` : ''}${icon('external')}</a></p>`;
  }

  function render() {
    const s = CT.store.data.school;
    const gen = window.CT_DATA?.generatedAt ? new Date(window.CT_DATA.generatedAt) : null;
    const genLabel = gen ? gen.toLocaleDateString('vi-VN') : '';
    return `
<footer class="site-footer" role="contentinfo">
  <div class="container">
    <div>
      <div class="footer-brand"><span class="brand-logo${s.logo ? ' has-img' : ''}" aria-hidden="true">${s.logo ? `<img src="${esc(s.logoMark || s.logo)}" alt="" width="40" height="40">` : icon('book-open')}</span><div><b>${esc(s.nameUpper || s.name)}</b><span>${esc(s.footerSub || `${s.siteTitle} · ${s.schoolYearLabel}`)}</span></div></div>
      <p class="footer-tagline">${esc(s.footerTagline || '')}</p>
      <p class="footer-note">${esc(s.dataNote || '')}</p>
      ${link(s.footerLink)}
    </div>
    <div class="footer-col">
      <h4>Căn cứ xây dựng</h4>
      <ul>${(s.legalBasis || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
  </div>
  <div class="footer-bottom"><div class="container"><span>© ${new Date().getFullYear()} ${esc(s.copyright || s.name)}</span>${s.designer ? `<span class="designer">Thiết kế: ${esc(s.designer.name)}${s.designer.phone ? ` – <a href="tel:${esc(s.designer.phone)}">${esc(s.designer.phone)}</a>` : ''}</span>` : ''}<span>${genLabel ? `Dữ liệu cập nhật ngày ${esc(genLabel)}` : ''}</span></div></div>
</footer>`;
  }

  CT.components.Footer = { render };
})();
