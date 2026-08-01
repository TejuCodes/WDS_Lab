import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

import {
  FaShieldAlt,
  FaHome,
  FaUserCircle,
  FaFlask,
  FaChartLine,
  FaNewspaper,
  FaInfoCircle,
  FaMoon,
  FaSun,
  FaSignInAlt,
  FaChevronDown,
  FaBars,
  FaTimes,
} from "react-icons/fa";

import "./Sidebar.css";

function Sidebar() {
  const [open, setOpen] = useState(false);
  const [labsOpen, setLabsOpen] = useState(false);

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.body.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const closeSidebar = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle */}

      <button
        className="mobile-btn"
        onClick={() => setOpen(!open)}
      >
        {open ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}

      <aside className={`sidebar ${open ? "show" : ""}`}>

        {/* Logo */}

        <div>

          <div className="logo">

            <FaShieldAlt className="logo-icon" />

            <div>
              <h2>SecureLearn</h2>
              <small>Learn • Practice • Secure</small>
            </div>

          </div>

          {/* Navigation */}

          <ul className="menu">

            {/* Home */}

            <li>
              <NavLink
                to="/"
                end
                onClick={closeSidebar}
              >
                <FaHome />
                <span>Home</span>
              </NavLink>
            </li>

            {/* Labs */}
<li>
  <NavLink
    to="/dashboard"
    onClick={closeSidebar}
  >
    <FaUserCircle />
    Dashboard
  </NavLink>
</li>
            <li>

              <button
                className="labs-btn"
                onClick={() => setLabsOpen(!labsOpen)}
              >
                <span>
                  <FaFlask />
                  Labs
                </span>

                <FaChevronDown
                  className={labsOpen ? "rotate" : ""}
                />
              </button>

            </li>

            {labsOpen && (
              <ul className="submenu">

                <li>
                  <NavLink
                    to="/labs/sql-injection"
                    onClick={closeSidebar}
                  >
                    SQL Injection
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs/xss"
                    onClick={closeSidebar}
                  >
                    XSS
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs/csrf"
                    onClick={closeSidebar}
                  >
                    CSRF
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs/idor"
                    onClick={closeSidebar}
                  >
                    IDOR
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs/ssrf"
                    onClick={closeSidebar}
                  >
                    SSRF
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs/command-injection"
                    onClick={closeSidebar}
                  >
                    Command Injection
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs/file-upload"
                    onClick={closeSidebar}
                  >
                    File Upload
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs/broken-authentication"
                    onClick={closeSidebar}
                  >
                    Broken Authentication
                  </NavLink>
                </li>

              </ul>
            )}

            {/* Progress */}

            <li>
              <NavLink
                to="/progress"
                onClick={closeSidebar}
              >
                <FaChartLine />
                <span>Progress</span>
              </NavLink>
            </li>

            {/* Cyber News */}

            <li>
              <NavLink
                to="/news"
                onClick={closeSidebar}
              >
                <FaNewspaper />
                <span>Cyber News</span>
              </NavLink>
            </li>

            {/* About */}

            <li>
              <NavLink
                to="/about"
                onClick={closeSidebar}
              >
                <FaInfoCircle />
                <span>About</span>
              </NavLink>
            </li>

          </ul>

        </div>

        {/* Bottom Buttons */}

        <div className="bottom">

          <button
            className="theme-btn"
            onClick={() =>
              setTheme(
                theme === "dark"
                  ? "light"
                  : "dark"
              )
            }
          >
            {theme === "dark"
              ? <FaSun />
              : <FaMoon />}

            {theme === "dark"
              ? "Light Mode"
              : "Dark Mode"}
          </button>

          <NavLink
            to="/login"
            className="login-btn"
            onClick={closeSidebar}
          >
            <FaSignInAlt />
            Login
          </NavLink>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;