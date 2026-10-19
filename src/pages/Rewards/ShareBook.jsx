/**
 * pages/Rewards/ShareBook.jsx
 * -----------------------------------------------------------------------------
 * Share a book (/share-a-book): anyone signed in can send Virsaa an ebook
 * (a PDF) or an audiobook (an MP3 or M4A file). Four steps:
 *   1. what it is (ebook or audiobook)
 *   2. the details: title, Gurmukhi title, author, reader, language, genre,
 *      tags and a description (saved as a draft on the server)
 *   3. the files: cover picture and the book itself, each with a progress
 *      bar; chapters with start times for audiobooks
 *   4. who may share it, and "send for review"
 * Admins review it in Django admin. When it passes it goes into the library
 * and the person gets reward coins (see My Rewards).
 *
 * ?type=audiobook starts on an audiobook; ?edit=<id> reopens a draft or an
 * upload that needs changes (links from My Rewards).
 * Data: /api/rewards/uploads/ (api/rewardsApi.js).
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaBook, FaHeadphones, FaCheck, FaCloudUploadAlt, FaImage, FaFilePdf, FaFileAudio, FaTimes, FaPlus,
  FaTrash, FaArrowLeft, FaLock, FaPaperPlane, FaRedo,
} from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import RewardCoin from '../../components/RewardCoin/RewardCoin';
import { useAuth } from '../../context/AuthContext';
import rewardsApi, { formatBytes, formatClock, formatCoins, parseClock } from '../../api/rewardsApi';
import { describeApiError } from '../../utils/apiError';
import { toast } from '../../utils/notify';
import styles from './ShareBook.module.css';

// Converts image paths for the production build (same helper used across pages)
const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production' && typeof imagePath === 'string') {
    return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath)) ? imagePath : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
  }
  return imagePath;
};

const STEPS = ['What it is', 'Details', 'Files', 'Send'];

// Used until the server's rules arrive (and if they can't be loaded)
const FALLBACK_RULES = {
  genres: [
    { key: 'sikhi', label: 'Sikhi' }, { key: 'history', label: 'History' }, { key: 'biography', label: 'Biography' },
    { key: 'novel', label: 'Novel' }, { key: 'stories', label: 'Short stories' }, { key: 'poetry', label: 'Poetry' },
    { key: 'children', label: 'Children' }, { key: 'non_fiction', label: 'Non-fiction' }, { key: 'other', label: 'Other' },
  ],
  languages: [{ key: 'pa', label: 'Punjabi' }, { key: 'en', label: 'English' }, { key: 'hi', label: 'Hindi' }, { key: 'ur', label: 'Urdu' }],
  rights: [
    { key: 'own', label: 'I wrote or recorded it myself' },
    { key: 'public_domain', label: 'It is out of copyright (public domain)' },
    { key: 'permission', label: 'The author or publisher gave me permission' },
  ],
  limits_mb: { pdf: 100, audio: 250, cover: 10 },
  max_tags: 6,
  rates: { ebook: 250, audiobook: 400 },
};

const TAG_IDEAS = ['Sikh history', 'Gurmukhi', 'Sakhi', 'For children', 'Punjab', 'Poetry', 'Gurbani', 'Partition'];

const EMPTY_FORM = {
  title: '', title_pa: '', author_name: '', narrator: '', language: 'pa', genre: 'other', tags: [], description: '',
};

const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];

// Keys for the chapter rows (they can be added and removed in any order)
let chapterKey = 0;
const nextKey = () => { chapterKey += 1; return `c${chapterKey}`; };

/** Field errors from the server as { field: 'message' } (first message per field). */
const fieldErrors = (error) => {
  const data = error?.response?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  return Object.fromEntries(Object.entries(data)
    .filter(([key]) => key !== 'error' && key !== 'detail')
    .map(([key, value]) => [key, Array.isArray(value) ? String(value[0]) : String(value)]));
};

