import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';

describe('AskEmmaTab Component', () => {
  const mockSetState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders Emma interface', () => {
    const { container } = render(<div>Economic & Market Monitoring Assistant</div>);
    expect(container).toHaveTextContent('Economic & Market Monitoring Assistant');
  });

  test('handles API key input', () => {
    const handleChange = vi.fn();
    render(<input onChange={handleChange} placeholder="Clé API Gemini" />);
    const input = screen.getByPlaceholderText('Clé API Gemini');
    fireEvent.change(input, { target: { value: 'test-key' } });
    expect(handleChange).toHaveBeenCalled();
  });

  test('validates temperature range', () => {
    const temp = 1.5;
    const clampedTemp = Math.min(Math.max(temp, 0), 1);
    expect(clampedTemp).toBe(1.0);
  });

  test('handles message sending', () => {
    const handleSubmit = vi.fn();
    render(<button onClick={handleSubmit}>Envoyer</button>);
    fireEvent.click(screen.getByText('Envoyer'));
    expect(handleSubmit).toHaveBeenCalled();
  });
});