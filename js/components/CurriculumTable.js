/* CurriculumTable: bảng kế hoạch dạy học đúng khuôn Phụ lục 2 CV 2345 (6 cột, gộp ô tuần và chủ đề như bản Word).
   Máy tính/in: bảng; điện thoại, máy tính bảng: thẻ theo tuần. Lọc theo học kì, nhóm tích hợp, từ khoá. */
(function () {
  const CT = window.CT;
  const { esc } = CT.lib.dom;
  const { normalize, highlight } = CT.lib.text;
  const Badge = CT.components.IntegrationBadge;
  const icon = CT.lib.icon;

  const SEM_NAME = { 1: 'HỌC KÌ I', 2: 'HỌC KÌ II' };

  function hasWord(hay, t) {
    let i = hay.indexOf(t);
    while (i !== -1) { if (i === 0 || !/[a-z0-9]/.test(hay[i - 1])) return true; i = hay.indexOf(t, i + 1); }
    return false;
  }

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
      return q.split(' ').every((t) => hasWord(hay, t));
    });
  }

  /** Gộp bài học thành học kì -> tuần */
  function group(lessons) {
    const sems = new Map();
    for (const l of lessons) {
      const s = sems.get(l.semester) || { semester: l.semester, weeks: new Map() };
      sems.set(l.semester, s);
      const w = s.weeks.get(l.week) || { week: l.week, lessons: [], periods: 0 };
      w.lessons.push(l); w.periods += l.periods || 0;
      s.weeks.set(l.week, w);
    }
    return Array.from(sems.values()).sort((a, b) => a.semester - b.semester)
      .map((s) => ({ ...s, weeks: Array.from(s.weeks.values()).sort((a, b) => (a.week || 0) - (b.week || 0)) }));
  }

  const txt = (v, q) => (v ? highlight(v, q) : '');

  /** Ô "Nội dung điều chỉnh, bổ sung": phần điều chỉnh tự do, rồi các nhãn tích hợp + nội dung */
  function adjustCell(l, q) {
    const parts = [];
    if (l.adjustments) parts.push(`<div class="adj-text">${txt(l.adjustments, q)}</div>`);
    for (const it of l.integrations) {
      parts.push(`<div class="adj-item">${Badge.render(it.code)} <span>${it.level ? `<i class="level">(${esc(it.level)})</i> ` : ''}${txt(it.text, q)}</span></div>`);
    }
    return parts.join('');
  }

  function periodCell(l) {
    if (!l.periodLabel) return '';
    const m = l.periodLabel.match(/^(Tiết\s*[\d–\-+ ]+)\s*(\(.*\))?$/);
    if (!m) return esc(l.periodLabel);
    return `${esc(m[1].trim())}${m[2] ? `<br><span class="muted">${esc(m[2])}</span>` : ''}`;
  }

  /** Bảng đúng khuôn Word: ô Tuần gộp theo tuần, ô Chủ đề gộp theo các dòng liên tiếp cùng chủ đề */
  function tableRows(groups, { query, target }) {
    let html = '';
    for (const s of groups) {
      html += `<tr class="sem-row"><td colspan="6">${SEM_NAME[s.semester] || 'HỌC KÌ ' + s.semester}</td></tr>`;
      for (const w of s.weeks) {
        const n = w.lessons.length;
        w.lessons.forEach((l, i) => {
          const prevSame = i > 0 && w.lessons[i - 1].theme === l.theme;
          let span = 1;
          if (!prevSame) { while (i + span < n && w.lessons[i + span].theme === l.theme) span++; }
          html += `<tr class="lesson-row${l.id === target ? ' is-target' : ''}" id="row-${esc(l.id)}">
            ${i === 0 ? `<td class="week" rowspan="${n}">${l.week ?? ''}</td>` : ''}
            ${!prevSame ? `<td class="theme" rowspan="${span}">${txt(l.theme, query)}</td>` : ''}
            <td class="title">${txt(l.title, query)}${l.content ? `<div class="content">${txt(l.content, query)}</div>` : ''}</td>
            <td class="period">${periodCell(l)}</td>
            <td class="adjust">${adjustCell(l, query)}</td>
            <td class="note">${txt(l.note, query)}</td>
          </tr>`;
        });
      }
    }
    return html;
  }

  function cardBlocks(groups, { query, target }) {
    let html = '';
    for (const s of groups) {
      html += `<div class="sem-head">${SEM_NAME[s.semester] || 'HỌC KÌ ' + s.semester}</div>`;
      for (const w of s.weeks) {
        html += `<div class="week-block"><div class="week-head"><b>Tuần ${w.week ?? '—'}</b><span>${w.lessons.length} bài, nội dung · ${w.periods} tiết</span></div>`;
        for (const l of w.lessons) {
          const adj = adjustCell(l, query);
          html += `<article class="lesson-card${l.id === target ? ' is-target' : ''}" id="card-${esc(l.id)}">
            <div class="lc-head"><div><div class="lc-title">${txt(l.title, query)}</div>${l.theme ? `<div class="lc-theme">${txt(l.theme, query)}</div>` : ''}</div><div class="lc-period">${periodCell(l)}</div></div>
            ${l.content ? `<div class="lc-row"><span class="lc-label">Nội dung dạy học</span><div>${txt(l.content, query)}</div></div>` : ''}
            ${adj ? `<div class="lc-row"><span class="lc-label">Điều chỉnh, bổ sung · tích hợp</span><div>${adj}</div></div>` : ''}
            ${l.note ? `<div class="lc-row"><span class="lc-label">Ghi chú</span><div>${txt(l.note, query)}</div></div>` : ''}
          </article>`;
        }
        html += `</div>`;
      }
    }
    return html;
  }

  function render(cur, opts) {
    const { semester = 'all', integration = '', query = '' } = opts;
    const target = opts.target ?? opts.lesson ?? null;
    const lessons = filterLessons(cur.lessons, { semester, integration, query });
    const groups = group(lessons);
    const filtered = lessons.length !== cur.lessons.length;
    const periods = lessons.reduce((n, l) => n + (l.periods || 0), 0);
    const note = filtered ? `<div class="plan-filter-note">${icon('filter')} Đang lọc: hiển thị <b>${lessons.length}</b>/${cur.lessons.length} bài, nội dung (${periods} tiết)${query ? ` · từ khoá “${esc(query)}”` : ''}. <button type="button" class="link" data-clear-filters>Bỏ lọc</button></div>` : '';
    if (!lessons.length) {
      return note + `<div class="empty">${icon('search')}<h3>Không có nội dung phù hợp</h3><p>Hãy thử từ khoá khác hoặc bỏ bớt bộ lọc.</p></div>`;
    }
    const w = (cur.document && cur.document.columnWidthsMm && cur.document.columnWidthsMm.length === 6) ? cur.document.columnWidthsMm : [15, 44, 77, 26, 74, 18];
    const total = w.reduce((a, b) => a + (b || 0), 0);
    const pct = (mm) => ((mm || 0) / total * 100).toFixed(2) + '%';
    const o = { query, target };
    return note + `
<div class="plan-table-wrap">
  <table class="plan-table">
    <colgroup>${w.map((mm) => `<col style="width:${pct(mm)}">`).join('')}</colgroup>
    <thead>
      <tr><th rowspan="2">Tuần, tháng</th><th colspan="3">Chương trình và sách giáo khoa</th><th rowspan="2">Nội dung điều chỉnh, bổ sung (nếu có)<span class="th-note">(Những điều chỉnh về nội dung, thời lượng, thiết bị dạy học và học liệu tham khảo; xây dựng chủ đề học tập, bổ sung tích hợp liên môn; thời gian và hình thức tổ chức…)</span></th><th rowspan="2">Ghi chú</th></tr>
      <tr><th>Chủ đề/ Mạch nội dung</th><th>Tên bài học</th><th>Tiết học/ thời lượng</th></tr>
    </thead>
    <tbody>${tableRows(groups, o)}</tbody>
  </table>
</div>
<div class="plan-cards">${cardBlocks(groups, o)}</div>`;
  }

  CT.components.CurriculumTable = { render, filterLessons, group };
})();
