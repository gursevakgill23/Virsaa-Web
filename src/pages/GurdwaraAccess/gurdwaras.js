/**
 * pages/GurdwaraAccess/gurdwaras.js
 * -----------------------------------------------------------------------------
 * The Gurdwaras the finder knows about, shared by the finder
 * (GurdwaraAccess.jsx), the directions page (GurdwaraLocate) and the history
 * page (GurdwaraHistory), so an id in a link always means the same Gurdwara.
 *
 * Each Gurdwara: id, name, city (sent with the name when its history is
 * looked up), address, coordinates [lat, lng], website, phone, services.
 * Their history is not stored here: it is loaded live from Wikipedia through
 * the server (api/gurdwaraApi.js, hooks/useGurdwaraHistory.js), so it comes
 * from a public, sourced article and stays current.
 * -----------------------------------------------------------------------------
 */
export const GURDWARAS = [
  {
    id: 1,
    name: 'Gurdwara Sikh Sangat Brampton',
    city: 'Brampton',
    address: '32 Regan Rd, Brampton, ON, Canada',
    coordinates: [43.7156, -79.7607],
    website: 'https://www.gssbrampton.com',
    phone: '(905) 495-1200',
    services: ['Langar', 'Accommodation', 'Religious Classes'],
  },
  {
    id: 2,
    name: 'Gurudwara Nanaksar-Brampton',
    city: 'Brampton',
    address: '64 Timberlane Dr, Brampton, ON, Canada',
    coordinates: [43.7089, -79.7631],
    website: 'https://www.nanaksar.com',
    phone: '(905) 452-1313',
    services: ['Langar', 'Medical Camps', 'Library'],
  },
  {
    id: 3,
    name: 'Sri Guru Nanak Sikh Centre Brampton',
    city: 'Brampton',
    address: '99 Glidden Rd, Brampton, ON, Canada',
    coordinates: [43.7023, -79.7665],
    website: 'https://www.sgnsc.com',
    phone: '(905) 457-5757',
    services: ['Langar', 'Religious Classes', 'Youth Programs'],
  },
  {
    id: 4,
    name: 'Gurdwara Sahib Malton',
    city: 'Mississauga',
    address: '7085 Airport Rd, Mississauga, ON, Canada',
    coordinates: [43.6921, -79.6428],
    website: 'https://www.gsmalton.com',
    phone: '(905) 677-1111',
    services: ['Langar', 'Senior Programs', 'Community Services'],
  },
  {
    id: 5,
    name: 'Ontario Khalsa Darbar',
    city: 'Mississauga',
    address: '7080 Dixie Rd, Mississauga, ON, Canada',
    coordinates: [43.6845, -79.6553],
    website: 'https://www.ontariokhalsadarbar.com',
    phone: '(905) 670-1771',
    services: ['Langar', 'Accommodation', 'Library', 'Medical Camps'],
  },
];

/** The Gurdwara with this id (a number, or the string from a URL), or null. */
export const findGurdwara = (id) => GURDWARAS.find((g) => String(g.id) === String(id)) || null;
