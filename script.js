// ---------- CONFIG ----------
// Replace this with your OpenWeatherMap API key.
const API_KEY = 'bf53fa73250d5bdddff1854ff0d167c1';
// ----------------------------

// DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locBtn = document.getElementById('locBtn');
const unitBtn = document.getElementById('unitBtn');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const placeEl = document.getElementById('place');
const iconEl = document.getElementById('weatherIcon');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const feelsEl = document.getElementById('feels');
const pressureEl = document.getElementById('pressure');
const updatedEl = document.getElementById('updated');
const forecastList = document.getElementById('forecastList');
const weatherCard = document.getElementById('weatherCard');

let units = 'metric'; // 'metric' = Celsius, 'imperial' = Fahrenheit

unitBtn.addEventListener('click', () => {
  units = units === 'metric' ? 'imperial' : 'metric';
  unitBtn.textContent = units === 'metric' ? '°C' : '°F';
  if (cityInput.value.trim()) fetchByCity(cityInput.value.trim());
});

searchBtn.addEventListener('click', () => {
  const q = cityInput.value.trim();
  if (!q) return alert('Type a city name first');
  fetchByCity(q);
});

cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

locBtn.addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Geolocation not supported by your browser');
  weatherCard.classList.add('loading');
  navigator.geolocation.getCurrentPosition((pos) => {
    fetchByCoords(pos.coords.latitude, pos.coords.longitude);
  }, (err) => {
    weatherCard.classList.remove('loading');
    alert('Unable to get location: ' + err.message);
  }, {timeout:10000});
});

function setLoading(isLoading){
  if(isLoading) weatherCard.classList.add('loading');
  else weatherCard.classList.remove('loading');
}

function fmtDate(ts){
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

function showError(msg){
  alert(msg);
}

async function fetchByCity(city){
  if (!API_KEY || API_KEY.includes('YOUR_')) return showError('Please add your OpenWeatherMap API key in the script (API_KEY)');
  setLoading(true);
  try{
    const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`);
    if(!resp.ok) throw new Error('City not found or API error');
    const data = await resp.json();
    renderWeather(data);
    fetchForecastByCoords(data.coord.lat, data.coord.lon);
  }catch(e){
    showError(e.message);
  }finally{setLoading(false)}
}

async function fetchByCoords(lat, lon){
  if (!API_KEY || API_KEY.includes('YOUR_')) return showError('Please add your OpenWeatherMap API key in the script (API_KEY)');
  setLoading(true);
  try{
    const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`);
    if(!resp.ok) throw new Error('Location not found or API error');
    const data = await resp.json();
    renderWeather(data);
    fetchForecastByCoords(lat,lon);
  }catch(e){
    showError(e.message);
  }finally{setLoading(false)}
}

async function fetchForecastByCoords(lat, lon){
  try{
    const resp = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`);
    if(!resp.ok) throw new Error('Forecast API error');
    const data = await resp.json();
    renderForecast(data);
  }catch(e){
    forecastList.innerHTML = '<div class="muted">Forecast unavailable</div>';
  }
}

function getIconEmoji(iconCode){
  if(!iconCode) return '❓';
  if(iconCode.startsWith('01')) return '☀️';
  if(iconCode.startsWith('02')) return '⛅';
  if(iconCode.startsWith('03') || iconCode.startsWith('04')) return '☁️';
  if(iconCode.startsWith('09') || iconCode.startsWith('10')) return '🌧️';
  if(iconCode.startsWith('11')) return '⛈️';
  if(iconCode.startsWith('13')) return '❄️';
  if(iconCode.startsWith('50')) return '🌫️';
  return '🌡️';
}

function renderWeather(data){
  const t = Math.round(data.main.temp);
  const place = `${data.name}, ${data.sys && data.sys.country ? data.sys.country : ''}`;
  const desc = data.weather && data.weather[0] ? capitalize(data.weather[0].description) : '—';
  const icon = data.weather && data.weather[0] ? data.weather[0].icon : '';

  tempEl.textContent = t + (units === 'metric' ? '°C' : '°F');
  descEl.textContent = desc;
  placeEl.textContent = place;
  placeEl.dataset.lat = data.coord.lat;
  placeEl.dataset.lon = data.coord.lon;

  iconEl.textContent = getIconEmoji(icon);

  humidityEl.textContent = `Humidity: ${data.main.humidity}%`;
  windEl.textContent = `Wind: ${data.wind.speed} ${units === 'metric' ? 'm/s' : 'mph'}`;
  feelsEl.textContent = `Feels like: ${Math.round(data.main.feels_like)} ${units === 'metric' ? '°C' : '°F'}`;
  pressureEl.textContent = `Pressure: ${data.main.pressure} hPa`;
  updatedEl.textContent = `Last updated: ${fmtDate(data.dt)}`;
}

function renderForecast(forecastData){
  forecastList.innerHTML = '';
  if(!forecastData || !forecastData.list) return;
  const n = Math.min(8, forecastData.list.length);
  for(let i=0;i<n;i++){
    const it = forecastData.list[i];
    const time = new Date(it.dt * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    const t = Math.round(it.main.temp);
    const icon = it.weather && it.weather[0] ? it.weather[0].icon : '';
    const emoji = getIconEmoji(icon);
    const div = document.createElement('div');
    div.className = 'forecast-item';
    div.innerHTML = `<div style="font-weight:600">${time}</div><div style="font-size:22px">${emoji}</div><div style="font-weight:600">${t}°</div><div style="font-size:12px;color:var(--muted)">${capitalize(it.weather[0].description)}</div>`;
    forecastList.appendChild(div);
  }
}

function capitalize(s){
  if(!s) return s; return s.split(' ').map(p => p.charAt(0).toUpperCase()+p.slice(1)).join(' ');
}

// Prefill example and auto-search
cityInput.value = 'Karachi';
fetchByCity(cityInput.value.trim());
