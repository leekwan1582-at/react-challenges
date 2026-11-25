# Codebase Inspection: Omissions, Execution Gaps & Missing Items

This audit report summarizes the findings from an in-depth code inspection of the `travel-planner` application ([App.jsx](file:///home/leekwan/code/react-challenges/travel-planner/src/App.jsx), [Map.jsx](file:///home/leekwan/code/react-challenges/travel-planner/src/Map.jsx), [LocationList.jsx](file:///home/leekwan/code/react-challenges/travel-planner/src/LocationList.jsx), [index.html](file:///home/leekwan/code/react-challenges/travel-planner/index.html), and project configuration).

---

## 1. Functional & UX Gaps

### 1.1 Lack of Bidirectional List-to-Map Focus (`flyTo` / Pan)
- **Current Behavior**: Map clicks update the form (`Map` -> `App` -> `LocationList`). However, clicking on a saved item in `LocationList` does not pan, zoom, or open the corresponding marker on the map (`LocationList` -> `App` -> `Map`).
- **Impact**: When the user has multiple destinations or zooms in, selecting an item in the list leaves them searching manually for the marker across the map.
- **Recommended Fix**:
  - Add an `onSelectLocation(location)` callback in `App.jsx`.
  - Pass the selected target or coordinate to `Map.jsx`.
  - In `Map.jsx`, call `mapInstance.current.flyTo([lat, lng], 15)` and trigger `.openPopup()` on the matched marker.

### 1.2 Coordinate Bounds & Format Validation
- **Current Behavior**: The form allows arbitrary text strings in `Latitude` and `Longitude`. While `Map.jsx` gracefully skips rendering non-numeric values using `!isNaN(...)`, `LocationList.jsx` permits invalid inputs like latitude `999` or non-numeric strings to be saved into state.
- **Impact**: Locations can be created that are permanently invisible on the map with no error feedback to the user.
- **Recommended Fix**:
  - Implement form-level validation on submit:
    - Latitude: `-90 <= lat <= 90`
    - Longitude: `-180 <= lng <= 180`
  - Display Bootstrap alert or inline feedback (`is-invalid`) if values fall outside acceptable geographic coordinates.

### 1.3 Map Extent Auto-Fitting (`fitBounds`)
- **Current Behavior**: The map remains locked at its hardcoded initial center (`[1.3521, 103.8198]`, zoom 13). If a user adds coordinates outside of central Singapore (or international destinations), the markers are off-screen.
- **Impact**: Users must manually zoom out and search the globe to find newly created markers.
- **Recommended Fix**:
  - Provide an effect or a button ("Fit to All Destinations") that invokes:
    ```javascript
    if (markersLayerRef.current.getLayers().length > 0) {
      const bounds = L.featureGroup(markersLayerRef.current.getLayers()).getBounds();
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
    }
    ```

### 1.4 Immediate Delete Without Confirmation
- **Current Behavior**: Clicking the trash icon deletes the destination immediately.
- **Impact**: Accidental clicks result in permanent data loss during the session.
- **Recommended Fix**: Add a confirmation check (`window.confirm("Are you sure you want to delete this destination?")`) or a Bootstrap modal confirmation dialog.

---

## 2. Architectural & Technical Gaps

### 2.1 State Persistence Across Page Refreshes (`localStorage`)
- **Current Behavior**: Application state resides purely in React `useState`. Refreshing or closing the tab resets all added, updated, or deleted locations back to the initial Singapore mock set.
- **Impact**: Any user customizations or itinerary planning work is lost on refresh.
- **Recommended Fix**:
  - Load initial state from `localStorage.getItem('travel_planner_locations')`.
  - Save updates using a `useEffect` on `locations`:
    ```javascript
    useEffect(() => {
      localStorage.setItem('travel_planner_locations', JSON.stringify(locations));
    }, [locations]);
    ```

### 2.2 Leaflet CDN Dependency vs NPM Package
- **Current Behavior**: Leaflet (`1.9.4`) is injected via `<script>` and `<link>` tags in `index.html`, making it a global object (`window.L`).
- **Impact**:
  - Bypasses Vite module dependency resolution, type-checking, and asset bundling.
  - If network access to `unpkg.com` fails, the map component fails without fallback bundling.
- **Recommended Fix**:
  - Install `leaflet` via `npm install leaflet`.
  - Configure default icon assets cleanly in Vite using `L.Icon.Default.mergeOptions`.

### 2.3 Form Edit Cancellation and Transient Map Marker Cleanup
- **Current Behavior**: Clicking on the map places a blue `circleMarker` representing the selected position. If the user clicks "Cancel" or clears the form, the `circleMarker` remains until another map click or submission.
- **Recommended Fix**: Ensure that canceling an edit or clearing the form invokes `onClearSelectedCoords()`, which removes the transient circle marker from `Map.jsx`.

---

## 3. Engineering, Testing & Quality Gaps

### 3.1 Absence of Automated Test Suite
- **Current Behavior**: `package.json` contains scripts for `dev`, `build`, `lint`, and `preview`. There is no test runner installed.
- **Impact**: Regressions in form handling, CRUD state updates, or Leaflet marker lifecycles cannot be caught automatically in CI/CD.
- **Recommended Fix**:
  - Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom`.
  - Add unit tests for `LocationList` (form validation, add, edit, delete actions) and integration tests for `App.jsx`.

### 3.2 Lack of Static Type Safety / Prop Contracts
- **Current Behavior**: Components use vanilla JavaScript without PropTypes or TypeScript.
- **Impact**: Potential bugs when passing coordinates (numbers vs string formats) or callback arguments may go undetected until runtime.
- **Recommended Fix**: Introduce TypeScript (`.tsx`) or `prop-types` to define strict schemas for `Location` and callback handlers.

---

## 4. Priority Matrix

| Item | Area | Priority | Complexity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **List-to-Map Focus (`flyTo`)** | User Experience | **High** | Low | **Implemented** |
| **Latitude/Longitude Validation** | Form Validation | **High** | Low | **Implemented** |
| **State Persistence (`localStorage`)** | Data Integrity | **Medium** | Low | **Implemented** |
| **Delete Confirmation Prompt** | User Safety | **Medium** | Low | **Implemented** |
| **Map Auto `fitBounds`** | Visualization | **Medium** | Low | **Implemented** |
| **Unit & Component Testing (Vitest)** | Reliability | **Medium** | Medium | **Implemented** |
| **Leaflet NPM Bundling** | Architecture | **Low** | Low | **Implemented** |
| **PropTypes Schema Contracts** | Code Quality | **Low** | Low | **Implemented** |
| **TypeScript Migration** | Code Quality | **Low** | Medium | Open |
