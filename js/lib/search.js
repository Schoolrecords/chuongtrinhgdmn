/* Tìm kiếm toàn trường: theo tên môn, tên bài, chủ đề, tuần, nội dung tích hợp (không phân biệt dấu) */
(function () {
  const CT = (window.CT = window.CT || { lib: {}, components: {} });
  const { normalize, tokens } = CT.lib.text;

  let prepared = null;

  function prepare(index) {
    const { subjectById, integrationInfo } = CT.store;
    const rows = index.rows || []; const subjectIds = index.subjects || []; const themes = index.themes || [];
    prepared = rows.map((r) => {
      const [grade, subjIdx, semester, week, id, title, themeIdx, codes] = r;
      const subjectId = subjectIds[subjIdx] || String(subjIdx);
      const theme = themes[themeIdx] || '';
      const subject = subjectById[subjectId];
      const integ = codes ? codes.split(' ').filter(Boolean) : [];
      const integText = integ.map((c) => { const i = integrationInfo(c); return `${c} ${i.short} ${i.groupLabel}`; }).join(' ');
      return {
        grade, subjectId, semester, week, id, title, theme, integ,
        subjectName: subject ? subject.name : subjectId,
        nTitle: normalize(title), nTheme: normalize(theme),
        nSubject: normalize(subject ? subject.name + ' ' + (subject.subtitle || '') : subjectId),
        nInteg: normalize(integText),
        nWeek: `tuan ${week}`,
      };
    });
    return prepared;
  }

  /**
   * search("tuần 3 tiếng việt", {grade}) -> [{...row, score}]
   * Hiểu các mẫu: "tuần 5", "lớp 2", tên môn, từ khoá tên bài/chủ đề, mã hoặc tên nội dung tích hợp.
   */
  function search(query, { grade = null, limit = 200 } = {}) {
    if (!prepared) return [];
    const q = normalize(query);
    if (!q) return [];
    let toks = tokens(q);
    let week = null; let gradeQ = grade;
    const wm = q.match(/\btuan\s*(\d{1,2})\b/); if (wm) { week = parseInt(wm[1], 10); toks = toks.filter((t) => t !== 'tuan' && t !== wm[1]); }
    const gm = q.match(/\blop\s*([1-5])\b/); if (gm) { gradeQ = parseInt(gm[1], 10); toks = toks.filter((t) => t !== 'lop' && t !== gm[1]); }
    const hk = q.match(/\b(?:hoc ki|hk)\s*(1|2|i|ii)\b/);
    const semQ = hk ? ({ 1: 1, 2: 2, i: 1, ii: 2 })[hk[1]] : null;
    if (hk) toks = toks.filter((t) => !['hoc', 'ki', 'hk', '1', '2', 'i', 'ii'].includes(t));

    const out = [];
    for (const r of prepared) {
      if (gradeQ && r.grade !== gradeQ) continue;
      if (week && r.week !== week) continue;
      if (semQ && r.semester !== semQ) continue;
      let score = 0;
      if (!toks.length) { score = 1; }
      else {
        let all = true;
        for (const t of toks) {
          let s = 0;
          if (r.nTitle.includes(t)) s += r.nTitle.startsWith(t) ? 6 : 4;
          if (r.nTheme.includes(t)) s += 2;
          if (r.nSubject.includes(t)) s += 3;
          if (r.nInteg.includes(t)) s += 2;
          if (!s) { all = false; break; }
          score += s;
        }
        if (!all) continue;
        // Cụm từ đầy đủ khớp trong tên bài -> ưu tiên cao
        const phrase = toks.join(' ');
        if (toks.length > 1 && r.nTitle.includes(phrase)) score += 8;
      }
      out.push({ ...r, score });
      if (out.length > 5000) break;
    }
    out.sort((a, b) => b.score - a.score || a.grade - b.grade || a.week - b.week);
    return out.slice(0, limit);
  }

  CT.search = { prepare, search, isReady: () => !!prepared };
})();
