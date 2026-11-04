'use client';

import { createContext, useContext, type ReactNode } from 'react';

const SystemVoiceOnly = createContext(false);

export function SystemVoiceProvider({ children }: { children: ReactNode }) {
  return <SystemVoiceOnly.Provider value>{children}</SystemVoiceOnly.Provider>;
}

export function useSystemVoiceOnly() {
  return useContext(SystemVoiceOnly);
}
