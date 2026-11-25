import { useState, useEffect } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import Map from "./Map"
import LocationList from "./LocationList"
import "./App.css"

const STORAGE_KEY = "travel_planner_locations"

const initialLocations = [
  { id: 1, name: 'Marina Bay Sands', address: '10 Bayfront Ave, Singapore 018956', lat: '1.2838', lng: '103.8591' },
  { id: 2, name: 'Gardens by the Bay', address: '18 Marina Gardens Dr, Singapore 018953', lat: '1.2816', lng: '103.8636' },
  { id: 3, name: 'Singapore Zoo', address: '80 Mandai Lake Rd, Singapore 729826', lat: '1.4043', lng: '103.7930' },
  { id: 4, name: 'Sentosa Island', address: 'Sentosa Island, Singapore 099981', lat: '1.2494', lng: '103.8303' },
  { id: 5, name: 'Chinatown', address: 'Chinatown, Singapore', lat: '1.2838', lng: '103.8434' }
]

export default function App() {
  const [locations, setLocations] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          return parsed
        }
      }
    } catch (e) {
      console.error("Failed to load locations from localStorage", e)
    }
    return initialLocations
  })

  const [selectedCoords, setSelectedCoords] = useState(null)
  const [searchPrefill, setSearchPrefill] = useState(null)
  const [activeLocation, setActiveLocation] = useState(null)

  // Persist locations state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations))
    } catch (e) {
      console.error("Failed to save locations to localStorage", e)
    }
  }, [locations])

  const handleAddLocation = (newLocation) => {
    const locationWithId = {
      ...newLocation,
      id: newLocation.id || Date.now()
    }
    setLocations((prev) => [...prev, locationWithId])
    setSelectedCoords(null)
    setSearchPrefill(null)
    setActiveLocation(locationWithId)
  }

  const handleUpdateLocation = (updatedLocation) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === updatedLocation.id ? updatedLocation : loc))
    )
    setActiveLocation(updatedLocation)
  }

  const handleDeleteLocation = (id) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== id))
    if (activeLocation?.id === id) {
      setActiveLocation(null)
    }
  }

  const handleMapClick = (coords) => {
    setSelectedCoords(coords)
    setSearchPrefill(null)
  }

  const handleSearchResultSelect = (result) => {
    setSelectedCoords({ lat: result.lat, lng: result.lng })
    setSearchPrefill({
      name: result.name,
      address: result.address
    })
  }

  const handleSelectLocation = (location) => {
    setActiveLocation(location)
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">Travel Planner</h1>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="map-container">
            <Map
              locations={locations}
              onMapClick={handleMapClick}
              selectedCoords={selectedCoords}
              activeLocation={activeLocation}
              onSearchResultSelect={handleSearchResultSelect}
            />
          </div>
        </div>
        <div className="col-lg-4">
          <LocationList
            locations={locations}
            activeLocation={activeLocation}
            onSelectLocation={handleSelectLocation}
            onAddLocation={handleAddLocation}
            onUpdateLocation={handleUpdateLocation}
            onDeleteLocation={handleDeleteLocation}
            selectedCoords={selectedCoords}
            searchPrefill={searchPrefill}
            onClearSelectedCoords={() => {
              setSelectedCoords(null)
              setSearchPrefill(null)
            }}
          />
        </div>
      </div>
    </div>
  )
}
