import '@testing-library/jest-dom';

// Mock Leaflet global object for tests where Map component is rendered
if (typeof window !== 'undefined') {
  const dummyLayer = {
    addTo: () => dummyLayer,
    bindPopup: () => dummyLayer,
    openPopup: () => dummyLayer,
    remove: () => {},
  };

  const dummyLayerGroup = {
    addTo: () => dummyLayerGroup,
    clearLayers: () => {},
    getLayers: () => [dummyLayer],
  };

  window.L = {
    map: () => ({
      setView: function() { return this; },
      on: () => {},
      remove: () => {},
      invalidateSize: () => {},
      flyTo: () => {},
      fitBounds: () => {},
    }),
    tileLayer: () => ({
      addTo: () => {},
    }),
    layerGroup: () => dummyLayerGroup,
    featureGroup: () => ({
      getBounds: () => ({
        pad: () => {},
      }),
    }),
    marker: () => dummyLayer,
    circleMarker: () => dummyLayer,
  };
}
