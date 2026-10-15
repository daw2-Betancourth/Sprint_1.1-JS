// Vista login. Només DOM + events + fetch via store.
import { login } from '../models/store.js';
import { setSession } from '../api/client.js';
import { handleAsyncError, showAlert } from '../utils/errors.js';

export function renderLogin(app, onOk) {
  document.body.classList.remove('gp-app');
  document.body.classList.add('gp-login');
  app.innerHTML = `
    <div class="gp-login-wrap">
      <div class="gp-login-content">
        <div class="row g-3 align-items-stretch">
          <div class="col-12 col-md-6">
            <div class="gp-login-card p-4 p-lg-5 h-100">
              <p class="gp-label mb-1">Projectes Globalitzats</p>
              <h1 class="gp-login-title">Login d'usuaris</h1>
              <p class="text-secondary small mb-4">Sense registre. Demana el teu usuari.</p>
              <form id="f-login" novalidate>
                <div class="mb-3">
                  <label class="form-label" for="login-user">Usuari</label>
                  <input id="login-user" name="username" autocomplete="username" class="form-control" placeholder="admin / prof1 / alum1" />
                </div>
                <div class="mb-3">
                  <label class="form-label" for="login-pass">Contrasenya</label>
                  <input id="login-pass" name="password" type="password" autocomplete="current-password" class="form-control" />
                </div>
                <button class="btn btn-primary w-100">Entrar</button>
                <p class="small text-secondary mt-3 mb-0">Demo: admin/admin123 · prof1/prof123 · alum1/alum123</p>
              </form>
            </div>
          </div>
          <div class="col-12 col-md-6 d-none d-md-flex">
            <div class="card h-100 w-100"><div class="card-body d-flex flex-column justify-content-center">
              <p class="gp-label">M0612 · JS vanilla</p>
              <h2 class="h5">Rosa #B14C84 · Morat #752E80</h2>
              <p class="text-secondary small mb-0">Fetch + JSON + localStorage. Un alumne a molts projectes, un ítem a molts projectes, mitjana si qualifiquen diversos professors.</p>
            </div></div>
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('f-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const username = String(fd.get('username') || '').trim();
    const password = String(fd.get('password') || '');
    if (!username || !password) { showAlert('Cal usuari i contrasenya'); return; }
    try {
      const me = login(username, password);
      setSession(me);
      document.body.classList.add('gp-app');
      document.body.classList.remove('gp-login');
      onOk();
    } catch (err) {
      handleAsyncError(err);
    }
  });
}
