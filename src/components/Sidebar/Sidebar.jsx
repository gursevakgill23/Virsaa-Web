import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTimes, FaHome, FaBook, FaHistory, FaGraduationCap, FaNewspaper, FaRegFileAudio,
  FaUsers, FaPlus, FaCalendarAlt, FaMapMarkerAlt, FaImage, FaTrashAlt, FaArrowLeft,
} from 'react-icons/fa';
import { FaHandsPraying, FaHouseFlag } from 'react-icons/fa6';
import { MdChevronRight } from 'react-icons/md';
import { BsCollectionFill } from 'react-icons/bs';
import { IoIosPeople } from 'react-icons/io';
import styles from './Sidebar.module.css';

/*
 * Events are kept in this browser (localStorage) until the backend exists.
 * When the API is ready, replace saveEvent() with the POST shown in handleSubmit.
 */
const EVENTS_KEY = 'virsaa_events';
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB, keeps localStorage happy

const FACTS = [
  'Punjab means "land of five waters": the Jhelum, Chenab, Ravi, Beas and Sutlej rivers.',
  'The langar at Sri Harmandir Sahib serves free meals to tens of thousands of people every day, whoever they are.',
  'Sri Guru Granth Sahib Ji includes the writings of Sikh Gurus alongside saints such as Bhagat Kabir, Bhagat Ravidas and Baba Sheikh Farid.',
  'Guru Angad Dev Ji is credited with shaping the Gurmukhi script used to write Punjabi.',
  'Vaisakhi marks the harvest in Punjab and the founding of the Khalsa by Guru Gobind Singh Ji in 1699.',
];

const EMPTY_FORM = { name: '', date: '', place: '', description: '', details: '', image: '' };

const loadEvents = () => {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY)) || [];
  } catch {
    return [];
  }
};

