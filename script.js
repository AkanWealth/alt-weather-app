// Grab references to all the DOM elements we'll need to update
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");

const errorMessageEl = document.getElementById("error-message");
const loadingMessageEl = document.getElementById("loading-message");

const currentWeatherSection = document.getElementById("current-weather");
const statsRowSection = document.getElementById("stats-row");
const forecastSection = document.getElementById("forecast-section");

const weatherIconEl = document.getElementById("weather-icon");
const cityNameEl = document.getElementById("city-name");
const temperatureEl = document.getElementById("temperature");
const descriptionEl = document.getElementById("description");

const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("wind-speed");
const uvIndexEl = document.getElementById("uv-index");

const forecastGridEl = document.getElementById("forecast-grid");

// Map of WMO weather codes to a human-readable description and an icon.
const WEATHER_CODE_MAP = {
  0: { description: "Clear sky", icon: "☀" },
  1: { description: "Partly cloudy", icon: "⛅" },
  2: { description: "Partly cloudy", icon: "⛅" },
  3: { description: "Partly cloudy", icon: "⛅" },
  45: { description: "Foggy", icon: "🌫" },
  48: { description: "Foggy", icon: "🌫" },
  51: { description: "Drizzle", icon: "🌦" },
  53: { description: "Drizzle", icon: "🌦" },
  55: { description: "Drizzle", icon: "🌦" },
  61: { description: "Rain", icon: "🌧" },
  63: { description: "Rain", icon: "🌧" },
  65: { description: "Rain", icon: "🌧" },
  71: { description: "Snow", icon: "❄" },
  73: { description: "Snow", icon: "❄" },
  75: { description: "Snow", icon: "❄" },
  80: { description: "Rain showers", icon: "🌦" },
  81: { description: "Rain showers", icon: "🌦" },
  82: { description: "Rain showers", icon: "🌦" },
  95: { description: "Thunderstorm", icon: "⛈" },
};

/**
 * Converts a WMO weather code into a { description, icon } object.
 * Falls back to a generic "Unknown" entry if the code isn't in our table.
 */
function getWeatherDescription(code) {
  return WEATHER_CODE_MAP[code] || { description: "Unknown", icon: "❔" };
}

/**
 * Looks up a city name using the Open-Meteo Geocoding API and returns
 * its name, country, latitude and longitude. Throws an error if no
 * matching city is found so the caller can show a message to the user.
 */
async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to reach the geocoding service.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`City "${city}" was not found. Check the spelling and try again.`);
  }

  const { name, country, latitude, longitude } = data.results[0];
  return { name, country, latitude, longitude };
}

/**
 * Fetches current weather conditions and a 5-day forecast for the
 * given coordinates using the Open-Meteo Forecast API.
 */
async function getWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&timezone=auto`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to fetch weather data right now.");
  }

  return response.json();
}

/**
 * Updates the hero section and stats row with the current weather data.
 * Note: Open-Meteo's free "current" block doesn't include a UV index,
 * so we display the day's max UV value if available, or "N/A" otherwise.
 */
function displayCurrentWeather(data, cityName, country) {
  const current = data.current;
  const weatherInfo = getWeatherDescription(current.weather_code);

  weatherIconEl.textContent = weatherInfo.icon;
  cityNameEl.textContent = `${cityName}, ${country}`;
  temperatureEl.textContent = `${Math.round(current.temperature_2m)}°C`;
  descriptionEl.textContent = weatherInfo.description;

  humidityEl.textContent = `${current.relative_humidity_2m}%`;
  windSpeedEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;

  if (data.daily && data.daily.uv_index_max) {
    uvIndexEl.textContent = Math.round(data.daily.uv_index_max[0]);
  } else {
    uvIndexEl.textContent = "N/A";
  }

  currentWeatherSection.hidden = false;
  statsRowSection.hidden = false;
}

/**
 * Builds and inserts the 5-day forecast cards into the forecast grid.
 */
function displayForecast(daily) {
  forecastGridEl.innerHTML = ""; // clear any previous forecast

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 5; i++) {
    const dateStr = daily.time[i];
    const date = new Date(dateStr);
    const dayName = dayNames[date.getDay()];

    const weatherInfo = getWeatherDescription(daily.weather_code[i]);
    const high = Math.round(daily.temperature_2m_max[i]);
    const low = Math.round(daily.temperature_2m_min[i]);

    const dayCard = document.createElement("div");
    dayCard.className = "forecast-day";
    dayCard.innerHTML = `
      <p class="forecast-day-name">${dayName}</p>
      <p class="forecast-icon">${weatherInfo.icon}</p>
      <p class="forecast-high">${high}°</p>
      <p class="forecast-low">${low}°</p>
    `;

    forecastGridEl.appendChild(dayCard);
  }

  forecastSection.hidden = false;
}

/**
 * Displays an error message to the user and hides the weather sections.
 */
function showError(message) {
  errorMessageEl.textContent = message;
  errorMessageEl.hidden = false;

  currentWeatherSection.hidden = true;
  statsRowSection.hidden = true;
  forecastSection.hidden = true;
}

/**
 * Hides the error message box (called at the start of a new search).
 */
function clearError() {
  errorMessageEl.hidden = true;
  errorMessageEl.textContent = "";
}

/**
 * Main handler triggered when the user submits a search.
 * Coordinates the two API calls and updates the page, handling
 * loading state and errors along the way.
 */
async function handleSearch(city) {
  clearError();
  loadingMessageEl.hidden = false;

  currentWeatherSection.hidden = true;
  statsRowSection.hidden = true;
  forecastSection.hidden = true;

  try {
    const { name, country, latitude, longitude } = await getCoordinates(city);
    const weatherData = await getWeather(latitude, longitude);

    displayCurrentWeather(weatherData, name, country);
    displayForecast(weatherData.daily);
  } catch (error) {
    showError(error.message || "Something went wrong. Please try again.");
  } finally {
    loadingMessageEl.hidden = true;
  }
}

// Listen for the search form being submitted (covers both button click
// and pressing Enter in the input field)
searchForm.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading
  const city = cityInput.value.trim();

  if (city === "") {
    showError("Please enter a city name.");
    return;
  }

  handleSearch(city);
});