/* =====================================================================
   app.js: makes the page work.
   =====================================================================

   This file contains NO site-specific values. Everything it needs
   (text, colours, contact details, API settings) comes from the CONFIG
   object defined in config.js, which index.html loads first.

   What it does, in order:
     1. Applies the site settings (colours, text, logo, contact details).
     2. Fills in the page sections (welcome, about, testimonials) and
        builds the navigation links in the header.
     3. Loads the courses (mock file or live API, see CONFIG.useMockData).
     4. Builds a card for each course, or shows a loading, empty or
        error message.

   SECURITY NOTE: all text is inserted with `textContent`, which
   treats it as plain text. We never use `innerHTML` with values from
   config or the API, so nothing in them can inject HTML or scripts.
   ===================================================================== */


// Only these kinds of link are allowed in a course's booking URL.
// Anything else (for example "javascript:...", which would run code when
// clicked) is ignored and the fallback link from config.js is used instead.
// Declared before start-up below, because a `const` can't be used before
// the line that creates it has run.
const SAFE_URL_PROTOCOLS = ["http:", "https:", "mailto:"];

// The shapes of the footer contact icons, as SVG path data on a 24×24
// grid. Each icon is a list of one or more paths. (Also declared before
// start-up, because the footer is built straight away.)
// Icon shapes: Feather Icons "mail", "phone" and "map-pin", MIT licence.
const CONTACT_ICONS = {
  email: [
    "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z",
    "M22 6l-10 7L2 6",
  ],
  phone: [
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 " +
    "19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 " +
    ".7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 " +
    "12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  ],
  address: [
    "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z",
    "M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z", // the circle inside the pin
  ],
};


/* ---------------------------------------------------------------------
   Start-up
   Scripts are loaded at the end of <body>, so the HTML above already
   exists by the time this runs.
   --------------------------------------------------------------------- */
applySiteSettings();
renderPageSections(CONFIG.sections);
renderNavigation(CONFIG.navigation); // after the sections, so it can skip hidden ones
highlightCurrentSection();
setUpMobileMenu();
setUpRetryButton();
loadCourses();


/**
 * Copies settings from CONFIG onto the page: colours, text, logo,
 * contact details and the copyright year.
 */
function applySiteSettings() {
  applyColours(CONFIG.colours);

  const site = CONFIG.site;

  // Browser tab title and search-engine description.
  document.title = site.name;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", site.metaDescription);
  }

  // Simple text slots marked in the HTML with data-config="...".
  setText("site-name", site.name);
  setText("tagline", site.tagline);
  setText("intro", site.intro);
  setText("hero-button", site.heroButtonLabel);
  setText("owner", site.owner);

  applyLogo(site.logo);
  renderContactDetails(site.contact);

  // The current year, so the copyright line never goes out of date.
  document.getElementById("year").textContent = new Date().getFullYear();
}


/**
 * Turns each entry in CONFIG.colours into a CSS custom property on the
 * <html> element. For example, `primaryHover` becomes
 * `--color-primary-hover`, which styles.css then uses.
 */
function applyColours(colours) {
  const root = document.documentElement; // the <html> element

  for (const [name, value] of Object.entries(colours)) {
    // Convert camelCase to kebab-case: "primaryHover" → "primary-hover".
    const cssName = name.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase());
    root.style.setProperty("--color-" + cssName, value);
  }
}


/**
 * Sets the text of every element marked data-config="<key>".
 * If the value is empty, the element is hidden instead, so we don't
 * leave an empty gap on the page.
 */
function setText(key, value) {
  const elements = document.querySelectorAll(`[data-config="${key}"]`);

  elements.forEach((element) => {
    if (value) {
      element.textContent = value;
      element.hidden = false;
    } else {
      element.hidden = true;
    }
  });
}


/**
 * If config.js gives a logo image path, replace the text logo with an
 * <img>. Otherwise keep the text logo (the site name).
 */
function applyLogo(logo) {
  if (!logo || !logo.src) {
    return; // text logo: nothing to change
  }

  const image = document.createElement("img");
  image.src = logo.src;
  image.alt = logo.alt || CONFIG.site.name; // alt text is required for accessibility
  image.className = "logo__image";

  const link = document.getElementById("logo-link");
  link.replaceChildren(image); // removes the text logo and inserts the image
}


/**
 * Builds the footer contact list. Email and phone become clickable
 * links (mailto: / tel:). Empty values are skipped.
 */
