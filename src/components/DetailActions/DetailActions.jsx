/**
 * components/DetailActions/DetailActions.jsx
 * -----------------------------------------------------------------------------
 * The actions on the ebook, audiobook and author pages, in one block:
 *   - the main ones side by side (Read now, Listen, View all works, ...): the
 *     children, made with <ActionButton>, <ActionLink> or <ListenSoon>
 *   - the everyday ones underneath, as one strip of labelled icons (Like,
 *     Save, Download, Share): `quick`
 *
 *   <DetailActions quick={[
 *     { key: 'like', label: 'Like', icon: <FaRegHeart />, onIcon: <FaHeart />, on: liked, onClick: toggleLike },
 *     { key: 'share', label: 'Share', icon: <FaShareAlt />, onClick: share, pressable: false },
 *   ]}>
 *     <ActionButton icon={<FaBookOpen />} onClick={read}>Read now</ActionButton>
 *     <ListenSoon />
 *   </DetailActions>
 *
 * A main action can carry a note under its name: <ActionButton note="From page 23">Continue</ActionButton>
 *
 * A quick item: label (stays the same; `on` fills the icon and colours it),
 * icon, onIcon, on, onClick, busy (disabled while saving), pressable (a
 * toggle such as Like: aria-pressed; false for Download and Share).
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeadphones } from 'react-icons/fa';
import styles from './DetailActions.module.css';

/**
 * A main action. quiet: outlined instead of filled; on: shown as switched on (an open player);
 * note: a few words under its name ("Continue" / "From page 23").
 */
export const ActionButton = ({ icon, children, note, quiet = false, on = false, ...props }) => (
  <button
    type="button"
    {...props}
    className={`${quiet ? styles.quiet : styles.go} ${on ? styles.quietOn : ''}`}
  >
    {icon}
    {note ? (
      <span className={styles.stack}>
        {children}
        <small>{note}</small>
      </span>
    ) : <span>{children}</span>}
  </button>
);

/** A main action that opens another page. */
export const ActionLink = ({ icon, children, to, quiet = true }) => (
  <Link to={to} className={quiet ? styles.quiet : styles.go}>
    {icon}
    <span>{children}</span>
  </Link>
);

/** Listen, not open yet: the audiobooks Google's voice makes from the ebooks are checked first. */
export const ListenSoon = () => (
  <button type="button" className={`${styles.quiet} ${styles.soon}`} disabled title="Coming soon">
    <FaHeadphones aria-hidden="true" />
    <span className={styles.soonText}>
      Listen
      <small>Coming soon</small>
    </span>
  </button>
);

const DetailActions = ({ children, quick = [], label = 'More actions' }) => {
  const main = React.Children.toArray(children).filter(Boolean);
  return (
    <div className={styles.dock}>
      {main.length > 0 && <div className={styles.main}>{main}</div>}
      {quick.length > 0 && (
        <div className={styles.quick} role="group" aria-label={label}>
          {quick.map(({ key, label: text, icon, onIcon, on = false, onClick, busy = false, pressable = true }) => (
            <button
              key={key}
              type="button"
              className={`${styles.quickItem} ${on ? styles.quickOn : ''}`}
              onClick={onClick}
              disabled={busy}
              aria-pressed={pressable ? on : undefined}
            >
              {on && onIcon ? onIcon : icon}
              <span>{text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DetailActions;
