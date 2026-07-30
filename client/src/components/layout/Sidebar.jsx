import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

import {
  FaShieldAlt,
  FaHome,
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
  const [labs, setLabs] = useState(false);

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
      {/* Mobile Menu Button */}

      <button
        className="mobile-btn"
        onClick={() => setOpen(!open)}
      >
        {open ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}

      <aside className={open ? "sidebar show" : "sidebar"}>

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
                Home
              </NavLink>

            </li>

            {/* Labs */}

            <li>

              <button
                className="labs-btn"
                onClick={() => setLabs(!labs)}
              >
                <span>

                  <FaFlask />

                  Labs

                </span>

                <FaChevronDown
                  className={labs ? "rotate" : ""}
                />

              </button>

            </li>

            {labs && (

              <ul className="submenu">

                <li>
                  <NavLink
                    to="/labs"
                    onClick={closeSidebar}
                  >
                    SQL Injection
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs"
                    onClick={closeSidebar}
                  >
                    XSS
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs"
                    onClick={closeSidebar}
                  >
                    CSRF
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs"
                    onClick={closeSidebar}
                  >
                    IDOR
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs"
                    onClick={closeSidebar}
                  >
                    SSRF
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs"
                    onClick={closeSidebar}
                  >
                    Command Injection
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs"
                    onClick={closeSidebar}
                  >
                    File Upload
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/labs"
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
                Progress
              </NavLink>

            </li>

            {/* News */}

            <li>

              <NavLink
                to="/news"
                onClick={closeSidebar}
              >
                <FaNewspaper />
                Cyber News
              </NavLink>

            </li>

            {/* About */}

            <li>

              <NavLink
                to="/about"
                onClick={closeSidebar}
              >
                <FaInfoCircle />
                About
              </NavLink>

            </li>

          </ul>

        </div>

        {/* Bottom */}

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