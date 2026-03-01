/**
 * AuthLayout Component
 * A wrapper layout specifically for authentication-related pages (Login, Sign-up, etc.).
 * It ensures a consistent background and full-screen height for all child auth components.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // Wraps the entire content in a container with full-screen height and the theme's background color
    <div className="min-h-screen w-full bg-background">{children}</div>
  );
}
