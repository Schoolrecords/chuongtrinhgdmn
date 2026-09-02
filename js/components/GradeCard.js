/* GradeCard: một thẻ khối lớp – bìa SGK Tiếng Việt tập một, số lớp, tên, hướng dẫn, mũi tên */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const icon = CT.lib.icon;

  function cover(g) {
    const c = g.cover || {};
    if (!c.src) return `<div class="no-cover">${esc(g.name)}</div>`;
    const img = `<img src="${esc(c.src)}" alt="${esc(c.alt || 'Bìa sách ' + g.name)}" width="480" height="640" loading="lazy" decoding="async"
      onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'no-cover',textContent:${JSON.stringify(g.name)}}))">`;
    return c.webp ? `<picture><source type="image/webp" srcset="${esc(c.webp)}">${img}</picture>` : img;
  }

  function render(g, { selected = false } = {}) {
    return `
<button type="button" class="grade-card${selected ? ' is-selected' : ''}" data-grade="${g.grade}"
        aria-pressed="${selected ? 'true' : 'false'}" aria-label="${esc(g.name)} – xem các môn học">
  <div class="grade-cover">
    ${cover(g)}
    <span class="grade-number" aria-hidden="true">${g.grade}</span>
    <span class="grade-check" aria-hidden="true">${icon('check')}</span>
  </div>
  <div class="grade-body">
    <div>
      <div class="grade-name">${esc(g.name)}</div>
      <div class="grade-hint">Xem các môn học</div>
    </div>
    <span class="grade-arrow" aria-hidden="true">${icon('arrow-right')}</span>
  </div>
</button>`;
  }

  CT.components.GradeCard = { render };
})();
