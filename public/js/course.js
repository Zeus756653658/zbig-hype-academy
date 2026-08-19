async function initCourseDetail() {
  const slug = new URLSearchParams(location.search).get("slug");
  const data = await api(`/api/courses/${slug}`);
  const priceLabel = data.currency === "INR" ? `${money(data.price)} INR` : money(data.price);

  document.querySelector("#courseHero").style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,.2), rgba(7,7,11,.92)), url('${data.image}')`;
  document.querySelector("#courseTitle").textContent = data.title;
  document.querySelector("#courseDesc").textContent = data.full_description;
  document.querySelector("#courseInfo").innerHTML = `${data.instructor} Â· ${data.duration} Â· ${data.lessons_count} lessons Â· ${data.level}`;
  document.querySelector("#coursePrice").textContent = priceLabel;
  document.querySelector("#learnOutcomes").innerHTML = data.learning_outcomes.map((v) => `<li>${escapeHtml(v)}</li>`).join("");
  document.querySelector("#requirements").innerHTML = data.requirements.map((v) => `<li>${escapeHtml(v)}</li>`).join("");
  document.querySelector("#buyNow").href = `payment.html?course=${data.slug}`;

  if (data.pdfUrl) {
    document.querySelector("#buyNow").insertAdjacentHTML(
      "afterend",
      `<a class="btn btn-secondary" href="${escapeHtml(data.pdfUrl)}" target="_blank" rel="noopener noreferrer">Download Course PDF</a>`
    );
  }

  if (data.level && data.level.toLowerCase().includes("beginner")) {
    document.querySelector("#courseTitle").insertAdjacentHTML("beforebegin", `<div class="badge">Beginner-friendly</div>`);
  }

  document.querySelector("#curriculum").innerHTML = data.modules.map(
    (module) => `
    <details class="accordion-item"><summary>${escapeHtml(module.title)}</summary>
      <div class="accordion-body">${module.lessons
        .map((lesson) => `<div class="lesson-row"><span>${escapeHtml(lesson.title)}</span><span>${escapeHtml(lesson.duration)}</span></div>`)
        .join("")}</div>
    </details>`
  ).join("");
}
