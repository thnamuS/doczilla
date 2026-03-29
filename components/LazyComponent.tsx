import { Suspense, ReactNode } from "react";

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function LazyComponent({
  children,
  fallback = (
    <div className="flex justify-center items-center p-8">
      <div className="skeleton-loader w-full h-32"></div>
    </div>
  ),
}: LazyComponentProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
