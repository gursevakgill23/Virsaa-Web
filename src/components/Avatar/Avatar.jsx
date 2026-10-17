/**
 * components/Avatar/Avatar.jsx
 * -----------------------------------------------------------------------------
 * A person's picture, or their initials in a circle when there is none (or it
 * can't be loaded). Replaces the old placeholder photos in public/images.
 *
 *   <Avatar src={user.profile_photo} name="Harpreet Kaur" className={styles.userImage} />
 *
 * className sets the size and shape (the same class works for the photo and
 * the initials, and its shape wins over the default circle); the initials
 * scale with the size.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useState } from 'react';
import { safeUrl } from '../../utils/safeUrl';
import styles from './Avatar.module.css';

/** "Harpreet Kaur" -> "HK"; "harpreet" -> "H"; nothing -> "" (a person icon is drawn instead) */
export const initialsOf = (name) => String(name || '')
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0].toUpperCase())
  .join('');

// Set inline so a page's own class (often a pale "loading" background) can't hide the letters
const INITIALS_COLOURS = {
  backgroundImage: 'linear-gradient(145deg, var(--maroon-bright, #8c1232), var(--maroon-deep, #3f0212))',
  color: '#fff',
};

const Avatar = ({ src, name, alt = '', className, ...imgProps }) => {
  // http(s) photos, or a preview (blob: or data:image) of a picture the person has just chosen
  const isPreview = typeof src === 'string' && (src.startsWith('blob:') || src.startsWith('data:image/'));
  const photo = isPreview ? src : safeUrl(src, { allowRelative: false });
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo]);

  if (photo && !failed) {
    return <img src={photo} alt={alt} className={className} onError={() => setFailed(true)} {...imgProps} />;
  }
  const initials = initialsOf(name);
  return (
    <span className={`${styles.avatar} ${className || ''}`} style={INITIALS_COLOURS} role={alt ? 'img' : undefined}
      aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
      <span className={styles.initials}>
        {initials || (
          <svg viewBox="0 0 24 24" className={styles.person} focusable="false">
            <circle cx="12" cy="8.5" r="4" />
            <path d="M4 20.5c0-4.1 3.6-6.8 8-6.8s8 2.7 8 6.8" />
          </svg>
        )}
      </span>
    </span>
  );
};

export default Avatar;
