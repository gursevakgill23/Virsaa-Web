/**
 * worker/index.js  -  the Cloudflare Worker in front of virsaa.org
 * -----------------------------------------------------------------------------
 * Server-side rendering of every page, so people and search engines get the
 * page's real content in the HTML itself: its title and description, headings,
 * text, pictures and links (to every book, author, article, story and lesson).
 *
 * For a page address it:
 *   1. works out the page from the address (the same addresses as App.js),
 *   2. reads that page's content from the Virsaa API (the same data the React
 *      pages show),
 *   3. writes it into index.html: <title>, the description, canonical address,
 *      social-share tags, structured data (JSON-LD), and the page itself
 *      (header links, headings, text, links, footer) inside <div id="root">,
 *   4. answers with the right status: 200, 404 for a page or item that doesn't
 *      exist, 301 for an address with a trailing slash, 503 when the API can't
 *      be reached (so search engines come back later).
 * When the React app starts in the browser it replaces that content with the
 * interactive page, exactly as before.
 *
 * Also here:
 *   /sitemap.xml   every public page, book, author, article, story and lesson
 *   /robots.txt    allows everything public, points to the sitemap
 *   /ads.txt       Google AdSense's seller line (when ADSENSE_CLIENT is set)
 * Files (/static/..., pictures, manifest.json...) are served as they are.
 *
 * Rendered pages are kept in Cloudflare's cache for a few minutes (the sitemap
 * for an hour), so the API isn't asked for every visit.
 *
 * Settings (wrangler.jsonc "vars"):
 *   API_URL    the API's address            (default https://api.virsaa.org)
 *   SITE_URL   the website's main address   (default https://virsaa.org)
 *   ADSENSE_CLIENT  the AdSense publisher id, "ca-pub-…" (adds the site-check tag and /ads.txt)
 *   SOCIAL_LINKS    Virsaa's profiles, comma-separated (Instagram, YouTube…), for Google's "about" panel
 * -----------------------------------------------------------------------------
 */

const PAGE_CACHE_SECONDS = 300;
const SITEMAP_CACHE_SECONDS = 3600;
const API_TIMEOUT_MS = 6000;
const MAX_LIST = 1000;   // the most items listed on one page / in the sitemap per kind

const SITE_NAME = 'Virsaa';
const TAGLINE = 'Punjabi and Sikh heritage through books, history, Gurbani and learning';
const DEFAULT_DESCRIPTION = 'Read Punjabi and Sikh ebooks, listen to audiobooks, explore Sikh history, sakhis and '
  + 'Gurbani, find Gurdwaras, and learn with quizzes and games. On the web and on iPhone.';

// Pages that need an account: rendered with a short note, and kept out of search results
const ACCOUNT_PAGES = ['/my-profile', '/account-settings', '/my-favorites', '/history', '/notifications',
  '/my-rewards', '/share-a-book', '/checkout'];
// Pages that work for anyone but aren't useful in search results
const NOINDEX_PAGES = ['/forgot-password', '/newsletter/unsubscribe'];

// The site's main sections (header, footer, home page)
const NAV = [
  ['/', 'Home'], ['/collections', 'Library'], ['/collections/ebooks', 'Ebooks'],
  ['/collections/audiobooks', 'Audiobooks'], ['/collections/authors', 'Authors'], ['/sikh-history', 'Sikh History'],
  ['/sakhis', 'Sakhis'], ['/gurbani', 'Gurbani'], ['/learning', 'Learning'], ['/gurdwara-access', 'Gurdwaras'],
  ['/news', 'News'], ['/premium', 'Membership'],
];
const FOOTER_LINKS = [
  ['/about', 'About'], ['/help', 'Help Center and FAQs'], ['/privacy-policy', 'Privacy Policy'],
  ['/terms', 'Terms of Service'], ['/subscription-policy', 'Subscription Policy'], ['/refund-policy', 'Refund Policy'],
  ['/copyright', 'Copyright'], ['/cookie-policy', 'Cookie Policy'], ['/picture-credits', 'Picture credits'],
  ['/login', 'Sign in'], ['/signup', 'Create an account'],
];
const POLICIES = {
  '/privacy-policy': 'privacy-policy', '/terms': 'terms', '/subscription-policy': 'subscription-policy',
  '/refund-policy': 'refund-policy', '/copyright': 'copyright', '/cookie-policy': 'cookie-policy', '/about': 'about',
};
const STATIC_PAGES = ['/', '/collections', '/collections/ebooks', '/collections/audiobooks', '/collections/authors',
  '/sikh-history', '/sakhis', '/gurbani', '/learning', '/learning/games', '/gurdwara-access', '/news', '/premium',
  '/about', '/help', '/privacy-policy', '/terms', '/subscription-policy', '/refund-policy', '/copyright',
  '/cookie-policy', '/picture-credits', '/login', '/signup'];

// ============================================================================ the Worker
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') return env.ASSETS.fetch(request);
    if (url.pathname === '/robots.txt') return robots(env);
    if (url.pathname === '/ads.txt') return adsTxt(env);
    if (url.pathname === '/sitemap.xml') return cached(request, ctx, SITEMAP_CACHE_SECONDS, () => sitemap(env));
    if (isFile(url.pathname)) return env.ASSETS.fetch(request);

    // One address per page: no doubled or trailing slashes, and /home is the home page
    const clean = url.pathname.replace(/\/{2,}/g, '/').replace(/(.)\/$/, '$1');
    if (clean !== url.pathname || clean === '/home') {
      return Response.redirect(`${url.origin}${clean === '/home' ? '/' : clean}${url.search}`, 301);
    }
    return cached(request, ctx, PAGE_CACHE_SECONDS, () => renderPage(request, env, url));
  },
};

const isFile = (path) => /\.[a-z0-9]{1,8}$/i.test(path) || path.startsWith('/static/');

/** Keep a GET answer in Cloudflare's cache for `seconds` (only 200s and 404s). */
async function cached(request, ctx, seconds, make) {
  const cache = caches.default;
  const key = new Request(new URL(request.url).toString(), { method: 'GET' });
  if (request.method === 'GET') {
    const hit = await cache.match(key);
    if (hit) return hit;
  }
  const response = await make();
  if (request.method === 'GET' && (response.status === 200 || response.status === 404)) {
    const copy = new Response(response.clone().body, response);
    copy.headers.set('Cache-Control', `public, max-age=0, s-maxage=${seconds}`);
    ctx.waitUntil(cache.put(key, copy));
  }
  return response;
}

