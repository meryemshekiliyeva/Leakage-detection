# Smart Water AI

**AI-Based Intelligent Water Monitoring, Leakage Detection and Control System**

A modern, responsive web dashboard for an engineering prototype that combines
real-time water monitoring, AI anomaly detection, and an intelligent control
panel.

The interface is built around one story:

> ## MONITOR → THINK → INTERACT
>
> - **Monitor** — Ultrasonic + water-leak sensors → Arduino (real-time sensing)
> - **Think** — AI anomaly detection on the readings (runs in the browser)
> - **Interact** — Dashboard + control panel

> **Connecting hardware:** The dashboard reads a **real Arduino directly over
> USB** — no backend or Raspberry Pi needed — using the browser's Web Serial API.
> Click **Connect Arduino** in the app (Chrome/Edge). Until a board is connected,
> the app runs on a clearly-labelled **simulated** stream (`LIVE` / `DEMO MODE`),
> so simulated data is never shown as real hardware measurements.

---

## Connecting your Arduino (direct USB — no Raspberry Pi needed)

The dashboard reads the Arduino straight from the USB port using the browser's
**Web Serial API**, and runs the AI anomaly detection in the browser.

**Requirements:** Google **Chrome** or **Edge** on desktop, with the page open
over `http://localhost` (the dev server) or HTTPS. (Web Serial isn't available
in Firefox/Safari or on mobile.)

**Steps:**
1. Upload the Arduino sketch (9600 baud, printing
   `waterLevel,distance,leakDetected`).
2. Plug the Arduino into the computer via USB. Close the Arduino IDE Serial
   Monitor (only one program can hold the port at a time).
3. Run the dashboard (`npm run dev`) and open it in Chrome/Edge.
4. Click **Connect Arduino** (top-right of the header) and pick the port —
   usually shown as *Arduino* or a USB serial device.

The header switches to **Arduino Live** and every card and chart updates from
the real sensor stream. Disconnect from the same button.

## Tech stack

- **React 18** + **TypeScript**
- **Vite** (build/dev)
- **Tailwind CSS** (design system)
- **React Router** (navigation)
- **Recharts** (charts)
- **Lucide** (icons)

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # type-check only (tsc --noEmit)
```

## Pages

| Page | What it shows |
| --- | --- |
| **Dashboard** | Four status cards (water level, leak, AI, system) + real-time water-level chart |
| **Water Level** | Tank visual, metrics (level, distance, volume, tank height) + level over time |
| **Control Panel** | Physical-panel-style buttons that query the system into an LCD-style readout |

## Demo Mode

Open the **Demo** panel (top-right) to drive the whole UI for a presentation
without hardware:

- **Normal** — stable level, dry sensor, AI normal
- **Water Leak** — level drops fast, leak sensor wet, AI anomaly
- **Sensor Anomaly** — leak sensor stays dry but ultrasonic readings go erratic

Changing the scenario updates the dashboard cards, chart, AI status and
control-panel responses live. You can also pause the stream.

## Project structure

```
src/
├── components/
│   ├── cards/     StatusCard, WaterLevelCard, LeakStatusCard, AIStatusCard, SystemStatusCard
│   ├── charts/    SensorChart, RealTimeWaterChart, ChartTooltip
│   ├── common/    StatusBadge, CircularProgress, TankVisual, DataSourceBadge,
│   │              DemoModePanel, PageHeader, Stat, ArduinoConnectButton
│   ├── control/   ControlButton
│   └── layout/    Layout, Sidebar, Header
├── config/        navigation (nav items + MONITOR/THINK/INTERACT phases)
├── data/          mockData (centralized generators + physical model)
├── hooks/         useNow, useWaterLevelSeries
├── lib/           format helpers
├── pages/         Dashboard, WaterLevel, ControlPanel, NotFound
├── services/      serialService (Web Serial), simulationService (anomaly detection),
│                  systemService, alertService
├── store/         SystemContext (state + real-time pipeline: simulation + Arduino)
└── types/         SensorData, SystemStatus, AIAnalysis, … (the data contract)
```

## How the data flows

The UI reads from a single `SystemContext`, which is fed by one of two sources
through the **same** pipeline:

- **Simulation** — the built-in mock stream (default; great for demos).
- **Arduino** — real readings over USB (Web Serial). When connected, it drives
  the app and the simulation idles.

Because every component depends only on the typed data in `src/types`, swapping
the data source never requires touching the UI.

## Engineering honesty

The interface always distinguishes **simulated** data from real hardware
measurements: the data-source badge reads `LIVE · Arduino` when a board is
connected, `LIVE · simulated` otherwise, and `DEMO MODE` during a scripted demo.
