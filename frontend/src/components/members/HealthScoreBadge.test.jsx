import { render, screen } from '@testing-library/react';
import HealthScoreBadge from './HealthScoreBadge';

describe('HealthScoreBadge', () => {
  it('shows "Active" for score >= 75', () => {
    render(<HealthScoreBadge status="active" score={80} />);

    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it('shows "At Risk" for at_risk status', () => {
    render(<HealthScoreBadge status="at_risk" score={30} />);

    expect(screen.getByText(/at risk/i)).toBeInTheDocument();
  });

  it('shows "Drifting" for drifting status', () => {
    render(<HealthScoreBadge status="drifting" score={60} />);

    expect(screen.getByText(/drifting/i)).toBeInTheDocument();
  });
});
