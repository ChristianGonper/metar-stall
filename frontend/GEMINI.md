# METAR Decoder Frontend - Project Context

This is a React-based frontend for a meteorology application designed to decode and visualize METAR (Meteorological Aerodrome Report) messages. The interface features a retro-futuristic aviation aesthetic, mimicking technical flight instruments.

## Project Overview

*   **Purpose:** Provide a specialized dashboard for aviation weather reports (METAR).
*   **Aesthetic:** High-contrast "Aviation" theme with CRT scanline effects, glassmorphism, and neon accents.
*   **Source Language:** JavaScript (React) with Tailwind CSS.

## Tech Stack

*   **Core:** [React 19](https://react.dev/)
*   **Build Tool:** [Vite](https://vite.dev/)
*   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **State Management:** React Hooks (`useState`, `useEffect`)

## Building and Running

### Development
```powershell
npm install
npm run dev
```
Starts the Vite development server.

### Production
```powershell
npm run build
npm run preview
```
Builds the application for production and provides a local server to preview the build.

### Linting
```powershell
npm run lint
```
Runs ESLint to check for code quality and style issues.

## Architecture & Conventions

### Directory Structure
*   `src/App.jsx`: Main application logic and dashboard layout.
*   `src/main.jsx`: Application entry point.
*   `src/index.css`: Global styles, Tailwind directives, and the CRT/Aviation effect definitions.
*   `tailwind.config.js`: Custom theme extensions (colors like `aviation-orange`, `aviation-green`).

### Components
*   `InstrumentCard`: A reusable component for displaying specific weather parameters (Wind, Temp, QNH, etc.).
*   `MetarModal`: A specialized input modal for pasting raw METAR messages.

### Coding Style
*   **Functional Components:** Uses modern React functional components and hooks.
*   **Utility-First CSS:** Extensive use of Tailwind CSS classes, combined with `clsx` and `tailwind-merge` for dynamic class manipulation.
*   **API Integration:** Communicates with a backend decoder service via `fetch` POST requests to `/decode`.

## Development Context

*   **Backend API:** The application expects a backend service running at `http://127.0.0.1:8000` (configurable via `VITE_API_URL`).
*   **Environment Variables:**
    *   `VITE_API_URL`: Base URL for the meteorology API.