function renderContactDetails(contact) {
  const list = document.getElementById("contact-list");
  list.replaceChildren(); // start empty

  if (contact.email) {
    list.append(createContactItem("Email", contact.email, "mailto:" + contact.email, "email"));
  }

  // One line per phone number in the list. `|| []` means a missing
  // `phones` setting counts as an empty list instead of causing an error.
  for (const phone of contact.phones || []) {
    if (phone) {
      list.append(createPhoneItem(phone));
    }
  }

  if (contact.address) {
    list.append(createContactItem("Address", contact.address, "", "address"));
  }
}


/**
 * Creates one <li> for the contact list, e.g. "Email: info@example.ie".
 * If `href` is given, the value becomes a link.
 * If `iconName` is given (a key of CONTACT_ICONS), an icon is shown
 * instead of the label. The label is still there for screen readers.
 */
function createContactItem(label, value, href, iconName) {
  const item = document.createElement("li");

  const labelSpan = document.createElement("span");
  labelSpan.textContent = label + ": ";
  item.append(labelSpan);

  if (iconName) {
    // Hide the label visually, but keep it for screen readers so they
    // still announce e.g. "Phone: +353 ...". Then put the icon in front.
    labelSpan.className = "visually-hidden";
    item.prepend(createIcon(iconName));
  }

  if (href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = value;
    item.append(link);
  } else {
    // Wrapped in a <span> so long text (like the address) wraps neatly
    // beside the icon instead of underneath it.
    const text = document.createElement("span");
    text.textContent = value;
    item.append(text);
  }

  return item;
}


/**
 * Creates a contact list item for a phone number, with a phone icon.
 */
function createPhoneItem(phone) {
  // A tel: link may only contain digits and "+", so strip out spaces and
  // any text such as "(Cork)". The visible number keeps them.
  const dialable = phone.replace(/[^\d+]/g, "");
  return createContactItem("Phone", phone, "tel:" + dialable, "phone");
}



/**
 * Builds a small icon as an inline SVG. SVG elements must be created
 * with createElementNS and the SVG "namespace", otherwise the browser
 * treats them as unknown HTML tags and draws nothing.
 */
function createIcon(name) {
  const svgNamespace = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("class", "contact-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true"); // decorative: the hidden label describes it
  svg.setAttribute("focusable", "false");  // stops older browsers tabbing to it

  for (const pathData of CONTACT_ICONS[name]) {
    const path = document.createElementNS(svgNamespace, "path");
    path.setAttribute("d", pathData);
    svg.append(path);
  }

  return svg;
}


/* =====================================================================
   PAGE SECTIONS AND NAVIGATION
   ===================================================================== */

/**
 * Fills in the welcome, about and testimonials sections from
 * CONFIG.sections.
 */
function renderPageSections(sections) {
  renderTextSection("welcome", sections.welcome);
  renderTextSection("about", sections.about);
  renderTestimonials(sections.testimonials);
}


/**
 * Fills a simple text section: its heading, then one <p> per item in
 * `content.paragraphs`. If there is no content, the whole section is
 * hidden instead of leaving an empty gap.
 */
function renderTextSection(sectionId, content) {
  const section = document.getElementById(sectionId);
  const paragraphs = (content && content.paragraphs) || [];

  if (!content || (!content.heading && paragraphs.length === 0)) {
    section.hidden = true;
    return;
  }

  section.querySelector(".section-title").textContent = content.heading;

  const body = section.querySelector(".section-body");
  body.replaceChildren(...paragraphs.map((text) => createElementWithText("p", "", text)));

  renderSectionImage(section, content.image);
}


/**
 * Adds a section's picture (from CONFIG.sections.<name>.image) to its
 * .section-media box. With no picture, the box is hidden and the
 * "section-layout--no-media" class tells styles.css to use one column.
 */
function renderSectionImage(section, image) {
  const media = section.querySelector(".section-media");
  if (!media) {
    return; // this section has no space for a picture
  }

  const hasImage = Boolean(image && image.src);
  media.hidden = !hasImage;
  section.querySelector(".section-layout").classList.toggle("section-layout--no-media", !hasImage);

  if (!hasImage) {
    return;
  }

  const img = document.createElement("img");
  img.className = "section-media__image";
  img.setAttribute("src", image.src);
  // alt="" is deliberate for decorative pictures: it tells screen readers
  // to skip the image. (Leaving alt out entirely would make some screen
  // readers read out the file name instead.)
  img.setAttribute("alt", image.alt || "");
  // "lazy" waits to download the picture until the visitor scrolls near
  // it, so the top of the page loads faster.
  img.setAttribute("loading", "lazy");

  media.replaceChildren(img);
}


