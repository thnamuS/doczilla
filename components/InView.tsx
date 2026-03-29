"use client";

import { useEffect, useRef, ReactNode } from "react";

interface InViewProps {
  children: ReactNode;
  animation?: "fade-in" | "fade-in-up" | "slide-in-up" | "scale-in";
  delay?: number;
  threshold?: number;
}

export default function InView({
  children,
  animation = "fade-in-up",
  delay = 0,
  threshold = 0.1,
}: InViewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          element.style.opacity = "0";
          element.style.transition = `opacity 0.6s ease-out, transform 0.6s ease-out`;
          element.style.transform =
            animation === "scale-in"
              ? "scale(0.95)"
              : animation === "fade-in-up" || animation === "slide-in-up"
                ? "translateY(20px)"
                : "none";

          setTimeout(() => {
            element.style.opacity = "1";
            element.style.transform = "none";
          }, delay);

          observer.unobserve(element);
        }
      },
      { threshold },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [animation, delay, threshold]);

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
