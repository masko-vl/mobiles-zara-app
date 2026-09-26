import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PhoneCard } from './PhoneCard';
import type { PhoneSummary } from '../../models/phone';

const phone: PhoneSummary = {
  id: 'SMG-S24U',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  basePrice: 1329,
  imageUrl: 'https://host/images/s24.webp',
};

function renderCard() {
  return render(
    <MemoryRouter>
      <PhoneCard phone={phone} />
    </MemoryRouter>,
  );
}

describe('PhoneCard', () => {
  it('renders the whole card as one accessible link to the detail route', () => {
    renderCard();

    const link = screen.getByRole('link', {
      name: 'Samsung Galaxy S24 Ultra, 1329 EUR',
    });
    expect(link).toHaveAttribute('href', '/product/SMG-S24U');
  });

  it('shows brand, name and price, and keeps the image decorative', () => {
    renderCard();

    const link = screen.getByRole('link', {
      name: 'Samsung Galaxy S24 Ultra, 1329 EUR',
    });
    expect(within(link).getByText('Samsung')).toBeInTheDocument();
    expect(within(link).getByText('Galaxy S24 Ultra')).toBeInTheDocument();
    expect(within(link).getByText('1329 EUR')).toBeInTheDocument();
    // An img with alt="" is exposed as "presentation" (decorative), never
    // announced as an image on top of the link label.
    const image = within(link).getByRole('presentation');
    expect(image).toHaveAttribute('alt', '');
  });
});
