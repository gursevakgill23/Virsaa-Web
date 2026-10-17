/**
 * pages/GurdwaraAccess/WikipediaCredit.jsx
 * -----------------------------------------------------------------------------
 * The credit Wikipedia's licence (CC BY-SA 4.0) asks for wherever its text is
 * shown: the article's title and link, that it has been shortened, the
 * licence and its link, and when it was fetched. Used under a Gurdwara's
 * history on the finder and on the history page.
 *
 *   <WikipediaCredit data={history.data} className={styles.credit} />
 * Links only appear when the server sent a real https address (utils/safeUrl).
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { safeExternalUrl } from '../../utils/safeUrl';

// "14 Oct 2026" in the reader's own format, or '' for a missing/invalid date
const formatDate = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

// An outside link that opens in a new tab, or plain text when the address isn't safe
const OutLink = ({ href, children }) => {
  const url = safeExternalUrl(href);
  return url ? <a href={url} target="_blank" rel="noopener noreferrer">{children}</a> : <>{children}</>;
};

const WikipediaCredit = ({ data, className }) => {
  if (!data?.found) return null;
  const retrieved = formatDate(data.retrieved_at);
  return (
    <p className={className}>
      From the Wikipedia article <OutLink href={data.url}>“{data.title}”</OutLink> (shortened),
      available under <OutLink href={data.license_url}>{data.license || 'CC BY-SA 4.0'}</OutLink>
      {retrieved ? `. Retrieved ${retrieved}.` : '.'}
    </p>
  );
};

export default WikipediaCredit;
