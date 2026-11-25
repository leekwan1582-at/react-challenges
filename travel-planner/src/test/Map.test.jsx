import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MapView from '../Map';

describe('MapView Search on Map', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders search input on map', () => {
    render(<MapView locations={[]} />);
    expect(screen.getByPlaceholderText(/Search map/i)).toBeInTheDocument();
  });

  it('fetches and displays search results for Chinese locations like 喜洲古镇', async () => {
    const mockResults = [
      {
        place_id: 12345,
        lat: '25.8565',
        lon: '100.1300',
        name: '喜洲古镇',
        display_name: '喜洲古镇, 大理市, 云南省, 中国'
      }
    ];

    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResults
    });

    const handleSearchResultSelect = vi.fn();
    render(<MapView locations={[]} onSearchResultSelect={handleSearchResultSelect} />);

    const searchInput = screen.getByPlaceholderText(/Search map/i);
    fireEvent.change(searchInput, { target: { value: '喜洲古镇' } });

    const searchButton = screen.getByTitle('Search destination');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('喜洲古镇, 大理市, 云南省, 中国')).toBeInTheDocument();
    });

    // Clicking the result item selects it
    fireEvent.click(screen.getByText('喜洲古镇, 大理市, 云南省, 中国'));

    expect(handleSearchResultSelect).toHaveBeenCalledWith({
      name: '喜洲古镇',
      address: '喜洲古镇, 大理市, 云南省, 中国',
      lat: 25.8565,
      lng: 100.1300
    });
  });

  it('falls back to base name when query with 古镇 suffix yields no direct results (e.g. 双廊古镇 -> 双廊)', async () => {
    window.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes(encodeURIComponent('双廊古镇'))) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.includes(encodeURIComponent('双廊'))) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              place_id: 99999,
              lat: '25.9183',
              lon: '100.1914',
              name: '双廊',
              display_name: '双廊, 大理市, 大理白族自治州, 云南省, 671009, 中国'
            }
          ]
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const handleSearchResultSelect = vi.fn();
    render(<MapView locations={[]} onSearchResultSelect={handleSearchResultSelect} />);

    const searchInput = screen.getByPlaceholderText(/Search map/i);
    fireEvent.change(searchInput, { target: { value: '双廊古镇' } });
    fireEvent.click(screen.getByTitle('Search destination'));

    await waitFor(() => {
      expect(screen.getByText('双廊, 大理市, 大理白族自治州, 云南省, 671009, 中国')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('双廊, 大理市, 大理白族自治州, 云南省, 671009, 中国'));

    expect(handleSearchResultSelect).toHaveBeenCalledWith({
      name: '双廊',
      address: '双廊, 大理市, 大理白族自治州, 云南省, 671009, 中国',
      lat: 25.9183,
      lng: 100.1914
    });
  });

  it('handles search not found gracefully', async () => {
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(<MapView locations={[]} />);

    const searchInput = screen.getByPlaceholderText(/Search map/i);
    fireEvent.change(searchInput, { target: { value: 'UnknownPlaceXYZ' } });
    fireEvent.click(screen.getByTitle('Search destination'));

    await waitFor(() => {
      expect(screen.getByText(/No locations found/i)).toBeInTheDocument();
    });
  });
});
