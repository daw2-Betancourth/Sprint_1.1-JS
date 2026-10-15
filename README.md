# Sprint 1.1-JS · M0612 (HTML + JS vanilla)

Proyecto aparte de `Sprint_1.1`. Solo parte evaluable M0612: JavaScript moderno sin frameworks.

## Ejecutar (obligatorio con HTTP por `fetch` + ES modules)

```bash
cd ~/Proyectos/Sprint_1.1-JS
python3 -m http.server 8000
# abrir http://localhost:8000
```

No abrir con `file://`.

## Usuarios demo (en `data/*.json`, no en el código)

- admin / admin123 (rol admin, único)
- prof1 / prof123, prof2 / prof123
- alum1 / alum123, alum2 / alum123, alum3 / alum123

Sin registro.

## Persistencia: fetch JSON + localStorage overlay

1. `assets/js/api/client.js:loadDatabase()` hace `fetch()` en paralelo a `data/*.json`.
2. Guarda en `localStorage[sprint11_js_db_v1]`.
3. CRUD escribe siempre en `localStorage` (para restaurar, borrar la clave del navegador).
4. Sesión en `sessionStorage` (solo `{id,username,role,nom}`, nunca contraseñas).

## Estructura

```text
index.html (shell, Tailwind CDN, <script type="module">)
assets/css/styles.css (mínimo)
assets/js/
  main.js (router hash #/dashboard|users|projects|items|assignments|grades)
  api/client.js (fetch + persist)
  models/store.js (negocio + RBAC + mitjana)
  views/*.js (DOM + events por pantalla)
  components/table.js, navbar.js (genéricos Tailwind)
  utils/validation.js, errors.js
data/*.json
```

## M612 checklist

- [x] ES moderno, mòduls `import/export`
- [x] DOM + `addEventListener`, JS separat de HTML
- [x] `fetch()` + `async/await` + `Promise.all`, errors amb `try/catch`
- [x] JSON com a intercanvi
- [x] Validació client (`utils/validation.js`)
- [x] Sense secrets al codi JS (demo solo en JSON)
- [x] Tailwind genèric (cards, tables, forms), sense framework JS

## Reglas implementadas

- Solo admin crea users/items, y solo un admin.
- Proyectos crean admin/professor; elimina solo admin.
- Asignaciones N-M en `assignments.js`.
- Notas: profesor por proyecto+alumne+ítem; si varios profesores → media en `store.js:averageGrade()`.
- Dashboards agregados por rol en `views/dashboard.js`.
