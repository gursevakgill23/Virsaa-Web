/**
 * components/Sidebar/Sidebar.jsx
 * -----------------------------------------------------------------------------
 * The Virsaa side panel (opened from the navbar's menu button) plus the
 * section tab bar shown at the bottom of the screen on phones and tablets.
 *
 * The panel has three views:
 *   'home'     greeting with today's Nanakshahi date, "Share an event", what's on
 *              today (calendar days + community events), the Nanakshahi calendar
 *              card, "Did you know?" and links to every page
 *   'calendar' the Nanakshahi calendar month view (NanakshahiCalendar.jsx)
 *   'form'     the add-event form, which checks the Nanakshahi calendar while
 *              you type so religious days already listed aren't added twice
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTimes, FaHome, FaBook, FaHistory, FaGraduationCap, FaNewspaper, FaRegFileAudio,
  FaUsers, FaPlus, FaCalendarAlt, FaMapMarkerAlt, FaImage, FaTrashAlt, FaArrowLeft, FaClock, FaChevronRight, FaExclamationCircle,
} from 'react-icons/fa';
import { FaHandsPraying, FaHouseFlag } from 'react-icons/fa6';
import { MdChevronRight } from 'react-icons/md';
import { BsCollectionFill } from 'react-icons/bs';
import { IoIosPeople } from 'react-icons/io';
import { useAuth } from '../../context/AuthContext';
import newsApi, { calendarApi, localISODate } from '../../api/newsApi';
import { toNanakshahi } from '../../utils/nanakshahi';
import NanakshahiCalendar from './NanakshahiCalendar';
import styles from './Sidebar.module.css';

/*
 * Today's list comes from /collections/events/today/. When nothing is on, it shows a
 * random upcoming event or news story instead. Signed-in users can add events; they
 * appear straight away, and the list refreshes every minute while the panel is open.
 */
// ---------------------------------------------------------------- settings and helpers
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB, same limit as the server
const REFRESH_MS = 60000;

// "Did you know?" facts; one is picked per day of the year
const FACTS = [
  'Punjab means "land of five waters": the Jhelum, Chenab, Ravi, Beas and Sutlej rivers.',
  'The langar at Sri Harmandir Sahib serves free meals to tens of thousands of people every day, whoever they are.',
  'Sri Guru Granth Sahib Ji includes the writings of Sikh Gurus alongside saints such as Bhagat Kabir, Bhagat Ravidas and Baba Sheikh Farid.',
  'Guru Angad Dev Ji is credited with shaping the Gurmukhi script used to write Punjabi.',
  'Vaisakhi marks the harvest in Punjab and the founding of the Khalsa by Guru Gobind Singh Ji in 1699.',
];

// A blank add-event form (date defaults to today)
const emptyForm = () => ({ name: '', kind: 'event', date: localISODate(), time: '', place: '', description: '', details: '' });

// Choices for the form's "Type" field (match Event.KIND_CHOICES on the server)
const EVENT_KINDS = [
  { value: 'event', label: 'Community event' },
  { value: 'kirtan', label: 'Kirtan / Path' },
  { value: 'gurpurab', label: 'Gurpurab' },
  { value: 'sangrand', label: 'Sangrand' },
  { value: 'festival', label: 'Festival / Purab' },
  { value: 'other', label: 'Other' },
];

// Labels for calendar entries shown under "Today"
const CALENDAR_KIND_LABELS = {
  gurpurab: 'Gurpurab', shaheedi: 'Shaheedi Purab', festival: 'Festival', historical: 'Historic day',
  sangrand: 'Sangrand', puranmashi: 'Puranmashi', masya: 'Masya',
};

// "18:30" → "6:30 PM" in the visitor's locale
const formatTime = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

// "2026-11-24" → "Nov 24, 2026" (parsed as a local date, so it never shifts a day)
const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

