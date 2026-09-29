import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef(null);
  const firstRender = useRef(true);
  // The drawer has to be able to hand focus back to the button that
  // opened it. Without a ref here, closing the drawer with Escape
  // drops focus onto <body> and a keyboard user has to Tab from the
  // very top of the page again.
  const menuButtonRef = useRef(null);

  // Stable identity. `closeNav` is a dependency of the route-change
  // effect in Sidebar; an inline arrow function here gives it a new
  // identity on every render, so that effect fires on every render
  // instead of only on navigation. useCallback is the fix.
  const closeNav = useCallback(() => setNavOpen(false), []);

  // Move focus to the page content on navigation.
  //
  // Without this, a keyboard or screen-reader user who activates a
  // sidebar link stays parked on that link: the new page renders
  // silently and focus never moves, so it is not obvious that
  // anything happened. Moving focus to <main> is the fix.
  //
  // We skip the very first render so arriving on a page does not
  // yank focus away from the top of the document.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <div className="brut" aria-hidden="true">
        <i className="brut__grid" />
        <i className="brut__dots" />
        <i className="brut__stripes" />
        <i className="brut__block brut__block--1" />
        <i className="brut__block brut__block--2" />
        <i className="brut__block brut__block--3" />
        <i className="brut__ring" />
      </div>

      {/* First focusable element on the page. Off-screen until
          focused, so keyboard users can jump straight past the
          navigation instead of tabbing through 24 module links. */}
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Sidebar open={navOpen} onClose={closeNav} menuButtonRef={menuButtonRef} />

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            ref={menuButtonRef}
            className="topbar__button"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={navOpen}
            aria-controls="sidebar"
          >
            <FaBars aria-hidden="true" />
          </button>
          <span className="topbar__title">Web Vulnerability Learning Environment</span>
        </header>

        {/* tabIndex={-1} makes this programmatically focusable so the
            effect above can move focus here. It is not in the normal
            tab order, so it does not add a tab stop. */}
        <main className="main__content" id="main-content" ref={mainRef} tabIndex={-1}>
          <div key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
