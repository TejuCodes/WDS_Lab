import {
  FaBolt,
  FaBoxes,
  FaBroadcastTower,
  FaCode,
  FaCubes,
  FaDatabase,
  FaExchangeAlt,
  FaFileCode,
  FaFingerprint,
  FaFolderOpen,
  FaGlobe,
  FaHashtag,
  FaIdCard,
  FaKey,
  FaLink,
  FaLock,
  FaProjectDiagram,
  FaRoute,
  FaServer,
  FaSitemap,
  FaStamp,
  FaTerminal,
  FaUserLock,
  FaWindowRestore,
  FaQuestion,
} from "react-icons/fa";

/**
 * ============================================================
 * MODULE ICON
 * ------------------------------------------------------------
 * The module data files store an icon as a string name, so they stay
 * free of imports and can be authored without thinking about the
 * component layer. This map is the only place that resolves one.
 *
 * An explicit map rather than a dynamic import of the whole icon
 * package: bundling every Font Awesome icon to save one lookup table
 * would add hundreds of kilobytes to the build.
 * ============================================================ */

const ICONS = {
  FaBolt,
  FaBoxes,
  FaBroadcastTower,
  FaCode,
  FaCubes,
  FaDatabase,
  FaExchangeAlt,
  FaFileCode,
  FaFingerprint,
  FaFolderOpen,
  FaGlobe,
  FaHashtag,
  FaIdCard,
  FaKey,
  FaLink,
  FaLock,
  FaProjectDiagram,
  FaRoute,
  FaServer,
  FaSitemap,
  FaStamp,
  FaTerminal,
  FaUserLock,
  FaWindowRestore,
};

export default function ModuleIcon({ name, ...rest }) {
  const Icon = ICONS[name] ?? FaQuestion;
  return <Icon aria-hidden="true" {...rest} />;
}