// Props: open (is the panel showing), closeSidebar(), apiString (API base URL)
const Sidebar = ({ open, closeSidebar, apiString }) => {
  const { isLoggedIn, accessToken } = useAuth();
  const [activeMenu, setActiveMenu] = useState(null);
  const [view, setView] = useState('home'); // 'home' | 'form' | 'calendar'
  const [calendarFocus, setCalendarFocus] = useState(null);
  const [today, setToday] = useState({ events: [], calendar: [], nanakshahi: null, pick: null });
  const [duplicate, setDuplicate] = useState(null); // calendar/event match for the form
  const [nextOccasion, setNextOccasion] = useState(null); // next Gurpurab/festival, shown on the calendar card
  const [todayState, setTodayState] = useState('loading'); // loading | ready | error
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const sidebarRef = useRef(null);
  const fileInputRef = useRef(null);
  const location = useLocation();

  // Sections for the phone tab bar; groups open a second row of links
  const mainTabs = useMemo(() => [
    { id: 'home', icon: <FaHome />, label: 'Home', path: '/home' },
    {
      id: 'collections',
      icon: <BsCollectionFill />,
      label: 'Collections',
      subItems: [
        { id: 'ebooks', icon: <FaBook />, label: 'Ebooks', path: '/collections/ebooks' },
        { id: 'audiobooks', icon: <FaRegFileAudio />, label: 'Audiobooks', path: '/collections/audiobooks' },
        { id: 'authors', icon: <IoIosPeople />, label: 'Authors', path: '/collections/authors' },
      ],
    },
    {
      id: 'sikhism',
      icon: <FaHistory />,
      label: 'Sikhism',
      subItems: [
        { id: 'history', icon: <FaHistory />, label: 'History', path: '/sikh-history' },
        { id: 'gurbani', icon: <FaHandsPraying />, label: 'Gurbani', path: '/gurbani' },
        { id: 'gurdwara-access', icon: <FaHouseFlag />, label: 'Gurdwara Access', path: '/gurdwara-access' },
      ],
    },
    { id: 'learning', icon: <FaGraduationCap />, label: 'Learning', path: '/learning' },
    { id: 'news', icon: <FaNewspaper />, label: 'News', path: '/news' },
    { id: 'about', icon: <FaUsers />, label: 'About', path: '/about' },
  ], []);

  // Flat list of every page, used for the "Go to" grid inside the panel
  // Flat list of every page, used for the "Go to" grid inside the panel
  const allLinks = useMemo(() => mainTabs.flatMap((tab) => (tab.subItems ? tab.subItems : [tab])), [mainTabs]);

  const factOfTheDay = useMemo(() => {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const day = Math.floor((Date.now() - start) / 86400000);
    return FACTS[day % FACTS.length];
  }, []);

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
    []
  );
  const nanakshahiToday = today.nanakshahi?.label || toNanakshahi(new Date())?.label;
  // Pieces for the calendar card's date tile (Gurmukhi month, day, year)
  const nsParts = useMemo(() => toNanakshahi(new Date()), []);

  // Today's events: load when the panel opens, then refresh every minute while it stays open
  // Today's events: load when the panel opens, then refresh every minute while it stays open.
  // `quiet` refreshes keep what's on screen if a refresh fails.
  const loadToday = useCallback(async (quiet = false) => {
    if (!quiet) setTodayState((s) => (s === 'ready' ? s : 'loading'));
    try {
      const data = await newsApi.today(apiString, isLoggedIn ? accessToken : null);
      setToday({ events: data.events || [], calendar: data.calendar || [], nanakshahi: data.nanakshahi || null, pick: data.pick || null });
      setTodayState('ready');
    } catch {
      if (!quiet) setTodayState('error');
    }
  }, [apiString, accessToken, isLoggedIn]);

  // Next Gurpurab / Shaheedi Purab / festival in the coming 120 days, for the calendar card.
  // Failing quietly is fine: the card then just shows today's Nanakshahi date.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const start = new Date();
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 120);
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    calendarApi.between(apiString, iso(start), iso(end), 'gurpurab,shaheedi,festival')
      .then((entries) => { if (!cancelled) setNextOccasion(entries[0] || null); })
      .catch(() => { if (!cancelled) setNextOccasion(null); });
    return () => { cancelled = true; };
  }, [open, apiString]);

  useEffect(() => {
    if (!open) return undefined;
    loadToday();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') loadToday(true); }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [open, loadToday]);

  // Free the image preview when it changes
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  // Stop the page scrolling while the panel is open
  useEffect(() => {
    document.body.classList.toggle('no-scroll', open);
    return () => document.body.classList.remove('no-scroll');
  }, [open]);

  // Close with Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Track active tab group based on the current route
  useEffect(() => {
    const currentTab = mainTabs.find((tab) =>
      tab.path === location.pathname ||
      (tab.subItems && tab.subItems.some((sub) => sub.path === location.pathname))
    );
    setActiveMenu(currentTab?.subItems ? currentTab.id : null);
  }, [location.pathname, mainTabs]);

  // Close the panel and reset it to the home view
  const handleClose = () => {
    closeSidebar();
    setActiveMenu(null);
    setView('home');
    setErrors({});
    setDuplicate(null);
  };

  // Open the calendar view, optionally on a specific date
  const openCalendar = (date = null) => {
    setCalendarFocus(date);
    setView('calendar');
  };

  // While the form is filled in, check whether the occasion is already in the calendar
  useEffect(() => {
    if (view !== 'form' || form.name.trim().length < 3 || !form.date) { setDuplicate(null); return undefined; }
    const timer = setTimeout(async () => {
      try {
        const res = await calendarApi.check(apiString, {
          title: form.name.trim(), date: form.date, kind: form.kind, location: form.place.trim(),
        });
        setDuplicate(res.duplicate ? res.match : null);
      } catch {
        setDuplicate(null); // the server checks again when posting
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [view, form.name, form.date, form.kind, form.place, apiString]);

  // The "already there" message for a calendar or event match
  const duplicateMessage = (m) => {
    if (!m) return '';
    const [y, mo, d] = m.date.split('-').map(Number);
    const when = new Date(y, mo - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
    return m.source === 'calendar'
      ? `“${m.title}” is already in the Nanakshahi calendar on ${when}, so there’s no need to add it.`
      : `“${m.title}” at this place is already listed on ${when}.`;
  };

  // Highlights the tab for the page you're on
  const isTabActive = (tab) => (tab.path
    ? location.pathname === tab.path || (tab.id === 'home' && location.pathname === '/')
    : tab.subItems.some((sub) => location.pathname.startsWith(sub.path)));

  const handleMainTabClick = (tab) => {
    if (!tab.subItems) closeSidebar();
    setActiveMenu(tab.subItems ? tab.id : null);
  };

  // ---------------------------------------------------------------- form
  // ---------------------------------------------------------------- add-event form
  // Keep the typed value and clear that field's error
  const updateField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Check the chosen image (type and size) before showing a preview
  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setErrors((prev) => ({ ...prev, image: 'Choose a JPG, PNG or WebP image.' }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((prev) => ({ ...prev, image: 'Image must be smaller than 5 MB.' }));
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: '' }));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Required fields and a date that isn't in the past
  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Add a name for the event.';
    if (!form.date) next.date = 'Pick the event date.';
    else if (form.date < localISODate()) next.date = 'Pick today or a later date.'; // ISO dates compare as text
    if (!form.place.trim()) next.place = 'Add where the event takes place.';
    if (!form.details.trim()) next.details = 'Add the event details.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Post the event. 409 = already in the calendar / already posted at that place;
  // 401 = signed out; other errors are shown next to the matching field.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (duplicate) { setErrors({ form: duplicateMessage(duplicate) }); return; }
    setIsSaving(true);
    try {
      const created = await newsApi.createEvent(apiString, accessToken, {
        title: form.name.trim(),
        kind: form.kind,
        start_date: form.date,
        start_time: form.time || undefined,
        location: form.place.trim(),
        description: form.description.trim(),
        details: form.details.trim(),
      }, imageFile);
      // Show it straight away if it's on today, then refresh from the server
      if (created.start_date === localISODate()) {
        setToday((prev) => ({ events: [...prev.events, created], pick: null }));
      }
      loadToday(true);
      setForm(emptyForm());
      removeImage();
      setNotice(created.start_date === localISODate()
        ? `"${created.title}" was added to today's events.`
        : `"${created.title}" was added. It's on the News & Events page.`);
      setView('home');
      setTimeout(() => setNotice(''), 5000);
    } catch (err) {
      const d = err.response?.data || {};
      const first = (v) => (Array.isArray(v) ? v[0] : v);
      if (err.response?.status === 409) {
        setDuplicate(d.match || null);
        setErrors({ form: d.match ? duplicateMessage(d.match) : (d.error || 'This is already listed.') });
      } else if (err.response?.status === 401) {
        setErrors({ form: 'Your session has ended. Log in again to add an event.' });
      } else {
        setErrors({
          name: first(d.title), date: first(d.start_date) || first(d.end_date), place: first(d.location),
          details: first(d.details), image: first(d.image),
          form: !Object.keys(d).length ? 'The event couldn’t be added. Try again.' : undefined,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete one of your own events (removed at once, restored if the server refuses)
  const deleteEvent = async (id) => {
    const before = today;
    setToday((prev) => ({ ...prev, events: prev.events.filter((ev) => ev.id !== id) }));
    try {
      await newsApi.deleteEvent(apiString, accessToken, id);
      loadToday(true);
    } catch {
      setToday(before);
      setNotice('That event couldn’t be deleted. Try again.');
      setTimeout(() => setNotice(''), 4000);
    }
  };

  // One community event card under "Today"
  const renderEvent = (ev) => (
    <li key={ev.id} className={styles.eventCard}>
      {ev.image_url ? (
        <img src={ev.image_url} alt="" className={styles.eventImage} />
      ) : (
        <div className={styles.eventImagePlaceholder} aria-hidden="true"><FaCalendarAlt /></div>
      )}
      <div className={styles.eventInfo}>
        <h4>{ev.title}</h4>
        <p className={styles.eventMeta}>
          <FaCalendarAlt aria-hidden="true" /> {formatDate(ev.start_date)}
          {ev.end_date && ev.end_date !== ev.start_date ? ` – ${formatDate(ev.end_date)}` : ''}
        </p>
        {ev.start_time && (
          <p className={styles.eventMeta}><FaClock aria-hidden="true" /> {formatTime(ev.start_time)}</p>
        )}
        <p className={styles.eventMeta}><FaMapMarkerAlt aria-hidden="true" /> {ev.location}</p>
        {ev.description && <p className={styles.eventDesc}>{ev.description}</p>}
        {ev.details && (
          <details className={styles.eventDetails}>
            <summary>Details</summary>
            <p>{ev.details}</p>
            <p className={styles.postedBy}>Added by {ev.posted_by}</p>
          </details>
        )}
      </div>
      {ev.can_delete && (
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => deleteEvent(ev.id)}
          aria-label={`Delete ${ev.title}`}
        >
          <FaTrashAlt />
        </button>
      )}
    </li>
  );

  // When nothing is on today: a random upcoming event or news story
  const renderPick = (pick) => {
    const item = pick.item;
    const isEvent = pick.type === 'event';
    return (
      <Link to="/news" className={styles.pickCard} onClick={handleClose}>
        {(isEvent ? item.image_url : item.image) ? (
          <img src={isEvent ? item.image_url : item.image} alt="" className={styles.pickImage} />
        ) : (
          <span className={styles.pickIcon} aria-hidden="true">{isEvent ? <FaCalendarAlt /> : <FaNewspaper />}</span>
        )}
        <span className={styles.pickBody}>
          <span className={styles.pickLabel}>{isEvent ? `Coming up ${formatDate(item.start_date)}` : 'From the news'}</span>
          <span className={styles.pickTitle}>{item.title}</span>
          <span className={styles.pickText}>{isEvent ? item.location : item.excerpt}</span>
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Dimmed page behind the panel; clicking it closes the panel */}
      <div
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      <aside
        className={`${styles.sidebar} ${open ? styles.open : ''}`}
        ref={sidebarRef}
        aria-hidden={!open}
        aria-label="Virsaa panel"
      >
        {/* Header: greeting and dates, or a back button inside the calendar/form views */}
        <header className={styles.panelHeader}>
          {view !== 'home' ? (
            <div className={styles.headerBack}>
              <button type="button" className={styles.iconButton} onClick={() => setView('home')} aria-label="Back">
                <FaArrowLeft />
              </button>
              <p className={styles.headerTitle}>{view === 'calendar' ? 'Nanakshahi calendar' : 'Add an event'}</p>
            </div>
          ) : (
            <div>
              <p className={styles.greeting}>Sat Sri Akal</p>
              <p className={styles.today}>{todayLabel}</p>
              {nanakshahiToday && <p className={styles.nsToday}>{nanakshahiToday} Nanakshahi</p>}
            </div>
          )}
          <button type="button" className={styles.iconButton} onClick={handleClose} aria-label="Close panel">
            <FaTimes />
          </button>
        </header>

        <div className={styles.panelBody}>
          {view === 'home' ? (
            <>
              {notice && <p className={styles.notice} role="status">{notice}</p>}

              {/* Add event call-to-action */}
              <section className={`${styles.glassCard} ${styles.addCard}`}>
                <div>
                  <h3 className={styles.cardTitle}>Share an event</h3>
                  <p className={styles.cardText}>
                    Kirtan, nagar kirtan, langar seva or a class at your Gurdwara: add it so others can join.
                    You can also add a Sangrand, Gurpurab or other religious day that’s missing from the Nanakshahi calendar.
                  </p>
                </div>
                {isLoggedIn ? (
                  <button type="button" className={styles.primaryButton} onClick={() => setView('form')}>
                    <FaPlus aria-hidden="true" /> Add event
                  </button>
                ) : (
                  <Link to="/login" className={styles.primaryButton} onClick={handleClose}>
                    Log in to add an event
                  </Link>
                )}
              </section>

              {/* Today */}
              <section className={styles.block} aria-live="polite">
                <h3 className={styles.blockTitle}>Today</h3>
                {todayState === 'loading' ? (
                  <p className={styles.empty}>Checking what’s on today…</p>
                ) : todayState === 'error' ? (
                  <p className={styles.empty}>
                    Today’s events couldn’t be loaded. <button type="button" className={styles.linkButton} onClick={() => loadToday()}>Try again</button>
                  </p>
                ) : today.events.length > 0 || today.calendar.length > 0 ? (
                  <>
                    {today.calendar.length > 0 && (
                      <ul className={styles.calendarToday}>
                        {today.calendar.map((c) => (
                          <li key={c.id}>
                            <button type="button" className={`${styles.calendarItem} ${styles[`ck_${c.kind}`] || ''}`} onClick={() => openCalendar(c.date)}>
                              <span className={styles.calendarItemKind}>{CALENDAR_KIND_LABELS[c.kind] || 'Nanakshahi calendar'}</span>
                              <span className={styles.calendarItemTitle}>{c.title}</span>
                              {c.description && <span className={styles.calendarItemText}>{c.description}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {today.events.length > 0 && <ul className={styles.eventList}>{today.events.map(renderEvent)}</ul>}
                  </>
                ) : (
                  <>
                    <p className={styles.empty}>Nothing is on today.{today.pick ? ' Here’s something to look at:' : ''}</p>
                    {today.pick && renderPick(today.pick)}
                  </>
                )}
                <Link to="/news" className={styles.moreLink} onClick={handleClose}>
                  See all upcoming events
                </Link>
              </section>

              {/* Nanakshahi calendar card: a tear-off date tile for today, plus the next
                  Gurpurab or festival. Opens the full month view. */}
              <button type="button" className={styles.calendarCard} onClick={() => openCalendar()}>
                <span className={styles.dateTile} aria-hidden="true">
                  <span className={styles.dateTileMonth} lang="pa">{nsParts?.pa}</span>
                  <span className={styles.dateTileDay}>{nsParts?.day}</span>
                  <span className={styles.dateTileYear}>{nsParts?.year}</span>
                </span>
                <span className={styles.calendarCardBody}>
                  <span className={styles.calendarCardTitle}>Nanakshahi calendar</span>
                  <span className={styles.calendarCardText}>
                    {nextOccasion
                      ? <>Next: <strong>{nextOccasion.title}</strong>, {formatDate(nextOccasion.date).replace(/,? \d{4}$/, '')}</>
                      : 'Gurpurabs, Sangrand, Puranmashi and community events by month'}
                  </span>
                </span>
                <FaChevronRight className={styles.calendarCardArrow} aria-hidden="true" />
              </button>

              {/* Did you know */}
              <section className={`${styles.glassCard} ${styles.factCard}`}>
                <h3 className={styles.cardTitle}>Did you know?</h3>
                <p className={styles.cardText}>{factOfTheDay}</p>
              </section>

              {/* Go to: every page, so phones can navigate from here */}
              <section className={styles.block}>
                <h3 className={styles.blockTitle}>Go to</h3>
                <nav className={styles.linkGrid} aria-label="Pages">
                  {allLinks.map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`${styles.linkTile} ${location.pathname === item.path ? styles.linkActive : ''}`}
                      onClick={handleClose}
                    >
                      <span className={styles.linkIcon}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </section>
            </>
          ) : view === 'calendar' ? (
            <NanakshahiCalendar apiString={apiString} focusDate={calendarFocus} />
          ) : (
            /* Add-event form */
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <p className={styles.formIntro}>
                Add any event, or a religious day such as a Sangrand, Gurpurab or Purab that’s missing from the
                Nanakshahi calendar. Days already in the calendar don’t need adding;{' '}
                <button type="button" className={styles.linkButton} onClick={() => openCalendar(form.date)}>check the calendar</button>.
              </p>
              <p className={styles.cardText}>Fields marked * are required.</p>

              <label className={styles.field}>
                <span>Type</span>
                <select name="kind" value={form.kind} onChange={updateField}>
                  {EVENT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
              </label>

              <label className={styles.field}>
                <span>Event name *</span>
                <input name="name" value={form.name} onChange={updateField} placeholder="e.g. Sukhmani Sahib path" maxLength={255}
                  className={errors.name ? styles.inputError : ''} />
                {errors.name && <small className={styles.error}>{errors.name}</small>}
              </label>

              {duplicate && (
                <div className={styles.duplicate} role="status">
                  <FaExclamationCircle aria-hidden="true" />
                  <div>
                    <p>{duplicateMessage(duplicate)}</p>
                    {duplicate.source === 'calendar' && (
                      <button type="button" className={styles.linkButton} onClick={() => openCalendar(duplicate.date)}>
                        See it in the calendar
                      </button>
                    )}
                  </div>
                </div>
              )}

              <label className={styles.field}>
                <span>Event date *</span>
                <input type="date" name="date" value={form.date} min={localISODate()} onChange={updateField}
                  className={errors.date ? styles.inputError : ''} />
                {errors.date && <small className={styles.error}>{errors.date}</small>}
              </label>

              <label className={styles.field}>
                <span>Start time</span>
                <input type="time" name="time" value={form.time} onChange={updateField} />
              </label>

              <div className={styles.field}>
                <span>Event image (optional)</span>
                {imagePreview ? (
                  <div className={styles.imagePreview}>
                    <img src={imagePreview} alt="Selected event" />
                    <button type="button" onClick={removeImage} className={styles.removeImage}>Remove</button>
                  </div>
                ) : (
                  <label className={styles.dropzone}>
                    <FaImage aria-hidden="true" />
                    <span>Choose an image (max 5 MB)</span>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} />
                  </label>
                )}
                {errors.image && <small className={styles.error}>{errors.image}</small>}
              </div>

              <label className={styles.field}>
                <span>Event place *</span>
                <input name="place" value={form.place} onChange={updateField} placeholder="Gurdwara, hall or address" maxLength={255}
                  className={errors.place ? styles.inputError : ''} />
                {errors.place && <small className={styles.error}>{errors.place}</small>}
              </label>

              <label className={styles.field}>
                <span>Short description</span>
                <input name="description" value={form.description} onChange={updateField} maxLength={140}
                  placeholder="One line people see in the list" />
              </label>

              <label className={styles.field}>
                <span>Event details *</span>
                <textarea name="details" rows={5} value={form.details} onChange={updateField} maxLength={3000}
                  placeholder="Timings, schedule, who to contact, what to bring"
                  className={errors.details ? styles.inputError : ''} />
                {errors.details && <small className={styles.error}>{errors.details}</small>}
              </label>

              {errors.form && !duplicate && <p className={styles.error} role="alert">{errors.form}</p>}
              <button type="submit" className={styles.primaryButton} disabled={isSaving || !!duplicate}>
                {isSaving ? 'Adding…' : 'Add event'}
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* Section tab bar for phones and tablets (below 992px) */}
      <nav className={styles.tabNavigation} aria-label="Sections">
        {!activeMenu ? (
          mainTabs.map((tab) => (
            tab.path ? (
              <Link
                key={tab.id}
                to={tab.path}
                className={`${styles.tabItem} ${isTabActive(tab) ? styles.tabActive : ''}`}
                aria-current={isTabActive(tab) ? 'page' : undefined}
                onClick={() => handleMainTabClick(tab)}
              >
                <div className={styles.tabIcon}>{tab.icon}</div>
                <div className={styles.tabLabel}>{tab.label}</div>
              </Link>
            ) : (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabItem} ${isTabActive(tab) ? styles.tabActive : ''}`}
                aria-expanded={activeMenu === tab.id}
                onClick={() => handleMainTabClick(tab)}
              >
                <div className={styles.tabIcon}>{tab.icon}</div>
                <div className={styles.tabLabel}>{tab.label}</div>
              </button>
            )
          ))
        ) : (
          <>
            <button type="button" className={styles.tabItem} onClick={() => setActiveMenu(null)}>
              <div className={styles.tabIcon}><MdChevronRight style={{ transform: 'rotate(180deg)' }} /></div>
              <div className={styles.tabLabel}>Back</div>
            </button>
            {mainTabs.find((tab) => tab.id === activeMenu)?.subItems?.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`${styles.tabItem} ${location.pathname.startsWith(item.path) ? styles.tabActive : ''}`}
                onClick={closeSidebar}
              >
                <div className={styles.tabIcon}>{item.icon}</div>
                <div className={styles.tabLabel}>{item.label}</div>
              </Link>
            ))}
          </>
        )}
      </nav>
    </>
  );
};

export default Sidebar;
