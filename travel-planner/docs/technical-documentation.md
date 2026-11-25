# Travel Planner - Technical Documentation

This document provides a comprehensive technical overview of the Travel Planner application, detailing its architecture, code organization, environment setup, key modules, data flow patterns, and testing/verification procedures.

---

## 1. Architecture Overview

Travel Planner is a client-side Single Page Application (SPA) built with **React 19**, bundled and served with **Vite**, and styled with **Bootstrap 5** and custom CSS. Interactive geographical visualization is powered by **Leaflet (bundled via NPM)**.

The application adheres to unidirectional data flow and lifted state management patterns in React:

```
                  +----------------------------------+
                  |             App.jsx              |
                  |  - locations (with localStorage) |
                  |  - selectedCoords state          |
                  |  - activeLocation state          |
                  |  - CRUD & click handlers         |
                  +-----------------+----------------+
                                    |
          +-------------------------+-------------------------+
          | props & callbacks                                 | props & callbacks
          v                                                   v
+-----------------------+                           +------------------------+
|        Map.jsx        |                           |    LocationList.jsx    |
| - Bundled Leaflet Map |                           | - Add / Edit Form      |
| - LayerGroup markers  |  <--- Map click sync ---  | - Destination List     |
| - Selected circle     |       (selectedCoords)    | - Lat/Lng Validation   |
| - flyTo on selection  |                           | - Bootstrap Modal Del  |
| - fitBounds button    |                           | - CRUD Trigger Actions |
+-----------------------+                           +------------------------+
```

### High-Level Components:
- **`App` (Orchestrator & Persistence)**: Acts as the single source of truth for global state (`locations`, `selectedCoords`, `activeLocation`). Automatically loads from and synchronizes changes to browser `localStorage`.
- **`Map` (Visualization Layer)**: Imports bundled Leaflet and its CSS, fixes retina and default marker asset URLs, manages markers dynamically inside a Leaflet `LayerGroup`, provides click-to-pick coordinate detection, smooth `flyTo` camera panning, and auto-fitting bounding boxes (`fitBounds`).
- **`LocationList` (Interaction & Presentation Layer)**: Provides form controls to capture user input with real-time numeric and boundary validation (`-90 <= lat <= 90`, `-180 <= lng <= 180`), handles edit modes, presents a Bootstrap modal confirmation dialog for safe deletion, and lists destinations with one-click map focusing.

---

## 2. Project Structure

The project follows a standard Vite + React project layout:

```
travel-planner/
├── docs/
│   ├── codebase-inspection-findings.md # Codebase audit and implementation status
│   ├── implementation-plan.md          # Step-by-step roadmap and task checklist
│   └── technical-documentation.md      # Comprehensive technical architecture & reference
├── public/
│   └── vite.svg                        # Static favicon and assets
├── src/
│   ├── assets/
│   │   └── react.svg                   # React logo asset
│   ├── test/
│   │   ├── App.test.jsx                # Integration tests for App & localStorage
│   │   ├── LocationList.test.jsx       # Component tests for form, validation, and modal
│   │   └── setup.js                    # Vitest setup & Leaflet test mocks
│   ├── App.css                         # Layout and map container styling
│   ├── App.jsx                         # Root component with lifted state & handlers
│   ├── index.css                       # Global base stylesheet
│   ├── LocationList.jsx                # Controlled form, validation, modal, and list component
│   ├── main.jsx                        # React entry point mounting to DOM root
│   └── Map.jsx                         # Leaflet map container & marker synchronization
├── eslint.config.js                    # ESLint 9 flat configuration with React hooks rules
├── index.html                          # HTML entry point mounting #root and FontAwesome CDN
├── package.json                        # Dependencies, scripts, and package metadata
├── package-lock.json                   # Dependency lockfile
└── vite.config.js                      # Vite & Vitest configuration (@vitejs/plugin-react)
```

