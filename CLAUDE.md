# CLAUDE.md: project conventions for aitraining.ie

A simple, static website that lists AI courses from Professional Training's API.
This project is a **template**: it will be copied and reconfigured for other sites,
so keep it simple, config-driven and easy for a learner to maintain.

## Tech rules

- **Plain HTML, CSS and vanilla JavaScript only.** No frameworks, no npm, no bundlers, no build step.
- The site must work by opening `index.html` with VS Code's **Live Server**.
- Scripts are loaded with plain `<script>` tags (no ES modules): `config.js` first, then `app.js`.
- Do not install packages, create accounts, deploy, or register domains. Ask the user first.

## File roles

| File | Purpose |
|---|---|
| `index.html` | Page structure (semantic HTML). |
| `css/styles.css` | All styling. Uses CSS custom properties for colours and spacing. |
| `js/config.js` | **The only file edited when replicating the site.** Site text, contact details, colours, API URL/auth, `useMockData`, field map, booking link, locale. |
| `js/app.js` | Fetches and renders courses. **Must contain no site-specific values.** Read everything from `CONFIG`. |
| `data/sample-courses.json` | Mock data for development (`useMockData: true`). |
| `assets/` | Logo, favicon, images. |

## Config-driven

- New settings go in `config.js` with a comment explaining what the setting does and its allowed values.
- Colours in `CONFIG.colours` are applied as CSS custom properties by `app.js`. `styles.css` must use the variables, never hard-coded brand colours.
- API field names are only referenced via `CONFIG.fieldMap`. Never hard-code an API field name in `app.js`.

## Security rules (non-negotiable)

- **Render API data with `textContent` / `createElement` / `setAttribute`.** Never put API strings into `innerHTML`, `outerHTML`, `insertAdjacentHTML` or `document.write`.
- Only allow `http:`, `https:` and `mailto:` URLs from API data in `href` attributes (block `javascript:` and similar).
- **Never place a secret API key in front-end code.** Everything in `js/` is public. A secret key goes in a serverless proxy (Netlify/Cloudflare function) as an environment variable.
- If the key is secret or CORS blocks browser requests, stop and explain the proxy option. Get approval before writing one.
- Never commit `.env` files.

## Design and accessibility

- Simple, professional, calm. Mobile-first, system font stack, generous white space.
- No carousels or heavy animation. A subtle card hover is fine. Respect `prefers-reduced-motion`.
- Semantic HTML (`header`, `main`, `section`, `footer`), logical heading order (one `h1`), alt text on images.
- WCAG AA contrast or better. All controls keyboard-usable with a visible focus style.
- Format dates and prices for Ireland: `Intl` with `en-IE` and `EUR` (from `CONFIG.format`).
- Handle and style loading, error (friendly message + "Try again" button) and empty states.

## Code style

- Write clear comments aimed at someone **learning**: explain *why*, not just *what*.
- Small, named functions; `const`/`let`; `async`/`await` for fetches.
- Keep it readable over clever.

## Workflow

- Work in phases. At the end of each phase: summarise, explain how to check it in Live Server, commit with a clear message, then wait for the user's go-ahead.
