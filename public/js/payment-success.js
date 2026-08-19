async function initPaymentSuccess() {
  const id = new URLSearchParams(location.search).get("id");
  const data = await api(`/api/payment/${id}`);
  document.querySelector("#successCourse").textContent = data.course.title;
  document.querySelector("#successAmount").textContent = money(data.payment.amount);
  document.querySelector("#successTxn").textContent = data.payment.transaction_id;
  document.querySelector("#successStatus").textContent = data.payment.status;
  document.querySelector("#successDate").textContent = data.payment.created_at;
}
