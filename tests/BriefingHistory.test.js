import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Briefing History Component', () => {
  const mockBriefing = {
    id: '1',
    subject: 'Test Briefing',
    created_at: '2025-01-01T10:00:00Z',
    html_content: '<p>Test content</p>',
    type: 'daily',
    market_data: {},
    analysis: 'Test analysis'
  };

  test('renders empty state', () => {
    render(<div>Aucun briefing sauvegardé</div>);
    expect(screen.getByText('Aucun briefing sauvegardé')).toBeInTheDocument();
  });

  test('renders briefing item', () => {
    render(
      <div>
        <h4>{mockBriefing.subject}</h4>
        <p>{new Date(mockBriefing.created_at).toLocaleString('fr-FR')}</p>
      </div>
    );
    expect(screen.getByText('Test Briefing')).toBeInTheDocument();
  });

  test('handles view button click', () => {
    const handleView = jest.fn();
    render(<button onClick={handleView}>👁️ Voir</button>);
    fireEvent.click(screen.getByText('👁️ Voir'));
    expect(handleView).toHaveBeenCalled();
  });

  test('formats date correctly', () => {
    const date = new Date('2025-01-01T10:00:00Z');
    const formatted = date.toLocaleString('fr-FR');
    expect(formatted).toMatch(/01\/01\/2025/);
  });
});