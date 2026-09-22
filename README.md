# Smart Water AI

**AI-Based Intelligent Water Monitoring, Leakage Detection and Control System**

A modern, responsive web dashboard for an engineering prototype that combines
real-time water monitoring, AI anomaly detection, and an intelligent control
interface.

The whole interface is built around one story:

> ## MONITOR → THINK → INTERACT
>
> - **Monitor** — Ultrasonic + water-leak sensors → Arduino (real-time sensing)
> - **Think** — Raspberry Pi + AI anomaly detection (processing & analysis)
> - **Interact** — Dashboard, alerts, control panel & future voice assistant

> **Prototype note:** No physical hardware is connected yet. All data on screen
> is **simulated** and clearly labelled as such (`LIVE` / `DEMO MODE`). The app is
> architected so this simulated stream can be swapped for a real Raspberry Pi
> feed without redesigning the UI.

---

## Hardware architecture

```
Ultrasonic Sensor ─┐
                   ├─▶ Arduino ─▶ Raspberry Pi ─▶ AI / Data Processing ─▶ UI / Dashboard / Alerts
Water Leak Sensor ─┘   (read +      (central,
                        control)     AI anomaly detection)
```

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

| Page | Phase | What it shows |
| --- | --- | --- |
| **Dashboard** | Monitor | Four status cards, real-time chart, recent activity |
| **Water Level** | Monitor | Tank visual, metrics, level over time |
| **Leakage** | Monitor | Big leak status + detection history timeline |
| **AI Analysis** | Think | AI status, live anomaly score, normal vs abnormal patterns, processing workflow |
| **Sensor Data** | Monitor | Per-sensor detail + raw readings table |
| **Alerts** | Interact | Active/historical alerts with filters + resolve |
| **History** | Think | Long-horizon charts + summary statistics |
| **Control Panel** | Interact | Physical-panel-style buttons + LCD readout |
| **Voice Assistant** | Interact | Prototype conversational interface (simulated) |
| **Settings** | Interact | Sensor / AI / communication / notification config |
| **Architecture** | Think | Visual system architecture diagram |

## Demo Mode

Open the **Demo** panel (top-right) to drive the whole UI for a presentation:

- **Normal** — stable level, dry sensor, AI normal
- **Water Leak** — level drops fast, leak sensor wet, AI anomaly, critical alert
- **Sensor Anomaly** — leak sensor stays dry but ultrasonic readings go erratic; AI anomaly

Changing the scenario updates the dashboard cards, charts, AI status, alerts,
leakage status, and control-panel responses live. You can also pause the stream.

## Project structure

```
src/
├── components/
│   ├── alerts/          AlertCard, AlertList
│   ├── architecture/    SystemArchitecture
│   ├── cards/           StatusCard, WaterLevelCard, LeakStatusCard, AIStatusCard, SystemStatusCard
│   ├── charts/          SensorChart, AnomalyScoreChart, MiniLineChart, RealTimeWaterChart, ChartTooltip
│   ├── common/          StatusBadge, CircularProgress, TankVisual, DataSourceBadge, DemoModePanel, PageHeader, Stat
│   ├── control/         ControlButton
│   ├── layout/          Layout, Sidebar, Header
│   ├── sensor/          SensorTable
│   └── voice/           VoiceAssistant
├── config/              navigation (nav items + MONITOR/THINK/INTERACT phases)
├── data/                mockData (centralized generators + seed data)
├── hooks/               useNow, useWaterLevelSeries
├── lib/                 format helpers
├── pages/               one file per route
├── services/            sensorService, systemService, aiService, alertService, simulationService
├── store/               SystemContext (state + real-time simulation loop)
└── types/               SensorData, SystemStatus, AIAnalysis, Alert, … (the data contract)
```

## Connecting a real backend later

The UI never talks to the data source directly — it goes through the **service
layer** (`src/services/`) and the **types** in `src/types/`. To connect the
Raspberry Pi:

1. Keep the function signatures in `sensorService` / `systemService` /
   `aiService` / `alertService` the same.
2. Replace their mock bodies with REST / WebSocket / MQTT calls.
3. In `store/SystemContext.tsx`, swap the simulation `tick` for a subscription to
   the live stream.

No components need to change, because they only depend on the typed data
contract — not on how the data is produced.

## Engineering honesty

The interface always distinguishes **simulated** data from real hardware
measurements. Because no hardware is attached in this prototype, the data-source
badge reads `LIVE` (simulated) or `DEMO MODE`. AI "possible causes" are presented
as possibilities to investigate — never as confirmed diagnoses.
