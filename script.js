const adminAccount = {
  name: 'leon fietz',
  password: 'kJ*yRhn&nKV3mo%Ge&'
};

const form = document.querySelector('#access-form');
const nameInput = document.querySelector('#full-name');
const passwordInput = document.querySelector('#password');
const nameError = document.querySelector('#name-error');
const passwordError = document.querySelector('#password-error');
const formStatus = document.querySelector('#form-status');
const togglePassword = document.querySelector('#toggle-password');
const generatePassword = document.querySelector('#generate-password');
const registerForm = document.querySelector('#register-form');
const dashboard = document.querySelector('#dashboard');
const adminTools = document.querySelector('#admin-tools');
const accountList = document.querySelector('#account-list');
const weatherGrid = document.querySelector('#weather-grid');
const weatherStatus = document.querySelector('#weather-status');
const weatherMood = document.querySelector('#weather-mood');
const locationInput = document.querySelector('#location-input');
const adminCreateForm = document.querySelector('#admin-create-form');
const comparisonPanel = document.querySelector('#comparison-panel');
const comparisonTitle = document.querySelector('#comparison-title');
const comparisonStatus = document.querySelector('#comparison-status');
const comparisonGrid = document.querySelector('#comparison-grid');
const historyChart = document.querySelector('#history-chart');
const storedUsersKey = 'access-point-users';
const comparisonCities = [
  { name: 'Berlin', country: 'DE', latitude: 52.52, longitude: 13.405 },
  { name: 'Paris', country: 'FR', latitude: 48.8566, longitude: 2.3522 },
  { name: 'London', country: 'GB', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Rom', country: 'IT', latitude: 41.9028, longitude: 12.4964 },
  { name: 'New York', country: 'US', latitude: 40.7128, longitude: -74.006 }
];

const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';

function createPassword(length = 14) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => characters[value % characters.length]).join('');
}

function getUsers() {
  return JSON.parse(localStorage.getItem(storedUsersKey) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(storedUsersKey, JSON.stringify(users));
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[character]));
}

function showDashboard(user, isAdmin) {
  document.querySelector('#current-user').textContent = user;
  document.querySelector('#role-label').textContent = isAdmin ? 'Admin-Modus aktiv · Vollzugriff' : 'Gastmodus · Wetterdaten nur ansehen';
  document.querySelector('.page-shell').classList.add('is-hidden');
  dashboard.classList.remove('is-hidden');
  adminTools.classList.toggle('is-hidden', !isAdmin);
  if (isAdmin) renderAccounts();
  loadWeatherFromIp();
}

function setWeatherAtmosphere(type) {
  document.body.classList.remove('weather-sunny', 'weather-cloudy', 'weather-rain', 'weather-snow', 'weather-storm');
  document.body.classList.add(`weather-${type}`);
}

function renderAccounts() {
  const users = getUsers();
  const rows = [
    `<div class="account-row"><span><strong>Leon Fietz</strong><small>Admin · Vollzugriff</small></span><span class="account-state">Systemkonto</span></div>`,
    ...users.map((user, index) => `<div class="account-row"><span><strong>${escapeHtml(user.name)}</strong><small>${user.role === 'admin' ? 'Admin · Vollzugriff' : 'Benutzer · Nur ansehen'}</small></span><button class="delete-account" type="button" data-index="${index}">Löschen</button></div>`)
  ];
  accountList.innerHTML = rows.join('');
  accountList.querySelectorAll('.delete-account').forEach((button) => {
    button.addEventListener('click', () => {
      const usersToKeep = getUsers();
      usersToKeep.splice(Number(button.dataset.index), 1);
      saveUsers(usersToKeep);
      renderAccounts();
    });
  });
}

