/* Ứng dụng: khởi tạo bố cục, định tuyến, xử lý sự kiện chung */
(function () {
  const CT = window.CT;
  const { $, $$, on, scrollToEl, debounce } = CT.lib.dom;
  const { state, set } = CT.store;
  const C = CT.components;

  const app = document.getElementById('app');
  let main;
  let currentCur = null; // KHDH đang mở
  let searchShown = 60;

  function layout() {
    app.innerHTML = `<a class="skip-link" href="#main">Bỏ qua, đến nội dung chính</a>${C.Header.render()}<main id="main" tabindex="-1"></main>${C.Footer.render()}`;
    main = $('#main', app);
    C.SearchBox.bind(app.querySelector('.site-header'));
  }

  /* ---------- Trang chủ ---------- */
  function renderHome({ scrollToSubjects = false } = {}) {
    main.innerHTML = C.HeroSection.render() + C.GradeBookshelf.render({ selected: state.grade }) + C.SubjectGrid.render({ grade: state.grade });
    C.SearchBox.bind(main);
    document.title = `${CT.store.data.school.siteTitle} | ${CT.store.data.school.name}`;
    if (scrollToSubjects) requestAnimationFrame(() => scrollToEl($('#mon-hoc', main)));
  }

  /** Chọn khối lớp: cập nhật thẻ được chọn + danh sách môn, không tải lại trang */
  function selectGrade(grade) {
    set({ grade });
    history.replaceState(null, '', CT.router.build.home(grade));
    $$('.grade-card', main).forEach((el) => {
      const sel = Number(el.dataset.grade) === grade;
      el.classList.toggle('is-selected', sel); el.setAttribute('aria-pressed', sel ? 'true' : 'false');
    });
    const old = $('#mon-hoc', main);
    const tmp = document.createElement('div'); tmp.innerHTML = C.SubjectGrid.render({ grade });
    const fresh = tmp.firstElementChild; fresh.classList.add('fade-up');
    old ? old.replaceWith(fresh) : main.appendChild(fresh);
    scrollToEl(fresh);
  }

  /* ---------- Chi tiết môn ---------- */
  async function renderSubject(grade, subjectId, params) {
    const subject = CT.store.subjectById[subjectId];
    const g = CT.store.gradeByNo[grade];
    if (!subject || !g || !g.subjects.includes(subjectId)) {
      main.innerHTML = `<section class="section"><div class="container"><div class="card empty">${CT.lib.icon('alert')}<h3>Không tìm thấy môn học</h3><p><a href="#/">Về trang chủ</a></p></div></div></section>`;
      return;
    }
    const cat = CT.store.data.catalog[`${grade}/${subjectId}`] || null;
    set({
      grade, subjectId, view: 'subject',
      query: params.get('q') || '', semester: params.get('hk') || 'all', integration: params.get('th') || '',
      lesson: params.get('bai') || null, collapsed: new Set(),
    });
    document.title = `${subject.name} lớp ${grade} | ${CT.store.data.school.siteTitle}`;
    window.scrollTo({ top: 0 });
    main.innerHTML = C.SubjectDetail.render({ grade, subject, cur: null, cat, state, loading: !!cat });
    if (!cat) return;
    let cur = null;
    try { cur = await CT.loader.loadCurriculum(grade, subjectId); } catch (e) { console.error(e); }
    if (state.view !== 'subject' || state.subjectId !== subjectId || state.grade !== grade) return; // người dùng đã chuyển trang
    currentCur = cur;
    if (!cur) {
      main.innerHTML = C.SubjectDetail.render({ grade, subject, cur: null, cat: null, state });
      return;
    }
    // Mặc định: mở tuần chứa bài cần xem, nếu không thì mở tất cả tuần học kì I và thu gọn học kì II để trang gọn
    if (state.lesson) {
      const target = cur.lessons.find((l) => l.id === state.lesson);
      if (target) { set({ semester: 'all' }); }
    }
    main.innerHTML = C.SubjectDetail.render({ grade, subject, cur, cat, state });
    bindDetail();
    if (state.lesson) {
      requestAnimationFrame(() => {
        const el = $('.plan-scroll', main)?.offsetParent ? $(`#row-${CSS.escape(state.lesson)}`, main) : $(`#card-${CSS.escape(state.lesson)}`, main);
        scrollToEl(el, 150);
      });
    }
  }

  function rerenderTable() {
    const holder = $('#plan-table', main);
    if (!holder || !currentCur) return;
    holder.innerHTML = C.CurriculumTable.render(currentCur, { ...state, target: state.lesson });
  }

  function bindDetail() {
    const input = $('#plan-search', main);
    if (input) input.addEventListener('input', debounce(() => { set({ query: input.value.trim(), lesson: null }); rerenderTable(); }, 160));
    const sel = $('#plan-integration', main);
    if (sel) sel.addEventListener('change', () => { set({ integration: sel.value }); rerenderTable(); });
  }

  /* ---------- Tìm kiếm ---------- */
  async function renderSearch(params) {
    const q = (params.get('q') || '').trim();
    const grade = params.get('lop') ? Number(params.get('lop')) : null;
    set({ view: 'search', query: q, grade: grade || state.grade });
    document.title = `Tìm kiếm${q ? ': ' + q : ''} | ${CT.store.data.school.siteTitle}`;
    window.scrollTo({ top: 0 });
    searchShown = 60;
    const draw = (results, loading) => {
      main.innerHTML = C.SearchResults.render({ q, grade, results, loading, shown: searchShown });
      C.SearchBox.bind(main);
    };
    if (!q) { draw([], false); return; }
    if (!CT.search.isReady()) {
      draw([], true);
      try { CT.search.prepare(await CT.loader.loadSearchIndex()); }
      catch (e) { main.innerHTML = `<section class="section"><div class="container"><div class="notice">${CT.lib.icon('alert')}<div>Không tải được chỉ mục tìm kiếm. Hãy chạy <code>node tools/build-data.mjs</code> để tạo lại dữ liệu.</div></div></div></section>`; return; }
      if (state.view !== 'search') return;
    }
    const results = CT.search.search(q, { grade, limit: 5000 });
    draw(results, false);
    on(main, 'click', '[data-more]', (ev, el) => { searchShown = Number(el.dataset.more); draw(results, false); });
  }

  /* ---------- Định tuyến ---------- */
  function route() {
    const r = CT.router.parse();
    if (r.view === 'subject') return renderSubject(r.grade, r.subjectId, r.params);
    if (r.view === 'search') return renderSearch(r.params);
    const prevView = state.view;
    set({ view: 'home', grade: r.grade || state.grade || 1, subjectId: null });
    renderHome({ scrollToSubjects: prevView === 'subject' && location.hash.includes('#mon-hoc') });
  }

  /* ---------- Sự kiện chung ---------- */
  function bindGlobal() {
    on(app, 'click', '.grade-card', (ev, el) => { ev.preventDefault(); selectGrade(Number(el.dataset.grade)); });
    on(app, 'click', '.week-toggle', (ev, el) => {
      const week = Number(el.dataset.week);
      const expanded = el.getAttribute('aria-expanded') !== 'true';
      // Đồng bộ cả bảng và thẻ (cùng dữ liệu)
      $$(`.week-toggle[data-week="${week}"]`, main).forEach((b) => b.setAttribute('aria-expanded', expanded ? 'true' : 'false'));
      $$(`.lesson-row[data-week="${week}"]`, main).forEach((tr) => { tr.hidden = !expanded; });
      $$(`[data-week-body="${week}"]`, main).forEach((d) => { d.hidden = !expanded; });
      if (expanded) state.collapsed.delete(week); else state.collapsed.add(week);
    });
    on(app, 'click', '[data-expand]', (ev, el) => {
      const all = el.dataset.expand === 'all';
      const weeks = $$('.week-toggle', main).map((b) => Number(b.dataset.week));
      state.collapsed = all ? new Set() : new Set(weeks);
      rerenderTable();
    });
    on(app, 'click', '[data-semester]', (ev, el) => {
      set({ semester: el.dataset.semester === 'all' ? 'all' : Number(el.dataset.semester) });
      $$('[data-semester]', main).forEach((b) => b.setAttribute('aria-pressed', b === el ? 'true' : 'false'));
      rerenderTable();
    });
    on(app, 'click', '[data-integration]', (ev, el) => {
      const sel = $('#plan-integration', main);
      const v = state.integration === el.dataset.integration ? '' : el.dataset.integration;
      set({ integration: v });
      if (sel) sel.value = v;
      rerenderTable();
      scrollToEl($('.plan-toolbar', main), 90);
    });
    on(app, 'click', '[data-action="back"]', (ev, el) => {
      // Liên kết dạng #/lop/1#mon-hoc: điều hướng thủ công để giữ vị trí cuộn hợp lí
      ev.preventDefault();
      set({ view: 'subject' });
      location.hash = el.getAttribute('href');
    });
    window.addEventListener('hashchange', route);
  }

  function init() {
    if (!window.CT_DATA || !window.CT_DATA.grades) {
      app.innerHTML = `<div class="container section"><div class="notice">${CT.lib.icon('alert')}<div>Chưa có dữ liệu. Hãy chạy <code>node tools/build-data.mjs</code> trong thư mục website để tạo <code>js/data.bundle.js</code>.</div></div></div>`;
      return;
    }
    layout();
    bindGlobal();
    route();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
