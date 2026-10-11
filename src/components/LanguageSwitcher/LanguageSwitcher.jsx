import React, { useEffect, useRef, useState } from 'react';
import { FaGlobe, FaCheck } from 'react-icons/fa';
import { LANGUAGES, getLanguage, setLanguage } from '../../i18n/siteLanguage';
import styles from './LanguageSwitcher.module.css';

/* Globe button in the navbar: English, ਪੰਜਾਬੀ, Français. Its own labels are never translated. */
const LanguageSwitcher = ({ className = '' }) => {
  const [open, setOpen] = useState(false);
  const current = getLanguage();
  const wrapRef = useRef(null);
  const active = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`${styles.wrap} notranslate ${className}`} translate="no" ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Language: ${active.label}`}
        title="Language"
      >
        <FaGlobe aria-hidden="true" />
        <span className={styles.code}>{active.short}</span>
      </button>
      {open && (
        <ul className={styles.menu} role="menu">
          {LANGUAGES.map((lang) => (
            <li key={lang.code} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={lang.code === current}
                lang={lang.code}
                className={`${styles.option} ${lang.code === current ? styles.optionOn : ''}`}
                onClick={() => { setOpen(false); setLanguage(lang.code); }}
              >
                <span>{lang.label}</span>
                {lang.code === current && <FaCheck aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
