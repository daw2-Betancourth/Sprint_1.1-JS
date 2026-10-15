// Store: dades + lògica de negoci + RBAC. No toca el DOM.
import { persist } from '../api/client.js';

let db = null;

export function setDb(d) { db = d; }
export function getDb() { return db; }
function save() { persist(db); }

// --- helpers ---
const nextId = (arr) => (arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1);
const norm = (s) => String(s ?? '').trim().toLowerCase();
export const findUser = (id) => db.users.find((u) => u.id === Number(id));
export const findProject = (id) => db.projects.find((p) => p.id === Number(id));
export const findItem = (id) => db.items.find((i) => i.id === Number(id));

// --- auth (sense registre) ---
export function login(username, password) {
  const u = db.users.find((x) => norm(x.username) === norm(username));
  if (!u || u.password !== password) throw new Error('Usuari o contrasenya incorrectes');
  const { password: _p, ...safe } = u;
  return safe;
}

// --- RBAC ---
export const isAdmin = (me) => me?.role === 'admin';
export const isProfessor = (me) => me?.role === 'professor';
export const isAlumne = (me) => me?.role === 'alumne';

export function canCreateUsers(me) { return isAdmin(me); }
export function canCreateItems(me) { return isAdmin(me); }
export function canCreateProjects(me) { return isAdmin(me) || isProfessor(me); }
export function canDeleteProjects(me) { return isAdmin(me); }
export function canAssign(me, projectId) {
  if (isAdmin(me)) return true;
  if (isProfessor(me)) {
    return db.assignments.professors.some(
      (a) => a.project_id === Number(projectId) && a.professor_id === me.id
    ) || db.projects.some((p) => p.id === Number(projectId) && p.created_by === me.id);
  }
  return false;
}
export function canGrade(me) { return isProfessor(me); }

// --- USERS CRUD (només admin crea) ---
export function listUsers() { return [...db.users].map(({ password, ...r }) => r); }

export function createUser(me, d) {
  if (!canCreateUsers(me)) throw new Error('Només l’admin pot crear usuaris');
  if (d.role === 'admin') throw new Error('Només hi ha un admin');
  if (db.users.some((u) => norm(u.username) === norm(d.username))) throw new Error('Username duplicat');
  const u = { id: nextId(db.users), username: d.username.trim(), password: d.password, role: d.role, nom: d.nom.trim() };
  db.users.push(u); save();
  const { password: _p, ...safe } = u;
  return safe;
}

export function updateUser(me, id, d) {
  if (!canCreateUsers(me)) throw new Error('Només l’admin');
  const u = findUser(id);
  if (!u) throw new Error('Usuari no trobat');
  if (u.role === 'admin') throw new Error('L’admin no es pot modificar');
  if (d.username && db.users.some((x) => x.id !== u.id && norm(x.username) === norm(d.username))) {
    throw new Error('Username duplicat');
  }
  if (d.username) u.username = d.username.trim();
  if (d.nom) u.nom = d.nom.trim();
  if (d.password) u.password = d.password;
  if (d.role && d.role !== 'admin') u.role = d.role;
  save();
  const { password: _p, ...safe } = u;
  return safe;
}

export function deleteUser(me, id) {
  if (!canCreateUsers(me)) throw new Error('Només l’admin');
  const u = findUser(id);
  if (!u) throw new Error('Usuari no trobat');
  if (u.role === 'admin') throw new Error('No es pot eliminar l’admin');
  const used =
    db.assignments.professors.some((a) => a.professor_id === u.id) ||
    db.assignments.alumnes.some((a) => a.alumne_id === u.id) ||
    db.grades.some((g) => g.alumne_id === u.id || g.professor_id === u.id);
  if (used) throw new Error('Usuari assignat o amb notes: desassigna’l primer');
  db.users = db.users.filter((x) => x.id !== u.id);
  save();
}

// --- PROJECTS ---
export function listProjectsFor(me) {
  if (!me) return [];
  if (isAdmin(me)) return [...db.projects];
  if (isProfessor(me)) {
    const ids = new Set(
      db.assignments.professors.filter((a) => a.professor_id === me.id).map((a) => a.project_id)
    );
    db.projects.forEach((p) => { if (p.created_by === me.id) ids.add(p.id); });
    return db.projects.filter((p) => ids.has(p.id));
  }
  const ids = new Set(db.assignments.alumnes.filter((a) => a.alumne_id === me.id).map((a) => a.project_id));
  return db.projects.filter((p) => ids.has(p.id));
}

