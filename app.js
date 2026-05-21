const searchForm = document.querySelector("#searchForm");
const countrySelect = document.querySelector("#countrySelect");
const postalInput = document.querySelector("#postalInput");
const locateButton = document.querySelector("#locateButton");
const unitButtons = document.querySelectorAll("[data-unit]");
const statusText = document.querySelector("#statusText");
const currentPanel = document.querySelector("#currentPanel");
const placeName = document.querySelector("#placeName");
const currentTemp = document.querySelector("#currentTemp");
const currentCondition = document.querySelector("#currentCondition");
const currentIcon = document.querySelector("#currentIcon");
const feelsLike = document.querySelector("#feelsLike");
const humidity = document.querySelector("#humidity");
const wind = document.querySelector("#wind");
const forecastGrid = document.querySelector("#forecastGrid");
const tempChart = document.querySelector("#tempChart");

let activeUnit = "celsius";
let activeLocation = {
  name: "New Delhi",
  admin1: "Delhi",
  country: "India",
  postalCode: "110001",
  latitude: 28.6139,
  longitude: 77.209,
};

const countries = {
  in: {
    code: "in",
    name: "India",
    defaultPostal: "110001",
    placeholder: "110001",
  },
  us: {
    code: "us",
    name: "United States",
    defaultPostal: "10001",
    placeholder: "10001",
  },
  gb: {
    code: "gb",
    name: "United Kingdom",
    defaultPostal: "SW1A 1AA",
    placeholder: "SW1A 1AA",
  },
  ca: {
    code: "ca",
    name: "Canada",
    defaultPostal: "K1A 0B1",
    placeholder: "K1A 0B1",
  },
  au: {
    code: "au",
    name: "Australia",
    defaultPostal: "2000",
    placeholder: "2000",
  },
};

const unitSettings = {
  fahrenheit: {
    temp: "fahrenheit",
    wind: "mph",
    tempSuffix: "F",
    windSuffix: "mph",
  },
  celsius: {
    temp: "celsius",
    wind: "kmh",
    tempSuffix: "C",
    windSuffix: "km/h",
  },
};

const weatherCodes = {
  0: ["Clear sky", "clear", "Sunlit and crisp"],
  1: ["Mostly clear", "clear", "Bright with a few wisps"],
  2: ["Partly cloudy", "cloudy", "Sun and cloud mix"],
  3: ["Overcast", "cloudy", "Soft gray cover"],
  45: ["Fog", "foggy", "Low visibility"],
  48: ["Rime fog", "foggy", "Icy fog patches"],
  51: ["Light drizzle", "rainy", "Fine drizzle"],
  53: ["Drizzle", "rainy", "Steady drizzle"],
  55: ["Heavy drizzle", "rainy", "Thick drizzle"],
  56: ["Freezing drizzle", "rainy", "Freezing drizzle"],
  57: ["Freezing drizzle", "rainy", "Dense freezing drizzle"],
  61: ["Light rain", "rainy", "A little wet"],
  63: ["Rain", "rainy", "Rainy stretch"],
  65: ["Heavy rain", "rainy", "Heavy rain"],
  66: ["Freezing rain", "rainy", "Icy rain"],
  67: ["Freezing rain", "rainy", "Heavy icy rain"],
  71: ["Light snow", "snowy", "Light snow"],
  73: ["Snow", "snowy", "Snowy spell"],
  75: ["Heavy snow", "snowy", "Heavy snow"],
  77: ["Snow grains", "snowy", "Fine snow grains"],
  80: ["Rain showers", "rainy", "Passing showers"],
  81: ["Rain showers", "rainy", "Strong showers"],
  82: ["Heavy showers", "rainy", "Heavy showers"],
  85: ["Snow showers", "snowy", "Snow showers"],
  86: ["Heavy snow showers", "snowy", "Heavy snow showers"],
  95: ["Thunderstorm", "stormy", "Thunder in the mix"],
  96: ["Storm with hail", "stormy", "Thunder and hail"],
  99: ["Storm with hail", "stormy", "Heavy thunder and hail"],
};

const cardTints = {
  clear: "linear-gradient(165deg, rgba(244, 184, 79, 0.28), rgba(255, 255, 255, 0))",
  cloudy: "linear-gradient(165deg, rgba(82, 183, 216, 0.22), rgba(255, 255, 255, 0))",
  rainy: "linear-gradient(165deg, rgba(22, 119, 168, 0.2), rgba(255, 255, 255, 0))",
  snowy: "linear-gradient(165deg, rgba(116, 174, 191, 0.2), rgba(255, 255, 255, 0))",
  stormy: "linear-gradient(165deg, rgba(91, 103, 123, 0.24), rgba(255, 255, 255, 0))",
  foggy: "linear-gradient(165deg, rgba(138, 161, 168, 0.22), rgba(255, 255, 255, 0))",
};

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const postalCode = normalizePostalCode(postalInput.value);
  const country = getSelectedCountry();

  if (!postalCode) {
    showStatus("Type a PIN or postal code first.", true);
    postalInput.focus();
    return;
  }

  await searchPostalCode(postalCode, country);
});