async function loadWeather(city) {
  weatherStatus.textContent = `${city} wird geladen ...`;
  try {
    const geocoding = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`);
    const locationData = await geocoding.json();
    if (!locationData.results?.length) throw new Error('Ort nicht gefunden');
    const place = locationData.results[0];
    const weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code,cloud_cover,surface_pressure,visibility,uv_index&daily=temperature_2m_max,apparent_temperature_max,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max,cloud_cover_mean,visibility_mean,uv_index_max,weather_code&past_days=6&forecast_days=1&timezone=auto`);
    const weatherData = await weather.json();
    const current = weatherData.current;
    const mood = getWeatherMood(current.weather_code);
    setWeatherAtmosphere(mood.type);
    weatherMood.innerHTML = `<span class="mood-icon" aria-hidden="true">${mood.icon}</span><span><strong>${mood.title}</strong><small>${mood.copy}</small></span>`;
    const labels = ['Temperatur', 'Gefühlt', 'Niederschlag', 'Luftfeuchte', 'Wind', 'Bewölkung', 'Sichtweite', 'UV-Index'];
    const metricKeys = ['temperature', 'apparent', 'precipitation', 'humidity', 'wind', 'clouds', 'visibility', 'uv'];
    const values = [
      `${Math.round(current.temperature_2m)} °C`,
      `${Math.round(current.apparent_temperature)} °C`,
      `${Number(current.precipitation).toFixed(1)} mm`,
      `${current.relative_humidity_2m} %`,
      `${Math.round(current.wind_speed_10m)} km/h`,
      `${current.cloud_cover} %`,
      `${(current.visibility / 1000).toFixed(1)} km`,
      `${Number(current.uv_index).toFixed(1)}`
    ];
    const icons = ['☀', '◌', '☂', '◌', '↝', '☁', '◉', '✦'];
    weatherGrid.innerHTML = values.map((value, index) => `<button class="weather-card" type="button" data-metric="${metricKeys[index]}" data-label="${labels[index]}"><span class="weather-icon">${icons[index]}</span><span class="weather-label">${labels[index]}</span><strong>${value}</strong>${renderMiniChart(getDailyMetric(weatherData.daily, metricKeys[index]), metricKeys[index])}<span class="card-hint">Vergleichen &#8599;</span></button>`).join('');
    weatherGrid.querySelectorAll('.weather-card').forEach((card) => card.addEventListener('click', () => openComparison(card.dataset.metric, card.dataset.label)));
    weatherStatus.textContent = `${place.name}, ${place.country} · ${mood.title} · aktualisiert gerade eben · öffentliche Open-Meteo-Daten`;
  } catch (error) {
    weatherStatus.textContent = 'Wetterdaten konnten gerade nicht geladen werden. Bitte prüfe den Ort oder die Verbindung.';
    weatherGrid.innerHTML = '';
  }
}

function renderMiniChart(values, metric) {
  const finiteValues = values.map(Number).filter(Number.isFinite);
  const minimum = Math.min(...finiteValues);
  const maximum = Math.max(...finiteValues);
  const range = maximum - minimum || 1;
  const bars = finiteValues.map((value) => {
    const height = Math.max(12, ((value - minimum) / range) * 82 + 8);
    return `<span style="height:${height}%" title="${formatChartValue(value, metric)}"></span>`;
  }).join('');
  return `<span class="mini-chart" aria-label="Verlauf der letzten sieben Tage">${bars}</span>`;
}

