// Components genèrics Bootstrap 5 + sistema gp-*. Responsabilitat única: HTML.
export function renderTable(columns, rows) {
  if (!rows.length) return `<div class="gp-empty"><span class="gp-empty-title">Sense dades</span><span class="small">No hi ha resultats per mostrar.</span></div>`;
  const th = columns.map((c) => `<th scope="col">${c.label}</th>`).join('');
  const tr = rows.map((r) => {
    const td = columns.map((c) => `<td>${c.render ? c.render(r) : (r[c.key] ?? '')}</td>`).join('');
    return `<tr>${td}</tr>`;
  }).join('');
  return `<div class="gp-table-wrap"><div class="table-responsive"><table class="table align-middle"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div></div>`;
}

export function card(title, value, sub = '') {
  return `<div class="col"><div class="card gp-kpi h-100"><div class="card-body">
    <p class="gp-label gp-kpi-label">${title}</p>
    <p class="gp-kpi-value tnum">${value ?? '—'}</p>
    ${sub ? `<p class="gp-kpi-hint">${sub}</p>` : ''}
  </div></div></div>`;
}

export function kpiGrid(cardsHtml) {
  return `<div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3 mb-4 gp-enter-group">${cardsHtml}</div>`;
}

export function pageHeader(title, desc = '', actions = '') {
  return `<div class="gp-page-head">
    <div><h1 class="gp-page-title">${title}</h1>
    ${desc ? `<p class="gp-page-sub">${desc}</p>` : ''}</div>
    <div class="gp-page-actions">${actions}</div>
  </div>`;
}
