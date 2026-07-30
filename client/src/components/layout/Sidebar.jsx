import { useState } from "react";
import {
  FaShieldAlt,
  FaHome,
  FaFlask,
  FaChartLine,
  FaNewspaper,
  FaInfoCircle,
  FaMoon,
  FaSignInAlt,
  FaChevronDown,
  FaBars,
  FaTimes,
} from "react-icons/fa";

import "./Sidebar.css";

function Sidebar() {

  const [open,setOpen]=useState(false);
  const [labs,setLabs]=useState(false);

  return (
    <>

      <button
        className="mobile-btn"
        onClick={()=>setOpen(!open)}
      >
        {open ? <FaTimes/> : <FaBars/>}
      </button>

      <aside className={open ? "sidebar show" : "sidebar"}>

        <div>

          <div className="logo">

            <FaShieldAlt className="logo-icon"/>

            <div>
              <h2>SecureLearn</h2>
              <small>Learn • Practice • Secure</small>
            </div>

          </div>

          <ul className="menu">

            <li className="active">
              <FaHome/>
              Home
            </li>

            <li>

              <button
                className="labs-btn"
                onClick={()=>setLabs(!labs)}
              >

                <span>
                  <FaFlask/>
                  Labs
                </span>

                <FaChevronDown
                  className={labs ? "rotate":""}
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
                <li>Broken Auth</li>

              </ul>

            )}

            <li>
              <FaChartLine/>
              Progress
            </li>

            <li>
              <FaNewspaper/>
              Cyber News
            </li>

            <li>
              <FaInfoCircle/>
              About
            </li>

          </ul>

        </div>

        <div className="bottom">

          <button className="theme-btn">
            <FaMoon/>
            Theme
          </button>

          <button className="login-btn">
            <FaSignInAlt/>
            Login
          </button>

        </div>

      </aside>

    </>
  );

}

export default Sidebar;