### Key Files and Their Roles:
| File | Role & Purpose |
| :--- | :--- |
| `index.html` | HTML entry point mounting `#root` and linking FontAwesome CDN. |
| `src/main.jsx` | Entry point; mounts `<App />` using React 19's `createRoot`. |
| `src/App.jsx` | Houses the primary state (`locations`, `selectedCoords`, `activeLocation`), `localStorage` sync, and root CRUD event handlers. |
| `src/Map.jsx` | Imports bundled `leaflet` and `leaflet.css`, resolves marker asset URLs, encapsulates map lifecycle, marker layer groups, click events, `flyTo` camera panning, and auto-fit bounding box calculations. |
| `src/LocationList.jsx` | Contains local controlled form state, geographic coordinate validation, Bootstrap modal confirmation for deletions, edit mode toggles, and item listing with click-to-focus triggers. |
| `src/App.css` | Defines `.map-container` and custom responsive dimensions. |
| `src/test/setup.js` | Configures Vitest with `@testing-library/jest-dom` matchers and mocks for Leaflet APIs. |

---

## 3. Setup for Development

### Prerequisites:
- **Node.js**: v18.0.0 or higher (v20+ LTS recommended).
- **npm**: v9.0.0 or higher.

### Step-by-Step Installation & Run:

1. **Navigate to the project directory**:
   ```bash
   cd /home/leekwan/code/react-challenges/travel-planner
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   *Vite will start the dev server (typically at `http://localhost:5173/`).*

4. **Run automated test suite**:
   ```bash
   npm test
   ```
   *Runs all Vitest unit and integration tests.*

5. **Build for production**:
   ```bash
   npm run build
   ```
   *Bundles the application into the `dist/` directory.*

6. **Preview production build**:
   ```bash
   npm run preview
   ```

7. **Run linter**:
   ```bash
   npm run lint
   ```

---

## 4. Key Modules & Functions

### 4.1 `App.jsx`

#### State:
- `locations` (`Array<Object>`): List of location items, initialized from `localStorage.getItem('travel_planner_locations')` (or defaults to Singapore landmarks):
  - `id` (`number|string`): Unique identifier.
  - `name` (`string`): Landmark / destination name.
  - `address` (`string`): Address or descriptive notes.
  - `lat` (`string|number`): Latitude coordinate.
  - `lng` (`string|number`): Longitude coordinate.
- `selectedCoords` (`{ lat: number, lng: number } | null`): Holds coordinates emitted when the user clicks on the map.
- `activeLocation` (`Object | null`): Tracks the currently active / selected destination to focus on the map.

#### Lifecycle & Storage Synchronization:
- Syncs state changes automatically to `localStorage` under key `"travel_planner_locations"` via `useEffect`.

#### Handlers:
- **`handleAddLocation(newLocation)`**:
  - Assigns `id: newLocation.id || Date.now()`, appends the item to `locations`, resets `selectedCoords` to `null`, and sets `activeLocation` to the new item.
- **`handleUpdateLocation(updatedLocation)`**:
  - Replaces matching entry in `locations` and updates `activeLocation`.
- **`handleDeleteLocation(id)`**:
  - Filters out the entry from `locations`. If `activeLocation?.id === id`, resets `activeLocation` to `null`.
- **`handleMapClick(coords)`**:
  - Sets `selectedCoords` to the clicked `{ lat, lng }`.
- **`handleSelectLocation(location)`**:
  - Sets `activeLocation` to the selected item to trigger map camera motion.

---

### 4.2 `Map.jsx`

#### Props:
- `locations` (`Array<Object>`): Current locations list.
- `onMapClick` (`Function`): Callback fired on Leaflet click events.
- `selectedCoords` (`Object|null`): Coordinates of the actively clicked position.
- `activeLocation` (`Object|null`): Target destination to fly to and open its popup.
- `onSearchResultSelect` (`Function`): Callback fired when a search result is selected from the map search bar.

