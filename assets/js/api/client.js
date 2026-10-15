// Cliente de persistencia: fetch JSON inicial + overlay en localStorage.
// Toda función es async para cumplir M612 (fetch + async/await + JSON).

const DB_KEY = 'sprint11_js_db_v1';
const SESSION_KEY = 'sprint11_js_session_v1';

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`No s'ha pogut carregar ${path} (${res.status})`);
  return res.json();
}

export async function loadDatabase() {
  const cached = localStorage.getItem(DB_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem(DB_KEY);
    }
  }
  // Primera càrrega: 5 fetch en paral·lel
  const [users, projects, items, assignments, grades] = await Promise.all([
    fetchJson('./data/users.json'),
    fetchJson('./data/projects.json'),
    fetchJson('./data/items.json'),
    fetchJson('./data/assignments.json'),
    fetchJson('./data/grades.json'),
  ]);
  const db = { users, projects, items, assignments, grades };
  persist(db);
  return db;
}

export function persist(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export async function resetDatabase() {
  localStorage.removeItem(DB_KEY);
  return loadDatabase();
}

// Sessió (només id d'usuari, mai contrasenyes ni tokens reals)
export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function setSession(data) {
  if (!data) sessionStorage.removeItem(SESSION_KEY);
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}
