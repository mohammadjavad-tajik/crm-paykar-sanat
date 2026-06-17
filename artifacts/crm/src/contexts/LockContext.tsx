import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useGetSettings } from '@workspace/api-client-react';

interface LockState {
  isLocked: boolean;
  lastActivity: number;
}

interface LockContextType {
  isLocked: boolean;
  unlock: () => void;
  lock: () => void;
}

const LockContext = createContext<LockContextType | undefined>(undefined);

export function LockProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: settings } = useGetSettings();
  
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const stored = localStorage.getItem('crm_lock_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LockState;
        return parsed.isLocked;
      } catch (e) {}
    }
    return false;
  });

  const [lastActivity, setLastActivity] = useState<number>(() => {
    const stored = localStorage.getItem('crm_lock_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LockState;
        return parsed.lastActivity;
      } catch (e) {}
    }
    return Date.now();
  });

  const lock = useCallback(() => {
    setIsLocked(true);
    setLocation('/lock');
  }, [setLocation]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    setLastActivity(Date.now());
  }, []);

  // Update local storage on state changes
  useEffect(() => {
    localStorage.setItem('crm_lock_state', JSON.stringify({ isLocked, lastActivity }));
  }, [isLocked, lastActivity]);

  // Activity tracking
  useEffect(() => {
    const handleActivity = () => {
      if (!isLocked) {
        setLastActivity(Date.now());
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [isLocked]);

  // Idle timer
  useEffect(() => {
    if (!settings?.pin_hash || !settings?.auto_lock_minutes || isLocked) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivity;
      if (idleTime > settings.auto_lock_minutes! * 60000) {
        lock();
      }
    }, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [lastActivity, settings?.pin_hash, settings?.auto_lock_minutes, isLocked, lock]);

  // Initial mount check
  useEffect(() => {
    if (settings?.pin_hash && isLocked && location !== '/lock') {
      setLocation('/lock');
    }
  }, [settings?.pin_hash, isLocked, location, setLocation]);

  return (
    <LockContext.Provider value={{ isLocked, unlock, lock }}>
      {children}
    </LockContext.Provider>
  );
}

export function useLock() {
  const context = useContext(LockContext);
  if (context === undefined) {
    throw new Error('useLock must be used within a LockProvider');
  }
  return context;
}
