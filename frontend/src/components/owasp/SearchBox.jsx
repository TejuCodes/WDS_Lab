import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

/**
 * ============================================================
 * SEARCH BOX
 * ------------------------------------------------------------
 * A plain controlled input. We only search once the visitor has
 * typed 2+ characters (the API refuses shorter input anyway) and
 * we wait a moment after they stop typing, so every keystroke does
 * not fire a request.
 *
 * "useEffect" runs after the component renders. `setTimeout` inside
 * it plus the cleanup function is the standard "debounce" pattern:
 * if the user keeps typing, the previous timer is cancelled, so
 * only the last keystroke actually searches.
 * ============================================================ */
export default function SearchBox({ value, onChange, onSubmit, placeholder }) {
  return (
    <form
      className="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
      role="search"
    >
      <span className="search__icon" aria-hidden="true">
        <FaSearch />
      </span>
      <input
        className="search__input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search (try: injection, xss, ssn)..."}
        aria-label="Search vulnerabilities"
      />
      <button className="btn btn--sm" type="submit">
        Search
      </button>
    </form>
  );
}
