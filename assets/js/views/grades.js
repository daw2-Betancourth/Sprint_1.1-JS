// Qualificacions: professor qualifica alumne per projecte+ítem. Mitjana si diversos.
import { getDb, listProjectsFor, findUser, findItem, averageGrade, putGrade, gradesForAlumneProject } from '../models/store.js';
import { validateGrade } from '../utils/validation.js';
import { handleAsyncError, showAlert, showFieldErrors } from '../utils/errors.js';
import { pageHeader, renderTable } from '../components/table.js';

export function renderGrades(app, me) {
  const db = getDb();
  if (me.role === 'alumne') {
    const projects = listProjectsFor(me);
    app.innerHTML = `${pageHeader('Les meves notes', 'Mitjana aritmètica si hi ha diversos professors.')}
      ${projects.map((p) => {
        const rows = gradesForAlumneProject(me.id, p.id);
        return `<div class="card mb-3"><div class="card-body">
          <h2 class="h6">${p.codi} · ${p.nom}</h2>
          ${renderTable(
            [{ label: 'Ítem', key: 'item' }, { label: 'Mitjana', render: (r) => r.mitjana !== '—' ? `<span class="gp-status gp-status-success">${r.mitjana}</span>` : '<span class="gp-status gp-status-warning">pendent</span>' }, { label: 'Detall', key: 'detall' }],
            rows.map((r) => ({ item: `${r.item?.codi} · ${r.item?.nom}`, mitjana: r.mitjana ?? '—', detall: r.detall.map((d) => `${d.nota}`).join(', ') || '—' }))
          )}
        </div></div>`;
      }).join('') || '<div class="gp-empty"><span class="gp-empty-title">Sense projectes</span></div>'}`;
    return;
  }

  const projects = listProjectsFor(me);
  if (!projects.length) { app.innerHTML = pageHeader('Notes') + '<div class="gp-empty"><span class="gp-empty-title">Sense projectes</span></div>'; return; }
  let pid = projects[0].id;
  app.innerHTML = `
    ${pageHeader('Qualificacions', me.role === 'admin' ? 'L’admin només consulta.' : 'Posa nota 0-10 per alumne i ítem.')}
    <div class="card mb-3"><div class="card-body">
      <label class="form-label" for="g-project">Projecte</label>
      <select id="g-project" class="form-select" style="max-width:28rem">
        ${projects.map((p) => `<option value="${p.id}">${p.codi} · ${p.nom}</option>`).join('')}
      </select>
    </div></div>
    <div id="g-detail"></div>`;

  document.getElementById('g-project').addEventListener('change', (e) => { pid = Number(e.target.value); paint(); });
  paint();

  function paint() {
    const box = document.getElementById('g-detail');
    const alumnes = db.assignments.alumnes.filter((a) => a.project_id === Number(pid)).map((a) => findUser(a.alumne_id)).filter(Boolean);
    const items = db.assignments.items.filter((a) => a.project_id === Number(pid)).map((a) => findItem(a.item_id)).filter(Boolean);
    if (!alumnes.length || !items.length) { box.innerHTML = `<div class="gp-empty"><span class="gp-empty-title">Cal assignar alumnat i ítems primer</span></div>`; return; }
    const rows = [];
    alumnes.forEach((al) => items.forEach((it) => {
      rows.push({ al, it, mitjana: averageGrade(pid, al.id, it.id), mines: db.grades.filter((g) => g.project_id === Number(pid) && g.alumne_id === al.id && g.item_id === it.id) });
    }));
    box.innerHTML = `
      ${me.role === 'professor' ? `
      <div class="card mb-3"><div class="card-body">
      <form id="g-form" novalidate>
        <div class="row g-3 align-items-end">
          <div class="col-12 col-md-4"><label class="form-label">Alumne</label>
            <select name="alumne_id" class="form-select">${alumnes.map((a) => `<option value="${a.id}">${a.nom}</option>`).join('')}</select></div>
          <div class="col-12 col-md-4"><label class="form-label">Ítem</label>
            <select name="item_id" class="form-select">${items.map((i) => `<option value="${i.id}">${i.codi}</option>`).join('')}</select></div>
          <div class="col-12 col-md-2"><label class="form-label">Nota 0-10</label>
            <input name="nota" type="number" step="0.5" min="0" max="10" class="form-control" />
            <p data-err="nota"></p></div>
          <div class="col-12 col-md-2"><button class="btn btn-primary w-100">Desar nota</button></div>
        </div>
      </form></div></div>` : ''}
      ${renderTable(
        [
          { label: 'Alumne', render: (r) => r.al.nom },
          { label: 'Ítem', render: (r) => `<span class="badge text-bg-info">${r.it.codi}</span>` },
          { label: 'Mitjana', render: (r) => r.mitjana !== null ? `<span class="gp-status gp-status-success">${r.mitjana}</span>` : '<span class="gp-status gp-status-warning">pendent</span>' },
          { label: 'Totes les notes', render: (r) => r.mines.map((m) => `${findUser(m.professor_id)?.username}:${m.nota}`).join(', ') || '—' },
        ],
        rows
      )}`;
    document.getElementById('g-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = { project_id: pid, alumne_id: Number(fd.get('alumne_id')), item_id: Number(fd.get('item_id')), nota: fd.get('nota') };
      const errs = validateGrade(data);
      if (Object.keys(errs).length) { showFieldErrors(e.target, errs); return; }
      try {
        putGrade(me, { ...data, nota: Number(data.nota) });
        showAlert('Nota desada (mitjana recalculada)', 'ok');
        paint();
      } catch (err) { handleAsyncError(err); }
    });
  }
}
