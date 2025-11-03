'use client';
import { LayoutModeProvider } from '@/components/LayoutContext';

export function LayoutProvider({ children }) {
  return <LayoutModeProvider>{children}</LayoutModeProvider>;
}

