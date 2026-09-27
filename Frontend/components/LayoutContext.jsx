"use client";
import { createContext, useContext, useState } from "react";
import { usePathname } from "@/i18n/navigation";

const LayoutModeContext = createContext({
  isMinimalistMode: false,
  setIsMinimalistMode: () => {},
});

export function LayoutModeProvider({ children }) {
  const [isMinimalistMode, setIsMinimalistMode] = useState(false);
  const pathname = usePathname();

  // Leaving the visualizer pages turns full-screen mode off. Adjusting state while rendering (instead of
  // in an effect) avoids a second render with the stale value.
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (pathname !== '/embedding' && pathname !== '/vector-playground') setIsMinimalistMode(false);
  }

  return (
    <LayoutModeContext.Provider value={{ isMinimalistMode, setIsMinimalistMode }}>
      {children}
    </LayoutModeContext.Provider>
  );
}

export function useLayoutMode() {
  return useContext(LayoutModeContext);
}

