import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const initialFormState = {
  name: '',
  address: '',
  lat: '',
  lng: ''
};

export default function LocationList({
  locations = [],
  activeLocation = null,
  onSelectLocation,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  selectedCoords = null,
  searchPrefill = null,
  onClearSelectedCoords
}) {
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [locationToDelete, setLocationToDelete] = useState(null);

  // Update form coordinates when map is clicked
  useEffect(() => {
    if (selectedCoords) {
      setFormData((prev) => ({
        ...prev,
        lat: selectedCoords.lat?.toString() ?? '',
        lng: selectedCoords.lng?.toString() ?? ''
      }));
      setErrors((prev) => ({ ...prev, lat: '', lng: '' }));
    }
  }, [selectedCoords]);

  // Update form name & address if prefilled from map search
  useEffect(() => {
    if (searchPrefill) {
      setFormData((prev) => ({
        ...prev,
        name: searchPrefill.name || prev.name,
        address: searchPrefill.address || prev.address
      }));
      setErrors((prev) => ({ ...prev, name: '' }));
    }
  }, [searchPrefill]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleEditClick = (e, location) => {
    e.stopPropagation();
    setEditingId(location.id);
    setErrors({});
    setFormData({
      name: location.name || '',
      address: location.address || location.description || '',
      lat: location.lat?.toString() || '',
      lng: location.lng?.toString() || ''
    });
    if (onSelectLocation) {
      onSelectLocation(location);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setErrors({});
    setFormData(initialFormState);
    if (onClearSelectedCoords) {
      onClearSelectedCoords();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Location name is required';
    }

    // Validate Latitude if provided
    if (formData.lat.trim()) {
      const latNum = Number(formData.lat);
      if (isNaN(latNum)) {
        newErrors.lat = 'Latitude must be a valid number';
      } else if (latNum < -90 || latNum > 90) {
        newErrors.lat = 'Latitude must be between -90 and 90';
      }
    }

    // Validate Longitude if provided
    if (formData.lng.trim()) {
      const lngNum = Number(formData.lng);
      if (isNaN(lngNum)) {
        newErrors.lng = 'Longitude must be a valid number';
      } else if (lngNum < -180 || lngNum > 180) {
        newErrors.lng = 'Longitude must be between -180 and 180';
      }
    }

    // If one coordinate is filled, require the other
    if ((formData.lat.trim() && !formData.lng.trim()) || (!formData.lat.trim() && formData.lng.trim())) {
      if (!formData.lat.trim()) newErrors.lat = 'Both latitude and longitude are required';
      if (!formData.lng.trim()) newErrors.lng = 'Both latitude and longitude are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      lat: formData.lat.trim(),
      lng: formData.lng.trim()
    };

    if (editingId !== null) {
      if (onUpdateLocation) {
        onUpdateLocation({
          id: editingId,
          ...payload
        });
      }
      setEditingId(null);
    } else {
      if (onAddLocation) {
        onAddLocation(payload);
      }
    }

    setFormData(initialFormState);
    setErrors({});
    if (onClearSelectedCoords) {
      onClearSelectedCoords();
    }
  };

  const promptDelete = (e, location) => {
    e.stopPropagation();
    setLocationToDelete(location);
  };

  const confirmDelete = () => {
    if (!locationToDelete) return;
    const targetId = locationToDelete.id;
    if (editingId === targetId) {
      handleCancelEdit();
    }
    if (onDeleteLocation) {
      onDeleteLocation(targetId);
    }
    setLocationToDelete(null);
  };

  const cancelDelete = () => {
    setLocationToDelete(null);
  };

  const handleItemClick = (location) => {
    if (onSelectLocation) {
      onSelectLocation(location);
    }
  };

  const isEditing = editingId !== null;

  return (
    <div className="location-list position-relative">
      <h3 className="mb-4">My Travel Destinations</h3>
      
      {/* Add / Edit Location Section */}
      <form onSubmit={handleSubmit} className="mb-4 p-3 bg-light rounded" noValidate>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{isEditing ? 'Edit Location' : 'Add New Location'}</h5>
          {selectedCoords && !isEditing && (
            <span className="badge bg-info text-dark">Coords filled from map</span>
          )}
        </div>
        
        <div className="mb-3">
          <label className="form-label mb-1">Name</label>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`form-control ${errors.name ? 'is-invalid' : ''}`} 
            placeholder="Enter location name"
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>
        
        <div className="mb-3">
          <label className="form-label mb-1">Address / Description</label>
          <input 
            type="text" 
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="form-control" 
            placeholder="Enter address or description"
          />
        </div>
        
        <div className="row g-2 mb-3">
          <div className="col">
            <label className="form-label mb-1">Latitude</label>
            <input 
              type="text" 
              name="lat"
              value={formData.lat}
              onChange={handleChange}
              className={`form-control ${errors.lat ? 'is-invalid' : ''}`} 
              placeholder="e.g., 1.3521 (-90 to 90)"
            />
            {errors.lat && <div className="invalid-feedback">{errors.lat}</div>}
          </div>
          <div className="col">
            <label className="form-label mb-1">Longitude</label>
            <input 
              type="text" 
              name="lng"
              value={formData.lng}
              onChange={handleChange}
              className={`form-control ${errors.lng ? 'is-invalid' : ''}`} 
              placeholder="e.g., 103.8198 (-180 to 180)"
            />
            {errors.lng && <div className="invalid-feedback">{errors.lng}</div>}
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <button type="submit" className={`btn ${isEditing ? 'btn-success' : 'btn-primary'} w-100`}>
            <i className={`fas ${isEditing ? 'fa-check' : 'fa-plus-circle'} me-2`}></i>
            {isEditing ? 'Update Location' : 'Add Location'}
          </button>
          {isEditing && (
            <button 
              type="button" 
              onClick={handleCancelEdit} 
              className="btn btn-outline-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Locations List */}
      <div className="list-group">
        {locations.length === 0 ? (
          <div className="list-group-item text-center text-muted py-3">
            No locations saved yet. Click on the map or use the form above to add one!
          </div>
        ) : (
          locations.map(location => {
            const isSelected = activeLocation?.id === location.id;
            return (
              <div 
                key={location.id} 
                onClick={() => handleItemClick(location)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleItemClick(location);
                  }
                }}
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                  isSelected ? 'active text-white' : ''
                } ${editingId === location.id ? 'border-warning' : ''}`}
                style={{ cursor: 'pointer' }}
                title="Click to view and fly to this location on the map"
              >
                <div>
                  <h6 className={`mb-1 ${isSelected ? 'text-white' : ''}`}>
                    <i className="fas fa-map-marker-alt me-2 text-danger"></i>
                    {location.name}
                  </h6>
                  {(location.address || location.description) && (
                    <small className={`d-block ${isSelected ? 'text-white-50' : 'text-muted'}`}>
                      {location.address || location.description}
                    </small>
                  )}
                  {(location.lat || location.lng) && (
                    <small className={isSelected ? 'text-white-50' : 'text-muted'}>
                      {location.lat}, {location.lng}
                    </small>
                  )}
                </div>
                <div className="btn-group btn-group-sm">
                  <button 
                    type="button"
                    className={`btn ${editingId === location.id ? 'btn-warning' : isSelected ? 'btn-light' : 'btn-outline-primary'}`}
                    title="Edit Location"
                    onClick={(e) => handleEditClick(e, location)}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    type="button"
                    className={`btn ${isSelected ? 'btn-danger text-white' : 'btn-outline-danger'}`}
                    title="Delete Location"
                    onClick={(e) => promptDelete(e, location)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bootstrap Confirmation Modal for Delete */}
      {locationToDelete && (
        <>
          <div 
            className="modal fade show d-block" 
            tabIndex="-1" 
            role="dialog"
            aria-modal="true"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1055 }}
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content shadow border-0">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Confirm Delete
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    aria-label="Close"
                    onClick={cancelDelete}
                  ></button>
                </div>
                <div className="modal-body py-4">
                  <p className="mb-1">Are you sure you want to delete this travel destination?</p>
                  <div className="p-3 bg-light rounded mt-3 border">
                    <strong className="d-block">{locationToDelete.name}</strong>
                    {locationToDelete.address && (
                      <small className="text-muted d-block">{locationToDelete.address}</small>
                    )}
                    {locationToDelete.lat && locationToDelete.lng && (
                      <small className="text-muted">{locationToDelete.lat}, {locationToDelete.lng}</small>
                    )}
                  </div>
                  <small className="text-danger d-block mt-2">
                    <i className="fas fa-info-circle me-1"></i>
                    This action will also remove the marker from the map.
                  </small>
                </div>
                <div className="modal-footer bg-light">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={cancelDelete}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    data-testid="confirm-delete-btn"
                    onClick={confirmDelete}
                  >
                    <i className="fas fa-trash me-1"></i>
                    Delete Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

LocationList.propTypes = {
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
  activeLocation: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    address: PropTypes.string,
    description: PropTypes.string,
    lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  onSelectLocation: PropTypes.func,
  onAddLocation: PropTypes.func,
  onUpdateLocation: PropTypes.func,
  onDeleteLocation: PropTypes.func,
  selectedCoords: PropTypes.shape({
    lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  searchPrefill: PropTypes.shape({
    name: PropTypes.string,
    address: PropTypes.string
  }),
  onClearSelectedCoords: PropTypes.func
};
