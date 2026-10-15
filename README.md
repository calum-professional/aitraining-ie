# aitraining.ie

A simple static website listing AI courses from Professional Training, built with plain HTML, CSS and JavaScript.

## In brief

- **What it is:** one scrolling web page with five sections (Home, Welcome, About, Testimonials and Courses) and a menu at the top that jumps to each one. The courses come from Professional Training's API and show as cards, each with its upcoming dates, location, a short description and a "Book / Enquire" button that opens the course's page on professional.ie.
- **How it's built:** plain HTML, CSS and JavaScript. There are no frameworks, no installs and no build step.
- **Where the settings live:** everything specific to this site (text, contact details, colours, data source) is in **`js/config.js`**. To make a new site, copy the project and edit that one file.
- **Where it's up to:** Phases 1–4 of 6 are done and the favicon from Phase 5 is in place. On your computer (Live Server) the page shows **sample data**; once it's published on **Netlify** it shows the **live courses** through a small Netlify function (see [Phase 4](#phase-4-the-real-course-api)).

**Quick start:** open the folder in VS Code, right-click `index.html` and choose **Open with Live Server**.

> Opening `index.html` by double-clicking it won't work: the browser blocks loading the course data from a file, and you'll see the "couldn't load the courses" message. Use Live Server.

---

## Progress

| Phase | What | Status |
|---|---|---|
| 1 | Project structure and settings file | Done |
| 2 | Page layout and design (with placeholder cards) | Done |
| 3 | Load courses from sample data and build the cards | Done |
| 4 | Connect the real Professional Training API | Done (live data needs the site on Netlify) |
| 5 | Favicon, search-engine and social-sharing tags | Favicon done |
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

### Phase 4: The real course API

The courses come from `https://www.professional.ie/api/getCourses.php?keywords=AI`. It needs no key, but two things about it shaped how the site works.

**1. Browsers can't read it directly (CORS).** A browser only lets a page read data from *another* website if that website sends a permission header (`Access-Control-Allow-Origin`). professional.ie doesn't, so the browser blocks it. The fix is a small **proxy**: `netlify/functions/courses.mjs`. It runs on Netlify's servers (where CORS doesn't apply), fetches the courses, and hands them to the page at `/api/courses` on our own site:

```
visitor's browser  →  /api/courses (our Netlify function)  →  professional.ie
```

- It only fetches that one API, and visitors can only change the search keywords, so nobody can use it to fetch other websites.
- It asks Netlify to keep a copy for 10 minutes, so busy days don't hammer professional.ie.
- **It only runs on Netlify**, not in Live Server. That's why `useMockData` is now `"auto"`: sample data on your computer, the live API once published. You can't forget to switch it.
- If professional.ie ever adds the CORS header, the proxy is no longer needed: set `api.url` to the professional.ie address.
- **If you host somewhere else instead** (e.g. Cloudflare Pages), the function needs rewriting for that platform. It's short, and the logic stays the same.

**2. The data is shaped differently from the original sample.**

- Courses and dates come in **two separate lists**, `courses` and `schedule`, linked by course ID. `app.js` joins them (settings: `api.schedulePath` and `scheduleFieldMap`).
- **Past dates are dropped.** Each card lists up to 3 upcoming dates, then "+ 2 more dates". Courses with no upcoming dates say **"Dates on request"** and come after the dated ones.
- Courses marked `obsolete` are left out (`fieldMap.hidden`).
- The API has **no prices, durations or booking links**, so those are switched off in `fieldMap`. The **Book / Enquire** button opens the course's page on professional.ie, e.g. `…/business_training_courses_ireland/Prompt_Engineering_Essentials___using_AI_effectively-105090.htm` (`booking.courseUrl`). All 74 generated links were checked against the real ones on professional.ie.
- Some text contains HTML codes such as `&amp;`. They are decoded into plain text (`&`) before display.
- Descriptions are long (up to about 1,500 characters), so cards show the first ~220 characters, ending "…". The full text is on the course page (`courseList.descriptionMaxLength`).
- When a keyword finds nothing, the API leaves out the `courses` list entirely; the page shows its "no courses" message.
- `data/sample-courses.json` is now a trimmed copy of a real API response (10 courses), so it has exactly the same shape. Its dates were moved into 2027 so the sample stays useful for a while; once they pass, those cards will say "Dates on request".

**Good to know about the live data:** the "AI" keyword currently returns 80 courses (74 after removing obsolete ones), including some that aren't about AI, such as Negotiation Skills and PMP. The site shows whatever the API returns, so the fix for that is in professional.ie's keyword settings.

### Phase 5 (part 1): Favicon

- Added a placeholder icon: a white "AI" on the site's blue. It has three files in `assets/`:
  - `favicon.svg`: used by modern browsers, sharp at any size
  - `favicon-32.png`: a fallback for older browsers
  - `apple-touch-icon.png`: 180×180, for iPhone/iPad "Add to Home Screen"
- Linked them in the `<head>` of `index.html`.
- **To change the icon:** replace those three files with your own, keeping the same names. If you change `colours.primary` in `config.js`, the icon won't change with it, because it's a separate image.

### Single-page layout with navigation

- The page is now one long scroll, in this order: **Home** (the intro), **Welcome**, **About**, **Testimonials**, **Courses**.
- A menu in the header jumps to each section. It glides smoothly unless the visitor has asked their device to reduce motion.
  - On tablets and desktops the header stays at the top while you scroll ("sticky").
  - On phones (narrower than 640px) it scrolls away to save space, and the links are tucked behind a **Menu** button (☰). Tapping it drops the menu down. It closes when you pick a link, tap the button again, press Escape or tap outside it.
- As you scroll, the menu link for the section on screen is highlighted in blue with a thick underline. Screen readers announce it as the current location.
- The intro has a **View upcoming courses** button that jumps to the courses.
- All the new text (menu labels, section headings and paragraphs, testimonials) is in `config.js` under `navigation` and `sections`. It's **dummy text for now**, marked `TODO`.
- To hide a section, empty its text in `config.js`. Its menu link disappears automatically.
- The Welcome and About sections each have an illustration (from [unDraw](https://undraw.co/), free to use with no credit needed). It sits to the right of the text on desktops and under it on phones and tablets. Change or remove it with `image` in each section in `config.js`.

---

## Project files

| File | What it's for |
|---|---|
| `index.html` | The page structure, plus the wording of the loading, empty and error messages. |
| `css/styles.css` | All the styling. Colours come from `config.js` through CSS variables. |
| `js/config.js` | **The only file you edit to change or copy the site.** |
| `js/app.js` | Loads the courses and builds the page. It contains no site-specific values. |
| `data/sample-courses.json` | Sample courses for development: a trimmed copy of a real API response (used in Live Server, see `useMockData`). |
| `netlify/functions/courses.mjs` | The proxy that fetches the live courses from professional.ie. Runs on Netlify only. |
| `assets/` | Logo, images (including the section illustrations) and the favicon files (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`). |
| `CLAUDE.md` | Project rules and conventions. |

## The main settings in `js/config.js`

| Setting | What it controls |
|---|---|
| `site` | Site name, tagline, intro, logo, contact details (email, a list of phone numbers, address), owner. |
| `navigation` | The menu links: their labels, order, and which section each one jumps to. |
| `sections` | The text and pictures of the Welcome and About sections, and the testimonials. |
| `colours` | Every colour on the site. Check contrast if you change them. |
| `useMockData` | `"auto"` = sample file on your computer, live API when published (usual). `true` = always sample, `false` = always live. |
| `api` | API address (including the search `keywords`), where the course and date lists sit in the response, the login key type, and the timeout. |
| `fieldMap` | Matches the API's course field names to the card's fields, and which field marks a course as hidden. If the API renames a field, change it here. |
| `scheduleFieldMap` | The field names in the separate list of dates: course ID, date and location. |
| `courseList` | How many dates a card lists, the "Dates on request" text, and how long descriptions can be. |
| `booking` | Button text, the course page link pattern, and the fallback email link. |
| `format` | Locale and currency (`en-IE`, `EUR`). |

Values marked `TODO` in `config.js` are still placeholders: the Welcome, About and Testimonials text, and the tagline and intro wording.

## Checking the page states

With Live Server running:

- **Courses:** you should see nine cards, starting with *AI in Excel using ChatGPT and Copilot* on Fri 15 Jan 2027 with "+ 2 more dates". The last four say "Dates on request". *QQI Level 6 Train the Trainer* is in the sample file but marked obsolete, so it doesn't appear.
- **Error:** in `config.js`, change `mockDataUrl` to `"data/nope.json"`. Change it back and click **Try again**.
- **Empty:** temporarily replace the contents of `data/sample-courses.json` with `{"found": false}` (what the API sends when nothing matches).
- **Loading:** it's usually too quick to see. In DevTools (F12), open the **Network** tab, set throttling to **Slow 3G** and reload.

If something goes wrong, the technical details appear in the browser console (F12 → **Console**).

## Security

- Course data is always added to the page as plain text, never as HTML. If the data contained code, it would just appear as text.
- Text containing HTML codes (like `&amp;`) is decoded in a separate, inert document that is never shown and can't run scripts, and only its plain text is used.
- Booking links must start with `http:`, `https:` or `mailto:`. Anything else (such as `javascript:`) is replaced by the fallback link.
- **Never put a secret API key in `js/`.** Visitors can read everything in that folder. A secret key belongs in a server-side function like `netlify/functions/courses.mjs`, stored as a Netlify environment variable. (Professional Training's API doesn't need a key, so there isn't one.)
- The proxy only fetches professional.ie's course API and only passes on the search keywords, so it can't be used to fetch other websites.

## Checking the live data after publishing on Netlify

1. Open `https://<your-site>/api/courses?keywords=AI`. You should see the raw course data (JSON). If you see `{"error": …}`, professional.ie didn't answer; the function's log in the Netlify dashboard (**Logs → Functions**) has the details.
2. Open the site itself. The Courses section should show the live courses, with real upcoming dates.