#### Search on Map (Geocoding):
- Integrates OpenStreetMap Nominatim geocoding directly into the map view.
- Supports worldwide and Chinese destination queries (e.g. `喜洲古镇`, `大理`, `北京`, `Tokyo`, `Paris`).
- Auto-completes dropdown results with name and address.
- Selecting a search item smoothly flies (`flyTo`) the map to the target coordinates and auto-fills `Name`, `Address`, `Latitude`, and `Longitude` into the destination form.

#### Internal References & Logic:
- **Bundled Leaflet**: Imports `leaflet` and `leaflet/dist/leaflet.css`. Configures default marker icons (`marker-icon.png`, `marker-icon-2x.png`, `marker-shadow.png`) via `L.Icon.Default.mergeOptions`.
- **`mapInstance = useRef(null)`**: Maintains the Leaflet map object across re-renders without unmounting.
- **`markersLayerRef = useRef(null)`**: Holds a Leaflet `L.layerGroup()`. Markers are cleared and updated dynamically without destroying map state.
- **`markersByIdRef = useRef(new window.Map())`**: Stores a map of location IDs to marker instances for direct marker popup activation.
- **`selectedMarkerRef = useRef(null)`**: Renders a temporary `L.circleMarker` showing visual feedback for the clicked point on the map.
- **`onMapClickRef = useRef(onMapClick)`**: Tracks the latest callback reference to avoid listener rebinding or stale closures.
- **`fitAllMarkers()`**: Computes the bounding box of all markers via `L.featureGroup(layers).getBounds()` and calls `fitBounds` with padding. Triggered via the "Fit All Destinations" button.
- **`flyTo` Integration**: Watches `activeLocation` and executes `mapInstance.current.flyTo([lat, lng], 15, { duration: 1.2 })` followed by `.openPopup()`.

---

### 4.3 `LocationList.jsx`

#### Props:
- `locations`, `activeLocation`, `onSelectLocation`, `onAddLocation`, `onUpdateLocation`, `onDeleteLocation`, `selectedCoords`, `onClearSelectedCoords`.

#### Internal State:
- `formData` (`{ name, address, lat, lng }`): Controlled form inputs.
- `editingId` (`string|number|null`): Current destination ID being edited (`null` for Add mode).
- `errors` (`Object`): Form validation errors for `name`, `lat`, and `lng`.
- `locationToDelete` (`Object|null`): Tracks destination awaiting confirmation in the delete modal.

#### Validation Logic (`validateForm`):
- **Name**: Required; cannot be blank.
- **Latitude**: Must be a valid number between `-90` and `90`.
- **Longitude**: Must be a valid number between `-180` and `180`.
- **Co-dependency**: If either coordinate is entered, both must be provided.
- Dynamically toggles Bootstrap's `is-invalid` class with inline feedback.

#### Delete Confirmation Modal:
- Clicking trash triggers `promptDelete(e, location)`, setting `locationToDelete` and displaying a Bootstrap modal with details and warnings.
- "Delete Location" in modal invokes `confirmDelete()`, which executes `onDeleteLocation(id)`.

---

### 4.4 Prop Types & Schema Contracts

Both `Map.jsx` and `LocationList.jsx` define strict runtime prop schemas using `prop-types`:

- **Location Schema (`PropTypes.shape`)**:
  ```javascript
  {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    address: PropTypes.string,
    description: PropTypes.string,
    lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }
  ```
- **Coordinate Schema**:
  ```javascript
  selectedCoords: PropTypes.shape({
    lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })
  ```
- **Callback Contracts**:
  - `onSelectLocation`: `PropTypes.func`
  - `onAddLocation`: `PropTypes.func`
  - `onUpdateLocation`: `PropTypes.func`
  - `onDeleteLocation`: `PropTypes.func`
  - `onMapClick`: `PropTypes.func`
  - `onClearSelectedCoords`: `PropTypes.func`

---

## 5. Data Flow

