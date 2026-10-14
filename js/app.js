// Fetches courses from the API and renders them into #courses
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("site-title").textContent = CONFIG.site.name;
  document.getElementById("year").textContent = new Date().getFullYear();
  loadCourses();
});

async function loadCourses() {
  const container = document.getElementById("courses");

  try {
    const response = await fetch(CONFIG.api.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const courses = await response.json();

    if (!courses.length) {
      container.innerHTML = '<p class="status">No courses available yet.</p>';
      return;
    }

    container.innerHTML = "";
    courses.forEach((course) => container.appendChild(renderCourse(course)));
  } catch (err) {
    console.error("Failed to load courses:", err);
    container.innerHTML = '<p class="status">Could not load courses. Please try again later.</p>';
  }
}

function renderCourse(course) {
  const card = document.createElement("article");
  card.className = "course-card";

  const title = document.createElement("h2");
  title.textContent = course.title;

  const description = document.createElement("p");
  description.textContent = course.description || "";

  card.append(title, description);
  return card;
}
