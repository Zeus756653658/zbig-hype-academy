async function handleSignup(form) {
  const body = Object.fromEntries(new FormData(form).entries());
  if (body.password !== body.confirm_password) throw new Error("Passwords do not match");
  const data = await api("/api/auth/signup", { method: "POST", body: JSON.stringify(body) });
  setToken(data.token); location.href = "dashboard.html";
}
async function handleLogin(form) {
  const body = Object.fromEntries(new FormData(form).entries());
  const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify(body) });
  setToken(data.token); location.href = "dashboard.html";
}
