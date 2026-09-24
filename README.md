# HK Bus ETA - Big Screen Hong Kong Bus Arrival Times
# 香港巴士大螢幕實時到站時間

A dedicated Hong Kong bus arrival time web application designed for big screens, tablets, and wall-mounted desk displays with giant typography, glanceable countdowns, and instant favorites.

## Features

- 🚌 **Hong Kong Franchised Bus Companies**:
  - **KMB / LWB** (九巴 / 龍運巴士)
  - **Citybus (CTB)** (城巴)
  - **NLB** (新大嶼山巴士)
- ⏱ **Monumental Big-Screen Display**:
  - Massive arrival countdown minutes designed to be readable from across the room.
  - "ARRIVING / 即將到站" animated beacon when arriving under 1 minute.
  - Next 2nd and 3rd upcoming bus schedules with live GPS vs scheduled indicators.
- ⭐️ **Favorites System**:
  - Save your frequently used stops with 1 click.
  - Custom nicknames (e.g. "Home", "Office Morning").
  - Live mini-ETAs for all saved favorites simultaneously.
  - Export & Import JSON backup.
- 📍 **Route & Stop Selection**:
  - Search any route with fast keypad and instant autocomplete.
  - Sequentially ordered bus stop list with distance calculation via Geolocation to find the nearest stop.
- 🖥 **Kiosk / Desk Display Controls**:
  - **Screen Wake Lock**: Keep screen awake on phones and tablets.
  - **Fullscreen mode**: Immersive display mode.
  - **Audio Chime & Voice announcement**: Web Audio chime when bus is <= 3 minutes away.
  - **Display Themes**: Authentic HK Bus Amber LED Matrix, Cyber Neon Blue, Interchange Green, Clean Daylight.
  - **Bilingual**: Traditional Chinese (繁體中文) & English.

## Free Hosting on GitHub Pages (github.io)

This application is **100% static client-side** with zero server requirement. All data is fetched directly from the official Hong Kong Transport Department Open Data APIs (`data.etabus.gov.hk` and `rt.data.gov.hk`) with public CORS support.

`vite.config.ts` is configured with `base: './'`, allowing it to run smoothly on any GitHub Pages subpath (e.g. `https://<username>.github.io/<repo-name>/`).

### Quick Deploy:

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: HK Bus Big Screen ETA"
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** ➔ **Pages**
   - Under **Build and deployment** ➔ **Source**, select **GitHub Actions**
3. The pre-configured workflow in `.github/workflows/deploy.yml` will automatically build and deploy the applet to `https://<YOUR_USERNAME>.github.io/<YOUR_REPO_NAME>/` on every push!
