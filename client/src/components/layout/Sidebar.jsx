import { useState, useEffect } from "react";

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

  /* ===========================
     STATES
  =========================== */

  const [open, setOpen] = useState(false);

  const [labs, setLabs] = useState(false);

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  /* ===========================
     THEME
  =========================== */

  useEffect(() => {

    document.body.classList.toggle(
      "light",
      theme === "light"
    );

    localStorage.setItem("theme", theme);

  }, [theme]);

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

        <div>

          {/* Logo */}

          <div className="logo">

            <FaShieldAlt className="logo-icon" />

            <div>
              <h2>SecureLearn</h2>
              <small>Learn • Practice • Secure</small>
            </div>

          </div>

          {/* Navigation */}

          <ul className="menu">

            <li className="active">
              <FaHome />
              Home
            </li>

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

                <li>SQL Injection</li>

                <li>XSS</li>

                <li>CSRF</li>

                <li>IDOR</li>

                <li>SSRF</li>

                <li>Command Injection</li>

                <li>File Upload</li>

                <li>Broken Authentication</li>

              </ul>

            )}

            <li>
              <FaChartLine />
              Progress
            </li>

            <li>
              <FaNewspaper />
              Cyber News
            </li>

            <li>
              <FaInfoCircle />
              About
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
              : <FaMoon />
            }

            {theme === "dark"
              ? "Light Mode"
              : "Dark Mode"}
          </button>

          <button className="login-btn">

            <FaSignInAlt />

            Login

          </button>

        </div>

      </aside>

    </>
  );
}

export default Sidebar;