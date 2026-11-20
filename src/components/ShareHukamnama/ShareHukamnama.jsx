/**
 * components/ShareHukamnama/ShareHukamnama.jsx
 * -----------------------------------------------------------------------------
 * "Share" for today's Hukamnama (the Home page's Hukamnama window).
 *
 * The button opens a small menu:
 *   - Share…              the phone's or computer's own share sheet (WhatsApp,
 *                         Instagram, Messages…), when the browser has one
 *   - Share as a picture  a portrait card (1080 × 1350) with the opening lines in
 *                         Gurmukhi, for Instagram stories and WhatsApp status;
 *                         shared as a picture where the browser can, otherwise
 *                         downloaded
 *   - WhatsApp, Facebook, X, Telegram, Email
 *   - Copy text
 * The text shared is the opening lines in Gurmukhi, where it's from, the date,
 * and a link that opens today's Hukamnama on Virsaa (virsaa.org/#hukamnama).
 *
 *   <ShareHukamnama shabads={shabads} dateLabel="20 November 2026" reference="Raag Sorath · Ang 612" />
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useRef, useState } from 'react';
import { FaShareAlt, FaWhatsapp, FaFacebookF, FaTelegramPlane, FaEnvelope, FaRegCopy, FaImage, FaCheck } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { toast } from '../../utils/notify';
import styles from './ShareHukamnama.module.css';

const SITE = 'https://virsaa.org';
const LINK = `${SITE}/#hukamnama`;
const TITLE_PA = 'ਅੱਜ ਦਾ ਹੁਕਮਨਾਮਾ';
const PLACE = 'Sri Harmandir Sahib, Amritsar';
const TEXT_LINES = 4;     // Gurmukhi lines in the shared text
const FONT = '"Mukta Mahee", "Noto Sans Gurmukhi", "Raavi", sans-serif';

/** The shabad's lines that are Gurbani (not the raag / "ਮਹਲਾ" headings). */
const verses = (shabads) => (shabads || []).flatMap((s) => (s.lines || []))
  .filter((line) => line.gurmukhi && !line.header).map((line) => line.gurmukhi.trim());

function shareText(shabads, dateLabel, reference) {
  const lines = verses(shabads);
  const parts = [
    `${TITLE_PA} · Today’s Hukamnama`,
    [PLACE, dateLabel].filter(Boolean).join(' · '),
    '',
    ...lines.slice(0, TEXT_LINES),
    ...(lines.length > TEXT_LINES ? ['…'] : []),
    ...(reference ? ['', reference] : []),
    '',
    `Read the full Hukamnama on Virsaa: ${LINK}`,
  ];
  return parts.join('\n');
}

// ---------------------------------------------------------------- the picture
function wrap(ctx, text, width) {
  const words = text.split(/\s+/);
  const rows = [];
  let row = '';
  for (const word of words) {
    const next = row ? `${row} ${word}` : word;
    if (ctx.measureText(next).width > width && row) {
      rows.push(row);
      row = word;
    } else {
      row = next;
    }
  }
  if (row) rows.push(row);
  return rows;
}

const loadImage = (src) => new Promise((resolve) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => resolve(null);
  image.src = src;
});