countrySelect.addEventListener("change", () => {
  const country = getSelectedCountry();
  const existingValue = normalizePostalCode(postalInput.value);
  const knownDefaults = Object.values(countries).map((item) => item.defaultPostal);

  postalInput.placeholder = country.placeholder;
  if (!existingValue || knownDefaults.includes(existingValue)) {
    postalInput.value = country.defaultPostal;
  }
});

locateButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showStatus("Location lookup is not available in this browser.", true);
    return;
  }

  showStatus("Checking your location...");
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      activeLocation = {
        name: "Your location",
        country: "",
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      postalInput.value = "";
      await loadForecast();
    },
    () => showStatus("Location permission was not granted.", true),
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

unitButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const nextUnit = button.dataset.unit;
    if (nextUnit === activeUnit) {
      return;
    }

    activeUnit = nextUnit;
    unitButtons.forEach((unitButton) => {
      unitButton.classList.toggle("active", unitButton.dataset.unit === activeUnit);
    });
    await loadForecast();
  });
});

async function searchPostalCode(postalCode, country) {
  showStatus(`Finding ${postalCode} in ${country.name}...`);

  try {
    const location = await resolvePostalCode(postalCode, country);
    if (!location) {
      showStatus(`No location found for ${postalCode} in ${country.name}.`, true);
      return;
    }

    activeLocation = location;
    postalInput.value = location.postalCode;
    await loadForecast();
  } catch (error) {
    showStatus("Could not resolve that PIN or postal code. Check your connection and try again.", true);
  }
}

