import { useEffect, useRef, useCallback, useState } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon URLs when bundled by Vite
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl
});

export default function MapView({
  locations = [],
  onMapClick,
  selectedCoords = null,
  activeLocation = null,
  onSearchResultSelect
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayerRef = useRef(null);
  const markersByIdRef = useRef(new window.Map());
  const selectedMarkerRef = useRef(null);
  const onMapClickRef = useRef(onMapClick);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // Keep latest callback ref to prevent unnecessary map reinitialization
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fit map view to bounds of all current markers
  const fitAllMarkers = useCallback(() => {
    if (!mapInstance.current || !markersLayerRef.current) return;

    const layers = markersLayerRef.current.getLayers();
    if (layers.length === 0) return;

    const group = L.featureGroup(layers);
    mapInstance.current.fitBounds(group.getBounds(), {
      padding: [40, 40],
      maxZoom: 15
    });
  }, []);

  // Helper to fetch results from Nominatim
  const fetchNominatim = async (queryText) => {
    const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryText)}&format=json&limit=5&accept-language=zh-CN,en`;
    const response = await fetch(endpoint, {
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  // Search handler with smart query fallback (e.g. "双廊古镇" -> "双廊" / "双廊镇")
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      // 1. Direct query
      let results = await fetchNominatim(query);

      // 2. Fallback normalization for Chinese town/scenic suffixes (e.g. "双廊古镇" -> "双廊")
      if (results.length === 0) {
        const fallbacks = [];
        if (query.endsWith("古镇") && query.length > 2) {
          const baseName = query.slice(0, -2); // e.g. "双廊"
          fallbacks.push(baseName);
          fallbacks.push(`${baseName}镇`);
        } else if (query.endsWith("古城") && query.length > 2) {
          const baseName = query.slice(0, -2);
          fallbacks.push(baseName);
          fallbacks.push(`${baseName}市`);
        } else if (query.endsWith("镇") && query.length > 1) {
          fallbacks.push(query.slice(0, -1));
        }

        for (const fb of fallbacks) {
          results = await fetchNominatim(fb);
          if (results.length > 0) break;
        }
      }

      if (results.length > 0) {
        setSearchResults(results);
        setShowDropdown(true);
      } else {
        setSearchError("No locations found. Try searching without suffixes (e.g. 双廊, 喜洲, 大理)");
        setShowDropdown(true);
      }
    } catch (err) {
      setSearchError("Search service unavailable. Please check connection.");
      setShowDropdown(true);
      console.error("Geocoding search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select a search result
  const handleSelectResult = (result) => {
    const lat = parseFloat(parseFloat(result.lat).toFixed(4));
    const lng = parseFloat(parseFloat(result.lon).toFixed(4));
    const name = result.name || result.display_name.split(",")[0].trim();
    const address = result.display_name;

    setShowDropdown(false);

    // Fly to location on map
    if (mapInstance.current) {
      mapInstance.current.flyTo([lat, lng], 15, { duration: 1.5 });
    }

    // Notify parent to set selectedCoords and auto-fill form
    if (onSearchResultSelect) {
      onSearchResultSelect({
        name,
        address,
        lat,
        lng
      });
    } else if (onMapClickRef.current) {
      onMapClickRef.current({ lat, lng });
    }
  };

  useEffect(() => {
    // Only initialize the map once when the component mounts
    if (!mapInstance.current && mapRef.current) {
      // Create map instance
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: true,
        preferCanvas: true
      }).setView([1.3521, 103.8198], 13); // Centered on Singapore
      
      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: 0
      }).addTo(mapInstance.current);

      // Layer group to hold dynamic location markers
      markersLayerRef.current = L.layerGroup().addTo(mapInstance.current);

      // Add click event listener to notify map clicks
      mapInstance.current.on('click', (e) => {
        if (onMapClickRef.current) {
          const lat = parseFloat(e.latlng.lat.toFixed(4));
          const lng = parseFloat(e.latlng.lng.toFixed(4));
          onMapClickRef.current({ lat, lng });
        }
      });

      // Force a resize event to ensure the map fills its container
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 0);
    }

    // Handle window resize
    const handleResize = () => {
      if (mapInstance.current) {
        setTimeout(() => {
          mapInstance.current.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function to remove map instance and event listener when component unmounts
    const markersMap = markersByIdRef.current;
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersLayerRef.current = null;
        selectedMarkerRef.current = null;
        markersMap.clear();
      }
    };
  }, []);

  // Update markers whenever locations changes
  useEffect(() => {
    if (!mapInstance.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    markersByIdRef.current.clear();

    locations.forEach((location) => {
      const lat = parseFloat(location.lat);
      const lng = parseFloat(location.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        const title = location.name || "Untitled Location";
        const description = location.address || location.description || "";
        const popupContent = `
          <div>
            <strong>${title}</strong>
            ${description ? `<br/><small>${description}</small>` : ""}
            <br/><small class="text-muted">${lat}, ${lng}</small>
          </div>
        `;

        const marker = L.marker([lat, lng])
          .addTo(markersLayerRef.current)
          .bindPopup(popupContent);

        markersByIdRef.current.set(location.id, marker);
      }
    });
  }, [locations]);

  // Fly to active location when selected from list
  useEffect(() => {
    if (!mapInstance.current || !activeLocation) return;

    const lat = parseFloat(activeLocation.lat);
    const lng = parseFloat(activeLocation.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      mapInstance.current.flyTo([lat, lng], 15, {
        duration: 1.2
      });

      const targetMarker = markersByIdRef.current.get(activeLocation.id);
      if (targetMarker) {
        targetMarker.openPopup();
      }
    }
  }, [activeLocation]);

  // Visual indicator for selected coordinates from map click or search
  useEffect(() => {
    if (!mapInstance.current) return;

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    if (selectedCoords) {
      const lat = parseFloat(selectedCoords.lat);
      const lng = parseFloat(selectedCoords.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        selectedMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 8,
          color: '#0d6efd',
          fillColor: '#0d6efd',
          fillOpacity: 0.6
        })
          .addTo(mapInstance.current)
          .bindPopup('Selected location: ' + lat + ', ' + lng)
          .openPopup();
      }
    }
  }, [selectedCoords]);

  return (
    <div className="position-relative h-100 w-100">
      {/* Search on Map input overlay */}
      <div 
        ref={searchContainerRef}
        className="position-absolute"
        style={{
          top: '12px',
          left: '50px',
          width: '320px',
          maxWidth: 'calc(100% - 180px)',
          zIndex: 1000
        }}
      >
        <form onSubmit={handleSearch} className="input-group shadow-sm">
          <input 
            type="text"
            className="form-control form-control-sm bg-white"
            placeholder="Search map (e.g. 喜洲古镇)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search destination"
          />
          <button 
            type="submit" 
            className="btn btn-primary btn-sm"
            disabled={isSearching}
            title="Search destination"
          >
            {isSearching ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <i className="fas fa-search"></i>
            )}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {showDropdown && (
          <div 
            className="list-group shadow position-absolute w-100 mt-1"
            style={{ maxHeight: '250px', overflowY: 'auto', zIndex: 1001 }}
          >
            {searchError ? (
              <div className="list-group-item list-group-item-light small text-danger py-2">
                {searchError}
              </div>
            ) : (
              searchResults.map((item) => (
                <button
                  key={item.place_id}
                  type="button"
                  className="list-group-item list-group-item-action text-start py-2"
                  onClick={() => handleSelectResult(item)}
                >
                  <strong className="d-block text-truncate small">
                    {item.name || item.display_name.split(",")[0]}
                  </strong>
                  <small className="text-muted d-block text-truncate" style={{ fontSize: '0.75rem' }}>
                    {item.display_name}
                  </small>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Map DOM Element */}
      <div 
        ref={mapRef} 
        style={{ 
          height: '100%',
          width: '100%',
          minHeight: '500px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />

      {/* Fit All Destinations Button */}
      {locations.length > 0 && (
        <button
          type="button"
          onClick={fitAllMarkers}
          className="btn btn-light btn-sm position-absolute shadow-sm"
          style={{
            top: '12px',
            right: '12px',
            zIndex: 1000,
            opacity: 0.95
          }}
          title="Fit map view to display all destination markers"
        >
          <i className="fas fa-compress-arrows-alt me-1 text-primary"></i>
          Fit All Destinations
        </button>
      )}
    </div>
  );
}

MapView.propTypes = {
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      address: PropTypes.string,
      description: PropTypes.string,
      lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ),
  onMapClick: PropTypes.func,
  selectedCoords: PropTypes.shape({
    lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  activeLocation: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    address: PropTypes.string,
    description: PropTypes.string,
    lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  onSearchResultSelect: PropTypes.func
};