### 5.1 Adding a Location via Form:
1. User enters destination details into the form.
2. Form validates inputs (`validateForm()`). If invalid, inline error feedback displays.
3. On valid submit, `onAddLocation(payload)` is called.
4. `App.jsx` creates unique `id`, appends to `locations`, saves to `localStorage`, and sets `activeLocation`.
5. Map clears previous markers, adds new markers, flies to the newly added coordinate, and opens its popup.

### 5.2 Clicking the Map to Add a Location:
1. User clicks any point on the Leaflet map.
2. `Map.jsx` catches the click, extracts coordinates to 4 decimals, and invokes `onMapClickRef.current({ lat, lng })`.
3. `App.jsx` sets `selectedCoords`.
4. `Map.jsx` displays a blue `circleMarker` at that location.
5. `LocationList.jsx` auto-populates `lat` and `lng` form inputs and displays a `Coords filled from map` indicator badge.

### 5.3 Clicking a Destination to Focus on Map:
1. User clicks an item in `LocationList`.
2. `onSelectLocation(location)` is triggered in `App.jsx`, updating `activeLocation`.
3. The selected item in `LocationList` receives an `active` highlighted state.
4. `Map.jsx`'s `useEffect([activeLocation])` smoothly executes `flyTo([lat, lng], 15)` and opens that marker's popup.

### 5.4 Deleting a Location (with Modal):
1. User clicks the trash icon on a destination item.
2. Event propagation is stopped (`e.stopPropagation()`) so the map does not pan.
3. Bootstrap modal appears asking for confirmation and warning that the map marker will be removed.
4. If confirmed:
   - `onDeleteLocation(id)` runs in `App.jsx`.
   - `locations` state and `localStorage` update.
   - Marker is removed from `Map.jsx`.
   - Modal closes.

---

## 6. Testing & Quality Verification

### Test Framework
The application uses **Vitest** paired with **@testing-library/react**, **@testing-library/jest-dom**, **@testing-library/user-event**, and **jsdom** for component and integration testing.

### Running Tests
Execute the full test suite with:
```bash
npm test
```
Or run Vitest in watch mode during development:
```bash
npx vitest
```

### Covered Test Suites
- **`src/test/LocationList.test.jsx`** (7 tests):
  - Destination list rendering.
  - Required name validation.
  - Geographic coordinate range validation (`-90 <= lat <= 90`, `-180 <= lng <= 180`).
  - Submission of valid new locations.
  - Opening the Bootstrap modal and confirming destination deletion.
  - Canceling deletion from the modal.
  - Form population and updating in Edit mode.
- **`src/test/App.test.jsx`** (2 tests):
  - Full app rendering with initial Singapore landmarks.
  - `localStorage` persistence and retrieval across add operations.

### Verification Checklist:
- [x] Initial locations load properly on page load from `localStorage` or defaults.
- [x] Map search bar geocodes international and Chinese destinations (e.g. 喜洲古镇).
- [x] Selecting a search result flies to destination and pre-fills the form with name, address, and coordinates.
- [x] Map initializes centered on Singapore with bundled Leaflet tiles and markers.
- [x] All coordinates in `locations` render as Leaflet markers with popups.
- [x] Clicking anywhere on the map drops a selection circle and populates lat/lng into the form.
- [x] Adding a new location renders a new marker, persists to `localStorage`, and flies to it.
- [x] Clicking a destination row in the list smoothly flies the map to that location and opens its popup.
- [x] "Fit All Destinations" button recalculates bounding box and fits all markers in view.
- [x] Invalid latitude (`< -90` or `> 90`) or longitude (`< -180` or `> 180`) triggers inline validation.
- [x] Deleting a location prompts a Bootstrap confirmation modal before deletion.
- [x] Automated Vitest suite passes all 9 unit and integration tests.
- [x] Code passes ESLint without errors or warnings.
- [x] Vite builds production bundle cleanly without external Leaflet CDN dependencies.
