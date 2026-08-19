async function initDashboard() {
  requireAuth();
  try {
    const data = await api("/api/dashboard", { headers: authHeaders() });
    document.querySelector("#welcome").textContent = `Welcome back, ${data.user.name}`;
    document.querySelector("#stats").innerHTML = `<div class="stat"><strong>${data.enrolled_courses.length}</strong><span>Enrolled</span></div><div class="stat"><strong>${data.completed_lessons}</strong><span>Completed</span></div><div class="stat"><strong>${data.total_lessons}</strong><span>Total lessons</span></div>`;
    document.querySelector("#enrollments").innerHTML = data.enrolled_courses.map(course => `
      <article class="dash-card">
        <img src="${course.image}" alt="${escapeHtml(course.title)}">
        <div><div class="badge">${course.enrollment_status === "active" ? "Active" : "Payment Pending Verification"}</div><h3>${escapeHtml(course.title)}</h3><p>${course.short_description}</p><div class="progress"><span style="width:${course.progress_percent}%"></span></div><div class="course-foot"><span>${course.completed_lessons}/${course.total_lessons}</span><a href="${course.enrollment_status === "active" ? `learn.html?course=${course.slug}` : `payment.html?course=${course.slug}`}">${course.enrollment_status === "active" ? "Continue Learning" : "Complete Payment"}</a></div></div>
      </article>`).join("");
  } catch (e) { clearToken(); location.href = "login.html"; }
}