async function openComparison(metric, label) {
  comparisonPanel.classList.remove('is-hidden');
  comparisonTitle.textContent = `${label} im Vergleich`;
  comparisonStatus.textContent = 'Daten für Berlin, Paris, London, Rom und New York werden geladen ...';
  historyChart.innerHTML = '';
  comparisonGrid.innerHTML = '';
  try {
    const results = await Promise.all(comparisonCities.map(async (city) => {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,apparent_temperature,precipitation,relative_humidity_2m,wind_speed_10m,cloud_cover,visibility,uv_index&daily=temperature_2m_max,apparent_temperature_max,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max,cloud_cover_mean,visibility_mean,uv_index_max&past_days=6&forecast_days=1&timezone=auto`);
      const data = await response.json();
      return { ...city, value: getMetricValue(data.current, metric), history: getDailyMetric(data.daily, metric), historyDates: data.daily.time };
    }));
    renderHistoryChart(results, metric, label);
    comparisonGrid.innerHTML = results.map((city) => `<article class="comparison-card"><span>${city.name}, ${city.country}</span><strong>${city.value}</strong></article>`).join('');
    comparisonStatus.textContent = 'Aktuelle öffentliche Open-Meteo-Daten · Verlauf der letzten 7 Tage und heutiger Vergleich';
  } catch (error) {
    comparisonStatus.textContent = 'Der Städtevergleich konnte gerade nicht geladen werden.';
  }
}

function getDailyMetric(daily, metric) {
  const series = {
    temperature: daily.temperature_2m_max,
    apparent: daily.apparent_temperature_max,
    precipitation: daily.precipitation_sum,
    humidity: daily.relative_humidity_2m_mean,
    wind: daily.wind_speed_10m_max,
    clouds: daily.cloud_cover_mean,
    visibility: daily.visibility_mean.map((value) => value / 1000),
    uv: daily.uv_index_max
  };
  return series[metric];
}

function renderHistoryChart(cities, metric, label) {
  const days = cities[0].history.length;
  const allValues = cities.flatMap((city) => city.history);
  const minimum = Math.min(...allValues);
  const maximum = Math.max(...allValues);
  const range = maximum - minimum || 1;
  const colors = ['#18252b', '#ef826d', '#63c9a0', '#6f929d', '#d2a33e'];
  const legend = cities.map((city, index) => `<span><i style="background:${colors[index]}"></i>${city.name}</span>`).join('');
  const groups = Array.from({ length: days }, (_, dayIndex) => {
    const date = new Date(`${cities[0].historyDates[dayIndex]}T12:00:00`);
    const dateLabel = date.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '');
    const bars = cities.map((city, cityIndex) => {
      const value = city.history[dayIndex];
      const height = Math.max(8, ((value - minimum) / range) * 76 + 8);
      return `<span class="history-bar" style="height:${height}%;background:${colors[cityIndex]}" title="${city.name}: ${formatChartValue(value, metric)}"></span>`;
    }).join('');
    return `<div class="history-group"><div class="history-bars">${bars}</div><small>${dateLabel}</small></div>`;
  }).join('');
  historyChart.innerHTML = `<div class="chart-topline"><strong>Vergangene ${label}-Werte</strong><span>7 Tage</span></div><div class="chart-legend">${legend}</div><div class="history-plot">${groups}</div>`;
}

function formatChartValue(value, metric) {
  if (metric === 'precipitation') return `${value.toFixed(1)} mm`;
  if (metric === 'humidity' || metric === 'clouds') return `${Math.round(value)} %`;
  if (metric === 'wind') return `${Math.round(value)} km/h`;
  if (metric === 'visibility') return `${value.toFixed(1)} km`;
  if (metric === 'uv') return value.toFixed(1);
  return `${Math.round(value)} °C`;
}

function getMetricValue(current, metric) {
  const values = {
    temperature: `${Math.round(current.temperature_2m)} °C`,
    apparent: `${Math.round(current.apparent_temperature)} °C`,
    precipitation: `${Number(current.precipitation).toFixed(1)} mm`,
    humidity: `${current.relative_humidity_2m} %`,
    wind: `${Math.round(current.wind_speed_10m)} km/h`,
    clouds: `${current.cloud_cover} %`,
    visibility: `${(current.visibility / 1000).toFixed(1)} km`,
    uv: `${Number(current.uv_index).toFixed(1)}`
  };
  return values[metric];
}

function getWeatherMood(code) {
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { type: 'snow', icon: '❄', title: 'Leise Schneeluft', copy: 'Warm einpacken, draußen wird es winterlich.' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { type: 'rain', icon: '☂', title: 'Regentag', copy: 'Die Seite wird etwas ruhiger und kühler.' };
  if ([95, 96, 99].includes(code)) return { type: 'storm', icon: 'ϟ', title: 'Gewitterstimmung', copy: 'Achte auf wechselhaftes Wetter.' };
  if ([2, 3, 45, 48].includes(code)) return { type: 'cloudy', icon: '☁', title: 'Wolkiger Himmel', copy: 'Eine gedämpfte, angenehme Atmosphäre.' };
  return { type: 'sunny', icon: '☀', title: 'Sonniger Tag', copy: 'Helles Wetter für einen guten Start.' };
}

async function loadWeatherFromIp() {
  weatherStatus.textContent = 'Deinen ungefähren IP-Standort wird ermittelt ...';
  try {
    const response = await fetch('https://ipwho.is/');
    const location = await response.json();
    if (!location.city) throw new Error('IP-Standort nicht verfügbar');
    locationInput.value = location.city;
    await loadWeather(location.city);
  } catch (error) {
    locationInput.value = 'Berlin';
    await loadWeather('Berlin');
    weatherStatus.textContent += ' IP-Standort nicht verfügbar, daher wird Berlin angezeigt.';
  }
}

function clearErrors() {
  nameError.textContent = '';
  passwordError.textContent = '';
  nameInput.closest('.input-wrap').classList.remove('has-error');
  passwordInput.closest('.input-wrap').classList.remove('has-error');
}

function validateForm() {
  clearErrors();
  formStatus.textContent = '';
  let isValid = true;

  if (!nameInput.value.trim()) {
    nameError.textContent = 'Bitte gib deinen vollständigen Namen ein.';
    nameInput.closest('.input-wrap').classList.add('has-error');
    isValid = false;
  }

  if (!passwordInput.value) {
    passwordError.textContent = 'Bitte gib ein Passwort ein oder erstelle eines.';
    passwordInput.closest('.input-wrap').classList.add('has-error');
    isValid = false;
  }

  return isValid;
}

togglePassword.addEventListener('click', () => {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  togglePassword.textContent = isHidden ? '\u25ce' : '\u{1F441}';
  togglePassword.setAttribute('aria-label', isHidden ? 'Passwort verbergen' : 'Passwort anzeigen');
  togglePassword.setAttribute('title', isHidden ? 'Passwort verbergen' : 'Passwort anzeigen');
});

generatePassword.addEventListener('click', () => {
  passwordInput.value = createPassword();
  passwordInput.type = 'text';
  togglePassword.textContent = '\u25ce';
  togglePassword.setAttribute('aria-label', 'Passwort verbergen');
  togglePassword.setAttribute('title', 'Passwort verbergen');
  passwordError.textContent = '';
  passwordInput.closest('.input-wrap').classList.remove('has-error');
  formStatus.textContent = 'Sicheres Passwort erstellt. Du kannst es direkt verwenden.';
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateForm()) return;

  const normalizedName = nameInput.value.trim().toLocaleLowerCase();
  if (normalizedName === adminAccount.name && passwordInput.value === adminAccount.password) {
    formStatus.textContent = 'Admin-Zugriff gewährt. Willkommen, Leon Fietz.';
    showDashboard('Leon Fietz', true);
    return;
  }

  const user = getUsers().find((item) => item.name.toLocaleLowerCase() === normalizedName && item.password === passwordInput.value);
  if (user) {
    formStatus.textContent = user.role === 'admin' ? 'Admin-Anmeldung erfolgreich.' : 'Anmeldung erfolgreich. Wetterdaten sind nur zur Ansicht verfügbar.';
    showDashboard(user.name, user.role === 'admin');
    return;
  }
  formStatus.textContent = 'Die Zugangsdaten sind nicht korrekt.';
});

[nameInput, passwordInput].forEach((input) => {
  input.addEventListener('input', () => {
    if (input.value.trim()) {
      input.closest('.input-wrap').classList.remove('has-error');
      if (input === nameInput) nameError.textContent = '';
      if (input === passwordInput) passwordError.textContent = '';
    }
  });
});

document.querySelector('#show-register').addEventListener('click', () => {
  form.classList.add('is-hidden');
  registerForm.classList.remove('is-hidden');
  document.querySelector('#form-title').textContent = 'Neues Konto anlegen';
  document.querySelector('.step-label').innerHTML = 'Schritt 01 <span>/ 02</span>';
});

document.querySelector('#show-login').addEventListener('click', () => {
  registerForm.classList.add('is-hidden');
  form.classList.remove('is-hidden');
  document.querySelector('#form-title').textContent = 'Identität bestätigen';
  document.querySelector('.step-label').innerHTML = 'Schritt 01 <span>/ 01</span>';
});

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const registerName = document.querySelector('#register-name');
  const registerPassword = document.querySelector('#register-password');
  const registerNameError = document.querySelector('#register-name-error');
  const registerPasswordError = document.querySelector('#register-password-error');
  const registerStatus = document.querySelector('#register-status');
  registerNameError.textContent = '';
  registerPasswordError.textContent = '';
  registerStatus.textContent = '';
  const normalizedName = registerName.value.trim().toLocaleLowerCase();
  if (!registerName.value.trim()) registerNameError.textContent = 'Bitte gib deinen vollständigen Namen ein.';
  if (registerPassword.value.length < 10) registerPasswordError.textContent = 'Das Passwort muss mindestens 10 Zeichen haben.';
  if (!registerName.value.trim() || registerPassword.value.length < 10) return;
  if (normalizedName === adminAccount.name || getUsers().some((user) => user.name.toLocaleLowerCase() === normalizedName)) {
    registerNameError.textContent = 'Für diesen Namen existiert bereits ein Konto.';
    return;
  }
  const users = getUsers();
  users.push({ name: registerName.value.trim(), password: registerPassword.value });
  saveUsers(users);
  registerStatus.textContent = 'Konto erstellt. Du kannst dich jetzt anmelden.';
  registerForm.reset();
});

document.querySelector('#logout').addEventListener('click', () => {
  dashboard.classList.add('is-hidden');
  document.querySelector('.page-shell').classList.remove('is-hidden');
  formStatus.textContent = 'Du wurdest abgemeldet.';
  passwordInput.value = '';
});

document.querySelector('#weather-search').addEventListener('click', () => loadWeather(locationInput.value.trim() || 'Berlin'));
document.querySelector('#close-comparison').addEventListener('click', () => comparisonPanel.classList.add('is-hidden'));

adminCreateForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const nameField = document.querySelector('#admin-user-name');
  const passwordField = document.querySelector('#admin-user-password');
  const roleField = document.querySelector('#admin-user-role');
  const status = document.querySelector('#admin-create-status');
  const normalizedName = nameField.value.trim().toLocaleLowerCase();
  status.textContent = '';
  if (!nameField.value.trim() || passwordField.value.length < 10) {
    status.textContent = 'Name und ein Passwort mit mindestens 10 Zeichen sind erforderlich.';
    return;
  }
  if (normalizedName === adminAccount.name || getUsers().some((user) => user.name.toLocaleLowerCase() === normalizedName)) {
    status.textContent = 'Für diesen Namen existiert bereits ein Konto.';
    return;
  }
  const users = getUsers();
  users.push({ name: nameField.value.trim(), password: passwordField.value, role: roleField.value });
  saveUsers(users);
  adminCreateForm.reset();
  status.textContent = roleField.value === 'admin' ? 'Admin-Konto erstellt und mit Vollzugriff gespeichert.' : 'Benutzerkonto erstellt und als Nur-ansehen-Konto gespeichert.';
  renderAccounts();
});

async function loadLoginAtmosphere() {
  try {
    const ipResponse = await fetch('https://ipwho.is/');
    const location = await ipResponse.json();
    if (!location.latitude || !location.longitude) throw new Error('Standort nicht verfügbar');
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=weather_code&timezone=auto`);
    const weather = await weatherResponse.json();
    setWeatherAtmosphere(getWeatherMood(weather.current.weather_code).type);
  } catch (error) {
    setWeatherAtmosphere('cloudy');
  }
}

loadLoginAtmosphere();
