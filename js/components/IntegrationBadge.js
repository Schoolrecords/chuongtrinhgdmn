/* IntegrationBadge: nhãn màu nhẹ cho nội dung tích hợp, lồng ghép */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;

  function render(code, { count = null, full = false } = {}) {
    const i = CT.store.integrationInfo(code);
    return `<span class="badge badge-${esc(i.tone)}" title="${esc(i.label)}">${esc(full ? i.label : i.short)}${count !== null ? ` <span class="count">· ${count}</span>` : ''}</span>`;
  }

  /** Danh sách tích hợp của một bài: nhãn + nội dung ngắn */
  function list(items, query = '') {
    if (!items || !items.length) return '<span class="dash">—</span>';
    const { highlight } = CT.lib.text;
    return `<div class="integration-list">${items.map((it) => `
      <div class="integration-item">${render(it.code)}<span class="text">${it.level ? `<span class="level">(${esc(it.level)})</span> ` : ''}${highlight(it.text, query)}</span></div>`).join('')}</div>`;
  }

  CT.components.IntegrationBadge = { render, list };
})();