export function createProject(me, d) {
  if (!canCreateProjects(me)) throw new Error('Només admin/professor');
  if (db.projects.some((p) => norm(p.codi) === norm(d.codi))) throw new Error('Codi de projecte duplicat');
  const p = { id: nextId(db.projects), codi: d.codi.trim(), nom: d.nom.trim(), descripcio: (d.descripcio || '').trim(), created_by: me.id };
  db.projects.push(p);
  if (isProfessor(me)) db.assignments.professors.push({ project_id: p.id, professor_id: me.id });
  save();
  return p;
}

export function updateProject(me, id, d) {
  if (!canCreateProjects(me)) throw new Error('Sense permís');
  const p = findProject(id);
  if (!p) throw new Error('Projecte no trobat');
  if (isProfessor(me) && !canAssign(me, id) && p.created_by !== me.id) throw new Error('No és el teu projecte');
  if (d.codi && db.projects.some((x) => x.id !== p.id && norm(x.codi) === norm(d.codi))) throw new Error('Codi duplicat');
  if (d.codi) p.codi = d.codi.trim();
  if (d.nom) p.nom = d.nom.trim();
  if (d.descripcio !== undefined) p.descripcio = d.descripcio.trim();
  save();
  return p;
}

export function deleteProject(me, id) {
  if (!canDeleteProjects(me)) throw new Error('Només l’admin elimina projectes');
  db.projects = db.projects.filter((p) => p.id !== Number(id));
  db.assignments.professors = db.assignments.professors.filter((a) => a.project_id !== Number(id));
  db.assignments.alumnes = db.assignments.alumnes.filter((a) => a.project_id !== Number(id));
  db.assignments.items = db.assignments.items.filter((a) => a.project_id !== Number(id));
  db.grades = db.grades.filter((g) => g.project_id !== Number(id));
  save();
}

// --- ITEMS (només admin crea) ---
export function createItem(me, d) {
  if (!canCreateItems(me)) throw new Error('Només l’admin crea ítems');
  if (db.items.some((i) => norm(i.codi) === norm(d.codi))) throw new Error('Codi d’ítem duplicat');
  const it = { id: nextId(db.items), codi: d.codi.trim(), nom: d.nom.trim(), descripcio: (d.descripcio || '').trim() };
  db.items.push(it); save();
  return it;
}

export function updateItem(me, id, d) {
  if (!canCreateItems(me)) throw new Error('Només l’admin');
  const it = findItem(id);
  if (!it) throw new Error('Ítem no trobat');
  if (d.codi && db.items.some((x) => x.id !== it.id && norm(x.codi) === norm(d.codi))) throw new Error('Codi duplicat');
  if (d.codi) it.codi = d.codi.trim();
  if (d.nom) it.nom = d.nom.trim();
  if (d.descripcio !== undefined) it.descripcio = d.descripcio.trim();
  save();
  return it;
}

export function deleteItem(me, id) {
  if (!canCreateItems(me)) throw new Error('Només l’admin');
  if (db.assignments.items.some((a) => a.item_id === Number(id))) throw new Error('Ítem assignat a projectes');
  db.items = db.items.filter((i) => i.id !== Number(id));
  db.grades = db.grades.filter((g) => g.item_id !== Number(id));
  save();
}

// --- ASSIGNMENTS N-M ---
export function assignProfessor(me, projectId, professorId) {
  if (!canAssign(me, projectId)) throw new Error('Sense permís per assignar');
  const prof = findUser(professorId);
  if (!prof || prof.role !== 'professor') throw new Error('Ha de ser professor');
  if (!db.assignments.professors.some((a) => a.project_id === Number(projectId) && a.professor_id === Number(professorId))) {
    db.assignments.professors.push({ project_id: Number(projectId), professor_id: Number(professorId) });
    save();
  }
}

export function assignAlumne(me, projectId, alumneId) {
  if (!canAssign(me, projectId)) throw new Error('Sense permís per assignar');
  const al = findUser(alumneId);
  if (!al || al.role !== 'alumne') throw new Error('Ha de ser alumne');
  if (!db.assignments.alumnes.some((a) => a.project_id === Number(projectId) && a.alumne_id === Number(alumneId))) {
    db.assignments.alumnes.push({ project_id: Number(projectId), alumne_id: Number(alumneId) });
    save();
  }
}

export function assignItem(me, projectId, itemId) {
  if (!canAssign(me, projectId)) throw new Error('Sense permís per assignar');
  if (!findItem(itemId)) throw new Error('Ítem no trobat');
  if (!db.assignments.items.some((a) => a.project_id === Number(projectId) && a.item_id === Number(itemId))) {
    db.assignments.items.push({ project_id: Number(projectId), item_id: Number(itemId) });
    save();
  }
}

