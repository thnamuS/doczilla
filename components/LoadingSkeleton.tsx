"use client";

export function CardSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="skeleton-loader h-4 w-3/4"></div>
      <div className="skeleton-loader h-4 w-1/2"></div>
      <div className="skeleton-loader h-12 w-full"></div>
    </div>
  );
}

export function DocumentListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-loader h-20 w-full"></div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-linear-to-r from-primary/10 to-secondary/10 py-20 flex items-center justify-center">
      <div className="max-w-2xl w-full px-4 space-y-6 animate-pulse">
        <div className="skeleton-loader h-16 w-3/4 mx-auto"></div>
        <div className="skeleton-loader h-8 w-full"></div>
        <div className="skeleton-loader h-8 w-5/6 mx-auto"></div>
        <div className="skeleton-loader h-12 w-1/3 mx-auto"></div>
      </div>
    </div>
  );
}
