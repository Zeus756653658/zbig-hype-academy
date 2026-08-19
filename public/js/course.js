async function initCourseDetail() {
  const slug = new URLSearchParams(location.search).get("slug");
  const data = await api(`/api/courses/${slug}`);
  document.querySelector("#courseHero").style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,.2), rgba(7,7,11,.92)), url('${data.image}')`;
  document.querySelector("#courseTitle").textContent = data.title;
  document.querySelector("#courseDesc").textContent = data.full_description;
  document.querySelector("#courseInfo").innerHTML = `${data.instructor} · ${data.duration} · ${data.lessons_count} lessons · ${data.level}`;
  document.querySelector("#coursePrice").textContent = money(data.price);
  document.querySelector("#learnOutcomes").innerHTML = data.learning_outcomes.map(v => `<li>${escapeHtml(v)}</li>`).join("");
  document.querySelector("#requirements").innerHTML = data.requirements.map(v => `<li>${escapeHtml(v)}</li>`).join("");
  document.querySelector("#buyNow").href = `payment.html?course=${data.slug}`;
  document.querySelector("#curriculum").innerHTML = data.modules.map(module => `
    <details class="accordion-item"><summary>${escapeHtml(module.title)}</summary>
      <div class="accordion-body">${module.lessons.map(lesson => `<div class="lesson-row"><span>${escapeHtml(lesson.title)}</span><span>${escapeHtml(lesson.duration)}</span></div>`).join("")}</div>
    </details>`).join("");
}