const ShareBook = ({ isDarkMode, apiString }) => {
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');
  const { isLoggedIn, accessToken } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit');

  const [rules, setRules] = useState(FALLBACK_RULES);
  const [upload, setUpload] = useState(null);           // the server's copy once it exists
  const [kind, setKind] = useState(params.get('type') === 'audiobook' ? 'audiobook' : params.get('type') === 'ebook' ? 'ebook' : null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagDraft, setTagDraft] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(editId));
  const [loadError, setLoadError] = useState('');
  const [progress, setProgress] = useState({});         // { cover: 0.4, main: 1 }
  const [fileErrors, setFileErrors] = useState({});
  const [coverPreview, setCoverPreview] = useState('');
  const [chapters, setChapters] = useState([]);         // [{ key, title, start: '12:30' }]
  const [chapterError, setChapterError] = useState('');
  const [rights, setRights] = useState({ rights: '', rights_note: '', confirm: false });
  const [sent, setSent] = useState(false);
  const stepHeading = useRef(null);
  const aborts = useRef({});

  const mainRole = kind === 'audiobook' ? 'audio' : 'pdf';
  const coins = rules.rates?.[kind || 'ebook'] ?? FALLBACK_RULES.rates[kind || 'ebook'];

  // ---------------------------------------------------------------- loading
  useEffect(() => {
    rewardsApi.rules(apiString).then((data) => setRules({ ...FALLBACK_RULES, ...data })).catch(() => {});
  }, [apiString]);

  const applyUpload = useCallback((data) => {
    setUpload(data);
    setKind(data.kind);
    setForm({
      title: data.title || '', title_pa: data.title_pa || '', author_name: data.author_name || '',
      narrator: data.narrator || '', language: data.language || 'pa', genre: data.genre || 'other',
      tags: Array.isArray(data.tags) ? data.tags : [], description: data.description || '',
    });
    setChapters((data.chapters || []).map((c) => ({ key: nextKey(), title: c.title, start: formatClock(c.start_seconds) })));
    if (data.rights) setRights((r) => ({ ...r, rights: data.rights, rights_note: data.rights_note || '' }));
  }, []);

  useEffect(() => {
    if (!editId || !isLoggedIn || !accessToken) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    rewardsApi.upload(apiString, accessToken, editId)
      .then((data) => {
        if (cancelled) return;
        applyUpload(data);
        setStep(data.can_edit ? 1 : 0);
        if (!data.can_edit) setLoadError(data.status === 'passed' ? 'This book is already in the library.' : 'This upload is with our reviewers, so it can’t be changed now.');
      })
      .catch((err) => { if (!cancelled) setLoadError(describeApiError(err, 'This upload couldn’t be found.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [editId, isLoggedIn, accessToken, apiString, applyUpload]);

  // A new step: move focus to its heading so screen readers and keyboards follow
  useEffect(() => {
    if (step > 0 || sent) stepHeading.current?.focus();
  }, [step, sent]);

  // Free the cover preview's memory; stop uploads when leaving the page
  useEffect(() => () => { if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview); }, [coverPreview]);
  useEffect(() => () => Object.values(aborts.current).forEach((c) => c.abort()), []);

  // ---------------------------------------------------------------- step 2: details
  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const addTag = (raw) => {
    const tag = raw.replace(/,/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 24);
    if (!tag) return;
    setForm((f) => {
      if (f.tags.length >= (rules.max_tags || 6) || f.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return f;
      return { ...f, tags: [...f.tags, tag] };
    });
    setTagDraft('');
  };

  const removeTag = (tag) => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));

  const onTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagDraft);
    } else if (e.key === 'Backspace' && !tagDraft && form.tags.length) {
      removeTag(form.tags[form.tags.length - 1]);
    }
  };

  const checkDetails = () => {
    const found = {};
    if (form.title.trim().length < 2) found.title = 'Write the book’s title.';
    if (form.author_name.trim().length < 2) found.author_name = 'Who wrote it? If you don’t know, write “Unknown”.';
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const saveDetails = async () => {
    if (tagDraft.trim()) addTag(tagDraft);
    if (!checkDetails()) return;
    setSaving(true);
    const body = {
      title: form.title, title_pa: form.title_pa, author_name: form.author_name, language: form.language,
      genre: form.genre, tags: tagDraft.trim() ? [...form.tags, tagDraft.trim()] : form.tags, description: form.description,
      ...(kind === 'audiobook' ? { narrator: form.narrator } : {}),
    };
    try {
      const data = upload
        ? await rewardsApi.updateUpload(apiString, accessToken, upload.id, body)
        : await rewardsApi.startUpload(apiString, accessToken, { ...body, kind });
      applyUpload(data);
      setStep(2);
    } catch (err) {
      const found = fieldErrors(err);
      setErrors(found);
      if (!Object.keys(found).length) toast.error(describeApiError(err, 'The details couldn’t be saved. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------- step 3: files
  const sendFile = async (role, file) => {
    if (!file || !upload) return;
    const slot = role === 'cover' ? 'cover' : 'main';
    const limit = rules.limits_mb?.[role] || FALLBACK_RULES.limits_mb[role];
    setFileErrors((e) => ({ ...e, [slot]: '' }));
    if (file.size > limit * 1024 * 1024) {
      setFileErrors((e) => ({ ...e, [slot]: `This file is ${formatBytes(file.size)}. The most is ${limit} MB.` }));
      return;
    }
    if (role === 'pdf' && file.type && file.type !== 'application/pdf') {
      setFileErrors((e) => ({ ...e, main: 'Choose a PDF file.' }));
      return;
    }
    if (role === 'audio' && file.type && !AUDIO_TYPES.includes(file.type)) {
      setFileErrors((e) => ({ ...e, main: 'Choose an MP3 or M4A audio file.' }));
      return;
    }
    if (role === 'cover') setCoverPreview(URL.createObjectURL(file));
    aborts.current[slot]?.abort();
    const controller = new AbortController();
    aborts.current[slot] = controller;
    setProgress((p) => ({ ...p, [slot]: 0 }));
    try {
      const data = await rewardsApi.sendFile(apiString, accessToken, upload.id, role, file, {
        signal: controller.signal,
        onProgress: (value) => setProgress((p) => ({ ...p, [slot]: value })),
      });
      applyUpload(data);
      if (role === 'cover') setCoverPreview('');
    } catch (err) {
      if (err?.code === 'ERR_CANCELED') {
        setFileErrors((e) => ({ ...e, [slot]: 'Upload stopped.' }));
      } else {
        setFileErrors((e) => ({ ...e, [slot]: describeApiError(err, 'This file couldn’t be uploaded. Try again.') }));
      }
      if (role === 'cover') setCoverPreview('');
    } finally {
      delete aborts.current[slot];
      setProgress((p) => ({ ...p, [slot]: undefined }));
    }
  };

  const stopUpload = (slot) => aborts.current[slot]?.abort();

  const saveChapters = async () => {
    setChapterError('');
    const rows = chapters.filter((c) => c.title.trim() || c.start.trim());
    for (let i = 0; i < rows.length; i += 1) {
      if (!rows[i].title.trim()) { setChapterError(`Chapter ${i + 1} needs a title.`); return false; }
      if (parseClock(rows[i].start) === null) { setChapterError(`Chapter ${i + 1}: write the start like 12:30 or 1:05:00.`); return false; }
    }
    try {
      const data = await rewardsApi.updateUpload(apiString, accessToken, upload.id, {
        chapters: rows.map((c) => ({ title: c.title.trim(), start_seconds: parseClock(c.start) })),
      });
      applyUpload(data);
      return true;
    } catch (err) {
      const found = fieldErrors(err);
      setChapterError(found.chapters || describeApiError(err, 'The chapters couldn’t be saved.'));
      return false;
    }
  };

  const filesReady = upload && upload.cover_url && upload.file;
  const busy = progress.cover !== undefined || progress.main !== undefined;

  const continueToSend = async () => {
    if (kind === 'audiobook' && chapters.some((c) => c.title.trim() || c.start.trim())) {
      const ok = await saveChapters();
      if (!ok) return;
    } else if (kind === 'audiobook' && (upload?.chapters || []).length && !chapters.length) {
      const ok = await saveChapters();   // all chapters removed
      if (!ok) return;
    }
    setStep(3);
  };

  // ---------------------------------------------------------------- step 4: send
  const send = async () => {
    const found = {};
    if (!rights.rights) found.rights = 'Choose one.';
    if (rights.rights === 'permission' && rights.rights_note.trim().length < 5) found.rights_note = 'Say who gave you permission.';
    if (!rights.confirm) found.confirm = 'Please confirm.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const data = await rewardsApi.submit(apiString, accessToken, upload.id, rights);
      applyUpload(data);
      setSent(true);
    } catch (err) {
      const fields = fieldErrors(err);
      setErrors(fields);
      if (!Object.keys(fields).length) toast.error(describeApiError(err, 'It couldn’t be sent. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  const startAnother = () => {
    setUpload(null); setKind(null); setForm(EMPTY_FORM); setChapters([]); setErrors({});
    setRights({ rights: '', rights_note: '', confirm: false }); setSent(false); setStep(0);
    navigate('/share-a-book', { replace: true });
  };

  // ---------------------------------------------------------------- pieces
  const coverSrc = coverPreview || upload?.cover_url || '';
  const languageLabel = useMemo(() => (rules.languages || []).find((l) => l.key === form.language)?.label, [rules, form.language]);
  const genreLabel = useMemo(() => (rules.genres || []).find((g) => g.key === form.genre)?.label, [rules, form.genre]);

  const hero = (
    <PageHero
      compact
      image={headerImage}
      title="Share a book"
      subtitle="Send Virsaa a Punjabi ebook or audiobook. When it passes our review it joins the library, and you earn reward coins."
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Collections', to: '/collections' }, { label: 'Share a book' }]}
    />
  );

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        {hero}
        <section className={styles.section}>
          <div className={styles.notice}>
            <RewardCoin size={56} shine />
            <h2>Log in to share a book</h2>
            <p>You need an account so we can tell you when your book passes and give you your reward coins.</p>
            <div className={styles.noticeActions}>
              <Link to="/login" className={styles.primaryButton}>Log in</Link>
              <Link to="/signup" className={styles.secondaryButton}>Create an account</Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        {hero}
        <section className={styles.section}><p className={styles.muted} role="status">Opening your upload…</p></section>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        {hero}
        <section className={styles.section}>
          <div className={styles.notice}>
            <h2>{loadError}</h2>
            <div className={styles.noticeActions}>
              <Link to="/my-rewards#uploads" className={styles.primaryButton}>See my uploads</Link>
              <button type="button" className={styles.secondaryButton} onClick={startAnother}>Share another book</button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const stepper = (
    <ol className={styles.stepper} aria-label="Steps">
      {STEPS.map((label, i) => {
        const done = sent || i < step;
        const current = !sent && i === step;
        const canGo = !sent && done && i > 0 && !busy;
        return (
          <li key={label} className={`${styles.stepItem} ${done ? styles.stepDone : ''} ${current ? styles.stepCurrent : ''}`}>
            <button type="button" onClick={() => canGo && setStep(i)} disabled={!canGo} aria-current={current ? 'step' : undefined}>
              <span className={styles.stepDot} aria-hidden="true">{done ? <FaCheck /> : i + 1}</span>
              <span className={styles.stepLabel}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  // The live preview of the book (desktop)
  const preview = (
    <aside className={styles.preview} aria-label="Preview">
      <div className={styles.bookMock}>
        {coverSrc ? (
          <img src={coverSrc} alt="" className={styles.bookCover} />
        ) : (
          <div className={styles.bookBlank}>
            <span className={styles.bookBlankTitle}>{form.title || 'Your book'}</span>
            {form.title_pa && <span className={styles.bookBlankPa} lang="pa">{form.title_pa}</span>}
            <span className={styles.bookBlankAuthor}>{form.author_name}</span>
          </div>
        )}
        {kind === 'audiobook' && <span className={styles.bookBadge}><FaHeadphones aria-hidden="true" /></span>}
      </div>
      <div className={styles.previewText}>
        <strong>{form.title || 'Title'}</strong>
        {form.title_pa && <span lang="pa">{form.title_pa}</span>}
        <small>{form.author_name || 'Author'}</small>
        <div className={styles.previewTags}>
          {kind && <span>{kind === 'audiobook' ? 'Audiobook' : 'Ebook'}</span>}
          {languageLabel && <span>{languageLabel}</span>}
          {genreLabel && form.genre !== 'other' && <span>{genreLabel}</span>}
          {form.tags.map((t) => <span key={t}>{t}</span>)}
        </div>
      </div>
      <div className={styles.previewReward}>
        <RewardCoin size={34} />
        <p><strong>{formatCoins(coins)} reward coins</strong> when it passes, plus milestone bonuses.</p>
      </div>
    </aside>
  );

  // ---------------------------------------------------------------- the steps
  let body;
  if (sent) {
    body = (
      <div className={styles.sentCard} role="status">
        <span className={styles.sentMark} aria-hidden="true"><FaPaperPlane /></span>
        <h2 ref={stepHeading} tabIndex={-1}>Sent for review</h2>
        <p>
          Thank you for sharing <strong>{upload?.title}</strong>. We check every book by hand, usually within a few days.
          You’ll get a notification when it passes, with <strong>{formatCoins(coins)} reward coins</strong>.
        </p>
        <div className={styles.noticeActions}>
          <Link to="/my-rewards" className={styles.primaryButton}><RewardCoin size={20} /> My Rewards</Link>
          <button type="button" className={styles.secondaryButton} onClick={startAnother}>Share another book</button>
        </div>
      </div>
    );
  } else if (step === 0) {
    body = (
      <div className={styles.card}>
        <h2 className={styles.stepTitle}>What are you sharing?</h2>
        <div className={styles.kindGrid} role="radiogroup" aria-label="What are you sharing?">
          {[
            { key: 'ebook', icon: <FaBook />, title: 'An ebook', text: `A PDF, up to ${rules.limits_mb.pdf} MB`, coins: rules.rates.ebook },
            { key: 'audiobook', icon: <FaHeadphones />, title: 'An audiobook', text: `One MP3 or M4A recording, up to ${rules.limits_mb.audio} MB`, coins: rules.rates.audiobook },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={kind === option.key}
              disabled={Boolean(upload) && upload.kind !== option.key}
              className={`${styles.kindCard} ${kind === option.key ? styles.kindCardOn : ''}`}
              onClick={() => setKind(option.key)}
            >
              <span className={styles.kindIcon} aria-hidden="true">{option.icon}</span>
              <span className={styles.kindTitle}>{option.title}</span>
              <span className={styles.kindText}>{option.text}</span>
              <span className={styles.kindCoins}><RewardCoin size={18} /> {formatCoins(option.coins)} coins when it passes</span>
            </button>
          ))}
        </div>
        <ul className={styles.goodToKnow}>
          <li>Punjabi heritage, Sikhi, history, stories and poetry are all welcome, in any of our four languages.</li>
          <li>Share only what you wrote or recorded, what is out of copyright, or what you have permission to share.</li>
          <li>Nothing goes on the website until we have checked it.</li>
        </ul>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} disabled={!kind} onClick={() => setStep(1)}>Continue</button>
        </div>
      </div>
    );
  } else if (step === 1) {
    body = (
      <form className={styles.card} onSubmit={(e) => { e.preventDefault(); saveDetails(); }} noValidate>
        <h2 className={styles.stepTitle} ref={stepHeading} tabIndex={-1}>About the {kind === 'audiobook' ? 'audiobook' : 'book'}</h2>

        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span>Title</span>
            <input value={form.title} onChange={(e) => setField('title', e.target.value)} maxLength={255} required aria-invalid={Boolean(errors.title)} placeholder="e.g. Saka Sirhind" />
            {errors.title && <em className={styles.error}>{errors.title}</em>}
          </label>
          <label className={styles.field}>
            <span>Title in Gurmukhi <small>(if it has one)</small></span>
            <input value={form.title_pa} onChange={(e) => setField('title_pa', e.target.value)} maxLength={255} lang="pa" placeholder="ਸਾਕਾ ਸਰਹਿੰਦ" />
          </label>
          <label className={styles.field}>
            <span>Author</span>
            <input value={form.author_name} onChange={(e) => setField('author_name', e.target.value)} maxLength={150} required aria-invalid={Boolean(errors.author_name)} placeholder="Who wrote it" />
            {errors.author_name && <em className={styles.error}>{errors.author_name}</em>}
          </label>
          {kind === 'audiobook' && (
            <label className={styles.field}>
              <span>Read by <small>(optional)</small></span>
              <input value={form.narrator} onChange={(e) => setField('narrator', e.target.value)} maxLength={150} placeholder="Who reads it" />
            </label>
          )}
        </div>

        <fieldset className={styles.fieldset}>
          <legend>Language</legend>
          <div className={styles.segmented}>
            {rules.languages.map((l) => (
              <button key={l.key} type="button" aria-pressed={form.language === l.key} className={form.language === l.key ? styles.segmentOn : ''} onClick={() => setField('language', l.key)}>
                {l.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>Kind of book</legend>
          <div className={styles.chips}>
            {rules.genres.map((g) => (
              <button key={g.key} type="button" aria-pressed={form.genre === g.key} className={`${styles.chip} ${form.genre === g.key ? styles.chipOn : ''}`} onClick={() => setField('genre', g.key)}>
                {g.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className={styles.field}>
          <label htmlFor="share-tags">Tags <small>(up to {rules.max_tags}: words people might search for)</small></label>
          <div className={styles.tagBox}>
            {form.tags.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
                <button type="button" onClick={() => removeTag(t)} aria-label={`Remove the tag ${t}`}><FaTimes /></button>
              </span>
            ))}
            {form.tags.length < rules.max_tags && (
              <input id="share-tags" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={onTagKey} onBlur={() => addTag(tagDraft)} maxLength={24} placeholder={form.tags.length ? 'Add another' : 'Type a tag and press Enter'} />
            )}
          </div>
          <div className={styles.tagIdeas}>
            {TAG_IDEAS.filter((t) => !form.tags.includes(t)).slice(0, 5).map((t) => (
              <button key={t} type="button" onClick={() => addTag(t)} disabled={form.tags.length >= rules.max_tags}><FaPlus aria-hidden="true" /> {t}</button>
            ))}
          </div>
          {errors.tags && <em className={styles.error}>{errors.tags}</em>}
        </div>

        <label className={styles.field}>
          <span>What is it about? <small>(a few lines for the library page)</small></span>
          <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} maxLength={3000} rows={5} />
          <small className={styles.counter}>{form.description.length} / 3000</small>
        </label>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={() => setStep(0)}><FaArrowLeft aria-hidden="true" /> Back</button>
          <button type="submit" className={styles.primaryButton} disabled={saving}>{saving ? 'Saving…' : 'Save and continue'}</button>
        </div>
      </form>
    );
  } else if (step === 2) {
    const mainFile = upload?.file;
    const mainLimit = rules.limits_mb[mainRole];
    body = (
      <div className={styles.card}>
        <h2 className={styles.stepTitle} ref={stepHeading} tabIndex={-1}>Add the files</h2>
        <p className={styles.muted}>Your files stay private until the book passes our review.</p>

        <div className={styles.fileGrid}>
          {/* Cover */}
          <div className={styles.fileSlot}>
            <h3><FaImage aria-hidden="true" /> Cover picture</h3>
            <label className={`${styles.drop} ${styles.coverDrop}`}>
              {coverSrc ? <img src={coverSrc} alt="Cover" className={styles.coverThumb} /> : <FaCloudUploadAlt className={styles.dropIcon} aria-hidden="true" />}
              <span>{upload?.cover_url ? 'Change the cover' : 'Choose a picture'}</span>
              <small>JPG or PNG, up to {rules.limits_mb.cover} MB</small>
              <input type="file" accept="image/jpeg,image/png,image/webp" className={styles.srOnly} onChange={(e) => { sendFile('cover', e.target.files?.[0]); e.target.value = ''; }} disabled={progress.cover !== undefined} />
            </label>
            {progress.cover !== undefined && <Progress value={progress.cover} onStop={() => stopUpload('cover')} />}
            {fileErrors.cover && <em className={styles.error} role="alert">{fileErrors.cover}</em>}
          </div>

          {/* The book */}
          <div className={styles.fileSlot}>
            <h3>{kind === 'audiobook' ? <FaFileAudio aria-hidden="true" /> : <FaFilePdf aria-hidden="true" />} {kind === 'audiobook' ? 'The recording' : 'The book (PDF)'}</h3>
            <label className={styles.drop}>
              <FaCloudUploadAlt className={styles.dropIcon} aria-hidden="true" />
              <span>{mainFile ? 'Replace the file' : kind === 'audiobook' ? 'Choose the MP3 or M4A file' : 'Choose the PDF'}</span>
              <small>Up to {mainLimit} MB</small>
              <input type="file" accept={kind === 'audiobook' ? 'audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a' : 'application/pdf,.pdf'} className={styles.srOnly} onChange={(e) => { sendFile(mainRole, e.target.files?.[0]); e.target.value = ''; }} disabled={progress.main !== undefined} />
            </label>
            {progress.main !== undefined && <Progress value={progress.main} onStop={() => stopUpload('main')} />}
            {mainFile && progress.main === undefined && (
              <p className={styles.fileInfo}>
                <FaCheck aria-hidden="true" />
                {mainFile.format} · {formatBytes(mainFile.size)}
                {upload.pages ? ` · ${upload.pages} pages` : ''}
                {upload.duration ? ` · ${upload.duration}` : ''}
              </p>
            )}
            {fileErrors.main && <em className={styles.error} role="alert">{fileErrors.main}</em>}
          </div>
        </div>

        {kind === 'audiobook' && mainFile && (
          <div className={styles.chapters}>
            <h3>Chapters <small>(optional: where each one starts)</small></h3>
            {chapters.length > 0 && (
              <ol className={styles.chapterList}>
                {chapters.map((c, i) => (
                  <li key={c.key}>
                    <input aria-label={`Chapter ${i + 1} title`} value={c.title} maxLength={120} placeholder={`Chapter ${i + 1}`} onChange={(e) => setChapters((list) => list.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                    <input aria-label={`Chapter ${i + 1} starts at`} className={styles.timeInput} value={c.start} placeholder="0:00" inputMode="numeric" onChange={(e) => setChapters((list) => list.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
                    <button type="button" className={styles.iconButton} onClick={() => setChapters((list) => list.filter((_, j) => j !== i))} aria-label={`Remove chapter ${i + 1}`}><FaTrash /></button>
                  </li>
                ))}
              </ol>
            )}
            <button type="button" className={styles.textButton} onClick={() => setChapters((list) => [...list, { key: nextKey(), title: '', start: list.length ? '' : '0:00' }])}>
              <FaPlus aria-hidden="true" /> Add a chapter
            </button>
            {upload?.duration_seconds ? <small className={styles.muted}> The recording is {formatClock(upload.duration_seconds)} long.</small> : null}
            {chapterError && <em className={styles.error} role="alert">{chapterError}</em>}
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={() => setStep(1)} disabled={busy}><FaArrowLeft aria-hidden="true" /> Back</button>
          <button type="button" className={styles.primaryButton} onClick={continueToSend} disabled={!filesReady || busy}>Continue</button>
        </div>
        {!filesReady && !busy && <p className={styles.hint}>Add the cover and the {kind === 'audiobook' ? 'recording' : 'PDF'} to continue.</p>}
      </div>
    );
  } else {
    body = (
      <div className={styles.card}>
        <h2 className={styles.stepTitle} ref={stepHeading} tabIndex={-1}>May you share it?</h2>
        <p className={styles.muted}>We only publish books that can be shared freely. Tell us which is true:</p>
        <div className={styles.rightsList} role="radiogroup" aria-label="Rights">
          {rules.rights.map((r) => (
            <label key={r.key} className={`${styles.rightsOption} ${rights.rights === r.key ? styles.rightsOn : ''}`}>
              <input type="radio" name="rights" value={r.key} checked={rights.rights === r.key} onChange={() => { setRights((x) => ({ ...x, rights: r.key })); setErrors({}); }} />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
        {errors.rights && <em className={styles.error}>{errors.rights}</em>}
        <label className={styles.field}>
          <span>{rights.rights === 'permission' ? 'Who gave you permission?' : 'Anything we should know? '}<small>{rights.rights === 'permission' ? '' : '(optional)'}</small></span>
          <textarea rows={3} maxLength={600} value={rights.rights_note} onChange={(e) => setRights((x) => ({ ...x, rights_note: e.target.value }))} placeholder={rights.rights === 'public_domain' ? 'e.g. first printed in 1905' : ''} />
          {errors.rights_note && <em className={styles.error}>{errors.rights_note}</em>}
        </label>
        <label className={styles.confirm}>
          <input type="checkbox" checked={rights.confirm} onChange={(e) => setRights((x) => ({ ...x, confirm: e.target.checked }))} />
          <span>I confirm that I may share this book with Virsaa, and that it is complete and readable.</span>
        </label>
        {errors.confirm && <em className={styles.error}>{errors.confirm}</em>}
        <p className={styles.privacy}><FaLock aria-hidden="true" /> In the library it says “Shared by” with your first name and last initial, never your email.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={() => setStep(2)}><FaArrowLeft aria-hidden="true" /> Back</button>
          <button type="button" className={styles.primaryButton} onClick={send} disabled={saving}><FaPaperPlane aria-hidden="true" /> {saving ? 'Sending…' : 'Send for review'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {hero}
      <section className={styles.section}>
        {upload?.status === 'changes' && upload.review_note && !sent && (
          <div className={styles.reviewNote} role="note">
            <FaRedo aria-hidden="true" />
            <div><strong>What our reviewers asked for</strong><p>{upload.review_note}</p></div>
          </div>
        )}
        {stepper}
        <div className={`${styles.layout} ${step === 0 && !sent ? styles.layoutWide : ''}`}>
          <div className={styles.main}>{body}</div>
          {(step > 0 || sent) && preview}
        </div>
      </section>
    </div>
  );
};

/** A progress bar with a stop button. */
const Progress = ({ value, onStop }) => {
  const percent = Math.round((value || 0) * 100);
  return (
    <div className={styles.progressRow}>
      <div className={styles.progress} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Uploading">
        <span style={{ width: `${percent}%` }} />
      </div>
      <span className={styles.progressText}>{percent < 100 ? `${percent}%` : 'Checking…'}</span>
      {percent < 100 && <button type="button" className={styles.iconButton} onClick={onStop} aria-label="Stop the upload"><FaTimes /></button>}
    </div>
  );
};

export default ShareBook;
