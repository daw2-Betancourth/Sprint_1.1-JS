// CRUD ítems avaluables: només admin crea.
import { getDb, createItem, updateItem, deleteItem } from '../models/store.js';
import { validateItem } from '../utils/validation.js';
import { handleAsyncError, showAlert, showFieldErrors } from '../utils/errors.js';
import { renderTable, pageHeader } from '../components/table.js';

export function renderItems(app, me) {
  const isAdmin = me.role === 'admin';
  const rows = [...getDb().items];
  app.innerHTML = `
    ${pageHeader('Ítems avaluables', 'Codi + nom + descripció. Només admin crea.', isAdmin ? `<button id="i-new" class="btn btn-primary">Nou ítem</button>` : '')}
    <div id="i-form-wrap"></div>
    ${renderTable(
      [
        { label: 'Codi', render: (r) => `<span class="badge text-bg-info">${r.codi}</span>` },
        { label: 'Nom', key: 'nom' },
        { label: 'Descripció', render: (r) => `<span class="gp-clamp-2">${r.descripcio || ''}</span>` },
        { label: 'Accions', render: (r) => isAdmin
          ? `<span class="gp-row-actions"><button data-edit="${r.id}" class="btn btn-sm btn-outline-secondary">Edita</button><button data-del="${r.id}" class="btn btn-sm btn-outline-danger">Elimina</button></span>`
          : '<span class="gp-status gp-status-info">lectura</span>' },
      ],
      rows
    )}`;

  document.getElementById('i-new')?.addEventListener('click', () => showForm());
  app.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
    showForm(rows.find((x) => x.id === Number(b.dataset.edit)));
  }));
  app.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Eliminar ítem?')) return;
    try { deleteItem(me, b.dataset.del); showAlert('Eliminat', 'ok'); renderItems(app, me); }
    catch (err) { handleAsyncError(err); }
  }));

  function showForm(it = null) {
    const w = document.getElementById('i-form-wrap');
    w.innerHTML = `
      <div class="card mb-3"><div class="card-body">
      <form id="i-form" novalidate>
        <div class="row g-3">
          <div class="col-12 col-md-4"><label class="form-label">Codi</label>
            <input name="codi" value="${it?.codi ?? ''}" class="form-control" />
            <p data-err="codi"></p></div>
          <div class="col-12 col-md-4"><label class="form-label">Nom</label>
            <input name="nom" value="${it?.nom ?? ''}" class="form-control" />
            <p data-err="nom"></p></div>
          <div class="col-12 col-md-4"><label class="form-label">Descripció</label>
            <input name="descripcio" value="${it?.descripcio ?? ''}" class="form-control" /></div>
        </div>
        <div class="gp-form-actions">
          <button class="btn btn-primary">${it ? 'Desar' : 'Crear'}</button>
          <button type="button" id="i-cancel" class="btn btn-outline-secondary">Cancel·la</button>
        </div>
      </form></div></div>`;
    document.getElementById('i-cancel').addEventListener('click', () => { w.innerHTML = ''; });
    document.getElementById('i-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = { codi: String(fd.get('codi')), nom: String(fd.get('nom')), descripcio: String(fd.get('descripcio') || '') };
      const errs = validateItem(data);
      if (Object.keys(errs).length) { showFieldErrors(e.target, errs); return; }
      try {
        if (it) updateItem(me, it.id, data);
        else createItem(me, data);
        showAlert('Desat', 'ok');
        renderItems(app, me);
      } catch (err) { handleAsyncError(err); }
    });
  }
}
