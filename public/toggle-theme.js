/* eslint-env browser */

// Get theme data from local storage
let currentTheme = localStorage.getItem("theme");
const themeSetTimestamp = localStorage.getItem("themeSetTimestamp");
let userHasManuallySetTheme = false;

// Check if manual theme preference has expired (24 hours)
if (themeSetTimestamp) {
  const now = Date.now();
  const setTime = parseInt(themeSetTimestamp, 10);
  const hoursSinceSet = (now - setTime) / (1000 * 60 * 60);

  if (hoursSinceSet < 24) {
    userHasManuallySetTheme = true;
  } else {
    // Expired - clear manual settings
    localStorage.removeItem("theme");
    localStorage.removeItem("themeSetTimestamp");
    currentTheme = null;
  }
}

function getPreferredTheme() {
  // If user manually set a theme, use it
  if (userHasManuallySetTheme && currentTheme) {
    return currentTheme;
  }

  // Otherwise, default to dark mode.
  return "dark";
}

let themeValue = getPreferredTheme();

function setPreference() {
  localStorage.setItem("theme", themeValue);
  localStorage.setItem("themeSetTimestamp", Date.now().toString());
  reflectPreference();
}

function reflectPreference() {
  document.documentElement.setAttribute("data-theme", themeValue);

  document.querySelector("#theme-btn")?.setAttribute("aria-label", themeValue);

  // Get a reference to the body element
  const body = document.body;

  // Check if the body element exists before using it
  if (body) {
    // Set the `color-scheme` CSS property to the current theme
    body.style.colorScheme = themeValue;
  }
}

// set early so no page flashes / CSS is made aware
reflectPreference();

window.onload = () => {
  function setThemeFeature() {
    // set on load so screen readers can get the latest value on the button
    reflectPreference();

    // now this script can find and listen for clicks on the control
    document.querySelector("#theme-btn")?.addEventListener("click", () => {
      themeValue = themeValue === "light" ? "dark" : "light";

      // Use View Transitions API if available
      if (!document.startViewTransition) {
        // Fallback for browsers that don't support View Transitions
        setPreference();
        return;
      }

      // Use View Transitions for smooth theme switching
      document.startViewTransition(() => {
        setPreference();
      });
    });
  }

  setThemeFeature();

  // Runs on view transitions navigation
  document.addEventListener("astro:after-swap", setThemeFeature);
};

// Intentionally not syncing to system theme: default must stay dark
// unless the user manually toggles it.
