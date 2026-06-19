# Weather App

**Name:** Akaninyene Asanga
**Student ID:** ALT/SOE/BAR/026/0052
**Course:** WEB 100–106

## Description

This is a weather app built with plain HTML, CSS, and JavaScript that lets a user search for any city and see its current weather along with a 5-day forecast. The app uses the free Open-Meteo API in two steps: first it calls the Geocoding endpoint to turn the city name typed by the user into latitude/longitude coordinates, then it uses those coordinates to call the Forecast endpoint, which returns the current temperature, humidity, wind speed, weather code, and the daily high/low temperatures for the next five days. All of this is handled with `async`/`await` functions in `script.js`, and the page's `Loading...` message, error message box, and weather sections are shown or hidden depending on whether the fetch is in progress, has succeeded, or has failed (e.g. when a city name doesn't match any results). The WMO weather codes returned by the API are translated into a readable description and an emoji icon using a lookup table, and the layout in `styles.css` follows the required navy/teal colour scheme with a responsive design that adapts down to mobile screens narrower than 480px.

## Files

- `index.html` — page structure (search form, current weather, stats row, forecast section)
- `styles.css` — colours, layout, responsiveness, hover effects and transitions
- `script.js` — API calls, DOM updates, and error handling

## How to Run

Open `index.html` in a browser, or visit the GitHub Pages link below. No build step or API key is required.

## Live Demo

[Add your GitHub Pages link here]
