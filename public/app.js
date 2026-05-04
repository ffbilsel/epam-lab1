// Shared client helpers (wrapped in IIFE so names don't leak to global scope)
(function () {
async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.data = data;
    throw err;
  }
  return data;
}

function showMsg(el, text, type = 'error') {
  el.textContent = text;
  el.className = `msg ${type}`;
  el.style.display = 'block';
}

function clearMsg(el) {
  el.textContent = '';
  el.style.display = 'none';
}

// Password strength: 0-5 score
function passwordScore(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function bindStrengthMeter(input, bar, hint) {
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981'];
  input.addEventListener('input', () => {
    const s = passwordScore(input.value);
    bar.style.width = `${(s / 5) * 100}%`;
    bar.style.background = colors[s];
    if (hint) hint.textContent = input.value ? labels[s] : 'Use 8+ chars with upper, lower, number, symbol.';
  });
}

window.AuthClient = { api, showMsg, clearMsg, passwordScore, bindStrengthMeter };
})();