/**
 * Builds one card per testimonial, or hides the section if there are none.
 */
function renderTestimonials(content) {
  const section = document.getElementById("testimonials");
  const items = (content && content.items) || [];

  if (items.length === 0) {
    section.hidden = true;
    return;
  }

  section.querySelector(".section-title").textContent = content.heading;

  const list = document.getElementById("testimonial-list");
  list.replaceChildren(...items.map((testimonial) => {
    const item = document.createElement("li");
    item.append(createTestimonial(testimonial));
    return item;
  }));
}


/**
 * Builds one testimonial:
 *   <figure class="testimonial">
 *     <blockquote><p>The quote</p></blockquote>
 *     <figcaption>Name <span>Role</span></figcaption>
 *   </figure>
 */
function createTestimonial(testimonial) {
  const figure = document.createElement("figure");
  figure.className = "testimonial";

  const quote = document.createElement("blockquote");
  quote.className = "testimonial__quote";
  quote.append(createElementWithText("p", "", testimonial.quote));

  const caption = document.createElement("figcaption");
  caption.className = "testimonial__credit";
  caption.append(createElementWithText("span", "testimonial__name", testimonial.name));

  if (testimonial.role) {
    caption.append(createElementWithText("span", "testimonial__role", testimonial.role));
  }

  figure.append(quote, caption);
  return figure;
}


/**
 * Builds the header links from CONFIG.navigation. Each link points at a
 * section's id, e.g. href="#about"; clicking it scrolls to that section.
 * Links to sections that don't exist or are hidden are left out.
 */
function renderNavigation(links) {
  const items = [];

  for (const link of links) {
    const target = document.getElementById(link.target);

    if (!target) {
      // Most likely a typo in config.js. Tell the maintainer in the console.
      console.warn(`Navigation: no section with id "${link.target}", so the "${link.label}" link was left out.`);
      continue;
    }

    if (target.hidden) {
      continue; // the section has no content, so don't link to it
    }

    const anchor = document.createElement("a");
    anchor.className = "site-nav__link";
    anchor.href = "#" + link.target;
    anchor.textContent = link.label;

    const item = document.createElement("li");
    item.append(anchor);
    items.push(item);
  }

  document.getElementById("site-nav").replaceChildren(...items);

  // No links at all? Hide the whole menu, including the mobile button.
  document.querySelector(".site-nav").hidden = items.length === 0;
}


/**
 * Makes the mobile "Menu" button open and close the list of links.
 * (On larger screens the button is hidden by CSS and the links are
 * always visible, so none of this has any effect there.)
 *
 * The menu closes when the visitor:
 *   - clicks the button again
 *   - picks a link (so they can see the section they jumped to)
 *   - presses Escape (focus goes back to the button, so keyboard users
 *     aren't left stranded)
 *   - clicks or taps anywhere outside the menu
 */
function setUpMobileMenu() {
  const toggle = document.getElementById("nav-toggle");
  const nav = toggle.closest(".site-nav");
  const list = document.getElementById("site-nav");

  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

  toggle.addEventListener("click", () => {
    setMenuOpen(toggle, nav, !isOpen());
  });

  // One listener on the whole list (rather than one per link) catches
  // clicks on any link inside it. This is called "event delegation".
  list.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setMenuOpen(toggle, nav, false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      setMenuOpen(toggle, nav, false);
      toggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (isOpen() && !nav.contains(event.target)) {
      setMenuOpen(toggle, nav, false);
    }
  });
}


/**
 * Opens or closes the mobile menu. aria-expanded tells screen readers
 * the button's state; the "site-nav--open" class shows the list (see
 * styles.css).
 */
function setMenuOpen(toggle, nav, open) {
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("site-nav--open", open);
}


/**
 * Highlights the menu link for the section currently on screen, and
 * keeps it up to date as the visitor scrolls.
 *
 * How: an IntersectionObserver is a browser feature that tells us when
 * an element enters or leaves an area of the window, without us having
 * to check on every scroll movement. Our "area" is a thin band about a
 * third of the way down the window: whichever section is crossing that
 * band counts as the current one.
 */
