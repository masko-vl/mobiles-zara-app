import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { usePhones } from '../../hooks/usePhones';
import { SEARCH_DEBOUNCE_MS } from '../../hooks/usePhoneSearch';
import { searchPhones } from '../../services/phoneService';
import type { PhoneSummary } from '../../models/phone';
import { PhoneListView } from '.';

vi.mock('../../hooks/usePhones', () => ({ usePhones: vi.fn() }));
vi.mock('../../services/phoneService', () => ({ searchPhones: vi.fn() }));

const mockedUsePhones = vi.mocked(usePhones);
const mockedSearchPhones = vi.mocked(searchPhones);

function makeSummaries(count: number): PhoneSummary[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `P${i}`,
    brand: 'Brand',
    name: `Phone ${i}`,
    basePrice: 100 + i,
    imageUrl: `https://host/images/p${i}.webp`,
  }));
}

function mockState(overrides: Partial<ReturnType<typeof usePhones>> = {}) {
  mockedUsePhones.mockReturnValue({
    phones: [],
    loading: false,
    error: null,
    retry: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PhoneListView', () => {
  it('shows a loading status while fetching, with no grid yet', () => {
    mockState({ loading: true });

    render(
      <MemoryRouter>
        <PhoneListView />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(/loading smartphones/i);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders one card per phone and the results counter', () => {
    mockState({ phones: makeSummaries(3) });

    render(
      <MemoryRouter>
        <PhoneListView />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('link', { name: /Brand Phone/ })).toHaveLength(3);
    expect(screen.getByText('3 results')).toBeInTheDocument();
  });

  it('shows an error alert with a working retry button when the fetch fails', async () => {
    const retry = vi.fn();
    mockState({ error: new Error('Network request failed.'), retry });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PhoneListView />
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('lets the user type into the labelled search field', async () => {
    const user = userEvent.setup();
    mockState({ phones: makeSummaries(1) });

    render(
      <MemoryRouter>
        <PhoneListView />
      </MemoryRouter>,
    );
    const input = screen.getByLabelText('Search for a smartphone');
    await user.type(input, 'galaxy');

    expect(input).toHaveValue('galaxy');
  });

  it('searches through the API after the debounce and shows the results', async () => {
    vi.useFakeTimers();
    mockedSearchPhones.mockResolvedValue([
      {
        id: 'SMG-S24U',
        brand: 'Samsung',
        name: 'Galaxy S24 Ultra',
        basePrice: 1329,
        imageUrl: 'https://host/images/s24.webp',
      },
    ]);

    render(
      <MemoryRouter>
        <PhoneListView />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Search for a smartphone'), {
      target: { value: 'galaxy' },
    });

    // Debounced: no API call while the timer is still running.
    expect(mockedSearchPhones).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });

    expect(mockedSearchPhones).toHaveBeenCalledTimes(1);
    expect(mockedSearchPhones).toHaveBeenCalledWith('galaxy', expect.any(AbortSignal));
    expect(screen.getByText('1 results')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Galaxy S24 Ultra/ })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows an empty-state message when the search returns no results', async () => {
    vi.useFakeTimers();
    mockedSearchPhones.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <PhoneListView />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Search for a smartphone'), {
      target: { value: 'zzzz' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });

    expect(screen.getByText('0 results')).toBeInTheDocument();
    expect(screen.getByText(/no phones found/i)).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument(); // empty grid, no crash

    vi.useRealTimers();
  });

  it('clearing the search restores the base list without a new search request', async () => {
    vi.useFakeTimers();
    mockedSearchPhones.mockResolvedValue([]);
    mockState({ phones: makeSummaries(20) });

    render(
      <MemoryRouter>
        <PhoneListView />
      </MemoryRouter>,
    );
    const input = screen.getByLabelText('Search for a smartphone');
    fireEvent.change(input, { target: { value: 'galaxy' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    expect(mockedSearchPhones).toHaveBeenCalledTimes(1); // the 'galaxy' search

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(mockedSearchPhones).toHaveBeenCalledTimes(1); // no extra request

    // The debounce still holds 'galaxy' for another cycle before the view
    // falls back to the base list.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    expect(screen.getByText('20 results')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
