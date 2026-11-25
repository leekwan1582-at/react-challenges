import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders application with initial Singapore landmarks', () => {
    render(<App />);

    expect(screen.getByText('Travel Planner')).toBeInTheDocument();
    expect(screen.getByText('Marina Bay Sands')).toBeInTheDocument();
    expect(screen.getByText('Gardens by the Bay')).toBeInTheDocument();
  });

  it('persists added destination to localStorage', () => {
    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('Enter location name'), { target: { value: 'Jurong Bird Park' } });
    fireEvent.change(screen.getByPlaceholderText('Enter address or description'), { target: { value: 'Jurong West' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., 1\.3521/), { target: { value: '1.318' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., 103\.8198/), { target: { value: '103.706' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Location/i }));

    expect(screen.getAllByText('Jurong Bird Park').length).toBeGreaterThan(0);

    const stored = JSON.parse(localStorage.getItem('travel_planner_locations'));
    expect(stored.some(l => l.name === 'Jurong Bird Park')).toBe(true);
  });
});
