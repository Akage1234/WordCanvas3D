"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const LayoutModeContext = createContext({
  isMinimalistMode: false,
  setIsMinimalistMode: () => {},
});

export function LayoutModeProvider({ children }) {
  const [isMinimalistMode, setIsMinimalistMode] = useState(false);
  const pathname = usePathname();

  // Reset minimalist mode when navigating away from visualizer pages
  useEffect(() => {
    const isVisualizerPage = pathname === '/embedding' || pathname === '/vector-playground';
    if (!isVisualizerPage && isMinimalistMode) {
      setIsMinimalistMode(false);
    }
  }, [pathname, isMinimalistMode]);

  return (
    <LayoutModeContext.Provider value={{ isMinimalistMode, setIsMinimalistMode }}>
      {children}
    </LayoutModeContext.Provider>
  );
}

export function useLayoutMode() {
  return useContext(LayoutModeContext);
}

