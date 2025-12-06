export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="max-w-lg mx-auto w-full h-screen flex items-center justify-center">
      {children}
    </main>
  );
}   