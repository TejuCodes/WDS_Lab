import { useState, useRef, useEffect } from "react";
import {
  FaShieldAlt,
  FaMoon,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [labsOpen, setLabsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setLabsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !event.target.closest(".menu-btn")
      ) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (labsOpen) setLabsOpen(false);
  };

  const toggleLabs = () => {
    setLabsOpen(!labsOpen);
  };

  const handleNavClick = () => {
    setMenuOpen(false);
    setLabsOpen(false);
  };

  return (
    <header className="navbar" role="banner">
      <div className="container navbar-container">
        {/* Logo */}
        <div className="logo">
          <FaShieldAlt className="logo-icon" aria-hidden="true" />
          <div>
            <h2>SecureLearn</h2>
            <small>Learn • Practice • Secure</small>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className={`nav ${menuOpen ? "active" : ""}`}
          ref={menuRef}
          role="navigation"
          aria-label="Main navigation"
        >
          <ul>
            <li>
              <a href="/" onClick={handleNavClick}>
                Home
              </a>
            </li>

            <li className="dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="dropdown-btn"
                onClick={toggleLabs}
                aria-expanded={labsOpen}
                aria-haspopup="true"
                aria-controls="labs-menu"
              >
                Labs
                {labsOpen ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              <div
                id="labs-menu"
                className={`dropdown-menu ${labsOpen ? "show" : ""}`}
                role="menu"
                aria-label="Labs menu"
              >
                <a href="/" role="menuitem" onClick={handleNavClick}>
                  SQL Injection
                </a>
                <a href="/" role="menuitem" onClick={handleNavClick}>
                  XSS
                </a>
                <a href="/" role="menuitem" onClick={handleNavClick}>
                  CSRF
                </a>
                <a href="/" role="menuitem" onClick={handleNavClick}>
                  IDOR
                </a>
                <a href="/" role="menuitem" onClick={handleNavClick}>
                  Command Injection
                </a>
                <a href="/" role="menuitem" onClick={handleNavClick}>
                  File Upload
                </a>
              </div>
            </li>

            <li>
              <a href="/" onClick={handleNavClick}>
                Progress
              </a>
            </li>
            <li>
              <a href="/" onClick={handleNavClick}>
                Cyber News
              </a>
            </li>
            <li>
              <a href="/" onClick={handleNavClick}>
                About
              </a>
            </li>
          </ul>

          {/* Mobile Buttons */}
          <div className="mobile-buttons">
            <button className="theme-btn" aria-label="Toggle theme">
              <FaMoon />
            </button>
            <button className="login-btn">Login</button>
            <button className="start-btn">Get Started</button>
          </div>
        </nav>

        {/* Desktop Right Section */}
        <div className="right-section">
          <button className="theme-btn" aria-label="Toggle theme">
            <FaMoon />
          </button>
          <button className="login-btn">Login</button>
          <button className="start-btn">Get Started →</button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="menu-btn"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </header>
  );
}

export default Navbar;