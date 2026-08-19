async function initPayment() {
  const slug = new URLSearchParams(location.search).get("course");
  const data = await api(`/api/courses/${slug}`);
  const priceLabel = data.currency === "INR" ? `${money(data.price)} INR` : money(data.price);
  document.querySelector("#paymentCourse").textContent = data.title;
  document.querySelector("#paymentCategory").textContent = data.category;
  document.querySelector("#paymentAmount").textContent = priceLabel;
  document.querySelector("#paymentTotal").textContent = priceLabel;
  document.querySelector("#payForm input[name=course_slug]").value = data.slug;

  const qrPanel = document.querySelector(".panel");
  if (data.pdfUrl) {
    const existing = document.querySelector("#paymentPdfLink");
    if (!existing) {
      qrPanel.insertAdjacentHTML(
        "beforeend",
        `<div style="margin-top:16px"><a id="paymentPdfLink" class="btn btn-secondary" href="${escapeHtml(data.pdfUrl)}" target="_blank" rel="noopener noreferrer">Download Course PDF</a></div>`
      );
    }
  }
}
async function submitPayment(form) {
  const body = Object.fromEntries(new FormData(form).entries());
  if (!getToken()) { location.href = `login.html?next=${encodeURIComponent(location.pathname + location.search)}`; return; }
  const data = await api("/api/payment/confirm", { method: "POST", body: JSON.stringify(body), headers: authHeaders() });
  location.href = `payment-success.html?id=${data.payment_id}`;
}
