import { render, screen } from '@testing-library/react';
import { SidebarLogo } from '@/components/sidebar-logo';

describe('SidebarLogo', () => {
  /**
   * TEST CASE: VISIBLE LABEL
   * Ensures 'Loop' is visible when showLabel is TRUE.
   * This affects the desktop expanded view.
   */
  it('renders the Loop logo text when showLabel is true', () => {
    render(<SidebarLogo showLabel={true} />);

    // ASSERT: We expect the visual text 'Loop' to be in the DOM
    expect(screen.getByText('Loop')).toBeInTheDocument();
  });

  /**
   * TEST CASE: HIDDEN LABEL (Accessibility Only)
   * Ensures 'Loop' text is not rendered visually, but preserved for Screen Readers
   * via .sr-only classes when showLabel is FALSE (collapsed mode).
   */
  it('does not render the Loop logo text when showLabel is false', () => {
    render(<SidebarLogo showLabel={false} />);

    // We expect exactly ONE 'Loop' element, but it should be marked for accessibility only.
    const loopElements = screen.getAllByText('Loop');

    // ASSERT: Exactly one element found (the .sr-only span)
    expect(loopElements.length).toBe(1);
  });
});
