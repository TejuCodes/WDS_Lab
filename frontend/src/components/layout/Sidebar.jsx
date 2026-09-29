import { useEffect, useState, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaHome,
  FaLayerGroup,
  FaShieldAlt,
  FaNewspaper,
  FaInfoCircle,
  FaChevronRight,
  FaMoon,
  FaSun,
  FaTimes,
} from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import { MANIFEST_FAMILIES, MODULE_COUNT } from "../../data/modules/manifest";
import ModuleIcon from "../module/ModuleIcon";

/**
 * The module catalogue. 24 lessons in 5 families, each one
 * self-contained: explanation, flowchart, dated history and
 * interactive puzzles live in the module itself, so the sidebar
 * only has to know the key and the title.
 *
 * This component is on screen for every route, so it imports the
 * generated MANIFEST and not the catalogue index. That is the whole
 * reason the manifest exists: the nav needs 24 keys and titles, and
 * importing the lessons for them would put 264 kB of prose in front
 * of the first paint.
 */
export { MANIFEST as MODULES, MANIFEST_FAMILIES as FAMILIES, MODULE_COUNT } from "../../data/modules/manifest";


/**
 * ============================================================
 * SIDEBAR
 * ------------------------------------------------------------
 * - fixed on the LEFT
 * - Modules is a dropdown
 * - theme toggle sits at the BOTTOM
 * - on mobile it becomes an off-canvas drawer opened from the
 *   top bar, with a backdrop that closes it on tap
 * ============================================================
 */
