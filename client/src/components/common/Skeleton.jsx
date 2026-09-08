export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-ink-200/70 p-5">
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-5 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
