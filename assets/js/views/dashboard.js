// Dashboards agregats per rol. Bootstrap + gp-kpi.
import { dashboardAdmin, dashboardProfessor, dashboardAlumne } from '../models/store.js';
import { pageHeader, kpiGrid, card, renderTable } from '../components/table.js';

export function renderDashboard(app, me) {
  if (me.role === 'admin') {
    const d = dashboardAdmin();
    app.innerHTML = `
      ${pageHeader('Dashboard admin', 'Visió global de l’aplicació.')}
      ${kpiGrid(`
        ${card('Usuaris', d.usuaris, `admin:${d.byRole.admin} prof:${d.byRole.professor} alum:${d.byRole.alumne}`)}
        ${card('Projectes', d.projectes)}
        ${card('Ítems', d.items)}
        ${card('Notes', d.notes, d.mitjanaGlobal !== null ? `Mitjana ${d.mitjanaGlobal}` : 'Sense notes')}
      `)}
      <div class="card"><div class="card-body d-flex flex-wrap gap-2 align-items-center">
        <span class="gp-status gp-status-info">Fes servir el menú</span>
        <span class="small text-secondary">gestiona usuaris, projectes, ítems, assignacions i notes.</span>
      </div></div>`;
    return;
  }

  if (me.role === 'professor') {
    const rows = dashboardProfessor(me);
    app.innerHTML = `
      ${pageHeader('Dashboard professor', 'Els teus projectes, alumnes i notes.')}
      ${kpiGrid(`
        ${card('Projectes', rows.length)}
        ${card('Alumnes totals', rows.reduce((a, r) => a + r.nAlumnes, 0))}
        ${card('Notes posades', rows.reduce((a, r) => a + r.nNotes, 0))}
      `)}
      ${renderTable(
        [
          { label: 'Projecte', render: (r) => `${r.project.codi} · ${r.project.nom}` },
          { label: 'Alumnes', render: (r) => `<span class="badge text-bg-primary">${r.nAlumnes}</span>` },
          { label: 'Ítems', render: (r) => r.nItems },
          { label: 'Notes', render: (r) => r.nNotes },
        ],
        rows
      )}`;
    return;
  }

  const rows = dashboardAlumne(me);
  const vals = rows.map((r) => r.mitjana).filter((v) => v !== null);
  const global = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  app.innerHTML = `
    ${pageHeader('Dashboard alumne', 'Els teus projectes i qualificacions.')}
    ${kpiGrid(`
      ${card('Projectes', rows.length)}
      ${card('Mitjana global', global ?? '—')}
      ${card('Ítems avaluats', rows.reduce((a, r) => a + r.rows.filter((x) => x.mitjana !== null).length, 0))}
    `)}
    ${rows.map((r) => `
      <div class="card mb-3"><div class="card-body">
        <h2 class="h6">${r.project.codi} · ${r.project.nom} ${r.mitjana !== null ? `<span class="gp-status gp-status-success">${r.mitjana}</span>` : ''}</h2>
        <p class="small text-secondary mb-2">${r.project.descripcio || ''}</p>
        ${renderTable(
          [{ label: 'Ítem', key: 'item' }, { label: 'Mitjana', render: (x) => x.mitjana !== '—' ? `<span class="gp-status gp-status-success">${x.mitjana}</span>` : '<span class="gp-status gp-status-warning">pendent</span>' }],
          r.rows.map((x) => ({ item: `${x.item?.codi} · ${x.item?.nom}`, mitjana: x.mitjana ?? '—' }))
        )}
      </div></div>`).join('') || '<div class="gp-empty"><span class="gp-empty-title">Sense projectes</span></div>'}`;
}
