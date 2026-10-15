// Sidebar gp-nav + offcanvas Bootstrap. No lògica de negoci.
export function renderNavbar(me) {
  const body = document.getElementById('sidebar-body');
  if (!me) {
    body.innerHTML = `<a class="gp-brand" href="#/login"><span class="gp-avatar">G</span><span><span class="gp-brand-text">Projectes Globalitzats</span><span class="gp-brand-mark">M0612 · JS</span></span></a>`;
    return;
  }
  const links = [
    ['#/dashboard', 'Dashboard'],
    ['#/projects', 'Projectes'],
    ['#/items', 'Ítems'],
  ];
  if (me.role === 'admin') links.push(['#/users', 'Usuaris']);
  if (me.role !== 'alumne') {
    links.push(['#/assignments', 'Assignacions']);
    links.push(['#/grades', 'Notes']);
  } else {
    links.push(['#/grades', 'Les meves notes']);
  }
  const hash = location.hash || '#/dashboard';
  const initial = String(me.nom || me.username || '?').trim().charAt(0).toUpperCase();
  body.innerHTML = `
    <a class="gp-brand" href="#/dashboard">
      <span class="gp-avatar">${initial}</span>
      <span><span class="gp-brand-text">Projectes Globalitzats</span><span class="gp-brand-mark">M0612 · JS</span></span>
    </a>
    <nav class="nav gp-nav" aria-label="Seccions">
      ${links.map(([h, l]) => `<a class="nav-link ${hash === h ? 'active' : ''}" ${hash === h ? 'aria-current="page"' : ''} href="${h}">${l}</a>`).join('')}
    </nav>
    <div class="gp-user">
      <div class="d-flex align-items-center gap-2 mb-2">
        <span class="gp-avatar">${initial}</span>
        <div class="min-w-0"><div class="gp-user-name text-truncate">${me.nom}</div><span class="badge text-bg-primary">${me.role}</span></div>
      </div>
      <div class="d-flex gap-2">
        <button id="btn-logout" class="btn btn-sm gp-logout border flex-fill">Sortir</button>
      </div>
    </div>`;
}
