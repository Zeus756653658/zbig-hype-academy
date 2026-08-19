const API = "";

function getToken() {
  return localStorage.getItem("zbig_token");
}

function setToken(token) {
  localStorage.setItem("zbig_token", token);
}

function clearToken() {
  localStorage.removeItem("zbig_token");
}

function authHeaders(extra = {}) {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: authHeaders({ "Content-Type": "application/json", ...(options.headers || {}) })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function money(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function requireAuth(redirect = "login.html") {
  if (!getToken()) location.href = redirect;
}

function logout() {
  clearToken();
  location.href = "index.html";
}
