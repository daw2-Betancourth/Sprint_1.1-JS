// CRUD projectes: codi, nom, descripció. Crea admin/professor.
import { listProjectsFor, createProject, updateProject, deleteProject, findUser } from '../models/store.js';
import { validateProject } from '../utils/validation.js';
import { handleAsyncError, showAlert, showFieldErrors } from '../utils/errors.js';
import { renderTable, pageHeader } from '../components/table.js';

export function renderProjects(app, me) {
  const canCreate = me.role === 'admin' || me.role === 'professor';
  const rows = listProjectsFor(me).map((p) => ({ ...p, creador: findUser(p.created_by)?.nom ?? '—' }));
  app.innerHTML = `
    ${pageHeader('Projectes', 'Codi + nom + descripció.', canCreate ? `<button id="p-new" class="btn btn-primary">Nou projecte</button>` : '')}
    <div id="p-form-wrap"></div>
    ${renderTable(
      [
        { label: 'Codi', render: (r) => `<span class="badge text-bg-info">${r.codi}</span>` },
        { label: 'Nom', key: 'nom' },
        { label: 'Descripció', render: (r) => `<span class="gp-clamp-2">${r.descripcio || ''}</span>` },
        { label: 'Creador', key: 'creador' },
        { label: 'Accions', render: (r) => `<span class="gp-row-actions">
          ${canCreate ? `<button data-edit="${r.id}" class="btn btn-sm btn-outline-secondary">Edita</button>` : ''}
          ${me.role === 'admin' ? `<button data-del="${r.id}" class="btn btn-sm btn-outline-danger">Elimina</button>` : ''}</span>` },
      ],
      rows
    )}`;

  document.getElementById('p-new')?.addEventListener('click', () => showForm());
  app.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
    showForm(rows.find((x) => x.id === Number(b.dataset.edit)));
  }));
  app.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Eliminar projecte i les seves assignacions/notes?')) return;
    try { deleteProject(me, b.dataset.del); showAlert('Eliminat', 'ok'); renderProjects(app, me); }
    catch (err) { handleAsyncError(err); }
  }));

  function showForm(p = null) {
    const w = document.getElementById('p-form-wrap');
    w.innerHTML = `
      <div class="card mb-3"><div class="card-body">
      <form id="p-form" novalidate>
        <div class="row g-3">
          <div class="col-12 col-md-4"><label class="form-label">Codi</label>
            <input name="codi" value="${p?.codi ?? ''}" class="form-control" />
            <p data-err="codi"></p></div>
          <div class="col-12 col-md-4"><label class="form-label">Nom</label>
            <input name="nom" value="${p?.nom ?? ''}" class="form-control" />
            <p data-err="nom"></p></div>
          <div class="col-12 col-md-4"><label class="form-label">Descripció</label>
            <input name="descripcio" value="${p?.descripcio ?? ''}" class="form-control" /></div>
        </div>
        <div class="gp-form-actions">
          <button class="btn btn-primary">${p ? 'Desar' : 'Crear'}</button>
          <button type="button" id="p-cancel" class="btn btn-outline-secondary">Cancel·la</button>
        </div>
      </form></div></div>`;
    document.getElementById('p-cancel').addEventListener('click', () => { w.innerHTML = ''; });
    document.getElementById('p-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = { codi: String(fd.get('codi')), nom: String(fd.get('nom')), descripcio: String(fd.get('descripcio') || '') };
      const errs = validateProject(data);
      if (Object.keys(errs).length) { showFieldErrors(e.target, errs); return; }
      try {
        if (p) updateProject(me, p.id, data);
        else createProject(me, data);
        showAlert('Desat', 'ok');
        renderProjects(app, me);
      } catch (err) { handleAsyncError(err); }
    });
  }
}
