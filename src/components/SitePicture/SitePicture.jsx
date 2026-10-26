/**
 * components/SitePicture/SitePicture.jsx
 * -----------------------------------------------------------------------------
 * Pictures that come from our S3 bucket instead of public/images.
 *
 *   <SitePicture name="home-gurbani" alt="" className={styles.tileImage} />
 *       A website picture by name (hooks/useSiteImages.js). Until it is known,
 *       or if it can't be loaded, a soft placeholder of the same size is shown.
 *       alt: pass "" for decorative pictures; leave it out to use the
 *       description that comes with the picture.
 *
 *   <CoverPicture src={book.cover} fallback="fallback-book" alt="" className={...} />
 *       A picture from the API (a cover, a photo). When it is missing or
 *       fails to load, the website picture `fallback` is shown instead.
 *
 * Both take the usual <img> props (loading, sizes, onLoad...). The class
 * name is put on the placeholder too, so it fills the same frame. Pictures
 * get a paper-coloured backing, so dark writing on a see-through background
 * still shows on the dark theme.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useState } from 'react';
import { useSitePicture } from '../../hooks/useSiteImages';
import { safeUrl } from '../../utils/safeUrl';
import styles from './SitePicture.module.css';

const Placeholder = ({ className, alt }) => (
  <span
    className={`${styles.placeholder} ${className || ''}`}
    role={alt ? 'img' : undefined}
    aria-label={alt || undefined}
    aria-hidden={alt ? undefined : true}
  />
);

export const SitePicture = ({ name, alt, className, loading = 'lazy', ...imgProps }) => {
  const picture = useSitePicture(name);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [picture?.url]);

  if (!picture || failed) return <Placeholder className={className} alt={alt} />;
  return (
    <img
      src={picture.url}
      alt={alt ?? picture.alt ?? ''}
      width={picture.width || undefined}
      height={picture.height || undefined}
      loading={loading}
      decoding="async"
      className={`${styles.picture} ${className || ''}`}
      onError={() => setFailed(true)}
      {...imgProps}
    />
  );
};

export const CoverPicture = ({ src, fallback = 'fallback-book', alt = '', className, loading = 'lazy', ...imgProps }) => {
  const own = safeUrl(src, { allowRelative: false });
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [own]);

  if (!own || failed) return <SitePicture name={fallback} alt={alt} className={className} loading={loading} {...imgProps} />;
  return (
    <img src={own} alt={alt} loading={loading} decoding="async" className={`${styles.picture} ${className || ''}`}
      onError={() => setFailed(true)} {...imgProps} />
  );
};

export default SitePicture;