function highlightCurrentSection() {
  const links = [...document.querySelectorAll(".site-nav__link")];

  // Very old browsers don't have IntersectionObserver. The menu still
  // works there, just without the highlight.
  if (!("IntersectionObserver" in window) || links.length === 0) {
    return;
  }

  // Pair each section with its menu link. link.hash is e.g. "#about",
  // so .slice(1) gives the section's id, "about".
  const linkForSection = new Map();
  for (const link of links) {
    linkForSection.set(document.getElementById(link.hash.slice(1)), link);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setCurrentLink(links, linkForSection.get(entry.target));
        }
      }
    },
    {
      // rootMargin shrinks the watched area: 30% off the top and 69% off
      // the bottom leaves a band 1% tall, 30% of the way down the window.
      rootMargin: "-30% 0px -69% 0px",
    }
  );

  for (const section of linkForSection.keys()) {
    observer.observe(section);
  }
}


/**
 * Marks one menu link as current and un-marks the others.
 * aria-current="location" tells screen readers "this link is where you
 * are now"; styles.css uses the same attribute for the highlight.
 */
function setCurrentLink(links, currentLink) {
  for (const link of links) {
    if (link === currentLink) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}


/* =====================================================================
   COURSES: loading, states and cards
   ===================================================================== */


/**
 * Fetches the courses and shows them, or shows the right message if
 * something goes wrong. Called on page load and by the "Try again" button.
 */
async function loadCourses() {
  showCoursesState("loading");

  try {
    const courses = await fetchCourses();

    if (courses.length === 0) {
      showCoursesState("empty");
      return;
    }

    renderCourses(sortByNextDate(courses));
    showCoursesState("loaded");
  } catch (error) {
    // The visitor sees a friendly message. The technical detail goes to
    // the browser console (F12 → Console) to help whoever maintains the site.
    console.error("Could not load courses:", error);
    showCoursesState("error");
  }
}


/**
 * Shows the element for one state and hides the others.
 *   "loading" : the "Loading courses…" message
 *   "empty"   : the request worked but there are no courses
 *   "error"   : the request failed (with a "Try again" button)
 *   "loaded"  : the list of course cards
 */
function showCoursesState(state) {
  document.getElementById("courses-loading").hidden = state !== "loading";
  document.getElementById("courses-empty").hidden = state !== "empty";
  document.getElementById("courses-error").hidden = state !== "error";
  document.getElementById("course-list").hidden = state !== "loaded";

  // aria-busy tells screen readers this section is still being updated.
  document.getElementById("courses").setAttribute("aria-busy", String(state === "loading"));
}


/**
 * Makes the "Try again" button reload the courses.
 */
function setUpRetryButton() {
  const button = document.getElementById("courses-retry");

  button.addEventListener("click", async () => {
    await loadCourses();

    // The button is now hidden, so keyboard focus would be "lost". If the
    // retry worked, move focus to the section heading so keyboard and
    // screen reader users carry on from a sensible place. (If it failed
    // again, the button is visible again and still has focus.)
    if (document.getElementById("courses-error").hidden) {
      document.getElementById("courses-heading").focus();
    }
  });
}


/* ---------------------------------------------------------------------
   Fetching the data
   --------------------------------------------------------------------- */

/**
 * Downloads the courses and returns them as a list, tidied up and ready
 * for the cards (see prepareCourses() below).
 * Throws an error if the request fails, times out or returns something
 * that isn't a list, so loadCourses() can show the error state.
 */
async function fetchCourses() {
  const request = buildRequest();

  // AbortController lets us cancel the request. We cancel it if it takes
  // longer than CONFIG.api.timeoutMs, so visitors don't wait forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.api.timeoutMs);

  let response;
  try {
    response = await fetch(request.url, {
      headers: request.headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer); // the request has finished (or failed), so stop the timer
  }

  // fetch() only fails by itself on network problems. A "404 Not Found" or
  // "500 Server Error" still counts as a response, so we check `ok` ourselves.
  if (!response.ok) {
    throw new Error(`Request to ${request.url} failed with status ${response.status}`);
  }

  const data = await response.json();

  // The mock file has the same shape as the real API's response, so the
  // same paths (CONFIG.api.coursesPath and schedulePath) work for both.
  return prepareCourses(readCourseList(data), readSchedule(data));
}


/**
 * Finds the list of courses inside the downloaded data, using
 * CONFIG.api.coursesPath.
 */
function readCourseList(data) {
  const courses = getValueAtPath(data, CONFIG.api.coursesPath);

  // Some APIs leave the list out completely when nothing matches, rather
  // than sending an empty list. (Professional Training's API does this
  // for a keyword with no courses.) Treat that as "no courses", but leave
  // a hint in the console in case the real cause is a wrong coursesPath.
  if (courses == null) {
    console.warn(`No "${CONFIG.api.coursesPath}" in the data, so showing no courses. If there should be courses, check CONFIG.api.coursesPath in config.js.`);
    return [];
  }

  if (!Array.isArray(courses)) {
    throw new Error(
      "Expected a list of courses but got something else. " +
      "Check CONFIG.api.coursesPath in config.js."
    );
  }

  return courses;
}


/**
 * Finds the separate list of course dates (CONFIG.api.schedulePath), if
 * the API has one. Returns an empty list if not, so the courses still
 * show, just without dates.
 */
function readSchedule(data) {
  if (!CONFIG.api.schedulePath) {
    return [];
  }

  const schedule = getValueAtPath(data, CONFIG.api.schedulePath);
  return Array.isArray(schedule) ? schedule : [];
}


/**
 * Decides whether to load the sample file or the live API, following
 * CONFIG.useMockData: true, false or "auto".
 */
function isUsingMockData() {
  if (CONFIG.useMockData !== "auto") {
    return CONFIG.useMockData === true;
  }

  // "auto": use the sample file when the page is on this computer.
  // Live Server's addresses look like http://127.0.0.1:5500, and
  // "localhost" and "[::1]" are other names for this computer.
  const localNames = ["localhost", "127.0.0.1", "[::1]", ""];
  return localNames.includes(window.location.hostname);
}


/**
 * Works out the URL and headers for the request, based on
 * CONFIG.useMockData and CONFIG.api.auth.
 */
function buildRequest() {
  if (isUsingMockData()) {
    return { url: CONFIG.mockDataUrl, headers: {} };
  }

  const auth = CONFIG.api.auth;
  const url = new URL(CONFIG.api.url, document.baseURI);
  const headers = { Accept: "application/json" };

  if (auth.type === "header") {
    headers[auth.headerName] = auth.key;
  } else if (auth.type === "bearer") {
    headers.Authorization = "Bearer " + auth.key;
  } else if (auth.type === "query") {
    // searchParams.set() takes care of encoding special characters.
    url.searchParams.set(auth.queryParam, auth.key);
  }

  return { url: url.href, headers };
}


/**
 * Reads a value from an object using a dotted path.
 * Example: getValueAtPath(course, "schedule.startDate")
 *          returns course.schedule.startDate.
 * An empty path returns the object itself. A missing value returns
 * undefined instead of crashing.
 */
function getValueAtPath(object, path) {
  if (!path) {
    return object;
  }

  return path.split(".").reduce(
    (current, key) => (current == null ? undefined : current[key]),
    object
  );
}


/**
 * Reads one value from an API record using a field name from config.js.
 * Returns "" when the field name is "" or the value is missing, so the
 * code that calls it can simply check `if (value)`.
 */
function readField(record, path) {
  if (!path) {
    return ""; // without this, an empty path would return the whole record
  }

  const value = getValueAtPath(record, path);
  return value == null ? "" : value;
}


/**
 * Reads one field of a course, using the API field name from
 * CONFIG.fieldMap. `name` is our own name for the field, e.g. "title".
 */
function getField(course, name) {
  return readField(course, CONFIG.fieldMap[name]);
}


/* ---------------------------------------------------------------------
   Preparing the data
   APIs rarely send data exactly the way a page wants to show it. So
   before building any cards, we turn each course into a tidy object of
   our own, with the same shape whatever the API looks like:
     { id, title, description, dates, location, duration, price, bookingUrl }
   The card-building code further down only ever sees this tidy shape.
   --------------------------------------------------------------------- */

/**
 * Leaves out hidden courses (e.g. retired ones) and tidies up the rest.
 */
function prepareCourses(rawCourses, schedule) {
  const datesByCourse = groupDatesByCourse(schedule);

  return rawCourses
    .filter((course) => !isHiddenCourse(course))
    .map((course) => prepareCourse(course, datesByCourse));
}


/**
 * True if the course's "hidden" field (CONFIG.fieldMap.hidden, e.g.
 * "obsolete") is switched on. APIs write "on" in different ways, so
 * true, 1, "1" and "true" all count.
 */
function isHiddenCourse(course) {
  const value = getField(course, "hidden");
  return value === true || value === 1 || value === "1" || value === "true";
}


/**
 * Sorts the separate list of dates into groups, one per course, so each
 * course can quickly find its own dates. A Map works like a labelled set
 * of drawers: the label is the course ID and each drawer holds that
 * course's dates.
 */
function groupDatesByCourse(schedule) {
  const fields = CONFIG.scheduleFieldMap;
  const datesByCourse = new Map();

  for (const entry of schedule) {
    const courseId = readField(entry, fields.courseId);
    if (courseId === "") {
      continue; // an entry that isn't linked to any course
    }

    // String() so that an ID sent as 105090 in one list and "105090" in
    // the other still match.
    const key = String(courseId);
    if (!datesByCourse.has(key)) {
      datesByCourse.set(key, []);
    }

    datesByCourse.get(key).push({
      date: readField(entry, fields.date),
      location: cleanText(readField(entry, fields.location)),
    });
  }

  return datesByCourse;
}


/**
 * Turns one course from the API into our tidy shape (see above).
 */
function prepareCourse(course, datesByCourse) {
  const id = getField(course, "id");
  const title = cleanText(getField(course, "title")) || "Untitled course";

  // The course's dates from the separate schedule list, plus its own
  // date field if the API has one.
  const dates = [...(datesByCourse.get(String(id)) || [])];
  const ownDate = getField(course, "date");
  if (ownDate) {
    dates.push({ date: ownDate, location: "" });
  }

  const upcoming = getUpcomingDates(dates);
  const description = cleanText(getField(course, "description"));

  return {
    id,
    title,
    description: shortenText(description, CONFIG.courseList.descriptionMaxLength),
    dates: upcoming,
    location: cleanText(getField(course, "location")) || listLocations(upcoming),
    duration: formatDuration(getField(course, "duration")),
    price: formatPrice(getField(course, "price")),
    bookingUrl: chooseBookingUrl(course, id, title),
  };
}


/**
 * Keeps only dates from today onwards, sorted soonest first.
 * Each date also gets `parsed`: a real Date object (or null if the text
 * couldn't be understood, e.g. "TBC"; those are kept and go last).
 */
function getUpcomingDates(dates) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // midnight at the start of today

  return dates
    .filter((entry) => entry.date !== "")
    .map((entry) => ({ ...entry, parsed: parseDate(entry.date) }))
    .filter((entry) => !entry.parsed || entry.parsed >= today)
    .sort((a, b) => timeOrInfinity(a.parsed) - timeOrInfinity(b.parsed));
}


/**
 * A date's time as a number for sorting, or Infinity (sorts last) for
 * a missing date.
 */
function timeOrInfinity(date) {
  return date ? date.getTime() : Infinity;
}


/**
 * Lists the different locations of a course's dates, e.g. "Online" or
 * "Cork, Online". A Set ignores repeats, so "Online" appears only once.
 */
function listLocations(dates) {
  const locations = new Set(dates.map((entry) => entry.location).filter(Boolean));
  return [...locations].join(", ");
}


/**
 * Returns a copy of the courses sorted by their next date, soonest
 * first. Courses with no upcoming dates go to the end, in the order the
 * API sent them.
 */
function sortByNextDate(courses) {
  const nextTime = (course) => timeOrInfinity(course.dates.length > 0 ? course.dates[0].parsed : null);

  // [...courses] makes a copy, so the original array is not changed.
  return [...courses].sort((a, b) => {
    const difference = nextTime(a) - nextTime(b);
    // Infinity - Infinity is NaN, so two undated courses count as equal.
    return Number.isNaN(difference) ? 0 : difference;
  });
}


/**
 * Turns text from the API into clean plain text.
 *
 * Some APIs send text containing HTML codes, e.g. "Product &amp; Process"
 * (meaning "Product & Process") or tags like "<strong>". Shown with
 * textContent, those would appear literally as "&amp;". So we let the
 * browser decode them:
 *
 * SECURITY: DOMParser builds a separate, "inert" document that is never
 * shown. Scripts in it never run and its images never load. We only read
 * back its plain text (textContent), which the cards then insert with
 * textContent too. So this is safe, unlike putting the text into
 * innerHTML on the real page.
 */
function cleanText(value) {
  // Squash line breaks and runs of spaces into single spaces.
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}


/**
 * The decoding half of cleanText(): HTML codes and tags become plain
 * text, but spacing is left exactly as it was.
 */
function decodeHtml(value) {
  if (value === "" || value == null) {
    return "";
  }

  const text = String(value);

  // Only decode if there's something to decode ("<" or "&").
  if (!/[<&]/.test(text)) {
    return text;
  }

  return new DOMParser().parseFromString(text, "text/html").body.textContent;
}


/**
 * Shortens text to about `maxLength` characters, ending at a whole word
 * with "…". A maxLength of 0 means "don't shorten".
 */
function shortenText(text, maxLength) {
  if (!maxLength || text.length <= maxLength) {
    return text;
  }

  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const wholeWords = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;

  // Drop any trailing comma or full stop, so we don't get ",…".
  return wholeWords.replace(/[\s,.;:!?-]+$/, "") + "…";
}


/**
 * Picks the link for a course's button (see CONFIG.booking):
 * its own booking link, then the course page, then the fallback.
 * Only safe links are used (see getSafeUrl()).
 */
function chooseBookingUrl(course, id, title) {
  const ownLink = getSafeUrl(getField(course, "bookingUrl"));
  if (ownLink) {
    return ownLink;
  }

  const { courseUrl, fallbackUrl } = CONFIG.booking;

  // The slug is made from the title exactly as the API sent it, even
  // double or trailing spaces, because professional.ie's links keep them.
  const values = { id, title, slug: makeSlug(decodeHtml(getField(course, "title"))) };

  if (courseUrl && id !== "") {
    const pageLink = getSafeUrl(fillLinkTemplate(courseUrl, values));
    if (pageLink) {
      return pageLink;
    }
  }

  return getSafeUrl(fillLinkTemplate(fallbackUrl || "", values));
}


/**
 * Fills in {id}, {slug} and {title} in a link from config.js.
 * encodeURIComponent() makes each value safe to put inside a link: it
 * turns spaces into %20, "&" into %26 and so on.
 */
function fillLinkTemplate(template, values) {
  return template
    .replaceAll("{id}", encodeURIComponent(values.id))
    .replaceAll("{slug}", encodeURIComponent(values.slug))
    .replaceAll("{title}", encodeURIComponent(values.title));
}


/**
 * Turns a title into the style professional.ie uses in its course links:
 * colons are dropped, then every space and hyphen becomes an underscore.
 *   "Inside Sales Skills: Script development" → "Inside_Sales_Skills_Script_development"
 *   "Python programming - Introduction"      → "Python_programming___Introduction"
 */
function makeSlug(title) {
  return title.replace(/:/g, "").replace(/[ -]/g, "_");
}


/* ---------------------------------------------------------------------
   Building the cards
   --------------------------------------------------------------------- */

/**
 * Replaces the contents of the course list with one card per course.
 */
function renderCourses(courses) {
  const items = courses.map((course) => {
    const item = document.createElement("li");
    item.append(createCourseCard(course));
    return item;
  });

  // replaceChildren() removes any old cards (e.g. from an earlier
  // attempt) and adds the new ones in a single step.
  document.getElementById("course-list").replaceChildren(...items);
}


/**
 * Builds one course card. The structure matches the styles in
 * css/styles.css (section 4c).
 *
 * SECURITY: every value from the data is added with textContent,
 * append() or setAttribute, which treat it as plain text. Even if the
 * API sent "<script>", it would just appear as those characters.
 */
function createCourseCard(course) {
  const card = document.createElement("article");
  card.className = "course-card";
  card.append(createElementWithText("h3", "course-card__title", course.title));

  // Dates, duration and location: only include the ones that have a value.
  const details = document.createElement("dl");
  details.className = "course-card__details";

  const dates = createDatesValue(course.dates);
  if (dates) {
    details.append(createDetailRow(course.dates.length === 1 ? "Date" : "Dates", dates));
  }

  if (course.duration) {
    details.append(createDetailRow("Duration", course.duration));
  }

  if (course.location) {
    details.append(createDetailRow("Location", course.location));
  }

  if (details.children.length > 0) {
    card.append(details);
  }

  if (course.description) {
    card.append(createElementWithText("p", "course-card__description", course.description));
  }

  // Footer: the price (if there is one) and the booking button.
  const footer = document.createElement("div");
  footer.className = "course-card__footer";

  if (course.price) {
    footer.append(createElementWithText("p", "course-card__price", course.price));
  }

  footer.append(createBookingButton(course));
  card.append(footer);

  return card;
}


/**
 * Builds what goes next to "Dates" on a card: a short list of upcoming
 * dates, with "+ 2 more dates" if there are more than
 * CONFIG.courseList.maxDatesShown. With no dates it returns the
 * noDatesText (e.g. "Dates on request"), or "" to leave the row out.
 */
function createDatesValue(dates) {
  const { maxDatesShown, noDatesText } = CONFIG.courseList;

  if (dates.length === 0) {
    return noDatesText || "";
  }

  const shown = maxDatesShown > 0 ? dates.slice(0, maxDatesShown) : dates;

  const list = document.createElement("ul");
  list.className = "course-card__dates";

  for (const entry of shown) {
    const item = document.createElement("li");
    item.append(createDateElement(entry.date, entry.parsed));
    list.append(item);
  }

  const hiddenCount = dates.length - shown.length;
  if (hiddenCount > 0) {
    const moreText = `+ ${hiddenCount} more ${hiddenCount === 1 ? "date" : "dates"}`;
    list.append(createElementWithText("li", "course-card__more-dates", moreText));
  }

  return list;
}


/**
 * Creates an element with a class name and plain-text content.
 */
function createElementWithText(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}


/**
 * Creates one label/value pair for the card's details list, e.g.
 * <div><dt>Date</dt><dd>Thu 5 Nov 2026</dd></div>.
 * `value` can be text or an element (such as a <time>).
 */
function createDetailRow(label, value) {
  const row = document.createElement("div");

  const term = document.createElement("dt");
  term.textContent = label;

  const definition = document.createElement("dd");
  definition.append(value); // append() adds strings as plain text, safely

  row.append(term, definition);
  return row;
}


/**
 * Creates the "Book / Enquire" link. The link itself was chosen
 * earlier, by chooseBookingUrl().
 */
function createBookingButton(course) {
  const link = document.createElement("a");
  link.className = "button";
  link.textContent = CONFIG.booking.buttonLabel;

  if (course.bookingUrl) {
    link.setAttribute("href", course.bookingUrl);
  }

  // Every card has the same button text, which is confusing for screen
  // reader users who list all the links on a page. This hidden text makes
  // each one unique, e.g. "Book / Enquire: AI Fundamentals for Business".
  link.append(createElementWithText("span", "visually-hidden", ": " + course.title));

  return link;
}


/**
 * Returns the URL if it uses an allowed protocol (see SAFE_URL_PROTOCOLS),
 * otherwise "". Relative links like "/book" are resolved against this page.
 */
function getSafeUrl(value) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(String(value).trim(), document.baseURI);
    return SAFE_URL_PROTOCOLS.includes(url.protocol) ? url.href : "";
  } catch {
    return ""; // not a valid URL at all
  }
}


