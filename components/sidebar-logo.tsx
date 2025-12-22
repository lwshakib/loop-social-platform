import Link from "next/link";

type SidebarLogoProps = {
  showLabel?: boolean;
  className?: string;
};

export const SidebarLogo = ({
  showLabel = true,
  className = "",
}: SidebarLogoProps) => (
  <Link
    href="/"
    className={`flex items-center gap-1.5 ${className}`}
    aria-label="Go to home"
  >
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-4 border-primary/70 bg-transparent">
      <span className="h-1 w-1 rounded-full bg-transparent" />
    </span>
    {showLabel ? (
      <h1 className="text-2xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        Loop
      </h1>
    ) : (
      <span className="sr-only">Loop</span>
    )}
  </Link>
);
