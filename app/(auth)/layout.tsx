export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-screen w-full bg-[#0a0a0a]">{children}</main>;
}
