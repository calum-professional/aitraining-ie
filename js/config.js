/* =====================================================================
   config.js: ALL site-specific settings live in this one file.
   =====================================================================

   To make a new site from this project, copy the repo and edit ONLY this
   file (plus swap the logo in /assets). app.js reads everything from the
   CONFIG object below and contains no site-specific values.

   How it works: this file is loaded with a plain <script> tag BEFORE
   app.js (see index.html). Declaring `const CONFIG` at the top level
   makes it available to app.js. No modules or build step are needed.

   Values marked TODO are placeholders. Replace them with real details.
   ===================================================================== */

const CONFIG = {

  /* -------------------------------------------------------------------
     1. SITE DETAILS
     The text shown in the header, intro and footer.
     ------------------------------------------------------------------- */
  site: {
    // Shown in the header, the browser tab title and the footer copyright.
    name: "aitraining.ie",

    // One line under the site name in the intro section.
    tagline: "Practical AI courses for Irish professionals and teams.", // TODO: confirm wording

    // Optional longer intro paragraph under the tagline. Use "" to hide it.
    intro: "Browse upcoming courses from Professional Training, from AI fundamentals to hands-on tools you can use at work straight away.", // TODO: confirm wording

    // Short description used by search engines and link previews (Phase 5).
    // Aim for about 150 characters.
    metaDescription: "Upcoming AI training courses in Ireland from Professional Training. Dates, prices and booking.",

    // Logo settings.
    //   src: path to an image in /assets, e.g. "assets/logo.svg".
    //        Set it to "" to use a simple TEXT logo (the site name).
    //   alt: describes the logo for screen readers. Usually the site name.
    logo: {
      src: "",            // "" = text logo
      alt: "aitraining.ie",
    },

    // Contact details shown in the footer. Leave a value as "" to hide that line.
    contact: {
      email: "info@example.ie",         // TODO: real email
      phone: "+353 1 000 0000",         // TODO: real phone number
      address: "Dublin, Ireland",       // TODO: real address
    },

    // The organisation that runs the courses. Shown in the footer copyright.
    owner: "Professional Training",
  },

  /* -------------------------------------------------------------------
     2. COLOURS
     app.js copies these into CSS custom properties (e.g. --color-primary),
     and styles.css uses those variables everywhere. Changing a colour
     here re-themes the whole site.

     ACCESSIBILITY: text must contrast with its background at WCAG AA,
     which means a ratio of at least 4.5:1 for normal text. The defaults
     below all pass. If you change them, check new pairs with a free tool
     such as https://webaim.org/resources/contrastchecker/
     ------------------------------------------------------------------- */
  colours: {
    primary: "#0b5394",      // buttons, links, accents (7.8:1 on white)
    primaryHover: "#083d6e", // darker shade for hover/focus states
    onPrimary: "#ffffff",    // text placed ON the primary colour (e.g. button labels)
    text: "#1f2933",         // main body text
    textMuted: "#52606d",    // secondary text such as dates and labels (6.4:1 on white)
    background: "#f7f8fa",   // page background
    surface: "#ffffff",      // card and header background
    border: "#dde2e8",       // subtle dividers and card borders
  },

  /* -------------------------------------------------------------------
     3. DATA SOURCE: mock data or live API
     ------------------------------------------------------------------- */

  // true  = load courses from the local file below (for development/design)
  // false = load courses from the live API in `api.url`
  useMockData: true,

  // Path to the local mock data file (used when useMockData is true).
  mockDataUrl: "data/sample-courses.json",

  api: {
    // The full URL that returns the list of courses.
    url: "https://api.example.com/v1/courses", // TODO: real endpoint (Phase 4)

    // Some APIs wrap the list inside an object, e.g. { "data": [ ...courses ] }.
    // Put the property name(s) that lead to the array here, using dots for
    // nesting, e.g. "data" or "results.items". Use "" if the API
    // returns the array directly.
    coursesPath: "",

    // Authentication: how the API checks who is asking.
    //   type: "none"   : no key needed
    //         "header" : key sent in a request header (set headerName)
    //         "query"  : key added to the URL, e.g. ?api_key=... (set queryParam)
    //         "bearer" : sent as "Authorization: Bearer <key>"
    //
    // SECURITY WARNING: anything in this file is visible to every visitor
    // (they can open it with "View source"). ONLY put a key here if the
    // API provider says it is a PUBLIC key that is safe to expose.
    // For a SECRET key, use a small server-side proxy instead and point
    // `url` at the proxy. That is covered in Phase 4 and the README.
    auth: {
      type: "none",
      key: "",               // public keys only. NEVER a secret key.
      headerName: "x-api-key",
      queryParam: "api_key",
    },

    // Give up on a request after this many milliseconds and show the error state.
    timeoutMs: 10000,
  },

  /* -------------------------------------------------------------------
     4. FIELD MAP
     Links the API's field names (right) to what the page shows (left).
     If the API renames a field, change it here and nowhere else.

     Use dots for nested fields, e.g. "schedule.startDate" reads
     course.schedule.startDate. Use "" if the API has no such field;
     the card will simply leave it out.
     ------------------------------------------------------------------- */
  fieldMap: {
    id: "id",                   // unique ID (used internally, not shown)
    title: "title",             // course name
    description: "description", // short summary (shown as plain text)
    date: "startDate",          // start date, ideally ISO format e.g. "2026-11-05"
    duration: "duration",       // e.g. "2 days" or a number of hours
    price: "price",             // a number (e.g. 495) or text (e.g. "€495")
    location: "location",       // venue or format, e.g. "Online" / "Dublin"
    bookingUrl: "bookingUrl",   // link to the course's booking page
  },

  /* -------------------------------------------------------------------
     5. BOOKING / ENQUIRE BUTTONS
     ------------------------------------------------------------------- */
  booking: {
    // Text on each card's button.
    buttonLabel: "Book / Enquire",

    // Used when a course has NO booking link of its own in the API data.
    // {title} is replaced with the course title (URL-encoded).
    // Can be a web page or a mailto: link.
    fallbackUrl: "mailto:info@example.ie?subject=Course%20enquiry%3A%20{title}", // TODO: real email or URL
  },

  /* -------------------------------------------------------------------
     6. FORMATTING
     How dates and prices are displayed. "en-IE" gives Irish formats,
     e.g. "5 Nov 2026" and "€495.00".
     ------------------------------------------------------------------- */
  format: {
    locale: "en-IE",
    currency: "EUR",
  },
};
