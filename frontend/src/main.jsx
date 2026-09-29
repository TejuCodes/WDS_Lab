import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles/global.css";
import "./styles/pages.css";
import "./styles/modules.css";

/**
 * ============================================================
 * ENTRY POINT
 * ------------------------------------------------------------
 * This is the file the browser loads first. It does three things
 * and then hands control to React:
 *
 * 1. imports the CSS (Vite bundles it into one file in production).
 *    Order matters: global.css defines the custom properties and the
 *    base elements, pages.css the shared page furniture, and
 *    modules.css the module catalogue - diagram, timeline, puzzles.
 *    modules.css last so its component rules win over the shared ones.
 * 2. wraps <App> in the two providers it needs
 * 3. mounts the app into the <div id="root"> from index.html
 *
 * WHY THE PROVIDERS ARE NESTED THIS WAY
 *   BrowserRouter must be OUTSIDE anything that calls useNavigate or
 *   <Link>, so it goes on the outside.
 *   ThemeProvider is inside it because it does not need routing - it
 *   only sets an attribute on <html>. Order between these two does
 *   not matter as long as both are above the pages.
 * ============================================================ */

const container = document.getElementById("root");

// Fail loudly if index.html and this file disagree, rather than
// showing a blank page with no explanation.
if (!container) {
  throw new Error('Could not find #root in index.html. Check your <div id="root"> element.');
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
