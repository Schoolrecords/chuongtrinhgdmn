/* Kho dữ liệu + trạng thái dùng chung. Dữ liệu gốc nằm trong window.CT_DATA (sinh từ data/). */
(function () {
  const CT = (window.CT = window.CT || { lib: {}, components: {} });

  const D = window.CT_DATA || {};
  const data = {
    school: D.school || {},
    grades: D.grades || [],
    subjects: D.subjects || [],
    integrations: D.integrations || { groups: [], codes: {} },
    catalog: D.catalog || {},
  };
  const subjectById = Object.fromEntries(data.subjects.map((s) => [s.id, s]));
  const gradeByNo = Object.fromEntries(data.grades.map((g) => [g.grade, g]));
  const groupById = Object.fromEntries((data.integrations.groups || []).map((g) => [g.id, g]));

  /** Thông tin nhãn tích hợp theo mã ("NLS-KT" -> {label, short, tone, group}) */
  function integrationInfo(code) {
    const c = data.integrations.codes[code];
    const g = c ? groupById[c.group] : null;
    return {
      code,
      label: c ? c.label : code,
      short: c ? c.short : code,
      groupId: c ? c.group : 'khac',
      groupLabel: g ? g.label : 'Nội dung khác',
      tone: g ? g.tone : 'slate',
    };
  }

  /** Danh sách môn của một khối (đúng thứ tự trong grades.json), kèm tóm tắt KHDH nếu có */
  function subjectsOfGrade(grade) {
    const g = gradeByNo[grade];
    if (!g) return [];
    return g.subjects.map((id) => subjectById[id]).filter(Boolean).map((s) => ({
      ...s, catalog: data.catalog[`${grade}/${s.id}`] || null,
    }));
  }

  const state = {
    grade: null, subjectId: null, view: 'home', query: '', semester: 'all', integration: '', lesson: null,
    collapsed: new Set(),
  };
  const listeners = new Set();
  const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const set = (patch) => { Object.assign(state, patch); listeners.forEach((fn) => fn(state)); };

  CT.store = { data, subjectById, gradeByNo, integrationInfo, subjectsOfGrade, state, set, subscribe };
})();
