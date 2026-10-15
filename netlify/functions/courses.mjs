/* =====================================================================
   courses.mjs: a small "proxy" that fetches the course data for the page.
   =====================================================================

   WHY THIS EXISTS
   The courses come from Professional Training's API on professional.ie.
   A browser only lets a page read data from ANOTHER website if that
   website sends a permission header ("CORS"). professional.ie doesn't,
   so the browser would block our page from reading it.

   This function runs on Netlify's servers, not in the browser, and
   servers aren't bound by CORS. So the page asks this function (on its
   own website, which is always allowed), and the function asks
   professional.ie and passes the answer back.

     visitor's browser → /api/courses (this function) → professional.ie

   HOW IT'S SET UP
   - Netlify finds any file in netlify/functions/ when the site is
     deployed and runs it as a function. No settings needed.
   - `config.path` at the bottom gives it a tidy address: /api/courses.
   - It only runs on Netlify. In VS Code's Live Server the site uses the
     sample data instead (see `useMockData` in js/config.js).
   - This file runs on the server with Node.js, so it uses `export`
     (a JavaScript module). That's different from the scripts in js/,
     which run in the browser and are loaded with plain <script> tags.

   SAFETY
   - It only ever fetches the one API address below. A visitor can choose
     the search keywords, nothing else, so it can't be used to fetch
     other websites.
   - No secret key is involved: the API is public.
   ===================================================================== */


// The API this function fetches from. Only the `keywords` value is
// added, from the page's request.
const API_URL = "https://www.professional.ie/api/getCourses.php";

// Keywords longer than this are refused. Real keywords are short; this
// stops anyone sending huge values through the function.
const MAX_KEYWORDS_LENGTH = 100;

// Give up on professional.ie after this many milliseconds, so the visitor
// sees the "Try again" message rather than waiting. Kept under the page's
// own timeout (api.timeoutMs in config.js, 10 seconds).
const TIMEOUT_MS = 8000;


/**
 * Netlify calls this function for every request to /api/courses.
 * It receives the browser's request and returns a response.
 */
export default async function handleRequest(request) {
  const keywords = new URL(request.url).searchParams.get("keywords") || "";

  if (keywords.length > MAX_KEYWORDS_LENGTH) {
    return jsonError(400, "Keywords are too long.");
  }

  // Build the API address. searchParams.set() takes care of encoding
  // spaces and special characters in the keywords.
  const apiUrl = new URL(API_URL);
  apiUrl.searchParams.set("keywords", keywords);

  try {
    const apiResponse = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!apiResponse.ok) {
      console.error(`The course API replied with status ${apiResponse.status}`);
      return jsonError(502, "The course API is not available right now.");
    }

    // Check it really is JSON before passing it on. If the API ever sends
    // an HTML error page instead, the visitor gets the friendly error
    // message rather than a confusing failure.
    const body = await apiResponse.text();
    JSON.parse(body); // throws (and jumps to `catch`) if it isn't JSON

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // Caching: the course list changes rarely, so save repeat trips
        // to professional.ie.
        //   Cache-Control: each visitor's browser may reuse it for 5 minutes.
        //   Netlify-CDN-Cache-Control: Netlify's servers may reuse it for
        //   10 minutes, and keep serving the old copy for up to an hour
        //   while they fetch a fresh one in the background.
        "Cache-Control": "public, max-age=300",
        "Netlify-CDN-Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    // Network failure, timeout, or a reply that wasn't JSON. The details
    // appear in the function's log in the Netlify dashboard.
    console.error("Could not get the courses from the API:", error);
    return jsonError(502, "The course API is not available right now.");
  }
}


/**
 * Builds an error response in JSON. The page doesn't show this text (it
 * shows its own friendly message), but it helps when testing the
 * function's address directly.
 */
function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store", // never cache errors
    },
  });
}


// Netlify setting: the address this function answers on.
export const config = {
  path: "/api/courses",
};