export default function Sidebar({ open, onClose, menuButtonRef }) {
  const { isDark, toggleTheme } = useTheme();
  const [modulesOpen, setModulesOpen] = useState(false);
  const [isDrawer, setIsDrawer] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches
  );
  const location = useLocation();
  const closeBtnRef = useRef(null);
  const asideRef = useRef(null);

  // Track whether we are in the mobile-drawer layout. This decides
  // if `inert` is applied, and it must follow a real resize, not just
  // the first render, or a user rotating a tablet gets a nav that is
  // focusable but off-screen (or the reverse).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const onChange = (e) => setIsDrawer(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Move focus into the drawer when it opens, so a keyboard user
  // is not left behind on the hamburger button.
  useEffect(() => {
    if (open && isDrawer) closeBtnRef.current?.focus();
  }, [open, isDrawer]);

  // Close the drawer whenever the route changes on mobile, so a tap
  // on a link does not leave the menu covering the new page.
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Open the dropdown automatically when the visitor is already
  // inside a module, so the active item is visible.
  useEffect(() => {
    if (location.pathname.startsWith("/modules")) setModulesOpen(true);
  }, [location.pathname]);

  // Escape closes the drawer and returns focus to the hamburger that
  // opened it. Closing without moving focus strands the user on
  // <body>: the next Tab restarts from the top of the page, which is
  // disorienting right after dismissing a menu.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        menuButtonRef?.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, menuButtonRef]);

  // Keep Tab inside the open drawer.
  //
  // The drawer sits over a backdrop, so anything focusable behind it
  // is visible-but-unreachable. Tabbing out lands the user on page
  // content that looks wrong because the menu is still covering it.
  // This wraps focus from the last focusable element back to the
  // first, and from the first back to the last on Shift+Tab.
  useEffect(() => {
    if (!open) return undefined;
    const aside = asideRef.current;
    if (!aside) return undefined;

    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onKey = (e) => {
      if (e.key !== "Tab") return;
      // `inert` subtrees are skipped for free, so filtering them out
      // is only about elements hidden by other means.
      const items = [...aside.querySelectorAll(FOCUSABLE)].filter(
        (el) =>
          // Skip anything inside an `inert` subtree. The browser
          // already refuses to focus those, so if one ended up as the
          // wrap target the call to focus() would silently do nothing
          // and focus would fall to <body> - the exact problem the
          // trap is meant to prevent.
          !el.closest("[inert]") && (el.offsetParent !== null || el === document.activeElement)
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !aside.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    aside.addEventListener("keydown", onKey);
    return () => aside.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* The backdrop is a convenience for pointer users. It is
          aria-hidden because Escape and the close button are the
          accessible ways to dismiss the drawer; a focusable
          backdrop would just be a dead tab stop. */}
      {open && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}

      <aside
        id="sidebar"
        ref={asideRef}
        className={`sidebar${open ? " is-open" : ""}`}
        aria-label="Main navigation"
        /* On mobile the closed drawer is parked off-screen with a
           transform. Off-screen content is STILL focusable, so a
           keyboard user would tab into a menu they cannot see. The
           `inert` attribute removes it from the tab order and the
           accessibility tree. It must only apply in the mobile
           drawer, because on desktop this sidebar is permanently
           visible and inert would break the whole navigation. */
        inert={isDrawer && !open ? true : undefined}
      >
        <div className="sidebar__brand">
          <div className="sidebar__logo" aria-hidden="true">
            <FaShieldAlt />
          </div>
          <div>
            <p className="sidebar__title">Web Vulnerability</p>
            <span className="sidebar__subtitle">Learning Environment</span>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="sidebar__close"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar__nav">
          <div className="sidebar__section">Menu</div>

          <NavLink to="/" end className="nav-link">
            <span className="nav-link__icon">
              <FaHome aria-hidden="true" />
            </span>
            <span className="nav-link__label">Home</span>
          </NavLink>

          {/* ---- Modules dropdown ---- */}
          <button
            type="button"
            className="nav-link"
            onClick={() => setModulesOpen((v) => !v)}
            aria-expanded={modulesOpen}
            aria-controls="modules-sublist"
          >
            <span className="nav-link__icon">
              <FaLayerGroup aria-hidden="true" />
            </span>
            <span className="nav-link__label">Modules</span>
            <span className="nav-link__count">{MODULE_COUNT}</span>
            <FaChevronRight              className={`nav-link__chevron${modulesOpen ? " is-open" : ""}`}
              aria-hidden="true"
            />
          </button>

          {/* `inert` rather than `aria-hidden`: a collapsed panel
              that still contains focusable links is a real problem -
              `aria-hidden` only hides it from screen readers, while
              `inert` also removes every link from the tab order and
              from pointer interaction. The CSS collapse still animates
              because `inert` does not change layout. The redundant
              per-link tabIndex is kept off so there is one source of
              truth for the collapsed state. */}
          <ul
            id="modules-sublist"
            className={`nav-sublist${modulesOpen ? " is-open" : ""}`}
            inert={modulesOpen ? undefined : true}
          >
              {MANIFEST_FAMILIES.map((family) => (

              <li key={family.id} className="nav-sublist__group">
                <span className="nav-sublist__label">{family.label}</span>
                <ul>
                  {family.modules.map((m) => (
                    <li key={m.key}>
                      <NavLink
                        to={`/modules/${m.key}`}
                        className="nav-link nav-link--module"
                      >
                        <span className="nav-link__label">{m.title}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            <li className="nav-sublist__group">
              <NavLink
                to="/modules"
                end
                className="nav-link nav-link--all"
              >
                <span className="nav-link__label">Browse all {MODULE_COUNT}</span>
              </NavLink>
            </li>
          </ul>

          <NavLink to="/owasp" className="nav-link">
            <span className="nav-link__icon">
              <FaShieldAlt aria-hidden="true" />
            </span>
            <span className="nav-link__label">OWASP Top 10</span>
          </NavLink>

          <NavLink to="/news" className="nav-link">
            <span className="nav-link__icon">
              <FaNewspaper aria-hidden="true" />
            </span>
            <span className="nav-link__label">Cyber News</span>
          </NavLink>

          <NavLink to="/about" className="nav-link">
            <span className="nav-link__icon">
              <FaInfoCircle aria-hidden="true" />
            </span>
            <span className="nav-link__label">About</span>
          </NavLink>
        </nav>

        {/* ---- Footer: the theme toggle lives here ---- */}
        <div className="sidebar__footer">
          {/* The button is a two-state toggle, so it is described as
              a pressed state rather than by a sentence describing the
              action. Previously the accessible name was "Switch to
              light mode" while the visible text read "Dark mode" -
              the visible label was not contained in the accessible
              name, and neither told you whether the words described
              the current state or the result of pressing it.
              aria-pressed + a label that names the setting is
              unambiguous for both. */}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-pressed={isDark}
          >
            {isDark ? <FaMoon aria-hidden="true" /> : <FaSun aria-hidden="true" />}
            <span>Dark mode</span>
            <span className={`theme-toggle__track${isDark ? "" : " is-light"}`} aria-hidden="true">
              <span className="theme-toggle__knob" />
            </span>
          </button>
          <div className="sidebar__build">
            24 modules &middot; OWASP Top 10 &middot; 2003 &rarr; 2025
          </div>
        </div>
      </aside>
    </>
  );
}
