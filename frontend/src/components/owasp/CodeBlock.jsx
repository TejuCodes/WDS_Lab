import { useState } from "react";
import { FaCopy, FaCheck } from "react-icons/fa";

/**
 * ============================================================
 * CODE BLOCK
 * ------------------------------------------------------------
 * A small, dependency-free code viewer.
 *
 * We do NOT use a syntax-highlighting library on purpose: the whole
 * app should install and run with as few packages as possible, and
 * a monospace block with a coloured header is perfectly readable
 * for teaching snippets of ten lines.
 *
 * "tone" only changes the accent colour:
 *   danger = the vulnerable example
 *   safe   = the fixed example
 * ============================================================
 */
export default function CodeBlock({ language, code, tone = "safe", label }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      // Put the label back after a moment so the button does not stay
      // stuck saying "Copied" forever.
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (no permission, insecure origin).
      // Selecting the text manually still works.
    }
  }

  return (
    <div className={`code code--${tone}`}>
      <div className="code__header">
        <span className="code__lang">{language || "text"}</span>
        {label ? <span className="code__label">{label}</span> : null}
        <button type="button" className="code__copy" onClick={copy} aria-label="Copy code">
          {copied ? <FaCheck /> : <FaCopy />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="code__body">
        <code>{code}</code>
      </pre>
    </div>
  );
}
