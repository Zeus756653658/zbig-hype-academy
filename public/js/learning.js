let learningState = { course: null, lessons: [], progress: [], currentIndex: 0 };
async function initLearning() {
  requireAuth();
  const slug = new URLSearchParams(location.search).get("course");
  const data = await api(`/api/learn/${slug}`, { headers: authHeaders() }).catch(err => { document.body.innerHTML = `<main class="centered"><h1>Access denied</h1><p>${escapeHtml(err.message)}</p><a class="btn" href="dashboard.html">Go to Dashboard</a></main>`; throw err; });
  learningState.course = data.course;
  learningState.lessons = data.lessons;
  learningState.progress = data.progress;
  renderLearning();
}
function renderLearning() {
  document.querySelector("#learnTitle").textContent = learningState.course.title;
  document.querySelector("#lessonList").innerHTML = learningState.course.modules.map(module => `<details open><summary>${escapeHtml(module.title)}</summary>${module.lessons.map(lesson => `<button class="lesson-link" data-lesson="${lesson.id}">${escapeHtml(lesson.title)} <span>${lesson.duration}</span></button>`).join("")}</details>`).join("");
  const current = learningState.lessons[learningState.currentIndex];
  document.querySelector("#currentLesson").textContent = current.title;
  document.querySelector("#lessonDuration").textContent = current.duration;
  const completed = learningState.progress.filter(p => p.completed).length;
  document.querySelector("#learningProgress").style.width = `${Math.round((completed / learningState.lessons.length) * 100)}%`;
  document.querySelector("#markComplete").onclick = () => completeLesson(current.id);
}
async function completeLesson(lessonId) {
  const slug = new URLSearchParams(location.search).get("course");
  const data = await api(`/api/learn/${slug}/${lessonId}/complete`, { method: "POST", headers: authHeaders() });
  learningState.progress.push({ lesson_id: lessonId, completed: 1 });
  renderLearning();
}
