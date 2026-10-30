/**
 * components/GoogleMap/GoogleMap.jsx
 * -----------------------------------------------------------------------------
 * A Google map (api/googleMaps.js) for the Gurdwara pages, in the site's
 * colours: maroon pins for Gurdwaras, a dot for the place searched (or the
 * visitor), and an optional dashed line between two places. Follows the
 * site's dark mode. If Google can't be reached, it says so and links to
 * Google Maps instead.
 *
 *   <GoogleMap
 *     ref={api}                   api.current.focus(id): pan to a pin and open its popup
 *     center={{ lat, lng }} zoom={12}            where it opens
 *     markers={[{ id, position: { lat, lng }, title, kind: 'gurdwara' | 'origin', selected, color }]}
 *     fit={[{ lat, lng }, ...]}   zooms to show these whenever they change
 *     maxZoom={15}                no closer than this when fitting
 *     singleZoom={15}             the zoom when `fit` is just one place
 *     line={{ from, to, color }}  a dashed straight line
 *     onMarkerClick={(id) => …}
 *     popup={(id) => HTMLElement | null}         what a pin's popup shows
 *     dark={isDarkMode}
 *     label="Map of …"            for screen readers
 *     fallbackUrl="https://www.google.com/maps/…"
 *   />
 * Keep `markers` and `fit` the same arrays between renders (useMemo).
 * -----------------------------------------------------------------------------
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { loadGoogleMaps, onKeyRejected, MAP_ID } from '../../api/googleMaps';
import styles from './GoogleMap.module.css';

// A map pin (fixed markup, no page text in it)
const PIN = '<svg viewBox="0 0 28 38" aria-hidden="true" focusable="false">'
  + '<path d="M14 1C6.8 1 1 6.7 1 13.8 1 23.4 14 37 14 37s13-13.6 13-23.2C27 6.7 21.2 1 14 1z"/>'
  + '<circle cx="14" cy="13.6" r="5"/></svg>';

const markerContent = (kind, color) => {
  const el = document.createElement('div');
  if (kind === 'origin') {
    el.className = styles.origin;
    if (color) el.style.setProperty('--dot', color);
  } else {
    el.className = styles.pin;
    el.innerHTML = PIN;
  }
  return el;
};

const GoogleMap = forwardRef(({
  center, zoom = 12, markers = [], fit = null, maxZoom = 15, singleZoom = maxZoom, line = null,
  onMarkerClick, popup, dark = false, label = 'Map', fallbackUrl = '', className = '',
}, ref) => {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const libsRef = useRef(null);
  const pinsRef = useRef(new Map()); // id -> { marker, content, kind }
  const infoRef = useRef(null);
  const latest = useRef({});
  latest.current = { center, zoom, onMarkerClick, popup };
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'failed'
  const scheme = dark ? 'dark' : 'light';

  // ---------------------------------------------------------------- the map (made again when the theme changes)
  useEffect(() => {
    let cancelled = false;
    const pins = pinsRef.current;
    setStatus('loading');
    const stopListening = onKeyRejected(() => {
      if (!cancelled) setStatus('failed');
    });
    loadGoogleMaps()
      .then((maps) => Promise.all([maps.importLibrary('maps'), maps.importLibrary('marker'), maps.importLibrary('core')]))
      .then(([mapsLib, markerLib, core]) => {
        if (cancelled || !boxRef.current) return;
        const colours = core.ColorScheme || { DARK: 'DARK', LIGHT: 'LIGHT' };
        mapRef.current = new mapsLib.Map(boxRef.current, {
          center: latest.current.center,
          zoom: latest.current.zoom,
          mapId: MAP_ID,
          colorScheme: dark ? colours.DARK : colours.LIGHT,
          gestureHandling: 'cooperative', // two fingers on phones, Ctrl + scroll on computers: the page still scrolls
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          cameraControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });
        libsRef.current = { ...mapsLib, ...markerLib, LatLngBounds: core.LatLngBounds };
        infoRef.current = new mapsLib.InfoWindow();
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('failed');
      });
    return () => {
      cancelled = true;
      stopListening();
      pins.forEach(({ marker }) => { marker.map = null; });
      pins.clear();
      infoRef.current?.close();
      infoRef.current = null;
      mapRef.current = null;
    };
    // `dark` is what `scheme` says; centre and zoom are only where a new map opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheme]);

  // A pin was clicked (or focused from outside): tell the page, and open its popup
  const openPin = useCallback((id, { pan = false } = {}) => {
    const map = mapRef.current;
    const pin = pinsRef.current.get(id);
    if (!map || !pin) return;
    if (pan) {
      map.panTo(pin.marker.position);
      if ((map.getZoom() || 0) < 15) map.setZoom(15);
    }
    latest.current.onMarkerClick?.(id);
    const content = latest.current.popup?.(id);
    if (content && infoRef.current) {
      infoRef.current.setContent(content);
      infoRef.current.open({ map, anchor: pin.marker });
    }
  }, []);

  useImperativeHandle(ref, () => ({ focus: (id) => openPin(id, { pan: true }) }), [openPin]);

  // ---------------------------------------------------------------- pins
  useEffect(() => {
    if (status !== 'ready') return;
    const map = mapRef.current;
    const { AdvancedMarkerElement } = libsRef.current;
    const pins = pinsRef.current;
    const wanted = new Set(markers.map((m) => m.id));
    pins.forEach((pin, id) => {
      if (!wanted.has(id)) {
        pin.marker.map = null;
        pins.delete(id);
      }
    });
    markers.forEach((m, index) => {
      let pin = pins.get(m.id);
      if (!pin || pin.kind !== m.kind) {
        if (pin) pin.marker.map = null;
        const content = markerContent(m.kind, m.color);
        const clickable = m.kind === 'gurdwara';
        const marker = new AdvancedMarkerElement({ map, position: m.position, title: m.title || '', content, gmpClickable: clickable });
        if (clickable) marker.addEventListener('gmp-click', () => openPin(m.id));
        pin = { marker, content, kind: m.kind };
        pins.set(m.id, pin);
      }
      pin.marker.position = m.position;
      pin.marker.title = m.title || '';
      pin.marker.zIndex = m.selected ? 2000 : (m.kind === 'origin' ? 1500 : markers.length - index);
      pin.content.classList.toggle(styles.selected, Boolean(m.selected));
      if (m.kind === 'origin' && m.color) pin.content.style.setProperty('--dot', m.color);
    });
  }, [status, markers, openPin]);

  // ---------------------------------------------------------------- the dashed line
  const lineKey = line?.from && line?.to
    ? `${line.from.lat},${line.from.lng}|${line.to.lat},${line.to.lng}|${line.color || ''}` : '';
  useEffect(() => {
    if (status !== 'ready' || !lineKey) return undefined;
    const path = new libsRef.current.Polyline({
      map: mapRef.current,
      path: [line.from, line.to],
      geodesic: true,
      clickable: false,
      strokeOpacity: 0,
      icons: [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: line.color || '#65041d', strokeWeight: 4, scale: 3 },
        offset: '0',
        repeat: '16px',
      }],
    });
    return () => path.setMap(null);
    // lineKey says when the line really changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, lineKey]);

  // ---------------------------------------------------------------- fit the places in view
  const fitKey = Array.isArray(fit) ? fit.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(';') : '';
  useEffect(() => {
    const map = mapRef.current;
    if (status !== 'ready' || !map || !fitKey) return undefined;
    if (fit.length === 1) {
      map.setCenter(fit[0]);
      map.setZoom(singleZoom);
      return undefined;
    }
    const bounds = new libsRef.current.LatLngBounds();
    fit.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 56);
    const listener = map.addListener('idle', () => {
      listener.remove();
      if (map.getZoom() > maxZoom) map.setZoom(maxZoom);
    });
    return () => listener.remove();
    // fitKey says when the places really changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, fitKey, maxZoom, singleZoom]);

  return (
    <div className={`${styles.wrap} ${className}`}>
      <div key={scheme} ref={boxRef} className={styles.map} role="region" aria-label={label} />
      {status === 'loading' && <div className={styles.loading} aria-hidden="true" />}
      {status === 'failed' && (
        <div className={styles.failed} role="status">
          <p>The map isn’t available right now.</p>
          {fallbackUrl && (
            <a href={fallbackUrl} target="_blank" rel="noopener noreferrer">Open Google Maps</a>
          )}
        </div>
      )}
    </div>
  );
});

GoogleMap.displayName = 'GoogleMap';

export default GoogleMap;
