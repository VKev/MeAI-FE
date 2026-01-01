import { useEffect, useRef, useState, useCallback } from 'react';

export interface Section {
  id: string;
  label: string;
}

export interface UseSectionMenuOptions {
  sections: Section[];
  idleTime?: number;
  rootMargin?: string;
}

export interface UseSectionMenuReturn {
  activeSection: string;
  isVisible: boolean;
  scrollToSection: (id: string) => void;
}

export function useSectionMenu({
  sections,
  idleTime = 3000,
  rootMargin = '-40% 0px -40% 0px',
}: UseSectionMenuOptions): UseSectionMenuReturn {
  const [activeSection, setActiveSection] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    setIsVisible(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, idleTime);
  }, [idleTime]);

  const handleActivity = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerHeight = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    // Set up activity listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // Initial timer
    resetIdleTimer();

    // Intersection Observer for active section tracking
    const observerOptions = {
      root: null,
      rootMargin,
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      observer.disconnect();
    };
  }, [sections, rootMargin, handleActivity, resetIdleTimer]);

  return {
    activeSection,
    isVisible,
    scrollToSection,
  };
}
