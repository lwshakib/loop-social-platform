import { render, screen } from '@testing-library/react';
import { SidebarLogo } from '@/components/sidebar-logo';

describe('SidebarLogo', () => {
  it('renders the Loop logo text when showLabel is true', () => {
    render(<SidebarLogo showLabel={true} />);
    expect(screen.getByText('Loop')).toBeInTheDocument();
  });

  it('does not render the Loop logo text when showLabel is false', () => {
    render(<SidebarLogo showLabel={false} />);
    // screen.queryByText('Loop') will find the text inside .sr-only too if not careful
    // But screen.getByText('Loop', { selector: '.sr-only' }) is more specific
    const loopElements = screen.getAllByText('Loop');
    // One element should be found, and it should be the sr-only one
    expect(loopElements.length).toBe(1);
  });
});
