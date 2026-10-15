// Validació al client (M612). Funcions pures, sense DOM.

export function isRequired(v) {
  return String(v ?? '').trim().length > 0;
}

export function isCode(v) {
  return /^[A-Za-z0-9][A-Za-z0-9-_]{1,19}$/.test(String(v ?? '').trim());
}

export function isUsername(v) {
  return /^[a-z0-9_]{3,30}$/.test(String(v ?? '').trim());
}

export function isNota(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 10;
}

export function validateUser(d, { allowAdmin = false } = {}) {
  const e = {};
  if (!isUsername(d.username)) e.username = '3-30 minúscules/números/_';
  if (!isRequired(d.nom)) e.nom = 'Obligatori';
  if (!['admin', 'professor', 'alumne'].includes(d.role)) e.role = 'Rol invàlid';
  if (d.role === 'admin' && !allowAdmin) e.role = 'Només hi pot haver un admin';
  if (d.password !== undefined && String(d.password).length < 6) e.password = 'Mínim 6 caràcters';
  return e;
}

export function validateProject(d) {
  const e = {};
  if (!isCode(d.codi)) e.codi = 'Codi 2-20, lletres/números/-/_';
  if (!isRequired(d.nom)) e.nom = 'Obligatori';
  return e;
}

export function validateItem(d) {
  const e = {};
  if (!isCode(d.codi)) e.codi = 'Codi 2-20, lletres/números/-/_';
  if (!isRequired(d.nom)) e.nom = 'Obligatori';
  return e;
}

export function validateGrade(d) {
  const e = {};
  if (!Number.isInteger(Number(d.project_id))) e.project_id = 'Projecte invàlid';
  if (!Number.isInteger(Number(d.alumne_id))) e.alumne_id = 'Alumne invàlid';
  if (!Number.isInteger(Number(d.item_id))) e.item_id = 'Ítem invàlid';
  if (!isNota(d.nota)) e.nota = 'Nota 0-10';
  return e;
}
