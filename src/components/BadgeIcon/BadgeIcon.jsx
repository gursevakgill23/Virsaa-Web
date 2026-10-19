/**
 * components/BadgeIcon/BadgeIcon.jsx
 * -----------------------------------------------------------------------------
 * Shows a learning badge's icon (My Profile, game profile card, results).
 * A badge either has its own uploaded image, or an icon name from the list below.
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import {
  FaBookOpen, FaGraduationCap, FaUniversity, FaQuestionCircle, FaCompass, FaCrown, FaStar, FaGem,
  FaBolt, FaGamepad, FaDiceD6, FaFont, FaSearch, FaBrain, FaMedal, FaFlag, FaTrophy, FaFire,
  FaCalendarCheck, FaChartLine, FaCoins, FaAward,
  // the map games' badges
  FaPenNib, FaSpellCheck, FaSun, FaLightbulb, FaQuoteLeft, FaCloudRain, FaKeyboard, FaHistory, FaUserSecret,
  FaMapMarkedAlt, FaPuzzlePiece, FaLandmark, FaWind, FaHandsHelping,
} from 'react-icons/fa';
import { GiKite } from 'react-icons/gi';

/*
 * Badges store an icon name (e.g. "FaTrophy") in the database.
 * Only the icons listed here are bundled; anything else falls back to a medal.
 * Add an entry here when you give a badge a new icon name in the admin.
 */
const ICONS = {
  FaBookOpen, FaGraduationCap, FaUniversity, FaQuestionCircle, FaCompass, FaCrown, FaStar, FaGem,
  FaBolt, FaGamepad, FaDiceD6, FaFont, FaSearch, FaBrain, FaMedal, FaFlag, FaTrophy, FaFire,
  FaCalendarCheck, FaChartLine, FaCoins, FaAward,
  FaPenNib, FaSpellCheck, FaSun, FaLightbulb, FaQuoteLeft, FaCloudRain, FaKeyboard, FaHistory, FaUserSecret,
  FaMapMarkedAlt, FaPuzzlePiece, FaLandmark, FaWind, FaHandsHelping, GiKite,
};

// Props: name (icon name from the database), image (optional picture URL),
// plus any other props (className, title…) passed to the icon
const BadgeIcon = ({ name, image, ...rest }) => {
  if (image) return <img src={image} alt="" style={{ width: '1em', height: '1em', objectFit: 'contain' }} {...rest} />;
  const Icon = ICONS[name] || FaMedal;
  return <Icon aria-hidden="true" {...rest} />;
};

export default BadgeIcon;
