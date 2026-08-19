async function initPayment() {
  const slug = new URLSearchParams(location.search).get("course");
  const data = await api(`/api/courses/${slug}`);
  document.querySelector("#paymentCourse").textContent = data.title;
  document.querySelector("#paymentCategory").textContent = data.category;
  document.querySelector("#paymentAmount").textContent = money(data.price);
  document.querySelector("#paymentTotal").textContent = money(data.price);
  document.querySelector("#payForm input[name=course_slug]").value = data.slug;
}
async function submitPayment(form) {
  const body = Object.fromEntries(new FormData(form).entries());
  if (!getToken()) { location.href = `login.html?next=${encodeURIComponent(location.pathname + location.search)}`; return; }
  const data = await api("/api/payment/confirm", { method: "POST", body: JSON.stringify(body), headers: authHeaders() });
  location.href = `payment-success.html?id=${data.payment_id}`;
}
