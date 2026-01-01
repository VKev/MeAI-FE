import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Section {
    id: string;
    label: string;
}

const sections: Section[] = [
    { id: 'features', label: 'Features' },
    { id: 'workflow', label: 'How It Works' },
    { id: 'use-cases', label: 'Use Cases' },
    { id: 'feedbacks', label: 'Testimonials' },
];

export function SectionMenu() {
    const [activeSection, setActiveSection] = useState<string>('');
    const [isVisible, setIsVisible] = useState(true);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const IDLE_TIME = 3000; // 3 seconds

    const resetIdleTimer = () => {
        setIsVisible(true);
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }
        idleTimerRef.current = setTimeout(() => {
            setIsVisible(false);
        }, IDLE_TIME);
    };

    const handleActivity = () => resetIdleTimer();

    useEffect(() => {
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('keydown', handleActivity);

        resetIdleTimer();

        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
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
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const headerHeight = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3 }}
                    className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden lg:block"
                >
                    <nav className="flex flex-col gap-3 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className="group relative flex items-center gap-3"
                                aria-label={`Go to ${section.label}`}
                            >
                                {/* Dot indicator */}
                                <div
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${activeSection === section.id
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 scale-125'
                                        : 'bg-gray-300 group-hover:bg-gray-400'
                                        }`}
                                />

                                {/* Label tooltip */}
                                <span
                                    className={`absolute right-full mr-4 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${activeSection === section.id
                                        ? 'opacity-100 translate-x-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                        : 'opacity-0 translate-x-2 bg-gray-800 text-white group-hover:opacity-100 group-hover:translate-x-0'
                                        }`}
                                >
                                    {section.label}
                                </span>
                            </button>
                        ))}
                    </nav>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
