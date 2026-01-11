/**
 * Tests pour les Composants du Design System
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

describe('Button Component', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gob-primary');

    rerender(<Button variant="danger">Danger</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gob-danger');
  });

  it('should apply size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('should show loading state', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});

describe('Card Component', () => {
  it('should render with children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<Card variant="default">Default</Card>);
    let card = screen.getByText('Default').parentElement;
    expect(card).toHaveClass('bg-gob-bg-secondary');

    rerender(<Card variant="elevated">Elevated</Card>);
    card = screen.getByText('Elevated').parentElement;
    expect(card).toHaveClass('shadow-gob-lg');
  });

  it('should apply padding classes', () => {
    const { rerender } = render(<Card padding="sm">Small</Card>);
    let card = screen.getByText('Small').parentElement;
    expect(card).toHaveClass('p-2');

    rerender(<Card padding="lg">Large</Card>);
    card = screen.getByText('Large').parentElement;
    expect(card).toHaveClass('p-6');
  });
});
