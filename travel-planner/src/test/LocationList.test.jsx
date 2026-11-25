import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LocationList from '../LocationList';

describe('LocationList Component', () => {
  const sampleLocations = [
    { id: 1, name: 'Marina Bay Sands', address: '10 Bayfront Ave', lat: '1.2838', lng: '103.8591' },
    { id: 2, name: 'Gardens by the Bay', address: '18 Marina Gardens Dr', lat: '1.2816', lng: '103.8636' }
  ];

  it('renders destination list correctly', () => {
    render(<LocationList locations={sampleLocations} />);

    expect(screen.getByText('Marina Bay Sands')).toBeInTheDocument();
    expect(screen.getByText('Gardens by the Bay')).toBeInTheDocument();
  });

  it('validates required name field before submission', () => {
    const handleAdd = vi.fn();
    render(<LocationList locations={sampleLocations} onAddLocation={handleAdd} />);

    fireEvent.click(screen.getByRole('button', { name: /Add Location/i }));

    expect(screen.getByText('Location name is required')).toBeInTheDocument();
    expect(handleAdd).not.toHaveBeenCalled();
  });

  it('validates coordinate boundaries for lat/lng', () => {
    const handleAdd = vi.fn();
    render(<LocationList locations={sampleLocations} onAddLocation={handleAdd} />);

    // Enter out-of-range coordinates
    fireEvent.change(screen.getByPlaceholderText('Enter location name'), { target: { value: 'Invalid Coords Spot' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., 1\.3521/), { target: { value: '150' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., 103\.8198/), { target: { value: '250' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Location/i }));

    expect(screen.getByText('Latitude must be between -90 and 90')).toBeInTheDocument();
    expect(screen.getByText('Longitude must be between -180 and 180')).toBeInTheDocument();
    expect(handleAdd).not.toHaveBeenCalled();
  });

  it('submits valid new location', () => {
    const handleAdd = vi.fn();
    render(<LocationList locations={sampleLocations} onAddLocation={handleAdd} />);

    fireEvent.change(screen.getByPlaceholderText('Enter location name'), { target: { value: 'Sentosa' } });
    fireEvent.change(screen.getByPlaceholderText('Enter address or description'), { target: { value: 'Resort Island' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., 1\.3521/), { target: { value: '1.25' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., 103\.8198/), { target: { value: '103.82' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Location/i }));

    expect(handleAdd).toHaveBeenCalledWith({
      name: 'Sentosa',
      address: 'Resort Island',
      lat: '1.25',
      lng: '103.82'
    });
  });

  it('opens confirmation modal and deletes location on confirm', () => {
    const handleDelete = vi.fn();
    render(<LocationList locations={sampleLocations} onDeleteLocation={handleDelete} />);

    const deleteButtons = screen.getAllByTitle('Delete Location');
    fireEvent.click(deleteButtons[0]);

    // Modal should be open
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this travel destination?')).toBeInTheDocument();

    // Confirm delete inside modal
    const modalConfirmBtn = screen.getByTestId('confirm-delete-btn');
    fireEvent.click(modalConfirmBtn);
    expect(handleDelete).toHaveBeenCalledWith(1);
  });

  it('cancels deletion when Cancel button in modal is clicked', () => {
    const handleDelete = vi.fn();
    render(<LocationList locations={sampleLocations} onDeleteLocation={handleDelete} />);

    const deleteButtons = screen.getAllByTitle('Delete Location');
    fireEvent.click(deleteButtons[0]);

    // Modal should be open
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();

    // Cancel delete
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(handleDelete).not.toHaveBeenCalled();
  });

  it('populates form and allows editing an existing location', () => {
    const handleUpdate = vi.fn();
    render(<LocationList locations={sampleLocations} onUpdateLocation={handleUpdate} />);

    const editButtons = screen.getAllByTitle('Edit Location');
    fireEvent.click(editButtons[0]);

    expect(screen.getByDisplayValue('Marina Bay Sands')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update Location/i })).toBeInTheDocument();

    // Change name and submit
    fireEvent.change(screen.getByPlaceholderText('Enter location name'), { target: { value: 'MBS Updated' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Location/i }));

    expect(handleUpdate).toHaveBeenCalledWith({
      id: 1,
      name: 'MBS Updated',
      address: '10 Bayfront Ave',
      lat: '1.2838',
      lng: '103.8591'
    });
  });
});
