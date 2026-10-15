// Assignacions N-M: professor/alumne/ítem <-> projecte.
import { getDb, listProjectsFor, findUser, findItem, assignProfessor, assignAlumne, assignItem, unassign, canAssign } from '../models/store.js';
import { handleAsyncError, showAlert } from '../utils/errors.js';
import { pageHeader } from '../components/table.js';

export function renderAssignments(app, me) {
  const db = getDb();
  const projects = listProjectsFor(me);
  const professors = db.users.filter((u) => u.role === 'professor');
  const alumnes = db.users.filter((u) => u.role === 'alumne');
  let current = projects[0]?.id ?? '';
  app.innerHTML = `
    ${pageHeader('Assignacions', 'Un alumne/ítem pot estar a més d’un projecte.')}
    <div class="card mb-3"><div class="card-body">
      <label class="form-label" for="a-project">Projecte</label>
      <select id="a-project" class="form-select" style="max-width:28rem">
        ${projects.map((p) => `<option value="${p.id}">${p.codi} · ${p.nom}</option>`).join('')}
      </select>
    </div></div>
    <div id="a-detail"></div>`;

  const sel = document.getElementById('a-project');
  if (!projects.length) {
    document.getElementById('a-detail').innerHTML = `<div class="gp-empty"><span class="gp-empty-title">Sense projectes assignats</span></div>`;
    return;
  }
  sel.addEventListener('change', () => { current = Number(sel.value); paint(); });
  current = Number(sel.value);
  paint();

  function paint() {
    const pid = Number(current);
    const editable = canAssign(me, pid);
    const aprof = db.assignments.professors.filter((a) => a.project_id === pid).map((a) => findUser(a.professor_id)).filter(Boolean);
    const aalu = db.assignments.alumnes.filter((a) => a.project_id === pid).map((a) => findUser(a.alumne_id)).filter(Boolean);
    const aite = db.assignments.items.filter((a) => a.project_id === pid).map((a) => findItem(a.item_id)).filter(Boolean);
    document.getElementById('a-detail').innerHTML = `
      <div class="row g-3">
        ${block('Professorat', aprof.map((u) => ({ id: u.id, label: `${u.nom} (${u.username})` })), 'professor', professors.map((u) => ({ value: u.id, label: `${u.nom}` })), editable)}
        ${block('Alumnat', aalu.map((u) => ({ id: u.id, label: `${u.nom} (${u.username})` })), 'alumne', alumnes.map((u) => ({ value: u.id, label: `${u.nom}` })), editable)}
        ${block('Ítems', aite.map((i) => ({ id: i.id, label: `${i.codi} · ${i.nom}` })), 'item', db.items.map((i) => ({ value: i.id, label: `${i.codi}` })), editable)}
      </div>`;
    if (!editable) return;
    document.querySelectorAll('[data-add]').forEach((f) => f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const kind = e.target.dataset.add;
      const val = Number(new FormData(e.target).get('other'));
      try {
        if (kind === 'professor') assignProfessor(me, pid, val);
        if (kind === 'alumne') assignAlumne(me, pid, val);
        if (kind === 'item') assignItem(me, pid, val);
        showAlert('Assignat', 'ok');
        paint();
      } catch (err) { handleAsyncError(err); }
    }));
    document.querySelectorAll('[data-un]').forEach((b) => b.addEventListener('click', async () => {
      try {
        const [kind, oid] = b.dataset.un.split(':');
        unassign(me, kind, pid, oid);
        showAlert('Desassignat', 'ok');
        paint();
      } catch (err) { handleAsyncError(err); }
    }));
  }

  function block(title, assigned, kind, options, editable) {
    return `<div class="col-12 col-md-4"><div class="card gp-assign h-100"><div class="card-body">
      <h2 class="h6">${title} <span class="badge text-bg-primary">${assigned.length}</span></h2>
      <ul class="list-group list-group-flush mb-3">
        ${assigned.map((a) => `<li class="list-group-item d-flex justify-content-between align-items-center px-0">
          <span class="text-truncate">${a.label}</span>
          ${editable ? `<button data-un="${kind}:${a.id}" class="btn btn-sm btn-outline-danger" aria-label="Desassigna">×</button>` : ''}
        </li>`).join('') || '<li class="list-group-item px-0 text-secondary small">Buit</li>'}
      </ul>
      ${editable ? `<form data-add="${kind}" class="d-flex gap-2">
        <select name="other" class="form-select form-select-sm" aria-label="Afegeix">
          ${options.map((o) => `<option value="${o.value}">${o.label}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-primary" aria-label="Afegeix">+</button>
      </form>` : '<p class="small text-secondary mb-0">Sense permís</p>'}
    </div></div></div>`;
  }
}
