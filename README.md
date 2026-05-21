# Weather App

A simple static weather app that shows a 5-day forecast for a PIN, ZIP, or postal code. It resolves the entered code to a location, then fetches current conditions and daily forecast data.

## Features

- Search weather by PIN/postal code
- Country selector for India, United States, United Kingdom, Canada, and Australia
- Current temperature, feels-like temperature, humidity, and wind speed
- 5-day forecast cards with weather icons
- High/low temperature trend chart
- Celsius and Fahrenheit toggle
- "Near me" location lookup using browser geolocation

## Open Locally

Open this file in Chrome:

```text

```

Or open `index.html` from this folder directly in your browser.

## Files

- `index.html` - app markup and layout
- `styles.css` - visual design and responsive styles
- `app.js` - postal code lookup, weather API calls, and UI rendering

## APIs Used

- Open-Meteo Forecast API for weather data
- Zippopotam.us for postal code lookup
- OpenStreetMap Nominatim as a fallback postal code lookup

No API key is required.

## Hosting

This is a static site, so it can be hosted on GitHub Pages, Netlify, Vercel, or any static file host.

For GitHub Pages, put these files at the root of a repository and enable Pages from the repository settings.

## Note

Browser geolocation works best on `localhost` or an HTTPS-hosted site. Postal code search works from a normal static host as long as the user has an internet connection.