async function resolvePostalCode(postalCode, country) {
  const lookups = [lookupWithZippopotam, lookupWithNominatim];

  for (const lookup of lookups) {
    try {
      const location = await lookup(postalCode, country);
      if (location) {
        return location;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

async function lookupWithZippopotam(postalCode, country) {
  const response = await fetch(
    `https://api.zippopotam.us/${country.code}/${encodeURIComponent(postalCode)}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Postal lookup failed");
  }

  const data = await response.json();
  const place = data.places?.[0];
  if (!place) {
    return null;
  }

  return {
    name: place["place name"],
    admin1: place.state,
    country: data.country || country.name,
    postalCode,
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
  };
}

async function lookupWithNominatim(postalCode, country) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    format: "jsonv2",
    postalcode: postalCode,
    countrycodes: country.code,
    addressdetails: "1",
    limit: "1",
  });

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Map lookup failed");
  }

  const data = await response.json();
  const result = data[0];
  if (!result) {
    return null;
  }

  const address = result.address || {};
  return {
    name:
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.county ||
      `Postal code ${postalCode}`,
    admin1: address.state || address.region || address.county,
    country: address.country || country.name,
    postalCode: address.postcode || postalCode,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
  };
}

async function loadForecast() {
  const settings = unitSettings[activeUnit];
  showStatus(`Fetching ${formatPlace(activeLocation)}...`);

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: activeLocation.latitude,
      longitude: activeLocation.longitude,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "weather_code",
        "wind_speed_10m",
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "wind_speed_10m_max",
        "sunrise",
        "sunset",
      ].join(","),
      temperature_unit: settings.temp,
      wind_speed_unit: settings.wind,
      precipitation_unit: "inch",
      timezone: "auto",
      forecast_days: "5",
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Forecast request failed");
    }

    const data = await response.json();
    renderForecast(data);
    showStatus(`Updated ${formatUpdatedTime(data.current?.time)}.`);
  } catch (error) {
    showStatus("Forecast could not be loaded. Check your connection and try again.", true);
  }
}

function renderForecast(data) {
  const current = data.current;
  const daily = data.daily;
  const settings = unitSettings[activeUnit];
  const currentInfo = getWeatherInfo(current.weather_code);

  placeName.textContent = formatPlace(activeLocation);
  currentTemp.innerHTML = `${round(current.temperature_2m)}&deg;`;
  currentCondition.textContent = currentInfo[0];
  currentIcon.replaceChildren(buildWeatherIcon(currentInfo[1]));
  feelsLike.innerHTML = `${round(current.apparent_temperature)}&deg;${settings.tempSuffix}`;
  humidity.textContent = `${round(current.relative_humidity_2m)}%`;
  wind.textContent = `${round(current.wind_speed_10m)} ${settings.windSuffix}`;
  currentPanel.classList.remove("error-state");

  renderCards(daily, settings);
  renderChart(daily, settings);
}

function renderCards(daily, settings) {
  forecastGrid.replaceChildren();

  daily.time.forEach((isoDate, index) => {
    const info = getWeatherInfo(daily.weather_code[index]);
    const high = round(daily.temperature_2m_max[index]);
    const low = round(daily.temperature_2m_min[index]);
    const rainChance = daily.precipitation_probability_max[index] ?? 0;
    const windMax = daily.wind_speed_10m_max[index] ?? 0;
    const card = document.createElement("article");
    card.className = "forecast-card";
    card.style.setProperty("--card-tint", cardTints[info[1]]);

    const icon = buildWeatherIcon(info[1]);
    icon.setAttribute("aria-hidden", "true");

    card.innerHTML = `
      <div class="forecast-top">
        <div>
          <p class="forecast-day">${formatDay(isoDate, index)}</p>
          <p class="forecast-date">${formatDate(isoDate)}</p>
        </div>
      </div>
      <div class="forecast-temp">
        <strong>${high}&deg;</strong>
        <span>${low}&deg;</span>
      </div>
      <p class="forecast-summary">${info[2]}</p>
      <div class="forecast-meta">
        <div>
          <span>Rain</span>
          <strong>${round(rainChance)}%</strong>
        </div>
        <div>
          <span>Wind</span>
          <strong>${round(windMax)} ${settings.windSuffix}</strong>
        </div>
      </div>
    `;

    card.querySelector(".forecast-top").append(icon);
    forecastGrid.append(card);
  });
}

function renderChart(daily, settings) {
  const highs = daily.temperature_2m_max.map(Number);
  const lows = daily.temperature_2m_min.map(Number);
  const allTemps = [...highs, ...lows];
  const minTemp = Math.min(...allTemps) - 3;
  const maxTemp = Math.max(...allTemps) + 3;
  const width = 360;
  const height = 150;
  const padding = { top: 20, right: 18, bottom: 30, left: 24 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const x = (index) => padding.left + (plotWidth / (highs.length - 1)) * index;
  const y = (temp) =>
    padding.top + ((maxTemp - temp) / (maxTemp - minTemp || 1)) * plotHeight;

  const highPoints = highs.map((temp, index) => `${x(index)},${y(temp)}`).join(" ");
  const lowPoints = lows.map((temp, index) => `${x(index)},${y(temp)}`).join(" ");
  const gridLines = [0.25, 0.5, 0.75]
    .map((ratio) => {
      const lineY = padding.top + plotHeight * ratio;
      return `<line class="chart-grid" x1="${padding.left}" y1="${lineY}" x2="${width - padding.right}" y2="${lineY}" />`;
    })
    .join("");

  const dots = highs
    .map(
      (temp, index) =>
        `<circle class="chart-dot-high" cx="${x(index)}" cy="${y(temp)}" r="4" />
         <text class="chart-label" x="${x(index)}" y="${y(temp) - 9}" text-anchor="middle">${round(temp)}&deg;</text>`
    )
    .join("");

  const lowDots = lows
    .map(
      (temp, index) =>
        `<circle class="chart-dot-low" cx="${x(index)}" cy="${y(temp)}" r="4" />
         <text class="chart-label" x="${x(index)}" y="${y(temp) + 19}" text-anchor="middle">${round(temp)}&deg;</text>`
    )
    .join("");

  const days = daily.time
    .map(
      (date, index) =>
        `<text class="chart-day" x="${x(index)}" y="${height - 8}" text-anchor="middle">${formatShortDay(date)}</text>`
    )
    .join("");

  tempChart.setAttribute("viewBox", `0 0 ${width} ${height}`);
  tempChart.innerHTML = `
    ${gridLines}
    <polyline class="chart-high" points="${highPoints}" />
    <polyline class="chart-low" points="${lowPoints}" />
    ${dots}
    ${lowDots}
    ${days}
    <title>Highs and lows in degrees ${settings.tempSuffix}</title>
  `;
}

function buildWeatherIcon(type) {
  const icon = document.createElement("div");
  icon.className = `weather-icon ${type}`;
  icon.innerHTML = `
    <span class="sun"></span>
    <span class="cloud-base"></span>
    <span class="cloud-bump-a"></span>
    <span class="cloud-bump-b"></span>
    <span class="rain"></span>
    <span class="snow"></span>
    <span class="bolt"></span>
    <span class="fog"></span>
  `;
  return icon;
}

function getWeatherInfo(code) {
  return weatherCodes[code] ?? ["Mixed conditions", "cloudy", "Changing skies"];
}

function formatPlace(location) {
  const place = [location.name, location.admin1, location.country].filter(Boolean).join(", ");
  return location.postalCode ? `${location.postalCode} - ${place}` : place;
}

function getSelectedCountry() {
  return countries[countrySelect.value] || countries.in;
}

function normalizePostalCode(value) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function formatDay(isoDate, index) {
  if (index === 0) {
    return "Today";
  }

  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date(`${isoDate}T12:00:00`));
}

function formatShortDay(isoDate) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${isoDate}T12:00:00`));
}

function formatDate(isoDate) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(`${isoDate}T12:00:00`)
  );
}

function formatUpdatedTime(isoDateTime) {
  if (!isoDateTime) {
    return "just now";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDateTime));
}

function round(value) {
  return Math.round(Number(value));
}

function showStatus(message, isError = false) {
  statusText.textContent = message;
  currentPanel.classList.toggle("error-state", isError);
}

loadForecast();
