# aitraining.ie

A simple static website listing AI courses from Professional Training, built with plain HTML, CSS and JavaScript.

## In brief

- **What it is:** one web page that shows upcoming AI courses as cards, each with a date, duration, location, price and a "Book / Enquire" button.
- **How it's built:** plain HTML, CSS and JavaScript. There are no frameworks, no installs and no build step.
- **Where the settings live:** everything specific to this site (text, contact details, colours, data source) is in **`js/config.js`**. To make a new site, copy the project and edit that one file.
- **Where it's up to:** Phases 1–3 of 6 are done. The page works with **sample data**. Connecting the real Professional Training API is next.

**Quick start:** open the folder in VS Code, right-click `index.html` and choose **Open with Live Server**.

> Opening `index.html` by double-clicking it won't work: the browser blocks loading the course data from a file, and you'll see the "couldn't load the courses" message. Use Live Server.

---

## Progress

| Phase | What | Status |
|---|---|---|
| 1 | Project structure and settings file | Done |
| 2 | Page layout and design (with placeholder cards) | Done |
| 3 | Load courses from sample data and build the cards | Done |
| 4 | Connect the real Professional Training API | Next |
| 5 | Favicon, search-engine and social-sharing tags | To do |
| 6 | Full documentation (replicating, deploying, troubleshooting) | To do |

### Phase 1: Project structure and settings

- Created the folders and files (see [Project files](#project-files) below).
- Wrote `js/config.js`, which holds all site-specific settings, each with a comment explaining it.
- Added `CLAUDE.md` (the project rules: plain code only, security, accessibility, code style) and a `.gitignore` that keeps secrets such as `.env` files out of Git.

### Phase 2: Layout and design

- Built the page in `index.html` from semantic sections: header, intro, course list and footer with contact details.
- Styled it in `css/styles.css`. The layout is mobile-first: one column of cards on phones, two on tablets and three on desktops.
- `js/app.js` fills in the site name, tagline, intro, logo, contact details, copyright year and colours from `config.js`.
- Added accessibility basics: a "Skip to main content" link, a visible focus outline for keyboard users, and WCAG AA colour contrast.
- Three hard-coded placeholder cards stood in for courses so the design could be approved.

### Phase 3: Courses from sample data

- Added `data/sample-courses.json` with six sample courses. Some are deliberately awkward (no booking link, a duration given in hours, a text price, no price) so the page is tested against untidy data.
- Removed the placeholder cards. `app.js` now:
  - loads the courses from the sample file, or from the live API when `useMockData` is `false`
  - sorts them by date, soonest first
  - builds a card for each one, leaving out any detail that's missing
  - formats dates and prices for Ireland, e.g. "Thu 5 Nov 2026" and "€395"
- Added three states:
  - **Loading:** a small spinner and "Loading courses…"
  - **Empty:** a friendly message when there are no courses
  - **Error:** a friendly message and a **Try again** button
- Added a `colours.error` setting for the red accent on the error message.

---

## Project files

| File | What it's for |
|---|---|
| `index.html` | The page structure, plus the wording of the loading, empty and error messages. |
| `css/styles.css` | All the styling. Colours come from `config.js` through CSS variables. |
| `js/config.js` | **The only file you edit to change or copy the site.** |
| `js/app.js` | Loads the courses and builds the page. It contains no site-specific values. |
| `data/sample-courses.json` | Sample courses for development (used when `useMockData` is `true`). |
| `assets/` | Logo, favicon and images. |
| `CLAUDE.md` | Project rules and conventions. |

## The main settings in `js/config.js`

| Setting | What it controls |
|---|---|
| `site` | Site name, tagline, intro, logo, contact details, owner. |
| `colours` | Every colour on the site. Check contrast if you change them. |
| `useMockData` | `true` = sample file, `false` = live API. |
| `api` | API address, where the course list sits in the response, the login key type, and the timeout. |
| `fieldMap` | Matches the API's field names to the card's fields. If the API renames a field, change it here. |
| `booking` | Button text, and the fallback link for courses without their own booking link. |
| `format` | Locale and currency (`en-IE`, `EUR`). |

Values marked `TODO` in `config.js` are still placeholders: the email, phone, address, the tagline and intro wording, the API address and the fallback booking link.

## Checking the page states

With Live Server running:

- **Courses:** you should see six cards, starting with *AI Fundamentals for Business* on 5 Nov 2026.
- **Error:** in `config.js`, change `mockDataUrl` to `"data/nope.json"`. Change it back and click **Try again**.
- **Empty:** temporarily replace the contents of `data/sample-courses.json` with `[]`.
- **Loading:** it's usually too quick to see. In DevTools (F12), open the **Network** tab, set throttling to **Slow 3G** and reload.

If something goes wrong, the technical details appear in the browser console (F12 → **Console**).

## Security

- Course data is always added to the page as plain text, never as HTML. If the data contained code, it would just appear as text.
- Booking links must start with `http:`, `https:` or `mailto:`. Anything else (such as `javascript:`) is replaced by the fallback link.
- **Never put a secret API key in `js/`.** Visitors can read everything in that folder. A secret key needs a small server-side "proxy", which will be covered in Phase 4.
