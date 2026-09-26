import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders a labelled input with no clear button while empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Search for a smartphone')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('shows a clear button once the user types, and clearing resets and refocuses', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<SearchBar value="galaxy" onChange={handleChange} />);

    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    await user.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
    // Refocusing keeps keyboard users in the field after the button unmounts.
    expect(screen.getByLabelText('Search for a smartphone')).toHaveFocus();

    rerender(<SearchBar value="" onChange={handleChange} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('reports every keystroke through onChange', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onChange={handleChange} />);

    await user.type(screen.getByLabelText('Search for a smartphone'), 'a');

    expect(handleChange).toHaveBeenLastCalledWith('a');
  });
});
