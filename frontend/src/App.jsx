import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import OwaspHistoryPage from "./pages/OwaspHistoryPage";
import VulnerabilityDetailPage from "./pages/VulnerabilityDetailPage";
import ModulePage from "./pages/ModulePage";
import ModulesPage from "./pages/ModulesPage";
import NewsPage from "./pages/NewsPage";
import AboutPage from "./pages/AboutPage";
import NotFoundPage from "./pages/NotFoundPage";

/**
 * ============================================================
 * ROUTES
 * ------------------------------------------------------------
 * Every URL the app answers, and the page component behind it.
 *
 * Two route patterns worth noticing:
 *
 * 1. /modules/:moduleKey  - a parameter. React Router matches any
 *    single word there, so all 24 module links reuse the one
 *    ModulePage component instead of 24 near-identical files. The
 *    bare /modules route is the catalogue index.
 *
 * 2. The splat route * at the end. React Router tries the routes
 *    top to bottom and uses the FIRST one that matches, so a catch
 *    all must come last. Putting it earlier would send every URL to
 *    the 404 page.
 *
 * Layout wraps everything (it holds the sidebar), and the pages are
 * its children rendered through <Outlet />.
 * ============================================================ */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/owasp" element={<OwaspHistoryPage />} />
        <Route path="/owasp/vulnerability/:slug" element={<VulnerabilityDetailPage />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/modules/:moduleKey" element={<ModulePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
