"use client";

import { useEffect, useRef } from "react";

interface UseScrollRevealOptions {
  threshold?: number;
  staggerSelector?: string;
  staggerDelay?: number;
}

/**
 * Attaches an IntersectionObserver to a container ref.
 * When the container enters the viewport, it adds the `visible` class
 * (which triggers the CSS `.reveal.visible` transition defined in globals.css).
 *
 * Optionally, it also staggers the opacity/transform animation of child
 * elements matching `staggerSelector`.
 *
 * @example
 * const ref = useScrollReveal({ staggerSelector: '.feature-card' });
 * <div ref={ref} className="... reveal"> ... </div>
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  options: UseScrollRevealOptions = {},
) {
  const {
    threshold = 0.15,
    staggerSelector,
    staggerDelay = 100,
  } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          // Trigger the parent reveal transition
          entry.target.classList.add("visible");

          // Stagger children
          if (staggerSelector) {
            const children =
              entry.target.querySelectorAll<HTMLElement>(staggerSelector);
            children.forEach((child, i) => {
              child.style.opacity = "0";
              child.style.transform = "translateY(16px)";
              child.style.transition = "opacity 0.5s ease, transform 0.5s ease";
              setTimeout(
                () => {
                  child.style.opacity = "1";
                  child.style.transform = "none";
                },
                staggerDelay + i * staggerDelay,
              );
            });
          }

          // Unobserve after triggering — animation should only fire once
          observer.unobserve(entry.target);
        });
      },
      { threshold },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold, staggerSelector, staggerDelay]);

  return ref;
}
