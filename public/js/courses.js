async function loadCourses(target, params = {}) {
  const query = new URLSearchParams(params).toString();
  return api(`/api/courses${query ? `?${query}` : ""}`).then((data) => { renderCourses(target, data.courses || []); return data.courses || []; });
}
function renderCourses(target, courses) {
  const el = document.querySelector(target);
  el.innerHTML = courses.map(course => `
    <article class="course-card">
      <img src="${course.image}" alt="${escapeHtml(course.title)}">
      <div class="course-meta">${escapeHtml(course.category)}</div>
      <h3>${escapeHtml(course.title)}</h3>
      <p>${escapeHtml(course.short_description)}</p>
      <div class="course-foot"><span>${escapeHtml(course.instructor)}</span><span>${money(course.price)}</span></div>
      <a class="btn btn-secondary" href="course.html?slug=${course.slug}">View Course</a>
    </article>`).join("");
}
