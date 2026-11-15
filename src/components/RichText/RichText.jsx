/**
 * components/RichText/RichText.jsx
 * -----------------------------------------------------------------------------
 * Shows text written in the admin (policies, About, Help answers) in the
 * small format the website and the app share:
 *   a blank line starts a new paragraph     "- " starts a bullet point
 *   "### " starts a small heading           **bold**    [a link](/terms)
 *
 * It builds React elements (never raw HTML), and only keeps links to pages of
 * this site ("/terms") or to https:// addresses; anything else stays as text.
 *   <RichText text={section.body} className={styles.prose} />
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { isInternalPath } from '../../utils/safeUrl';

const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;

/** Bold and links inside one line. */
export const renderInline = (text, keyPrefix = 'i') => text.split(INLINE).filter(Boolean).map((piece, index) => {
  const key = `${keyPrefix}-${index}`;
  if (piece.startsWith('**') && piece.endsWith('**') && piece.length > 4) {
    return <strong key={key}>{piece.slice(2, -2)}</strong>;
  }
  const link = piece.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
  if (link) {
    const [, label, target] = link;
    if (isInternalPath(target)) return <Link key={key} to={target}>{label}</Link>;
    if (/^https:\/\/[^\s]+$/i.test(target)) {
      return <a key={key} href={target} target="_blank" rel="noopener noreferrer">{label}</a>;
    }
    return <React.Fragment key={key}>{label}</React.Fragment>;
  }
  return <React.Fragment key={key}>{piece}</React.Fragment>;
});

/** Splits text into blocks: {type: 'p' | 'h' | 'ul', text | items}. */
export const parseBlocks = (text) => {
  const blocks = [];
  let paragraph = [];
  let list = null;
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') });
    if (list) blocks.push({ type: 'ul', items: list });
    paragraph = [];
    list = null;
  };
  String(text || '').replace(/\r\n/g, '\n').split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    if (line.startsWith('### ')) { flush(); blocks.push({ type: 'h', text: line.slice(4) }); return; }
    if (line.startsWith('- ')) {
      if (paragraph.length) { blocks.push({ type: 'p', text: paragraph.join(' ') }); paragraph = []; }
      list = list || [];
      list.push(line.slice(2));
      return;
    }
    if (list) { blocks.push({ type: 'ul', items: list }); list = null; }
    paragraph.push(line);
  });
  flush();
  return blocks;
};

/** A bullet written "**Title**: text", as {title, text} (About's timeline, values and team). */
export const titledItem = (item) => {
  const match = item.match(/^\*\*([^*]+)\*\*\s*[:–—-]\s*(.*)$/);
  return match ? { title: match[1].trim(), text: match[2].trim() } : { title: '', text: item };
};

const RichText = ({ text, className }) => (
  <div className={className}>
    {parseBlocks(text).map((block, index) => {
      const key = `b-${index}`;
      if (block.type === 'h') return <h3 key={key}>{renderInline(block.text, key)}</h3>;
      if (block.type === 'ul') {
        return (
          <ul key={key}>
            {block.items.map((item, i) => <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>)}
          </ul>
        );
      }
      return <p key={key}>{renderInline(block.text, key)}</p>;
    })}
  </div>
);

export default RichText;
