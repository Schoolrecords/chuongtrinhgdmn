/* CurriculumTable: bảng kế hoạch dạy học theo Phụ lục 2 CV 2345, gộp theo tuần, thu gọn/mở rộng,
   lọc học kì, lọc nội dung tích hợp, tìm trong bảng. Máy tính: bảng; điện thoại/máy tính bảng: thẻ. */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const { normalize, highlight } = CT.lib.text;
  const icon = CT.lib.icon;
  const Badge = CT.components.IntegrationBadge;

  const SEM_NAME = { 1: 'Học kì I', 2: 'Học kì II' };

  /** Lọc bài học theo học kì, nhóm tích hợp, từ khoá */
  function filterLessons(lessons, { semester = 'all', integration = '', query = '' } = {}) {
    const q = normalize(query);
    const wm = q.match(/^tuan\s*(\d{1,2})$/);
    return lessons.filter((l) => {
      if (semester !== 'all' && String(l.semester) !== String(semester)) return false;
      if (integration && !l.integrations.some((i) => CT.store.integrationInfo(i.code).groupId === integration)) return false;
      if (!q) return true;
      if (wm) return l.week === parseInt(wm[1], 10);
      const hay = normalize([l.title, l.theme, l.adjustments, l.note, l.content, l.periodLabel,
        ...l.integrations.map((i) => `${i.code} ${CT.store.integrationInfo(i.code).short} ${i.text}`)].join(' | '));
      return q.split(' ').every((t) => hay.includes(t));
    });
  }

  /** Gộp bài học thành học kì -> tuần */
  function group(lessons) {
    const sems = new Map();
    for (const l of lessons) {
      const s = sems.get(l.semester) || { semester: l.semester, weeks: new Map() };
      sems.set(l.semester, s);
      const w = s.weeks.get(l.week) || { week: l.week, lessons: [], periods: 0, integrations: 0 };
      w.lessons.push(l); w.periods += l.periods || 0; w.integrations += l.integrations.length;
      s.weeks.set(l.week, w);
    }
    return Array.from(sems.values()).sort((a, b) => a.semester - b.semester)
      .map((s) => ({ ...s, weeks: Array.from(s.weeks.values()).sort((a, b) => (a.week || 0) - (b.week || 0)) }));
  }

  const dash = '<span class="dash">—</span>';
  const txt = (v, q) => (v ? highlight(v, q) : dash);

  function weekToggle(w, expanded) {
    return `<button type="button" class="week-toggle" data-week="${w.week}" aria-expanded="${expanded ? 'true' : 'false'}" aria-controls="week-${w.week}">
      <span class="caret">${icon('chevron-right')}</span>
      <span>Tuần ${w.week ?? '—'}</span>
      <span class="w-meta"><span><b>${w.lessons.length}</b> bài/nội dung</span><span><b>${w.periods}</b> tiết</span>${w.integrations ? `<span><b>${w.integrations}</b> tích hợp</span>` : ''}</span>
    </button>`;
  }

  function periodCell(l) {
    if (!l.periodLabel) return dash;
    const m = l.periodLabel.match(/^(Tiết\s*[\d–\-+ ]+)\s*(\(.*\))?$/);
    if (!m) return `<b>${esc(l.periodLabel)}</b>`;
    return `<b>${esc(m[1].trim())}</b>${m[2] ? `<span>${esc(m[2])}</span>` : ''}`;
  }

  function tableRows(groups, opts) {
    const { collapsed, query, target } = opts;
    let html = '';
    for (const s of groups) {
      html += `<tr class="sem-row"><td colspan="8">${SEM_NAME[s.semester] || 'Học kì ' + s.semester}</td></tr>`;
      for (const w of s.weeks) {
        const expanded = !collapsed.has(w.week);
        html += `<tr class="week-row"><td colspan="8">${weekToggle(w, expanded)}</td></tr>`;
        for (const l of w.lessons) {
          html += `<tr class="lesson-row${l.id === target ? ' is-target' : ''}" id="row-${esc(l.id)}" data-week="${w.week}"${expanded ? '' : ' hidden'}>
            <td class="week">${l.week ?? '—'}</td>
            <td class="theme">${txt(l.theme, query)}</td>
            <td class="title">${txt(l.title, query)}</td>
            <td class="content">${txt(l.content, query)}</td>
            <td class="period">${periodCell(l)}</td>
            <td class="adjust">${txt(l.adjustments, query)}</td>
            <td class="integ">${Badge.list(l.integrations, query)}</td>
            <td class="note">${txt(l.note, query)}</td>
          </tr>`;
        }
      }
    }
    return html;
  }

  function cardBlocks(groups, opts) {
    const { collapsed, query, target } = opts;
    let html = '';
    for (const s of groups) {
      html += `<div class="sem-head">${SEM_NAME[s.semester] || 'Học kì ' + s.semester}</div>`;
      for (const w of s.weeks) {
        const expanded = !collapsed.has(w.week);
        html += `<div class="week-block">${weekToggle(w, expanded)}<div id="week-${w.week}" data-week-body="${w.week}"${expanded ? '' : ' hidden'}>`;
        for (const l of w.lessons) {
          html += `<article class="lesson-card${l.id === target ? ' is-target' : ''}" id="card-${esc(l.id)}">
            <div class="lc-head"><div><div class="lc-title">${txt(l.title, query)}</div>${l.theme ? `<div class="lc-theme">${txt(l.theme, query)}</div>` : ''}</div><div class="lc-period">${periodCell(l)}</div></div>
            <dl>
              ${l.content ? `<div><dt>Nội dung dạy học</dt><dd>${txt(l.content, query)}</dd></div>` : ''}
              ${l.adjustments ? `<div><dt>Điều chỉnh, bổ sung</dt><dd>${txt(l.adjustments, query)}</dd></div>` : ''}
              ${l.integrations.length ? `<div><dt>Tích hợp, lồng ghép</dt><dd>${Badge.list(l.integrations, query)}</dd></div>` : ''}
              ${l.note ? `<div><dt>Ghi chú</dt><dd>${txt(l.note, query)}</dd></div>` : ''}
            </dl>
          </article>`;
        }
        html += `</div></div>`;
      }
    }
    return html;
  }

  function render(cur, opts) {
    const { semester = 'all', integration = '', query = '', collapsed = new Set() } = opts;
    const target = opts.target ?? opts.lesson ?? null;
    const lessons = filterLessons(cur.lessons, { semester, integration, query });
    const groups = group(lessons);
    const periods = lessons.reduce((n, l) => n + (l.periods || 0), 0);
    const integ = lessons.reduce((n, l) => n + l.integrations.length, 0);
    const summary = `<div class="plan-summary" aria-live="polite">
      <span>Hiển thị <b>${lessons.length}</b>/${cur.lessons.length} bài, nội dung</span>
      <span><b>${periods}</b> tiết</span>
      <span><b>${groups.reduce((n, s) => n + s.weeks.length, 0)}</b> tuần</span>
      <span><b>${integ}</b> nội dung tích hợp</span>
      ${query ? `<span>Từ khoá: <b>“${esc(query)}”</b></span>` : ''}
    </div>`;
    if (!lessons.length) {
      return summary + `<div class="card empty">${icon('search')}<h3>Không có nội dung phù hợp</h3><p>Hãy thử từ khoá khác hoặc bỏ bớt bộ lọc.</p></div>`;
    }
    const o = { collapsed, query, target };
    return summary + `
<div class="plan">
  <div class="plan-scroll">
    <table class="plan-table">
      <colgroup><col class="c-week"><col class="c-theme"><col class="c-title"><col class="c-content"><col class="c-period"><col class="c-adjust"><col class="c-integ"><col class="c-note"></colgroup>
      <thead>
        <tr class="group"><th rowspan="2" scope="col">Tuần, tháng</th><th colspan="4" scope="colgroup">Chương trình và sách giáo khoa</th><th rowspan="2" scope="col">Nội dung điều chỉnh, bổ sung</th><th rowspan="2" scope="col">Nội dung tích hợp, lồng ghép</th><th rowspan="2" scope="col">Ghi chú</th></tr>
        <tr><th scope="col">Chủ đề / Mạch nội dung</th><th scope="col">Tên bài học</th><th scope="col">Nội dung dạy học</th><th scope="col">Tiết học / Thời lượng</th></tr>
      </thead>
      <tbody>${tableRows(groups, o)}</tbody>
    </table>
  </div>
  <div class="plan-cards">${cardBlocks(groups, o)}</div>
</div>`;
  }

  CT.components.CurriculumTable = { render, filterLessons, group };
})();