/* ---------------------------------------------------------------------
   Formatting dates, prices and durations
   Intl is built into every modern browser and formats values for a
   locale (CONFIG.format.locale). "en-IE" gives "Thu 5 Nov 2026" and "€395".
   --------------------------------------------------------------------- */

/**
 * Turns a date value from the data into a Date object, or returns null
 * if it can't be understood.
 */
function parseDate(value) {
  if (!value) {
    return null;
  }

  // JavaScript reads a date with no time, like "2026-11-05", as midnight
  // UTC. West of Ireland that is still the PREVIOUS day. Building the
  // date from its parts keeps it on the same day for every visitor.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  // An invalid date's time is NaN ("not a number").
  return Number.isNaN(date.getTime()) ? null : date;
}


/**
 * Creates a <time> element showing a friendly date, with the original
 * value in its datetime attribute for browsers and search engines.
 * `date` is the value already turned into a Date by parseDate(); if the
 * value couldn't be understood, the original text is shown as-is.
 */
function createDateElement(value, date) {
  if (!date) {
    return String(value);
  }

  const time = document.createElement("time");
  time.setAttribute("datetime", String(value));
  time.textContent = new Intl.DateTimeFormat(CONFIG.format.locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

  return time;
}


/**
 * Formats a price. Numbers (or numeric text like "395") become currency,
 * e.g. €395 or €299.50. Other text, like "From €650", is shown unchanged.
 */
function formatPrice(value) {
  // Number("") and Number("  ") are 0, so treat blank values as "no price".
  if (String(value).trim() === "") {
    return "";
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return String(value);
  }

  // Whole numbers without cents (€395), others with two decimals (€299.50).
  const decimals = Number.isInteger(amount) ? 0 : 2;

  return new Intl.NumberFormat(CONFIG.format.locale, {
    style: "currency",
    currency: CONFIG.format.currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}


/**
 * Formats a duration. A number is treated as hours, e.g. 3 → "3 hours".
 * Text such as "2 days" is shown unchanged.
 */
function formatDuration(value) {
  if (typeof value !== "number") {
    return String(value);
  }

  return new Intl.NumberFormat(CONFIG.format.locale, {
    style: "unit",
    unit: "hour",
    unitDisplay: "long",
  }).format(value);
}
