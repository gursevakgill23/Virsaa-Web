/**
 * pages/GurdwaraAccess/mapIcons.js
 * -----------------------------------------------------------------------------
 * Leaflet's own marker pictures, from the leaflet package (bundled with the
 * site, so no copy is needed in public/images). Importing this file once sets
 * them as the default for every map marker:
 *
 *   import './mapIcons';
 *
 * Leaflet normally guesses the pictures' address from its CSS file, which
 * breaks after bundling, hence the explicit addresses here.
 * -----------------------------------------------------------------------------
 */
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
