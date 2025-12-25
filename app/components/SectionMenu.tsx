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
    const [activeSection, setActiveSection] = useState<string>(sections[0].id);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resetIdleTimer = () => {
        setIsVisible(true);

        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }

        idleTimerRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 3000);
    };

    useEffect(() => {
        const handleActivity = () => resetIdleTimer();

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        // Initial timer
        resetIdleTimer();

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-45% 0px -45% 0px',
                threshold: 0,
            }
        );

        sections.forEach(section => {
            const el = document.getElementById(section.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;

        const headerOffset = 80;
        const y =
            el.getBoundingClientRect().top +
            window.pageYOffset -
            headerOffset;

        window.scrollTo({
            top: y,
            behavior: 'smooth',
        });
    };

    const activeIndex = sections.findIndex(
        s => s.id === activeSection
    );

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.nav
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 20,
                    }}
                    className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden xl:block"
                    onMouseEnter={() => {
                        setIsVisible(true);
                        if (idleTimerRef.current) {
                            clearTimeout(idleTimerRef.current);
                        }
                    }}
                    onMouseLeave={resetIdleTimer}
                >
                    <motion.div
                        ref={containerRef}
                        className="relative w-48 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.08)] p-3"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        {/* Sliding indicator */}
                        <motion.span
                            className="absolute left-2 w-[2px] h-6 rounded-full bg-indigo-500"
                            animate={{
                                top: 12 + activeIndex * 44,
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 30,
                            }}
                        />

                        {/* Menu items */}
                        <ul className="relative flex flex-col space-y-1">
                            {sections.map((section, index) => {
                                const isActive = activeSection === section.id;

                                return (
                                    <motion.li
                                        key={section.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            delay: index * 0.05,
                                            type: 'spring',
                                            stiffness: 260,
                                            damping: 20,
                                        }}
                                    >
                                        <motion.button
                                            onClick={() => scrollToSection(section.id)}
                                            aria-current={isActive ? 'true' : undefined}
                                            className={`group relative w-full px-5 py-2.5 text-sm font-medium text-left rounded-lg transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-zinc-600 hover:text-zinc-900'} hover:bg-zinc-100/60`}
                                            whileHover={{ x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 17,
                                            }}
                                        >
                                            <span className="tracking-tight">
                                                {section.label}
                                            </span>
                                        </motion.button>
                                    </motion.li>
                                );
                            })}
                        </ul>

                        {/* Bottom progress dots */}
                        <motion.div
                            className="mt-4 pt-3 border-t border-zinc-200"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex justify-center gap-1.5">
                                {sections.map((section) => {
                                    const isActive = activeSection === section.id;

                                    return (
                                        <motion.button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            aria-label={`Go to ${section.label}`}
                                            className={`h-1.5 rounded-full transition-colors duration-300 ${isActive ? 'bg-indigo-500' : 'bg-zinc-300 hover:bg-zinc-400'}`}
                                            animate={{
                                                width: isActive ? 24 : 6,
                                            }}
                                            whileHover={{ scale: 1.2 }}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 20,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.nav>
            )}
        </AnimatePresence>
    );
}
