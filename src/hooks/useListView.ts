import { useState, useEffect } from "react";

export type ViewMode = "card" | "table" | "responsive";

export function useListView(defaultMode: ViewMode = "responsive") {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };

    // Initial check
    checkIsDesktop();

    // Add resize listener
    window.addEventListener("resize", checkIsDesktop);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  const currentView =
    viewMode === "responsive" ? (isDesktop ? "table" : "card") : viewMode;

  return {
    viewMode,
    setViewMode,
    currentView,
    isDesktop,
  };
}
