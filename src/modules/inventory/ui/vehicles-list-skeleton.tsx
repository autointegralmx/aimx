export function VehiclesListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando vehículos">
      <div className="h-40 animate-pulse rounded-md border border-line bg-surface" />
      <div className="hidden space-y-2 md:block">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-md border border-line bg-surface"
          />
        ))}
      </div>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-md border border-line bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
