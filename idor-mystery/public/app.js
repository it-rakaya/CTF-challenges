async function getJSON(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin'
  });
  let body = null;
  try { body = await res.json(); } catch (e) { /* ignore */ }
  return { status: res.status, ok: res.ok, body };
}

async function requireUser() {
  const r = await getJSON('/api/me');
  if (!r.ok) { window.location.href = '/'; return null; }
  return r.body.username;
}

function renderNav(username, active) {
  const nav = document.getElementById('nav');
  nav.innerHTML =
    '<div class="nav-inner">' +
      '<a class="brand" href="/dashboard">ShopNest</a>' +
      '<div class="links">' +
        '<a href="/dashboard" class="' + (active === 'dashboard' ? 'active' : '') + '">Dashboard</a>' +
        '<a href="/orders" class="' + (active === 'orders' ? 'active' : '') + '">My Orders</a>' +
      '</div>' +
      '<div class="user"><span id="nav-user"></span>' +
        '<button id="logout-btn" class="btn btn-small btn-light">Logout</button></div>' +
    '</div>';
  document.getElementById('nav-user').textContent = username;
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/';
  });
}

function money(n) {
  return '$' + Number(n).toLocaleString('en-US');
}