// ============================================================================ the API
class NotFound extends Error {}
class Unavailable extends Error {}

function apiBase(env) {
  return String(env.API_URL || 'https://api.virsaa.org').replace(/\/$/, '');
}

function siteBase(env) {
  return String(env.SITE_URL || 'https://virsaa.org').replace(/\/$/, '');
}

/** GET from the API: the JSON, NotFound for a 404, Unavailable for anything else that failed. */
async function api(env, path) {
  let response;
  try {
    response = await fetch(`${apiBase(env)}${path}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'virsaa-web-renderer' },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      cf: { cacheTtl: 120, cacheEverything: true },
    });
  } catch (error) {
    throw new Unavailable(`${path}: ${error.message}`);
  }
  if (response.status === 404) throw new NotFound(path);
  if (!response.ok) throw new Unavailable(`${path}: ${response.status}`);
  try {
    return await response.json();
  } catch {
    throw new Unavailable(`${path}: not JSON`);
  }
}

/** The same, but an empty answer instead of an error (for the extra parts of a page). */
async function apiOr(env, path, fallback) {
  try {
    return await api(env, path);
  } catch {
    return fallback;
  }
}

const listOf = (data) => (Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []);

/** Every ebook card, page by page (newest first). */
async function allEbooks(env, extra = '') {
  const books = [];
  for (let page = 1; page <= 20 && books.length < MAX_LIST; page += 1) {
    const data = await api(env, `/collections/ebooks/?page=${page}&page_size=60&ordering=-id${extra}`);
    books.push(...listOf(data));
    if (!data?.pages || page >= data.pages) break;
  }
  return books.slice(0, MAX_LIST);
}

// ============================================================================ writing HTML
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
const enc = (value) => encodeURIComponent(String(value ?? ''));
const clip = (value, length = 160) => {
  const text = String(value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length - 1).replace(/\s+\S*$/, '')}…` : text;
};
const plain = (value) => String(value ?? '')
  .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1').replace(/^###\s+/gm, '');
const link = (href, text, attrs = '') => `<a href="${esc(href)}"${attrs}>${esc(text)}</a>`;
const httpsOnly = (value) => (/^https:\/\/[^\s"'<>]+$/i.test(String(value || '')) ? String(value) : '');
const year = (date) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};
const longDate = (date) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};
const paragraphs = (items) => (items || []).filter((p) => String(p || '').trim()).map((p) => `<p>${esc(p)}</p>`).join('');

/** The small text format of the policies, About and FAQ answers: paragraphs, "- " bullets, "### " headings, **bold**, [links](/x). */
function richText(text) {
  const inline = (line) => esc(line)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^\s]+?)\)(?=\s|$|[.,;:!?])/g, (whole, label, target) => {
      const raw = target.replace(/&amp;/g, '&');
      if (/^\/(?!\/)/.test(raw) || /^https:\/\//i.test(raw)) return `<a href="${esc(raw)}">${label}</a>`;
      return label;
    });
  const out = [];
  let para = [];
  let bullets = [];
  const flushPara = () => { if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`); para = []; };
  const flushBullets = () => { if (bullets.length) out.push(`<ul>${bullets.map((b) => `<li>${inline(b)}</li>`).join('')}</ul>`); bullets = []; };
  for (const raw of String(text ?? '').replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) { flushPara(); flushBullets(); } else if (line.startsWith('### ')) {
      flushPara(); flushBullets(); out.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith('- ')) { flushPara(); bullets.push(line.slice(2)); } else { flushBullets(); para.push(line); }
  }
  flushPara();
  flushBullets();
  return out.join('');
}

/** A list of cards: [{href, title, meta, text, image}] */
function cards(items, empty = 'Nothing here yet.') {
  if (!items.length) return `<p>${esc(empty)}</p>`;
  return `<ul class="ssr-cards">${items.map((item) => `<li>${item.image ? `<img src="${esc(item.image)}" alt="" loading="lazy" width="96" height="128">` : ''}<div><h3>${link(item.href, item.title)}</h3>${item.meta ? `<p class="ssr-meta">${esc(item.meta)}</p>` : ''}${item.text ? `<p>${esc(clip(item.text, 220))}</p>` : ''}</div></li>`).join('')}</ul>`;
}

const section = (title, body, more) => `<section><h2>${esc(title)}</h2>${body}${more ? `<p>${link(more[0], more[1])}</p>` : ''}</section>`;

// ---------------------------------------------------------------- cards for each kind
const ebookCard = (b) => ({
  href: `/collections/ebooks/ebook/${enc(b.id)}`, title: b.title, image: httpsOnly(b.cover_image),
  meta: [b.author_name, b.genre, b.language_label, b.pages ? `${b.pages} pages` : '', b.access_label].filter(Boolean).join(' · '),
  text: b.description,
});
const audiobookCard = (a) => ({
  href: `/collections/audiobooks/audiobook/${enc(a.id)}`, title: a.title, image: httpsOnly(a.cover),
  meta: [a.author_name || a.author, a.narrator ? `read by ${a.narrator}` : '', a.duration, a.language_label].filter((v) => v && typeof v !== 'number').join(' · '),
  text: a.description,
});
const authorCard = (a) => ({
  href: `/collections/authors/author/${enc(a.id)}`, title: a.name, image: httpsOnly(a.image),
  meta: [a.born && a.died ? `${a.born}–${a.died}` : a.born, a.genre].filter(Boolean).join(' · '), text: a.biography,
});
const historyCard = (h) => ({
  href: `/sikh-history/${enc(h.slug)}`, title: h.title, image: httpsOnly(h.image),
  meta: [h.category_label, h.date_label].filter(Boolean).join(' · '), text: h.summary || h.subtitle,
});
const sakhiCard = (s) => ({
  href: `/sakhis/${enc(s.slug)}`, title: s.title, image: httpsOnly(s.image),
  meta: [s.category_label, s.about].filter(Boolean).join(' · '), text: s.summary,
});
const lessonCard = (i, kind) => ({
  href: kind === 'quiz' ? `/learning/quizzes/${enc(i.id)}` : `/learning-material/${enc(i.id)}`,
  title: i.title, image: httpsOnly(i.image), meta: [i.category, i.access_label].filter(Boolean).join(' · '),
  text: i.description,
});

/** Virsaa as an organisation, for Google's site name, logo and "about" panel. */
function organization(env) {
  const sameAs = String(env.SOCIAL_LINKS || '').split(',').map((s) => s.trim()).filter((s) => /^https:\/\//.test(s));
  return {
    '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, url: `${siteBase(env)}/`,
    logo: `${siteBase(env)}/VirsaaLogo.png`, description: DEFAULT_DESCRIPTION,
    email: 'support@virsaa.org', ...(sameAs.length ? { sameAs } : {}),
  };
}

// ============================================================================ the pages
// Each returns {title, description, body, status?, image?, type?, jsonld?, noindex?}

async function homePage(env) {
  const [books, history, sakhis, learning] = await Promise.all([
    api(env, '/collections/ebooks/?page=1&page_size=12&ordering=-id').then(listOf),
    apiOr(env, '/api/sikhism/history/', {}).then(listOf),
    apiOr(env, '/api/sikhism/sakhis/', {}).then(listOf),
    apiOr(env, '/api/learning/items/categorized/', {}),
  ]);
  return {
    title: `${SITE_NAME}: Punjabi and Sikh books, history, Gurbani and learning`,
    description: DEFAULT_DESCRIPTION,
    body: `<h1>${SITE_NAME}</h1><p class="ssr-lede">${esc(TAGLINE)}.</p>
      <p>${esc(DEFAULT_DESCRIPTION)}</p>
      ${section('New in the library', cards(books.map(ebookCard)), ['/collections/ebooks', 'All ebooks'])}
      ${section('Sikh history', cards(history.slice(0, 6).map(historyCard)), ['/sikh-history', 'All Sikh history'])}
      ${section('Sakhis and kahaniyaan', cards(sakhis.slice(0, 6).map(sakhiCard)), ['/sakhis', 'All sakhis'])}
      ${section('Learn', cards([...listOf(learning.learning), ...listOf(learning.quiz).map((q) => ({ ...q, _quiz: true }))]
        .slice(0, 6).map((i) => lessonCard(i, i._quiz ? 'quiz' : 'learning'))), ['/learning', 'All lessons, quizzes and games'])}
      ${section('Explore', `<ul>${NAV.slice(1).map(([href, label]) => `<li>${link(href, label)}</li>`).join('')}</ul>`)}`,
    jsonld: [
      {
        '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, alternateName: ['Virsaa.org', 'ਵਿਰਸਾ'],
        url: `${siteBase(env)}/`,
        potentialAction: { '@type': 'SearchAction', target: `${siteBase(env)}/collections/ebooks?search={query}`, 'query-input': 'required name=query' },
      },
      organization(env),
    ],
  };
}

async function libraryPage(env) {
  const [books, audiobooks, authors] = await Promise.all([
    api(env, '/collections/ebooks/?page=1&page_size=24&ordering=-id').then(listOf),
    apiOr(env, '/collections/audiobooks/', []).then(listOf),
    apiOr(env, '/collections/authors/', []).then(listOf),
  ]);
  return {
    title: `The Virsaa library: Punjabi and Sikh ebooks and audiobooks | ${SITE_NAME}`,
    description: 'Read Punjabi and Sikh ebooks and listen to audiobooks, from Gurbani and Sikh history to literature and children’s stories.',
    body: `<h1>The Virsaa library</h1><p class="ssr-lede">Punjabi and Sikh ebooks, audiobooks and their authors.</p>
      ${section('Ebooks', cards(books.map(ebookCard)), ['/collections/ebooks', 'All ebooks'])}
      ${section('Audiobooks', cards(audiobooks.slice(0, 12).map(audiobookCard)), ['/collections/audiobooks', 'All audiobooks'])}
      ${section('Authors', cards(authors.slice(0, 12).map(authorCard)), ['/collections/authors', 'All authors'])}`,
  };
}

async function ebooksPage(env) {
  const books = await allEbooks(env);
  return {
    title: `Punjabi and Sikh ebooks | ${SITE_NAME}`,
    description: `Read ${books.length} Punjabi and Sikh ebooks on Virsaa: Gurbani, Sikh history, literature, poetry and more.`,
    body: `<h1>Ebooks</h1><p class="ssr-lede">${books.length} books to read online.</p>${cards(books.map(ebookCard), 'No ebooks yet.')}`,
    image: books[0] && httpsOnly(books[0].cover_image),
  };
}

async function audiobooksPage(env) {
  const items = listOf(await api(env, '/collections/audiobooks/')).slice(0, MAX_LIST);
  return {
    title: `Punjabi and Sikh audiobooks | ${SITE_NAME}`,
    description: `Listen to ${items.length} Punjabi and Sikh audiobooks on Virsaa.`,
    body: `<h1>Audiobooks</h1><p class="ssr-lede">${items.length} audiobooks to listen to.</p>${cards(items.map(audiobookCard), 'No audiobooks yet.')}`,
  };
}

async function authorsPage(env) {
  const items = listOf(await api(env, '/collections/authors/')).slice(0, MAX_LIST);
  return {
    title: `Punjabi and Sikh authors | ${SITE_NAME}`,
    description: `The writers behind the Virsaa library: ${items.slice(0, 6).map((a) => a.name).join(', ')} and more.`,
    body: `<h1>Authors</h1><p class="ssr-lede">The writers in the Virsaa library.</p>${cards(items.map(authorCard), 'No authors yet.')}`,
  };
}

async function ebookPage(env, id) {
  const book = await api(env, `/collections/ebooks/${enc(id)}/`);
  const author = book.author_name ? { id: book.author, name: book.author_name }
    : (book.author ? await apiOr(env, `/collections/authors/${enc(book.author)}/`, null) : null);
  const chapters = Array.isArray(book.chapters) ? book.chapters : [];
  const facts = [book.genre, book.language_label, book.pages ? `${book.pages} pages` : '', book.access_label].filter(Boolean);
  return {
    title: `${book.title}${author?.name ? ` by ${author.name}` : ''} | ${SITE_NAME}`,
    description: clip(book.description || `Read ${book.title} on Virsaa.`),
    image: httpsOnly(book.cover_image),
    type: 'book',
    body: `<p class="ssr-crumbs">${link('/collections', 'Library')} › ${link('/collections/ebooks', 'Ebooks')}</p>
      <article>${httpsOnly(book.cover_image) ? `<img class="ssr-cover" src="${esc(book.cover_image)}" alt="Cover of ${esc(book.title)}" width="240" height="320">` : ''}
      <h1>${esc(book.title)}</h1>
      ${author?.name ? `<p class="ssr-lede">by ${author.id ? link(`/collections/authors/author/${enc(author.id)}`, author.name) : esc(author.name)}</p>` : ''}
      ${facts.length ? `<p class="ssr-meta">${esc(facts.join(' · '))}</p>` : ''}
      ${book.review_count ? `<p class="ssr-meta">Rated ${esc(Number(book.review_average || 0).toFixed(1))} out of 5 by ${esc(book.review_count)} reader${book.review_count === 1 ? '' : 's'}</p>` : ''}
      ${book.description ? `<h2>About this book</h2>${paragraphs(String(book.description).split(/\n{2,}/))}` : ''}
      ${chapters.length ? `<h2>Chapters</h2><ol>${chapters.map((c) => `<li>${esc(c.title)}</li>`).join('')}</ol>` : ''}
      ${book.audio?.audiobook ? `<p>${link(`/collections/audiobooks/audiobook/${enc(book.audio.audiobook)}`, 'Listen to the audiobook')}</p>` : ''}
      <p>${link('/collections/ebooks', 'More ebooks')}</p></article>`,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Book', name: book.title, description: clip(book.description, 300),
      image: httpsOnly(book.cover_image) || undefined, numberOfPages: book.pages || undefined, genre: book.genre || undefined,
      inLanguage: book.language || undefined,
      author: author?.name ? { '@type': 'Person', name: author.name } : undefined,
      aggregateRating: book.review_count ? { '@type': 'AggregateRating', ratingValue: book.review_average, reviewCount: book.review_count } : undefined,
    },
  };
}

async function authorPage(env, id) {
  const author = await api(env, `/collections/authors/${enc(id)}/`);
  const books = author.name ? await apiOr(env, `/collections/ebooks/?page=1&page_size=60&author__name=${enc(author.name)}`, {}).then(listOf) : [];
  const works = Array.isArray(author.notable_works) ? author.notable_works : String(author.notable_works || '').split(/\n|;/).filter((w) => w.trim());
  const awards = Array.isArray(author.awards) ? author.awards : String(author.awards || '').split(/\n|;/).filter((w) => w.trim());
  return {
    title: `${author.name}: books and biography | ${SITE_NAME}`,
    description: clip(author.biography || `Books by ${author.name} on Virsaa.`),
    image: httpsOnly(author.image),
    type: 'profile',
    body: `<p class="ssr-crumbs">${link('/collections', 'Library')} › ${link('/collections/authors', 'Authors')}</p>
      <article>${httpsOnly(author.image) ? `<img class="ssr-cover" src="${esc(author.image)}" alt="${esc(author.name)}" width="240" height="300">` : ''}
      <h1>${esc(author.name)}</h1>
      ${author.born || author.died ? `<p class="ssr-meta">${esc([author.born && `Born ${author.born}`, author.died && `Died ${author.died}`].filter(Boolean).join(' · '))}</p>` : ''}
      ${author.biography ? `<h2>Biography</h2>${paragraphs(String(author.biography).split(/\n{2,}/))}` : ''}
      ${works.length ? `<h2>Notable works</h2><ul>${works.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
      ${awards.length ? `<h2>Awards</h2><ul>${awards.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
      ${books.length ? section(`Books by ${author.name} on Virsaa`, cards(books.map(ebookCard))) : ''}</article>`,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Person', name: author.name, description: clip(author.biography, 300),
      image: httpsOnly(author.image) || undefined, birthDate: author.born || undefined, deathDate: author.died || undefined,
    },
  };
}

async function audiobookPage(env, id) {
  const book = await api(env, `/collections/audiobooks/${enc(id)}/`);
  const chapters = Array.isArray(book.chapters) ? book.chapters : [];
  const author = typeof book.author === 'number'
    ? await apiOr(env, `/collections/authors/${enc(book.author)}/`, null) : null;
  const by = author?.name || (typeof book.author === 'string' ? book.author : book.author_name);
  return {
    title: `${book.title}${by ? ` by ${by}` : ''} (audiobook) | ${SITE_NAME}`,
    description: clip(book.description || `Listen to ${book.title} on Virsaa.`),
    image: httpsOnly(book.cover),
    type: 'book',
    body: `<p class="ssr-crumbs">${link('/collections', 'Library')} › ${link('/collections/audiobooks', 'Audiobooks')}</p>
      <article>${httpsOnly(book.cover) ? `<img class="ssr-cover" src="${esc(book.cover)}" alt="Cover of ${esc(book.title)}" width="240" height="240">` : ''}
      <h1>${esc(book.title)}</h1>${book.title_pa ? `<p class="ssr-lede" lang="pa">${esc(book.title_pa)}</p>` : ''}
      ${author?.id ? `<p class="ssr-lede">by ${link(`/collections/authors/author/${enc(author.id)}`, author.name)}</p>` : ''}
      <p class="ssr-meta">${esc([!author?.id && by && `by ${by}`, book.narrator && `read by ${book.narrator}`, book.duration, book.language_label, book.genre].filter(Boolean).join(' · '))}</p>
      ${book.description ? `<h2>About this audiobook</h2>${paragraphs(String(book.description).split(/\n{2,}/))}` : ''}
      ${chapters.length ? `<h2>Chapters</h2><ol>${chapters.map((c) => `<li>${esc(c.title)}${c.duration ? ` <span class="ssr-meta">(${esc(c.duration)})</span>` : ''}</li>`).join('')}</ol>` : ''}
      ${book.ebook ? `<p>${link(`/collections/ebooks/ebook/${enc(book.ebook)}`, 'Read the book')}</p>` : ''}
      <p>${link('/collections/audiobooks', 'More audiobooks')}</p></article>`,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Audiobook', name: book.title, description: clip(book.description, 300),
      image: httpsOnly(book.cover) || undefined, author: by ? { '@type': 'Person', name: by } : undefined,
      readBy: book.narrator ? { '@type': 'Person', name: book.narrator } : undefined,
    },
  };
}

async function historyPage(env) {
  const data = await api(env, '/api/sikhism/history/');
  const items = listOf(data);
  const groups = (data.categories || []).map((c) => [c.label, items.filter((i) => i.category === c.id)]).filter(([, list]) => list.length);
  return {
    title: `Sikh history: the Gurus, events, places and people | ${SITE_NAME}`,
    description: 'Articles on Sikh history: the ten Gurus, key events, historic Gurdwaras and the people who shaped the Panth.',
    body: `<h1>Sikh history</h1><p class="ssr-lede">The Gurus, the events, the places and the people of Sikh history.</p>
      ${groups.length ? groups.map(([label, list]) => section(label, cards(list.map(historyCard)))).join('') : cards(items.map(historyCard))}`,
  };
}

async function historyArticle(env, slug) {
  const entry = await api(env, `/api/sikhism/history/${enc(slug)}/`);
  const sections = Array.isArray(entry.sections) ? entry.sections : [];
  const facts = Array.isArray(entry.facts) ? entry.facts : [];
  const related = Array.isArray(entry.related) ? entry.related : [];
  return {
    title: `${entry.title} | Sikh history | ${SITE_NAME}`,
    description: clip(entry.summary || entry.subtitle || entry.title),
    image: httpsOnly(entry.image),
    type: 'article',
    body: `<p class="ssr-crumbs">${link('/sikh-history', 'Sikh history')}${entry.category_label ? ` › ${esc(entry.category_label)}` : ''}</p>
      <article><h1>${esc(entry.title)}</h1>${entry.title_pa ? `<p class="ssr-lede" lang="pa">${esc(entry.title_pa)}</p>` : ''}
      ${entry.subtitle ? `<p class="ssr-lede">${esc(entry.subtitle)}</p>` : ''}
      ${entry.date_label ? `<p class="ssr-meta">${esc(entry.date_label)}</p>` : ''}
      ${httpsOnly(entry.image) ? `<img class="ssr-wide" src="${esc(entry.image)}" alt="" width="800" height="450">` : ''}
      ${entry.summary ? `<p><strong>${esc(entry.summary)}</strong></p>` : ''}
      ${facts.length ? `<h2>Key facts</h2><dl>${facts.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join('')}</dl>` : ''}
      ${sections.map((s) => `${s.heading ? `<h2>${esc(s.heading)}</h2>` : ''}${paragraphs(s.paragraphs)}`).join('')}
      ${entry.locked ? `<p>The rest of this article is part of Virsaa membership. ${link('/premium', 'See the plans')}.</p>` : ''}
      ${related.length ? section('Related', `<ul>${related.map((r) => `<li>${link(`/sikh-history/${enc(r.slug)}`, r.title)}${r.date_label ? ` <span class="ssr-meta">(${esc(r.date_label)})</span>` : ''}</li>`).join('')}</ul>`) : ''}
      <p>${link('/sikh-history', 'More Sikh history')}</p></article>`,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Article', headline: clip(entry.title, 110),
      description: clip(entry.summary, 300), image: httpsOnly(entry.image) || undefined,
      dateModified: entry.updated_at || undefined, publisher: { '@type': 'Organization', name: SITE_NAME },
    },
  };
}

async function sakhisPage(env) {
  const data = await api(env, '/api/sikhism/sakhis/');
  const items = listOf(data);
  const groups = (data.kinds || []).map((k) => [k.label, items.filter((i) => i.kind === k.id)]).filter(([, list]) => list.length);
  return {
    title: `Sakhis and kahaniyaan: Sikh and Punjabi stories | ${SITE_NAME}`,
    description: 'Sakhis of the Gurus, Gursikhs and Bhagats, and Punjabi kahaniyaan for children, to read and listen to.',
    body: `<h1>Sakhis and kahaniyaan</h1><p class="ssr-lede">Stories of the Gurus, Gursikhs and Bhagats, and Punjabi tales for children.</p>
      ${groups.length ? groups.map(([label, list]) => section(label, cards(list.map(sakhiCard)))).join('') : cards(items.map(sakhiCard))}`,
  };
}

async function sakhiStory(env, slug) {
  const story = await api(env, `/api/sikhism/sakhis/${enc(slug)}/`);
  return {
    title: `${story.title} | Sakhis | ${SITE_NAME}`,
    description: clip(story.summary || (story.story || [])[0] || story.title),
    image: httpsOnly(story.image),
    type: 'article',
    body: `<p class="ssr-crumbs">${link('/sakhis', 'Sakhis and kahaniyaan')}${story.category_label ? ` › ${esc(story.category_label)}` : ''}</p>
      <article><h1>${esc(story.title)}</h1>${story.title_pa ? `<p class="ssr-lede" lang="pa">${esc(story.title_pa)}</p>` : ''}
      ${story.about ? `<p class="ssr-meta">${esc(story.about)}</p>` : ''}
      ${httpsOnly(story.image) ? `<img class="ssr-wide" src="${esc(story.image)}" alt="" width="800" height="450">` : ''}
      ${paragraphs(story.story)}
      ${story.lesson ? `<h2>The lesson</h2><p>${esc(story.lesson)}</p>` : ''}
      ${story.source ? `<p class="ssr-meta">Source: ${httpsOnly(story.source_url) ? link(story.source_url, story.source, ' rel="nofollow noopener"') : esc(story.source)}</p>` : ''}
      <p>${link('/sakhis', 'More sakhis')}</p></article>`,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Article', headline: clip(story.title, 110),
      description: clip(story.summary, 300), image: httpsOnly(story.image) || undefined,
      dateModified: story.updated_at || undefined, publisher: { '@type': 'Organization', name: SITE_NAME },
    },
  };
}

async function gurbaniPage(env) {
  const items = listOf(await api(env, '/api/sikhism/gurbani/items/')).slice(0, MAX_LIST);
  const groups = {};
  for (const item of items) (groups[item.category_label || 'Gurbani'] ||= []).push(item);
  return {
    title: `Gurbani: read and listen to banis and kirtan | ${SITE_NAME}`,
    description: 'Read Gurbani in Gurmukhi with translations, listen to kirtan and katha, and see today’s Hukamnama from Sri Harmandir Sahib.',
    body: `<h1>Gurbani</h1><p class="ssr-lede">Read the banis in Gurmukhi, listen to kirtan and katha, and read today’s Hukamnama.</p>
      ${Object.entries(groups).map(([label, list]) => section(label, `<ul class="ssr-plain">${list.map((i) => `<li><strong>${esc(i.title)}</strong>${i.title_gurmukhi ? ` <span lang="pa">${esc(i.title_gurmukhi)}</span>` : ''}${i.description ? ` <span class="ssr-meta">${esc(clip(i.description, 160))}</span>` : ''}</li>`).join('')}</ul>`)).join('')}`,
  };
}

async function learningPage(env) {
  const data = await api(env, '/api/learning/items/categorized/');
  return {
    title: `Learn Punjabi and Sikhi: lessons, quizzes and games | ${SITE_NAME}`,
    description: 'Lessons on Gurmukhi, Punjabi and Sikh history, quizzes with explanations, and learning games for all ages.',
    body: `<h1>Learning</h1><p class="ssr-lede">Lessons, quizzes and games on Gurmukhi, Punjabi and Sikhi.</p>
      ${section('Lessons', cards(listOf(data.learning).map((i) => lessonCard(i, 'learning')), 'No lessons yet.'))}
      ${section('Quizzes', cards(listOf(data.quiz).map((i) => lessonCard(i, 'quiz')), 'No quizzes yet.'))}
      ${section('Games', `<ul><li>${link('/learning/games', 'Khed Mela: learning games')}</li><li>${link('/learning/games/shabd-khoj', 'Shabd Khoj (word search)')}</li><li>${link('/learning/games/memory-match', 'Memory match')}</li></ul>`)}`,
  };
}

async function lessonPage(env, id, kind) {
  const item = await api(env, `/api/learning/learning-material/${enc(id)}/`);
  const questions = Array.isArray(item.questions) ? item.questions.length : 0;
  const label = kind === 'quiz' ? 'Quiz' : 'Lesson';
  return {
    title: `${item.title} (${label.toLowerCase()}) | ${SITE_NAME}`,
    description: clip(plain(item.description) || `${label} on Virsaa.`),
    image: httpsOnly(item.image),
    type: 'article',
    body: `<p class="ssr-crumbs">${link('/learning', 'Learning')}</p>
      <article><h1>${esc(item.title)}</h1>
      <p class="ssr-meta">${esc([label, item.category, questions ? `${questions} question${questions === 1 ? '' : 's'}` : '', item.access_label].filter(Boolean).join(' · '))}</p>
      ${item.description ? richText(item.description) : ''}
      <p>${link('/learning', 'More lessons and quizzes')}</p></article>`,
  };
}

function gamesPage() {
  return {
    title: `Khed Mela: Punjabi learning games | ${SITE_NAME}`,
    description: 'Learn Gurmukhi letters, Punjabi words and Sikh history through games: word search, memory match, Shabad-le and more.',
    body: `<h1>Khed Mela</h1><p class="ssr-lede">Games for learning Gurmukhi, Punjabi words and Sikh history.</p>
      <ul><li>${link('/learning/games/shabd-khoj', 'Shabd Khoj (word search)')}</li><li>${link('/learning/games/memory-match', 'Memory match')}</li></ul>
      <p>${link('/learning', 'Lessons and quizzes')}</p>`,
  };
}

async function newsPage(env) {
  const [news, updates] = await Promise.all([
    api(env, '/collections/news/').then(listOf),
    apiOr(env, '/api/site/updates/', []).then(listOf),
  ]);
  return {
    title: `News and events | ${SITE_NAME}`,
    description: 'News from the Sikh and Punjabi world, upcoming events, and what’s new in Virsaa.',
    body: `<h1>News</h1><p class="ssr-lede">News, events and what’s new in Virsaa.</p>
      ${updates.length ? section('What’s new in Virsaa', updates.map((u) => `<article id="update-${esc(u.id)}"><h3>${esc(u.title)}</h3><p class="ssr-meta">${esc([longDate(u.published_at), u.version && `Version ${u.version}`, u.platform_label].filter(Boolean).join(' · '))}</p><p>${esc(u.summary)}</p>${u.body ? richText(u.body) : ''}</article>`).join('')) : ''}
      ${section('Latest news', news.length ? news.slice(0, 40).map((n) => `<article><h3>${httpsOnly(n.source_url) ? link(n.source_url, n.title, ' rel="nofollow noopener"') : esc(n.title)}</h3><p class="ssr-meta">${esc([longDate(n.published_at), n.category].filter(Boolean).join(' · '))}</p><p>${esc(clip(n.excerpt || plain(n.body), 280))}</p></article>`).join('') : '<p>No news yet.</p>')}`,
  };
}

async function sitePage(env, slug, path) {
  const page = await api(env, `/api/site/pages/${enc(slug)}/`);
  const sections = Array.isArray(page.sections) ? page.sections : [];
  return {
    title: `${page.title} | ${SITE_NAME}`,
    description: clip(plain(page.summary || page.intro || sections[0]?.body || page.title)),
    type: slug === 'about' ? 'website' : 'article',
    body: `<article><h1>${esc(page.title)}</h1>
      ${page.updated_at || page.effective_date ? `<p class="ssr-meta">${page.effective_date ? `Effective ${esc(page.effective_date)}` : `Updated ${esc(longDate(page.updated_at))}`}</p>` : ''}
      ${page.summary ? `<p class="ssr-lede">${esc(plain(page.summary))}</p>` : ''}
      ${sections.length > 2 ? `<nav aria-label="On this page"><ul>${sections.map((s) => `<li><a href="${esc(path)}#${esc(s.key)}">${esc(s.title)}</a></li>`).join('')}</ul></nav>` : ''}
      ${sections.map((s) => `<section id="${esc(s.key)}">${s.title ? `<h2>${esc(s.title)}</h2>` : ''}${richText(s.body)}</section>`).join('')}
      ${slug === 'about' ? `<p>${link('/picture-credits', 'Picture credits')}</p>` : ''}</article>`,
  };
}

async function helpPage(env) {
  const data = await api(env, '/api/site/help/');
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const faqs = categories.flatMap((c) => c.articles || []);
  return {
    title: `Help Center and FAQs | ${SITE_NAME}`,
    description: 'Answers to common questions about your Virsaa account, membership, refunds, reading and learning, and how to contact us.',
    body: `<h1>Help Center</h1><p class="ssr-lede">Answers to common questions. Can’t find yours? Write to ${data.contact_email ? link(`mailto:${data.contact_email}`, data.contact_email) : 'us'}.</p>
      ${categories.filter((c) => (c.articles || []).length).map((c) => section(c.label, c.articles.map((a) => `<h3>${esc(a.question)}</h3>${richText(a.answer)}`).join(''))).join('')}`,
    jsonld: faqs.length ? {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faqs.slice(0, 50).map((a) => ({ '@type': 'Question', name: a.question, acceptedAnswer: { '@type': 'Answer', text: plain(a.answer) } })),
    } : undefined,
  };
}

async function membershipPage(env) {
  const data = await apiOr(env, '/api/payments/products/?kind=membership', {});
  const plans = (Array.isArray(data.products) ? data.products : listOf(data)).filter((p) => p.billing === 'monthly');
  const money = (p) => `$${Number(p.price).toFixed(2)} ${p.currency || 'CAD'}`;
  return {
    title: `Membership plans | ${SITE_NAME}`,
    description: 'Free, Basic, Standard and Premium plans: more books and audiobooks, no ads, more downloads. Yearly plans save 20%.',
    body: `<h1>Membership</h1><p class="ssr-lede">Many books, lessons and games are free. A membership opens the rest of the library.</p>
      ${plans.length ? `<ul class="ssr-plain">${plans.map((p) => `<li><strong>${esc(p.plan_name || p.name)}</strong>: ${esc(money(p))} a month. ${esc(p.description || '')}</li>`).join('')}</ul>` : ''}
      <p>Yearly plans save 20%. The first week is free for new members. ${link('/subscription-policy', 'Subscription policy')} · ${link('/refund-policy', 'Refund policy')}</p>
      <p>${link('/signup', 'Create a free account')}</p>`,
  };
}

const simplePage = (title, description, html, extra = {}) => ({
  title: `${title} | ${SITE_NAME}`, description, body: `<h1>${esc(title)}</h1>${html}`, ...extra,
});

const notFoundPage = () => ({
  status: 404,
  noindex: true,
  title: `Page not found | ${SITE_NAME}`,
  description: 'This page doesn’t exist on Virsaa.',
  body: `<h1>Page not found</h1><p>This page doesn’t exist, or it has moved. Try one of these:</p>
    <ul>${NAV.map(([href, label]) => `<li>${link(href, label)}</li>`).join('')}</ul>`,
});

/** The page for an address, or null for "not one of ours". */
async function pageFor(env, path) {
  let m;
  if (path === '/') return homePage(env);
  if (path === '/collections') return libraryPage(env);
  if (path === '/collections/ebooks') return ebooksPage(env);
  if (path === '/collections/audiobooks') return audiobooksPage(env);
  if (path === '/collections/authors') return authorsPage(env);
  if ((m = path.match(/^\/collections\/ebooks\/ebook\/([^/]+)$/))) return ebookPage(env, decodeURIComponent(m[1]));
  if ((m = path.match(/^\/collections\/authors\/author\/([^/]+)$/))) return authorPage(env, decodeURIComponent(m[1]));
  if ((m = path.match(/^\/collections\/audiobooks\/audiobook\/([^/]+)$/))) return audiobookPage(env, decodeURIComponent(m[1]));
  if (path === '/sikh-history') return historyPage(env);
  if ((m = path.match(/^\/sikh-history\/([^/]+)$/))) return historyArticle(env, decodeURIComponent(m[1]));
  if (path === '/sakhis') return sakhisPage(env);
  if ((m = path.match(/^\/sakhis\/([^/]+)$/))) return sakhiStory(env, decodeURIComponent(m[1]));
  if (path === '/gurbani') return gurbaniPage(env);
  if (path === '/learning') return learningPage(env);
  if ((m = path.match(/^\/learning\/quizzes\/([^/]+)$/))) return lessonPage(env, decodeURIComponent(m[1]), 'quiz');
  if ((m = path.match(/^\/learning-material\/([^/]+)$/))) return lessonPage(env, decodeURIComponent(m[1]), 'learning');
  if (path === '/learning/games') return gamesPage();
  if (path === '/learning/games/shabd-khoj') return simplePage('Shabd Khoj', 'Find Punjabi words hidden in the grid.', `<p>A word search for Punjabi words in Gurmukhi. ${link('/learning/games', 'More games')}</p>`);
  if (path === '/learning/games/memory-match') return simplePage('Memory match', 'Match the pairs of cards to learn Gurmukhi and Punjabi words.', `<p>Turn over the cards and find the pairs. ${link('/learning/games', 'More games')}</p>`);
  if (path.startsWith('/learning/games/')) return simplePage('Khed Mela game', 'A Virsaa learning game.', `<p>${link('/learning/games', 'All games')}</p>`);
  if (path === '/news') return newsPage(env);
  if (POLICIES[path]) return sitePage(env, POLICIES[path], path);
  if (path === '/help') return helpPage(env);
  if (path === '/faqs') return { redirect: '/help' };
  if (path === '/premium') return membershipPage(env);
  if (path === '/gurdwara-access') {
    return simplePage('Gurdwaras', 'Find Gurdwaras near you or anywhere in the world, with directions, services and history.',
      '<p class="ssr-lede">Find Gurdwaras near you or anywhere in the world: directions, services and their history.</p>'
      + `<p>${link('/sikh-history', 'Historic Gurdwaras in Sikh history')}</p>`);
  }
  if (/^\/gurdwara-access\/(locate|services|history)\/[^/]+$/.test(path)) {
    return simplePage('Gurdwara', 'A Gurdwara on Virsaa: where it is, its services and its history.',
      `<p>${link('/gurdwara-access', 'Find Gurdwaras')}</p>`, { noindex: true });
  }
  if (path === '/picture-credits') return simplePage('Picture credits', 'Where the pictures on Virsaa come from.', '<p>The photographers and sources of the pictures used on Virsaa.</p>');
  if (path === '/login') return simplePage('Sign in', 'Sign in to Virsaa.', `<p>Sign in to read, listen, save books and keep your progress. New here? ${link('/signup', 'Create a free account')}.</p>`);
  if (path === '/signup') return simplePage('Create a free account', 'Create a free Virsaa account.', `<p>A free account lets you read free books, save favourites and keep your learning progress. Already a member? ${link('/login', 'Sign in')}.</p>`);
  if (NOINDEX_PAGES.includes(path) || /^\/(forgot-password|verify-email)\//.test(path)) {
    return simplePage(path.startsWith('/newsletter') ? 'Newsletter' : 'Your account', DEFAULT_DESCRIPTION, `<p>${link('/', 'Go to Virsaa')}</p>`, { noindex: true });
  }
  if (ACCOUNT_PAGES.includes(path) || /^\/payment\/[^/]+$/.test(path)) {
    return simplePage('Your account', 'Your Virsaa account.', `<p>${link(`/login?next=${enc(path)}`, 'Sign in')} to see this page.</p>`, { noindex: true });
  }
  return null;
}

// ============================================================================ putting it into index.html
async function renderPage(request, env, url) {
  let page;
  try {
    page = await pageFor(env, url.pathname);
    if (page?.redirect) return Response.redirect(`${url.origin}${page.redirect}`, 301);
    if (!page) page = notFoundPage();
  } catch (error) {
    if (error instanceof NotFound) {
      page = notFoundPage();
    } else {
      console.warn('render failed', url.pathname, error.message);
      page = {
        status: 503, noindex: true, title: SITE_NAME, description: DEFAULT_DESCRIPTION,
        body: `<h1>${SITE_NAME}</h1><p>This page is loading. If it doesn’t appear, please try again in a minute.</p>`,
      };
    }
  }

  const shell = await env.ASSETS.fetch(new Request(new URL('/', url), { method: 'GET' }));
  if (!shell.ok) return shell;

  const canonical = `${siteBase(env)}${url.pathname}`;
  const image = page.image || `${siteBase(env)}/VirsaaLogo.png`;
  const head = [
    `<meta name="description" content="${esc(page.description)}">`,
    `<link rel="canonical" href="${esc(canonical)}">`,
    page.noindex ? '<meta name="robots" content="noindex, follow">' : '',
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:type" content="${esc(page.type || 'website')}">`,
    `<meta property="og:title" content="${esc(page.title)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    /^ca-pub-\d+$/.test(String(env.ADSENSE_CLIENT || '')) ? `<meta name="google-adsense-account" content="${esc(env.ADSENSE_CLIENT)}">` : '',
    page.jsonld ? `<script type="application/ld+json">${JSON.stringify(page.jsonld).replace(/</g, '\\u003c')}</script>` : '',
    `<style>${STYLES}</style>`,
  ].filter(Boolean).join('');

  const body = `<div class="ssr-page"><header class="ssr-header"><a class="ssr-brand" href="/">${SITE_NAME}</a>
    <nav aria-label="Main"><ul>${NAV.map(([href, label]) => `<li>${link(href, label)}</li>`).join('')}</ul></nav></header>
    <main>${page.body}</main>
    <footer class="ssr-footer"><p>${esc(TAGLINE)}.</p><nav aria-label="Site"><ul>${FOOTER_LINKS.map(([href, label]) => `<li>${link(href, label)}</li>`).join('')}</ul></nav>
    <p>© ${new Date().getUTCFullYear()} ${SITE_NAME}</p></footer></div>`;

  const rewritten = new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(page.title); } })
    .on('meta[name="description"]', { element(el) { el.remove(); } })
    .on('head', { element(el) { el.append(head, { html: true }); } })
    .on('noscript', { element(el) { el.remove(); } })
    .on('div#root', { element(el) { el.setInnerContent(body, { html: true }); } })
    .transform(shell);

  const headers = new Headers(rewritten.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  headers.delete('ETag');
  headers.delete('Content-Length');
  if (page.status === 503) headers.set('Retry-After', '120');
  if (page.noindex) headers.set('X-Robots-Tag', 'noindex, follow');
  return new Response(request.method === 'HEAD' ? null : rewritten.body, { status: page.status || 200, headers });
}

// The server-rendered page's look (replaced by the React app's own once it starts)
const STYLES = `.ssr-page{max-width:980px;margin:0 auto;padding:16px;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;color:#2b0f16}
.ssr-page a{color:#65041d}.ssr-page h1,.ssr-page h2,.ssr-page h3{font-family:Georgia,"Times New Roman",serif;color:#65041d;line-height:1.25}
.ssr-header{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;border-bottom:1px solid #ecdcc0;padding-bottom:10px}
.ssr-brand{font:700 1.5rem Georgia,serif;text-decoration:none}.ssr-page nav ul{display:flex;flex-wrap:wrap;gap:4px 14px;list-style:none;margin:0;padding:0}
.ssr-lede{font-size:1.15rem}.ssr-meta{color:#8a6b72;font-size:.9rem}.ssr-crumbs{font-size:.9rem}
.ssr-cards{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.ssr-cards li{display:flex;gap:12px}.ssr-cards img{width:72px;height:96px;object-fit:cover;border-radius:6px;flex:none}
.ssr-cards h3{margin:0;font-size:1.05rem}.ssr-cards p{margin:4px 0}.ssr-cover{float:right;max-width:200px;height:auto;margin:0 0 12px 16px;border-radius:8px}
.ssr-wide{width:100%;height:auto;border-radius:8px}.ssr-footer{border-top:1px solid #ecdcc0;margin-top:32px;padding-top:12px;font-size:.9rem}
[data-theme=dark] .ssr-page{color:#f3e6e9}[data-theme=dark] .ssr-page a,[data-theme=dark] .ssr-page h1,[data-theme=dark] .ssr-page h2,[data-theme=dark] .ssr-page h3{color:#f2b3c2}
@media (prefers-color-scheme:dark){.ssr-page{color:#f3e6e9}.ssr-page a,.ssr-page h1,.ssr-page h2,.ssr-page h3{color:#f2b3c2}}`;

// ============================================================================ robots.txt and sitemap.xml
/** AdSense's authorized-seller line: "google.com, pub-…, DIRECT, f08c47fec0942fa0". */
function adsTxt(env) {
  const client = String(env.ADSENSE_CLIENT || '');
  if (!/^ca-pub-\d+$/.test(client)) return new Response('', { status: 404 });
  return new Response(`google.com, ${client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}

function robots(env) {
  const lines = ['User-agent: *', 'Allow: /', ...ACCOUNT_PAGES.map((p) => `Disallow: ${p}`), 'Disallow: /payment/',
    'Disallow: /newsletter/', 'Disallow: /forgot-password', 'Disallow: /verify-email', '', `Sitemap: ${siteBase(env)}/sitemap.xml`, ''];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}

async function sitemap(env) {
  const site = siteBase(env);
  const [books, audiobooks, authors, history, sakhis, learning] = await Promise.all([
    allEbooks(env).catch(() => []),
    apiOr(env, '/collections/audiobooks/', []).then(listOf),
    apiOr(env, '/collections/authors/', []).then(listOf),
    apiOr(env, '/api/sikhism/history/', {}).then(listOf),
    apiOr(env, '/api/sikhism/sakhis/', {}).then(listOf),
    apiOr(env, '/api/learning/items/categorized/', {}),
  ]);
  const urls = [
    ...STATIC_PAGES.map((p) => [p]),
    ...books.map((b) => [`/collections/ebooks/ebook/${enc(b.id)}`]),
    ...audiobooks.map((a) => [`/collections/audiobooks/audiobook/${enc(a.id)}`]),
    ...authors.map((a) => [`/collections/authors/author/${enc(a.id)}`]),
    ...history.map((h) => [`/sikh-history/${enc(h.slug)}`, h.updated_at]),
    ...sakhis.map((s) => [`/sakhis/${enc(s.slug)}`, s.updated_at]),
    ...listOf(learning.learning).map((i) => [`/learning-material/${enc(i.id)}`]),
    ...listOf(learning.quiz).map((i) => [`/learning/quizzes/${enc(i.id)}`]),
  ];
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(([path, modified]) => `<url><loc>${esc(site + path)}</loc>${year(modified) ? `<lastmod>${year(modified)}</lastmod>` : ''}</url>`),
    '</urlset>'].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
