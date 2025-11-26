export function DragRegion() {
  return (
    <div
      className="fixed top-0 left-0 right-0 h-16 z-40"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    />
  );
}

