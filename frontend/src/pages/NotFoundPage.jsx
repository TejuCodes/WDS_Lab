import { Link } from "react-router-dom";

/** Shown for any URL the router does not recognise. */
export default function NotFoundPage() {
  return (
    <div className="empty-state">
      <span className="eyebrow">404</span>
      <h1>That page does not exist</h1>
      <p>
        The link may be out of date. The OWASP history timeline is the best place to pick up again.
      </p>
      <div className="hero__actions" style={{ justifyContent: "center" }}>
        <Link to="/owasp" className="btn btn--primary">
          Go to the timeline
        </Link>
        <Link to="/" className="btn">
          Back home
        </Link>
      </div>
    </div>
  );
}
