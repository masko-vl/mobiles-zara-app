import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Navbar } from './Navbar';

function renderNavbar(cartCount: number) {
  return render(
    <MemoryRouter>
      <Navbar cartCount={cartCount} />
    </MemoryRouter>,
  );
}

describe('Navbar', () => {
  it('links the logo to the home route', () => {
    renderNavbar(0);

    const logo = screen.getByRole('link', { name: 'Smartphones store, go to home page' });
    expect(logo).toHaveAttribute('href', '/');
  });

  it('links to the cart with an accessible count label', () => {
    renderNavbar(3);

    expect(screen.getByRole('link', { name: 'Shopping cart, 3 items' })).toHaveAttribute(
      'href',
      '/cart',
    );
  });

  it('uses a singular label for a single item', () => {
    renderNavbar(1);

    expect(screen.getByRole('link', { name: 'Shopping cart, 1 item' })).toBeInTheDocument();
  });
});