/** A 1080 × 1350 PNG of today's Hukamnama (opening lines), as a Blob. */
async function makePicture(shabads, dateLabel, reference) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  try {
    await Promise.all([
      document.fonts.load(`700 60px ${FONT}`, TITLE_PA),
      document.fonts.load(`500 48px ${FONT}`, 'ਹੁਕਮ'),
    ]);
  } catch { /* the system's Gurmukhi font then */ }

  // Maroon, with a soft gold frame
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#3f0212');
  bg.addColorStop(0.55, '#65041d');
  bg.addColorStop(1, '#8c1232');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(232, 199, 127, 0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#e8c77f';
  ctx.font = `700 64px ${FONT}`;
  ctx.fillText(TITLE_PA, W / 2, 170);
  ctx.fillStyle = '#f2c9d3';
  ctx.font = `500 34px ${FONT}`;
  ctx.fillText([PLACE, dateLabel].filter(Boolean).join('  ·  '), W / 2, 228);

  // The lines: as large as fits (50px down to 34px); at the smallest, the first ones that fit, then "…"
  const lines = verses(shabads);
  const top = 290;
  const bottom = H - 220;
  const width = W - 200;
  let size = 50;
  let rows = [];
  for (; size >= 34; size -= 2) {
    ctx.font = `500 ${size}px ${FONT}`;
    rows = lines.flatMap((line, i) => [...(i ? [''] : []), ...wrap(ctx, line, width)]);
    if (rows.length * size * 1.45 <= bottom - top) break;
  }
  size = Math.max(size, 34);
  const lineHeight = size * 1.45;
  const room = Math.floor((bottom - top) / lineHeight);
  if (rows.length > room) {
    rows = rows.slice(0, room - 2);
    while (rows.length && rows[rows.length - 1] === '') rows.pop();
    rows.push('', '…');
  }
  let y = top + Math.max(0, (bottom - top - rows.length * lineHeight) / 2) + size;
  ctx.fillStyle = '#fff8ec';
  for (const row of rows) {
    if (row) ctx.fillText(row, W / 2, y);
    y += lineHeight;
  }

  // Where it's from, and Virsaa
  ctx.fillStyle = '#e8c77f';
  ctx.font = `500 30px ${FONT}`;
  if (reference) ctx.fillText(reference, W / 2, H - 175);
  const logo = await loadImage('/VirsaaLogo.png');
  ctx.fillStyle = '#f2c9d3';
  ctx.font = `600 32px ${FONT}`;
  if (logo) {
    const size2 = 54;
    const label = 'virsaa.org';
    const labelWidth = ctx.measureText(label).width;
    const startX = (W - (size2 + 16 + labelWidth)) / 2;
    ctx.drawImage(logo, startX, H - 130, size2, size2);
    ctx.textAlign = 'left';
    ctx.fillText(label, startX + size2 + 16, H - 92);
  } else {
    ctx.fillText('virsaa.org', W / 2, H - 92);
  }
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// ---------------------------------------------------------------- the button and menu
const ShareHukamnama = ({ shabads, dateLabel, reference, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);
  const text = shareText(shabads, dateLabel, reference);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // Close on a click outside or Escape
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const systemShare = async () => {
    try {
      await navigator.share({ title: 'Today’s Hukamnama', text });
      setOpen(false);
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Sharing didn’t work. Try another option.');
    }
  };

  const sharePicture = async () => {
    setBusy(true);
    try {
      const blob = await makePicture(shabads, dateLabel, reference);
      if (!blob) throw new Error('No picture');
      const file = new File([blob], 'hukamnama-virsaa.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Today’s Hukamnama', text: LINK });
          setOpen(false);
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }
      // No picture sharing here: save it instead, to post from the phone's photos
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hukamnama-virsaa.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success('Picture saved. Post it from your photos to Instagram or WhatsApp.');
      setOpen(false);
    } catch {
      toast.error('The picture couldn’t be made. Try sharing the text instead.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copying isn’t allowed here. Select the text and copy it instead.');
    }
  };

  const e = encodeURIComponent;
  const links = [
    { label: 'WhatsApp', icon: <FaWhatsapp />, href: `https://wa.me/?text=${e(text)}` },
    { label: 'Facebook', icon: <FaFacebookF />, href: `https://www.facebook.com/sharer/sharer.php?u=${e(LINK)}` },
    { label: 'X', icon: <FaXTwitter />, href: `https://x.com/intent/post?text=${e(`${TITLE_PA} · Today’s Hukamnama`)}&url=${e(LINK)}` },
    { label: 'Telegram', icon: <FaTelegramPlane />, href: `https://t.me/share/url?url=${e(LINK)}&text=${e(text)}` },
    { label: 'Email', icon: <FaEnvelope />, href: `mailto:?subject=${e('Today’s Hukamnama')}&body=${e(text)}` },
  ];

  return (
    <div className={`${styles.wrap} ${className}`} ref={menuRef}>
      <button type="button" className={styles.shareButton} onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu" aria-expanded={open}>
        <FaShareAlt aria-hidden="true" /> Share
      </button>
      {open && (
        <div className={styles.menu} role="menu" aria-label="Share today’s Hukamnama">
          {canShare && (
            <button type="button" role="menuitem" className={styles.item} onClick={systemShare}>
              <FaShareAlt aria-hidden="true" /> Share…
            </button>
          )}
          <button type="button" role="menuitem" className={styles.item} onClick={sharePicture} disabled={busy}>
            <FaImage aria-hidden="true" /> {busy ? 'Making the picture…' : 'Share as a picture'}
          </button>
          <div className={styles.divider} role="separator" />
          {links.map((item) => (
            <a key={item.label} role="menuitem" className={styles.item} href={item.href}
              target={item.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer"
              onClick={() => setOpen(false)}>
              {item.icon} {item.label}
            </a>
          ))}
          <div className={styles.divider} role="separator" />
          <button type="button" role="menuitem" className={styles.item} onClick={copy}>
            {copied ? <FaCheck aria-hidden="true" /> : <FaRegCopy aria-hidden="true" />} {copied ? 'Copied' : 'Copy text'}
          </button>
          <p className={styles.hint}>For Instagram, use “Share as a picture”.</p>
        </div>
      )}
    </div>
  );
};

export default ShareHukamnama;
