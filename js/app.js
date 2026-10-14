/* =====================================================================
   app.js: makes the page work.
   =====================================================================

   This file contains NO site-specific values. Everything it needs
   (text, colours, contact details, API settings) comes from the CONFIG
   object defined in config.js, which index.html loads first.

   Current stage (Phase 2): apply the site settings to the page.
   Phase 3 adds loading and rendering the courses.

   SECURITY NOTE: all text is inserted with `textContent`, which
   treats it as plain text. We never use `innerHTML` with values from
   config or the API, so nothing in them can inject HTML or scripts.
   ===================================================================== */


/* ---------------------------------------------------------------------
   Start-up
   Scripts are loaded at the end of <body>, so the HTML above already
   exists by the time this runs.
   --------------------------------------------------------------------- */
applySiteSettings();


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
    list.append(createContactItem("Email", contact.email, "mailto:" + contact.email));
  }

  if (contact.phone) {
    // A tel: link must not contain spaces, so strip them out.
    const dialable = contact.phone.replace(/[^\d+]/g, "");
    list.append(createContactItem("Phone", contact.phone, "tel:" + dialable));
  }

  if (contact.address) {
    list.append(createContactItem("Address", contact.address));
  }
}


/**
 * Creates one <li> for the contact list, e.g. "Email: info@example.ie".
 * If `href` is given, the value becomes a link.
 */
function createContactItem(label, value, href) {
  const item = document.createElement("li");

  const labelSpan = document.createElement("span");
  labelSpan.textContent = label + ": ";
  item.append(labelSpan);

  if (href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = value;
    item.append(link);
  } else {
    item.append(value); // append() with a string adds plain text safely
  }

  return item;
}
