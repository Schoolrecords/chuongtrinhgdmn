/* SchoolTag: thẻ tên trường – nền trắng, viền xanh mảnh, chữ navy, một chấm vàng nhỏ */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  function render({ subtitle = '' } = {}) {
    const s = CT.store.data.school;
    return `
<div class="school-tag" role="img" aria-label="${esc(s.name)}">
  <span class="tag-dot" aria-hidden="true"></span>
  <span class="tag-icon" aria-hidden="true">${icon('graduation')}</span>
  <span class="tag-text">${esc(s.nameUpper || s.name)}${subtitle ? `<small>${esc(subtitle)}</small>` : ''}</span>
</div>`;
  }

  CT.components.SchoolTag = { render };
})();
