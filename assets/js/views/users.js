// CRUD usuaris (només admin). Validació client + errors async.
import { listUsers, createUser, updateUser, deleteUser } from '../models/store.js';
import { validateUser } from '../utils/validation.js';
import { handleAsyncError, showAlert, showFieldErrors } from '../utils/errors.js';
import { renderTable, pageHeader } from '../components/table.js';

export function renderUsers(app, me) {
  if (me.role !== 'admin') {
    app.innerHTML = `<div class="gp-empty"><span class="gp-empty-title">Només l'admin</span></div>`;
    return;
  }
  const users = listUsers();
  app.innerHTML = `
    ${pageHeader('Usuaris', 'Només l’admin crea professors i alumnes. Hi ha un sol admin.', `<button id="u-new" class="btn btn-primary">Nou usuari</button>`)}
    <div id="u-form-wrap"></div>
    ${renderTable(
      [
        { label: 'Username', key: 'username' },
        { label: 'Nom', key: 'nom' },
        { label: 'Rol', render: (r) => `<span class="badge ${r.role === 'admin' ? 'text-bg-primary' : r.role === 'professor' ? 'text-bg-info' : 'text-bg-warning'}">${r.role}</span>` },
        { label: 'Accions', render: (r) => r.role === 'admin'
          ? '<span class="gp-status gp-status-info">protegit</span>'
          : `<span class="gp-row-actions"><button data-edit="${r.id}" class="btn btn-sm btn-outline-secondary">Edita</button><button data-del="${r.id}" class="btn btn-sm btn-outline-danger">Elimina</button></span>` },
      ],
      users
    )}`;

  document.getElementById('u-new').addEventListener('click', () => showForm());
  app.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
    showForm(users.find((x) => x.id === Number(b.dataset.edit)));
  }));
  app.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Eliminar usuari?')) return;
    try { deleteUser(me, b.dataset.del); showAlert('Eliminat', 'ok'); renderUsers(app, me); }
    catch (err) { handleAsyncError(err); }
  }));

  function showForm(u = null) {
    const w = document.getElementById('u-form-wrap');
    w.innerHTML = `
      <div class="card mb-3"><div class="card-body">
      <form id="u-form" novalidate>
        <div class="row g-3">
          <div class="col-12 col-md-3"><label class="form-label">Username</label>
            <input name="username" value="${u?.username ?? ''}" class="form-control" />
            <p data-err="username"></p></div>
          <div class="col-12 col-md-3"><label class="form-label">Nom</label>
            <input name="nom" value="${u?.nom ?? ''}" class="form-control" />
            <p data-err="nom"></p></div>
          <div class="col-12 col-md-3"><label class="form-label">Rol</label>
            <select name="role" class="form-select">
              ${['professor', 'alumne'].map((r) => `<option ${u?.role === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
            <p data-err="role"></p></div>
          <div class="col-12 col-md-3"><label class="form-label">${u ? 'Nova contrasenya (opcional)' : 'Contrasenya'}</label>
            <input name="password" type="password" class="form-control" />
            <p data-err="password"></p></div>
        </div>
        <div class="gp-form-actions">
          <button class="btn btn-primary">${u ? 'Desar' : 'Crear'}</button>
          <button type="button" id="u-cancel" class="btn btn-outline-secondary">Cancel·la</button>
        </div>
      </form></div></div>`;
    document.getElementById('u-cancel').addEventListener('click', () => { w.innerHTML = ''; });
    document.getElementById('u-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = { username: String(fd.get('username')).trim(), nom: String(fd.get('nom')).trim(), role: String(fd.get('role')), password: String(fd.get('password') || '') || undefined };
      if (!u && !data.password) { showAlert('Cal contrasenya'); return; }
      if (u && !data.password) delete data.password;
      const errs = validateUser({ ...data, password: data.password ?? '123456' });
      if (!u) { if (Object.keys(errs).length) { showFieldErrors(e.target, errs); return; } }
      else { const e2 = { ...errs }; if (!data.password) delete e2.password; if (Object.keys(e2).length) { showFieldErrors(e.target, e2); return; } }
      try {
        if (u) updateUser(me, u.id, data);
        else createUser(me, data);
        showAlert('Desat', 'ok');
        renderUsers(app, me);
      } catch (err) { handleAsyncError(err); }
    });
  }
}
