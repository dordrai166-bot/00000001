/*
 * Shared session bootstrap for digi-line.eu and its subdomains.
 * Include on ANY page (public or gated) that needs to know the current
 * user's login state, language, or theme:
 *
 *   <script src="https://digi-line.eu/js/session.js"></script>
 *
 * Cross-domain <script src> loading works fine without CORS (only fetch/XHR
 * need CORS) — that's why this one file can be shared by digi-line.eu,
 * dashboard.digi-line.eu, and app.digi-line.eu alike. Internally it always
 * calls a RELATIVE /api/session — same-origin on whichever domain the page
 * actually loaded from — so the fetch itself never crosses origins either.
 *
 * On gated subdomains (dashboard./app.) this call is effectively free: nginx
 * already ran the same check via auth_request before it served the page at
 * all, so this just re-reads the result to get language/theme/name.
 *
 * Applies data-theme + lang to <html> immediately (before first paint is not
 * guaranteed since this is an external script — put it in <head> as early as
 * possible to minimize flash-of-wrong-theme), then resolves window.digiSession
 * with what it found.
 *
 * Usage in page code:
 *   digiSession.then(function (session) {
 *     if (session.loggedIn) {
 *       console.log(session.user.email, session.user.language, session.user.theme);
 *     }
 *   });
 */
window.digiSession = (function () {
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  }
  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang === 'de' ? 'de' : 'en');
  }

  // Best-guess defaults BEFORE the network call resolves, so pages don't
  // flash light-mode-English for logged-out visitors with a dark OS theme.
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
  applyLang((navigator.language || 'en').toLowerCase().indexOf('de') === 0 ? 'de' : 'en');

  return fetch('/api/session', { credentials: 'same-origin' })
    .then(function (res) {
      if (!res.ok) return { loggedIn: false };
      return res.json().then(function (data) {
        applyTheme(data.user.theme);
        applyLang(data.user.language);
        return { loggedIn: true, user: data.user };
      });
    })
    .catch(function () {
      return { loggedIn: false };
    });
})();
