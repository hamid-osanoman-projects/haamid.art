'use client';

import React, { createContext, useContext } from 'react';

interface TrackerContextType {
  xp: number;
  level: string;
  unlockedAchievements: string[];
  triggerCustomAction: (actionType: string, details?: any) => Promise<void>;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export default function TrackerProvider({ children }: { children: React.ReactNode }) {
  // Return a dummy context provider so existing calls to useTracker() do not crash.
  // All gamification and notification UI has been completely removed.
  return (
    <TrackerContext.Provider value={{ 
      xp: 0, 
      level: '', 
      unlockedAchievements: [], 
      triggerCustomAction: async () => {} 
    }}>
      {children}
    </TrackerContext.Provider>
  );
}

export function useTracker() {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be defined inside TrackerProvider');
  }
  return context;
}