export function unassign(me, kind, projectId, otherId) {
  if (!canAssign(me, projectId)) throw new Error('Sense permís');
  const pid = Number(projectId), oid = Number(otherId);
  if (kind === 'professor') db.assignments.professors = db.assignments.professors.filter((a) => !(a.project_id === pid && a.professor_id === oid));
  if (kind === 'alumne') {
    db.assignments.alumnes = db.assignments.alumnes.filter((a) => !(a.project_id === pid && a.alumne_id === oid));
    db.grades = db.grades.filter((g) => !(g.project_id === pid && g.alumne_id === oid));
  }
  if (kind === 'item') {
    db.assignments.items = db.assignments.items.filter((a) => !(a.project_id === pid && a.item_id === oid));
    db.grades = db.grades.filter((g) => !(g.project_id === pid && g.item_id === oid));
  }
  save();
}

// --- GRADES (mitjana si diversos professors) ---
export function putGrade(me, { project_id, alumne_id, item_id, nota }) {
  if (!canGrade(me)) throw new Error('Només el professorat qualifica');
  project_id = Number(project_id); alumne_id = Number(alumne_id); item_id = Number(item_id);
  const okAl = db.assignments.alumnes.some((a) => a.project_id === project_id && a.alumne_id === alumne_id);
  const okIt = db.assignments.items.some((a) => a.project_id === project_id && a.item_id === item_id);
  const okPr = db.assignments.professors.some((a) => a.project_id === project_id && a.professor_id === me.id) || isAdmin(me);
  if (!okAl) throw new Error('Alumne no assignat al projecte');
  if (!okIt) throw new Error('Ítem no assignat al projecte');
  if (!okPr && !db.projects.some((p) => p.id === project_id)) throw new Error('Projecte no trobat');
  const existing = db.grades.find(
    (g) => g.project_id === project_id && g.alumne_id === alumne_id && g.item_id === item_id && g.professor_id === me.id
  );
  if (existing) existing.nota = Number(nota);
  else db.grades.push({ id: nextId(db.grades), project_id, alumne_id, item_id, professor_id: me.id, nota: Number(nota) });
  save();
}

export function averageGrade(projectId, alumneId, itemId) {
  const notes = db.grades.filter(
    (g) => g.project_id === Number(projectId) && g.alumne_id === Number(alumneId) && g.item_id === Number(itemId)
  );
  if (!notes.length) return null;
  const sum = notes.reduce((a, g) => a + Number(g.nota), 0);
  return Math.round((sum / notes.length) * 10) / 10;
}

export function gradesForAlumneProject(alumneId, projectId) {
  const itemIds = db.assignments.items.filter((a) => a.project_id === Number(projectId)).map((a) => a.item_id);
  return itemIds.map((itemId) => ({
    item: findItem(itemId),
    mitjana: averageGrade(projectId, alumneId, itemId),
    detall: db.grades.filter((g) => g.project_id === Number(projectId) && g.alumne_id === Number(alumneId) && g.item_id === Number(itemId)),
  }));
}

// --- DASHBOARDS agregats ---
export function dashboardAdmin() {
  const byRole = { admin: 0, professor: 0, alumne: 0 };
  db.users.forEach((u) => { if (byRole[u.role] !== undefined) byRole[u.role] += 1; });
  const avgAll = db.grades.length
    ? Math.round((db.grades.reduce((a, g) => a + Number(g.nota), 0) / db.grades.length) * 10) / 10
    : null;
  return {
    usuaris: db.users.length, byRole,
    projectes: db.projects.length, items: db.items.length, notes: db.grades.length, mitjanaGlobal: avgAll,
  };
}

export function dashboardProfessor(me) {
  const projects = listProjectsFor(me);
  return projects.map((p) => {
    const alumnes = db.assignments.alumnes.filter((a) => a.project_id === p.id).map((a) => findUser(a.alumne_id)).filter(Boolean);
    const items = db.assignments.items.filter((a) => a.project_id === p.id).map((a) => findItem(a.item_id)).filter(Boolean);
    const notes = db.grades.filter((g) => g.project_id === p.id);
    return { project: p, nAlumnes: alumnes.length, nItems: items.length, nNotes: notes.length, alumnes };
  });
}

export function dashboardAlumne(me) {
  const projects = listProjectsFor(me);
  return projects.map((p) => {
    const rows = gradesForAlumneProject(me.id, p.id);
    const vals = rows.map((r) => r.mitjana).filter((v) => v !== null);
    const mitjana = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    return { project: p, rows, mitjana };
  });
}