const persistEvents = (events) => {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    return true;
  } catch {
    return false;
  }
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const Sidebar = ({ open, closeSidebar }) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [view, setView] = useState('home'); // 'home' | 'form'
  const [events, setEvents] = useState(loadEvents);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const sidebarRef = useRef(null);
  const fileInputRef = useRef(null);
  const location = useLocation();

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

  const sortedEvents = useMemo(() => {
    const today = todayISO();
    const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const past = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
    return [...upcoming, ...past];
  }, [events]);

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

  const handleClose = () => {
    closeSidebar();
    setActiveMenu(null);
    setView('home');
    setErrors({});
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
  const updateField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Choose a JPG, PNG or WebP image.' }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((prev) => ({ ...prev, image: 'Image must be smaller than 1.5 MB.' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image: reader.result }));
      setErrors((prev) => ({ ...prev, image: '' }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Add a name for the event.';
    if (!form.date) next.date = 'Pick the event date.';
    if (!form.place.trim()) next.place = 'Add where the event takes place.';
    if (!form.details.trim()) next.details = 'Add the event details.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);

    const newEvent = {
      id: Date.now(),
      name: form.name.trim(),
      date: form.date,
      place: form.place.trim(),
      description: form.description.trim(),
      details: form.details.trim(),
      image: form.image,
    };

    /*
     * Backend version (when /api/events/ exists):
     *
     * const body = new FormData();
     * Object.entries({ ...newEvent, image: undefined }).forEach(([k, v]) => v && body.append(k, v));
     * if (fileInputRef.current?.files?.[0]) body.append('image', fileInputRef.current.files[0]);
     * await fetch(`${apiString}/api/events/`, {   // pass apiString in as a prop
     *   method: 'POST',
     *   headers: { Authorization: `Bearer ${accessToken}` },
     *   body,
     * });
     */
    const next = [...events, newEvent];
    const saved = persistEvents(next);
    setIsSaving(false);

    if (!saved) {
      setErrors({ image: 'Could not save. Try a smaller image or remove it.' });
      return;
    }

    setEvents(next);
    setForm(EMPTY_FORM);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setNotice(`"${newEvent.name}" was added to events.`);
    setView('home');
    setTimeout(() => setNotice(''), 4000);
  };

  const deleteEvent = (id) => {
    const next = events.filter((ev) => ev.id !== id);
    persistEvents(next);
    setEvents(next);
  };

  return (
    <>
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
        <header className={styles.panelHeader}>
          {view === 'form' ? (
            <button type="button" className={styles.iconButton} onClick={() => setView('home')} aria-label="Back">
              <FaArrowLeft />
            </button>
          ) : (
            <div>
              <p className={styles.greeting}>Sat Sri Akal</p>
              <p className={styles.today}>{todayLabel}</p>
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
                  </p>
                </div>
                <button type="button" className={styles.primaryButton} onClick={() => setView('form')}>
                  <FaPlus aria-hidden="true" /> Add event
                </button>
              </section>

              {/* Events list */}
              <section className={styles.block}>
                <h3 className={styles.blockTitle}>Events</h3>
                {sortedEvents.length === 0 ? (
                  <p className={styles.empty}>No events yet. Add the first one with the button above.</p>
                ) : (
                  <ul className={styles.eventList}>
                    {sortedEvents.map((ev) => {
                      const isPast = ev.date < todayISO();
                      return (
                        <li key={ev.id} className={`${styles.eventCard} ${isPast ? styles.eventPast : ''}`}>
                          {ev.image ? (
                            <img src={ev.image} alt="" className={styles.eventImage} />
                          ) : (
                            <div className={styles.eventImagePlaceholder} aria-hidden="true"><FaCalendarAlt /></div>
                          )}
                          <div className={styles.eventInfo}>
                            <h4>{ev.name}</h4>
                            <p className={styles.eventMeta}>
                              <FaCalendarAlt aria-hidden="true" /> {formatDate(ev.date)}{isPast ? ' (past)' : ''}
                            </p>
                            <p className={styles.eventMeta}>
                              <FaMapMarkerAlt aria-hidden="true" /> {ev.place}
                            </p>
                            {ev.description && <p className={styles.eventDesc}>{ev.description}</p>}
                            <details className={styles.eventDetails}>
                              <summary>Details</summary>
                              <p>{ev.details}</p>
                            </details>
                          </div>
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => deleteEvent(ev.id)}
                            aria-label={`Delete ${ev.name}`}
                          >
                            <FaTrashAlt />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

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
          ) : (
            /* Add-event form */
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <h3 className={styles.formTitle}>Add an event</h3>
              <p className={styles.cardText}>Fields marked * are required.</p>

              <label className={styles.field}>
                <span>Event name *</span>
                <input name="name" value={form.name} onChange={updateField} placeholder="e.g. Sukhmani Sahib path"
                  className={errors.name ? styles.inputError : ''} />
                {errors.name && <small className={styles.error}>{errors.name}</small>}
              </label>

              <label className={styles.field}>
                <span>Event date *</span>
                <input type="date" name="date" value={form.date} onChange={updateField}
                  className={errors.date ? styles.inputError : ''} />
                {errors.date && <small className={styles.error}>{errors.date}</small>}
              </label>

              <div className={styles.field}>
                <span>Event image</span>
                {form.image ? (
                  <div className={styles.imagePreview}>
                    <img src={form.image} alt="Selected event" />
                    <button type="button" onClick={removeImage} className={styles.removeImage}>Remove</button>
                  </div>
                ) : (
                  <label className={styles.dropzone}>
                    <FaImage aria-hidden="true" />
                    <span>Choose an image (max 1.5 MB)</span>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImage} />
                  </label>
                )}
                {errors.image && <small className={styles.error}>{errors.image}</small>}
              </div>

              <label className={styles.field}>
                <span>Event place *</span>
                <input name="place" value={form.place} onChange={updateField} placeholder="Gurdwara, hall or address"
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
                <textarea name="details" rows={5} value={form.details} onChange={updateField}
                  placeholder="Timings, schedule, who to contact, what to bring"
                  className={errors.details ? styles.inputError : ''} />
                {errors.details && <small className={styles.error}>{errors.details}</small>}
              </label>

              <button type="submit" className={styles.primaryButton} disabled={isSaving}>
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
