/* Footer: tên trường, khẩu hiệu, căn cứ pháp lí, ghi chú nguồn dữ liệu */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  function render() {
    const s = CT.store.data.school;
    const gen = window.CT_DATA?.generatedAt ? new Date(window.CT_DATA.generatedAt) : null;
    const genLabel = gen ? gen.toLocaleDateString('vi-VN') : '';
    return `
<footer class="site-footer" role="contentinfo">
  <div class="container">
    <div>
      <div class="footer-brand"><span class="brand-logo" aria-hidden="true">${icon('book-open')}</span><div><b>${esc(s.nameUpper || s.name)}</b><span>${esc(s.siteTitle)} · ${esc(s.schoolYearLabel)}</span></div></div>
      <p class="footer-tagline">${esc(s.footerTagline || '')}</p>
      <p class="footer-note">${esc(s.dataNote || '')}</p>
    </div>
    <div class="footer-col">
      <h4>Căn cứ xây dựng</h4>
      <ul>${(s.legalBasis || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
  </div>
  <div class="footer-bottom"><div class="container"><span>© ${new Date().getFullYear()} ${esc(s.name)}</span>${s.designer ? `<span class="designer">Thiết kế: ${esc(s.designer.name)}${s.designer.phone ? ` – <a href="tel:${esc(s.designer.phone)}">${esc(s.designer.phone)}</a>` : ''}</span>` : ''}<span>${genLabel ? `Dữ liệu cập nhật ngày ${esc(genLabel)}` : ''}</span></div></div>
</footer>`;
  }

  CT.components.Footer = { render };
})();
