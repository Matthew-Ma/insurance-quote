/**
 * Tests for ErrorBoundary component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(console.error).mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error boundary UI when child component throws', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('renders custom fallback if provided', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('has accessible alert role', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('resets the boundary when the user chooses Try Again', () => {
    function ThrowOnDemand() {
      const [shouldThrow, setShouldThrow] = useState(false);
      if (shouldThrow) {
        throw new Error('Recoverable error');
      }
      return (
        <button onClick={() => setShouldThrow(true)}>Trigger error</button>
      );
    }

    render(
      <ErrorBoundary>
        <ThrowOnDemand />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger error' }));
    expect(screen.getByText('Recoverable error')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      screen.getByRole('button', { name: 'Trigger error' }),
    ).toBeInTheDocument();
  });
});
