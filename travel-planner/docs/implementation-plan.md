# Travel Planner Implementation Plan

## 1. Overview & Objectives

The goal is to implement interactive travel planning functionality across `App.jsx`, `Map.jsx`, and `LocationList.jsx`. Users should be able to:
1. Maintain and view a dynamic list of locations with coordinates, names, and descriptions/addresses.
2. Synchronize markers on Leaflet map dynamically with the locations state.
3. Add, edit, and delete locations via the `LocationList` form and actions.
4. Click on the map to prefill or directly add a new location with the clicked latitude and longitude.

---

## 2. Architecture & Data Model

### 2.1 State Management (`App.jsx`)
Lift state up to `App.jsx` to act as the single source of truth for both `Map` and `LocationList`:

- **`locations` State Array**:
  ```javascript
  const [locations, setLocations] = useState([
    {
      id: string | number,
      name: string,
      description: string, // or address
      lat: number | string,
      lng: number | string
    },
    // initial mock items (e.g., Singapore landmarks)
  ]);
  ```
- **`editingLocation` State (Optional / Recommended)**:
  Tracks the location currently being edited (or `null` when in "Add" mode).
- **`selectedCoords` / `newLocationCoords` State**:
  Tracks coordinates selected by clicking on the map, to pre-fill the form in `LocationList`.

### 2.2 Action Handlers in `App.jsx`
- `handleAddLocation(newLocation)`: Appends a new location object (assigning unique ID, e.g., `Date.now()`).
- `handleUpdateLocation(updatedLocation)`: Updates an existing location matching `id`.
- `handleDeleteLocation(id)`: Filters out the location with `id`.
- `handleMapClick({ lat, lng })`: Updates coordinate state or populates form in `LocationList`.

---

## 3. Detailed Component Plan

### 3.1 Task 1: Lift & Initialize State in `App.jsx`
- Move `mockLocations` from `LocationList.jsx` into `App.jsx` as initial state.
- Define CRUD handler functions:
  - `addLocation(location)`
  - `editLocation(location)`
  - `deleteLocation(id)`
- Manage state for coordinate selection from map clicks (`selectedCoords`) and pass it to `LocationList`.
- Pass props down:
  - To `Map`: `locations`, `onMapClick`, `selectedLocation` (optional focus).
  - To `LocationList`: `locations`, `onAddLocation`, `onUpdateLocation`, `onDeleteLocation`, `selectedCoords`, `clearSelectedCoords`.

---

### 3.2 Task 2: Synchronize Leaflet Map Markers in `Map.jsx`
Currently, `Map.jsx` adds a static hardcoded marker inside the initial `useEffect`.

- **Leaflet Marker Layer Group**:
  - Keep a `markersLayerRef = useRef(null)` or `markersMapRef = useRef(new Map())`.
  - When map initializes:
    ```javascript
    const markersGroup = L.layerGroup().addTo(mapInstance.current);
    markersLayerRef.current = markersGroup;
    ```
- **Reacting to `locations` prop changes**:
  - Add a dedicated `useEffect` listening to `[locations]`.
  - Clear previous markers: `markersLayerRef.current.clearLayers()`.
  - Iterate through `locations`:
    - Ensure coordinates are valid floats (`parseFloat(loc.lat)`, `parseFloat(loc.lng)`).
    - Create marker:
      ```javascript
      const marker = L.marker([lat, lng])
        .addTo(markersLayerRef.current)
        .bindPopup(`<b>${loc.name}</b><br/>${loc.description || loc.address || ''}`);
      ```
  - Optional enhancement: Pan or fly to location when clicked in the list or added.

---

### 3.3 Task 3: LocationList CRUD Operations (`LocationList.jsx`)
Replace static inputs and `mockLocations` map with dynamic controlled state.

- **Component Props**:
  - `locations`: Array of location objects.
  - `onAdd`: `(location) => void`
  - `onUpdate`: `(location) => void`
  - `onDelete`: `(id) => void`
  - `selectedCoords`: `{ lat, lng } | null`
  - `onClearSelectedCoords`: `() => void`

- **Form State**:
  - `formData`: `{ name: '', address: '', lat: '', lng: '' }`
  - `editingId`: `null` (add mode) or `id` (edit mode).
  - Auto-fill `lat` and `lng` when `selectedCoords` updates via `useEffect`.

- **Form Handling**:
  - **Submit**:
    - If `editingId`: call `onUpdate({ id: editingId, ...formData })`, reset form, set `editingId = null`.
    - If adding: call `onAdd({ id: Date.now(), ...formData })`, reset form.
  - **Edit Button Click**:
    - Populate `formData` with the selected location's fields.
    - Set `editingId` to the location's id.
    - Change button label to "Update Location" with a "Cancel" option.
  - **Delete Button Click**:
    - Confirm deletion or directly call `onDelete(location.id)`.
    - If the deleted item is currently being edited, reset form.

---

### 3.4 Task 4: Map Click to Add Location (`Map.jsx`)
- In `Map.jsx`, attach a `'click'` event listener to the Leaflet map instance:
  ```javascript
  mapInstance.current.on('click', (e) => {
    const { lat, lng } = e.latlng;
    if (onMapClick) {
      onMapClick({
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4))
      });
    }
  });
  ```
- Make sure to clean up the event listener or pass a ref/handler that doesn't trigger unnecessary re-mounts.
- Visual Feedback:
  - Optionally drop a temporary marker on the clicked point indicating "New Location (Unsaved)".
  - Populate the `lat` and `lng` inputs in `LocationList` immediately so user only needs to type Name & Description and hit Add.

---

## 4. Implementation Steps & Checklist

- [x] **Step 1: Update `App.jsx`**
  - [x] Define initial locations list using existing mock data.
  - [x] Add state for `locations` and `selectedCoords`.
  - [x] Implement `handleAddLocation`, `handleUpdateLocation`, `handleDeleteLocation`, and `handleMapClick`.
  - [x] Forward states and callbacks to `Map` and `LocationList`.

- [x] **Step 2: Update `Map.jsx`**
  - [x] Add Leaflet `layerGroup` to manage markers dynamically.
  - [x] Add `useEffect` to re-render markers when `locations` changes.
  - [x] Bind informative popups (name, address/description) to each marker.
  - [x] Add Leaflet `click` event listener to notify `onMapClick(lat, lng)`.
  - [x] Clean up listeners and layers appropriately on unmount.

- [x] **Step 3: Update `LocationList.jsx`**
  - [x] Bind form inputs to controlled local state.
  - [x] Listen to changes in `selectedCoords` prop and update coordinate inputs.
  - [x] Implement Add submission.
  - [x] Implement Edit mode (populate form, toggle button to Update / Cancel).
  - [x] Implement Delete button action.
  - [x] Render the dynamic `locations` list received via props.

- [x] **Step 4: Verification and Edge Cases**
  - [x] Verify adding a location via form updates list and renders marker on map.
  - [x] Verify editing location details updates both list item and marker popup.
  - [x] Verify deleting a location removes it from list and removes its marker.
  - [x] Verify clicking anywhere on the map populates lat/lng coordinates in the form.
  - [x] Test coordinate validation (invalid strings vs numbers).
  - [x] Run `npm run lint` and `npm run build` to ensure clean code and no errors.
