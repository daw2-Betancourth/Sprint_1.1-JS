// Errors i avisos amb alerts Bootstrap + gp-status. Sense lògica de negoci.
export function showAlert(msg, type = 'error') {
  const box = document.getElementById('alerts');
  if (!box) return;
  const cls = type === 'error' ? 'alert-danger' : 'alert-success';
  const el = document.createElement('div');
  el.className = `alert ${cls} alert-dismissible fade show`;
  el.setAttribute('role', 'alert');
  el.innerHTML = `<span></span><button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Tanca"></button>`;
  el.querySelector('span').textContent = msg;
  box.appendChild(el);
  setTimeout(() => { try { el.remove(); } catch { /* ja tancat */ } }, 4500);
}

export function showFieldErrors(form, errors) {
  form.querySelectorAll('[data-err]').forEach((s) => { s.textContent = ''; });
  form.querySelectorAll('.is-invalid').forEach((i) => i.classList.remove('is-invalid'));
  Object.entries(errors).forEach(([k, v]) => {
    const s = form.querySelector(`[data-err="${k}"]`);
    if (s) { s.textContent = v; s.classList.add('invalid-feedback'); s.classList.add('d-block'); }
    const input = form.querySelector(`[name="${k}"]`);
    if (input) input.classList.add('is-invalid');
  });
}

export function handleAsyncError(err) {
  console.error(err);
  showAlert(err?.message || 'Error inesperat');
}
