import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders loading spinner correctly', () => {
    render(<LoadingSpinner />);
    
    // Check if the spinner is rendered
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    
    // Check if the loading text is present
    const loadingText = screen.getByText('Loading...');
    expect(loadingText).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('applies correct CSS classes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('flex', 'items-center', 'justify-center', 'p-8');
  });
});
