// main.js: punt d'entrada, router hash, sessió. Sense lògica de negoci.
import { loadDatabase, getSession, setSession } from './api/client.js';
import { setDb } from './models/store.js';
import { renderNavbar } from './components/navbar.js';
import { renderLogin } from './views/auth.js';
import { renderDashboard } from './views/dashboard.js';
import { renderUsers } from './views/users.js';
import { renderProjects } from './views/projects.js';
import { renderItems } from './views/items.js';
import { renderAssignments } from './views/assignments.js';
import { renderGrades } from './views/grades.js';
import { handleAsyncError } from './utils/errors.js';

const app = document.getElementById('app');

function currentUser() {
  return getSession();
}

function closeOffcanvas() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar || !window.bootstrap) return;
  if (!sidebar.classList.contains('show')) return;
  try {
    const inst = window.bootstrap.Offcanvas.getInstance(sidebar) || new window.bootstrap.Offcanvas(sidebar);
    inst.hide();
  } catch { /* no-op */ }
}

async function route() {
  try {
    const hash = location.hash || '#/dashboard';
    const me = currentUser();

    if (!me) {
      document.body.classList.remove('gp-app');
      document.body.classList.add('gp-login');
      renderNavbar(null);
      if (hash !== '#/login') { location.hash = '#/login'; return; }
      renderLogin(app, () => { location.hash = '#/dashboard'; });
      return;
    }

    document.body.classList.add('gp-app');
    document.body.classList.remove('gp-login');
    renderNavbar(me);
    closeOffcanvas();
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      setSession(null);
      location.hash = '#/login';
    });

    if (hash === '#/login') { location.hash = '#/dashboard'; return; }
    if (hash.startsWith('#/dashboard')) renderDashboard(app, me);
    else if (hash.startsWith('#/users')) renderUsers(app, me);
    else if (hash.startsWith('#/projects')) renderProjects(app, me);
    else if (hash.startsWith('#/items')) renderItems(app, me);
    else if (hash.startsWith('#/assignments')) {
      if (me.role === 'alumne') { app.innerHTML = '<div class="gp-empty"><span class="gp-empty-title">Sense permís</span></div>'; return; }
      renderAssignments(app, me);
    }
    else if (hash.startsWith('#/grades')) renderGrades(app, me);
    else app.innerHTML = '<div class="gp-empty"><span class="gp-empty-title">Ruta no trobada</span></div>';
  } catch (err) {
    handleAsyncError(err);
  }
}

async function init() {
  try {
    const db = await loadDatabase();
    setDb(db);
    if (!location.hash) location.hash = '#/dashboard';
    window.addEventListener('hashchange', route);
    route();
  } catch (err) {
    handleAsyncError(err);
    app.innerHTML = `<div class="alert alert-danger" role="alert">
      <p class="fw-bold mb-1">No s'han pogut carregar les dades JSON.</p>
      <p class="small mb-0">Serveix la carpeta amb HTTP: <code>python3 -m http.server 8000</code> i obre <code>http://localhost:8000</code>. fetch() no funciona amb file://.</p>
    </div>`;
  }
}

init();
