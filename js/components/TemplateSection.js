/* TemplateSection: khu "Mẫu biểu trống" – chỉ hiện khi data/school.json có mục "templates".
   Bản nội bộ của trường không khai báo mục này nên khu vực này không xuất hiện. */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  function card(t) {
    const size = t.size ? ` · ${CT.store.fileSize(t.size)}` : '';
    return `
<article class="template-card">
  <span class="subject-icon tone-${esc(t.tone || 'navy')}" aria-hidden="true">${icon(t.icon || 'file')}</span>
  <div class="template-body">
    <h3 class="template-name">${esc(t.name)}</h3>
    <p class="template-desc">${esc(t.desc || '')}</p>
  </div>
  <a class="btn btn-outline btn-sm" href="${encodeURI(t.file)}" download="${esc(t.fileName || '')}" aria-label="Tải ${esc(t.name)}">${icon('download')} Tải Word${size}</a>
</article>`;
  }

  function render() {
    const t = CT.store.data.school.templates;
    if (!t || !(t.items || []).length) return '';
    return `
<section class="section template-section" id="mau-bieu" aria-labelledby="template-title">
  <div class="container">
    <div class="section-head">
      <div>
        <h2 id="template-title">${esc(t.title || 'Mẫu biểu trống')}</h2>
        <p>${esc(t.intro || '')}</p>
      </div>
    </div>
    <div class="template-grid">${t.items.map(card).join('')}</div>
  </div>
</section>`;
  }

  CT.components.TemplateSection = { render };
})();
