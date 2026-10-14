(function () {
  const STORAGE_KEY = 'hfcDatabase';

  const defaultDatabase = {
    users: {}
  };

  const safeParse = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn('No se pudo leer la base de datos local.', error);
      return fallback;
    }
  };

  const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

  const saveSession = (session) => {
    localStorage.setItem('hfcSession', JSON.stringify(session));
  };

  const getDatabase = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const database = safeParse(stored, null);

    if (!database || !database.users) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDatabase));
      return defaultDatabase;
    }

    return database;
  };

  const saveDatabase = (database) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  };

  const getSession = () => {
    const storedSession = localStorage.getItem('hfcSession');
    return safeParse(storedSession, null);
  };

  const getCurrentUserEmail = () => {
    const session = getSession();
    return session && session.loggedIn ? session.email : null;
  };

  const createUserRecord = ({ name, email, password }) => ({
    profile: {
      name: name || 'Usuario',
      email: normalizeEmail(email),
      avatar: '👤',
      plan: 'Cliente HFC',
      phone: '+503 7000-0000',
      lastUpdate: new Date().toISOString()
    },
    auth: {
      password: String(password || '').trim()
    },
    reservations: [
      {
        id: 'R-1001',
        type: 'vuelo',
        title: 'San Salvador → Nueva York',
        date: '2026-10-20',
        status: 'Confirmado',
        total: '$420.00'
      },
      {
        id: 'R-1002',
        type: 'hotel',
        title: 'Hotel InterContinental',
        date: '2026-10-27',
        status: 'Pendiente',
        total: '$310.00'
      }
    ],
    savedHotels: [
      {
        id: 'H-01',
        name: 'Casa Los Pinos',
        city: 'La Libertad',
        rating: 4.8,
        price: '$120 / noche'
      },
      {
        id: 'H-02',
        name: 'InterContinental San Salvador',
        city: 'San Salvador',
        rating: 4.9,
        price: '$180 / noche'
      }
    ],
    favoriteFlights: [
      { id: 'F-01', route: 'SV → MIA', price: '$350', airline: 'Avianca', date: '2026-11-12' },
      { id: 'F-02', route: 'SAL → NYC', price: '$420', airline: 'United', date: '2026-11-18' }
    ],
    trips: [
      {
        id: 'T-01',
        title: 'Escapada a Costa del Sol',
        date: '2026-11-05',
        status: 'Por confirmar',
        type: 'Tour'
      }
    ],
    addresses: [
      {
        id: 'A-01',
        label: 'Casa principal',
        text: 'Colonia Escalón, San Salvador'
      }
    ],
    payments: [
      { id: 'P-01', method: 'Visa •••• 7423', type: 'Tarjeta' },
      { id: 'P-02', method: 'PayPal', type: 'Digital' }
    ],
    support: [
      { id: 'S-01', subject: 'Cambio de reserva', status: 'Respondido' }
    ]
  });

  const ensureUser = (email, name = 'Usuario', password = '') => {
    const database = getDatabase();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return null;
    }

    if (!database.users[normalizedEmail]) {
      database.users[normalizedEmail] = createUserRecord({
        name: name || 'Usuario',
        email: normalizedEmail,
        password
      });
      saveDatabase(database);
    }

    const user = database.users[normalizedEmail];

    if (name && user.profile.name !== name) {
      user.profile.name = name;
      saveDatabase(database);
    }

    if (password) {
      user.auth = { ...(user.auth || {}), password: String(password).trim() };
      saveDatabase(database);
    }

    return user;
  };

  const registerUser = ({ name, email, password }) => {
    const normalizedEmail = normalizeEmail(email);
    const trimmedPassword = String(password || '').trim();
    const trimmedName = String(name || '').trim();

    if (!trimmedName || !normalizedEmail || !trimmedPassword) {
      return { ok: false, message: 'Completa todos los campos.' };
    }

    const database = getDatabase();
    if (database.users[normalizedEmail]) {
      return { ok: false, message: 'Ya existe una cuenta con ese correo.' };
    }

    const user = createUserRecord({
      name: trimmedName,
      email: normalizedEmail,
      password: trimmedPassword
    });

    database.users[normalizedEmail] = user;
    saveDatabase(database);
    saveSession({ loggedIn: true, name: trimmedName, email: normalizedEmail });

    return { ok: true, user };
  };

  const loginUser = (email, password) => {
    const normalizedEmail = normalizeEmail(email);
    const trimmedPassword = String(password || '').trim();

    if (!normalizedEmail || !trimmedPassword) {
      return { ok: false, message: 'Correo y contraseña requeridos.' };
    }

    const database = getDatabase();
    const user = database.users[normalizedEmail];

    if (!user) {
      return { ok: false, message: 'No existe una cuenta con ese correo.' };
    }

    const storedPassword = user.auth && user.auth.password ? String(user.auth.password) : '';
    if (storedPassword !== trimmedPassword) {
      return { ok: false, message: 'La contraseña es incorrecta.' };
    }

    saveSession({
      loggedIn: true,
      name: user.profile.name,
      email: normalizedEmail
    });

    return { ok: true, user };
  };

  const getCurrentUserData = () => {
    const email = getCurrentUserEmail();
    if (!email) return null;
    return ensureUser(email, getSession()?.name || 'Usuario');
  };

  const addReservation = (reservation) => {
    const database = getDatabase();
    const email = getCurrentUserEmail();
    if (!email || !database.users[email.toLowerCase()]) return null;

    const userData = database.users[email.toLowerCase()];
    userData.reservations.push({ ...reservation, id: reservation.id || `R-${Date.now()}` });
    saveDatabase(database);
    return userData.reservations[userData.reservations.length - 1];
  };

  const addSavedHotel = (hotel) => {
    const database = getDatabase();
    const email = getCurrentUserEmail();
    if (!email || !database.users[email.toLowerCase()]) return null;

    const userData = database.users[email.toLowerCase()];
    userData.savedHotels.push({ ...hotel, id: hotel.id || `H-${Date.now()}` });
    saveDatabase(database);
    return userData.savedHotels[userData.savedHotels.length - 1];
  };

  const addFavoriteFlight = (flight) => {
    const database = getDatabase();
    const email = getCurrentUserEmail();
    if (!email || !database.users[email.toLowerCase()]) return null;

    const userData = database.users[email.toLowerCase()];
    userData.favoriteFlights.push({ ...flight, id: flight.id || `F-${Date.now()}` });
    saveDatabase(database);
    return userData.favoriteFlights[userData.favoriteFlights.length - 1];
  };

  const addTrip = (trip) => {
    const database = getDatabase();
    const email = getCurrentUserEmail();
    if (!email || !database.users[email.toLowerCase()]) return null;

    const userData = database.users[email.toLowerCase()];
    userData.trips.push({ ...trip, id: trip.id || `T-${Date.now()}` });
    saveDatabase(database);
    return userData.trips[userData.trips.length - 1];
  };

  const updateProfile = (fields) => {
    const database = getDatabase();
    const email = getCurrentUserEmail();
    if (!email || !database.users[email.toLowerCase()]) return null;

    const userData = database.users[email.toLowerCase()];
    userData.profile = {
      ...userData.profile,
      ...fields,
      lastUpdate: new Date().toISOString()
    };

    saveDatabase(database);
    return userData.profile;
  };

  const destroySession = () => {
    localStorage.removeItem('hfcSession');
  };

  window.HFCDatabase = {
    STORAGE_KEY,
    normalizeEmail,
    saveSession,
    getDatabase,
    saveDatabase,
    getSession,
    getCurrentUserEmail,
    ensureUser,
    registerUser,
    loginUser,
    getCurrentUserData,
    addReservation,
    addSavedHotel,
    addFavoriteFlight,
    addTrip,
    updateProfile,
    destroySession
  };
})();
