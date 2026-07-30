import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";

// Main Pages
import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Progress from "./pages/Progress/Progress";
import News from "./pages/News/News";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import Admin from "./pages/Admin/Admin";

// Labs
import SQLInjection from "../src/pages/Labs/SQLInjection/SQLInjection.jsx";
import XSS from "../src/pages/Labs/XSS/XSS";
import CSRF from "./pages/Labs/CSRF/CSRF";
import IDOR from "./pages/Labs/IDOR/IDOR";
import CommandInjection from "./pages/Labs/CommandInjection/CommandInjection";
import FileUpload from "./pages/Labs/FileUpload/FileUpload";
import BrokenAuthentication from "./pages/Labs/BrokenAuthentication/BrokenAuthentication";
import SSRF from "./pages/Labs/SSRF/SSRF";
import XXE from "../src/pages/Labs/XXE/XXE.jsx";
import SecurityMisconfiguration from "../src/pages/Labs/SecurityMisconfiguration/SecurityMisconfiguration.jsx";

import "./App.css";

function App() {
  return (
    <>
      <Sidebar />

      <main className="main-content">
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/news" element={<News />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />

          {/* OWASP Labs */}
          <Route
            path="/labs/sql-injection"
            element={<SQLInjection />}
          />
          <Route
            path="/labs/xss"
            element={<XSS />}
          />
          <Route
            path="/labs/csrf"
            element={<CSRF />}
          />
          <Route
            path="/labs/idor"
            element={<IDOR />}
          />
          <Route
            path="/labs/command-injection"
            element={<CommandInjection />}
          />
          <Route
            path="/labs/file-upload"
            element={<FileUpload />}
          />
          <Route
            path="/labs/broken-authentication"
            element={<BrokenAuthentication />}
          />
          <Route
            path="/labs/ssrf"
            element={<SSRF />}
          />
          <Route
            path="/labs/xxe"
            element={<XXE />}
          />
          <Route
            path="/labs/security-misconfiguration"
            element={<SecurityMisconfiguration />}
          />
        </Routes>
      </main>
    </>
  );
}

export default App;