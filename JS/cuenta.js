(function () {
  const sessionKey = 'hfcSession';
  const guestState = document.getElementById('guestState');
  const userState = document.getElementById('userState');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const logoutBtn = document.getElementById('logoutBtn');

  const getSession = () => {
    const raw = localStorage.getItem(sessionKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('No se pudo leer la sesión guardada.', error);
      return null;
    }
  };

  const session = getSession();

  if (!session || !session.loggedIn) {
    if (guestState) guestState.classList.remove('hidden');
    if (userState) userState.classList.add('hidden');
    return;
  }

  if (guestState) guestState.classList.add('hidden');
  if (userState) userState.classList.remove('hidden');

  const db = window.HFCDatabase;
  const userData = db ? db.getCurrentUserData() : null;
  const profile = userData && userData.profile ? userData.profile : { name: session.name || 'Usuario', email: session.email || 'usuario@hfcreservas.com' };

  if (userName) {
    userName.textContent = profile.name || 'Usuario';
  }

  if (userEmail) {
    userEmail.textContent = profile.email || 'usuario@hfcreservas.com';
  }

  const statusNodes = document.querySelectorAll('.status');
  const summary = userData ? {
    reservations: userData.reservations?.length || 0,
    hotels: userData.savedHotels?.length || 0,
    flights: userData.favoriteFlights?.length || 0,
    trips: userData.trips?.length || 0
  } : { reservations: 0, hotels: 0, flights: 0, trips: 0 };

  if (statusNodes.length >= 4) {
    statusNodes[0].textContent = `${summary.reservations} activas`;
    statusNodes[1].textContent = `${summary.hotels} favoritos`;
    statusNodes[2].textContent = `${summary.trips} por confirmar`;
    statusNodes[3].textContent = `${summary.flights} rutas`;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(sessionKey);
      if (db && db.destroySession) {
        db.destroySession();
      }
      window.location.href = 'Index.html';
    });
  }
})();
