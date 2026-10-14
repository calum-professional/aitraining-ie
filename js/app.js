/* =====================================================================
   app.js: makes the page work.
   =====================================================================

   This file contains NO site-specific values. Everything it needs
   (text, colours, contact details, API settings) comes from the CONFIG
   object defined in config.js, which index.html loads first.

   What it does, in order:
     1. Applies the site settings (colours, text, logo, contact details).
     2. Loads the courses (mock file or live API, see CONFIG.useMockData).
     3. Builds a card for each course, or shows a loading, empty or
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

    renderCourses(sortByDate(courses));
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
 * Downloads the course list and returns it as an array.
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

  // The mock file should have the same shape as the real API's response,
  // so coursesPath is applied to both.
  const courses = getValueAtPath(data, CONFIG.api.coursesPath);

  if (!Array.isArray(courses)) {
    throw new Error(
      "Expected a list of courses but got something else. " +
      "Check CONFIG.api.coursesPath in config.js."
    );
  }

  return courses;
}


/**
 * Works out the URL and headers for the request, based on
 * CONFIG.useMockData and CONFIG.api.auth.
 */
function buildRequest() {
  if (CONFIG.useMockData) {
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
 * Reads one field of a course, using the API field name from
 * CONFIG.fieldMap. `name` is our own name for the field, e.g. "title".
 * Returns "" when the field is not mapped (or is set to "") or has no
 * value, so the code that calls it can simply check `if (value)`.
 */
function getField(course, name) {
  const path = CONFIG.fieldMap[name];
  if (!path) {
    return ""; // without this, an empty path would return the whole course
  }

  const value = getValueAtPath(course, path);
  return value == null ? "" : value;
}


/**
 * Returns a copy of the courses sorted by start date, soonest first.
 * Courses without a valid date go to the end.
 */
function sortByDate(courses) {
  const timeOf = (course) => {
    const date = parseDate(getField(course, "date"));
    return date ? date.getTime() : Infinity;
  };

  // [...courses] makes a copy, so the original array is not changed.
  return [...courses].sort((a, b) => {
    const difference = timeOf(a) - timeOf(b);
    // Infinity - Infinity is NaN, so two undated courses count as equal.
    return Number.isNaN(difference) ? 0 : difference;
  });
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
  const title = String(getField(course, "title")) || "Untitled course";

  const card = document.createElement("article");
  card.className = "course-card";
  card.append(createElementWithText("h3", "course-card__title", title));

  // Date, duration and location: only include the ones that have a value.
  const details = document.createElement("dl");
  details.className = "course-card__details";

  const date = getField(course, "date");
  if (date) {
    details.append(createDetailRow("Date", createDateElement(date)));
  }

  const duration = formatDuration(getField(course, "duration"));
  if (duration) {
    details.append(createDetailRow("Duration", duration));
  }

  const location = String(getField(course, "location"));
  if (location) {
    details.append(createDetailRow("Location", location));
  }

  if (details.children.length > 0) {
    card.append(details);
  }

  const description = String(getField(course, "description"));
  if (description) {
    card.append(createElementWithText("p", "course-card__description", description));
  }

  // Footer: the price (if there is one) and the booking button.
  const footer = document.createElement("div");
  footer.className = "course-card__footer";

  const price = formatPrice(getField(course, "price"));
  if (price) {
    footer.append(createElementWithText("p", "course-card__price", price));
  }

  footer.append(createBookingButton(course, title));
  card.append(footer);

  return card;
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
 * Creates the "Book / Enquire" link. Uses the course's own booking URL
 * if it is safe, otherwise the fallback from CONFIG.booking.
 */
function createBookingButton(course, title) {
  const fallback = CONFIG.booking.fallbackUrl.replace("{title}", encodeURIComponent(title));
  const href = getSafeUrl(getField(course, "bookingUrl")) || getSafeUrl(fallback);

  const link = document.createElement("a");
  link.className = "button";
  link.textContent = CONFIG.booking.buttonLabel;

  if (href) {
    link.setAttribute("href", href);
  }

  // Every card has the same button text, which is confusing for screen
  // reader users who list all the links on a page. This hidden text makes
  // each one unique, e.g. "Book / Enquire: AI Fundamentals for Business".
  link.append(createElementWithText("span", "visually-hidden", ": " + title));

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
 * If the date can't be understood, the original text is shown as-is.
 */
function createDateElement(value) {
  const date = parseDate(value);

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
